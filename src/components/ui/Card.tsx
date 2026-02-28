import { cn } from "@/lib/cn";
import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-bg-raised border border-border-subtle rounded-2xl p-6 transition-colors duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
