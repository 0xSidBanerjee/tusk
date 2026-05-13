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
        {/* Main Info Section */}
        <div className="bg-card rounded-2xl p-7 border border-muted/20 space-y-6 shadow-sm ring-1 ring-primary/5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary/40">
              <Sparkles className="w-3.5 h-3.5" />
              <label className="text-[9px] font-black uppercase tracking-[0.2em]">The Objective</label>
            </div>
            <Input
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the goal?"
              className="h-12 text-lg font-black rounded-xl border-none shadow-none bg-transparent px-3 focus-visible:ring-0 placeholder:text-muted-foreground/20"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary/40">
              <AlignLeft className="w-3.5 h-3.5" />
              <label className="text-[9px] font-black uppercase tracking-[0.2em]">Context</label>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add supplementary details..."
              rows={3}
              className="rounded-xl border-none shadow-none bg-transparent px-3 focus-visible:ring-0 resize-none font-medium leading-relaxed placeholder:text-muted-foreground/20 min-h-[80px]"
            />
          </div>
        </div>

        {/* Properties Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 group">
            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <Hash className="w-3.5 h-3.5" />
              <label className="text-[9px] font-black uppercase tracking-[0.2em]">Workspace</label>
            </div>
            <Select value={listId} onValueChange={(val) => setListId(val)}>
              <SelectTrigger className="h-12 rounded-xl bg-card border-muted/20 hover:border-primary/30 transition-all font-bold shadow-sm">
                <SelectValue placeholder="Inbox" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-muted/20 backdrop-blur-xl bg-card/95">
                <SelectItem value="default" className="rounded-lg py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="font-bold text-xs">Inbox</span>
                  </div>
                </SelectItem>
                {listsData?.data?.filter(l => l.id !== 'default').map((list) => (
                  <SelectItem key={list.id} value={list.id} className="rounded-lg py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: list.color }} />
                      <span className="font-bold text-xs">{list.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 group">
            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <Flag className="w-3.5 h-3.5" />
              <label className="text-[9px] font-black uppercase tracking-[0.2em]">Priority</label>
            </div>
            <Select value={priority || "none"} onValueChange={(val) => setPriority(val === "none" ? undefined : val as Priority)}>
              <SelectTrigger className="h-12 rounded-xl bg-card border-muted/20 hover:border-primary/30 transition-all font-bold shadow-sm">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-muted/20 backdrop-blur-xl bg-card/95">
                <SelectItem value="none" className="rounded-lg py-2 text-xs font-bold">None</SelectItem>
                <SelectItem value="High" className="rounded-lg py-2"><span className="text-red-500 font-bold text-xs">High</span></SelectItem>
                <SelectItem value="Medium" className="rounded-lg py-2"><span className="text-yellow-500 font-bold text-xs">Medium</span></SelectItem>
                <SelectItem value="Low" className="rounded-lg py-2"><span className="text-blue-500 font-bold text-xs">Low</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Section */}
        <div className="space-y-2 group">
          <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
            <CalendarIcon className="w-3.5 h-3.5" />
            <label className="text-[9px] font-black uppercase tracking-[0.2em]">Target Deadline</label>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-12 rounded-xl justify-between px-4 bg-card border-muted/20 hover:border-primary/30 transition-all font-bold shadow-sm",
                  !deadline && "text-muted-foreground/50 font-medium"
                )}
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 opacity-50" />
                  {deadline ? format(deadline, "PPP") : <span>Select a date...</span>}
                </div>
                <ChevronDown className="w-4 h-4 opacity-30" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-muted/20 overflow-hidden backdrop-blur-xl bg-card/95" align="start">
              <CalendarCustom
                selected={deadline}
                onSelect={(date) => setDeadline(date)}
              />
              <div className="p-3 border-t border-muted/10 bg-muted/5 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] font-black uppercase tracking-widest text-primary h-7 rounded-lg"
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
