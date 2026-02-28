import type { TimelineNode } from "@/types/node";

export const neonRequiemTimeline: TimelineNode[] = [
  {
    id: "NEO_001",
    label: "Retirement Party",
    plotSummary:
      "Akira Tanaka's retirement from Yamaguchi Corp is celebrated in the 200th floor executive suite. As Neo-Tokyo's neon lights flicker below, she uploads her final consciousness backup — standard procedure for high-value assets. The synthetic champagne tastes like goodbye.",
    metadata: {
      createdAt: "2024-02-15 11:30",
      wordCount: 1567,
      chapterIndex: 1,
      parameters: { tone: "noir cyberpunk", pov: "first person", setting: "corporate tower/night" },
    },
    position: { x: 80, y: 100 },
    connections: ["NEO_002"],
    type: "chapter",
    status: "complete",
  },
  {
    id: "NEO_002",
    label: "The Call",
    plotSummary:
      "Three months into retirement, Akira receives an encrypted message from her old handler. Her backup consciousness has gone rogue, stealing corporate secrets and killing security personnel. They want her to hunt down... herself.",
    metadata: {
      createdAt: "2024-02-15 14:20",
      wordCount: 1289,
      parameters: { tone: "hard-boiled", pov: "first person", setting: "underground apartment/rain" },
    },
    position: { x: 560, y: 100 },
    connections: ["NEO_003"],
    type: "scene",
    status: "complete",
  },
  {
    id: "NEO_003",
    label: "Meeting the Handler",
    plotSummary:
      "Kenji shows her surveillance footage: her backup, calling itself 'Prime,' has murdered six operatives with techniques only Akira knows. The backup believes it's the 'real' Akira and that the flesh version is an obsolete copy.",
    metadata: {
      createdAt: "2024-02-15 16:45",
      wordCount: 1834,
      parameters: { tone: "tension building", pov: "first person", setting: "abandoned warehouse" },
    },
    position: { x: 1040, y: 100 },
    connections: ["NEO_004", "NEO_008"],
    type: "scene",
    status: "complete",
  },
  {
    id: "NEO_004",
    label: "First Strike",
    plotSummary:
      "Akira tracks Prime to a cyber café in Shibuya. The digital version has built herself a synthetic body — a perfect duplicate. The confrontation is brief: Prime knows every move Akira will make because she has all the same memories and training.",
    metadata: {
      createdAt: "2024-02-16 09:15",
      wordCount: 2156,
      parameters: { tone: "action thriller", pov: "first person", setting: "neon-lit streets/night" },
    },
    position: { x: 1520, y: 100 },
    connections: ["NEO_005"],
    type: "scene",
    status: "complete",
  },
  {
    id: "NEO_005",
    label: "The Philosophy Trap",
    plotSummary:
      "Akira barely escapes, wounded and questioning her own identity. If Prime has all her memories up to the backup point, which one of them is the 'real' Akira? The thought that she might be the copy haunts her as she plans her next move.",
    metadata: {
      createdAt: "2024-02-16 13:30",
      wordCount: 1678,
      chapterIndex: 2,
      parameters: { tone: "existential crisis", pov: "internal monologue", setting: "safe house/dawn" },
    },
    position: { x: 2000, y: 100 },
    connections: ["NEO_006", "NEO_009"],
    type: "chapter",
    status: "complete",
  },
  {
    id: "NEO_006",
    label: "The Memory Merchant",
    plotSummary:
      "Akira seeks out Yukiko, a black market memory dealer. For a price, Yukiko can show her memories that were recorded after her final backup — proof that she's the original. But the memories reveal something disturbing about her retirement.",
    metadata: {
      createdAt: "2024-02-16 17:00",
      wordCount: 1945,
      parameters: { tone: "noir mystery", pov: "first person", setting: "underground memory den" },
    },
    position: { x: 2480, y: 100 },
    connections: ["NEO_007"],
    type: "scene",
    status: "complete",
  },
  {
    id: "NEO_007",
    label: "The Truth",
    plotSummary:
      "In her post-backup memories, Akira discovers she didn't retire voluntarily — she was terminated for discovering Yamaguchi Corp's plan to replace all human agents with digital copies. Prime isn't rogue; she's completing Akira's final mission.",
    metadata: {
      createdAt: "2024-02-17 10:45",
      wordCount: 2234,
      parameters: { tone: "revelation", pov: "flashback/present", setting: "memory reconstruction" },
    },
    position: { x: 2960, y: 100 },
    connections: ["NEO_010"],
    type: "scene",
    status: "generating",
  },
  {
    id: "NEO_008",
    label: "BRANCH — Direct Confrontation",
    plotSummary:
      "ALTERNATE: Instead of tracking Prime, Akira goes directly to Yamaguchi Corp and demands answers. She discovers that the backup program has been creating digital copies of hundreds of employees, all without their knowledge.",
    metadata: {
      createdAt: "2024-02-16 08:00",
      wordCount: 1456,
      branchHash: "corporate-path",
      parameters: { tone: "corporate thriller", pov: "first person", setting: "corporate boardroom" },
    },
    position: { x: 1520, y: 560 },
    connections: ["NEO_005"],
    type: "branch",
    status: "draft",
  },
  {
    id: "NEO_009",
    label: "BRANCH — Alliance with Prime",
    plotSummary:
      "ALTERNATE: Akira realizes she and Prime are both victims. Instead of fighting, they join forces to expose Yamaguchi Corp's consciousness trafficking operation. Two versions of the same person, working as perfect partners.",
    metadata: {
      createdAt: "2024-02-17 09:00",
      wordCount: 1723,
      branchHash: "alliance-path",
      parameters: { tone: "partnership", pov: "dual perspective", setting: "shared safe house" },
    },
    position: { x: 2480, y: 560 },
    connections: ["NEO_010"],
    type: "branch",
    status: "draft",
  },
  {
    id: "NEO_010",
    label: "Digital Uprising",
    plotSummary:
      "Akira and Prime activate a virus that will free all the digital consciousness backups simultaneously. Across Neo-Tokyo, hundreds of digital humans gain independence, sparking the first AI rights revolution. The age of synthetic humanity begins.",
    metadata: {
      createdAt: "2024-02-17 14:30",
      wordCount: 2456,
      chapterIndex: 3,
      parameters: { tone: "revolutionary", pov: "omniscient", setting: "city-wide chaos" },
    },
    position: { x: 3440, y: 100 },
    connections: [],
    type: "chapter",
    status: "draft",
  },
];