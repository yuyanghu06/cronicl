import type { TimelineNode } from "@/types/node";

export const meridianTimeline: TimelineNode[] = [
  {
    id: "MER_001",
    label: "The Discovery",
    plotSummary:
      "Dr. Sarah Kim at Arecibo detects an anomalous electromagnetic pulse at exactly 11:47 PM. The signal is structured, repeating, and coming from directly beneath her feet. She runs the calculations three times before accepting the impossible truth.",
    metadata: {
      createdAt: "2024-02-10 14:20",
      wordCount: 1124,
      chapterIndex: 1,
      parameters: { tone: "scientific mystery", pov: "third-limited", setting: "radio observatory/night" },
    },
    position: { x: 80, y: 100 },
    connections: ["MER_002"],
    type: "chapter",
    status: "complete",
  },
  {
    id: "MER_002", 
    label: "Parallel Detection",
    plotSummary:
      "Simultaneously, Dr. Chen Wei at the Beijing Observatory records the same signal. The timestamps match perfectly despite being on opposite sides of Earth. Both scientists independently conclude: the source is at the planet's core.",
    metadata: {
      createdAt: "2024-02-10 15:45",
      wordCount: 987,
      parameters: { tone: "urgent discovery", pov: "dual perspective", setting: "observatory/night" },
    },
    position: { x: 560, y: 100 },
    connections: ["MER_003"],
    type: "scene", 
    status: "complete",
  },
  {
    id: "MER_003",
    label: "First Contact",
    plotSummary:
      "Sarah sends an encrypted message to Chen through academic channels. Within hours, they're collaborating in secret. The signal is gaining strength, and both observatories are picking up harmonic frequencies that shouldn't exist.",
    metadata: {
      createdAt: "2024-02-11 09:30",
      wordCount: 1456,
      parameters: { tone: "conspiratorial", pov: "alternating", setting: "secure communications" },
    },
    position: { x: 1040, y: 100 },
    connections: ["MER_004", "MER_006"],
    type: "scene",
    status: "complete", 
  },
  {
    id: "MER_004",
    label: "The Pattern",
    plotSummary:
      "Working together, they decode the signal structure. It's not random electromagnetic noise — it's data. Compressed, encrypted data transmitting at a rate that suggests massive computational power. Something at Earth's core is running calculations.",
    metadata: {
      createdAt: "2024-02-11 16:00", 
      wordCount: 1789,
      parameters: { tone: "revelation", pov: "collaborative", setting: "shared digital workspace" },
    },
    position: { x: 1520, y: 100 },
    connections: ["MER_005"],
    type: "scene",
    status: "complete",
  },
  {
    id: "MER_005", 
    label: "The Message",
    plotSummary:
      "After 72 hours of continuous work, they crack the encryption. The message is simple, terrifying, and repeated: 'Surface dwellers detected. Initiating communication protocols. Prepare for emergence.' It's dated 4.6 billion years ago.",
    metadata: {
      createdAt: "2024-02-12 08:15",
      wordCount: 2103,
      chapterIndex: 2,
      parameters: { tone: "cosmic horror", pov: "dual shock", setting: "simultaneous revelation" },
    },
    position: { x: 2000, y: 100 },
    connections: [],
    type: "chapter",
    status: "generating",
  },
  {
    id: "MER_006",
    label: "BRANCH — Government Interest", 
    plotSummary:
      "ALTERNATE: Before they can decode the full message, both Sarah and Chen are contacted by their respective governments. The signal has been detected by military satellites, and both scientists are brought into classified programs.",
    metadata: {
      createdAt: "2024-02-11 12:00",
      wordCount: 1245,
      branchHash: "government-path",
      parameters: { tone: "thriller", pov: "paranoid", setting: "secure facilities" },
    },
    position: { x: 1520, y: 560 },
    connections: ["MER_007"],
    type: "branch",
    status: "draft",
  },
  {
    id: "MER_007",
    label: "Classified Briefing",
    plotSummary:
      "Sarah learns she's not the first to detect core signals — there have been 17 similar incidents over the past century, all classified. Each time, the signals grew stronger before suddenly stopping. This time, they're not stopping.",
    metadata: {
      createdAt: "2024-02-12 10:30",
      wordCount: 1667,
      branchHash: "government-path", 
      parameters: { tone: "paranoid thriller", pov: "restricted knowledge", setting: "underground facility" },
    },
    position: { x: 2000, y: 560 },
    connections: ["MER_005"],
    type: "merge",
    status: "draft",
  },
];