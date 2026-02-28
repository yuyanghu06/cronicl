import { useState, useMemo, useCallback } from "react";
import { useParams } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { SidePanel } from "@/components/layout/SidePanel";
import { TimelineCanvas } from "@/components/editor/TimelineCanvas";
import { NodePanel } from "@/components/editor/NodePanel";
import { CourierText } from "@/components/ui/CourierText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { mockTimeline } from "@/data/mock-timeline";
import { mockProjects } from "@/data/mock-projects";
import { GitBranch, Save } from "lucide-react";
import type { TimelineNode } from "@/types/node";

export function EditorPage() {
  const { projectId } = useParams();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<TimelineNode[]>(mockTimeline);

  const project = mockProjects.find((p) => p.id === projectId) ?? mockProjects[0];

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const onSaveNode = useCallback(
    (nodeId: string, updates: { label: string; plotSummary: string }) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, label: updates.label, plotSummary: updates.plotSummary } : n
        )
      );
    },
    []
  );

  const onGenerateBranch = useCallback(
    (fromNodeId: string, description: string) => {
      setNodes((prev) => {
        const fromNode = prev.find((n) => n.id === fromNodeId);
        if (!fromNode) return prev;

        // Position algorithm
        const candidateX = fromNode.position.x + 240 + 80;
        let candidateY = fromNode.position.y + 240;

        // Collision check — push down until clear
        const isOverlapping = (x: number, y: number) =>
          prev.some(
            (n) =>
              Math.abs(n.position.x - x) < 260 &&
              Math.abs(n.position.y - y) < 260
          );

        while (isOverlapping(candidateX, candidateY)) {
          candidateY += 280;
        }

        const newId = `NODE_${String(prev.length + 1).padStart(3, "0")}`;

        const newNode: TimelineNode = {
          id: newId,
          label: description.slice(0, 40),
          plotSummary: description,
          metadata: {
            createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
            wordCount: description.split(/\s+/).length,
            branchHash: `branch-${newId.toLowerCase()}`,
          },
          position: { x: candidateX, y: candidateY },
          connections: [],
          type: "branch",
          status: "generating",
        };

        // Update fromNode's connections
        const updated = prev.map((n) =>
          n.id === fromNodeId
            ? { ...n, connections: [...n.connections, newId] }
            : n
        );

        return [...updated, newNode];
      });

      // Get the new node ID for selection
      setNodes((prev) => {
        const newNode = prev[prev.length - 1];
        if (newNode?.status === "generating") {
          setSelectedNodeId(newNode.id);
        }
        return prev;
      });

      // After 3s, flip generating → draft
      setTimeout(() => {
        setNodes((prev) =>
          prev.map((n) =>
            n.status === "generating" && n.type === "branch"
              ? { ...n, status: "draft" }
              : n
          )
        );
      }, 3000);
    },
    []
  );

  return (
    <AppShell
      topBarCenter={
        <CourierText as="span" className="text-sm text-fg-bright">
          {project.name}
        </CourierText>
      }
      topBarRight={
        <div className="flex items-center gap-3">
          <button className="text-fg-muted hover:text-fg-bright transition-colors cursor-pointer bg-transparent border-none">
            <GitBranch size={16} strokeWidth={1.5} />
          </button>
          <button className="text-fg-muted hover:text-fg-bright transition-colors cursor-pointer bg-transparent border-none">
            <Save size={16} strokeWidth={1.5} />
          </button>
        </div>
      }
      statusLeft="EDIT_BAY"
      statusCenter={
        selectedNode
          ? `${selectedNode.id} SELECTED`
          : "READY"
      }
      statusRight={`${nodes.length} NODES // ZOOM 85%`}
    >
      <div className="flex h-full">
        <TimelineCanvas
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />

        <SidePanel
          open={selectedNode !== null}
          onClose={() => setSelectedNodeId(null)}
          title="NODE PANEL"
        >
          {selectedNode && (
            <NodePanel
              node={selectedNode}
              onSave={onSaveNode}
              onGenerateBranch={onGenerateBranch}
            />
          )}
        </SidePanel>
      </div>

      {/* Empty state overlay when no nodes */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <SyntMonoText className="text-fg-muted text-sm">
              NO NODES — CREATE YOUR FIRST SCENE
            </SyntMonoText>
          </div>
        </div>
      )}
    </AppShell>
  );
}
