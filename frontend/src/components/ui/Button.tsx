import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-red text-white hover:shadow-glow-red active:brightness-90",
  secondary:
    "border border-border-strong text-fg-bright bg-transparent hover:bg-bg-hover hover:text-fg-max",
  ghost:
    "text-fg-dim hover:text-fg-bright",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 tracking-widest uppercase",
  md: "text-sm px-5 py-2.5 tracking-wide",
  lg: "text-base px-8 py-3 tracking-wide",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "font-system rounded-xl cursor-pointer transition-all duration-200 inline-flex items-center justify-center gap-2",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
