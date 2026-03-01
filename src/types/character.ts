export interface CharacterBibleEntry {
  id: string;
  timelineId: string;
  name: string;
  description: string | null;
  appearanceGuide: string | null;
  referenceImageUrl: string | null;
  aliases: string[] | null;
  createdAt: string;
  updatedAt: string;
}
