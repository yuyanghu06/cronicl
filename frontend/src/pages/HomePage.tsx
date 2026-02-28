import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { AIChatRoom } from "@/components/home/AIChatRoom";
import { listTimelines } from "@/lib/api";
import type { ApiTimeline } from "@/lib/api";

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export function HomePage() {
  const navigate = useNavigate();
  const [messageCount, setMessageCount] = useState(0);
  const [sessionId] = useState(
    () => `SES-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  );
  const [projects, setProjects] = useState<ApiTimeline[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    listTimelines()
      .then((rows) => {
        setProjects(rows);
        setLoadingProjects(false);
      })
      .catch((err) => {
        console.error("Failed to load timelines:", err);
        setLoadingProjects(false);
      });
  }, []);

  return (
    <AppShell
      statusLeft="STORY_ARCHITECT // ONLINE"
      statusCenter={`${messageCount} MESSAGES`}
      statusRight={sessionId}
    >
      <div className="flex h-full">
        {/* Left sidebar — recent projects */}
        <aside className="w-60 border-r border-border-subtle shrink-0 flex flex-col">
          <div className="px-4 py-3 border-b border-border-subtle">
            <DotMatrixText className="text-[10px] text-fg-dim tracking-[0.2em]">
              RECENT PROJECTS
            </DotMatrixText>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingProjects ? (
              <div className="px-4 py-3">
                <SyntMonoText className="text-[10px] text-fg-muted animate-pulse">
                  LOADING...
                </SyntMonoText>
              </div>
            ) : projects.length === 0 ? (
              <div className="px-4 py-3">
                <SyntMonoText className="text-[10px] text-fg-muted">
                  NO PROJECTS YET
                </SyntMonoText>
              </div>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => navigate(`/editor/${project.id}`)}
                  className="w-full text-left px-4 py-3 border-b border-border-subtle hover:bg-bg-hover transition-colors cursor-pointer bg-transparent"
                >
                  <SyntMonoText className="text-xs text-fg-bright block mb-0.5">
                    {project.title}
                  </SyntMonoText>
                  <SyntMonoText className="text-[10px] text-fg-muted">
                    {project.nodeCount ?? 0} nodes // {formatTimeAgo(project.updatedAt)}
                  </SyntMonoText>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Right chat column */}
        <div className="flex-1 flex flex-col min-w-0">
          <AIChatRoom onMessageCountChange={setMessageCount} />
        </div>
      </div>
    </AppShell>
  );
}
