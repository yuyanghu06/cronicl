import { cn } from "@/lib/cn";
import type { ElementType, ReactNode } from "react";

interface CourierTextProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export function CourierText({
  children,
  className,
  as: Tag = "p",
}: CourierTextProps) {
  return (
    <Tag
      className={cn("font-narrative text-fg-bright leading-relaxed", className)}
    >
      {children}
    </Tag>
  );
}
