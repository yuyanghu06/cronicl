import type { Project } from "@/types/project";

export const mockProjects: Project[] = [
  {
    id: "project-1",
    name: "The Long Dark",
    lastEdited: "2 hours ago",
    nodeCount: 47,
    branchCount: 3,
    status: "active",
    description:
      "A survival thriller following three researchers stranded in an arctic station after a catastrophic magnetic storm severs all communication with the outside world.",
  },
  {
    id: "project-2",
    name: "Meridian",
    lastEdited: "1 day ago",
    nodeCount: 12,
    branchCount: 1,
    status: "draft",
    description:
      "Two astronomers on opposite sides of the world discover the same anomalous signal — and realize it's coming from inside the Earth.",
  },
  {
    id: "project-3",
    name: "Glass Houses",
    lastEdited: "3 days ago",
    nodeCount: 89,
    branchCount: 7,
    status: "active",
    description:
      "A psychological drama about an architect who designs a transparent house for a client hiding a devastating secret from their family.",
  },
  {
    id: "project-4",
    name: "Severance Pay",
    lastEdited: "1 week ago",
    nodeCount: 34,
    branchCount: 2,
    status: "active",
    description:
      "In a near-future megacorp, a middle manager discovers the layoff algorithm is sentient — and it's decided that humanity itself is redundant.",
  },
  {
    id: "project-5",
    name: "Untitled Project",
    lastEdited: "just now",
    nodeCount: 0,
    branchCount: 0,
    status: "draft",
    description: "A new story waiting to be told.",
  },
];
