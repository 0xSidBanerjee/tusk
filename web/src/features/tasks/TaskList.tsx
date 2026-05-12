import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, createTask, updateTask, deleteTask } from "../../api/tasks";
import { getLists } from "../../api/lists";
import { Priority, Task } from "../../types/task";
import { TaskCard } from "./TaskCard";
import { TaskFilters } from "./TaskFilters";
import { TaskForm } from "./TaskForm";
import { QuickAddTask } from "./QuickAddTask";
import { Sidebar } from "./Sidebar";
import { useActiveList } from "../../hooks/useActiveList";
import { cn } from "@/lib/utils";
import { Plus, ChevronLeft, ChevronRight, Loader2, LayoutList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function TaskList() {
  const queryClient = useQueryClient();
  const { activeListId, setActiveListId } = useActiveList();
  const [priority, setPriority] = useState<Priority>();
  const [status, setStatus] = useState<boolean>();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: listsData } = useQuery({
    queryKey: ["lists"],
    queryFn: getLists,
  });

  const activeList = activeListId === "all" 
    ? { name: "All Tasks", color: "hsl(var(--primary))" } 
    : listsData?.data?.find(l => l.id === activeListId) || { name: "Inbox", color: "#6366f1" };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tasks", { activeListId, priority, status, page }],
    queryFn: () => getTasks({ 
      list_id: activeListId === "all" ? undefined : activeListId,
      priority, 
      status, 
      page, 
      page_size: 10 
    }),
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      setIsFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, task }: { id: string; task: Partial<Task> }) =>
      updateTask(id, task),
    onSuccess: (_, variables) => {
      const { id, task: updatedFields } = variables;
      
      // If we're in a specific list view and the list_id changed, remove it from the current view immediately
      if (activeListId !== "all" && updatedFields.hasOwnProperty("list_id") && updatedFields.list_id !== activeListId) {
        // Special case for Inbox (default) which includes null list_id
        const isMovedFromInbox = activeListId === "default" && updatedFields.list_id !== null;
        const isMovedFromOtherList = activeListId !== "default";

        if (isMovedFromInbox || isMovedFromOtherList) {
          queryClient.setQueryData(["tasks", { activeListId, priority, status, page }], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.filter((t: Task) => t.id !== id),
              total: Math.max(0, old.total - 1)
            };
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      setEditingTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });

  const handleToggleStatus = (task: Task) => {
    updateMutation.mutate({ id: task.id, task: { status: !task.status } });
  };

  const tasks = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 10);

  const activeListInfo = activeListId === "all" 
    ? { 
        total_count: listsData?.data?.reduce((acc, l) => acc + l.total_count, 0) || 0,
        incomplete_count: listsData?.data?.reduce((acc, l) => acc + l.incomplete_count, 0) || 0
      }
    : listsData?.data?.find(l => l.id === activeListId);

  const totalTasks = activeListInfo?.total_count || 0;
  const totalIncomplete = activeListInfo?.incomplete_count || 0;

  let subtitle = "";
  if (totalTasks > 0) {
    subtitle = totalIncomplete > 0 ? `${totalIncomplete} incomplete` : "All done";
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="hidden md:block">
        <Sidebar activeListId={activeListId} setActiveListId={setActiveListId} />
      </div>

      <div className="md:hidden border-b bg-muted/20 overflow-x-auto whitespace-nowrap flex gap-1 p-2 no-scrollbar">

        <button
          onClick={() => setActiveListId("all")}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
            activeListId === "all" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
        >
          All
        </button>
        {listsData?.data?.map(list => (
          <button
            key={list.id}
            onClick={() => setActiveListId(list.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all",
              activeListId === list.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: list.color }} />
             {list.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-background/50">

        <div className="container max-w-4xl mx-auto px-6 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                {activeListId !== "all" && activeListId !== "default" && (
                  <div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: activeList.color }} />
                )}
                {activeList.name}
              </h2>
              {subtitle && (
                <p className="text-muted-foreground text-sm font-medium">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium shadow-md hover:shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>

          <div className="space-y-2">
            <QuickAddTask activeListId={activeListId} />

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
          </div>

          {isError ? (
            <div className="p-12 text-center border-2 border-dashed rounded-2xl bg-destructive/5 text-destructive">
              <p className="font-medium">Failed to load tasks. Please try again.</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="animate-pulse">Loading your tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-2xl text-muted-foreground gap-4 bg-muted/20"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <LayoutList className="w-6 h-6 opacity-20" />
              </div>
              <p className="text-sm font-medium">No tasks found in this list.</p>
              <button
                onClick={() => setIsFormOpen(true)}
                className="text-primary hover:underline text-sm font-semibold"
              >
                Create your first task
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showListBadge={activeListId === "all"}
                  listName={task.list_id ? listsData?.data?.find(l => l.id === task.list_id)?.name : "Inbox"}
                  listColor={task.list_id ? listsData?.data?.find(l => l.id === task.list_id)?.color : "#6366f1"}
                  onToggleStatus={handleToggleStatus}
                  onEdit={setEditingTask}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-6 py-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2.5 rounded-xl border bg-card hover:bg-muted disabled:opacity-30 transition-all shadow-sm disabled:shadow-none"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold tabular-nums">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2.5 rounded-xl border bg-card hover:bg-muted disabled:opacity-30 transition-all shadow-sm disabled:shadow-none"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {(isFormOpen || editingTask) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-card rounded-2xl border shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold mb-1">
              {editingTask ? "Edit Task" : "New Task"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {editingTask ? "Update task details below." : "Add a new task to your list."}
            </p>
            <TaskForm
              initialData={editingTask || undefined}
              onSubmit={(task) => {
                if (editingTask) {
                  updateMutation.mutate({ id: editingTask.id, task });
                } else {
                  createMutation.mutate({
                    ...task,
                    list_id: activeListId === "all" ? null : activeListId
                  });
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
