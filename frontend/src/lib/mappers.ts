import type { TimelineNode } from "@/types/node";
import type { ApiNode } from "./api";

/**
 * Convert backend nodes to frontend TimelineNode[].
 * Computes `connections` from the parentId tree.
 */
export function apiNodesToFrontend(apiNodes: ApiNode[]): TimelineNode[] {
  const nodes: TimelineNode[] = apiNodes.map((n) => ({
    id: n.id,
    parentId: n.parentId,
    label: n.label ?? n.title,
    plotSummary: n.content ?? "",
    metadata: {
      createdAt: n.createdAt,
      wordCount: (n.content ?? "").split(/\s+/).filter(Boolean).length,
    },
    position: { x: n.positionX, y: n.positionY },
    connections: [],
    type: n.parentId ? "branch" : "scene",
    status: (n.status as TimelineNode["status"]) ?? "draft",
  }));

  return recomputeConnections(nodes);
}

/**
 * Recompute connections[] from parentId on an existing frontend node array.
 * A node's connections = all nodes whose parentId equals this node's id.
 */
export function recomputeConnections(nodes: TimelineNode[]): TimelineNode[] {
  // Build parentId → childIds map
  const childrenMap = new Map<string, string[]>();
  for (const node of nodes) {
    if (node.parentId) {
      const existing = childrenMap.get(node.parentId) ?? [];
      existing.push(node.id);
      childrenMap.set(node.parentId, existing);
    }
  }

  return nodes.map((node) => ({
    ...node,
    connections: childrenMap.get(node.id) ?? [],
  }));
}
