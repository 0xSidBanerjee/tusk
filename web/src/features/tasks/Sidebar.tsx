import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLists, createList, updateList, deleteList } from "../../api/lists";
import { List } from "../../types/task";
import { cn } from "@/lib/utils";
import { Plus, MoreVertical, Trash2, Edit2, Check, X, Inbox, LayoutList, Sun, Moon, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PRESET_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#f43f5e", "#06b6d4"];

interface SidebarProps {
  activeListId: string;
  setActiveListId: (id: string) => void;
}

export function Sidebar({ activeListId, setActiveListId }: SidebarProps) {
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data: listsData } = useQuery({
    queryKey: ["lists"],
    queryFn: getLists,
  });

  const lists = listsData?.data || [];
  const totalIncomplete = lists.reduce((acc, l) => acc + l.incomplete_count, 0);

  const createMutation = useMutation({
    mutationFn: createList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      setIsAdding(false);
      setNewName("");
      setError(null);
    },
    onError: (err: any) => {
      if (err.response?.status === 409) setError(err.response.data.error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<List> }) => updateList(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      setEditingId(null);
      setError(null);
    },
    onError: (err: any) => {
      if (err.response?.status === 409) setError(err.response.data.error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      if (activeListId === deleteConfirmId) setActiveListId("all");
      setDeleteConfirmId(null);
    },
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    const color = PRESET_COLORS[lists.length % PRESET_COLORS.length];
    createMutation.mutate({ name: newName.trim(), color });
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    updateMutation.mutate({ id, data: { name: editName.trim(), color: editColor } });
  };

  return (
    <div className="w-[280px] h-screen flex flex-col bg-background border-r py-6 px-4 gap-6 backdrop-blur-md shrink-0">
      <div className="flex items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform duration-300">
            <Check className="w-5 h-5 text-primary-foreground stroke-[3]" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none uppercase">Tusk</h1>
          </div>
        </div>
        
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-xl border bg-card hover:bg-muted transition-all duration-300 shadow-sm"
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <Moon className="w-3.5 h-3.5" />
          ) : (
            <Sun className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden min-h-0 no-scrollbar pr-1">
        <LayoutGroup id="sidebar-lists">
          <div className="mb-4">
            <p className="px-3 mb-2 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">General</p>
            <button
              onClick={() => setActiveListId("all")}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-300 group relative",
                activeListId === "all" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              {activeListId === "all" && (
                <motion.div
                  layoutId="active-list-bg"
                  className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20"
                  transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-3">
                <LayoutList className={cn("w-4 h-4", activeListId === "all" ? "text-primary-foreground" : "text-primary")} />
                <span className="text-sm font-bold">All Tasks</span>
              </div>
              <span className={cn(
                "relative z-10 text-[9px] font-black px-2 py-0.5 rounded-full transition-colors duration-300",
                activeListId === "all" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {totalIncomplete}
              </span>
            </button>

            <button
              onClick={() => setActiveListId("completed")}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-300 group relative mt-1",
                activeListId === "completed" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              {activeListId === "completed" && (
                <motion.div
                  layoutId="active-list-bg"
                  className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20"
                  transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-3">
                <CheckCircle2 className={cn("w-4 h-4", activeListId === "completed" ? "text-primary-foreground" : "text-primary")} />
                <span className="text-sm font-bold">Completed</span>
              </div>
            </button>
          </div>

        <div>
          <p className="px-3 mb-2 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">My Lists</p>
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {lists.map((list) => {
                const isDefault = list.id === "default";
                const isActive = activeListId === list.id;
                const isEditing = editingId === list.id;

                if (isEditing) {
                  return (
                    <motion.div
                      key={`edit-${list.id}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-2 space-y-3 bg-card rounded-xl border border-primary/20 overflow-hidden shadow-sm"
                    >
                      <Input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdate(list.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-8 text-xs font-semibold bg-background"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setEditColor(c)}
                            className={cn(
                              "w-3.5 h-3.5 rounded-full border-2 transition-all hover:scale-125",
                              editColor === c ? "border-primary scale-110 shadow-md" : "border-transparent"
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-1.5 justify-end">
                        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-lg" onClick={() => setEditingId(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                        <Button size="icon" className="h-6 w-6 rounded-lg" onClick={() => handleUpdate(list.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    layout
                    key={list.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "group relative flex items-center justify-between rounded-xl transition-all duration-300 pr-2",
                      isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-list-bg"
                        className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20"
                        transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                      />
                    )}
                    <button
                      onClick={() => setActiveListId(list.id)}
                      className="relative z-10 flex-1 flex items-center gap-3 px-3 py-2 text-left"
                    >
                      {isDefault ? (
                        <Inbox className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-primary")} />
                      ) : (
                        <div className={cn(
                          "w-2 h-2 rounded-full shadow-sm transition-all",
                          isActive ? "bg-primary-foreground ring-4 ring-primary-foreground/20" : ""
                        )} style={{ backgroundColor: isActive ? undefined : list.color }} />
                      )}
                      <span className="text-sm font-bold truncate">{list.name}</span>
                    </button>

                    <div className="relative z-10 flex items-center gap-2">
                      {list.incomplete_count > 0 && (
                        <span className={cn(
                          "text-[9px] font-black px-1.5 py-0.5 rounded-full transition-opacity duration-300",
                          isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                          (deleteConfirmId === list.id || openMenuId === list.id) && "opacity-0"
                        )}>
                          {list.incomplete_count}
                        </span>
                      )}

                      {!isDefault && (
                        <div className={cn("hidden group-hover:flex items-center transition-all animate-in fade-in slide-in-from-right-1", (deleteConfirmId === list.id || openMenuId === list.id) && "flex")}>
                          {deleteConfirmId === list.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                onClick={() => deleteMutation.mutate(list.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setDeleteConfirmId(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <DropdownMenu onOpenChange={(open) => setOpenMenuId(open ? list.id : null)}>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 rounded-lg hover:bg-muted-foreground/10 transition-colors duration-300">
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-muted-foreground/20">
                                <DropdownMenuItem onClick={() => {
                                  setEditingId(list.id);
                                  setEditName(list.name);
                                  setEditColor(list.color);
                                }} className="rounded-lg py-1.5 text-xs font-semibold">
                                  <Edit2 className="w-3.5 h-3.5 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive rounded-lg py-1.5 text-xs font-semibold"
                                  onClick={() => setDeleteConfirmId(list.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </LayoutGroup>
    </nav>

      <div className="pt-4 border-t border-muted-foreground/10">
        <AnimatePresence mode="wait">
          {isAdding ? (
            <motion.div
              key="adding"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-1 space-y-3"
            >
              <Input
                autoFocus
                placeholder="List name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setIsAdding(false);
                }}
                className="h-9 text-xs font-semibold rounded-xl"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" className="h-7 rounded-lg text-[10px] font-bold" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button size="sm" className="h-7 rounded-lg px-4 text-[10px] font-bold shadow-md shadow-primary/20" onClick={handleCreate}>Create</Button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="add-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsAdding(true);
                setError(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all duration-300 border border-dashed border-muted-foreground/20 hover:border-primary/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New List</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
