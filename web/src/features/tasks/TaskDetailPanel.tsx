import { motion, AnimatePresence } from "framer-motion";
import { Info, Plus, X } from "lucide-react";
import { Task } from "../../types/task";
import { TaskForm } from "./TaskForm";

interface TaskDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onSubmit: (data: Partial<Task>) => void;
  title: string;
}

export function TaskDetailPanel({ isOpen, onClose, task, onSubmit, title }: TaskDetailPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay for clicking outside */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/20 backdrop-blur-[2px] cursor-default"
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full max-w-[480px] z-50 bg-card/95 backdrop-blur-2xl border-l border-muted/20 shadow-[-20px_0_50px_-20px_rgba(0,0,0,0.1)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 shrink-0 border-b border-muted/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {task ? <Info className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <h2 className="text-xl font-black tracking-tight">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground/40 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-8">
              <TaskForm
                initialData={task || undefined}
                onSubmit={(data) => {
                  onSubmit(data);
                  onClose();
                }}
                onCancel={onClose}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
