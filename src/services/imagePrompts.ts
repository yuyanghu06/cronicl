/**
 * Centralized prompt assembly for image generation.
 *
 * Design principles (from Gemini image-gen research):
 *
 * 1. AFFIRMATIVE FRAMING — describe what you WANT, never what you don't.
 *    Negation ("don't include X") activates the concept of X in the model,
 *    causing it to appear. Instead, describe the desired state affirmatively.
 *
 * 2. LABELED SECTIONS — [Style], [Subject], [Setting], [Action], [Composition]
 *    Named sections reduce ambiguity and improve adherence.
 *
 * 3. PRIORITY ORDERING — the model attends most to:
 *      (a) first sentence / role framing
 *      (b) last line / final constraints
 *    Middle sections receive less reliable attention. Place the visual style
 *    guide at the top and critical constraints at the bottom.
 *
 * 4. NARRATIVE PROSE — descriptive paragraphs outperform tag-soup prompts.
 *    Nano Banana uses a "thinking" process and responds better to intent-rich
 *    natural language than to comma-separated keywords.
 *
 * 5. STORY-CONTEXT GROUNDING — every extraction and generation prompt receives
 *    the project's visual theme / vision blurb / system prompt so the model
 *    stays anchored to the story's world, tone, and aesthetic.
 */

// ---------- Types ----------

export interface StoryContext {
  visualTheme?: string | null;
  systemPrompt?: string | null;
  visionBlurb?: string | null;
}

export interface ExtractedSceneData {
  setting: string | null;
  characters: string[];
}

export interface CharacterIdentity {
  name: string;
  appearanceGuide?: string | null;
  referenceImageUrl?: string | null;
}

// ---------- Setting Extraction ----------

export function buildSettingExtractionPrompt(
  sceneText: string,
  storyContext?: StoryContext
): string {
  const sections: string[] = [];

  sections.push(
    `You are a location scout analyzing a scene from a cinematic narrative. Your task is to identify the physical environment where this scene takes place.`
  );

  // Ground in story context so the extraction stays on-theme
  if (storyContext?.visionBlurb) {
    sections.push(`PROJECT WORLD:\n${storyContext.visionBlurb}`);
  } else if (storyContext?.systemPrompt) {
    sections.push(`PROJECT CONTEXT:\n${storyContext.systemPrompt}`);
  }

  sections.push(
    `SCENE TEXT:\n${sceneText}`
  );

  sections.push(
    `INSTRUCTIONS:
Read the scene text above and describe WHERE this scene takes place in one vivid, specific sentence. Include sensory details — lighting, weather, textures, time of day — that an image model needs to accurately render the environment. If the scene text names a location, use it. If the location is implied, infer the most fitting environment from the project world and scene context.

Your description must be a single sentence written as a visual direction, e.g.:
"A rain-soaked cobblestone plaza in a baroque European city, amber streetlights reflected in shallow puddles, overcast dusk sky"

Return JSON: {"setting": "your one-sentence environment description"}

Ground your answer in the project world above. The setting must be consistent with the story's established world and tone.`
  );

  return sections.join('\n\n');
}

// ---------- Character Extraction ----------

export function buildCharacterExtractionPrompt(
  sceneText: string,
  storyContext?: StoryContext,
  knownCharacters?: string[]
): string {
  const sections: string[] = [];

  sections.push(
    `You are a casting director analyzing a scene from a cinematic narrative. Your task is to identify every character who is physically present and visible in this scene.`
  );

  if (storyContext?.visionBlurb) {
    sections.push(`PROJECT WORLD:\n${storyContext.visionBlurb}`);
  } else if (storyContext?.systemPrompt) {
    sections.push(`PROJECT CONTEXT:\n${storyContext.systemPrompt}`);
  }

  if (knownCharacters && knownCharacters.length > 0) {
    sections.push(
      `KNOWN CHARACTERS IN THIS STORY:\n${knownCharacters.map((name) => `- ${name}`).join('\n')}`
    );
  }

  sections.push(
    `SCENE TEXT:\n${sceneText}`
  );

  const rules = [
    '- If a known character list is provided above, prefer returning the canonical name from that list when a match is found.',
    '- Use the exact name as it appears in the text when no known character matches.',
    '- If a character is referenced only in dialogue or memory (but is physically absent from the scene), exclude them.',
    '- If the text is ambiguous, lean toward including the character.',
    '- An empty array is the correct answer when the scene contains only environment, narration, or abstract concepts.',
  ];

  sections.push(
    `INSTRUCTIONS:
List every character (person, named entity, creature) who is physically present, visible, or actively participating in this scene. Include only characters explicitly mentioned or clearly implied by the text. If the scene describes a solitary moment, a landscape, or an empty location, return an empty array.

Return JSON: {"characters": ["Name1", "Name2"]}

Rules:
${rules.join('\n')}`
  );

  return sections.join('\n\n');
}

// ---------- Image Generation Prompt Assembly ----------

export function buildImageGenerationPrompt(
  sceneText: string,
  storyContext: StoryContext,
  extracted: ExtractedSceneData,
  characterBible?: CharacterIdentity[]
): string {
  const sections: string[] = [];

  // --- TOP PRIORITY: Visual style (model attends most to opening) ---

  if (storyContext.visualTheme) {
    sections.push(
      `[STYLE GUIDE — follow this exactly for every visual decision]\n${storyContext.visualTheme}`
    );
  }

  if (storyContext.visionBlurb) {
    sections.push(
      `[PROJECT VISION — the world this frame belongs to]\n${storyContext.visionBlurb}`
    );
  } else if (storyContext.systemPrompt && !storyContext.visualTheme) {
    // Only use systemPrompt as creative direction if no visualTheme exists
    sections.push(
      `[CREATIVE DIRECTION]\n${storyContext.systemPrompt}`
    );
  }

  // --- CHARACTER IDENTITIES (right after style guide for high attention) ---

  const matchedBible = characterBible?.filter((c) => c.appearanceGuide) ?? [];
  const matchedNames = new Set(matchedBible.map((c) => c.name.toLowerCase()));

  if (matchedBible.length > 0) {
    for (const char of matchedBible) {
      sections.push(
        `[CHARACTER IDENTITY — ${char.name}]\n${char.appearanceGuide}`
      );
    }
  }

  // --- MIDDLE: Scene content (subject + action) ---

  sections.push(
    `[SCENE — the content of this storyboard frame]\n${sceneText}`
  );

  // --- Setting (extracted and grounded in story world) ---

  if (extracted.setting) {
    sections.push(
      `[ENVIRONMENT — render this exact location]\n${extracted.setting}`
    );
  }

  // --- Characters (affirmative framing) ---

  if (extracted.characters.length > 0) {
    // Characters with bible entries are already described above; list any remaining by name
    const unmatchedCharacters = extracted.characters.filter(
      (name) => !matchedNames.has(name.toLowerCase())
    );

    if (unmatchedCharacters.length > 0 && matchedBible.length > 0) {
      sections.push(
        `[CHARACTERS PRESENT — show exactly these people]\n${extracted.characters.join(', ')}. These are the only figures visible in the frame. Characters with identity blocks above must match their descriptions exactly.`
      );
    } else if (matchedBible.length > 0) {
      sections.push(
        `[CHARACTERS PRESENT — show exactly these people]\n${extracted.characters.join(', ')}. These are the only figures visible in the frame, with each character matching their identity description exactly.`
      );
    } else {
      sections.push(
        `[CHARACTERS PRESENT — show exactly these people]\n${extracted.characters.join(', ')}. These are the only figures visible in the frame.`
      );
    }
  } else {
    sections.push(
      `[FIGURES — this scene is empty of people]\nThe frame contains only the environment and objects. All human and character figures are absent.`
    );
  }

  // --- BOTTOM PRIORITY: Final constraint line (model attends to last line) ---

  const constraintParts: string[] = [];
  constraintParts.push('Generate a single storyboard frame as a cinematic photograph');
  if (storyContext.visualTheme) {
    constraintParts.push('matching the style guide above precisely');
  }
  constraintParts.push('with consistent lighting, color palette, and composition throughout');
  if (matchedBible.length > 0) {
    constraintParts.push('with each character matching their identity description exactly');
  }

  sections.push(constraintParts.join(', ') + '.');

  return sections.join('\n\n');
}

// ---------- Portrait Generation Prompt ----------

export function buildPortraitGenerationPrompt(
  character: { name: string; appearanceGuide: string },
  storyContext: StoryContext
): string {
  const sections: string[] = [];

  if (storyContext.visualTheme) {
    sections.push(
      `[STYLE GUIDE — follow this exactly for every visual decision]\n${storyContext.visualTheme}`
    );
  }

  if (storyContext.visionBlurb) {
    sections.push(
      `[PROJECT VISION — the world this character belongs to]\n${storyContext.visionBlurb}`
    );
  }

  sections.push(
    `[CHARACTER IDENTITY — ${character.name}]\n${character.appearanceGuide}`
  );

  sections.push(
    `[COMPOSITION]\nHead-and-shoulders portrait, centered, neutral expression, studio-quality lighting, plain background that complements the character's color palette.`
  );

  sections.push(
    `Generate a single character reference portrait matching the style guide, suitable for use as a casting reference sheet.`
  );

  return sections.join('\n\n');
}
