import { Task } from "../../types/task";
import { cn } from "../../lib/utils";
import { Calendar, Trash2, Info, Check, Flag } from "lucide-react";
import { format, isTomorrow, isToday, isYesterday } from "date-fns";
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

  const getDeadlineText = (deadline: string) => {
    const date = new Date(deadline);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d, yyyy");
  };

  const getCompletedText = (completedAt: string) => {
    const date = new Date(completedAt);
    let datePart = "";
    if (isToday(date)) datePart = "Today";
    else if (isYesterday(date)) datePart = "Yesterday";
    else datePart = format(date, "dd/MM/yyyy");
    
    const timePart = format(date, "p");
    return `${datePart}, ${timePart}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onEdit(task)}
      className={cn(
        "group relative flex items-start rounded-3xl transition-all duration-300 bg-card border border-transparent hover:border-border hover:shadow-xl hover:shadow-black/5 cursor-pointer",
        density === "compact" ? "p-3 pl-12 gap-4" : "p-6 pl-14 gap-6",
        task.status && "opacity-60"
      )}
    >
      {/* Outstanding Circular Checkbox */}
      <div className="flex-shrink-0 mt-1">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(task);
          }}
          className={cn(
            "w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 relative overflow-hidden",
            task.status 
              ? "bg-primary border-primary shadow-lg shadow-primary/20" 
              : "border-muted-foreground/20 bg-background hover:border-primary/40 hover:scale-110 shadow-sm"
          )}
        >
          <AnimatePresence mode="wait">
            {task.status && (
              <motion.div
                key="check"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
              >
                <Check className="w-4 h-4 text-primary-foreground stroke-[3]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="flex-1 min-w-0">
        {/* Title Row */}
        <h3 className={cn(
          "transition-all duration-300 truncate tracking-tight mb-2",
          density === "compact" ? "text-sm" : "text-lg",
          task.status ? "text-muted-foreground font-normal line-through" : "text-foreground font-bold",
        )}>
          {task.title}
        </h3>

        {/* Metadata Row */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* List/Project Badge */}
          {listName && (
            <div className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full shadow-sm" 
                style={{ backgroundColor: listColor || 'hsl(var(--muted-foreground))' }} 
              />
              <span className="text-xs text-muted-foreground font-medium">{listName}</span>
            </div>
          )}

          {/* Deadline Badge */}
          {!task.status && task.deadline && (
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              isOverdue ? "text-red-500" : "text-muted-foreground"
            )}>
              <Calendar className="w-3.5 h-3.5 opacity-50" />
              <span>{getDeadlineText(task.deadline)}</span>
            </div>
          )}

          {/* Completion Badge */}
          {task.status && task.completed_at && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60">
              <Check className="w-3.5 h-3.5 text-primary" />
              <span>Completed: {getCompletedText(task.completed_at)}</span>
            </div>
          )}

          {/* Priority Pill */}
          {task.priority && (
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-colors",
              task.priority === "High" ? "bg-red-500/10 border-red-500/20 text-red-500" :
              task.priority === "Medium" ? "bg-orange-500/10 border-orange-500/20 text-orange-500" :
              "bg-muted border-border text-muted-foreground"
            )}>
              <Flag className="w-3 h-3" />
              {task.priority} Priority
            </div>
          )}
        </div>

        {task.description && !task.status && (
          <p className="text-sm text-muted-foreground/60 mt-3 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Action Buttons - Subtle until hover */}
      <div className="flex flex-row gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 ml-auto pl-4 items-center">
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-full hover:bg-muted transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
        >
          <Info className="w-4 h-4 text-muted-foreground/40" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
        >
          <Trash2 className="w-4 h-4 text-muted-foreground/40" />
        </Button>
      </div>
    </motion.div>
  );
}
