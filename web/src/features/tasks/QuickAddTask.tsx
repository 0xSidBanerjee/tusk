import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as chrono from "chrono-node";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "../../api/tasks";
import { parseQuickInput } from "../../utils/parseQuickInput";
import { Input } from "@/components/ui/input";
import { CornerDownLeft, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function QuickAddTask({ activeListId }: { activeListId: string }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

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
      const parsed = chrono.parseDate(deadlinePart);
      if (parsed) {
        deadlinePreview = format(parsed, "PPP");
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
      list_id: activeListId === "all" ? null : activeListId
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-2 mb-4"
    >
      <div className={cn(
        "relative group transition-all duration-700 ease-out",
        value ? "scale-[1.01]" : "scale-100"
      )}>
        <div className="relative flex items-center">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Plus className="w-4 h-4 text-muted-foreground/40" />
          </div>
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Add task: Title | high | tomorrow"
            className={cn(
              "pl-10 pr-12 h-11 text-base font-bold rounded-xl transition-all border-muted-foreground/10 bg-muted/30",
              "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/30 focus-visible:bg-card",
              error && "border-red-500/50 focus-visible:ring-red-500/5"
            )}
          />
          
          <div 
            className="absolute inset-y-0 left-0 flex items-center px-[41px] text-lg font-bold pointer-events-none select-none w-full overflow-hidden"
            aria-hidden="true"
          >
            <span className="invisible whitespace-pre">{value}</span>
            <span className="text-muted-foreground/20 whitespace-pre italic">{ghostText}</span>
          </div>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
             <div className={cn(
               "flex items-center justify-center w-6 h-6 rounded-md border border-muted-foreground/20 transition-all",
               value ? "bg-primary border-primary shadow-sm" : "bg-transparent"
             )}>
               <CornerDownLeft className={cn("w-3 h-3", value ? "text-primary-foreground" : "text-muted-foreground/30")} />
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 px-4 min-h-[24px]">
        <AnimatePresence mode="wait">
          {ghostText && (
            <motion.div
              key="ghost-hint"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <span className="text-xs text-muted-foreground/60 font-medium">
                Tab to autocomplete priority
              </span>
            </motion.div>
          )}

          {deadlinePreview && !error && (
            <motion.div
              key="deadline-preview"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{deadlinePreview}</span>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
