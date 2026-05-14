import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as chrono from "chrono-node";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "../../api/tasks";
import { parseQuickInput, parseDeadline } from "../../utils/parseQuickInput";
import { Input } from "@/components/ui/input";
import { CornerDownLeft, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function QuickAddTask({ activeListId }: { activeListId: string }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalShortcut = (e: KeyboardEvent) => {
      if (e.key === "/" && 
          document.activeElement?.tagName !== "INPUT" && 
          document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalShortcut);
    return () => window.removeEventListener("keydown", handleGlobalShortcut);
  }, []);

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      setValue("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || "Failed to add task");
    },
  });

  const parts = value.split("|").map((p) => p.trim());
  const lastPart = parts[parts.length - 1] || "";
  
  const canSuggestPriority = value.includes("|") && parts.length === 2;
  const priorityOptions = ["High", "Medium", "Low"].filter((p) =>
    p.toLowerCase().startsWith(lastPart.toLowerCase())
  );

  const suggestion = canSuggestPriority && lastPart && priorityOptions.length > 0 && !/^(high|medium|low)$/i.test(lastPart)
    ? priorityOptions[0]
    : "";
  const ghostText = suggestion ? suggestion.slice(lastPart.length) : "";

  let deadlinePreview = "";
  if (value.includes("|")) {
    const pipeCount = (value.match(/\|/g) || []).length;
    let deadlinePart = "";
    
    if (pipeCount >= 2) {
      deadlinePart = parts[2];
    } else if (pipeCount === 1 && !/^(high|medium|low)$/i.test(parts[1])) {
      // Fallback for Title | Deadline (if priority is skipped)
      deadlinePart = parts[1];
    }

    if (deadlinePart) {
      const parsed = parseDeadline(deadlinePart);
      if (parsed) {
        deadlinePreview = format(new Date(parsed), "PPP");
      }
    }
  }

  const handleSubmit = () => {
    if (!value.trim() || mutation.isPending) return;
    
    const taskData = parseQuickInput(value);
    if (!taskData.title) {
      setError("Title is mandatory");
      return;
    }
    
    mutation.mutate({
      ...taskData,
      list_id: activeListId === "all" ? "default" : activeListId
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" && ghostText) {
      e.preventDefault();
      const lastPipeIndex = value.lastIndexOf("|");
      const baseValue = value.substring(0, lastPipeIndex + 1);
      setValue(`${baseValue} ${suggestion}`);
    } else if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      setValue("");
      setError(null);
      inputRef.current?.blur();
    }
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  const renderDeadlinePreview = () => {
    if (!deadlinePreview) return null;
    
    const parsed = parseDeadline(parts[2] || parts[1]);
    if (!parsed) return <span>{deadlinePreview}</span>;
    
    const date = new Date(parsed);
    const day = date.getDate();
    const suffix = getOrdinalSuffix(day);
    const month = format(date, "MMMM");
    const year = format(date, "yyyy");

    return (
      <span className="flex items-center gap-0.5 normal-case">
        {month} {day}<span className="lowercase">{suffix}</span>, {year}
      </span>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-2"
    >
      <div className={cn(
        "relative group transition-all duration-300 ease-out",
        value ? "scale-[1.005]" : "scale-100"
      )}>
        <div className="relative flex items-center">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted/50 border border-muted-foreground/10 text-[10px] font-bold text-muted-foreground/60 shadow-sm">
              /
            </div>
          </div>
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFocused || value ? "Quick add: Task name | Priority (low/med/high) | Deadline (tomorrow, today, DD-MM-YYYY)" : "Press / to quickly add task"}
            className={cn(
              "pl-12 pr-12 h-12 text-sm font-medium rounded-2xl transition-all duration-300 border-muted-foreground/10 bg-muted/20",
              "focus-visible:ring-0 focus-visible:border-primary/20 focus-visible:bg-card shadow-sm",
              error && "border-red-500/50"
            )}
          />
          
          <div 
            className="absolute inset-y-0 left-0 flex items-center px-12 text-sm font-medium pointer-events-none select-none w-full overflow-hidden"
            aria-hidden="true"
          >
            <span className="invisible whitespace-pre">{value}</span>
            <span className="text-muted-foreground/20 whitespace-pre italic">{ghostText}</span>
          </div>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
             <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted/50 border border-muted-foreground/10 text-muted-foreground/40">
               <CornerDownLeft className="w-3 h-3" />
             </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 min-h-[20px]">
        <div className="flex items-center gap-4">
          <AnimatePresence mode="wait">
            {deadlinePreview && !error ? (
              <motion.div
                key="deadline-preview"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-1.5"
              >
                <div className="w-1 h-1 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold text-green-600/70 flex items-center gap-1">
                  <span className="uppercase tracking-wider">Deadline:</span>
                  {renderDeadlinePreview()}
                </span>
              </motion.div>
            ) : (
              <motion.span
                key="example"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-muted-foreground/40 font-medium"
              >
                Example: Push release v0.2.0 | high | tomorrow
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-4">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.span
                key="error"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[10px] font-bold text-red-500 uppercase tracking-wider"
              >
                {error}
              </motion.span>
            ) : ghostText ? (
              <motion.span
                key="tab-hint"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[10px] font-bold text-primary uppercase tracking-wider"
              >
                Tab to autocomplete
              </motion.span>
            ) : (
              <motion.span
                key="enter-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-muted-foreground/40 font-medium"
              >
                Press Enter to add
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
