import { Task, Priority } from "../../types/task";
import { cn } from "../../lib/utils";
import { Calendar, Trash2, Edit2, CheckCircle2, Circle, Check } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface TaskCardProps {
  task: Task;
  density?: "comfortable" | "compact";
  showListBadge?: boolean;
  listName?: string;
  listColor?: string;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, density = "comfortable", showListBadge, listName, listColor, onToggleStatus, onEdit, onDelete }: TaskCardProps) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.status;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative flex items-start rounded-[2rem] transition-all duration-500",
        density === "compact" ? "p-3 pl-12 gap-4" : "p-5 pl-14 gap-5",
        task.status 
          ? "opacity-40" 
          : "hover:bg-muted/20"
      )}
    >
      {/* High Priority Left Accent - Keeping the user-loved feature but refined */}
      {task.priority === "High" && !task.status && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
      )}

      {/* Outstanding Squircle Checkbox */}
      <div className="flex-shrink-0 mt-0.5">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onToggleStatus(task)}
          className={cn(
            "w-6 h-6 rounded-[0.6rem] border-2 flex items-center justify-center transition-all duration-500 relative overflow-hidden",
            task.status 
              ? "bg-primary border-primary shadow-lg shadow-primary/20" 
              : "border-muted-foreground/10 bg-card hover:border-primary/40 hover:scale-110 shadow-sm"
          )}
        >
          {/* Subtle inner glow for the checkbox */}
          {!task.status && <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />}
          
          <AnimatePresence mode="wait">
            {task.status && (
              <motion.div
                key="check"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
              >
                <Check className="w-4 h-4 text-primary-foreground stroke-[3]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {/* Priority Dot - Restored as per user preference */}
          {!task.status && task.priority && task.priority !== "High" && (
            <div className={cn(
              "w-2 h-2 rounded-full shadow-sm",
              task.priority === "Medium" ? "bg-amber-400" : "bg-sky-400"
            )} />
          )}

          <h3 className={cn(
            "transition-all duration-300 truncate tracking-tight",
            density === "compact" ? "text-sm" : "text-base",
            task.status ? "text-muted-foreground line-through font-normal" : "text-foreground font-bold",
          )}>
            {task.title}
          </h3>

          {/* List Badge - Elegant chip */}
          {showListBadge && listName && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/30 border border-muted/5">
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: listColor }} />
              <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-tighter">
                {listName}
              </span>
            </div>
          )}
        </div>

        {task.description && (
          <p className={cn(
            "text-xs text-muted-foreground/50 line-clamp-2 leading-relaxed transition-all duration-500",
            density === "compact" ? "mt-0" : "mt-1.5",
            task.status && "opacity-30"
          )}>
            {task.description}
          </p>
        )}

        {task.deadline && !task.status && (
          <div className={cn(
            "flex items-center gap-1.5 font-black transition-all duration-500",
            density === "compact" ? "mt-1.5 text-[10px]" : "mt-3 text-[11px]",
            isOverdue ? "text-amber-500" : "text-muted-foreground/20"
          )}>
            <Calendar className={cn(density === "compact" ? "w-3 h-3" : "w-3.5 h-3.5")} />
            {format(new Date(task.deadline), "MMM d, yyyy")}
          </div>
        )}
      </div>

      {/* Action Buttons - More subtle until hover */}
      <div className="flex flex-row gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500 ml-auto pl-4 items-center">
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-2xl hover:bg-muted transition-all"
          onClick={() => onEdit(task)}
        >
          <Edit2 className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-2xl hover:bg-destructive/10 hover:text-destructive transition-all"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="w-4 h-4 text-muted-foreground/30 group-hover:text-destructive" />
        </Button>
      </div>
    </motion.div>
  );
}
