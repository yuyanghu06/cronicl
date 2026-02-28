# Cronicl Frontend — Implementation Prompts
Each section below is a self-contained prompt for implementing that feature.
Sections are ordered by dependency — implement in order.

Current state: Vite + React 19 + TypeScript + Tailwind 4 + motion.
Retro-futuristic CRT aesthetic with custom fonts (DotMatrix, Courier Prime, ABC Synt Mono).
All data is mock/hardcoded — no backend integration, no persistence, no auth.

Backend API base: configurable via env var `VITE_API_URL` (default: `http://localhost:3000`)

---

## SECTION 0 — API Client & Auth Foundation

### 0.1 API Client

```
Create a typed API client for the Cronicl backend.

Tech: Fetch API (no axios — keep zero-dependency approach)

Create src/lib/api.ts:

1. Base configuration:
   - const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
   - Helper: apiFetch(path, options) that:
     - Prepends API_BASE
     - Attaches Authorization: Bearer <token> from token store
     - Sets Content-Type: application/json
     - Parses JSON response
     - On 401: attempts silent refresh, retries once, then redirects to /landing
     - On 429: returns structured error with rate limit info
     - Throws ApiError with status, message, body for non-2xx

2. Token management:
   - Store access token in memory (module-level variable, NOT localStorage)
   - setAccessToken(token) / getAccessToken() / clearTokens()
   - refreshAccessToken(): POST /auth/refresh (cookie-based, credentials: 'include')

3. Typed endpoint methods:
   - auth.login() → redirect to API_BASE + '/auth/login'
   - auth.refresh() → POST /auth/refresh
   - auth.logout() → POST /auth/logout
   - me.getProfile() → GET /me
   - me.getUsage() → GET /me/usage/current
   - me.getCreatorProfile() → GET /me/profile
   - me.updateCreatorProfile(data) → PUT /me/profile
   - timelines.list() → GET /api/timelines
   - timelines.get(id) → GET /api/timelines/:id
   - timelines.create(data) → POST /api/timelines
   - timelines.update(id, data) → PATCH /api/timelines/:id
   - timelines.delete(id) → DELETE /api/timelines/:id
   - nodes.list(timelineId) → GET /api/timelines/:id/nodes
   - nodes.create(timelineId, data) → POST /api/timelines/:id/nodes
   - nodes.update(timelineId, nodeId, data) → PATCH /api/timelines/:id/nodes/:nodeId
   - nodes.delete(timelineId, nodeId) → DELETE /api/timelines/:id/nodes/:nodeId
   - nodes.getPath(timelineId, nodeId) → GET /api/timelines/:id/nodes/:nodeId/path
   - branches.list(timelineId) → GET /api/timelines/:id/branches
   - branches.create(timelineId, data) → POST /api/timelines/:id/branches
   - branches.delete(timelineId, branchId) → DELETE /api/timelines/:id/branches/:branchId
   - branches.getCanon(timelineId, branchId) → GET /api/timelines/:id/branches/:branchId/canon
   - branches.updateCanon(timelineId, branchId, data) → PUT /api/timelines/:id/branches/:branchId/canon
   - ai.suggest(body) → POST /ai/suggest
   - ai.suggestFromTimeline(body) → POST /ai/suggest-from-timeline
   - ai.expand(body) → POST /ai/expand
   - ai.expandFromTimeline(body) → POST /ai/expand-from-timeline
   - ai.canonDiff(body) → POST /ai/canon-diff
   - ai.mergePropose(body) → POST /ai/merge-propose

4. Type definitions — create src/types/api.ts:
   - Mirror backend response shapes for all endpoints
   - Timeline, TimelineNode (backend shape), Branch, BranchCanon, CreatorProfile
   - SuggestionResponse, ExpansionResponse, CanonDiffResponse, MergeProposalResponse
   - UsageResponse, UserProfile
```

### 0.2 Auth Context & Protected Routes

```
Add authentication state management and route protection.

Create src/contexts/AuthContext.tsx:

1. AuthProvider wraps the app, manages:
   - user: UserProfile | null
   - isLoading: boolean (true during initial token check)
   - isAuthenticated: boolean (derived)
   - login(): redirect to backend OAuth
   - logout(): call api.auth.logout(), clear tokens, redirect to /landing
   - refreshUser(): fetch /me, update state

2. On mount:
   - Try refreshAccessToken() (cookie-based)
   - If success: fetch /me, set user
   - If fail: user = null, isLoading = false
   - This enables "silent login" on page reload

3. Create src/components/auth/ProtectedRoute.tsx:
   - If isLoading: show loading spinner (CRT-styled)
   - If !isAuthenticated: redirect to /landing
   - If authenticated: render children

4. Update App.tsx routing:
   - /landing: public (no auth required)
   - /auth/callback: new route — extracts access_token from URL params,
     stores it, fetches user, redirects to /home
   - /home: wrapped in ProtectedRoute
   - /editor/:projectId: wrapped in ProtectedRoute

5. Update LandingPage:
   - Add "LOGIN WITH RAILWAY" button that calls auth.login()
   - Keep existing power-on animation, add button after sequence completes
   - If already authenticated, auto-redirect to /home
```

---

## SECTION 1 — Replace Mock Data with Backend Integration

### 1.1 Timeline List (HomePage)

```
Replace mock projects with real timeline data from the backend.

Current state:
- HomePage uses mockProjects from src/data/mock-projects.ts
- Projects listed in a sidebar, clicking navigates to /editor/:projectId
- AIChatRoom is the main area (hardcoded 5-stage conversation)

Changes to HomePage.tsx:

1. Fetch timelines on mount:
   - const [timelines, setTimelines] = useState<Timeline[]>([])
   - useEffect → api.timelines.list()
   - Show loading state while fetching
   - Map backend Timeline shape to display (title, nodeCount, branchCount, updatedAt)

2. "New Project" button:
   - Opens a minimal modal or inline form: title input + system_prompt textarea
   - On submit: api.timelines.create({ title, system_prompt })
   - On success: navigate to /editor/:newId

3. Delete project:
   - Add subtle delete button (X icon) on hover
   - Confirm before deleting (simple "are you sure?" inline)
   - api.timelines.delete(id)

4. Remove mock-projects.ts import (can delete the file later)

5. AIChatRoom integration (Phase 2 — skip for now):
   - For now, keep AIChatRoom as a standalone guided experience
   - Later: wire it to actually create a timeline + initial nodes via API
   - Mark with TODO comment
```

### 1.2 Editor: Load Timeline from Backend

```
Replace mock timeline data in EditorPage with real backend data.

Current state:
- EditorPage loads mockTimeline from src/data/mock-timeline.ts
- Nodes are TimelineNode[] with { id, label, plotSummary, metadata, position, connections, type, status }
- All edits happen in React state only, lost on refresh

Changes:

1. Create src/lib/transform.ts — backend ↔ frontend node mapping:

   backendNodeToFrontend(node: BackendNode, allNodes: BackendNode[]): TimelineNode
   - id → id
   - title → label
   - content → plotSummary
   - positionX, positionY → position: { x, y }
   - Find children where parentId === this node's id → connections: string[]
   - status → status (map 'draft'→'draft', etc.)
   - parentId === null && no branch → 'scene', has branch → 'branch', etc.
   - Build metadata from node fields

   frontendNodeToBackendPatch(node: TimelineNode): Partial<BackendNode>
   - Reverse mapping for PATCH calls

2. Update EditorPage.tsx:
   - On mount: api.timelines.get(projectId) → transform nodes → setNodes
   - Show loading skeleton while fetching (CRT-style: "LOADING TIMELINE...")
   - On 404: redirect to /home with toast

3. Node editing (onSaveNode):
   - After updating local state, also call:
     api.nodes.update(timelineId, nodeId, { title, content })
   - Fire-and-forget with error toast on failure
   - Debounce saves (300ms) to avoid excessive API calls

4. Node creation (onGenerateBranch):
   - After creating local node, persist via:
     api.nodes.create(timelineId, { title, content, parent_id, position_x, position_y })
   - On API response: update local node's id to match backend UUID

5. Node deletion:
   - Add delete option to NodePanel (trash icon in header)
   - api.nodes.delete(timelineId, nodeId)
   - Remove from local state, update parent's connections

6. Remove mock-timeline.ts import
```

---

## SECTION 2 — Ghost Nodes & AI Suggestions

This is the core differentiating feature. Ghost nodes are faded, non-persisted
suggestion nodes that the user can accept or dismiss.

### 2.1 Ghost Node Data Model

```
Extend the node type system to support ghost (suggested) nodes.

Changes to src/types/node.ts:

1. Add to TimelineNode:
   - isGhost: boolean (default false)
   - ghostSource?: 'ai_suggest' | 'ai_expand' | 'manual'
   - ghostMeta?: {
       direction_type: 'aligned' | 'exploratory';
       tone: string;
       confidence?: number;
     }

2. Ghost nodes are:
   - Rendered in the canvas but with distinct visual treatment
   - NOT saved to the backend until user confirms
   - Removed when user dismisses or selects a different node for suggestions
   - Stored in local state alongside real nodes

3. Add helper functions to src/lib/ghost.ts:
   - createGhostNodesFromSuggestion(parentNode, suggestion: SuggestionResponse): TimelineNode[]
     - Position ghost nodes fanned out below/right of parent
     - Each gets isGhost: true, ghostMeta from AI response
   - confirmGhostNode(ghostNode: TimelineNode): TimelineNode
     - Sets isGhost: false, removes ghostMeta
     - Returns cleaned node ready for backend persistence
   - dismissGhostNodes(nodes: TimelineNode[]): TimelineNode[]
     - Filters out all ghost nodes
```

### 2.2 Ghost Node Rendering

```
Update TimelineNode.tsx to render ghost nodes with distinct visual treatment.

Changes to TimelineNode.tsx:

1. Ghost node styling:
   - opacity: 0.4 (vs 1.0 for real nodes)
   - border: dashed (vs solid)
   - border-color: use red with 40% opacity for ghost, solid red for selected ghost
   - Background: transparent or very subtle
   - Add a pulsing "?" or "SUGGESTION" badge (DotMatrixText, text-red, animate-pulse-red)
   - Show direction_type badge: "ALIGNED" or "EXPLORATORY"
   - Show tone in metadata footer

2. Ghost node interaction:
   - onClick: select the ghost node (show detail in side panel)
   - Side panel shows:
     - Full summary/content from AI
     - "ACCEPT" button (primary) → confirms ghost, persists to backend
     - "DISMISS" button (ghost variant) → removes this ghost node
     - "DISMISS ALL" → removes all ghost nodes
   - On ACCEPT:
     - Call confirmGhostNode()
     - api.nodes.create(timelineId, ...) to persist
     - Update local state: ghost → real node
     - Update parent's connections

3. Ghost node connectors:
   - Update TimelineConnector.tsx to detect ghost connections
   - Ghost connectors: dashed stroke, lower opacity (0.3)
   - Animate with subtle pulse or dash-offset animation

4. Limit: max 5 ghost nodes visible at once
```

### 2.3 Suggestion Trigger Flow

```
Wire the "Generate Suggestions" action to the real AI backend.

Changes:

1. Add "SUGGEST" tab to NodePanel (alongside EDIT and GENERATE):
   - Available when a real (non-ghost) node is selected
   - Shows current suggestion state: idle / loading / results

2. Suggestion flow:
   - User selects a node and clicks SUGGEST tab
   - Tab shows a "GENERATE SUGGESTIONS" button + optional num_suggestions slider (1-5, default 3)
   - On click:
     a. Dismiss any existing ghost nodes
     b. Set loading state (CRT-style: "ANALYZING NARRATIVE PATH...")
     c. Call api.ai.suggestFromTimeline({
          timelineId,
          nodeId: selectedNode.id,
          branchId: activeBranch?.id,
          numSuggestions: count,
        })
     d. On response: createGhostNodesFromSuggestion() → add to local nodes
     e. Show inline_suggestions in the SUGGEST tab below the button

3. Inline suggestions display:
   - List each inline suggestion as a card:
     - "Target: NODE_003" (clickable → selects that node)
     - suggestion_type badge (clarity / pacing / style / continuity)
     - Original → Suggested diff (strikethrough + green text)
     - "APPLY" button → updates the target node content via API
     - "DISMISS" button → removes from list

4. Error handling:
   - On 429: show "Rate limit reached. Try again in X seconds."
   - On 502: show "AI response was unparseable. Try again."
   - On generic error: show "Something went wrong."
```

### 2.4 Node Expansion Integration

```
Wire the existing GENERATE tab to the real AI expand endpoint.

Current state:
- NodeBranchTab.tsx has a chat-style UI for describing branches
- It creates a node locally with "generating" status, flips to "draft" after 3s

Changes to NodeBranchTab.tsx (rename to NodeGenerateTab.tsx):

1. Add expansion type selector:
   - Three buttons: EXPAND / REWRITE / ALTERNATIVES
   - Selected type highlighted in red

2. Replace fake generation with real API call:
   - On "GENERATE":
     a. Show loading state ("GENERATING...")
     b. Call api.ai.expandFromTimeline({
          timelineId,
          nodeId: selectedNode.id,
          expansionType: selectedType,
          numVariants: 2,
          branchId: activeBranch?.id,
        })
     c. On response: show expansions as selectable cards in the panel
     d. Each card shows: content preview, approach description, tone badge
     e. User clicks one to preview → "APPLY" button to commit

3. Branch generation (keep existing flow but connect to API):
   - "NEW BRANCH" button at bottom of tab
   - Separate from expand — this creates a ghost node via /ai/suggest
   - Description input feeds into the system_prompt or as extra context

4. Apply expansion:
   - Updates node content via api.nodes.update()
   - Updates local state
   - Clears expansion results
```

---

## SECTION 3 — Focus Mode & Visual Polish

### 3.1 Focus Mode

```
Implement focus mode: active branch highlighted, other branches faded.

BASE.md Section 2.2:
- Active timeline: fully highlighted
- Other branches: faded, thinner edges, lower opacity
- This is the key visual that makes the graph readable at scale

Implementation:

1. Track active branch context:
   - Add state to EditorPage: activeBranchId: string | null
   - When a node is selected, determine which branch it belongs to
   - A node belongs to a branch if any branch's branchPointNodeId is an ancestor
   - Default: "main" (nodes with no branch ancestor)

2. Classify nodes:
   - "active": on the active branch path (root → selected node ancestor chain)
   - "related": on the same branch but not in the active path
   - "inactive": on a different branch

3. Visual treatment in TimelineNode.tsx:
   - active: full opacity, normal border
   - related: opacity 0.7, normal border
   - inactive: opacity 0.3, thinner border (border-border-subtle)
   - ghost: existing ghost treatment (dashed, 0.4 opacity)

4. Connector treatment in TimelineConnector.tsx:
   - active path: stroke-width 2, full opacity, red accent
   - related: stroke-width 1, opacity 0.6
   - inactive: stroke-width 0.5, opacity 0.2

5. Toggle: Add a focus mode toggle button to TimelineControls.tsx
   - Eye icon: on/off
   - When off: all nodes render at full opacity (current behavior)
   - When on: focus mode active

6. Transition: animate opacity changes (200ms ease-out)
```

### 3.2 Branch Orientation (Stretch Goal)

```
Implement alternating branch orientation per BASE.md Section 2.1.

- Main branch: horizontal (left → right)
- Subbranches of horizontal: vertical (top → bottom)
- Subbranches of vertical: horizontal (left → right)

This is a layout algorithm change. Only implement if the current
free-positioning feels cluttered. Current approach (manual position
with collision avoidance) may be sufficient for MVP.

If implementing:
1. Add branchOrientation to node metadata: 'horizontal' | 'vertical'
2. Auto-layout algorithm:
   - Root + main path: x += 320, y stays constant
   - Branch children: perpendicular offset
3. Connector routing adjusts based on orientation
```

---

## SECTION 4 — Canon & Creator Profile UI

### 4.1 Canon Panel

```
Add a canon viewer/editor accessible from the editor.

Implementation:

1. Add "CANON" button to TopBar (next to branch icon):
   - Opens a dedicated SidePanel on the left (opposite of NodePanel)
   - Or: add as a tab in the existing SidePanel

2. Canon display:
   - Loads from backend: api.branches.getCanon(timelineId, branchId)
   - Four sections: SETTING, CHARACTERS, TONE, RULES
   - Each section is editable (click to edit, Enter to save)
   - Save calls: api.branches.updateCanon(timelineId, branchId, data)

3. Canon diff action:
   - "ANALYZE DRIFT" button at bottom of canon panel
   - Calls api.ai.canonDiff({
       system_prompt: timeline.systemPrompt,
       current_canon: canonData,
       recent_nodes: last N nodes
     })
   - Shows suggested updates as a diff:
     - Field: "tone"
     - Current: "literary" → Suggested: "darker, more urgent"
     - Reasoning: "Recent nodes have shifted toward tension..."
     - Confidence: 0.82
   - Each suggestion has "APPLY" / "DISMISS" buttons
   - APPLY: updates canon via API

4. Canon is per-branch:
   - Show which branch's canon is displayed
   - Dropdown to switch between branches
```

### 4.2 Creator Profile Settings

```
Add creator profile management to the user area.

Implementation:

1. Create src/pages/SettingsPage.tsx:
   - New route: /settings (protected)
   - Add gear icon to TopBar that navigates here

2. Profile form:
   - Load: api.me.getCreatorProfile()
   - Fields:
     - Style Preferences: tag-style input (add/remove string tags)
     - Favorite Themes: tag-style input
     - Preferred Tone: text input
     - Exploration Ratio: slider 0-100% (maps to 0.0-1.0)
       - Label: "70% aligned / 30% exploratory" (updates dynamically)
     - Disliked Elements: tag-style input (shown in red)
   - Save: api.me.updateCreatorProfile(data)
   - Auto-save on change (debounced 500ms)

3. Visual:
   - Match CRT aesthetic
   - Slider should have custom retro styling
   - Tags rendered as Badge components
```

---

## SECTION 5 — Branch Merge UI

```
Implement the merge workflow per BASE.md Section 9.

Prerequisites: Focus mode (Section 3.1), Canon panel (Section 4.1)

Implementation:

1. Add "MERGE" action to the branch panel or node context menu:
   - Available when 2+ branches exist
   - User selects: Branch A, Branch B, merge point (a node both branches share as ancestor)

2. Merge flow:
   a. User initiates merge → "SELECT MERGE MODE" dialog:
     - A-DOMINANT: Branch A takes priority
     - B-DOMINANT: Branch B takes priority
     - HYBRID: AI synthesizes equally
     - MANUAL: Skip AI, create empty merge node for manual editing
   b. For AI modes, call api.ai.mergePropose({
        system_prompt,
        branch_a: { path: [...], canon: {...} },
        branch_b: { path: [...], canon: {...} },
        merge_point_node_id,
        mode,
      })
   c. Show merge preview:
     - Merged content (full text, editable before confirming)
     - Reconciled canon (diff view vs both branch canons)
     - Conflicts list with resolutions
     - Confidence score
   d. User can edit the merged content before confirming
   e. On confirm:
     - Create merge node via API (parent_id = merge_point, type = 'merge')
     - Optionally update branch canon with reconciled version

3. Merge node rendering:
   - Type badge: "MERGE"
   - Special connector: draw lines from both branch tips to merge node
   - Different border style (double border?)
```

---

## SECTION 6 — AIChatRoom Backend Integration

```
Wire the HomePage's AIChatRoom to actually create timelines via AI.

Current state:
- 5-stage hardcoded conversation
- "OPEN TIMELINE" button navigates to /editor/project-1

Changes:

1. Replace hardcoded stages with dynamic AI conversation:
   - Stage 0: AI greeting (can stay hardcoded)
   - Stage 1-3: User messages sent to POST /ai/suggest with a bootstrapping prompt:
     - system_prompt: "You are helping a creator set up a new story project.
       Ask about genre, tone, protagonist, and structure."
     - Each user message appended to active_path as context
   - Stage 4 (Processing): AI generates initial timeline structure
     - Call api.timelines.create({ title: extracted, system_prompt: compiled })
     - Call api.ai.suggest() to generate initial node ideas
     - Create root node + 2-3 child nodes from suggestions
   - Stage 5: "Timeline ready" with real OPEN TIMELINE button

2. Alternatively (simpler MVP approach):
   - Keep stages 0-3 as guided questions (hardcoded prompts)
   - Collect answers into a structured object:
     { concept, genre, tone, protagonist, structure }
   - On "process": create timeline with system_prompt built from answers
   - Create a single root node with the concept as content
   - Navigate to editor

3. Update the "OPEN TIMELINE" button to navigate to /editor/:realId
```

---

## SECTION 7 — Command Palette (Phase 2+)

```
Implement spotlight-style command palette per BASE.md Section 13.

Trigger: Cmd+K (Mac) / Ctrl+K (Windows)

Implementation:

1. Create src/components/editor/CommandPalette.tsx:
   - Modal overlay with search input
   - Matches against available commands
   - Keyboard navigation (arrow keys, Enter, Escape)

2. Command categories:
   - Navigation: "Go to node X", "Focus branch Y"
   - Actions: "Suggest from here", "Expand this node", "Analyze canon drift"
   - Creation: "New branch from here", "Split this node"
   - View: "Toggle focus mode", "Fit view", "Zoom to node"

3. Natural language parsing (Phase 3):
   - "Merge these at the coronation" → identifies branches + merge point
   - "Split this into three scenes" → calls /ai/split with num_parts: 3
   - "Generate storyboard for nodes 8-10" → future media integration

4. For MVP: keyword matching is sufficient
   - Fuzzy search on command labels
   - No NLP parsing needed initially
```

---

## SECTION 8 — Remaining Polish

### 8.1 Usage Dashboard

```
Add usage stats to the settings or user dropdown.

- Fetch api.me.getUsage()
- Display: daily used/limit, monthly used/limit
- Progress bars with CRT styling
- Warn at 80% with amber color, block at 100% with red
```

### 8.2 Undo/Redo (Phase 2+)

```
Add undo/redo for node operations.

- Maintain a history stack of node state snapshots
- Cmd+Z / Cmd+Shift+Z
- Max 50 history entries
- Only track: node create, node edit, node delete, ghost accept
- Do NOT undo API calls — only local state
- API sync happens on a separate track
```

### 8.3 Keyboard Shortcuts

```
Add keyboard shortcuts for common actions.

- Escape: deselect node / close panel
- Delete/Backspace: delete selected node (with confirm)
- S: open SUGGEST tab for selected node
- E: open EDIT tab for selected node
- G: open GENERATE tab for selected node
- F: toggle focus mode
- Cmd+K: command palette
- +/-: zoom in/out
- 0: fit view
```

---

## Implementation Priority Order

For connecting frontend to the live backend:

1. **Section 0** — API client + auth (foundation for everything)
2. **Section 1.1** — Timeline list (proves API works end-to-end)
3. **Section 1.2** — Editor backend integration (core editing loop)
4. **Section 2.1-2.3** — Ghost nodes + AI suggestions (the differentiator)
5. **Section 2.4** — Node expansion (completes AI integration)
6. **Section 3.1** — Focus mode (visual clarity)
7. **Section 4** — Canon + creator profile (deepens AI quality)
8. **Section 5** — Branch merge (advanced feature)
9. **Section 6** — AIChatRoom integration (onboarding polish)
10. **Section 7-8** — Command palette, undo/redo, shortcuts (polish)
