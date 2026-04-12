import { arrayMove } from "@dnd-kit/sortable";
import { create } from "zustand";
import { persist } from "zustand/middleware";
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

const generateId = () => Math.floor(Math.random() * 10000001);

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
        set((state) => ({
          columns: state.columns.filter((col) => col.id !== id),
          tasks: state.tasks.filter((task) => task.columnId !== id),
        })),

      renameColumn: (id, title) =>
        set((state) => ({
          columns: state.columns.map((col) =>
            col.id === id ? { ...col, title } : col,
          ),
        })),

      moveColumn: (id, direction) =>
        set((state) => {
          const index = state.columns.findIndex((col) => col.id === id);
          const nextIndex = index + direction;
          if (
            index < 0 ||
            nextIndex < 0 ||
            nextIndex >= state.columns.length
          ) {
            return state;
          }
          return {
            columns: arrayMove(state.columns, index, nextIndex),
          };
        }),

      addTask: (columnId, content) =>
        set((state) => ({
          tasks: [...state.tasks, { id: generateId(), columnId, content }],
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),

      updateTask: (id, content) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, content } : task,
          ),
        })),

      setColumns: (columns) => set({ columns }),
      setTasks: (tasks) => set({ tasks }),
    }),
    {
      name: "kanban-storage", // The key used in localStorage
    },
  ),
);
