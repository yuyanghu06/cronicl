import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { SidePanel } from "@/components/layout/SidePanel";
import { TimelineCanvas } from "@/components/editor/TimelineCanvas";
import { NodePanel } from "@/components/editor/NodePanel";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { CourierText } from "@/components/ui/CourierText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { GitBranch, Save } from "lucide-react";
import type { TimelineNode } from "@/types/node.ts";
import type { SuggestionState, GhostNode } from "@/types/suggestion.ts";
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [nodes, setNodes] = useState<TimelineNode[]>([]);
  const [projectName, setProjectName] = useState("LOADING...");
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<SuggestionState>({
    ghostNodes: [],
    sourceNodeId: null,
    status: "idle",
    error: null,
  });
  const timelineIdRef = useRef<string | null>(null);
  const abortRef = useRef(false);
  const generatingRef = useRef(new Set<string>());
  const pollTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // --- Job polling helper ---

  const pollJob = useCallback((jobId: string, nodeId: string) => {
    const POLL_INTERVAL = 3000;
    const MAX_POLL_TIME = 120_000; // 2 minutes
    const startTime = Date.now();

    const tick = async () => {
      if (abortRef.current) {
        pollTimersRef.current.delete(nodeId);
        return;
      }

      try {
        const res = await api.get<{
          jobId: string;
          nodeId: string;
          status: string;
          error?: string;
        }>(`/api/jobs/images/jobs/${jobId}`);

        if (res.status === "completed") {
          // Fetch image from DB
          const tid = timelineIdRef.current;
          if (tid) {
            try {
              const images = await api.get<{ id: string; imageUrl: string }[]>(
                `/api/timelines/${tid}/nodes/images`
              );
              const img = images.find((i) => i.id === nodeId);
              if (img) {
                setNodes((prev) =>
                  prev.map((n) =>
                    n.id === nodeId
                      ? { ...n, imageUrl: img.imageUrl, status: "draft" as const }
                      : n
                  )
                );
              }
            } catch {
              // Image fetch failed, revert to draft
              setNodes((prev) =>
                prev.map((n) =>
                  n.id === nodeId ? { ...n, status: "draft" as const } : n
                )
              );
            }
          }
          generatingRef.current.delete(nodeId);
          pollTimersRef.current.delete(nodeId);
          return;
        }

        if (res.status === "failed") {
          console.error(`[Image] Job ${jobId} failed:`, res.error);
          setNodes((prev) =>
            prev.map((n) =>
              n.id === nodeId ? { ...n, status: "draft" as const } : n
            )
          );
          generatingRef.current.delete(nodeId);
          pollTimersRef.current.delete(nodeId);
          return;
        }

        // Still in progress — check timeout
        if (Date.now() - startTime > MAX_POLL_TIME) {
          console.warn(`[Image] Job ${jobId} timed out after ${MAX_POLL_TIME / 1000}s`);
          setNodes((prev) =>
            prev.map((n) =>
              n.id === nodeId ? { ...n, status: "draft" as const } : n
            )
          );
          generatingRef.current.delete(nodeId);
          pollTimersRef.current.delete(nodeId);
          return;
        }

        // Schedule next poll
        const timer = setTimeout(tick, POLL_INTERVAL);
        pollTimersRef.current.set(nodeId, timer);
      } catch {
        // Network error — retry polling
        if (Date.now() - startTime < MAX_POLL_TIME) {
          const timer = setTimeout(tick, POLL_INTERVAL);
          pollTimersRef.current.set(nodeId, timer);
        } else {
          setNodes((prev) =>
            prev.map((n) =>
              n.id === nodeId ? { ...n, status: "draft" as const } : n
            )
          );
          generatingRef.current.delete(nodeId);
          pollTimersRef.current.delete(nodeId);
        }
      }
    };

    // Start first poll after interval
    const timer = setTimeout(tick, POLL_INTERVAL);
    pollTimersRef.current.set(nodeId, timer);
  }, []);

  // Clean up poll timers on unmount
  useEffect(() => {
    return () => {
      for (const timer of pollTimersRef.current.values()) {
        clearTimeout(timer);
      }
      pollTimersRef.current.clear();
    };
  }, []);

  // --- Image generation ---

  const generateImageForNode = useCallback(async (nodeId: string, context?: string) => {
    if (generatingRef.current.has(nodeId)) return;
    generatingRef.current.add(nodeId);

    const tid = timelineIdRef.current;
    if (!tid) {
      generatingRef.current.delete(nodeId);
      return;
    }

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
    if (context) prompt = `PRECEDING SCENE CONTEXT:\n${context}\n\nCURRENT SCENE:\n${prompt}`;

    try {
      const res = await api.post<{
        jobId?: string;
        nodeId: string;
        status: string;
      }>("/api/jobs/images/generate", {
        nodeId,
        timelineId: tid,
        prompt,
      });

      if (abortRef.current) return;

      if (res.status === "completed" || res.status === "already_exists") {
        // Sync fallback or already exists — fetch image from DB
        try {
          const images = await api.get<{ id: string; imageUrl: string }[]>(
            `/api/timelines/${tid}/nodes/images`
          );
          const img = images.find((i) => i.id === nodeId);
          if (img) {
            setNodes((prev) =>
              prev.map((n) =>
                n.id === nodeId
                  ? { ...n, imageUrl: img.imageUrl, status: "draft" as const }
                  : n
              )
            );
          } else {
            setNodes((prev) =>
              prev.map((n) =>
                n.id === nodeId ? { ...n, status: "draft" as const } : n
              )
            );
          }
        } catch {
          setNodes((prev) =>
            prev.map((n) =>
              n.id === nodeId ? { ...n, status: "draft" as const } : n
            )
          );
        }
        generatingRef.current.delete(nodeId);
      } else if (res.status === "queued" && res.jobId) {
        // Start polling
        pollJob(res.jobId, nodeId);
      } else {
        // Unexpected status
        setNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId ? { ...n, status: "draft" as const } : n
          )
        );
        generatingRef.current.delete(nodeId);
      }
    } catch {
      if (abortRef.current) return;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, status: "draft" as const } : n
        )
      );
      generatingRef.current.delete(nodeId);
    }
  }, [pollJob]);

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
        // 1. Load structure (fast — no image blobs in response)
        const timeline = await api.get<BackendTimeline>(`/api/timelines/${projectId}`);
        if (cancelled) return;

        timelineIdRef.current = timeline.id;
        setProjectName(timeline.title);

        const mapped = mapBackendNodesToTimelineNodes(timeline.nodes ?? []);
        setNodes(mapped);
        setIsLoading(false);

        // 2. Lazy-load images from DB
        try {
          const images = await api.get<{ id: string; imageUrl: string }[]>(
            `/api/timelines/${timeline.id}/nodes/images`
          );
          if (cancelled) return;

          if (images.length > 0) {
            const imageMap = new Map(images.map((img) => [img.id, img.imageUrl]));
            setNodes((prev) =>
              prev.map((n) => {
                const url = imageMap.get(n.id);
                return url ? { ...n, imageUrl: url } : n;
              })
            );
          }
        } catch {
          // Images failed to load — nodes still render without them
        }

        // 3. Auto-generate images for nodes that still don't have one
        // Submit each missing node individually — queue rate limiter handles pacing
        setNodes((prev) => {
          const missing = prev.filter((n) => !n.imageUrl);
          if (missing.length > 0 && !cancelled && !abortRef.current) {
            for (const node of missing) {
              if (cancelled || abortRef.current) break;
              generateImageForNode(node.id);
            }
          }
          return prev;
        });
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

  const onSaveNode = useCallback((nodeId: string, updates: { label: string; plotSummary: string }) => {
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

    // Regenerate storyboard image to reflect updated text
    generateImageForNode(nodeId);
  }, [generateImageForNode]);

  const onDeleteNode = useCallback(async (nodeId: string) => {
    const tid = timelineIdRef.current;
    if (tid) {
      try {
        await api.delete(`/api/timelines/${tid}/nodes/${nodeId}`);
      } catch (err) {
        console.error(`[Delete] Failed to delete node ${nodeId}:`, err);
        return;
      }
    }
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setSelectedNodeId(null);
  }, []);

  const onAddNode = useCallback(async () => {
    const tid = timelineIdRef.current;
    if (!tid) return;

    // Position: 480px right of the rightmost node, same y; or (0,0) if empty
    let x = 0;
    let y = 0;
    if (nodes.length > 0) {
      const rightmost = nodes.reduce((a, b) =>
        b.position.x > a.position.x ? b : a
      );
      x = rightmost.position.x + 480;
      y = rightmost.position.y;
    }

    let newNodeId = `node_${Date.now()}`;
    try {
      const created = await api.post<BackendNode>(
        `/api/timelines/${tid}/nodes`,
        mapNodeToBackendCreate({
          label: "Untitled",
          plotSummary: "",
          position: { x, y },
          status: "draft",
        })
      );
      newNodeId = created.id;
    } catch {
      // Use client-generated ID as fallback
    }

    const newNode: TimelineNode = {
      id: newNodeId,
      label: "Untitled",
      plotSummary: "",
      metadata: {
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        wordCount: 0,
      },
      position: { x, y },
      connections: [],
      type: "scene",
      status: "draft",
    };

    // Capture context from selected node before we change selection
    const contextNode = selectedNodeId
      ? nodes.find((n) => n.id === selectedNodeId)
      : nodes.length > 0
        ? nodes.reduce((a, b) => (b.position.x > a.position.x ? b : a))
        : null;
    const context = contextNode?.plotSummary || undefined;

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNodeId);
    generateImageForNode(newNodeId, context);
  }, [nodes, selectedNodeId, generateImageForNode]);

  const onGenerateBranch = useCallback(async (fromNodeId: string, description: string) => {
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

    // Auto-generate image for the new branch node with parent context
    generateImageForNode(newNodeId, fromNode.plotSummary || undefined);
  }, [nodes, generateImageForNode]);

  // --- Suggestion handlers ---

  const IDLE_SUGGESTIONS: SuggestionState = {
    ghostNodes: [],
    sourceNodeId: null,
    status: "idle",
    error: null,
  };

  function calculateGhostPosition(
    sourceNode: TimelineNode,
    index: number,
    total: number,
    existingNodes: TimelineNode[],
  ) {
    const x = sourceNode.position.x + 480;
    const verticalSpacing = 200;
    const totalHeight = (total - 1) * verticalSpacing;
    const startY = sourceNode.position.y - totalHeight / 2;
    let y = startY + index * verticalSpacing;

    const isOverlapping = (cx: number, cy: number) =>
      existingNodes.some(
        (n) => Math.abs(n.position.x - cx) < 280 && Math.abs(n.position.y - cy) < 180,
      );
    while (isOverlapping(x, y)) y += 200;

    return { x, y };
  }

  const onRequestSuggestions = useCallback(
    async (nodeId: string) => {
      const tid = timelineIdRef.current;
      if (!tid) return;

      setSuggestions({
        ghostNodes: [],
        sourceNodeId: nodeId,
        status: "loading",
        error: null,
      });

      try {
        const res = await api.post<{
          ghost_nodes: { title: string; summary: string; tone: string; direction_type: string }[];
        }>("/api/ai/suggest-from-timeline", {
          timelineId: tid,
          nodeId,
          numSuggestions: 3,
        });

        const sourceNode = nodes.find((n) => n.id === nodeId);
        if (!sourceNode) {
          setSuggestions(IDLE_SUGGESTIONS);
          return;
        }

        const ghostNodes: GhostNode[] = (res.ghost_nodes ?? []).map(
          (gn, index) => ({
            id: `ghost_${Date.now()}_${index}`,
            title: gn.title,
            summary: gn.summary,
            tone: gn.tone,
            direction_type: (gn.direction_type === "exploratory" ? "exploratory" : "aligned") as
              | "aligned"
              | "exploratory",
            sourceNodeId: nodeId,
            position: calculateGhostPosition(sourceNode, index, res.ghost_nodes.length, nodes),
          }),
        );

        setSuggestions({
          ghostNodes,
          sourceNodeId: nodeId,
          status: "ready",
          error: null,
        });
      } catch {
        setSuggestions({
          ghostNodes: [],
          sourceNodeId: nodeId,
          status: "error",
          error: "Failed to generate suggestions.",
        });
      }
    },
    [nodes],
  );

  const onAcceptGhostNode = useCallback(
    async (ghostId: string) => {
      const ghost = suggestions.ghostNodes.find((g) => g.id === ghostId);
      if (!ghost) return;

      const tid = timelineIdRef.current;
      const label = ghost.title;
      const content = ghost.summary;

      let newNodeId = `${ghost.sourceNodeId}_suggest_${Date.now()}`;

      if (tid) {
        try {
          const created = await api.post<BackendNode>(
            `/api/timelines/${tid}/nodes`,
            mapNodeToBackendCreate({
              label,
              plotSummary: content,
              position: ghost.position,
              status: "draft",
              parentId: ghost.sourceNodeId,
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
        position: ghost.position,
        connections: [],
        type: "scene",
        status: "draft",
      };

      setNodes((prev) => {
        const updated = prev.map((n) =>
          n.id === ghost.sourceNodeId
            ? { ...n, connections: [...n.connections, newNodeId] }
            : n,
        );
        return [...updated, newNode];
      });

      setSuggestions(IDLE_SUGGESTIONS);
      setSelectedNodeId(newNodeId);

      const sourceNode = nodes.find((n) => n.id === ghost.sourceNodeId);
      generateImageForNode(newNodeId, sourceNode?.plotSummary || undefined);
    },
    [suggestions.ghostNodes, nodes, generateImageForNode],
  );

  const onDismissGhostNode = useCallback((ghostId: string) => {
    setSuggestions((prev) => {
      const remaining = prev.ghostNodes.filter((g) => g.id !== ghostId);
      if (remaining.length === 0) {
        return IDLE_SUGGESTIONS;
      }
      return { ...prev, ghostNodes: remaining };
    });
  }, []);

  const onDismissSuggestions = useCallback(() => {
    setSuggestions(IDLE_SUGGESTIONS);
  }, []);

  // Clear suggestions when selecting a different node
  useEffect(() => {
    if (
      selectedNodeId !== suggestions.sourceNodeId &&
      suggestions.status !== "idle"
    ) {
      setSuggestions(IDLE_SUGGESTIONS);
    }
  }, [selectedNodeId, suggestions.sourceNodeId, suggestions.status]);

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
            onAddNode={onAddNode}
            ghostNodes={suggestions.ghostNodes}
            onGhostNodeClick={onAcceptGhostNode}
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
              onDelete={onDeleteNode}
              onGenerateBranch={onGenerateBranch}
              onRegenerateImage={generateImageForNode}
              onPreviewImage={() => setLightboxUrl(selectedNode.imageUrl ?? null)}
              suggestions={suggestions}
              onRequestSuggestions={onRequestSuggestions}
              onAcceptGhostNode={onAcceptGhostNode}
              onDismissGhostNode={onDismissGhostNode}
              onDismissSuggestions={onDismissSuggestions}
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
      <ImageLightbox
        imageUrl={lightboxUrl}
        onClose={() => setLightboxUrl(null)}
      />
    </AppShell>
  );
}
