import { pgTable, uuid, text, timestamp, integer, unique, index, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Used for opaque session tokens (tokenHash, userId, expiresAt, revokedAt)
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tokenHashIdx: index('idx_refresh_tokens_token_hash').on(table.tokenHash),
    userIdIdx: index('idx_refresh_tokens_user_id').on(table.userId),
  })
);

export const authEvents = pgTable(
  'auth_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    eventType: text('event_type').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_auth_events_user_id').on(table.userId),
  })
);

export const oauthIdentities = pgTable(
  'oauth_identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    provider: text('provider').notNull(),
    providerSub: text('provider_sub').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueProviderSub: unique().on(table.provider, table.providerSub),
    userIdIdx: index('idx_oauth_identities_user_id').on(table.userId),
  })
);

export const usageRecords = pgTable(
  'usage_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    endpoint: text('endpoint').notNull(),
    tokensIn: integer('tokens_in'),
    tokensOut: integer('tokens_out'),
    estimatedCostUsd: text('estimated_cost_usd'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdCreatedAtIdx: index('idx_usage_records_user_id_created_at').on(table.userId, table.createdAt),
  })
);

export const userQuotas = pgTable('user_quotas', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  dailyRequests: integer('daily_requests').default(100).notNull(),
  monthlyRequests: integer('monthly_requests').default(2000).notNull(),
});

// ---------- Timelines ----------

export const timelines = pgTable(
  'timelines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    systemPrompt: text('system_prompt'),
    visualTheme: text('visual_theme'),
    visionBlurb: text('vision_blurb'),
    tags: text('tags').array(),
    status: text('status').default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_timelines_user_id').on(table.userId),
  })
);

export const timelineNodes = pgTable(
  'timeline_nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    timelineId: uuid('timeline_id')
      .references(() => timelines.id, { onDelete: 'cascade' })
      .notNull(),
    parentId: uuid('parent_id').references((): AnyPgColumn => timelineNodes.id, { onDelete: 'set null' }),
    label: text('label'),
    title: text('title').notNull(),
    content: text('content').default(''),
    status: text('status').default('draft'),
    positionX: integer('position_x').default(0),
    positionY: integer('position_y').default(0),
    sortOrder: integer('sort_order').default(0),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    timelineIdIdx: index('idx_timeline_nodes_timeline_id').on(table.timelineId),
    parentIdIdx: index('idx_timeline_nodes_parent_id').on(table.parentId),
  })
);

export const branches = pgTable(
  'branches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    timelineId: uuid('timeline_id')
      .references(() => timelines.id, { onDelete: 'cascade' })
      .notNull(),
    branchPointNodeId: uuid('branch_point_node_id')
      .references(() => timelineNodes.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    timelineIdIdx: index('idx_branches_timeline_id').on(table.timelineId),
  })
);

export const branchCanon = pgTable('branch_canon', {
  id: uuid('id').primaryKey().defaultRandom(),
  branchId: uuid('branch_id')
    .references(() => branches.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  setting: text('setting'),
  characters: text('characters').array(),
  tone: text('tone'),
  rules: text('rules').array(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const creatorProfiles = pgTable('creator_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  stylePreferences: text('style_preferences').array(),
  favoriteThemes: text('favorite_themes').array(),
  preferredTone: text('preferred_tone'),
  explorationRatio: text('exploration_ratio').default('0.3'),
  dislikedElements: text('disliked_elements').array(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ---------- Character Bible ----------

export const characterBible = pgTable(
  'character_bible',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    timelineId: uuid('timeline_id')
      .references(() => timelines.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    description: text('description'),
    appearanceGuide: text('appearance_guide'),
    referenceImageUrl: text('reference_image_url'),
    aliases: text('aliases').array(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    timelineIdIdx: index('idx_character_bible_timeline_id').on(table.timelineId),
    uniqueTimelineName: unique().on(table.timelineId, table.name),
  })
);

// ---------- Relations ----------

export const usersRelations = relations(users, ({ many, one }) => ({
  timelines: many(timelines),
  creatorProfile: one(creatorProfiles),
}));

export const timelinesRelations = relations(timelines, ({ one, many }) => ({
  user: one(users, { fields: [timelines.userId], references: [users.id] }),
  nodes: many(timelineNodes),
  branches: many(branches),
  characters: many(characterBible),
}));

export const timelineNodesRelations = relations(timelineNodes, ({ one, many }) => ({
  timeline: one(timelines, { fields: [timelineNodes.timelineId], references: [timelines.id] }),
  parent: one(timelineNodes, {
    fields: [timelineNodes.parentId],
    references: [timelineNodes.id],
    relationName: 'nodeParent',
  }),
  children: many(timelineNodes, { relationName: 'nodeParent' }),
}));

export const branchesRelations = relations(branches, ({ one }) => ({
  timeline: one(timelines, { fields: [branches.timelineId], references: [timelines.id] }),
  branchPointNode: one(timelineNodes, { fields: [branches.branchPointNodeId], references: [timelineNodes.id] }),
  canon: one(branchCanon),
}));

export const branchCanonRelations = relations(branchCanon, ({ one }) => ({
  branch: one(branches, { fields: [branchCanon.branchId], references: [branches.id] }),
}));

export const characterBibleRelations = relations(characterBible, ({ one }) => ({
  timeline: one(timelines, { fields: [characterBible.timelineId], references: [timelines.id] }),
}));

export const creatorProfilesRelations = relations(creatorProfiles, ({ one }) => ({
  user: one(users, { fields: [creatorProfiles.userId], references: [users.id] }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type AuthEvent = typeof authEvents.$inferSelect;
export type OauthIdentity = typeof oauthIdentities.$inferSelect;
export type NewOauthIdentity = typeof oauthIdentities.$inferInsert;
export type UsageRecord = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;
export type UserQuota = typeof userQuotas.$inferSelect;
export type Timeline = typeof timelines.$inferSelect;
export type NewTimeline = typeof timelines.$inferInsert;
export type TimelineNode = typeof timelineNodes.$inferSelect;
export type NewTimelineNode = typeof timelineNodes.$inferInsert;
export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;
export type BranchCanon = typeof branchCanon.$inferSelect;
export type NewBranchCanon = typeof branchCanon.$inferInsert;
export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type NewCreatorProfile = typeof creatorProfiles.$inferInsert;
export type CharacterBibleEntry = typeof characterBible.$inferSelect;
export type NewCharacterBibleEntry = typeof characterBible.$inferInsert;
