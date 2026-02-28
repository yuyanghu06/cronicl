import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { AIChatRoom } from "@/components/home/AIChatRoom";
import { mockProjects } from "@/data/mock-projects";
import type { Project } from "@/types/project.ts";
import { PanelLeftClose, PanelLeftOpen, BookOpen } from "lucide-react";

export function HomePage() {
  const navigate = useNavigate();
  const [messageCount, setMessageCount] = useState(0);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [sessionId] = useState(
    () => `SES-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  );

  useEffect(() => {
    // Simulate loading delay then use mock data
    const timer = setTimeout(() => {
      setProjects(mockProjects);
      setIsLoadingProjects(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleTimelineCreated = (timelineId: string) => {
    navigate(`/editor/${timelineId}`);
  };

  return (
    <AppShell
      statusLeft="STORY_ARCHITECT // ONLINE"
      statusCenter={`${messageCount} MESSAGES`}
      statusRight={sessionId}
    >
      <div className="flex h-full">
        {/* Left sidebar — collapses to icon strip */}
        <aside
          className={`border-r border-border-subtle shrink-0 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
            sidebarExpanded ? "w-64" : "w-14"
          }`}
        >
          {/* Header row */}
          <div
            className={`px-3 py-3 border-b border-border-subtle flex items-center shrink-0 ${
              sidebarExpanded ? "justify-between" : "justify-center"
            }`}
          >
            {sidebarExpanded && (
              <DotMatrixText className="text-xs text-fg-dim tracking-[0.2em] truncate">
                RECENT PROJECTS
              </DotMatrixText>
            )}
            <button
              onClick={() => setSidebarExpanded((v) => !v)}
              className="p-1.5 text-fg-muted hover:text-fg-bright hover:bg-bg-hover rounded-xl transition-colors shrink-0"
              title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarExpanded ? (
                <PanelLeftClose size={16} strokeWidth={1.5} />
              ) : (
                <PanelLeftOpen size={16} strokeWidth={1.5} />
              )}
            </button>
          </div>

          {/* Project list */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {isLoadingProjects ? (
              <div className="px-4 py-3">
                <SyntMonoText className="text-[10px] text-fg-muted">
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
                  title={!sidebarExpanded ? project.name : undefined}
                  className={`w-full border-b border-border-subtle hover:bg-bg-hover transition-colors cursor-pointer bg-transparent flex items-center gap-3 ${
                    sidebarExpanded ? "text-left px-4 py-3" : "justify-center px-0 py-3"
                  }`}
                >
                  {/* Icon — always visible */}
                  <span className="shrink-0 w-7 h-7 rounded-xl bg-bg-raised border border-border-subtle flex items-center justify-center text-fg-muted group-hover:text-fg-bright transition-colors">
                    <BookOpen size={13} strokeWidth={1.5} />
                  </span>

                  {/* Text — only in expanded state */}
                  {sidebarExpanded && (
                    <span className="flex flex-col min-w-0">
                      <SyntMonoText className="text-sm text-fg-bright truncate block">
                        {project.name}
                      </SyntMonoText>
                      <SyntMonoText className="text-xs text-fg-muted truncate">
                        {project.nodeCount} nodes · {project.lastEdited}
                      </SyntMonoText>
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main chat column */}
        <div className="flex-1 flex flex-col min-w-0">
          <AIChatRoom
            onMessageCountChange={setMessageCount}
            onTimelineCreated={handleTimelineCreated}
          />
        </div>
      </div>
    </AppShell>
  );
}
