import { cn } from "@/lib/cn";
import type { ElementType, ReactNode } from "react";

interface SyntMonoTextProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export function SyntMonoText({
  children,
  className,
  as: Tag = "span",
}: SyntMonoTextProps) {
  return (
    <Tag className={cn("font-system text-fg-dim text-sm", className)}>
      {children}
    </Tag>
  );
}
