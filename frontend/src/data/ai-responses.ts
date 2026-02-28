export interface AIStageResponse {
  stage: number;
  message: string;
  disableInput?: boolean;
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
      "CHARACTER PROFILE INDEXED. CONFLICT VECTOR ESTABLISHED.\n\nOne final parameter before I can generate your timeline.\n\nHow do you want to structure this? Classic three-act? Five-act? Non-linear? Tell me how many acts and any structural preferences.",
  },
  {
    stage: 4,
    message: "PROCESSING",
    disableInput: true,
  },
  {
    stage: 5,
    message:
      "TIMELINE READY.\n\n12 nodes across 3 acts. 2 branch points identified. Narrative coherence score: 94.2%.\n\nYour story architecture has been generated and is ready for review.",
  },
];
