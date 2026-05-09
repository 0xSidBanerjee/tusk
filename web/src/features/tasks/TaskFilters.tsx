import { Priority } from "../../types/task";
import { cn } from "../../lib/utils";

interface TaskFiltersProps {
  priority?: Priority;
  status?: boolean;
  onPriorityChange: (priority?: Priority) => void;
  onStatusChange: (status?: boolean) => void;
  onReset: () => void;
}

export function TaskFilters({
  priority,
  status,
  onPriorityChange,
  onStatusChange,
  onReset,
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 py-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Priority:</span>
        {(["High", "Medium", "Low"] as Priority[]).map((p) => (
          <button
            key={p}
            onClick={() => onPriorityChange(priority === p ? undefined : p)}
            className={cn(
              "px-3 py-1 rounded-full border transition-colors",
              priority === p
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-input"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Status:</span>
        <button
          onClick={() => onStatusChange(status === true ? undefined : true)}
          className={cn(
            "px-3 py-1 rounded-full border transition-colors",
            status === true
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted border-input"
          )}
        >
          Done
        </button>
        <button
          onClick={() => onStatusChange(status === false ? undefined : false)}
          className={cn(
            "px-3 py-1 rounded-full border transition-colors",
            status === false
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted border-input"
          )}
        >
          Pending
        </button>
      </div>

      {(priority !== undefined || status !== undefined) && (
        <button
          onClick={onReset}
          className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
        >
          Reset
        </button>
      )}
    </div>
  );
}
