import { useState, useEffect } from "react";
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
import { Calendar as CalendarIcon, Flag, Hash, AlignLeft, CheckCircle2, ChevronDown, Sparkles, ChevronLeft } from "lucide-react";
import { format, parseISO, addDays, addWeeks, nextSaturday, startOfWeek } from "date-fns";
import { Sun, Sunrise, CalendarRange, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [dateInput, setDateInput] = useState(
    initialData?.deadline ? format(parseISO(initialData.deadline), "dd-MM-yyyy") : ""
  );
  const [showCalendar, setShowCalendar] = useState(false);

  const { data: listsData } = useQuery({
    queryKey: ["lists"],
    queryFn: getLists,
  });

  useEffect(() => {
    if (deadline) {
      setDateInput(format(deadline, "dd-MM-yyyy"));
    } else {
      setDateInput("");
    }
  }, [deadline]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title,
      description: description || undefined,
      list_id: listId,
      priority: priority || undefined,
      deadline: deadline ? deadline.toISOString() : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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
                className="h-16 text-2xl font-black rounded-[24px] border-2 border-primary/10 bg-secondary/30 px-6 transition-all duration-300 focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary/40 focus-visible:bg-background placeholder:text-muted-foreground/20 shadow-sm"
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
                className="rounded-[24px] border-2 border-muted-foreground/10 bg-secondary/30 px-6 py-5 transition-all duration-300 focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500/30 focus-visible:bg-background resize-none font-medium text-base leading-relaxed placeholder:text-muted-foreground/20 min-h-[140px] shadow-sm"
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
              <SelectTrigger className="h-16 rounded-[20px] bg-secondary/30 border-2 border-muted-foreground/10 hover:border-blue-500/30 hover:bg-secondary/50 transition-all duration-300 font-bold shadow-sm px-5">
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
              <SelectTrigger className="h-16 rounded-[20px] bg-secondary/30 border-2 border-muted-foreground/10 hover:border-amber-500/30 hover:bg-secondary/50 transition-all duration-300 font-bold shadow-sm px-5">
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
              <div
                className={cn(
                  "w-full h-16 rounded-[20px] flex items-center justify-between px-6 bg-secondary/30 border-2 border-muted-foreground/10 hover:border-rose-500/30 hover:bg-secondary/50 transition-all duration-300 font-bold shadow-sm cursor-pointer",
                  !deadline && "text-muted-foreground/20 font-medium"
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  <CalendarIcon className="w-4 h-4 text-rose-500/50" />
                  <input
                    type="text"
                    placeholder="DD-MM-YYYY..."
                    className="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 outline-none w-full placeholder:text-muted-foreground/20"
                    value={dateInput}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDateInput(val);

                      const parts = val.split(/[-/]/);
                      if (parts.length === 3) {
                        const day = parseInt(parts[0]);
                        const month = parseInt(parts[1]) - 1;
                        let year = parseInt(parts[2]);
                        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                          if (year < 100) {
                            year += year > 50 ? 1900 : 2000;
                          }
                          const date = new Date(year, month, day);
                          if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
                            setDeadline(date);
                          }
                        }
                      } else if (val === "") {
                        setDeadline(undefined);
                      }
                    }}
                  />
                </div>
                <ChevronDown className="w-4 h-4 opacity-20" />
              </div>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-0 rounded-3xl shadow-2xl border-muted-foreground/10 overflow-hidden backdrop-blur-3xl bg-card/95" 
              align="start"
              onCloseAutoFocus={() => setShowCalendar(false)}
            >
              <AnimatePresence mode="wait">
                {!showCalendar ? (
                  <motion.div
                    key="suggestions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 space-y-1"
                  >
                    <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Suggestions</p>
                    <div className="grid grid-cols-1 gap-1">
                      {[
                        { label: "Today", date: new Date(), icon: Sun, color: "text-amber-500" },
                        { label: "Tomorrow", date: addDays(new Date(), 1), icon: Sunrise, color: "text-orange-500" },
                        { label: "This Weekend", date: nextSaturday(new Date()), icon: CalendarRange, color: "text-blue-500" },
                        { label: "Next Week", date: startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }), icon: CalendarDays, color: "text-indigo-500" },
                      ].map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setDeadline(s.date)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("p-1.5 rounded-lg bg-background border border-muted/10 shadow-sm transition-transform group-hover:scale-110", s.color)}>
                              <s.icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-xs font-bold text-foreground">{s.label}</span>
                              <span className="text-[10px] font-medium text-muted-foreground/50">{format(s.date, "EEEE, MMM d")}</span>
                            </div>
                          </div>
                          {deadline && format(deadline, "yyyy-MM-dd") === format(s.date, "yyyy-MM-dd") && (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                    
                    <div className="h-px bg-muted/10 my-2 mx-3" />
                    
                    <button
                      type="button"
                      onClick={() => setShowCalendar(true)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors group"
                    >
                      <div className="p-1.5 rounded-lg bg-background border border-muted/10 shadow-sm transition-transform group-hover:scale-110 text-muted-foreground">
                        <CalendarIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-bold text-foreground">Custom</span>
                        <span className="text-[10px] font-medium text-muted-foreground/50">Use calendar to pick a date</span>
                      </div>
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="calendar"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-1"
                  >
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full"
                        onClick={() => setShowCalendar(false)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Custom Date</p>
                    </div>
                    <CalendarCustom
                      selected={deadline}
                      onSelect={(date) => setDeadline(date)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="p-4 border-t border-muted/10 bg-muted/5 flex justify-between items-center">
                <p className="text-[10px] font-medium text-muted-foreground/40">
                  {deadline ? `Selected: ${format(deadline, "MMM d, yyyy")}` : "No date selected"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[11px] font-black uppercase tracking-widest text-primary h-8 rounded-xl hover:bg-primary/10 transition-colors"
                  onClick={() => setDeadline(undefined)}
                >
                  Clear
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
          className="rounded-xl px-6 h-12 font-bold text-muted-foreground hover:bg-muted transition-all duration-300"
        >
          Discard
        </Button>
        <Button
          type="submit"
          className="rounded-xl px-10 h-12 font-black shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 bg-primary text-primary-foreground"
        >
          {initialData ? "Update Task" : "Create Task"}
        </Button>
      </div>
    </form>
  );
}
