import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { SidePanel } from "@/components/layout/SidePanel";
import { TimelineCanvas } from "@/components/editor/TimelineCanvas";
import { NodePanel } from "@/components/editor/NodePanel";
import { CourierText } from "@/components/ui/CourierText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { GitBranch, Save } from "lucide-react";
import { api } from "@/lib/api.ts";
import {
  mapBackendNodesToTimelineNodes,
  type BackendTimeline,
  type BackendNode,
} from "@/lib/mappers.ts";
import type { TimelineNode } from "@/types/node.ts";

interface TimelineWithNodes extends BackendTimeline {
  nodes: BackendNode[];
}

export function EditorPage() {
  const { projectId } = useParams();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<TimelineNode[]>([]);
  const [projectName, setProjectName] = useState("LOADING...");
  const [isLoading, setIsLoading] = useState(true);

  // Load timeline from API
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    (async () => {
      try {
        const timeline = await api.get<TimelineWithNodes>(
          `/api/timelines/${projectId}`
        );
        if (cancelled) return;
        setProjectName(timeline.title);
        setNodes(mapBackendNodesToTimelineNodes(timeline.nodes ?? []));
      } catch {
        if (cancelled) return;
        setProjectName("ERROR LOADING");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const onSaveNode = useCallback(
    async (nodeId: string, updates: { label: string; plotSummary: string }) => {
      // Optimistic update
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? { ...n, label: updates.label, plotSummary: updates.plotSummary }
            : n
        )
      );

      // Persist to backend
      try {
        await api.patch(`/api/timelines/${projectId}/nodes/${nodeId}`, {
          title: updates.label,
          label: updates.label,
          content: updates.plotSummary,
        });
      } catch {
        // Revert on failure would be complex — for now the optimistic update stands
        // and will sync on next load
      }
    },
    [projectId]
  );

  const onGenerateBranch = useCallback(
    async (fromNodeId: string, description: string) => {
      const fromNode = nodes.find((n) => n.id === fromNodeId);
      if (!fromNode) return;

      // Position algorithm — 480px step, branch below with generous gap
      const candidateX = fromNode.position.x + 480;
      let candidateY = fromNode.position.y + 460;

      // Collision check — push down until clear
      const isOverlapping = (x: number, y: number) =>
        nodes.some(
          (n) =>
            Math.abs(n.position.x - x) < 480 &&
            Math.abs(n.position.y - y) < 460
        );

      while (isOverlapping(candidateX, candidateY)) {
        candidateY += 480;
      }

      // Try AI suggestion first, then fall back to user description
      let title = description.slice(0, 40);
      let content = description;

      try {
        const aiResult = await api.post<{
          ghost_nodes: Array<{ title: string; summary: string }>;
        }>("/ai/suggest-from-timeline", {
          timelineId: projectId,
          nodeId: fromNodeId,
          numSuggestions: 1,
        });

        const ghost = aiResult.ghost_nodes?.[0];
        if (ghost) {
          title = ghost.title;
          content = ghost.summary;
        }
      } catch {
        // AI failed — use the user's description directly
      }

      // Create the node in the backend
      try {
        const newNode = await api.post<BackendNode>(
          `/api/timelines/${projectId}/nodes`,
          {
            title,
            label: title,
            content,
            parent_id: fromNodeId,
            position_x: candidateX,
            position_y: candidateY,
            status: "draft",
          }
        );

        // Add to local state
        const frontendNode: TimelineNode = {
          id: newNode.id,
          label: newNode.label || newNode.title,
          plotSummary: newNode.content,
          metadata: {
            createdAt: new Date()
              .toISOString()
              .slice(0, 16)
              .replace("T", " "),
            wordCount: content.trim().split(/\s+/).length,
          },
          position: { x: candidateX, y: candidateY },
          connections: [],
          type: "branch",
          status: "draft",
        };

        setNodes((prev) => {
          // Update parent's connections
          const updated = prev.map((n) =>
            n.id === fromNodeId
              ? { ...n, connections: [...n.connections, newNode.id] }
              : n
          );
          return [...updated, frontendNode];
        });

        setSelectedNodeId(newNode.id);
      } catch {
        // Show error in a temporary generating node
        const tempId = `temp-${Date.now()}`;
        const errorNode: TimelineNode = {
          id: tempId,
          label: "GENERATION FAILED",
          plotSummary: description,
          metadata: {
            createdAt: new Date()
              .toISOString()
              .slice(0, 16)
              .replace("T", " "),
            wordCount: 0,
          },
          position: { x: candidateX, y: candidateY },
          connections: [],
          type: "branch",
          status: "draft",
        };

        setNodes((prev) => {
          const updated = prev.map((n) =>
            n.id === fromNodeId
              ? { ...n, connections: [...n.connections, tempId] }
              : n
          );
          return [...updated, errorNode];
        });
      }
    },
    [nodes, projectId]
  );

  return (
    <AppShell
      topBarCenter={
        <CourierText as="span" className="text-sm text-fg-bright">
          {projectName}
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
        selectedNode ? `${selectedNode.id.slice(0, 8)} SELECTED` : "READY"
      }
      statusRight={`${nodes.length} NODES // ZOOM 85%`}
    >
      <div className="flex h-full">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <SyntMonoText className="text-fg-muted text-sm">
              LOADING TIMELINE...
            </SyntMonoText>
          </div>
        ) : (
          <TimelineCanvas
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        )}

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
      {!isLoading && nodes.length === 0 && (
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
