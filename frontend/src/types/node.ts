export interface TimelineNode {
  id: string;
  parentId: string | null;
  label: string;
  plotSummary: string;
  imageUrl?: string | null;
  metadata: NodeMetadata;
  position: { x: number; y: number };
  connections: string[];
  type: "scene" | "branch" | "merge" | "chapter";
  status: "draft" | "generating" | "complete" | "locked";
}

export interface NodeMetadata {
  createdAt: string;
  wordCount: number;
  branchHash?: string;
  chapterIndex?: number;
  parameters?: Record<string, string>;
}

export interface TimelineState {
  nodes: TimelineNode[];
  selectedNodeId: string | null;
  zoom: number;
  panOffset: { x: number; y: number };
}
