import { useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { AIChatRoom } from "@/components/home/AIChatRoom";
import { mockProjects } from "@/data/mock-projects";

export function HomePage() {
  const navigate = useNavigate();
  const [messageCount, setMessageCount] = useState(0);
  const [sessionId] = useState(
    () => `SES-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  );

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
            {mockProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/editor/${project.id}`)}
                className="w-full text-left px-4 py-3 border-b border-border-subtle hover:bg-bg-hover transition-colors cursor-pointer bg-transparent"
              >
                <SyntMonoText className="text-xs text-fg-bright block mb-0.5">
                  {project.name}
                </SyntMonoText>
                <SyntMonoText className="text-[10px] text-fg-muted">
                  {project.nodeCount} nodes // {project.lastEdited}
                </SyntMonoText>
              </button>
            ))}
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
