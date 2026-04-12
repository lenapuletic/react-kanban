import { useRef, useState } from "react";
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
import { sortTasksForColumn } from "./lib/taskSortOrder";
import type { Task } from "./types";
import { TaskCardPreview } from "./components/TaskCard";
import { TextInputDialog } from "./components/TextInputDialog";

function App() {
  const { columns, tasks, addColumn, setTasks } = useBoardStore();

  // State to track exactly which task is currently flying around the screen
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const dragSourceColumnIdRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
  );

  // Fires the moment you click and drag a task
  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Task") {
      const task = event.active.data.current.task as Task;
      setActiveTask(task);
      dragSourceColumnIdRef.current = String(task.columnId);
    }
  };

  const onDragCancel = () => {
    setActiveTask(null);
    dragSourceColumnIdRef.current = null;
  };

  // Fires when you drop the task
  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null); // Clear the floating task

    const sourceCol = dragSourceColumnIdRef.current;
    dragSourceColumnIdRef.current = null;

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Same-column reorder only: cross-column moves are committed in onDragOver.
    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";

    if (isActiveTask && isOverTask && sourceCol != null) {
      const activeIndex = tasks.findIndex(
        (t) => String(t.id) === String(activeId),
      );
      const overIndex = tasks.findIndex((t) => String(t.id) === String(overId));
      if (activeIndex === -1 || overIndex === -1) return;

      const activeRow = tasks[activeIndex];
      const overRow = tasks[overIndex];
      const stillInSourceColumn = String(activeRow.columnId) === sourceCol;
      const sameColumn =
        String(activeRow.columnId) === String(overRow.columnId);

      if (sameColumn && stillInSourceColumn) {
        setTasks(arrayMove(tasks, activeIndex, overIndex));
      }
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
      const activeIndex = tasks.findIndex(
        (t) => String(t.id) === String(activeId),
      );
      const overIndex = tasks.findIndex((t) => String(t.id) === String(overId));
      if (activeIndex === -1 || overIndex === -1) return;

      if (
        String(tasks[activeIndex].columnId) !==
        String(tasks[overIndex].columnId)
      ) {
        const newTasks = [...tasks];
        newTasks[activeIndex].columnId = String(tasks[overIndex].columnId);
        setTasks(arrayMove(newTasks, activeIndex, overIndex));
      }
    }

    // Dropping a task into an entirely empty column
    if (isActiveTask && isOverColumn) {
      const activeIndex = tasks.findIndex(
        (t) => String(t.id) === String(activeId),
      );
      if (activeIndex === -1) return;

      const newTasks = [...tasks];
      newTasks[activeIndex].columnId = String(overId);
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
          onDragCancel={onDragCancel}
        >
          <div className="m-auto flex gap-4 h-full items-center">
            <div className="flex gap-4">
              {columns.map((col) => {
                const columnTasks = sortTasksForColumn(tasks, col.id);
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
              type="button"
              onClick={() => setColumnDialogOpen(true)}
              className="h-[60px] w-[350px] min-w-[350px] cursor-pointer rounded-lg bg-neutral-900 border-2 border-neutral-700 p-4 ring-blue-500 hover:ring-2 flex gap-2 items-center transition-all shadow-sm"
            >
              <Plus size={24} />
              Add Column
            </button>
          </div>

          <DragOverlay>
            {activeTask ? <TaskCardPreview task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <TextInputDialog
        open={columnDialogOpen}
        onOpenChange={setColumnDialogOpen}
        heading="Add column"
        inputLabel="Column title"
        placeholder="e.g. In progress"
        submitLabel="Add column"
        onConfirm={(title) => addColumn(title)}
      />
    </div>
  );
}

export default App;
