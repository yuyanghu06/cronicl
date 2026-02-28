# CREATIVE SPACE EXPLORATION ENGINE  
# COMPLETE BACKEND FEATURE SPECIFICATION  
(Compiled Overview – Clearly Sectioned)

This document consolidates all backend-related features discussed so far.
It is structured to clearly separate:

1. Core Backend (Tier 1 – MVP)
2. AI Suggestion & Timeline Generation
3. Canon & Branch Logic Support
4. Media Generation (Text→Image, Image+Text→Video)
5. Job Orchestration & Storage
6. Usage, Cost, and Security Controls
7. Optional / Phase 2+ Extensions
8. Explicit Out-of-Scope for MVP

The backend is intentionally:
- Local-first
- Secure
- Suggestion-driven
- Commit-gated
- Cost-aware

The creative graph itself lives on the client.

---

# SECTION 1 — IDENTITY & ACCESS LAYER (MVP REQUIRED)

## 1.1 Authentication
- Google OAuth (OpenID Connect)
- JWT access tokens (short-lived)
- Rotating refresh tokens (secure storage, revocation support)
- Session/device tracking (optional but recommended)

## 1.2 Authorization
- Protect all AI and media endpoints
- Enforce per-user quotas
- Optional role-based access control (future)

---

# SECTION 2 — AI PROXY LAYER (TEXT GENERATION)

Purpose:
- Hide LLM API keys
- Standardize prompts
- Enforce “suggest-only” policy
- Meter usage
- Apply creator memory bias
- Restrict context to active branch path only

---

## 2.1 Timeline / Branch Suggestion (Ghost Node Generation)

Endpoint:
POST /ai/suggest

Generates:
- Ghost node candidates (additional timeline directions)
- Inline suggestions (within-node improvements)

Input:
- system_prompt
- branch_canon
- creator_profile
- active_path (root → current node)

Output:
- ghost_nodes[]
- inline_suggestions[]

Important:
- No node persistence
- Client must confirm before creation

---

## 2.2 Node Expansion

Endpoint:
POST /ai/expand

Generates:
- Expanded node content
- Alternative rewrites

Returns proposals only.
Client commits changes.

---

## 2.3 Canon Extraction / Lightweight Canon Suggestions

Endpoint:
POST /ai/canon-diff

Purpose:
- Extract setting / characters / tone
- Suggest canon updates
- Detect high-level changes

MVP scope:
- Lightweight only
- No full downstream stale marking

---

## 2.4 Branch Merge Proposal (Phase 2+)

Endpoint:
POST /ai/merge-propose

Purpose:
- Propose merged node from two branches
- Suggest reconciled canon

Suggestion-only.
Client commits.

---

## 2.5 Path Summarization (Optional)

Used for:
- Context compression
- Token window optimization

---

# SECTION 3 — CANON & BRANCH SUPPORT (BACKEND ROLE)

The graph is client-side, but backend supports:

- Canon-aware suggestion bias
- Merge proposals
- Conflict highlighting (basic)
- Creator profile conditioning

Backend must never:
- Automatically mutate branch structure
- Auto-commit canonical updates

---

# SECTION 4 — TEXT → IMAGE GENERATION PROXY (PHASE 2+)

Purpose:
- Generate storyboard frames
- Support start/end frames for shots
- Secure key isolation

---

## 4.1 Image Job Creation

Endpoint:
POST /images/generate

Input:
- prompt
- negative_prompt
- parameters (aspect ratio, seed, quality tier)
- commit flag

Output:
- job_id

---

## 4.2 Image Job Status

Endpoint:
GET /images/jobs/:id

Returns:
- status (queued, running, succeeded, failed)
- signed URL(s)
- cost estimate

---

## 4.3 Responsibilities

- Async job queue
- Retry logic
- Usage tracking
- Object storage integration

---

# SECTION 5 — IMAGE + TEXT → VIDEO GENERATION PROXY (PHASE 3)

Purpose:
- Convert start/end frames + prompt + duration into shot-level clips

---

## 5.1 Video Job Creation

Endpoint:
POST /video/generate

Input:
- start_image_url or artifact_id
- end_image_url (optional)
- video_prompt
- duration_s
- fps/resolution/seed
- commit flag

Output:
- job_id

---

## 5.2 Video Job Status

Endpoint:
GET /video/jobs/:id

Returns:
- status
- signed clip URL
- cost estimate

---

## 5.3 Backend Responsibilities

- Async queue worker
- Provider-specific API mapping
- Duration enforcement
- Retry handling
- Cost tracking

---

# SECTION 6 — MEDIA STORAGE & DELIVERY

- S3-compatible object storage
- Signed URL generation
- Minimal metadata storage
- Optional thumbnail generation

Story content is NOT stored server-side by default.

---

# SECTION 7 — JOB ORCHESTRATION LAYER

Required for image/video generation.

Components:
- Job queue (BullMQ + Redis recommended)
- Worker processes
- Retry/backoff handling
- Job state persistence
- Idempotency support

---

# SECTION 8 — USAGE METERING & COST CONTROL

## 8.1 Track Per User
- LLM tokens in/out
- Image jobs
- Video jobs
- Estimated USD cost

## 8.2 Endpoints
GET /usage/current  
GET /usage/history (optional)

## 8.3 Enforcement
- Daily/monthly caps
- Rate limiting (per-minute)
- Preflight cost estimation (optional)

---

# SECTION 9 — CREATOR MEMORY SUPPORT

Backend responsibilities:
- Accept creator_profile object from client
- Include it in prompt templates
- Optionally persist minimal creator preferences
- Do not expose internal scoring

Purpose:
- Bias suggestions (70% aligned / 30% exploratory)
- Enable emotional attachment over time

---

# SECTION 10 — SECURITY REQUIREMENTS

- JWT validation middleware
- Input validation
- Request size limits
- API key isolation
- Environment variable secrets
- Abuse detection
- Rate limiting
- CORS restrictions

---

# SECTION 11 — OPTIONAL / FUTURE FEATURES

Not required for MVP:

- Cloud project sync
- Encrypted project backup
- Collaboration layer
- Real-time multi-user editing
- Full canonical conflict engine
- Downstream stale marking
- Automated media stitching service
- Multi-artifact dependency graph engine

---

# SECTION 12 — MVP BACKEND SCOPE (TIER 1 ONLY)

Required:
- Auth (Google OAuth + JWT)
- AI suggestion proxy
- Node expansion proxy
- Lightweight canon suggestion
- Creator profile conditioning
- Usage tracking
- Rate limiting

Not required:
- Media generation
- Branch merging
- Artifact tracking
- Cloud sync

---

# SECTION 13 — DESIGN PRINCIPLES

The backend must:

1. Protect API keys
2. Enforce quotas
3. Standardize AI/media calls
4. Remain stateless with respect to creative graph
5. Never auto-commit structure
6. Respect commit gates for expensive operations

---

# FINAL SUMMARY

The backend is:

- A secure orchestration layer
- An AI proxy and quota enforcer
- A media rendering gateway
- A cost-control system

It is NOT:
- The source of creative truth
- The canonical graph owner
- An autonomous structure generator

The creative graph lives on the client.  
The backend enables intelligence and rendering.


