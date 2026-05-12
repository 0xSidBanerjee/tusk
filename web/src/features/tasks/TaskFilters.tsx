import { Priority } from "../../types/task";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import { Filter, X, Clock, CheckCircle2, AlertTriangle, BarChart2 } from "lucide-react";

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
}: TaskFiltersProps) {
  const isFiltered = priority !== undefined || status !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-4 py-2 border-b border-muted-foreground/5 mb-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/30 border border-muted-foreground/10">
          <BarChart2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Priority</span>
        </div>
        <div className="flex items-center gap-1.5">
          {(["High", "Medium", "Low"] as Priority[]).map((p) => {
            const isActive = priority === p;
            return (
              <motion.button
                key={p}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPriorityChange(isActive ? undefined : p)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-300 border shadow-sm",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-primary/20"
                    : "bg-card hover:bg-muted border-muted text-muted-foreground"
                )}
              >
                {p}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/30 border border-muted-foreground/10">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</span>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onStatusChange(status === true ? undefined : true)}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-300 border shadow-sm",
              status === true
                ? "bg-primary text-primary-foreground border-primary shadow-primary/20"
                : "bg-card hover:bg-muted border-muted text-muted-foreground"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Done
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onStatusChange(status === false ? undefined : false)}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-300 border shadow-sm",
              status === false
                ? "bg-primary text-primary-foreground border-primary shadow-primary/20"
                : "bg-card hover:bg-muted border-muted text-muted-foreground"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending
          </motion.button>
        </div>
      </div>

      {isFiltered && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-all border border-destructive/20 ml-auto"
        >
          <X className="w-3 h-3" />
          Reset Filters
        </motion.button>
      )}
    </div>
  );
}
