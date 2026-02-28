export interface Project {
  id: string;
  name: string;
  lastEdited: string;
  nodeCount: number;
  branchCount: number;
  status: "draft" | "active" | "archived";
  description: string;
}
