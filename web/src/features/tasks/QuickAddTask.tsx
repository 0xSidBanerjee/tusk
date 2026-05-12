import React, { useState, useRef } from "react";
import * as chrono from "chrono-node";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "../../api/tasks";
import { parseQuickInput } from "../../utils/parseQuickInput";
import { Input } from "@/components/ui/input";
import { CornerDownLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function QuickAddTask() {
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
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || "Failed to add task");
    },
  });

  const parts = value.split("|").map((p) => p.trim());
  const lastPart = parts[parts.length - 1] || "";
  
  const canSuggestPriority = value.includes("|") && (parts.length === 2 || parts.length === 3);
  const priorityOptions = ["High", "Medium", "Low"].filter((p) =>
    p.toLowerCase().startsWith(lastPart.toLowerCase())
  );

  // Ghost text logic
  const suggestion = canSuggestPriority && lastPart && priorityOptions.length > 0 && !/^(high|medium|low)$/i.test(lastPart)
    ? priorityOptions[0]
    : "";
  const ghostText = suggestion ? suggestion.slice(lastPart.length) : "";

  // Deadline preview logic
  let deadlinePreview = "";
  if (value.includes("|")) {
    const pipeCount = (value.match(/\|/g) || []).length;
    let deadlinePart = "";
    
    if (pipeCount === 1) {
      if (!/^(high|medium|low)$/i.test(parts[1])) {
        deadlinePart = parts[1];
      }
    } else if (pipeCount >= 2) {
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
    
    const task = parseQuickInput(value);
    if (!task.title) {
      setError("Title is mandatory");
      return;
    }
    
    mutation.mutate(task);
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
    <div className="w-full space-y-2">
      <div className={cn(
        "relative group transition-all duration-500 ease-out",
        value ? "scale-[1.005]" : "scale-100"
      )}>
        <div className="relative flex items-center">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Fix login bug | tomorrow | high"
            className={cn(
              "pr-10 h-12 text-base shadow-sm transition-all focus-visible:ring-4 focus-visible:ring-primary/10 border-muted-foreground/20",
              error && "border-destructive focus-visible:ring-destructive/10"
            )}
          />

          
          {/* Ghost Text Overlay */}
          <div 
            className="absolute inset-y-0 left-0 flex items-center px-2.5 text-base pointer-events-none select-none w-full overflow-hidden"
            aria-hidden="true"
          >
            <span className="invisible whitespace-pre">{value}</span>
            <span className="text-muted-foreground/30 whitespace-pre">{ghostText}</span>
          </div>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
             {mutation.isPending && (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            )}
            <CornerDownLeft className={cn(
              "w-4 h-4 transition-colors",
              value ? "text-primary/50" : "text-muted-foreground/10"
            )} />
          </div>
        </div>
      </div>


      <div className="flex justify-between items-start px-1 min-h-[20px]">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {ghostText && (
            <span className="text-[11px] text-primary/60 font-medium animate-in fade-in slide-in-from-top-1 flex items-center gap-1.5">
              <span className="flex items-center gap-1">
                Press <kbd className="bg-muted px-1.5 py-0.5 rounded border border-muted-foreground/20 text-[9px] shadow-sm font-sans uppercase tracking-wider">Tab</kbd>
              </span>
              to autocomplete priority
            </span>
          )}
          {deadlinePreview && !error && (
            <span className="text-[11px] text-muted-foreground animate-in fade-in slide-in-from-top-1 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
              → {deadlinePreview}
            </span>
          )}
          {error && (
            <span className="text-[11px] text-destructive font-semibold animate-in fade-in slide-in-from-top-1">
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

