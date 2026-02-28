import type { TimelineNode } from "@/types/node.ts";
import type { Project } from "@/types/project.ts";

// --- Backend types (what the API returns) ---

export interface BackendNode {
  id: string;
  timelineId: string;
  parentId: string | null;
  label: string | null;
  title: string;
  content: string;
  status: string;
  positionX: number;
  positionY: number;
  sortOrder: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendTimeline {
  id: string;
  userId: string;
  title: string;
  summary: string | null;
  systemPrompt: string | null;
  tags: string[] | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  nodes?: BackendNode[];
  branches?: unknown[];
}

export interface BackendTimelineListItem extends BackendTimeline {
  nodeCount: number;
  branchCount: number;
}

// --- Backend → Frontend mappers ---

export function mapBackendNodesToTimelineNodes(
  backendNodes: BackendNode[],
): TimelineNode[] {
  // Build a parentId→childIds lookup so we can compute connections
  const childrenMap = new Map<string, string[]>();
  for (const node of backendNodes) {
    if (node.parentId) {
      const existing = childrenMap.get(node.parentId) ?? [];
      existing.push(node.id);
      childrenMap.set(node.parentId, existing);
    }
  }

  return backendNodes.map((node) => {
    const content = node.content ?? "";
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    // Map backend status to frontend status
    let status: TimelineNode["status"] = "draft";
    if (node.status === "published") status = "complete";
    else if (node.status === "generating") status = "generating";
    else if (node.status === "locked") status = "locked";

    // Format createdAt for display
    const createdAt = node.createdAt
      ? new Date(node.createdAt).toISOString().slice(0, 16).replace("T", " ")
      : "";

    return {
      id: node.id,
      label: node.label || node.title,
      plotSummary: content,
      metadata: {
        createdAt,
        wordCount,
      },
      position: { x: node.positionX ?? 0, y: node.positionY ?? 0 },
      connections: childrenMap.get(node.id) ?? [],
      type: "scene" as const,
      status,
      imageUrl: node.imageUrl ?? undefined,
    };
  });
}

export function mapBackendToProject(
  timeline: BackendTimelineListItem,
): Project {
  // Map backend status to frontend status
  let status: Project["status"] = "draft";
  if (timeline.status === "published") status = "active";
  else if (timeline.status === "archived") status = "archived";

  // Relative time for lastEdited
  const lastEdited = timeline.updatedAt
    ? formatRelativeTime(new Date(timeline.updatedAt))
    : "just now";

  return {
    id: timeline.id,
    name: timeline.title,
    lastEdited,
    nodeCount: timeline.nodeCount ?? 0,
    branchCount: timeline.branchCount ?? 0,
    status,
    description: timeline.summary ?? "",
  };
}

// --- Frontend → Backend mappers ---

export function mapNodeToBackendCreate(
  frontendNode: Partial<TimelineNode> & { parentId?: string },
) {
  return {
    title: frontendNode.label ?? "Untitled",
    label: frontendNode.label ?? null,
    content: frontendNode.plotSummary ?? "",
    status: frontendNode.status === "complete" ? "published" : (frontendNode.status ?? "draft"),
    position_x: frontendNode.position?.x ?? 0,
    position_y: frontendNode.position?.y ?? 0,
    parent_id: frontendNode.parentId ?? null,
  };
}

export function mapNodeToBackendUpdate(updates: {
  label?: string;
  plotSummary?: string;
  position?: { x: number; y: number };
  status?: string;
}) {
  const body: Record<string, unknown> = {};
  if (updates.label !== undefined) {
    body.title = updates.label;
    body.label = updates.label;
  }
  if (updates.plotSummary !== undefined) body.content = updates.plotSummary;
  if (updates.position) {
    body.position_x = updates.position.x;
    body.position_y = updates.position.y;
  }
  if (updates.status !== undefined) {
    body.status = updates.status === "complete" ? "published" : updates.status;
  }
  return body;
}

// --- Helpers ---

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
