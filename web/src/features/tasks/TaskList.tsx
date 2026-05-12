import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, createTask, updateTask, deleteTask } from "../../api/tasks";
import { Priority, Task } from "../../types/task";
import { TaskCard } from "./TaskCard";
import { TaskFilters } from "./TaskFilters";
import { TaskForm } from "./TaskForm";
import { QuickAddTask } from "./QuickAddTask";
import { Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export function TaskList() {
  const queryClient = useQueryClient();
  const [priority, setPriority] = useState<Priority>();
  const [status, setStatus] = useState<boolean>();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tasks", { priority, status, page }],
    queryFn: () => getTasks({ priority, status, page, page_size: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setIsFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, task }: { id: string; task: Partial<Task> }) =>
      updateTask(id, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setEditingTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const handleToggleStatus = (task: Task) => {
    updateMutation.mutate({ id: task.id, task: { status: !task.status } });
  };

  if (isError) {
    return (
      <div className="p-8 text-center border rounded-lg bg-destructive/5 text-destructive">
        <p>Failed to load tasks. Please try again.</p>
      </div>
    );
  }

  const tasks = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Your Tasks</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>
      <QuickAddTask />

      <TaskFilters
        priority={priority}
        status={status}
        onPriorityChange={(p) => {
          setPriority(p);
          setPage(1);
        }}
        onStatusChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        onReset={() => {
          setPriority(undefined);
          setStatus(undefined);
          setPage(1);
        }}
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>Loading your tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl text-muted-foreground gap-4">
          <p>No tasks found. Start by creating one!</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="text-primary hover:underline font-medium"
          >
            Create your first task
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleStatus={handleToggleStatus}
              onEdit={setEditingTask}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {(isFormOpen || editingTask) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card rounded-xl border shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold mb-2">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h2>
            <TaskForm
              initialData={editingTask || undefined}
              onSubmit={(task) => {
                if (editingTask) {
                  updateMutation.mutate({ id: editingTask.id, task });
                } else {
                  createMutation.mutate(task);
                }
              }}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingTask(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
