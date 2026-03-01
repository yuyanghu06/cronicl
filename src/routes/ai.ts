import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { authMiddleware } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/ratelimit';
import { quotaMiddleware } from '../middleware/quota';
import { generateStructuredText } from '../services/ai';
import { recordUsage } from '../services/usage';
import {
  buildSuggestionPrompt,
  buildExpansionPrompt,
  buildCanonDiffPrompt,
  buildMergeProposalPrompt,
  type SuggestionResponse,
  type ExpansionResponse,
  type CanonDiffResponse,
  type MergeProposalResponse,
} from '../services/prompt';
import { buildAIContext, getCreatorProfile } from '../services/context';

const MAX_SYSTEM_PROMPT_LENGTH = 5_000;
const MAX_CONTENT_LENGTH = 10_000;

const ai = new Hono();

ai.use('*', bodyLimit({ maxSize: 50 * 1024 })); // 50 KB
ai.use('*', authMiddleware);
ai.use('*', aiRateLimiter);
ai.use('*', quotaMiddleware);

// ---------- Validation Helpers ----------

function requireString(body: Record<string, unknown>, field: string, maxLength?: number): string {
  const val = body[field];
  if (typeof val !== 'string' || val.trim().length === 0) {
    throw new ValidationError(`${field} is required and must be a non-empty string`);
  }
  const trimmed = val.trim();
  if (maxLength && trimmed.length > maxLength) {
    throw new ValidationError(`${field} exceeds maximum length of ${maxLength} characters`);
  }
  return trimmed;
}

function requireArray(body: Record<string, unknown>, field: string): unknown[] {
  const val = body[field];
  if (!Array.isArray(val) || val.length === 0) {
    throw new ValidationError(`${field} is required and must be a non-empty array`);
  }
  return val;
}

function requireObject(body: Record<string, unknown>, field: string): Record<string, unknown> {
  const val = body[field];
  if (typeof val !== 'object' || val === null || Array.isArray(val)) {
    throw new ValidationError(`${field} is required and must be an object`);
  }
  return val as Record<string, unknown>;
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ---------- POST /suggest ----------

ai.post('/suggest', async (c) => {
  try {
    const body = await c.req.json();

    const system_prompt = requireString(body, 'system_prompt', MAX_SYSTEM_PROMPT_LENGTH);
    const active_path = requireArray(body, 'active_path');

    // Validate path nodes have required fields
    for (const node of active_path) {
      if (typeof node !== 'object' || node === null) {
        throw new ValidationError('Each active_path entry must be an object');
      }
      const n = node as Record<string, unknown>;
      if (typeof n.node_id !== 'string' || typeof n.content !== 'string') {
        throw new ValidationError('Each active_path entry must have node_id and content strings');
      }
      if (n.content.length > MAX_CONTENT_LENGTH) {
        throw new ValidationError(`active_path node content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
      }
    }

    const num_suggestions = Math.min(10, Math.max(1, Number(body.num_suggestions) || 3));

    const prompt = buildSuggestionPrompt({
      system_prompt,
      active_path: active_path as { node_id: string; content: string }[],
      branch_canon: body.branch_canon as any,
      creator_profile: body.creator_profile as any,
      num_suggestions,
    });

    const result = await generateStructuredText<SuggestionResponse>({
      prompt,
      model: body.model as string | undefined,
    });

    const { sub } = c.get('user');
    recordUsage(sub, '/ai/suggest').catch((err) =>
      console.error('Failed to record usage:', err)
    );

    return c.json({
      ghost_nodes: result.data.ghost_nodes ?? [],
      inline_suggestions: result.data.inline_suggestions ?? [],
      model: result.model,
    });
  } catch (error) {
    return handleError(c, error);
  }
});

// ---------- POST /expand ----------

ai.post('/expand', async (c) => {
  try {
    const body = await c.req.json();

    const system_prompt = requireString(body, 'system_prompt', MAX_SYSTEM_PROMPT_LENGTH);
    const node = requireObject(body, 'node');

    if (typeof node.node_id !== 'string' || typeof node.content !== 'string') {
      throw new ValidationError('node must have node_id and content strings');
    }
    if ((node.content as string).length > MAX_CONTENT_LENGTH) {
      throw new ValidationError(`node content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
    }

    const expansion_type = requireString(body, 'expansion_type');
    if (!['expand', 'rewrite', 'alternatives'].includes(expansion_type)) {
      throw new ValidationError('expansion_type must be one of: expand, rewrite, alternatives');
    }

    const num_variants = Math.min(5, Math.max(1, Number(body.num_variants) || 2));

    const prompt = buildExpansionPrompt({
      system_prompt,
      node: node as { node_id: string; content: string },
      expansion_type: expansion_type as 'expand' | 'rewrite' | 'alternatives',
      context_path: body.context_path as any,
      branch_canon: body.branch_canon as any,
      creator_profile: body.creator_profile as any,
      num_variants,
    });

    const result = await generateStructuredText<ExpansionResponse>({
      prompt,
      model: body.model as string | undefined,
    });

    const { sub } = c.get('user');
    recordUsage(sub, '/ai/expand').catch((err) =>
      console.error('Failed to record usage:', err)
    );

    return c.json({
      expansions: result.data.expansions ?? [],
      model: result.model,
    });
  } catch (error) {
    return handleError(c, error);
  }
});

// ---------- POST /canon-diff ----------

ai.post('/canon-diff', async (c) => {
  try {
    const body = await c.req.json();

    const system_prompt = requireString(body, 'system_prompt', MAX_SYSTEM_PROMPT_LENGTH);
    const current_canon = requireObject(body, 'current_canon');
    const recent_nodes = requireArray(body, 'recent_nodes');

    for (const node of recent_nodes) {
      if (typeof node !== 'object' || node === null) {
        throw new ValidationError('Each recent_nodes entry must be an object');
      }
      const n = node as Record<string, unknown>;
      if (typeof n.node_id !== 'string' || typeof n.content !== 'string') {
        throw new ValidationError('Each recent_nodes entry must have node_id and content strings');
      }
      if (n.content.length > MAX_CONTENT_LENGTH) {
        throw new ValidationError(`recent_nodes node content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
      }
    }

    const prompt = buildCanonDiffPrompt({
      system_prompt,
      current_canon: current_canon as any,
      recent_nodes: recent_nodes as { node_id: string; content: string }[],
      creator_profile: body.creator_profile as any,
    });

    const result = await generateStructuredText<CanonDiffResponse>({
      prompt,
      model: body.model as string | undefined,
    });

    const { sub } = c.get('user');
    recordUsage(sub, '/ai/canon-diff').catch((err) =>
      console.error('Failed to record usage:', err)
    );

    return c.json({
      suggested_updates: result.data.suggested_updates ?? [],
      reasoning: result.data.reasoning ?? '',
      confidence: result.data.confidence ?? 0,
      model: result.model,
    });
  } catch (error) {
    return handleError(c, error);
  }
});

// ---------- POST /merge-propose ----------

ai.post('/merge-propose', async (c) => {
  try {
    const body = await c.req.json();

    const system_prompt = requireString(body, 'system_prompt', MAX_SYSTEM_PROMPT_LENGTH);
    const merge_point_node_id = requireString(body, 'merge_point_node_id');

    // Validate branch_a
    const branch_a = requireObject(body, 'branch_a');
    if (!Array.isArray(branch_a.path) || branch_a.path.length === 0) {
      throw new ValidationError('branch_a.path is required and must be a non-empty array');
    }

    // Validate branch_b
    const branch_b = requireObject(body, 'branch_b');
    if (!Array.isArray(branch_b.path) || branch_b.path.length === 0) {
      throw new ValidationError('branch_b.path is required and must be a non-empty array');
    }

    const prompt = buildMergeProposalPrompt({
      system_prompt,
      branch_a: { path: branch_a.path as any, canon: branch_a.canon as any },
      branch_b: { path: branch_b.path as any, canon: branch_b.canon as any },
      merge_point_node_id,
      creator_profile: body.creator_profile as any,
    });

    const result = await generateStructuredText<MergeProposalResponse>({
      prompt,
      model: body.model as string | undefined,
    });

    const { sub } = c.get('user');
    recordUsage(sub, '/ai/merge-propose').catch((err) =>
      console.error('Failed to record usage:', err)
    );

    return c.json({
      merged_content: result.data.merged_content ?? '',
      reconciled_canon: result.data.reconciled_canon ?? {},
      conflicts: result.data.conflicts ?? [],
      confidence: result.data.confidence ?? 0,
      model: result.model,
    });
  } catch (error) {
    return handleError(c, error);
  }
});

// ---------- POST /generate-structure ----------

interface StructureNode {
  title: string;
  summary: string;
}

interface StructureResponse {
  nodes: StructureNode[];
}

ai.post('/generate-structure', async (c) => {
  try {
    const body = await c.req.json();
    const { sub: userId } = c.get('user');

    const story_context = requireString(body, 'story_context', MAX_SYSTEM_PROMPT_LENGTH);
    const num_nodes = Math.min(10, Math.max(1, Number(body.num_nodes) || 5));

    // Load creator profile for style conditioning
    const creatorProfile = await getCreatorProfile(userId);
    let creatorSection = '';
    if (creatorProfile) {
      const lines: string[] = [];
      if (creatorProfile.preferred_genres?.length) lines.push(`- Genres: ${creatorProfile.preferred_genres.join(', ')}`);
      if (creatorProfile.favorite_themes?.length) lines.push(`- Themes: ${creatorProfile.favorite_themes.join(', ')}`);
      if (creatorProfile.writing_style) lines.push(`- Tone: ${creatorProfile.writing_style}`);
      if (creatorProfile.disliked_elements?.length) lines.push(`- Avoid: ${creatorProfile.disliked_elements.join(', ')}`);
      if (lines.length > 0) {
        creatorSection = `\n\nCreator style preferences:\n${lines.join('\n')}\n\nIncorporate these preferences into the narrative structure.`;
      }
    }

    const prompt = `You are a story architect. Based on the following creative brief, generate exactly ${num_nodes} story beats that form a compelling narrative arc.

Creative brief:
${story_context}${creatorSection}

Return a JSON object with a "nodes" array containing exactly ${num_nodes} objects, each with:
- "title": A short, evocative act/beat title (e.g. "The Awakening", "Descent into Shadow")
- "summary": A 1-2 sentence description of what happens in this beat

Structure them as a coherent act-based narrative with rising action, climax, and resolution. Make titles specific to this story, not generic labels.

Return ONLY valid JSON: {"nodes": [{"title": "...", "summary": "..."}, ...]}`;

    const result = await generateStructuredText<StructureResponse>({
      prompt,
      model: 'gemini-2.5-flash-lite',
    });

    const { sub } = c.get('user');
    recordUsage(sub, '/ai/generate-structure').catch((err) =>
      console.error('Failed to record usage:', err)
    );

    return c.json({
      nodes: result.data.nodes ?? [],
      model: result.model,
    });
  } catch (error) {
    return handleError(c, error);
  }
});

// ---------- POST /suggest-from-timeline ----------

ai.post('/suggest-from-timeline', async (c) => {
  try {
    const body = await c.req.json();
    const { sub: userId } = c.get('user');

    const timelineId = requireString(body, 'timelineId');
    const nodeId = requireString(body, 'nodeId');
    const num_suggestions = Math.min(10, Math.max(1, Number(body.numSuggestions) || 3));

    const ctx = await buildAIContext(timelineId, nodeId, body.branchId);

    if (!ctx.systemPrompt) {
      throw new ValidationError('Timeline has no system_prompt configured');
    }
    if (ctx.activePath.length === 0) {
      throw new ValidationError('No nodes found for the given nodeId');
    }

    // Use creator profile from request body, or load from DB
    const creatorProfile = body.creatorProfile ?? (await getCreatorProfile(userId));

    const prompt = buildSuggestionPrompt({
      system_prompt: ctx.systemPrompt,
      active_path: ctx.activePath.map((n) => ({
        node_id: n.node_id,
        content: n.content,
        title: n.title,
      })),
      branch_canon: ctx.branchCanon
        ? {
            setting: ctx.branchCanon.setting ?? undefined,
            characters: ctx.branchCanon.characters ?? undefined,
            tone: ctx.branchCanon.tone ?? undefined,
            rules: ctx.branchCanon.rules ?? undefined,
          }
        : undefined,
      creator_profile: creatorProfile,
      num_suggestions,
    });

    const result = await generateStructuredText<SuggestionResponse>({
      prompt,
      model: body.model as string | undefined,
    });

    recordUsage(userId, '/ai/suggest-from-timeline').catch((err) =>
      console.error('Failed to record usage:', err)
    );

    return c.json({
      ghost_nodes: result.data.ghost_nodes ?? [],
      inline_suggestions: result.data.inline_suggestions ?? [],
      model: result.model,
    });
  } catch (error) {
    return handleError(c, error);
  }
});

// ---------- POST /expand-from-timeline ----------

ai.post('/expand-from-timeline', async (c) => {
  try {
    const body = await c.req.json();
    const { sub: userId } = c.get('user');

    const timelineId = requireString(body, 'timelineId');
    const nodeId = requireString(body, 'nodeId');
    const expansion_type = requireString(body, 'expansionType');

    if (!['expand', 'rewrite', 'alternatives'].includes(expansion_type)) {
      throw new ValidationError('expansionType must be one of: expand, rewrite, alternatives');
    }

    const num_variants = Math.min(5, Math.max(1, Number(body.numVariants) || 2));

    const ctx = await buildAIContext(timelineId, nodeId, body.branchId);

    if (!ctx.systemPrompt) {
      throw new ValidationError('Timeline has no system_prompt configured');
    }
    if (ctx.activePath.length === 0) {
      throw new ValidationError('No nodes found for the given nodeId');
    }

    const currentNode = ctx.activePath[ctx.activePath.length - 1];
    const contextPath = ctx.activePath.slice(0, -1);

    const creatorProfile = body.creatorProfile ?? (await getCreatorProfile(userId));

    const prompt = buildExpansionPrompt({
      system_prompt: ctx.systemPrompt,
      node: {
        node_id: currentNode.node_id,
        content: currentNode.content,
        title: currentNode.title,
      },
      expansion_type: expansion_type as 'expand' | 'rewrite' | 'alternatives',
      context_path: contextPath.length > 0
        ? contextPath.map((n) => ({
            node_id: n.node_id,
            content: n.content,
            title: n.title,
          }))
        : undefined,
      branch_canon: ctx.branchCanon
        ? {
            setting: ctx.branchCanon.setting ?? undefined,
            characters: ctx.branchCanon.characters ?? undefined,
            tone: ctx.branchCanon.tone ?? undefined,
            rules: ctx.branchCanon.rules ?? undefined,
          }
        : undefined,
      creator_profile: creatorProfile,
      num_variants,
    });

    const result = await generateStructuredText<ExpansionResponse>({
      prompt,
      model: body.model as string | undefined,
    });

    recordUsage(userId, '/ai/expand-from-timeline').catch((err) =>
      console.error('Failed to record usage:', err)
    );

    return c.json({
      expansions: result.data.expansions ?? [],
      model: result.model,
    });
  } catch (error) {
    return handleError(c, error);
  }
});

// ---------- Error Handler ----------

function handleError(c: any, error: unknown) {
  if (error instanceof ValidationError) {
    return c.json({ error: error.message }, 400);
  }

  const message = error instanceof Error ? error.message : 'Unknown error';

  // AI response parse failures → 502
  if (message.includes('Failed to parse AI response')) {
    return c.json(
      {
        error: 'AI returned unparseable response',
        raw_response: message.slice(0, 300),
      },
      502
    );
  }

  console.error('AI route error:', error);
  return c.json({ error: message }, 500);
}

export default ai;
