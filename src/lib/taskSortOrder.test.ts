import { arrayMove } from "@dnd-kit/sortable";
import { describe, expect, it } from "vitest";
import type { Task } from "../types";
import { sortTasksForColumn, withSyncedSortOrders } from "./taskSortOrder";

describe("withSyncedSortOrders", () => {
  it("normalizes id and columnId to strings (legacy numeric persistence)", () => {
    const tasks = [
      {
        id: 9001,
        columnId: 42,
        content: "legacy",
        sortOrder: 0,
      },
    ] as Task[];
    const synced = withSyncedSortOrders(tasks);
    expect(synced[0].id).toBe("9001");
    expect(synced[0].columnId).toBe("42");
  });

  it("assigns contiguous sortOrder per column from flat array order", () => {
    const colA = "col-a";
    const colB = "col-b";
    const tasks: Task[] = [
      { id: "t1", columnId: colA, content: "a1", sortOrder: 99 },
      { id: "t2", columnId: colB, content: "b1", sortOrder: 99 },
      { id: "t3", columnId: colA, content: "a2", sortOrder: 99 },
    ];
    const synced = withSyncedSortOrders(tasks);
    expect(synced[0].sortOrder).toBe(0);
    expect(synced[1].sortOrder).toBe(0);
    expect(synced[2].sortOrder).toBe(1);
  });
});

describe("sortTasksForColumn", () => {
  it("returns tasks for a column sorted by sortOrder", () => {
    const col = "c1";
    const tasks: Task[] = [
      { id: "x", columnId: col, content: "last", sortOrder: 2 },
      { id: "y", columnId: col, content: "first", sortOrder: 0 },
      { id: "z", columnId: "other", content: "skip", sortOrder: 0 },
    ];
    const sorted = sortTasksForColumn(tasks, col);
    expect(sorted.map((t) => t.id)).toEqual(["y", "x"]);
  });

  it("matches column id when task uses number and query uses string (or reverse)", () => {
    const tasks: Task[] = [
      { id: "a", columnId: 10, content: "n", sortOrder: 0 },
      { id: "b", columnId: "10", content: "s", sortOrder: 1 },
    ];
    expect(sortTasksForColumn(tasks, 10).map((t) => t.id)).toEqual(["a", "b"]);
    expect(sortTasksForColumn(tasks, "10").map((t) => t.id)).toEqual(["a", "b"]);
  });
});

describe("drag-style reorder (arrayMove + withSyncedSortOrders)", () => {
  it("reindexes sortOrder after reordering within the same column", () => {
    const col = "c1";
    const tasks: Task[] = [
      { id: "a", columnId: col, content: "1", sortOrder: 0 },
      { id: "b", columnId: col, content: "2", sortOrder: 1 },
      { id: "c", columnId: col, content: "3", sortOrder: 2 },
    ];
    const moved = arrayMove(tasks, 0, 2);
    const synced = withSyncedSortOrders(moved);
    expect(synced.map((t) => t.id)).toEqual(["b", "c", "a"]);
    expect(synced.map((t) => t.sortOrder)).toEqual([0, 1, 2]);
  });

  it("preserves per-column order when interleaving matches cross-column drag", () => {
    const c1 = "c1";
    const c2 = "c2";
    const tasks: Task[] = [
      { id: "a", columnId: c1, content: "a", sortOrder: 0 },
      { id: "b", columnId: c2, content: "b", sortOrder: 0 },
      { id: "c", columnId: c1, content: "c", sortOrder: 1 },
    ];
    const activeIndex = tasks.findIndex((t) => t.id === "c");
    const overIndex = tasks.findIndex((t) => t.id === "b");
    const next = [...tasks];
    next[activeIndex] = { ...next[activeIndex], columnId: c2 };
    const moved = arrayMove(next, activeIndex, overIndex);
    const synced = withSyncedSortOrders(moved);
    const col1 = sortTasksForColumn(synced, c1);
    const col2 = sortTasksForColumn(synced, c2);
    expect(col1.map((t) => t.id)).toEqual(["a"]);
    expect(col2.map((t) => t.id)).toEqual(["c", "b"]);
    expect(col2.map((t) => t.sortOrder)).toEqual([0, 1]);
  });
});
