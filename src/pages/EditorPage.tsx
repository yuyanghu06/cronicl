import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { SidePanel } from "@/components/layout/SidePanel";
import { TimelineCanvas } from "@/components/editor/TimelineCanvas";
import { NodePanel } from "@/components/editor/NodePanel";
import { CourierText } from "@/components/ui/CourierText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { GitBranch, Save } from "lucide-react";
import type { TimelineNode } from "@/types/node.ts";
import { api } from "@/lib/api.ts";
import {
  mapBackendNodesToTimelineNodes,
  mapNodeToBackendUpdate,
  mapNodeToBackendCreate,
} from "@/lib/mappers.ts";
import type { BackendTimeline, BackendNode } from "@/lib/mappers.ts";
import { DEMO_PROJECT_ID, DEMO_PROJECT, DEMO_TIMELINE } from "@/data/demo";

export function EditorPage() {
  const { projectId } = useParams();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<TimelineNode[]>([]);
  const [projectName, setProjectName] = useState("LOADING...");
  const [isLoading, setIsLoading] = useState(true);
  const timelineIdRef = useRef<string | null>(null);
  const abortRef = useRef(false);
  const generatingRef = useRef(new Set<string>());

  // --- Image generation ---

  const generateImageForNode = useCallback(async (nodeId: string) => {
    if (generatingRef.current.has(nodeId)) return;
    generatingRef.current.add(nodeId);

    // Read current node from state
    let prompt = "";
    setNodes((prev) => {
      const node = prev.find((n) => n.id === nodeId);
      if (node) {
        prompt = [node.label, node.plotSummary].filter(Boolean).join(" — ");
      }
      return prev.map((n) =>
        n.id === nodeId ? { ...n, status: "generating" as const } : n
      );
    });

    if (!prompt) prompt = "A cinematic storyboard frame";

    try {
      const res = await api.post<{ image: string; mimeType: string }>(
        "/api/generate/image",
        { prompt }
      );
      if (abortRef.current) return;

      const dataUrl = `data:${res.mimeType};base64,${res.image}`;

      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? { ...n, imageUrl: dataUrl, status: "draft" as const }
            : n
        )
      );

      // Persist to backend
      const tid = timelineIdRef.current;
      if (tid) {
        api
          .patch(`/api/timelines/${tid}/nodes/${nodeId}`, { image_url: dataUrl })
          .catch(() => {});
      }
    } catch {
      if (abortRef.current) return;
      // Revert to draft so FRAME_PENDING shows again
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, status: "draft" as const } : n
        )
      );
    } finally {
      generatingRef.current.delete(nodeId);
    }
  }, []);

  // --- Load timeline data ---

  useEffect(() => {
    if (!projectId) return;
    abortRef.current = false;

    if (projectId === DEMO_PROJECT_ID) {
      timelineIdRef.current = null;
      setProjectName(DEMO_PROJECT.name);
      setNodes(DEMO_TIMELINE);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const timeline = await api.get<BackendTimeline>(`/api/timelines/${projectId}`);
        if (cancelled) return;

        timelineIdRef.current = timeline.id;
        setProjectName(timeline.title);

        const mapped = mapBackendNodesToTimelineNodes(timeline.nodes ?? []);
        setNodes(mapped);
        setIsLoading(false);

        // Auto-generate images for nodes that don't have one
        const missing = mapped.filter((n) => !n.imageUrl);
        for (const node of missing) {
          if (cancelled || abortRef.current) break;
          await generateImageForNode(node.id);
          // Respect rate limits (~10 req/min → ~6s gap, use 1.5s as conservative)
          await new Promise((r) => setTimeout(r, 1500));
        }
      } catch {
        if (cancelled) return;
        setProjectName("Unknown Project");
        setNodes([]);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      abortRef.current = true;
    };
  }, [projectId, generateImageForNode]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const onSaveNode = (nodeId: string, updates: { label: string; plotSummary: string }) => {
    setNodes(prev =>
      prev.map(n =>
        n.id === nodeId
          ? { ...n, label: updates.label, plotSummary: updates.plotSummary }
          : n
      )
    );

    // Persist to backend (fire-and-forget)
    const tid = timelineIdRef.current;
    if (tid) {
      api.patch(`/api/timelines/${tid}/nodes/${nodeId}`, mapNodeToBackendUpdate(updates)).catch(() => {});
    }
  };

  const onGenerateBranch = async (fromNodeId: string, description: string) => {
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

    const label = description.slice(0, 40) || "New Branch";
    const content = description || "A new branch in the story...";

    // Try to persist to backend and get a real UUID
    const tid = timelineIdRef.current;
    let newNodeId = `${fromNodeId}_branch_${Date.now()}`;

    if (tid) {
      try {
        const created = await api.post<BackendNode>(
          `/api/timelines/${tid}/nodes`,
          mapNodeToBackendCreate({
            label,
            plotSummary: content,
            position: { x: candidateX, y: candidateY },
            status: "draft",
            parentId: fromNodeId,
          }),
        );
        newNodeId = created.id;
      } catch {
        // Use client-generated ID as fallback
      }
    }

    const newNode: TimelineNode = {
      id: newNodeId,
      label,
      plotSummary: content,
      metadata: {
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        wordCount: content.trim().split(/\s+/).length,
      },
      position: { x: candidateX, y: candidateY },
      connections: [],
      type: "branch",
      status: "draft",
    };

    setNodes(prev => {
      // Update parent's connections
      const updated = prev.map(n =>
        n.id === fromNodeId
          ? { ...n, connections: [...n.connections, newNodeId] }
          : n
      );
      return [...updated, newNode];
    });

    setSelectedNodeId(newNodeId);

    // Auto-generate image for the new branch node
    generateImageForNode(newNodeId);
  };

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
            onGenerateImage={generateImageForNode}
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
