import { cn } from "@/lib/cn";
import type { ElementType, ReactNode } from "react";

interface DotMatrixTextProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export function DotMatrixText({
  children,
  className,
  as: Tag = "span",
}: DotMatrixTextProps) {
  return (
    <Tag
      className={cn(
        "font-display uppercase tracking-wider text-fg-max",
        className
      )}
    >
      {children}
    </Tag>
  );
}
