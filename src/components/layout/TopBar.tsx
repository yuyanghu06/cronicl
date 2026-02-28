import { cn } from "@/lib/cn";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { Settings, User, LogOut, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/lib/auth.tsx";
import { useTheme } from "@/lib/theme";
import { useState } from "react";
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
  const { user, isAuthenticated, login, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

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
          onClick={toggleTheme}
          className="text-fg-muted hover:text-fg-bright transition-colors cursor-pointer bg-transparent border-none p-1.5 rounded-lg hover:bg-bg-hover"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="text-fg-muted hover:text-fg-bright transition-colors cursor-pointer bg-transparent border-none p-1.5 rounded-lg hover:bg-bg-hover"
        >
          <Settings size={18} strokeWidth={1.5} />
        </button>

        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="text-fg-muted hover:text-fg-bright transition-colors cursor-pointer bg-transparent border-none flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-hover"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-bg-raised border border-border-subtle flex items-center justify-center">
                  <SyntMonoText className="text-[9px] text-fg-bright">
                    {(user.name ?? user.email)?.[0]?.toUpperCase() ?? "U"}
                  </SyntMonoText>
                </div>
              )}
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 bg-bg-raised border border-border-subtle rounded-xl py-1 min-w-36">
                  <div className="px-3 py-1.5 border-b border-border-subtle">
                    <SyntMonoText className="text-[10px] text-fg-muted block">
                      {user.name ?? user.email}
                    </SyntMonoText>
                  </div>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-1.5 text-fg-muted hover:text-fg-bright hover:bg-bg-hover transition-colors cursor-pointer bg-transparent border-none flex items-center gap-2"
                  >
                    <LogOut size={12} strokeWidth={1.5} />
                    <SyntMonoText className="text-[10px]">
                      LOGOUT
                    </SyntMonoText>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={login}
            className="text-fg-muted hover:text-fg-bright transition-colors cursor-pointer bg-transparent border-none p-1.5 rounded-lg hover:bg-bg-hover"
          >
            <User size={18} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </header>
  );
}
