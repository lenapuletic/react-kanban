import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Task } from "../types";
import { useBoardStore } from "../store/boardStore";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TextInputDialog } from "./TextInputDialog";

interface Props {
  task: Task;
}

/** Static card for `DragOverlay` — avoids a second `useSortable` with the same task id. */
export function TaskCardPreview({ task }: { task: Task }) {
  return (
    <div className="bg-neutral-800 p-4 rounded-xl shadow-md border border-blue-500 cursor-grabbing">
      <p className="text-neutral-200 whitespace-pre-wrap">{task.content}</p>
    </div>
  );
}

export function TaskCard({ task }: Props) {
  const deleteTask = useBoardStore((state) => state.deleteTask);
  const updateTask = useBoardStore((state) => state.updateTask);
  const [editOpen, setEditOpen] = useState(false);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const openEdit = () => setEditOpen(true);

  // If the card is currently being dragged, we render a placeholder silhouette
  // so the user knows where it will land.
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-neutral-800/50 border-2 border-blue-500 rounded-xl p-4 h-[74px] opacity-50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-neutral-800 p-4 rounded-xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing relative group flex items-start justify-between gap-2 border border-neutral-700 hover:border-blue-500 transition-colors"
    >
      <p
        className="text-neutral-200 whitespace-pre-wrap flex-1 min-w-0 pr-1"
        onDoubleClick={(e) => {
          e.stopPropagation();
          openEdit();
        }}
      >
        {task.content}
      </p>

      <div
        className="flex shrink-0 items-start gap-0.5"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={openEdit}
          className="text-neutral-500 hover:text-blue-400 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Edit task"
        >
          <Pencil size={18} />
        </button>
        <button
          type="button"
          onClick={() => deleteTask(task.id)}
          className="text-neutral-500 hover:text-red-400 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete task"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <TextInputDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        heading="Edit task"
        inputLabel="Task description"
        placeholder="What needs to be done?"
        submitLabel="Save"
        initialValue={task.content}
        onConfirm={(content) => updateTask(task.id, content)}
      />
    </div>
  );
}
