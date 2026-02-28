import { cn } from "@/lib/cn";

interface StatusBarProps {
  left?: string;
  center?: string;
  right?: string;
}

export function StatusBar({
  left = "READY",
  center = "",
  right = "",
}: StatusBarProps) {
  return (
    <footer className="h-9 bg-bg-base border-t border-border-subtle flex items-center justify-between px-5 shrink-0 font-display text-xs text-fg-muted uppercase tracking-widest rounded-t-xl">
      <span className={cn(left && "text-fg-dim")}>{left}</span>
      <span>{center}</span>
      <span>{right}</span>
    </footer>
  );
}
