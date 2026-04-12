import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBoardStore } from "./boardStore";

let uuidSeq = 0;

beforeEach(async () => {
  uuidSeq = 0;
  vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => {
    uuidSeq += 1;
    return `10000000-1000-4000-8000-${String(uuidSeq).padStart(12, "0")}`;
  });
  localStorage.removeItem("kanban-storage");
  await useBoardStore.persist.rehydrate();
  useBoardStore.setState({ columns: [], tasks: [] });
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.removeItem("kanban-storage");
});

describe("useBoardStore", () => {
  it("addColumn appends a column with a string id", () => {
    useBoardStore.getState().addColumn("Todo");
    const { columns } = useBoardStore.getState();
    expect(columns).toHaveLength(1);
    expect(columns[0].title).toBe("Todo");
    expect(typeof columns[0].id).toBe("string");
    expect(columns[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("addTask appends a task and normalizes sortOrder within the column", () => {
    useBoardStore.getState().addColumn("Doing");
    const colId = useBoardStore.getState().columns[0].id;
    useBoardStore.getState().addTask(colId, "First");
    useBoardStore.getState().addTask(colId, "Second");
    const { tasks } = useBoardStore.getState();
    expect(tasks).toHaveLength(2);
    expect(tasks.every((t) => t.columnId === colId)).toBe(true);
    expect(tasks.map((t) => t.sortOrder)).toEqual([0, 1]);
    expect(tasks.map((t) => t.content)).toEqual(["First", "Second"]);
  });

  it("updateTask changes content and keeps sortOrder", () => {
    useBoardStore.getState().addColumn("Col");
    const colId = useBoardStore.getState().columns[0].id;
    useBoardStore.getState().addTask(colId, "Old");
    const taskId = useBoardStore.getState().tasks[0].id;
    const sortBefore = useBoardStore.getState().tasks[0].sortOrder;
    useBoardStore.getState().updateTask(taskId, "New");
    const task = useBoardStore.getState().tasks.find((t) => t.id === taskId);
    expect(task?.content).toBe("New");
    expect(task?.sortOrder).toBe(sortBefore);
  });

  it("deleteTask removes the task and compacts sortOrder", () => {
    useBoardStore.getState().addColumn("Col");
    const colId = useBoardStore.getState().columns[0].id;
    useBoardStore.getState().addTask(colId, "A");
    useBoardStore.getState().addTask(colId, "B");
    useBoardStore.getState().addTask(colId, "C");
    const midId = useBoardStore.getState().tasks[1].id;
    useBoardStore.getState().deleteTask(midId);
    const { tasks } = useBoardStore.getState();
    expect(tasks).toHaveLength(2);
    expect(tasks.map((t) => t.sortOrder)).toEqual([0, 1]);
  });

  it("deleteColumn removes the column and its tasks", () => {
    useBoardStore.getState().addColumn("A");
    useBoardStore.getState().addColumn("B");
    const [idA] = useBoardStore.getState().columns.map((c) => c.id);
    useBoardStore.getState().addTask(idA, "only in A");
    useBoardStore.getState().deleteColumn(idA);
    const { columns, tasks } = useBoardStore.getState();
    expect(columns).toHaveLength(1);
    expect(tasks).toHaveLength(0);
  });

  it("renameColumn updates the title", () => {
    useBoardStore.getState().addColumn("Old");
    const id = useBoardStore.getState().columns[0].id;
    useBoardStore.getState().renameColumn(id, "New");
    expect(useBoardStore.getState().columns[0].title).toBe("New");
  });

  it("moveColumn shifts position and no-ops at the start edge", () => {
    useBoardStore.getState().addColumn("A");
    useBoardStore.getState().addColumn("B");
    useBoardStore.getState().addColumn("C");
    const ids = useBoardStore.getState().columns.map((c) => c.id);
    useBoardStore.getState().moveColumn(ids[0], -1);
    expect(useBoardStore.getState().columns.map((c) => c.id)).toEqual(ids);
    useBoardStore.getState().moveColumn(ids[2], 1);
    expect(useBoardStore.getState().columns.map((c) => c.id)).toEqual(ids);
    useBoardStore.getState().moveColumn(ids[2], -1);
    const order = useBoardStore.getState().columns.map((c) => c.id);
    expect(order).toEqual([ids[0], ids[2], ids[1]]);
  });

  it("setTasks reapplies sortOrder from flat array order", () => {
    useBoardStore.getState().setColumns([
      { id: "c1", title: "One" },
      { id: "c2", title: "Two" },
    ]);
    useBoardStore.getState().setTasks([
      {
        id: "t1",
        columnId: "c1",
        content: "a",
        sortOrder: 99,
      },
      {
        id: "t2",
        columnId: "c2",
        content: "b",
        sortOrder: 99,
      },
      {
        id: "t3",
        columnId: "c1",
        content: "c",
        sortOrder: 99,
      },
    ]);
    const { tasks } = useBoardStore.getState();
    expect(tasks.find((t) => t.id === "t1")?.sortOrder).toBe(0);
    expect(tasks.find((t) => t.id === "t2")?.sortOrder).toBe(0);
    expect(tasks.find((t) => t.id === "t3")?.sortOrder).toBe(1);
  });
});
