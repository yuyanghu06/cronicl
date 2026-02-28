import type { Project } from "@/types/project";
import type { TimelineNode } from "@/types/node";
import { mockTimeline } from "./mock-timeline";

export const DEMO_PROJECT_ID = "demo-the-long-dark";

export const DEMO_PROJECT: Project = {
  id: DEMO_PROJECT_ID,
  name: "The Long Dark",
  lastEdited: "demo",
  nodeCount: mockTimeline.length,
  branchCount: 3,
  status: "active",
  description:
    "A survival thriller following three researchers stranded in an arctic station after a catastrophic magnetic storm severs all communication with the outside world.",
};

export const DEMO_TIMELINE: TimelineNode[] = mockTimeline;
