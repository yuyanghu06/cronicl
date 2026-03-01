import { cn } from "@/lib/cn";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

interface TopBarProps {
  centerContent?: ReactNode;
  rightContent?: ReactNode;
}

export function TopBar({ centerContent, rightContent }: TopBarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <header className="h-12 bg-bg-base border-b border-border-subtle flex items-center justify-between px-5 shrink-0">
      <button
        onClick={() => navigate("/landing")}
        className={cn(
          "cursor-pointer bg-transparent border-none"
        )}
      >
        <DotMatrixText className="text-sm text-fg-dim hover:text-fg-max transition-colors">
          cronicl
        </DotMatrixText>
      </button>

      <div className="flex-1 flex justify-center">
        {centerContent}
      </div>

      <div className="flex items-center gap-3">
        {rightContent}
        <button className="text-fg-muted hover:text-fg-bright transition-colors cursor-pointer bg-transparent border-none">
          <Settings size={16} strokeWidth={1.5} />
        </button>
        <button
          onClick={logout}
          title="Log out"
          className="text-fg-muted hover:text-fg-bright transition-colors cursor-pointer bg-transparent border-none"
        >
          <LogOut size={16} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
