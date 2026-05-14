import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLists } from "../../api/lists";
import { Task, Priority } from "../../types/task";
import { cn } from "../../lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarCustom } from "@/components/ui/calendar-custom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Flag, Hash, AlignLeft, CheckCircle2, ChevronDown, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";

interface TaskFormProps {
  initialData?: Task;
  onSubmit: (data: Partial<Task>) => void;
  onCancel: () => void;
}

export function TaskForm({ initialData, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [listId, setListId] = useState<string>(
    initialData?.list_id || "default"
  );
  const [priority, setPriority] = useState<Priority | undefined>(initialData?.priority);
  const [deadline, setDeadline] = useState<Date | undefined>(
    initialData?.deadline ? parseISO(initialData.deadline) : undefined
  );

  const { data: listsData } = useQuery({
    queryKey: ["lists"],
    queryFn: getLists,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title,
      description: description || undefined,
      list_id: listId,
      priority: priority || undefined,
      deadline: deadline?.toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        <div className="space-y-8">
          {/* Objective Field */}
          <div className="space-y-3 group">
            <div className="flex items-center gap-2.5 px-1">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/70">The Objective</label>
            </div>
            <div className="relative">
              <Input
                autoFocus
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's the goal?"
                className="h-16 text-2xl font-black rounded-[24px] border-2 border-primary/10 bg-secondary/30 px-6 transition-all focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary/40 focus-visible:bg-background placeholder:text-muted-foreground/20 shadow-sm"
              />
            </div>
          </div>

          {/* Context Field */}
          <div className="space-y-3 group">
            <div className="flex items-center gap-2.5 px-1">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                <AlignLeft className="w-3.5 h-3.5" />
              </div>
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500/70">Context</label>
            </div>
            <div className="relative">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add supplementary details..."
                rows={4}
                className="rounded-[24px] border-2 border-muted-foreground/10 bg-secondary/30 px-6 py-5 transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500/30 focus-visible:bg-background resize-none font-medium text-base leading-relaxed placeholder:text-muted-foreground/20 min-h-[140px] shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3 group">
            <div className="flex items-center gap-2.5 px-1">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                <Hash className="w-3.5 h-3.5" />
              </div>
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500/70">Workspace</label>
            </div>
            <Select value={listId} onValueChange={(val) => setListId(val)}>
              <SelectTrigger className="h-16 rounded-[20px] bg-secondary/30 border-2 border-muted-foreground/10 hover:border-blue-500/30 hover:bg-secondary/50 transition-all font-bold shadow-sm px-5">
                <SelectValue placeholder="Inbox" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-2xl border-muted-foreground/10 backdrop-blur-2xl bg-card/95 p-1">
                <SelectItem value="default" className="rounded-xl py-3 pl-10 pr-4 focus:bg-blue-500/10 focus:text-blue-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
                    <span className="font-bold text-sm">Inbox</span>
                  </div>
                </SelectItem>
                {listsData?.data?.filter(l => l.id !== 'default').map((list) => (
                  <SelectItem key={list.id} value={list.id} className="rounded-xl py-3 pl-10 pr-4 focus:bg-blue-500/10 focus:text-blue-600 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: list.color }} />
                      <span className="font-bold text-sm">{list.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 group">
            <div className="flex items-center gap-2.5 px-1">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <Flag className="w-3.5 h-3.5" />
              </div>
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500/70">Priority</label>
            </div>
            <Select value={priority || "none"} onValueChange={(val) => setPriority(val === "none" ? undefined : val as Priority)}>
              <SelectTrigger className="h-16 rounded-[20px] bg-secondary/30 border-2 border-muted-foreground/10 hover:border-amber-500/30 hover:bg-secondary/50 transition-all font-bold shadow-sm px-5">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-2xl border-muted-foreground/10 backdrop-blur-2xl bg-card/95 p-1">
                <SelectItem value="none" className="rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:bg-muted/20">None</SelectItem>
                <SelectItem value="High" className="rounded-xl py-3 pl-10 pr-4 focus:bg-red-500/10 transition-colors"><span className="text-red-500 font-black text-sm">High</span></SelectItem>
                <SelectItem value="Medium" className="rounded-xl py-3 pl-10 pr-4 focus:bg-amber-500/10 transition-colors"><span className="text-amber-500 font-black text-sm">Medium</span></SelectItem>
                <SelectItem value="Low" className="rounded-xl py-3 pl-10 pr-4 focus:bg-blue-500/10 transition-colors"><span className="text-blue-500 font-black text-sm">Low</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Section */}
        <div className="space-y-3 group">
          <div className="flex items-center gap-2.5 px-1">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
              <CalendarIcon className="w-3.5 h-3.5" />
            </div>
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-500/70">Target Deadline</label>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-16 rounded-[20px] justify-between px-6 bg-secondary/30 border-2 border-muted-foreground/10 hover:border-rose-500/30 hover:bg-secondary/50 transition-all font-bold shadow-sm",
                  !deadline && "text-muted-foreground/20 font-medium"
                )}
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-4 h-4 text-rose-500/50" />
                  {deadline ? format(deadline, "PPP") : <span className="text-muted-foreground/30">Select a date...</span>}
                </div>
                <ChevronDown className="w-4 h-4 opacity-20" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-3xl shadow-2xl border-muted-foreground/10 overflow-hidden backdrop-blur-3xl bg-card/95" align="start">
              <CalendarCustom
                selected={deadline}
                onSelect={(date) => setDeadline(date)}
              />
              <div className="p-4 border-t border-muted/10 bg-muted/5 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[11px] font-black uppercase tracking-widest text-primary h-8 rounded-xl hover:bg-primary/10 transition-colors"
                  onClick={() => setDeadline(undefined)}
                >
                  Clear Date
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-muted/50">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="rounded-xl px-6 h-12 font-bold text-muted-foreground hover:bg-muted transition-all"
        >
          Discard
        </Button>
        <Button
          type="submit"
          className="rounded-xl px-10 h-12 font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 bg-primary text-primary-foreground"
        >
          {initialData ? "Update Task" : "Create Task"}
        </Button>
      </div>
    </form>
  );
}
