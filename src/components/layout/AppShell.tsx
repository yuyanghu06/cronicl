import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBar } from "@/components/layout/StatusBar";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  showTopBar?: boolean;
  showStatusBar?: boolean;
  topBarCenter?: ReactNode;
  topBarRight?: ReactNode;
  statusLeft?: string;
  statusCenter?: string;
  statusRight?: string;
}

export function AppShell({
  children,
  showTopBar = true,
  showStatusBar = true,
  topBarCenter,
  topBarRight,
  statusLeft,
  statusCenter,
  statusRight,
}: AppShellProps) {
  return (
    <div className="min-h-screen h-screen bg-bg-void text-fg-base flex flex-col overflow-hidden">
      <ScanlineOverlay />
      {showTopBar && (
        <TopBar centerContent={topBarCenter} rightContent={topBarRight} />
      )}
      <main className="flex-1 relative overflow-hidden">{children}</main>
      {showStatusBar && (
        <StatusBar left={statusLeft} center={statusCenter} right={statusRight} />
      )}
    </div>
  );
}
