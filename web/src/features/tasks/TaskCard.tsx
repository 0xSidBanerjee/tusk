import { Task, Priority } from "../../types/task";
import { cn } from "../../lib/utils";
import { Calendar, Trash2, Edit2, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityColors: Record<Priority, string> = {
  High: "bg-red-500",
  Medium: "bg-yellow-500",
  Low: "bg-blue-500",
};

export function TaskCard({ task, onToggleStatus, onEdit, onDelete }: TaskCardProps) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.status;

  return (
    <div className="group relative flex items-start gap-4 p-4 rounded-lg border bg-card hover:shadow-sm transition-all">
      <button
        onClick={() => onToggleStatus(task)}
        className="mt-1 text-muted-foreground hover:text-primary transition-colors"
      >
        {task.status ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>

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
              "font-medium truncate",
              task.status && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </h3>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {task.description}
          </p>
        )}

        {task.deadline && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
            )}
          >
            <Calendar className="w-3 h-3" />
            {format(new Date(task.deadline), "PPP")}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
