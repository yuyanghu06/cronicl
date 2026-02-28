import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type BadgeVariant = "default" | "active" | "generating";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-bg-hover text-fg-dim border-border-base",
  active: "bg-transparent text-red border-red",
  generating: "bg-transparent text-red border-red animate-pulse-red",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "font-display text-xs uppercase tracking-widest px-2 py-0.5 border rounded-sm inline-flex items-center gap-1.5",
        variantStyles[variant],
        className
      )}
    >
      {variant !== "default" && (
        <span className="w-1.5 h-1.5 rounded-full bg-red inline-block" />
      )}
      {children}
    </span>
  );
}
