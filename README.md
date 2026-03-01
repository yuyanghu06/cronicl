# Cronicl Backend

Secure orchestration layer for the Cronicl cinematic storytelling platform. Handles authentication, AI proxy, image generation, timeline/node CRUD, character bible, and usage metering. The creative graph lives on the client — the backend enables intelligence and rendering.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** [Hono](https://hono.dev/)
- **ORM:** [Drizzle](https://orm.drizzle.team/) with PostgreSQL
- **Job Queue:** [BullMQ](https://bullmq.io/) + Redis (optional — falls back to sync)
- **AI Provider:** Google Gemini (text, structured JSON, image generation)
- **Auth:** Session-based (opaque hashed tokens) + OAuth (Railway) + email/password

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env`:
```env
# Required
DATABASE_URL=postgres://user:pass@host:5432/db

# Auth (optional in dev — auto-login bypass enabled)
RAILWAY_OAUTH_CLIENT_ID=...
RAILWAY_OAUTH_CLIENT_SECRET=...
RAILWAY_OAUTH_CALLBACK_URL=http://localhost:3000/auth/callback

# AI
GEMINI_API_KEY=your-gemini-key

# Optional
REDIS_URL=redis://localhost:6379    # Enables async image job queue
FRONTEND_URL=http://localhost:5173  # CORS origin
PORT=3000
NODE_ENV=development
```

3. Push schema to database:
```bash
npm run db:push
```

4. Start dev server:
```bash
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload (tsx watch) |
| `npm run build` | Build for production (tsup + generate migrations) |
| `npm run start` | Run migrations + start production server |
| `npm run db:generate` | Generate SQL migrations from schema changes |
| `npm run db:push` | Sync schema directly to database |
| `npm run db:studio` | Open Drizzle Studio (DB explorer) |

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Core user accounts |
| `refresh_tokens` | Hashed session tokens with expiry/revocation |
| `auth_events` | Login/auth activity log |
| `oauth_identities` | OAuth provider linkage (provider + sub) |
| `timelines` | Story projects (title, summary, system_prompt, visual_theme, vision_blurb, tags, status) |
| `timeline_nodes` | Tree-structured story nodes (label, title, content, position, image_url, parent_id) |
| `branches` | Named branches from a branch point node |
| `branch_canon` | Per-branch world rules (setting, characters, tone, rules) |
| `character_bible` | Character reference library (name, description, appearance_guide, reference_image_url, aliases) |
| `creator_profiles` | User style preferences + exploration ratio |
| `usage_records` | Per-request usage tracking |
| `user_quotas` | Daily/monthly request limits per user |

## API Endpoints

### Auth (`/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Email + password registration |
| POST | `/auth/login/email` | Email + password login |
| GET | `/auth/login` | Initiate OAuth flow |
| GET | `/auth/callback` | OAuth callback (creates/links user, sets session cookie) |
| POST | `/auth/logout` | Revoke session |

### User (`/me`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/me/` | Current user profile |
| GET | `/me/usage/current` | Daily + monthly usage (used/limit/remaining) |
| GET | `/me/profile` | Creator profile preferences |
| PUT | `/me/profile` | Update creator profile |

### Timelines (`/api/timelines`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create timeline |
| GET | `/` | List timelines (paginated, with node/branch counts) |
| GET | `/:id` | Get timeline with all nodes, branches, canon |
| PATCH | `/:id` | Update timeline metadata |
| DELETE | `/:id` | Delete timeline (cascades) |

### Nodes (`/api/timelines/:timelineId/nodes`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create node |
| GET | `/` | List all nodes (sorted by sort_order) |
| GET | `/images` | Lazy-load image URLs only |
| GET | `/:nodeId` | Get single node |
| PATCH | `/:nodeId` | Update node |
| DELETE | `/:nodeId` | Delete node (re-parents children) |
| GET | `/:nodeId/path` | Get ancestor path to root |

### Branches & Canon (`/api/timelines/:timelineId/branches`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create branch + empty canon |
| GET | `/` | List branches with canon |
| DELETE | `/:branchId` | Delete branch |
| GET | `/:branchId/canon` | Get branch canon |
| PUT | `/:branchId/canon` | Update branch canon |

### Character Bible (`/api/timelines/:timelineId/characters`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List characters for timeline |
| POST | `/` | Create character |
| PUT | `/:characterId` | Update character |
| DELETE | `/:characterId` | Delete character |
| POST | `/:characterId/generate-portrait` | Generate reference portrait image |

### AI Endpoints (`/ai`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/suggest` | Generate ghost node suggestions from raw context |
| POST | `/expand` | Expand/rewrite/alternatives for a node |
| POST | `/canon-diff` | Detect canon changes from recent edits |
| POST | `/merge-propose` | Propose merged content from two branches |
| POST | `/suggest-from-timeline` | Suggestions using timeline DB context |
| POST | `/expand-from-timeline` | Expand using timeline DB context |
| POST | `/generate-structure` | Generate story beats from creative brief |
| POST | `/generate-visual-theme` | Generate art direction style guide |
| POST | `/generate-vision-blurb` | Generate project vision anchor blurb |

### Generation Proxy (`/api/generate`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/generate/text` | Raw text generation |
| POST | `/generate/image` | Image generation with scene extraction + character matching + vision/style injection |

### Image Jobs (`/api/jobs/images`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/generate` | Submit async image generation job |
| GET | `/jobs/:jobId` | Poll job status |

### Utility

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |

## Image Generation Pipeline

The image proxy enriches prompts before calling Gemini:

1. Load timeline `visualTheme`, `systemPrompt`, and `visionBlurb`
2. Wrap scene text with style/vision context
3. Extract setting and characters from scene text (parallel structured AI calls)
4. Match extracted characters against the timeline's character bible (name + alias matching)
5. Inject labeled prompt sections: `[PROJECT VISION]`, `[VISUAL STYLE GUIDE]`, `[SETTING]`, `[CHARACTERS]`
6. Call Gemini image generation

Async jobs (via BullMQ) follow the same pipeline with retry logic and rate limiting.

## Middleware

- **Auth:** Validates session cookie, injects user context. Dev bypass in non-production.
- **Rate Limiting:** In-memory sliding window — 15 req/min (auth), 30 req/min (AI), 10 req/min (media).
- **Quota:** Framework ready with `user_quotas` table (currently passthrough).
- **CORS:** Configured per `FRONTEND_URL`.
- **Body Limit:** 5 MB global, 50 KB for AI routes.
- **Secure Headers:** Hono built-in.

## Security

- Opaque session tokens (SHA-256 hashed in DB, 7-day expiry, revocable)
- Scrypt password hashing with 16-byte salt
- HttpOnly, SameSite cookies
- Ownership verification on all timeline/node/branch operations
- Zod validation on all request bodies
- API key isolation (keys never exposed to client)
