import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "default" | "destructive";
}

export function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  confirmVariant = "destructive"
}: AlertModalProps) {
  // Close on Escape
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/40 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-muted-foreground/10 bg-card/90 shadow-[0_25px_70px_rgba(0,0,0,0.15)] backdrop-blur-3xl p-7"
          >
            <div className="flex gap-5">
              <div className={cn(
                "w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center",
                confirmVariant === "destructive" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
              )}>
                <AlertCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              
              <div className="flex-1 space-y-2.5">
                <h3 className="text-[18px] font-black tracking-tight text-foreground leading-tight">{title}</h3>
                <p className="text-[13px] font-medium text-muted-foreground/50 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-10">
              <Button
                onClick={onClose}
                variant="ghost"
                className="h-11 rounded-xl font-bold text-[13px] text-muted-foreground/50 hover:text-foreground transition-all duration-300 px-5"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                variant="ghost"
                className={cn(
                  "h-11 rounded-xl font-black text-[13px] transition-all duration-300 active:scale-95 px-6",
                  confirmVariant === "destructive" 
                    ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20" 
                    : "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
                )}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
