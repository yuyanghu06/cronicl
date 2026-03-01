import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db/client';
import {
  timelines,
  timelineNodes,
  branches,
  branchCanon,
} from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getAncestorPath } from '../services/context';

const app = new Hono();

app.use('*', authMiddleware);

// ---------- Ownership Helper ----------

async function verifyTimelineOwnership(timelineId: string, userId: string) {
  return db.query.timelines.findFirst({
    where: and(eq(timelines.id, timelineId), eq(timelines.userId, userId)),
  });
}

// ---------- Timeline CRUD ----------

// POST / — Create timeline
app.post('/', async (c) => {
  console.log('[Timelines API] POST / - Create timeline');
  try {
    const { sub: userId } = c.get('user');
    console.log('[Timelines API] User ID:', userId);
    
    const body = await c.req.json();
    console.log('[Timelines API] Request body:', JSON.stringify(body));

    if (!body.title || typeof body.title !== 'string') {
      console.log('[Timelines API] Validation failed: title is required');
      return c.json({ error: 'title is required' }, 400);
    }

    console.log('[Timelines API] Inserting timeline into database...');
    const [timeline] = await db
      .insert(timelines)
      .values({
        userId,
        title: body.title,
        summary: body.summary ?? null,
        systemPrompt: body.system_prompt ?? null,
        tags: body.tags ?? null,
        status: body.status ?? 'draft',
      })
      .returning();

    console.log('[Timelines API] Timeline created:', timeline.id);
    return c.json(timeline, 201);
  } catch (error) {
    console.error('[Timelines API] Error creating timeline:', error);
    return c.json({ error: 'Failed to create timeline', details: String(error) }, 500);
  }
});

// GET / — List user's timelines
app.get('/', async (c) => {
  const { sub: userId } = c.get('user');

  const rows = await db
    .select({
      id: timelines.id,
      title: timelines.title,
      summary: timelines.summary,
      systemPrompt: timelines.systemPrompt,
      tags: timelines.tags,
      status: timelines.status,
      createdAt: timelines.createdAt,
      updatedAt: timelines.updatedAt,
      nodeCount: sql<number>`(SELECT count(*) FROM timeline_nodes WHERE timeline_id = ${timelines.id})::int`,
      branchCount: sql<number>`(SELECT count(*) FROM branches WHERE timeline_id = ${timelines.id})::int`,
    })
    .from(timelines)
    .where(eq(timelines.userId, userId))
    .orderBy(timelines.updatedAt);

  return c.json(rows);
});

// GET /:id — Get timeline with nodes + branches + canon
app.get('/:id', async (c) => {
  const { sub: userId } = c.get('user');
  const { id } = c.req.param();

  const timeline = await db.query.timelines.findFirst({
    where: and(eq(timelines.id, id), eq(timelines.userId, userId)),
    with: {
      nodes: true,
      branches: {
        with: { canon: true },
      },
    },
  });

  if (!timeline) return c.json({ error: 'Not found' }, 404);
  return c.json(timeline);
});

// PATCH /:id — Update timeline metadata
app.patch('/:id', async (c) => {
  const { sub: userId } = c.get('user');
  const { id } = c.req.param();

  const existing = await verifyTimelineOwnership(id, userId);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.summary !== undefined) updates.summary = body.summary;
  if (body.system_prompt !== undefined) updates.systemPrompt = body.system_prompt;
  if (body.tags !== undefined) updates.tags = body.tags;
  if (body.status !== undefined) updates.status = body.status;

  const [updated] = await db
    .update(timelines)
    .set(updates)
    .where(eq(timelines.id, id))
    .returning();

  return c.json(updated);
});

// DELETE /:id — Delete timeline (FK cascade handles children)
app.delete('/:id', async (c) => {
  const { sub: userId } = c.get('user');
  const { id } = c.req.param();

  const existing = await verifyTimelineOwnership(id, userId);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  await db.delete(timelines).where(eq(timelines.id, id));
  return c.json({ deleted: true });
});

// ---------- Node CRUD ----------

// POST /:timelineId/nodes — Create node
app.post('/:timelineId/nodes', async (c) => {
  const { sub: userId } = c.get('user');
  const { timelineId } = c.req.param();

  const existing = await verifyTimelineOwnership(timelineId, userId);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json();
  if (!body.title || typeof body.title !== 'string') {
    return c.json({ error: 'title is required' }, 400);
  }

  const [node] = await db
    .insert(timelineNodes)
    .values({
      timelineId,
      parentId: body.parent_id ?? null,
      label: body.label ?? null,
      title: body.title,
      content: body.content ?? '',
      status: body.status ?? 'draft',
      positionX: body.position_x ?? 0,
      positionY: body.position_y ?? 0,
      sortOrder: body.sort_order ?? 0,
    })
    .returning();

  return c.json(node, 201);
});

// GET /:timelineId/nodes — List all nodes in timeline
app.get('/:timelineId/nodes', async (c) => {
  const { sub: userId } = c.get('user');
  const { timelineId } = c.req.param();

  const existing = await verifyTimelineOwnership(timelineId, userId);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const nodes = await db
    .select()
    .from(timelineNodes)
    .where(eq(timelineNodes.timelineId, timelineId))
    .orderBy(timelineNodes.sortOrder);

  return c.json(nodes);
});

// GET /:timelineId/nodes/:nodeId — Get single node
app.get('/:timelineId/nodes/:nodeId', async (c) => {
  const { sub: userId } = c.get('user');
  const { timelineId, nodeId } = c.req.param();

  const existing = await verifyTimelineOwnership(timelineId, userId);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const node = await db.query.timelineNodes.findFirst({
    where: and(
      eq(timelineNodes.id, nodeId),
      eq(timelineNodes.timelineId, timelineId)
    ),
  });

  if (!node) return c.json({ error: 'Not found' }, 404);
  return c.json(node);
});

// PATCH /:timelineId/nodes/:nodeId — Update node
app.patch('/:timelineId/nodes/:nodeId', async (c) => {
  const { sub: userId } = c.get('user');
  const { timelineId, nodeId } = c.req.param();

  const existing = await verifyTimelineOwnership(timelineId, userId);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;
  if (body.label !== undefined) updates.label = body.label;
  if (body.status !== undefined) updates.status = body.status;
  if (body.parent_id !== undefined) updates.parentId = body.parent_id;
  if (body.position_x !== undefined) updates.positionX = body.position_x;
  if (body.position_y !== undefined) updates.positionY = body.position_y;
  if (body.sort_order !== undefined) updates.sortOrder = body.sort_order;
  if (body.image_url !== undefined) updates.imageUrl = body.image_url;

  const [updated] = await db
    .update(timelineNodes)
    .set(updates)
    .where(
      and(eq(timelineNodes.id, nodeId), eq(timelineNodes.timelineId, timelineId))
    )
    .returning();

  if (!updated) return c.json({ error: 'Not found' }, 404);
  return c.json(updated);
});

// DELETE /:timelineId/nodes/:nodeId — Delete node (re-parent children)
app.delete('/:timelineId/nodes/:nodeId', async (c) => {
  const { sub: userId } = c.get('user');
  const { timelineId, nodeId } = c.req.param();

  const existing = await verifyTimelineOwnership(timelineId, userId);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const node = await db.query.timelineNodes.findFirst({
    where: and(
      eq(timelineNodes.id, nodeId),
      eq(timelineNodes.timelineId, timelineId)
    ),
  });

  if (!node) return c.json({ error: 'Not found' }, 404);

  await db.transaction(async (tx) => {
    // Re-parent children to deleted node's parent
    await tx
      .update(timelineNodes)
      .set({ parentId: node.parentId })
      .where(eq(timelineNodes.parentId, nodeId));

    await tx
      .delete(timelineNodes)
      .where(eq(timelineNodes.id, nodeId));
  });

  return c.json({ deleted: true });
});

// GET /:timelineId/nodes/:nodeId/path — Get ancestor path
app.get('/:timelineId/nodes/:nodeId/path', async (c) => {
  const { sub: userId } = c.get('user');
  const { timelineId, nodeId } = c.req.param();

  const existing = await verifyTimelineOwnership(timelineId, userId);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const path = await getAncestorPath(nodeId);
  return c.json(path);
});

// ---------- Branch + Canon CRUD ----------

// POST /:timelineId/branches — Create branch (auto-creates empty canon)
app.post('/:timelineId/branches', async (c) => {
  const { sub: userId } = c.get('user');
  const { timelineId } = c.req.param();

  const existing = await verifyTimelineOwnership(timelineId, userId);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json();
  if (!body.name || typeof body.name !== 'string') {
    return c.json({ error: 'name is required' }, 400);
  }
  if (!body.branch_point_node_id || typeof body.branch_point_node_id !== 'string') {
    return c.json({ error: 'branch_point_node_id is required' }, 400);
  }

  const result = await db.transaction(async (tx) => {
    const [branch] = await tx
      .insert(branches)
      .values({
        timelineId,
        branchPointNodeId: body.branch_point_node_id,
        name: body.name,
        description: body.description ?? null,
      })
      .returning();

    const [canon] = await tx
      .insert(branchCanon)
      .values({ branchId: branch.id })
      .returning();

    return { ...branch, canon };
  });

  return c.json(result, 201);
});

// GET /:timelineId/branches — List branches with canon
app.get('/:timelineId/branches', async (c) => {
  const { sub: userId } = c.get('user');
  const { timelineId } = c.req.param();

  const existing = await verifyTimelineOwnership(timelineId, userId);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const rows = await db.query.branches.findMany({
    where: eq(branches.timelineId, timelineId),
    with: { canon: true },
  });

  return c.json(rows);
});

// DELETE /:timelineId/branches/:branchId — Delete branch (does NOT delete nodes)
app.delete('/:timelineId/branches/:branchId', async (c) => {
  const { sub: userId } = c.get('user');
  const { timelineId, branchId } = c.req.param();

  const existing = await verifyTimelineOwnership(timelineId, userId);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const branch = await db.query.branches.findFirst({
    where: and(eq(branches.id, branchId), eq(branches.timelineId, timelineId)),
  });

  if (!branch) return c.json({ error: 'Not found' }, 404);

  await db.delete(branches).where(eq(branches.id, branchId));
  return c.json({ deleted: true });
});

// GET /:timelineId/branches/:branchId/canon — Get branch canon
app.get('/:timelineId/branches/:branchId/canon', async (c) => {
  const { sub: userId } = c.get('user');
  const { timelineId, branchId } = c.req.param();

  const existing = await verifyTimelineOwnership(timelineId, userId);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const branch = await db.query.branches.findFirst({
    where: and(eq(branches.id, branchId), eq(branches.timelineId, timelineId)),
  });
  if (!branch) return c.json({ error: 'Not found' }, 404);

  const canon = await db.query.branchCanon.findFirst({
    where: eq(branchCanon.branchId, branchId),
  });

  if (!canon) return c.json({ error: 'Not found' }, 404);
  return c.json(canon);
});

// PUT /:timelineId/branches/:branchId/canon — Update/replace branch canon
app.put('/:timelineId/branches/:branchId/canon', async (c) => {
  const { sub: userId } = c.get('user');
  const { timelineId, branchId } = c.req.param();

  const existing = await verifyTimelineOwnership(timelineId, userId);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const branch = await db.query.branches.findFirst({
    where: and(eq(branches.id, branchId), eq(branches.timelineId, timelineId)),
  });
  if (!branch) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json();

  const [updated] = await db
    .update(branchCanon)
    .set({
      setting: body.setting ?? null,
      characters: body.characters ?? null,
      tone: body.tone ?? null,
      rules: body.rules ?? null,
      updatedAt: new Date(),
    })
    .where(eq(branchCanon.branchId, branchId))
    .returning();

  if (!updated) return c.json({ error: 'Not found' }, 404);
  return c.json(updated);
});

export default app;
