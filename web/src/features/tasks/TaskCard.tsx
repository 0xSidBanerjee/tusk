import { Task, Priority } from "../../types/task";
import { cn } from "../../lib/utils";
import { Calendar, Trash2, Edit2, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface TaskCardProps {
  task: Task;
  showListBadge?: boolean;
  listName?: string;
  listColor?: string;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityColors: Record<Priority, string> = {
  High: "bg-red-500",
  Medium: "bg-yellow-500",
  Low: "bg-blue-500",
};

export function TaskCard({ task, showListBadge, listName, listColor, onToggleStatus, onEdit, onDelete }: TaskCardProps) {

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.status;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-300"
    >
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onToggleStatus(task)}
        className="mt-1 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
      >
        <AnimatePresence mode="wait" initial={false}>
          {task.status ? (
            <motion.div
              key="checked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </motion.div>
          ) : (
            <motion.div
              key="unchecked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Circle className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {task.priority && (
            <div
              className={cn("w-2 h-2 rounded-full", priorityColors[task.priority])}
              title={`Priority: ${task.priority}`}
            />
          )}
          <h3
            className={cn(
              "font-medium truncate transition-colors duration-300",
              task.status && "text-muted-foreground line-through opacity-70"
            )}
          >
            {task.title}
          </h3>
          {showListBadge && listName && (
            <span 
              className="text-[10px] font-bold uppercase tracking-wider ml-1 opacity-60"
              style={{ color: listColor }}
            >
              {listName}
            </span>
          )}
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {task.description}
          </p>
        )}

        {task.deadline && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs transition-colors duration-300",
              isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
            )}
          >
            <Calendar className="w-3 h-3" />
            {format(new Date(task.deadline), "PPP")}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onEdit(task)}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(task.id)}
          className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
