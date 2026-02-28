import { db } from '../db/client';
import { timelines, timelineNodes, branchCanon, creatorProfiles } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export interface PathNode {
  node_id: string;
  title: string;
  content: string;
  label: string | null;
}

export interface AIContext {
  systemPrompt: string | null;
  branchCanon: {
    setting?: string | null;
    characters?: string[] | null;
    tone?: string | null;
    rules?: string[] | null;
  } | null;
  activePath: PathNode[];
}

/**
 * Walk from a node up to the root via parentId using a recursive CTE.
 * Returns array in root-first order [root, ..., parent, currentNode].
 */
export async function getAncestorPath(nodeId: string): Promise<PathNode[]> {
  const result = await db.execute(sql`
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_id, title, content, label, 0 AS depth
      FROM timeline_nodes
      WHERE id = ${nodeId}
      UNION ALL
      SELECT tn.id, tn.parent_id, tn.title, tn.content, tn.label, a.depth + 1
      FROM timeline_nodes tn
      JOIN ancestors a ON tn.id = a.parent_id
      WHERE a.depth < 200
    )
    SELECT id, title, content, label
    FROM ancestors
    ORDER BY depth DESC
  `);

  return (result as any[]).map((row) => ({
    node_id: row.id,
    title: row.title,
    content: row.content ?? '',
    label: row.label,
  }));
}

/**
 * Build full AI context from database: system prompt, ancestor path, branch canon.
 */
export async function buildAIContext(
  timelineId: string,
  nodeId: string,
  branchId?: string
): Promise<AIContext> {
  const timeline = await db.query.timelines.findFirst({
    where: eq(timelines.id, timelineId),
    columns: { systemPrompt: true },
  });

  const activePath = await getAncestorPath(nodeId);

  let canon: AIContext['branchCanon'] = null;
  if (branchId) {
    const canonRow = await db.query.branchCanon.findFirst({
      where: eq(branchCanon.branchId, branchId),
    });
    if (canonRow) {
      canon = {
        setting: canonRow.setting,
        characters: canonRow.characters,
        tone: canonRow.tone,
        rules: canonRow.rules,
      };
    }
  }

  return {
    systemPrompt: timeline?.systemPrompt ?? null,
    branchCanon: canon,
    activePath,
  };
}

/**
 * Load creator profile from DB and format for prompt builder.
 */
export async function getCreatorProfile(userId: string) {
  const profile = await db.query.creatorProfiles.findFirst({
    where: eq(creatorProfiles.userId, userId),
  });
  if (!profile) return undefined;
  return {
    preferred_genres: profile.stylePreferences ?? undefined,
    favorite_themes: profile.favoriteThemes ?? undefined,
    writing_style: profile.preferredTone ?? undefined,
    exploration_ratio: profile.explorationRatio ? parseFloat(profile.explorationRatio) : 0.3,
    disliked_elements: profile.dislikedElements ?? undefined,
  };
}
