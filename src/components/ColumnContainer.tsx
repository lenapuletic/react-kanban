import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
  const { deleteColumn, addTask } = useBoardStore();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

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
      <div className="bg-neutral-800 text-md h-[60px] cursor-grab rounded-t-xl p-3 font-bold border-b border-neutral-700 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="flex justify-center items-center bg-neutral-900 px-2 py-1 text-sm rounded-full">
            {tasks.length}
          </div>
          {column.title}
        </div>
        <button
          onClick={() => deleteColumn(column.id)}
          className="text-neutral-500 hover:text-red-400 rounded px-1 py-2"
        >
          <Trash2 size={20} />
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
    </div>
  );
}
