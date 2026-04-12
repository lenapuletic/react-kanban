import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { Column, Task } from "../types";
import { TaskCard } from "./TaskCard";
import { TextInputDialog } from "./TextInputDialog";
import { useBoardStore } from "../store/boardStore";
import { SortableContext } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";

interface Props {
  column: Column;
  tasks: Task[];
}

export function ColumnContainer({ column, tasks }: Props) {
  const columns = useBoardStore((s) => s.columns);
  const deleteColumn = useBoardStore((s) => s.deleteColumn);
  const addTask = useBoardStore((s) => s.addTask);
  const renameColumn = useBoardStore((s) => s.renameColumn);
  const moveColumn = useBoardStore((s) => s.moveColumn);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  const columnIndex = columns.findIndex((c) => c.id === column.id);
  const canMoveLeft = columnIndex > 0;
  const canMoveRight = columnIndex >= 0 && columnIndex < columns.length - 1;

  // Register the column as a valid drop zone
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  // Extract just the IDs for the SortableContext
  const taskIds = tasks.map((task) => task.id);

  return (
    <div className="bg-neutral-900 w-[350px] h-[500px] max-h-[500px] rounded-xl flex flex-col border border-neutral-700 shadow-md">
      {/* Header */}
      <div className="bg-neutral-800 text-md min-h-[60px] rounded-t-xl px-2 py-2 font-bold border-b border-neutral-700 flex items-center gap-1">
        <button
          type="button"
          disabled={!canMoveLeft}
          onClick={() => moveColumn(column.id, -1)}
          className="text-neutral-500 hover:text-blue-400 disabled:opacity-25 disabled:pointer-events-none rounded p-1 shrink-0"
          aria-label="Move column left"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex justify-center items-center bg-neutral-900 px-2 py-1 text-sm rounded-full shrink-0">
          {tasks.length}
        </div>
        <span
          className="flex-1 min-w-0 truncate text-left font-bold cursor-default pl-1"
          title={column.title}
          onDoubleClick={() => setRenameDialogOpen(true)}
        >
          {column.title}
        </span>
        <button
          type="button"
          disabled={!canMoveRight}
          onClick={() => moveColumn(column.id, 1)}
          className="text-neutral-500 hover:text-blue-400 disabled:opacity-25 disabled:pointer-events-none rounded p-1 shrink-0"
          aria-label="Move column right"
        >
          <ChevronRight size={22} />
        </button>
        <button
          type="button"
          onClick={() => setRenameDialogOpen(true)}
          className="text-neutral-500 hover:text-blue-400 rounded p-1 shrink-0"
          aria-label="Rename column"
        >
          <Pencil size={18} />
        </button>
        <button
          type="button"
          onClick={() => deleteColumn(column.id)}
          className="text-neutral-500 hover:text-red-400 rounded p-1 shrink-0"
          aria-label="Delete column"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Task List (The Drop Zone) */}
      <div
        className="flex flex-grow flex-col gap-4 p-2 overflow-x-hidden overflow-y-auto"
        ref={setNodeRef}
      >
        <SortableContext items={taskIds}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>

      {/* Footer */}
      <button
        type="button"
        onClick={() => setTaskDialogOpen(true)}
        className="flex gap-2 items-center border-neutral-700 border-2 rounded-md p-4 border-x-neutral-700 hover:bg-neutral-800 hover:text-blue-500 active:bg-black m-2 transition-colors"
      >
        <Plus size={20} />
        Add Task
      </button>

      <TextInputDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        heading="Add task"
        inputLabel="Task description"
        placeholder="What needs to be done?"
        submitLabel="Add task"
        onConfirm={(content) => addTask(column.id, content)}
      />

      <TextInputDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        heading="Rename column"
        inputLabel="Column title"
        placeholder="Column name"
        submitLabel="Save"
        initialValue={column.title}
        onConfirm={(title) => renameColumn(column.id, title)}
      />
    </div>
  );
}
