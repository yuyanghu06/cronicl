import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./Button";
import { SyntMonoText } from "./SyntMonoText";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onCancel}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" />

          {/* Dialog */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-sm bg-bg-raised border border-border-subtle rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <SyntMonoText className="text-sm text-fg-bright tracking-wide block mb-2">
              {title}
            </SyntMonoText>
            <SyntMonoText className="text-xs text-fg-dim leading-relaxed block mb-6">
              {message}
            </SyntMonoText>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button variant="primary" size="sm" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
