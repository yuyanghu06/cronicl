import { cn } from "@/lib/cn";
import { Settings } from "lucide-react";
import { useNavigate } from "react-router";
import type { ReactNode } from "react";

interface TopBarProps {
  centerContent?: ReactNode;
  rightContent?: ReactNode;
}

/** Letter-by-letter wave highlight on hover — CSS-driven to avoid snap on mouse-leave */
function WaveLogo({ text }: { text: string }) {
  return (
    <span className="logo-wave font-display uppercase tracking-wider inline-flex select-none">
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="logo-wave-letter inline-block"
          style={{ "--i": i } as React.CSSProperties}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

export function TopBar({ centerContent, rightContent }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-bg-base border-b border-border-subtle flex items-center justify-between px-5 shrink-0 rounded-b-lg">
      <button
        onClick={() => navigate("/home")}
        className={cn(
          "cursor-pointer bg-transparent border-none flex items-center gap-2"
        )}
      >
        <img src="/logo.png" alt="cronicl logo" className="h-7 w-7 rounded-md" />
        <WaveLogo text="cronicl" />
      </button>

      <div className="flex-1 flex justify-center">
        {centerContent}
      </div>

      <div className="flex items-center gap-3">
        {rightContent}
        <button
          className="text-fg-muted hover:text-fg-bright transition-colors cursor-pointer bg-transparent border-none p-1.5 rounded-lg hover:bg-bg-hover"
        >
          <Settings size={18} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
