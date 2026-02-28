// ---------- Shared Types ----------

export interface PathNode {
  node_id: string;
  content: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

export interface BranchCanon {
  setting?: string;
  characters?: string[];
  tone?: string;
  themes?: string[];
  rules?: string[];
  [key: string]: unknown;
}

export interface CreatorProfile {
  preferred_genres?: string[];
  writing_style?: string;
  favorite_themes?: string[];
  disliked_elements?: string[];
  exploration_ratio?: number; // 0-1, default 0.3
  [key: string]: unknown;
}

// ---------- Suggestion Prompt ----------

export interface SuggestionParams {
  system_prompt: string;
  active_path: PathNode[];
  branch_canon?: BranchCanon;
  creator_profile?: CreatorProfile;
  num_suggestions?: number;
}

export interface GhostNode {
  title: string;
  summary: string;
  tone: string;
  direction_type: string;
}

export interface InlineSuggestion {
  target_node_id: string;
  suggestion_type: string;
  original_snippet: string;
  suggested_snippet: string;
  reasoning: string;
}

export interface SuggestionResponse {
  ghost_nodes: GhostNode[];
  inline_suggestions: InlineSuggestion[];
}

export function buildSuggestionPrompt(params: SuggestionParams): string {
  const {
    system_prompt,
    active_path,
    branch_canon,
    creator_profile,
    num_suggestions = 3,
  } = params;

  const ratio = creator_profile?.exploration_ratio ?? 0.3;
  const exploratoryCount = Math.round(num_suggestions * ratio);
  const alignedCount = num_suggestions - exploratoryCount;

  const sections: string[] = [];

  // System context
  sections.push(`SYSTEM CONTEXT:\n${system_prompt}`);

  // Canon
  if (branch_canon) {
    sections.push(`WORLD RULES / CANON:\n${JSON.stringify(branch_canon, null, 2)}`);
  }

  // Creator profile
  if (creator_profile) {
    const profileLines = [];
    if (creator_profile.preferred_genres?.length) {
      profileLines.push(`Preferred genres: ${creator_profile.preferred_genres.join(', ')}`);
    }
    if (creator_profile.writing_style) {
      profileLines.push(`Writing style: ${creator_profile.writing_style}`);
    }
    if (creator_profile.favorite_themes?.length) {
      profileLines.push(`Favorite themes: ${creator_profile.favorite_themes.join(', ')}`);
    }
    if (creator_profile.disliked_elements?.length) {
      profileLines.push(`AVOID these elements: ${creator_profile.disliked_elements.join(', ')}`);
    }
    profileLines.push(`Generate ${alignedCount} aligned suggestion(s) and ${exploratoryCount} exploratory suggestion(s).`);
    sections.push(`CREATOR STYLE PROFILE:\n${profileLines.join('\n')}`);
  }

  // Active path
  const pathText = active_path
    .map((node, i) => `[${i + 1}] (${node.node_id})${node.title ? ` "${node.title}"` : ''}: ${node.content}`)
    .join('\n\n');
  sections.push(`NARRATIVE PATH (root → current):\n${pathText}`);

  // Task + output format
  sections.push(`TASK:
Generate exactly ${num_suggestions} ghost node suggestion(s) for continuing this narrative, plus any inline suggestions for improving existing nodes.

Respond with valid JSON matching this schema exactly:
{
  "ghost_nodes": [
    {
      "title": "short title",
      "summary": "1-3 sentence summary of this narrative direction",
      "tone": "emotional tone (e.g. suspenseful, hopeful, dark)",
      "direction_type": "aligned | exploratory"
    }
  ],
  "inline_suggestions": [
    {
      "target_node_id": "id of the node to improve",
      "suggestion_type": "clarity | pacing | style | continuity",
      "original_snippet": "the text to replace",
      "suggested_snippet": "the improved text",
      "reasoning": "why this change improves the narrative"
    }
  ]
}`);

  return sections.join('\n\n---\n\n');
}

// ---------- Expansion Prompt ----------

export interface ExpansionParams {
  system_prompt: string;
  node: PathNode;
  expansion_type: 'expand' | 'rewrite' | 'alternatives';
  context_path?: PathNode[];
  branch_canon?: BranchCanon;
  creator_profile?: CreatorProfile;
  num_variants?: number;
}

export interface Expansion {
  content: string;
  approach: string;
  tone: string;
}

export interface ExpansionResponse {
  expansions: Expansion[];
}

export function buildExpansionPrompt(params: ExpansionParams): string {
  const {
    system_prompt,
    node,
    expansion_type,
    context_path,
    branch_canon,
    creator_profile,
    num_variants = 2,
  } = params;

  const sections: string[] = [];

  sections.push(`SYSTEM CONTEXT:\n${system_prompt}`);

  if (branch_canon) {
    sections.push(`WORLD RULES / CANON:\n${JSON.stringify(branch_canon, null, 2)}`);
  }

  if (creator_profile) {
    const lines = [];
    if (creator_profile.writing_style) lines.push(`Writing style: ${creator_profile.writing_style}`);
    if (creator_profile.favorite_themes?.length) lines.push(`Themes: ${creator_profile.favorite_themes.join(', ')}`);
    if (creator_profile.disliked_elements?.length) lines.push(`AVOID: ${creator_profile.disliked_elements.join(', ')}`);
    if (lines.length) sections.push(`CREATOR STYLE PROFILE:\n${lines.join('\n')}`);
  }

  if (context_path?.length) {
    const pathText = context_path
      .map((n, i) => `[${i + 1}] (${n.node_id}): ${n.content}`)
      .join('\n\n');
    sections.push(`CONTEXT PATH:\n${pathText}`);
  }

  const typeInstruction = {
    expand: 'Expand and elaborate on the node content, adding depth and detail while preserving the core narrative.',
    rewrite: 'Rewrite the node content with different phrasing and structure while preserving the core meaning.',
    alternatives: 'Provide alternative versions that take the same narrative beat in different directions.',
  }[expansion_type];

  sections.push(`TARGET NODE (${node.node_id})${node.title ? ` "${node.title}"` : ''}:\n${node.content}`);

  sections.push(`TASK:
${typeInstruction}

Generate exactly ${num_variants} variant(s).

Respond with valid JSON matching this schema exactly:
{
  "expansions": [
    {
      "content": "the expanded/rewritten content",
      "approach": "brief description of the approach taken",
      "tone": "emotional tone of this variant"
    }
  ]
}`);

  return sections.join('\n\n---\n\n');
}

// ---------- Canon Diff Prompt ----------

export interface CanonDiffParams {
  system_prompt: string;
  current_canon: BranchCanon;
  recent_nodes: PathNode[];
  creator_profile?: CreatorProfile;
}

export interface CanonUpdate {
  field: string;
  current_value: unknown;
  suggested_value: unknown;
  reasoning: string;
}

export interface CanonDiffResponse {
  suggested_updates: CanonUpdate[];
  reasoning: string;
  confidence: number;
}

export function buildCanonDiffPrompt(params: CanonDiffParams): string {
  const { system_prompt, current_canon, recent_nodes, creator_profile } = params;

  const sections: string[] = [];

  sections.push(`SYSTEM CONTEXT:\n${system_prompt}`);

  sections.push(`CURRENT CANON:\n${JSON.stringify(current_canon, null, 2)}`);

  if (creator_profile) {
    const lines = [];
    if (creator_profile.writing_style) lines.push(`Writing style: ${creator_profile.writing_style}`);
    if (creator_profile.favorite_themes?.length) lines.push(`Themes: ${creator_profile.favorite_themes.join(', ')}`);
    if (lines.length) sections.push(`CREATOR STYLE PROFILE:\n${lines.join('\n')}`);
  }

  const nodesText = recent_nodes
    .map((n, i) => `[${i + 1}] (${n.node_id}): ${n.content}`)
    .join('\n\n');
  sections.push(`RECENT NODES:\n${nodesText}`);

  sections.push(`TASK:
Analyze the recent nodes against the current canon. Identify any setting, character, tone, or thematic changes that suggest the canon should be updated.

Respond with valid JSON matching this schema exactly:
{
  "suggested_updates": [
    {
      "field": "canon field name (e.g. setting, characters, tone)",
      "current_value": "current value from canon",
      "suggested_value": "proposed new value",
      "reasoning": "why this update is warranted"
    }
  ],
  "reasoning": "overall analysis of canon drift",
  "confidence": 0.0 to 1.0
}`);

  return sections.join('\n\n---\n\n');
}

// ---------- Merge Proposal Prompt ----------

export interface MergeProposalParams {
  system_prompt: string;
  branch_a: { path: PathNode[]; canon?: BranchCanon };
  branch_b: { path: PathNode[]; canon?: BranchCanon };
  merge_point_node_id: string;
  creator_profile?: CreatorProfile;
}

export interface MergeConflict {
  field: string;
  branch_a_value: unknown;
  branch_b_value: unknown;
  resolution: string;
}

export interface MergeProposalResponse {
  merged_content: string;
  reconciled_canon: BranchCanon;
  conflicts: MergeConflict[];
  confidence: number;
}

export function buildMergeProposalPrompt(params: MergeProposalParams): string {
  const { system_prompt, branch_a, branch_b, merge_point_node_id, creator_profile } = params;

  const sections: string[] = [];

  sections.push(`SYSTEM CONTEXT:\n${system_prompt}`);

  if (branch_a.canon || branch_b.canon) {
    const canonInfo: string[] = [];
    if (branch_a.canon) canonInfo.push(`Branch A canon:\n${JSON.stringify(branch_a.canon, null, 2)}`);
    if (branch_b.canon) canonInfo.push(`Branch B canon:\n${JSON.stringify(branch_b.canon, null, 2)}`);
    sections.push(`WORLD RULES / CANON:\n${canonInfo.join('\n\n')}`);
  }

  if (creator_profile) {
    const lines = [];
    if (creator_profile.writing_style) lines.push(`Writing style: ${creator_profile.writing_style}`);
    if (creator_profile.favorite_themes?.length) lines.push(`Themes: ${creator_profile.favorite_themes.join(', ')}`);
    if (creator_profile.disliked_elements?.length) lines.push(`AVOID: ${creator_profile.disliked_elements.join(', ')}`);
    if (lines.length) sections.push(`CREATOR STYLE PROFILE:\n${lines.join('\n')}`);
  }

  const formatPath = (path: PathNode[]) =>
    path.map((n, i) => `[${i + 1}] (${n.node_id}): ${n.content}`).join('\n\n');

  sections.push(`MERGE POINT NODE ID: ${merge_point_node_id}`);
  sections.push(`BRANCH A PATH:\n${formatPath(branch_a.path)}`);
  sections.push(`BRANCH B PATH:\n${formatPath(branch_b.path)}`);

  sections.push(`TASK:
Propose a merged narrative node that reconciles both branches from the merge point. Identify conflicts and suggest resolutions. Reconcile the canon from both branches.

Respond with valid JSON matching this schema exactly:
{
  "merged_content": "the proposed merged narrative content",
  "reconciled_canon": { ... reconciled canon object ... },
  "conflicts": [
    {
      "field": "area of conflict (e.g. plot, character, tone)",
      "branch_a_value": "what branch A established",
      "branch_b_value": "what branch B established",
      "resolution": "how this conflict was resolved in the merge"
    }
  ],
  "confidence": 0.0 to 1.0
}`);

  return sections.join('\n\n---\n\n');
}
