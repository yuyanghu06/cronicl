import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { SidePanel } from "@/components/layout/SidePanel";
import { TimelineCanvas } from "@/components/editor/TimelineCanvas";
import { NodePanel } from "@/components/editor/NodePanel";
import { CourierText } from "@/components/ui/CourierText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { GitBranch, Save } from "lucide-react";
import type { TimelineNode } from "@/types/node";
import {
  getTimeline,
  getNodeImages,
  updateNode as apiUpdateNode,
  createNode as apiCreateNode,
  suggestFromTimeline,
} from "@/lib/api";
import { apiNodesToFrontend, recomputeConnections } from "@/lib/mappers";

export function EditorPage() {
  const { projectId } = useParams();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<TimelineNode[]>([]);
  const [timelineTitle, setTimelineTitle] = useState("LOADING...");
  const [timelineId, setTimelineId] = useState<string | null>(null);
  const [, setSystemPrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch timeline on mount
  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getTimeline(projectId)
      .then(async (timeline) => {
        if (cancelled) return;
        setTimelineId(timeline.id);
        setTimelineTitle(timeline.title);
        setSystemPrompt(timeline.systemPrompt);
        const frontendNodes = apiNodesToFrontend(timeline.nodes ?? []);
        setNodes(frontendNodes);
        setLoading(false);

        // Lazy-load node images
        try {
          const images = await getNodeImages(timeline.id);
          if (cancelled || images.length === 0) return;
          const imageMap = new Map(images.map((i) => [i.id, i.imageUrl]));
          setNodes((prev) =>
            prev.map((n) =>
              imageMap.has(n.id) ? { ...n, imageUrl: imageMap.get(n.id) } : n
            )
          );
        } catch {
          // Images are non-critical; silently ignore
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load timeline:", err);
        setError(err.message ?? "Failed to load timeline");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const onSaveNode = useCallback(
    (nodeId: string, updates: { label: string; plotSummary: string }) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? { ...n, label: updates.label, plotSummary: updates.plotSummary }
            : n
        )
      );

      // Persist to backend (fire-and-forget)
      if (timelineId) {
        apiUpdateNode(timelineId, nodeId, {
          title: updates.label,
          label: updates.label,
          content: updates.plotSummary,
        }).catch((err) => console.error("Failed to save node:", err));
      }
    },
    [timelineId]
  );

  const onGenerateBranch = useCallback(
    async (fromNodeId: string, description: string): Promise<void> => {
      if (!timelineId) throw new Error("No timeline loaded");

      const fromNode = nodes.find((n) => n.id === fromNodeId);
      if (!fromNode) throw new Error("Source node not found");

      // 1. Call Gemini via backend to generate AI suggestion
      const aiResult = await suggestFromTimeline({
        timelineId,
        nodeId: fromNodeId,
        numSuggestions: 1,
      });

      const ghost = aiResult.ghost_nodes[0];
      const title = ghost?.title ?? description.slice(0, 40);
      const content = ghost?.summary ?? description;

      // 2. Compute position with collision avoidance
      const candidateX = fromNode.position.x + 240 + 80;
      let candidateY = fromNode.position.y + 240;

      const isOverlapping = (x: number, y: number) =>
        nodes.some(
          (n) =>
            Math.abs(n.position.x - x) < 260 &&
            Math.abs(n.position.y - y) < 260
        );

      while (isOverlapping(candidateX, candidateY)) {
        candidateY += 280;
      }

      // 3. Persist to backend
      const created = await apiCreateNode(timelineId, {
        parent_id: fromNodeId,
        title,
        label: title,
        content,
        position_x: candidateX,
        position_y: candidateY,
        status: "draft",
      });

      // 4. Add to local state and recompute connections
      const newNode: TimelineNode = {
        id: created.id,
        parentId: fromNodeId,
        label: title,
        plotSummary: content,
        metadata: {
          createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
          wordCount: content.split(/\s+/).length,
          branchHash: `branch-${created.id.slice(0, 8)}`,
        },
        position: { x: candidateX, y: candidateY },
        connections: [],
        type: "branch",
        status: "draft",
      };

      setNodes((prev) => recomputeConnections([...prev, newNode]));
      setSelectedNodeId(created.id);
    },
    [timelineId, nodes]
  );

  if (loading) {
    return (
      <AppShell statusLeft="EDIT_BAY" statusCenter="LOADING..." statusRight="">
        <div className="flex items-center justify-center h-full">
          <SyntMonoText className="text-fg-muted text-sm animate-pulse">
            LOADING TIMELINE...
          </SyntMonoText>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell
        statusLeft="EDIT_BAY"
        statusCenter="ERROR"
        statusRight=""
      >
        <div className="flex items-center justify-center h-full">
          <SyntMonoText className="text-red text-sm">
            ERROR: {error}
          </SyntMonoText>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      topBarCenter={
        <CourierText as="span" className="text-sm text-fg-bright">
          {timelineTitle}
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
