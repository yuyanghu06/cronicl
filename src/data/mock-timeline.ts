import type { TimelineNode } from "@/types/node";

export const mockTimeline: TimelineNode[] = [
  {
    id: "NODE_001",
    label: "ACT I — OPENING",
    plotSummary:
      "INT. ARCTIC RESEARCH STATION - NIGHT. The storm has been raging for three days. Dr. Elena Chen stares at the readings on her terminal, the numbers climbing in ways that shouldn't be possible. Behind her, the backup generator flickers.",
    metadata: {
      createdAt: "2024-01-15 09:12",
      wordCount: 842,
      chapterIndex: 1,
      parameters: { tone: "suspenseful", pov: "third-limited", setting: "interior/night" },
    },
    position: { x: 80, y: 200 },
    connections: ["NODE_002"],
    type: "chapter",
    status: "complete",
  },
  {
    id: "NODE_002",
    label: "THE DISCOVERY",
    plotSummary:
      "Chen pulls up the magnetometer data and realizes the readings aren't random — they're structured. A repeating pattern buried in the geomagnetic noise. She calls Marcus and Yuki to the lab. None of them can explain what they're seeing.",
    metadata: {
      createdAt: "2024-01-15 10:34",
      wordCount: 1203,
      parameters: { tone: "mysterious", pov: "third-limited", setting: "interior/night" },
    },
    position: { x: 400, y: 200 },
    connections: ["NODE_003"],
    type: "scene",
    status: "complete",
  },
  {
    id: "NODE_003",
    label: "COMMUNICATION LOST",
    plotSummary:
      "Marcus tries the satellite uplink — dead. The radio — static. Even the emergency beacon returns nothing. They are alone. The storm outside intensifies as if responding to their growing fear. Yuki finds frost forming inside the walls.",
    metadata: {
      createdAt: "2024-01-15 14:22",
      wordCount: 956,
      branchHash: "main",
      parameters: { tone: "tense", pov: "third-limited", setting: "interior/night" },
    },
    position: { x: 720, y: 200 },
    connections: ["NODE_004", "NODE_007"],
    type: "scene",
    status: "complete",
  },
  {
    id: "NODE_004",
    label: "THE SIGNAL SOURCE",
    plotSummary:
      "Chen isolates the signal origin. It's not coming from above — not a satellite, not atmospheric interference. It's coming from directly below them. 2.3 kilometers beneath the permafrost. Something is broadcasting from under the ice.",
    metadata: {
      createdAt: "2024-01-16 08:45",
      wordCount: 1087,
      branchHash: "main",
      parameters: { tone: "revelatory", pov: "third-limited", setting: "interior/day" },
    },
    position: { x: 1040, y: 200 },
    connections: ["NODE_005"],
    type: "scene",
    status: "complete",
  },
  {
    id: "NODE_005",
    label: "ACT II — DESCENT",
    plotSummary:
      "Against every protocol, they prepare to investigate. Marcus rigs a drilling sensor to the old ice core shaft. Yuki calculates they have 72 hours of generator fuel remaining. Chen can't stop listening to the pattern — she's begun to hear a rhythm in it.",
    metadata: {
      createdAt: "2024-01-16 11:20",
      wordCount: 1445,
      chapterIndex: 2,
      branchHash: "main",
      parameters: { tone: "determined", pov: "rotating", setting: "interior/day" },
    },
    position: { x: 1360, y: 200 },
    connections: ["NODE_006", "NODE_009"],
    type: "chapter",
    status: "complete",
  },
  {
    id: "NODE_006",
    label: "INTO THE ICE",
    plotSummary:
      "They lower the sensor array. At 800 meters, the temperature readings invert — it's getting warmer. At 1.4 kilometers, the drill encounters a void. The signal strength triples. Marcus wants to stop. Chen wants to go deeper.",
    metadata: {
      createdAt: "2024-01-16 15:30",
      wordCount: 1122,
      branchHash: "main",
      parameters: { tone: "claustrophobic", pov: "third-limited", setting: "subterranean" },
    },
    position: { x: 1680, y: 200 },
    connections: ["NODE_010"],
    type: "scene",
    status: "draft",
  },
  {
    id: "NODE_007",
    label: "BRANCH — YUKI'S THEORY",
    plotSummary:
      "ALTERNATE: Yuki proposes the signal is artificial — an ancient transmitter left by a forgotten civilization. She begins cross-referencing the pattern with known linguistic structures and finds unsettling similarities to Proto-Uralic phonemes.",
    metadata: {
      createdAt: "2024-01-16 09:00",
      wordCount: 678,
      branchHash: "alt-yuki",
      parameters: { tone: "academic", pov: "third-limited", setting: "interior/night" },
    },
    position: { x: 1040, y: 440 },
    connections: ["NODE_008"],
    type: "branch",
    status: "draft",
  },
  {
    id: "NODE_008",
    label: "THE TRANSLATION",
    plotSummary:
      "Yuki's linguistic analysis reveals the signal isn't just structured — it's a message. A warning. Repeating on a loop for what she estimates has been twelve thousand years. The translation is three words: DO NOT DIG.",
    metadata: {
      createdAt: "2024-01-16 10:15",
      wordCount: 891,
      branchHash: "alt-yuki",
      parameters: { tone: "dread", pov: "third-limited", setting: "interior/night" },
    },
    position: { x: 1360, y: 440 },
    connections: ["NODE_006"],
    type: "merge",
    status: "draft",
  },
  {
    id: "NODE_009",
    label: "BRANCH — MARCUS BREAKS",
    plotSummary:
      "ALTERNATE: Marcus's paranoia escalates. He becomes convinced the signal is targeting them specifically — that something beneath the ice knows they are here. He begins sabotaging equipment, trying to force an evacuation that cannot happen.",
    metadata: {
      createdAt: "2024-01-17 08:00",
      wordCount: 734,
      branchHash: "alt-marcus",
      parameters: { tone: "paranoid", pov: "third-limited", setting: "interior/night" },
    },
    position: { x: 1680, y: 440 },
    connections: ["NODE_010"],
    type: "branch",
    status: "draft",
  },
  {
    id: "NODE_010",
    label: "ACT III — CONTACT",
    plotSummary:
      "At 2.3 kilometers, the sensor feed shows something impossible: a chamber. Perfectly geometric. Not carved by water or pressure — engineered. The signal is deafening now, even through the equipment. And then it stops. Complete silence. Something has noticed them.",
    metadata: {
      createdAt: "2024-01-17 14:00",
      wordCount: 1567,
      chapterIndex: 3,
      branchHash: "main",
      parameters: { tone: "cosmic-horror", pov: "omniscient", setting: "subterranean" },
    },
    position: { x: 2000, y: 200 },
    connections: [],
    type: "chapter",
    status: "generating",
  },
];
