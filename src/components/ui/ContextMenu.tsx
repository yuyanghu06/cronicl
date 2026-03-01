import { useEffect, useRef, type ReactNode } from "react";
import { SyntMonoText } from "@/components/ui/SyntMonoText";

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  variant?: "default" | "danger";
  disabled?: boolean;
  onSelect: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Adjust position if menu overflows viewport
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      el.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      el.style.top = `${y - rect.height}px`;
    }
  }, [x, y]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] py-1 bg-bg-raised border border-border-subtle rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-100"
      style={{ left: x, top: y }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          disabled={item.disabled}
          onClick={() => {
            item.onSelect();
            onClose();
          }}
          className={`w-full px-3 py-2 flex items-center gap-2.5 text-left transition-colors cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed ${
            item.variant === "danger"
              ? "text-red hover:bg-red/10"
              : "text-fg-dim hover:text-fg-bright hover:bg-bg-hover"
          }`}
        >
          {item.icon && (
            <span className="shrink-0 w-4 h-4 flex items-center justify-center">
              {item.icon}
            </span>
          )}
          <SyntMonoText className="text-xs">
            {item.label}
          </SyntMonoText>
        </button>
      ))}
    </div>
  );
}
