import { Trash2 } from "lucide-react";
import type { Task } from "../types";
import { useBoardStore } from "../store/boardStore";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  task: Task;
}

export function TaskCard({ task }: Props) {
  const deleteTask = useBoardStore((state) => state.deleteTask);

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
      className="bg-neutral-800 p-4 rounded-xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing relative group flex items-start justify-between border border-neutral-700 hover:border-blue-500 transition-colors"
    >
      <p className="text-neutral-200 whitespace-pre-wrap">{task.content}</p>

      <button
        onClick={() => deleteTask(task.id)}
        className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
