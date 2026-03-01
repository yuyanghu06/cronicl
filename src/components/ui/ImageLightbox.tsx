import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { sanitizeImageUrl } from "@/lib/sanitize";

interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function ImageLightbox({ imageUrl: rawImageUrl, onClose }: ImageLightboxProps) {
  const imageUrl = sanitizeImageUrl(rawImageUrl) ?? null;
  useEffect(() => {
    if (!imageUrl) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [imageUrl, onClose]);

  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 text-fg-muted hover:text-fg-bright transition-colors cursor-pointer bg-transparent border-none"
          >
            <X size={20} strokeWidth={1.5} />
          </button>

          {/* Image */}
          <motion.img
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            src={imageUrl}
            alt=""
            className="relative z-10 max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
