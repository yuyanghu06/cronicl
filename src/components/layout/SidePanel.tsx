import { cn } from "@/lib/cn";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function SidePanel({ open, onClose, children, title = "Node Detail" }: SidePanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "bg-bg-base border-l border-border-subtle overflow-hidden shrink-0 flex flex-col rounded-l-2xl"
          )}
        >
          <div className="flex items-center justify-between px-5 h-10 border-b border-border-subtle shrink-0">
            <span className="font-display text-xs text-fg-dim uppercase tracking-widest">
              {title}
            </span>
            <button
              onClick={onClose}
              className="text-fg-muted hover:text-fg-bright transition-colors cursor-pointer bg-transparent border-none"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
