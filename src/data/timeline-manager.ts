import type { TimelineNode } from "@/types/node";
import { mockTimeline } from "./mock-timeline";
import { meridianTimeline } from "./timeline-meridian";
import { neonRequiemTimeline } from "./timeline-neon-requiem";
import { memoryThiefTimeline } from "./timeline-memory-thief";

// Map project IDs to their timelines
export const projectTimelines: Record<string, TimelineNode[]> = {
  "project-1": mockTimeline, // The Long Dark
  "project-2": meridianTimeline, // Meridian
  "project-5": memoryThiefTimeline, // The Memory Thief  
  "project-6": neonRequiemTimeline, // Neon Requiem
  // Add more as needed
};

export function getTimelineForProject(projectId: string): TimelineNode[] {
  return projectTimelines[projectId] || [];
}

// Generate a simple placeholder timeline for projects without detailed timelines
export function generatePlaceholderTimeline(projectId: string, projectName: string): TimelineNode[] {
  return [
    {
      id: `${projectId}_start`,
      label: "Opening Scene",
      plotSummary: `The beginning of "${projectName}" — a story waiting to be fully developed.`,
      metadata: {
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        wordCount: 0,
        chapterIndex: 1,
        parameters: { tone: "establishing", pov: "tbd", setting: "tbd" },
      },
      position: { x: 80, y: 100 },
      connections: [`${projectId}_development`],
      type: "chapter",
      status: "draft",
    },
    {
      id: `${projectId}_development`,
      label: "Story Development",
      plotSummary: "The middle section where the plot develops and conflicts emerge.",
      metadata: {
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        wordCount: 0,
        parameters: { tone: "building", pov: "tbd", setting: "tbd" },
      },
      position: { x: 560, y: 100 },
      connections: [`${projectId}_climax`],
      type: "scene",
      status: "draft",
    },
    {
      id: `${projectId}_climax`,
      label: "Climax & Resolution", 
      plotSummary: "The story reaches its peak and finds resolution.",
      metadata: {
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        wordCount: 0,
        chapterIndex: 2,
        parameters: { tone: "resolution", pov: "tbd", setting: "tbd" },
      },
      position: { x: 1040, y: 100 },
      connections: [],
      type: "chapter",
      status: "draft",
    },
  ];
}