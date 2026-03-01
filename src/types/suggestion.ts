export interface GhostNode {
  id: string;
  title: string;
  summary: string;
  tone: string;
  direction_type: "aligned" | "exploratory";
  sourceNodeId: string;
  position: { x: number; y: number };
}

export interface SuggestionState {
  ghostNodes: GhostNode[];
  sourceNodeId: string | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
}
