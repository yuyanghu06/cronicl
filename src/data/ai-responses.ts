export interface AIStageResponse {
  stage: number;
  message: string;
  disableInput?: boolean;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Working late";
}

/** Generates a time-aware opening message */
export function getInitialMessage(): string {
  const greeting = getTimeGreeting();
  return `${greeting}. I'm your Story Architect.\n\nTell me about your story concept — what world are we building together?`;
}

export const aiResponses: AIStageResponse[] = [
  {
    stage: 0,
    message:
      "SYSTEM ONLINE. STORY ARCHITECT INITIALIZED.\n\nTell me about your story concept. What world are we building?",
  },
  {
    stage: 1,
    message:
      "CONCEPT RECEIVED. PROCESSING...\n\nInteresting foundation. Now I need to calibrate the narrative engine.\n\nWhat genre are we working in, and what emotional tone should the reader carry through this story?",
  },
  {
    stage: 2,
    message:
      "GENRE LOCKED. TONE MAPPED.\n\nThe scaffolding is taking shape. Next I need the human core.\n\nWho is your protagonist, and what is the central conflict they face?",
  },
  {
    stage: 3,
    message:
      "CHARACTER PROFILE INDEXED. CONFLICT VECTOR ESTABLISHED.\n\nNow I need the narrative skeleton.\n\nHow do you want to structure this? Classic three-act? Five-act? Non-linear? Tell me how many acts and any structural preferences.",
  },
  {
    stage: 4,
    message:
      "STRUCTURE LOCKED.\n\nOne final parameter — the visual layer.\n\nDescribe the visual style you want for your storyboard frames. Think art direction: illustration style, color palette, lighting, mood. For example: \"dark noir with neon accents\" or \"Studio Ghibli watercolors\" or \"gritty documentary realism.\"",
  },
  {
    stage: 5,
    message: "PROCESSING",
    disableInput: true,
  },
  {
    stage: 6,
    message:
      "TIMELINE READY.\n\n12 nodes across 3 acts. 2 branch points identified. Narrative coherence score: 94.2%.\n\nYour story architecture has been generated and is ready for review.",
  },
];
