import { Priority } from "../../types/task";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import { Filter, X, Flag, Layout, List as ListIcon } from "lucide-react";

interface TaskFiltersProps {
  priority?: Priority;
  onPriorityChange: (priority?: Priority) => void;
  onReset: () => void;
  density: "comfortable" | "compact";
  onDensityToggle: () => void;
}

export function TaskFilters({
  priority,
  onPriorityChange,
  onReset,
  density,
  onDensityToggle,
}: TaskFiltersProps) {
  const isFiltered = priority !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-3 py-4 mb-4">
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onPriorityChange(undefined)}
          className={cn(
            "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border shadow-sm",
            priority === undefined
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card hover:bg-muted border-border text-muted-foreground"
          )}
        >
          <Filter className="w-4 h-4" />
          All
        </motion.button>

        {(["High", "Medium", "Low"] as Priority[]).map((p) => {
          const isActive = priority === p;
          const config = {
            High: { iconColor: "text-red-500", label: "High" },
            Medium: { iconColor: "text-orange-500", label: "Medium" },
            Low: { iconColor: "text-muted-foreground", label: "Low" },
          }[p];

          return (
            <motion.button
              key={p}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPriorityChange(isActive ? undefined : p)}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border shadow-sm",
                isActive
                  ? "bg-card border-primary/20 ring-1 ring-primary/10 shadow-md text-foreground"
                  : "bg-card border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <Flag className={cn("w-4 h-4", config.iconColor)} />
              <span className={isActive ? "font-semibold" : ""}>
                {config.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {isFiltered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 transition-all border border-destructive/20"
          >
            <X className="w-3 h-3" />
            Clear
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onDensityToggle}
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all shadow-sm"
          title={density === "comfortable" ? "Switch to Compact" : "Switch to Comfortable"}
        >
          {density === "comfortable" ? (
            <Layout className="w-4 h-4" />
          ) : (
            <ListIcon className="w-4 h-4" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
