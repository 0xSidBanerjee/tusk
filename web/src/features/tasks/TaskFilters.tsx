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
    <div className="flex flex-wrap items-center gap-4 py-1">
      <div className="flex items-center p-1 bg-muted/50 rounded-[1.25rem] border border-muted/10 backdrop-blur-md">
        <button
          onClick={() => onPriorityChange(undefined)}
          className={cn(
            "relative flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-bold transition-all duration-300 outline-none",
            priority === undefined ? "text-foreground" : "text-muted-foreground/50 hover:text-foreground"
          )}
        >
          {priority === undefined && (
            <motion.div
              layoutId="active-filter"
              className="absolute inset-0 bg-background rounded-[0.9rem] shadow-[0_2px_12px_-3px_rgba(0,0,0,0.15),0_8px_30px_-5px_rgba(0,0,0,0.1)] border border-muted/20 dark:bg-muted dark:border-muted-foreground/10"
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Filter className={cn("w-3.5 h-3.5", priority === undefined ? "text-primary" : "text-muted-foreground/30")} />
            All
          </span>
        </button>

        {(["High", "Medium", "Low"] as Priority[]).map((p) => {
          const isActive = priority === p;
          const config = {
            High: { iconColor: "text-red-500", label: "High" },
            Medium: { iconColor: "text-orange-500", label: "Medium" },
            Low: { iconColor: "text-blue-500", label: "Low" },
          }[p];

          return (
            <button
              key={p}
              onClick={() => onPriorityChange(isActive ? undefined : p)}
              className={cn(
                "relative flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-bold transition-all duration-300 outline-none",
                isActive ? "text-foreground" : "text-muted-foreground/50 hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-filter"
                  className="absolute inset-0 bg-background rounded-[0.9rem] shadow-[0_2px_12px_-3px_rgba(0,0,0,0.15),0_8px_30px_-5px_rgba(0,0,0,0.1)] border border-muted/20 dark:bg-muted dark:border-muted-foreground/10"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Flag className={cn("w-3.5 h-3.5", isActive ? config.iconColor : "text-muted-foreground/30")} />
                {config.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 ml-auto">

        <div className="h-4 w-px bg-muted/20 mx-1" />

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onDensityToggle}
          className="flex items-center justify-center h-10 w-10 rounded-2xl bg-muted/30 border border-muted/10 text-muted-foreground/60 hover:bg-background hover:text-foreground hover:shadow-sm transition-all duration-300"
          title={density === "comfortable" ? "Switch to Compact" : "Switch to Comfortable"}
        >
          {density === "comfortable" ? (
            <Layout className="w-3.5 h-3.5" />
          ) : (
            <ListIcon className="w-3.5 h-3.5" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
