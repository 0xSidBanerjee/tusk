import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, createTask, updateTask, deleteTask } from "../../api/tasks";
import { getLists } from "../../api/lists";
import { Priority, Task } from "../../types/task";
import { TaskCard } from "./TaskCard";
import { TaskFilters } from "./TaskFilters";
import { TaskForm } from "./TaskForm";
import { QuickAddTask } from "./QuickAddTask";
import { Sidebar } from "./Sidebar";
import { DataManagement } from "./DataManagement";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { useActiveList } from "../../hooks/useActiveList";
import { cn } from "@/lib/utils";
import { Plus, ChevronLeft, ChevronRight, Loader2, LayoutList, Database, Edit2, Layout, List as ListIcon, Maximize2, CheckCircle2, Inbox, Clock, Trash2, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { clearTasks } from "../../api/tasks";
import { AlertModal } from "@/components/ui/AlertModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

export function TaskList() {
  const queryClient = useQueryClient();
  const { activeListId, setActiveListId } = useActiveList();
  const [priority, setPriority] = useState<Priority>();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearScope, setClearScope] = useState<"all" | "older_than_month">("all");
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [density, setDensity] = useState<"comfortable" | "compact">(() => {
    return (localStorage.getItem("tusk_density") as "comfortable" | "compact") || "comfortable";
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Focus quick add on '/' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" && 
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName) && 
        !(e.target as HTMLElement).isContentEditable
      ) {
        e.preventDefault();
        const input = document.querySelector('input[placeholder*="Add task"]') as HTMLInputElement;
        input?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close form on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFormOpen(false);
        setEditingTask(null);
        setIsDataModalOpen(false);
      }
    };
    if (isFormOpen || !!editingTask || isDataModalOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isFormOpen, editingTask, isDataModalOpen]);

  // Persist density
  useEffect(() => {
    localStorage.setItem("tusk_density", density);
  }, [density]);

  // Scroll to top on page change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const { data: listsData } = useQuery({
    queryKey: ["lists"],
    queryFn: getLists,
  });

  useEffect(() => {
    setPage(1);
  }, [activeListId]);

  const activeList = activeListId === "all" 
    ? { name: "All Tasks", color: "hsl(var(--primary))" } 
    : activeListId === "completed"
    ? { name: "Completed", color: "hsl(var(--primary))" }
    : listsData?.data?.find(l => l.id === activeListId) || { name: "Inbox", color: "#6366f1" };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tasks", { activeListId, priority, page }],
    queryFn: () => getTasks({ 
      list_id: ["all", "completed"].includes(activeListId) ? undefined : activeListId,
      priority, 
      status: activeListId === "completed" ? true : false, 
      page, 
      page_size: 10 
    }),
  });

  const { data: completedTasksData } = useQuery({
    queryKey: ["tasks", { activeListId, status: true, scope: "inline-completed" }],
    queryFn: () => getTasks({ 
      list_id: ["all", "completed"].includes(activeListId) ? undefined : activeListId,
      status: true,
      page: 1,
      page_size: 50
    }),
    enabled: showCompleted && activeListId !== "completed",
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
        const isMovedFromInbox = activeListId === "default" && updatedFields.list_id !== "default";
        const isMovedFromOtherList = activeListId !== "default";

        if (isMovedFromInbox || isMovedFromOtherList) {
          queryClient.setQueryData(["tasks", { activeListId, priority, page }], (old: any) => {
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

  const clearMutation = useMutation({
    mutationFn: clearTasks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      setIsClearModalOpen(false);
    },
  });

  const handleToggleStatus = (task: Task) => {
    updateMutation.mutate({ id: task.id, task: { status: !task.status } });
  };

  const tasks = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 10);

  useEffect(() => {
    if (!isLoading && data) {
      if (totalPages > 0 && page > totalPages) {
        setPage(totalPages);
      } else if (totalPages === 0 && page !== 1) {
        setPage(1);
      }
    }
  }, [page, totalPages, isLoading, data]);

  const activeListInfo = activeListId === "all" 
    ? { 
        total_count: listsData?.data?.reduce((acc, l) => acc + l.total_count, 0) || 0,
        incomplete_count: listsData?.data?.reduce((acc, l) => acc + l.incomplete_count, 0) || 0
      }
    : listsData?.data?.find(l => l.id === activeListId);

  const totalTasks = activeListInfo?.total_count || 0;
  const totalIncomplete = activeListInfo?.incomplete_count || 0;

  let subtitle = "";
  if (activeListId === "completed") {
    subtitle = `${data?.total || 0} tasks completed`;
  } else if (totalTasks > 0) {
    subtitle = totalIncomplete > 0 ? `${totalIncomplete} incomplete` : "All tasks completed";
  }

  const groupTasksByDate = (tasks: Task[]) => {
    const groups: { [key: string]: Task[] } = {};
    const staticOrder = ["Today", "Yesterday", "Previous 7 Days", "Previous 30 Days"];
    const dynamicOrder: string[] = [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    tasks.forEach(task => {
      let group = "Earlier";
      if (task.completed_at) {
        const date = new Date(task.completed_at);
        const taskDay = new Date(date);
        taskDay.setHours(0, 0, 0, 0);

        if (taskDay.getTime() === now.getTime()) group = "Today";
        else if (taskDay.getTime() === yesterday.getTime()) group = "Yesterday";
        else if (taskDay.getTime() >= sevenDaysAgo.getTime()) group = "Previous 7 Days";
        else if (taskDay.getTime() >= thirtyDaysAgo.getTime()) group = "Previous 30 Days";
        else {
          group = format(date, "MMMM");
        }
      }

      if (!groups[group]) {
        groups[group] = [];
        if (!staticOrder.includes(group) && group !== "Earlier") {
          dynamicOrder.push(group);
        }
      }
      groups[group].push(task);
    });

    const finalOrder = [...staticOrder, ...dynamicOrder, "Earlier"];
    return finalOrder.filter(key => groups[key]).map(key => ({ title: key, tasks: groups[key] }));
  };

  const groupedTasks = activeListId === "completed" ? groupTasksByDate(tasks) : null;

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans antialiased">
      <Sidebar activeListId={activeListId} setActiveListId={setActiveListId} />
      
      <main className="flex-1 flex flex-col min-w-0 relative bg-card overflow-hidden">
        {/* Sticky Header Section */}
        <header className="px-8 py-4 flex flex-col gap-3 shrink-0 bg-card/50 backdrop-blur-sm z-20 border-b border-muted/10">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5">
                {(!activeListId || activeListId === "all") ? (
                  <LayoutList className="w-8 h-8 text-primary" />
                ) : activeListId === "completed" ? (
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                ) : activeListId === "default" ? (
                  <Inbox className="w-8 h-8 text-primary" />
                ) : (
                  <ListIcon className="w-8 h-8" style={{ color: activeList.color }} />
                )}
                <h2 className="text-3xl font-black tracking-tighter text-foreground">{activeList.name}</h2>
              </div>
            </div>
            
             <div className="flex items-center gap-6">
               {(activeListId !== "completed" && totalTasks > 0) && (
                 <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-700">
                   <div className="h-10 w-px bg-muted/20" />
                   <motion.div 
                     initial={{ scale: 0.8, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     className="flex flex-col items-end"
                   >
                     <span 
                       className="text-4xl font-black tracking-tighter leading-none"
                       style={{ color: activeList.color }}
                     >
                       {totalIncomplete}
                     </span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 mt-1">
                       Remaining
                     </span>
                   </motion.div>
                 </div>
               )}
               <div className="flex items-center gap-2">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setIsDataModalOpen(true)}
                  className="h-9 rounded-lg border-muted bg-card hover:bg-muted transition-all duration-300 font-bold gap-2 shadow-sm"
               >
                 <Database className="w-3.5 h-3.5 text-primary" />
                 <span className="hidden sm:inline text-xs">Import / Export</span>
               </Button>
               <Button
                 size="sm"
                 onClick={() => setIsFormOpen(true)}
                  className="h-9 rounded-lg bg-primary text-primary-foreground hover:scale-105 transition-all duration-300 font-black px-4 shadow-lg shadow-primary/10 active:scale-95 gap-2"
               >
                 <Plus className="w-4 h-4 stroke-[3]" />
                 <span className="text-xs">Add Task</span>
               </Button>
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
            <QuickAddTask activeListId={activeListId} />
            <div className="h-px bg-muted-foreground/10 mx-1 my-1" />
            <TaskFilters
              priority={priority}
              onPriorityChange={(p) => {
                setPriority(p);
                setPage(1);
              }}
              onReset={() => {
                setPriority(undefined);
                setPage(1);
              }}
              density={density}
              onDensityToggle={() => setDensity(d => d === "comfortable" ? "compact" : "comfortable")}
            />
          </div>
        </header>

        {/* Scrollable Tasks Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-4 no-scrollbar">
          <div className="w-full">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Synchronizing...</p>
              </div>
            ) : tasks.length > 0 ? (
              <div className="grid gap-8">
                {groupedTasks ? (
                  groupedTasks.map(group => (
                    <div key={group.title} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">{group.title}</h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-primary/10 to-transparent" />
                      </div>
                      <div className="grid gap-3">
                        <AnimatePresence mode="popLayout">
                          {group.tasks.map((task) => (
                            <TaskCard 
                              key={task.id} 
                              task={task}
                              density={density}
                              showListBadge={true}
                              listName={listsData?.data?.find(l => l.id === task.list_id)?.name}
                              listColor={listsData?.data?.find(l => l.id === task.list_id)?.color}
                              onToggleStatus={() => handleToggleStatus(task)}
                              onEdit={setEditingTask}
                              onDelete={(id) => deleteMutation.mutate(id)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="grid gap-3">
                    <AnimatePresence mode="popLayout">
                      {tasks.map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task}
                          density={density}
                          showListBadge={activeListId === "all"}
                          listName={listsData?.data?.find(l => l.id === task.list_id)?.name}
                          listColor={listsData?.data?.find(l => l.id === task.list_id)?.color}
                          onToggleStatus={() => handleToggleStatus(task)}
                          onEdit={setEditingTask}
                          onDelete={(id) => setTaskToDelete(id)}
                        />
                      ))}
                    </AnimatePresence>

                    {(activeListId !== "completed" && totalTasks > totalIncomplete) && (
                      <div className="mt-12 space-y-4">
                        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-muted/5 border border-muted/10">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span className="text-[13px] font-bold text-foreground/70">
                              {totalTasks - totalIncomplete} Completed
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="hover:text-red-500 transition-colors flex items-center gap-2">
                                  Clear
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-1.5 rounded-2xl shadow-2xl border-muted-foreground/10 backdrop-blur-2xl bg-card/95" align="end">
                                <div className="p-2 mb-1">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Clear Completed</p>
                                </div>
                                <button 
                                  onClick={() => {
                                    setClearScope("older_than_month");
                                    setIsClearModalOpen(true);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/30 transition-all text-xs font-bold text-foreground/70"
                                >
                                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                                  Older than one month
                                </button>
                                <button 
                                  onClick={() => {
                                    setClearScope("all");
                                    setIsClearModalOpen(true);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-all text-xs font-bold text-red-500"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  All completed
                                </button>
                              </PopoverContent>
                            </Popover>

                            <button 
                              onClick={() => setShowCompleted(!showCompleted)}
                              className="hover:text-primary transition-colors cursor-pointer"
                            >
                              {showCompleted ? "Hide" : "Show"}
                            </button>
                          </div>
                        </div>

                        {showCompleted && (
                          <div className="grid gap-3 opacity-60 hover:opacity-100 transition-opacity duration-500">
                            <AnimatePresence mode="popLayout">
                              {completedTasksData?.data?.map((task) => (
                                <TaskCard 
                                  key={task.id} 
                                  task={task}
                                  density={density}
                                  showListBadge={activeListId === "all"}
                                  listName={listsData?.data?.find(l => l.id === task.list_id)?.name}
                                  listColor={listsData?.data?.find(l => l.id === task.list_id)?.color}
                                  onToggleStatus={() => handleToggleStatus(task)}
                                  onEdit={setEditingTask}
                                  onDelete={(id) => setTaskToDelete(id)}
                                />
                              ))}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 text-center"
              >
                <p className="text-sm font-medium text-muted-foreground/40 italic">
                  {priority 
                    ? `No tasks match your current filters`
                    : "No tasks found"
                  }
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Fixed Pagination Footer */}
        {totalPages > 1 && (
          <footer className="shrink-0 py-6 px-8 flex items-center justify-center gap-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full h-8 w-8 hover:bg-muted transition-all duration-300"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </Button>
            
            <div className="flex items-center gap-1.5 tabular-nums text-[11px] font-bold tracking-tight text-muted-foreground/60">
              <span className="text-foreground">{page}</span>
              <span className="opacity-40">/</span>
              <span>{totalPages}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-full h-8 w-8 hover:bg-muted transition-all duration-300"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          </footer>
        )}
      </main>

      <TaskDetailPanel
        isOpen={isFormOpen || !!editingTask}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        title={editingTask ? "Task Details" : "New Task"}
        onSubmit={(task) => {
          if (editingTask) {
            updateMutation.mutate({ id: editingTask.id, task });
          } else {
            createMutation.mutate({
              ...task,
              list_id: activeListId === "all" ? "default" : activeListId
            });
          }
        }}
      />

      <DataManagement 
        isOpen={isDataModalOpen} 
        onClose={() => setIsDataModalOpen(false)} 
      />

      <AlertModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={() => clearMutation.mutate({ list_id: activeListId, scope: clearScope })}
        title={clearScope === "all" ? "Clear all completed tasks?" : "Clear older completed tasks?"}
        description="This action cannot be undone. All selected tasks will be permanently removed."
        confirmLabel="Clear"
      />

      <AlertModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => taskToDelete && deleteMutation.mutate(taskToDelete)}
        title="Delete this task?"
        description="This cannot be undone. The task will be permanently removed from your list."
        confirmLabel="Delete"
      />
    </div>
  );
}
