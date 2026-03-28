import { useState } from "react";
import { Plus } from "lucide-react";
import { ColumnContainer } from "./components/ColumnContainer";
import { useBoardStore } from "./store/boardStore";
import {
  DndContext,
  type DragOverEvent,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Task } from "./types";
import { TaskCard } from "./components/TaskCard";

function App() {
  const { columns, tasks, addColumn, setTasks } = useBoardStore();

  // State to track exactly which task is currently flying around the screen
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
  );

  const handleAddColumn = () => {
    const title = window.prompt("Enter column title:");
    if (!title) return;
    addColumn(title);
  };

  // Fires the moment you click and drag a task
  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
    }
  };

  // Fires when you drop the task
  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null); // Clear the floating task

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // This handles reordering tasks within the SAME column when you let go
    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";

    if (isActiveTask && isOverTask) {
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const overIndex = tasks.findIndex((t) => t.id === overId);
      setTasks(arrayMove(tasks, activeIndex, overIndex));
    }
  };

  // This handles moving tasks across DIFFERENT columns while dragging
  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    // Moving a task over another task in a different column
    if (isActiveTask && isOverTask) {
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const overIndex = tasks.findIndex((t) => t.id === overId);

      if (tasks[activeIndex].columnId !== tasks[overIndex].columnId) {
        let newTasks = [...tasks];
        newTasks[activeIndex].columnId = tasks[overIndex].columnId;
        setTasks(arrayMove(newTasks, activeIndex, overIndex));
      }
    }

    // Dropping a task into an entirely empty column
    if (isActiveTask && isOverColumn) {
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const newTasks = [...tasks];
      newTasks[activeIndex].columnId = overId;
      setTasks(arrayMove(newTasks, activeIndex, activeIndex));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col">
      <header className="p-8 pl-[40px] w-full shrink-0">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Kanban <span className="text-blue-500">Board</span>
        </h1>
        <p className="text-neutral-400 mt-2 font-medium">
          Drag and drop tasks to manage your workflow
        </p>
      </header>

      <div className="flex-1 flex items-center overflow-x-auto overflow-y-hidden px-[40px] pb-10">
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="m-auto flex gap-4 h-full items-center">
            <div className="flex gap-4">
              {columns.map((col) => {
                const columnTasks = tasks.filter(
                  (task) => task.columnId === col.id,
                );
                return (
                  <ColumnContainer
                    key={col.id}
                    column={col}
                    tasks={columnTasks}
                  />
                );
              })}
            </div>

            <button
              onClick={handleAddColumn}
              className="h-[60px] w-[350px] min-w-[350px] cursor-pointer rounded-lg bg-neutral-900 border-2 border-neutral-700 p-4 ring-blue-500 hover:ring-2 flex gap-2 items-center transition-all shadow-sm"
            >
              <Plus size={24} />
              Add Column
            </button>
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

export default App;
