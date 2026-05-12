import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLists, createList, updateList, deleteList } from "../../api/lists";
import { List } from "../../types/task";
import { cn } from "@/lib/utils";
import { Plus, MoreVertical, Trash2, Edit2, Check, X, Inbox, LayoutList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<List> }) => updateList(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      if (activeListId === deleteConfirmId) {
        setActiveListId("all");
      }
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

  const startEdit = (list: List) => {
    setEditingId(list.id);
    setEditName(list.name);
    setEditColor(list.color);
  };

  return (
    <div className="w-[260px] h-full flex flex-col bg-muted/30 border-r py-6 px-4 gap-6">
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden min-h-0 no-scrollbar">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveListId("all")}
          className={cn(
            "flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm font-medium",
            activeListId === "all" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
          )}
        >
          <div className="flex items-center gap-3">
            <LayoutList className="w-4 h-4" />
            <span>All Tasks</span>
          </div>
          <span className={cn("text-xs", activeListId === "all" ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {totalIncomplete}
          </span>
        </motion.button>

        {lists.map((list) => {
          const isDefault = list.id === "default";
          const isActive = activeListId === list.id;
          const isEditing = editingId === list.id;

          if (isEditing) {
            return (
              <div key={list.id} className="p-2 space-y-3 bg-muted/50 rounded-lg animate-in fade-in zoom-in-95">
                <Input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdate(list.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="h-8 text-sm"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all",
                        editColor === c ? "border-primary scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="default" className="h-7 w-7" onClick={() => handleUpdate(list.id)}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <motion.div
              layout
              key={list.id}
              className={cn(
                "group relative flex items-center justify-between rounded-lg transition-colors text-sm font-medium pr-2",
                isActive ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
              )}
            >
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveListId(list.id)}
                className="flex-1 flex items-center gap-3 px-3 py-2 text-left"
              >
                {isDefault ? (
                  <Inbox className="w-4 h-4" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: list.color }} />
                )}
                <span className="truncate">{list.name}</span>
              </motion.button>

              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs group-hover:hidden",
                  isActive ? "text-primary-foreground/70" : "text-muted-foreground",
                  deleteConfirmId === list.id && "hidden"
                )}>
                  {list.incomplete_count}
                </span>

                {!isDefault && (
                  <div className={cn("hidden group-hover:flex items-center", (deleteConfirmId === list.id || openMenuId === list.id) && "flex")}>
                    {deleteConfirmId === list.id ? (
                      <div className="flex items-center gap-1 animate-in slide-in-from-right-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteMutation.mutate(list.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <DropdownMenu onOpenChange={(open) => setOpenMenuId(open ? list.id : null)}>
                        <DropdownMenuTrigger asChild>
                          <button className={cn(
                            "p-1 rounded-md hover:bg-muted-foreground/10 transition-colors",
                            isActive ? "hover:bg-primary-foreground/20" : ""
                          )}>
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => startEdit(list)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteConfirmId(list.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
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
      </nav>

      <div className="pt-4 border-t">
        {isAdding ? (
          <div className="px-1 space-y-2 animate-in slide-in-from-bottom-2">
            <Input
              autoFocus
              placeholder="List name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setIsAdding(false);
              }}
              className="h-9 text-sm"
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate}>Create</Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New List</span>
          </button>
        )}
      </div>
    </div>
  );
}
