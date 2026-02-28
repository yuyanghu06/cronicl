# Creative Space Exploration Engine — Detailed Outline

## 1. Core Concept

A visual, interactive creative space where:

- The **main branch** represents the primary story timeline
- Each node can spawn **sub-branches** for alternate paths
- Users retain full control over what gets created
- AI acts as a **suggestion engine**, not an autonomous generator

This system blends:
- conversational AI
- visual story graphs
- controlled agentic expansion
- canon-aware world state

---

## 2. Visual Layout Model

### 2.1 Branch Orientation Rules

- **Main branch:** always horizontal (left → right)
- **Subbranches:** alternate orientation based on parent
  - If parent is horizontal → child branches vertical
  - If parent is vertical → child branches horizontal
- This ensures:
  - clean visual structure
  - readable expansion patterns
  - minimal overlap

### 2.2 Focus Mode

- Active timeline: fully highlighted
- Other branches: faded, thinner edges, lower opacity
- Zoom out: theme clusters via embeddings
- Zoom in: edit scene

---

## 3. Data Model

### 3.1 Node Structure

```json
{
  "id": "string",
  "title": "string",
  "content": "string",
  "parentIds": ["string"],
  "children": ["string"],
  "branchOrientation": "horizontal | vertical",
  "metadata": {
    "characters_present": [],
    "location": "",
    "status": "draft | approved | rendered | stale"
  }
}
```

### 3.2 Graph Container

```json
{
  "nodes": { "id": "Node" },
  "rootId": "string",
  "systemPrompt": "string",
  "creatorProfile": {}
}
```

---

## 4. Canon + World State

Each branch maintains canonical layers:
- Setting Bible
- Character Bible
- Object / Prop Canon
- Style Canon
- Continuity Constraints

### Canon Change Handling

When canonical fields change, user must choose:
- Apply change downstream
- Branch off
- Plan a merge later

Downstream nodes marked: compatible / stale / partially impacted

---

## 5. Node Capabilities

Each node supports:
1. **Expand details** — elaborate within the same node
2. **Rewrite** — regenerate node content
3. **Split** — break into multiple nodes
4. **Create sub-branches** — only after user approval
5. **Generate storyboard + image prompts** — after approval
6. **Merge branches** — combine alternate paths

No automatic node creation.

---

## 6. AI Suggestion Layer

AI never creates nodes automatically.

### Inline Suggestions (faded text)
- "Explore darker tone here"
- "Add tension via new character"
- "Increase political stakes"

Not persisted until confirmed.

### Ghost Nodes (faded branches)

AI recommends potential subbranches:
- Rendered as faint nodes
- Not persisted in state
- Only created if user confirms

Preserves: user agency, deterministic history, explainability

---

## 7. Context Feeding Logic

### Landing Page

First user input becomes:
```
system_prompt = initial_user_input
```

Defines: scope, tone, assistant behavior, generation style

### Branch Context Rules

AI receives:
```
context = {
  system_prompt,
  full_path_from_root_to_current_node,
  branch_canon,
  creator_profile
}
```

AI does **NOT** see: sibling branches, cousin branches, unrelated nodes

---

## 8. Branch Creation Flow

1. User clicks "New Branch"
2. AI returns candidate ideas
3. UI renders as ghost nodes
4. User confirms one
5. Node is persisted

Manual branch creation always allowed.

---

## 9. Branch Merging

User specifies a merge point in time/event.

### Merge Workflow
1. Select branches + merge target
2. System computes canonical conflicts
3. AI proposes reconciliation previews
4. User selects reconciliation mode
5. Create merge node with multiple parents

### Reconciliation Modes
- A-dominant
- B-dominant
- Hybrid synthesis
- Manual resolution

---

## 10. Storyboard Production

For approved nodes:
- Detailed script
- Textual storyboard
- AI image prompt

### Commit Gate

User must choose:
- which nodes to render
- resolution tier
- variations count

No automatic bulk generation.

---

## 11. Style Consistency

Because nodes share embeddings:
- Characters persist
- Lighting stabilizes
- Tone coherence emerges

Image prompts inherit: canon anchors, node metadata, creator style bias

---

## 12. Creator Profile (Idea Memory)

Each project builds a hidden profile:

```json
{
  "visual_style_vector": [],
  "theme_vector": [],
  "narrative_complexity": 0.72,
  "exploration_bias": "divergent"
}
```

Updated on every edit. Future suggestions: 70% recognizable, 30% surprising.

---

## 13. Spotlight Command Palette

Natural language → parsed intent → preview → commit

Examples:
- "Merge these at the coronation"
- "Split this into three scenes"
- "Generate storyboard for nodes 8–10"

Always preview before persistence.

---

## 14. Data Architecture

### 14.1 Local Storage (Primary)

All timelines/graphs stored **locally** via IndexedDB.

- Graph JSON, embeddings, creator profile
- Optional export: JSON, Markdown, PDF
- Offline-first, user-owned

### 14.2 Server Storage (Auth Only)

Postgres on Railway stores **only**:
- user profile + settings
- OAuth identity links (Google)
- session/JWT metadata

Timelines are **not** stored in Postgres.

---

## 15. Tech Stack & Deployment

### Frontend
- **Build:** Vite + React + TypeScript
- **Rendering:** Canvas/SVG graph (Konva, PixiJS, or virtualized DOM)
- **Local persistence:** IndexedDB (Dexie wrapper)

### Backend
- **Framework:** Hono (TypeScript)
- **Deployment:** Railway Node service

### Database
- **Postgres (Railway):** user/account data only
- **ORM:** Drizzle

### Authentication
- **Google OAuth 2.0 / OpenID Connect**
- JWT access token (short-lived) + refresh token (rotating, hashed)
- Routes: `/auth/google/start`, `/auth/google/callback`, `/auth/refresh`, `/auth/logout`, `/me`

### Environment Variables
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `GEMINI_API_KEY` (server-side only)

---

## 16. Copilot Development Discipline

### Change Log (`planning/summary.md`)

Copilot must update on every change:
- **What changed:** files touched, functions modified
- **Why:** reasoning, tradeoffs
- **Architectural decisions:** patterns introduced
- **User actions:** env vars, setup steps

### Code Comments

- Header comment on each new file
- Document exported functions/classes
- Explain non-obvious logic inline
- Add `TODO:` where work is partial

---

## 17. Differentiator

Most competitors expose complexity.

You absorb complexity.

User experience: "My ideas are becoming clearer."

That feeling is the moat.

---

## Final Identity

A canon-aware, merge-capable, co-creative memory graph.

Not a generator. Not a mind map. Not a storyboard template.

A persistent imagination engine.
