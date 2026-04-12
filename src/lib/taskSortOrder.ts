import type { Id, Task } from "../types";

/**
 * Assigns `sortOrder` per column from left-to-right order in the flat `tasks`
 * array (first occurrence in a column is 0, next is 1, …).
 */
export function withSyncedSortOrders(tasks: Task[]): Task[] {
  const nextByColumn = new Map<string, number>();
  return tasks.map((task) => {
    const key = String(task.columnId);
    const order = nextByColumn.get(key) ?? 0;
    nextByColumn.set(key, order + 1);
    return {
      ...task,
      id: String(task.id),
      columnId: key,
      sortOrder: order,
    };
  });
}

export function sortTasksForColumn(tasks: Task[], columnId: Id): Task[] {
  const col = String(columnId);
  return tasks
    .filter((t) => String(t.columnId) === col)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
