import type { TimelineNode } from "@/types/node";

export const memoryThiefTimeline: TimelineNode[] = [
  {
    id: "MEM_001",
    label: "First Extraction",
    plotSummary:
      "Dr. Elena Vasquez successfully extracts the memory of a murder from trauma victim Jessica Chen. The NeuroLink interface translates synaptic patterns into visual data, allowing police to see the killer's face. Elena doesn't notice the memory fragment that remains behind in her own mind.",
    metadata: {
      createdAt: "2024-02-20 10:15",
      wordCount: 1345,
      chapterIndex: 1,
      parameters: { tone: "medical thriller", pov: "third-limited", setting: "neural lab/day" },
    },
    position: { x: 80, y: 100 },
    connections: ["MEM_002"],
    type: "chapter",
    status: "complete",
  },
  {
    id: "MEM_002",
    label: "Side Effects",
    plotSummary:
      "Elena begins experiencing nightmares — vivid, violent scenes that don't belong to her. She dismisses them as stress until she realizes they're Jessica's memories of the murder, playing on repeat in her subconscious mind.",
    metadata: {
      createdAt: "2024-02-20 14:30",
      wordCount: 1167,
      parameters: { tone: "psychological horror", pov: "third-limited", setting: "home/night" },
    },
    position: { x: 560, y: 100 },
    connections: ["MEM_003"],
    type: "scene",
    status: "complete",
  },
  {
    id: "MEM_003",
    label: "Second Case",
    plotSummary:
      "Despite the nightmares, Elena accepts another case — a child witness to a kidnapping. The extraction is routine, but afterward, Elena finds herself speaking in the child's voice, craving foods she's never liked, afraid of shadows that don't exist.",
    metadata: {
      createdAt: "2024-02-20 16:45",
      wordCount: 1523,
      parameters: { tone: "disturbing", pov: "fragmented consciousness", setting: "medical facility" },
    },
    position: { x: 1040, y: 100 },
    connections: ["MEM_004", "MEM_007"],
    type: "scene",
    status: "complete",
  },
  {
    id: "MEM_004",
    label: "The Discovery",
    plotSummary:
      "Elena's research partner, Dr. Kim, runs neural scans and discovers foreign memory engrams integrated into Elena's hippocampus. The extraction process is supposed to be one-way, but some memories are 'sticky' — they cling to the extractor's mind.",
    metadata: {
      createdAt: "2024-02-21 09:00",
      wordCount: 1689,
      parameters: { tone: "scientific revelation", pov: "clinical discovery", setting: "research lab" },
    },
    position: { x: 1520, y: 100 },
    connections: ["MEM_005"],
    type: "scene",
    status: "complete",
  },
  {
    id: "MEM_005",
    label: "Memory Overload",
    plotSummary:
      "Elena's condition worsens. She has fragments from dozens of victims — their fears, their traumas, their final moments. She can no longer distinguish which memories are hers. The police want her to stop; she's become too valuable to the cases.",
    metadata: {
      createdAt: "2024-02-21 13:15",
      wordCount: 1834,
      chapterIndex: 2,
      parameters: { tone: "identity crisis", pov: "multiple voices", setting: "fractured reality" },
    },
    position: { x: 2000, y: 100 },
    connections: ["MEM_006", "MEM_009"],
    type: "chapter",
    status: "complete",
  },
  {
    id: "MEM_006",
    label: "The Rebellion",
    plotSummary:
      "The stolen memories begin to assert themselves. Elena finds herself at crime scenes she's never visited, confronting perpetrators she's supposed to have no connection to. The victims' memories are using her body to seek justice their own way.",
    metadata: {
      createdAt: "2024-02-21 17:30",
      wordCount: 2045,
      parameters: { tone: "possession horror", pov: "external control", setting: "urban vigilante" },
    },
    position: { x: 2480, y: 100 },
    connections: ["MEM_010"],
    type: "scene",
    status: "generating",
  },
  {
    id: "MEM_007",
    label: "BRANCH — The Cure Attempt",
    plotSummary:
      "ALTERNATE: Elena works with Dr. Kim to develop a procedure to remove the foreign memories. The process is experimental and dangerous — it could erase her own memories along with the stolen ones. She must choose between her sanity and her identity.",
    metadata: {
      createdAt: "2024-02-21 11:00",
      wordCount: 1456,
      branchHash: "cure-path",
      parameters: { tone: "medical drama", pov: "ethical dilemma", setting: "experimental lab" },
    },
    position: { x: 1520, y: 560 },
    connections: ["MEM_008"],
    type: "branch",
    status: "draft",
  },
  {
    id: "MEM_008",
    label: "The Price of Forgetting",
    plotSummary:
      "The memory removal partially succeeds, but Elena discovers that her empathy, her ability to connect with victims, came from carrying their pain. Without the stolen memories, she becomes cold, clinical — effective but no longer human.",
    metadata: {
      createdAt: "2024-02-21 15:45",
      wordCount: 1634,
      branchHash: "cure-path",
      parameters: { tone: "hollow victory", pov: "emotional numbness", setting: "sterile facility" },
    },
    position: { x: 2000, y: 560 },
    connections: ["MEM_010"],
    type: "merge",
    status: "draft",
  },
  {
    id: "MEM_009",
    label: "BRANCH — Acceptance",
    plotSummary:
      "ALTERNATE: Elena stops fighting the memories and learns to coexist with them. She becomes a living memorial for crime victims, carrying their stories while using their knowledge to solve cold cases that have haunted the city for years.",
    metadata: {
      createdAt: "2024-02-22 08:30",
      wordCount: 1789,
      branchHash: "acceptance-path",
      parameters: { tone: "bittersweet resolution", pov: "collective consciousness", setting: "memorial service" },
    },
    position: { x: 2480, y: 560 },
    connections: ["MEM_010"],
    type: "branch",
    status: "draft",
  },
  {
    id: "MEM_010",
    label: "The Memory Collective",
    plotSummary:
      "Elena establishes an underground network of memory extractors who voluntarily carry victim memories. They become a secret society of the traumatized, using borrowed pain to fight crime from the shadows. Justice through shared suffering.",
    metadata: {
      createdAt: "2024-02-22 14:20",
      wordCount: 2156,
      chapterIndex: 3,
      parameters: { tone: "dark justice", pov: "network consciousness", setting: "hidden sanctuary" },
    },
    position: { x: 2960, y: 100 },
    connections: [],
    type: "chapter",
    status: "draft",
  },
];