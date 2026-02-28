# Cronicl Backend — Implementation Prompts
Each section below is a self-contained prompt for implementing that feature.
Sections already implemented have been removed — only remaining work is listed.

---

## SECTION 1 — Identity & Access Layer

**IMPLEMENTED** — See `src/routes/auth.ts`, `src/services/oauth.ts`, `src/services/token.ts`

- Railway OAuth login/callback (GET /auth/login, GET /auth/callback)
- JWT access tokens (15min) + rotating refresh tokens (7 days)
- oauth_identities table, users table, refresh_tokens table, auth_events table
- POST /auth/refresh, POST /auth/logout
- Per-user quotas (usage_records + user_quotas tables, middleware/quota.ts, services/usage.ts)
- GET /me/usage/current endpoint

---

## SECTION 2 — AI Suggestion Proxy Layer

**IMPLEMENTED** — See `src/routes/ai.ts`, `src/services/prompt.ts`, `src/services/ai.ts`

- POST /ai/suggest, POST /ai/expand, POST /ai/canon-diff, POST /ai/merge-propose
- POST /ai/suggest-from-timeline, POST /ai/expand-from-timeline (bonus: DB-backed context)

---

## SECTION 3 — Canon & Branch Support

**IMPLEMENTED** — Handled by Section 2 endpoints + `src/routes/timelines.ts`

- Branch/canon CRUD (timelines, nodes, branches, branchCanon tables)
- Canon-aware prompt conditioning in all AI endpoints
- Never auto-mutates structure; always returns suggestions

---

## SECTION 4 — Image Generation (Async Jobs, Phase 2+)

```
Implement async image generation job system.

Tech: Hono, BullMQ, Redis, S3-compatible storage, Gemini Imagen API

Current state:
- A synchronous POST /api/generate/image endpoint already exists
- It calls Gemini and returns base64 directly

What needs to change for Phase 2+:

1. Add Redis + BullMQ dependencies

2. Create src/services/queue.ts:
   - Initialize BullMQ queue ('image-generation')
   - Initialize worker process

3. Create `media_jobs` table in db/schema.ts:
   - id (UUID, PK)
   - user_id (FK → users.id)
   - job_type ('image' | 'video')
   - status ('queued' | 'running' | 'succeeded' | 'failed')
   - input_params (jsonb — prompt, negative_prompt, aspect_ratio, seed, quality)
   - output_urls (text[] — signed URLs)
   - error_message (text, nullable)
   - estimated_cost_usd (numeric, nullable)
   - created_at, started_at, completed_at (timestamptz)

4. POST /images/generate:
   - Validate input (prompt required, params within bounds)
   - Check user quota
   - Create media_jobs record with status 'queued'
   - Enqueue BullMQ job
   - Return { job_id }

5. GET /images/jobs/:id:
   - Return job status, output URLs (signed, time-limited), cost estimate
   - Only allow job owner to view

6. Image worker:
   - Pick up jobs from queue
   - Call Gemini Imagen API
   - Upload result to S3-compatible storage
   - Update media_jobs record
   - Retry on transient failures (max 3 attempts, exponential backoff)

7. Add S3 config env vars:
   - S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION
   - REDIS_URL

8. Create src/services/storage.ts:
   - uploadImage(buffer, key): Promise<string>
   - getSignedUrl(key, expiresIn): Promise<string>
```

---

## SECTION 5 — Video Generation (Phase 3)

```
Implement async video generation job system.

Tech: Hono, BullMQ, Redis, S3-compatible storage

Endpoint: POST /video/generate
Protected: Yes (authMiddleware + quotaMiddleware)

Request body:
{
  "start_image_url": "string — signed URL or artifact_id",
  "end_image_url": "string | null — optional end frame",
  "video_prompt": "string",
  "duration_s": 4,
  "fps": 24,
  "resolution": "720p",
  "seed": 12345
}

Response:
{ "job_id": "uuid" }

Endpoint: GET /video/jobs/:id

Response:
{
  "status": "queued | running | succeeded | failed",
  "clip_url": "string — signed URL",
  "duration_s": 4,
  "estimated_cost_usd": 0.15,
  "error_message": "string | null"
}

Implementation:
1. Reuse media_jobs table (job_type = 'video')
2. Create BullMQ queue ('video-generation')
3. Video worker:
   - Download start/end frames if URLs provided
   - Call video generation provider API (e.g. Runway, Pika, Google Veo)
   - Enforce duration limits (max 10s for MVP)
   - Upload result to S3
   - Update job record
   - Retry with exponential backoff (max 2 attempts — video is expensive)
4. Add provider env vars (RUNWAY_API_KEY or VIDEO_PROVIDER_KEY)
5. Cost tracking per job

Duration enforcement: reject requests > 10s.
Only job owner can view results.
```

---

## SECTION 6 — Media Storage & Delivery

```
Implement S3-compatible media storage layer.

Tech: AWS SDK v3 (or S3-compatible client), Hono

Already needed by Sections 4 and 5.

Create src/services/storage.ts:

1. S3 client initialization:
   - Use env vars: S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION
   - Support Railway-hosted or external S3 (e.g. Cloudflare R2, AWS S3, Backblaze B2)

2. Functions:
   - uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string>
   - uploadStream(stream: ReadableStream, key: string, contentType: string): Promise<string>
   - getSignedUrl(key: string, expiresInSeconds: number): Promise<string>
   - deleteObject(key: string): Promise<void>

3. Key naming convention:
   - images: media/{user_id}/images/{job_id}.png
   - video: media/{user_id}/video/{job_id}.mp4
   - thumbnails: media/{user_id}/thumbs/{job_id}.jpg

4. Signed URLs expire after 1 hour by default.

5. Optional: thumbnail generation on image upload (sharp library, 256px max dimension).

No creative content is stored server-side. Only generated media artifacts.
```

---

## SECTION 7 — Job Orchestration Layer

```
Implement job queue infrastructure for async media generation.

Tech: BullMQ, Redis (ioredis)

Required by Sections 4 and 5.

1. Add dependencies: bullmq, ioredis

2. Add REDIS_URL to env.ts (required when media features enabled)

3. Create src/services/queue.ts:
   - Redis connection (reuse across queues)
   - createQueue(name): Queue
   - createWorker(name, processor): Worker

4. Queues:
   - 'image-generation' — concurrency 3
   - 'video-generation' — concurrency 1 (expensive)

5. Job lifecycle:
   - Created → queued (media_jobs status = 'queued')
   - Worker picks up → running (status = 'running', started_at = now)
   - Success → succeeded (status = 'succeeded', output_urls set, completed_at = now)
   - Failure → retry or failed (status = 'failed', error_message set)

6. Retry policy:
   - Images: max 3 attempts, exponential backoff (1s, 4s, 16s)
   - Video: max 2 attempts, exponential backoff (5s, 30s)

7. Idempotency:
   - Each job has a unique job_id (UUID from media_jobs)
   - Workers check job status before processing (skip if already succeeded)

8. Graceful shutdown:
   - Close workers on SIGTERM
   - Allow in-progress jobs to complete (30s timeout)

9. Health check: expose queue stats on GET /health (queue length, active workers)
```

---

## SECTION 8 — Usage Metering & Cost Control

**PARTIALLY IMPLEMENTED** — Core quota/usage tracking is done. Remaining work is media-specific.

What's done:
- usage_records table (id, user_id, endpoint, tokens_in, tokens_out, estimated_cost_usd, created_at)
- user_quotas table (user_id, daily_requests, monthly_requests)
- src/middleware/quota.ts — daily + monthly enforcement with rate-limit headers
- src/services/usage.ts — recordUsage(), getUserUsage(), getUserQuotaLimits()
- src/middleware/ratelimit.ts — in-memory sliding window (auth 5/min, AI 30/min, media 10/min)
- GET /me/usage/current endpoint

```
Remaining for Phase 2+ (when media jobs are added):

1. Add media-specific quota columns to user_quotas table:
   - daily_image_jobs (integer, default 20)
   - monthly_image_jobs (integer, default 200)
   - daily_video_jobs (integer, default 5)
   - monthly_video_jobs (integer, default 50)

2. Update quotaMiddleware to check media-specific limits when endpoint is /images/* or /video/*

3. Update GET /me/usage/current to include image_jobs and video_jobs counts

4. Add cost estimation constants:
   - Gemini text: ~$0.0005 per 1K tokens
   - Gemini image: ~$0.02 per image
   - Video: ~$0.10 per second

5. GET /usage/history?period=7d (optional)
```

---

## SECTION 9 — Creator Memory Support

**IMPLEMENTED** — See `src/services/prompt.ts`, `src/services/context.ts`, `src/db/schema.ts`

- creatorProfiles table (stylePreferences, favoriteThemes, dislikedElements, preferredTone, explorationRatio)
- buildSuggestionPrompt(), buildExpansionPrompt(), buildCanonDiffPrompt(), buildMergeProposalPrompt()
- 70% aligned / 30% exploratory split based on exploration_ratio
- getCreatorProfile() loads from DB as fallback

---

## SECTION 10 — Security Hardening

**IMPLEMENTED** — See `src/index.ts`, `src/middleware/ratelimit.ts`, `src/routes/ai.ts`, `src/lib/env.ts`

- secureHeaders() global middleware (X-Frame-Options, X-Content-Type-Options, HSTS)
- bodyLimit: 100KB global, 50KB on /ai/* routes
- Rate limiting: auth 5/min per IP, AI 30/min per user, media 10/min per user
- Input length limits: system_prompt max 5K, content max 10K, prompt max 10K
- JWT secret >= 32 char validation at startup
- NODE_ENV warning if unset

Note: Custom validation helpers used instead of Zod (zero-dependency approach).

```
Remaining for Phase 2+:

1. Abuse detection:
   - Flag users exceeding 80% of quota
   - Log unusual patterns (rapid sequential requests)
   - Optional: webhook alerts
```

---

## Route Registration Summary

```
Currently registered in index.ts:

app.route('/auth', auth);           // Section 1: login, callback, refresh, logout
app.route('/me', user);             // Section 1: profile + usage
app.route('/ai', ai);              // Section 2: suggest, expand, canon-diff, merge-propose
app.route('/api', proxy);           // Proxy: raw generate/text, generate/image
app.route('/api/timelines', timelines);  // Section 3: timeline/node/branch/canon CRUD

Phase 2+ additions:
app.route('/images', images);       // Section 4: generate, jobs/:id
app.route('/video', video);         // Section 5: generate, jobs/:id

Current global middleware order:
1. logger
2. secureHeaders
3. bodyLimit (100KB)
4. cors

Per-route middleware order:
1. bodyLimit (route-specific, e.g. 50KB on /ai/*)
2. authMiddleware
3. rateLimiter (auth: IP-based, ai/media: user-based)
4. quotaMiddleware
```
