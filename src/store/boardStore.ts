import { arrayMove } from "@dnd-kit/sortable";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { withSyncedSortOrders } from "../lib/taskSortOrder";
import type { Column, Task, Id } from "../types";

interface BoardState {
  columns: Column[];
  tasks: Task[];

  // Actions
  addColumn: (title: string) => void;
  deleteColumn: (id: Id) => void;
  renameColumn: (id: Id, title: string) => void;
  moveColumn: (id: Id, direction: -1 | 1) => void;
  addTask: (columnId: Id, content: string) => void;
  deleteTask: (id: Id) => void;
  updateTask: (id: Id, content: string) => void;
  setColumns: (columns: Column[]) => void;
  setTasks: (tasks: Task[]) => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

const STORAGE_VERSION = 2;

type PersistedSlice = Pick<BoardState, "columns" | "tasks">;

function normalizePersistedSlice(
  slice: Partial<PersistedSlice> | undefined,
): PersistedSlice {
  const columns = (slice?.columns ?? []).map((c) => ({
    ...c,
    id: String(c.id),
  }));
  const rawTasks = (slice?.tasks ?? []) as Task[];
  return {
    columns,
    tasks: withSyncedSortOrders(rawTasks.map((t) => ({ ...t }))),
  };
}

function migratePersisted(
  oldState: unknown,
  _fromVersion: number,
): PersistedSlice {
  void _fromVersion;
  return normalizePersistedSlice(oldState as Partial<PersistedSlice>);
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set) => ({
      // Initial State
      columns: [],
      tasks: [],

      // Actions
      addColumn: (title) =>
        set((state) => ({
          columns: [...state.columns, { id: generateId(), title }],
        })),

      deleteColumn: (id) =>
        set((state) => {
          const sid = String(id);
          return {
            columns: state.columns.filter((col) => String(col.id) !== sid),
            tasks: state.tasks.filter((task) => String(task.columnId) !== sid),
          };
        }),

      renameColumn: (id, title) =>
        set((state) => ({
          columns: state.columns.map((col) =>
            String(col.id) === String(id) ? { ...col, title } : col,
          ),
        })),

      moveColumn: (id, direction) =>
        set((state) => {
          const index = state.columns.findIndex(
            (col) => String(col.id) === String(id),
          );
          const nextIndex = index + direction;
          if (index < 0 || nextIndex < 0 || nextIndex >= state.columns.length) {
            return state;
          }
          return {
            columns: arrayMove(state.columns, index, nextIndex),
          };
        }),

      addTask: (columnId, content) =>
        set((state) => ({
          tasks: withSyncedSortOrders([
            ...state.tasks,
            {
              id: generateId(),
              columnId,
              content,
              sortOrder: 0,
            },
          ]),
        })),

      deleteTask: (id) =>
        set((state) => {
          const sid = String(id);
          const next = state.tasks.filter((task) => String(task.id) !== sid);
          return { tasks: withSyncedSortOrders(next) };
        }),

      updateTask: (id, content) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            String(task.id) === String(id) ? { ...task, content } : task,
          ),
        })),

      setColumns: (columns) => set({ columns }),
      setTasks: (tasks) => set({ tasks: withSyncedSortOrders(tasks) }),
    }),
    {
      name: "kanban-storage",
      version: STORAGE_VERSION,
      migrate: migratePersisted,
      merge: (persistedState, currentState) => {
        const p = persistedState as Partial<PersistedSlice> | undefined;
        const normalized = normalizePersistedSlice(p);
        return {
          ...currentState,
          ...normalized,
        };
      },
    },
  ),
);
