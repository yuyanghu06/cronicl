# Cronicl Frontend

Visual storytelling editor for the Cronicl platform. A cinematic, dark-themed interface where users create branching narrative timelines through AI-assisted chat, then edit and visualize them on an infinite canvas with auto-generated storyboard frames.

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite 7
- **Styling:** Tailwind CSS 4 with custom design tokens
- **Animation:** Motion (Framer Motion) 12
- **Routing:** React Router 7
- **Icons:** Lucide React
- **State:** React hooks + Context API (no external state library)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env`:
```env
VITE_API_URL=http://localhost:3000
```

3. Start dev server:
```bash
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run start` | Serve production build on port 3000 |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |

## Pages

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/landing` | LandingPage | Public | Power-on animation, CRT aesthetic, entry point |
| `/login` | LoginPage | Public | Email/password + OAuth login |
| `/register` | RegisterPage | Public | Account registration |
| `/auth/callback` | AuthCallbackPage | Public | OAuth callback handler |
| `/home` | HomePage | Protected | Project dashboard + AI chat room |
| `/profile` | ProfilePage | Protected | Creator preferences editor |
| `/editor/:projectId` | EditorPage | Protected | Timeline canvas editor |

All pages are lazy-loaded with `React.lazy()` for code splitting.

## Features

### AI Chat Room (Home)
- Guided 5-stage conversation to create a new project (concept, audience, themes, structure, visual style)
- Parallel AI calls to generate story structure + visual theme
- Sequential node creation with parent-child linking
- Auto-generates storyboard images for each node

### Timeline Editor
- Infinite pan/zoom canvas (0.3x–2x zoom)
- Tree-structured nodes with visual connectors
- Collision-aware automatic node positioning
- Side panel with tabs: Edit, Branch, Suggest
- Node states: draft, generating, complete, locked

### Ghost Nodes (AI Suggestions)
- Request AI suggestions from any selected node
- 3 candidates with title, summary, tone, and direction type (aligned/exploratory)
- Accept to create a real node, or dismiss

### Image Generation
- Auto-generates storyboard frames for new nodes
- Async job polling (3s interval, 2-minute timeout)
- Sequential generation to avoid queue congestion
- Lazy-loads images from backend after timeline load
- Manual regeneration via side panel
- Full-screen lightbox preview

### Character Bible
- Per-timeline character library
- Name, description, appearance guide, aliases
- AI-generated reference portraits
- Characters matched against scene text during image generation

### Creator Profile
- Style preferences and favorite themes
- Preferred tone and disliked elements
- Exploration ratio slider (aligned vs. exploratory suggestions)

### Auth
- OAuth (Railway) + email/password
- Cookie-based sessions (`credentials: "include"`)
- Protected route wrapper with redirect

## Design System

### Fonts

| Font | CSS Class | Purpose |
|------|-----------|---------|
| Dot Matrix | `font-display` | Headlines, section titles, wordmarks |
| Courier Prime | `font-narrative` | Body text, descriptions |
| ABC Synt Mono | `font-system` | UI labels, metadata, buttons |

### Color Tokens (Dark Mode)

```
Backgrounds:  bg-void (#0A0A0A) → bg-base (#111111) → bg-raised (#1A1A1A) → bg-hover (#222222) → bg-active (#2A2A2A)
Foregrounds:  fg-muted (#555555) → fg-dim (#777777) → fg-base (#AAAAAA) → fg-bright (#D4D4D4) → fg-max (#F0F0F0)
Borders:      border-subtle (#1F1F1F) → border-base (#2A2A2A) → border-strong (#3A3A3A)
Accent:       red (#FF3B30)
```

Light mode overrides with warm cream/sepia palette.

### UI Components (`src/components/ui/`)

| Component | Description |
|-----------|-------------|
| Button | Primary (red glow) / secondary (bordered) / ghost variants, sm/md/lg sizes |
| Card | Raised surface container |
| Badge | Inline status indicator |
| ConfirmDialog | Animated modal confirmation popup |
| ContextMenu | Right-click context menu |
| ImageLightbox | Full-screen image viewer |
| ScanlineOverlay | CRT scanline visual effect |
| DotMatrixText | Display font wrapper |
| SyntMonoText | System font wrapper |
| CourierText | Narrative font wrapper |

### Animation

- Framer Motion for enter/exit transitions
- Custom easing: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out)
- Animations: fade-in, slide-up, pulse-red, flicker, scanline-sweep, letter-wave

## Project Structure

```
src/
├── pages/           7 route pages (lazy-loaded)
├── components/
│   ├── ui/          Reusable UI primitives
│   ├── layout/      AppShell, TopBar, StatusBar, SidePanel
│   ├── home/        AIChatRoom, ChatMessage, ProjectCard
│   ├── editor/      TimelineCanvas, TimelineNode, NodePanel
│   └── landing/     PowerOnSequence, BackgroundTexture
├── lib/
│   ├── auth.tsx     Auth context + hooks
│   ├── api.ts       HTTP wrapper (fetch-based)
│   ├── theme.tsx    Theme context (dark/light)
│   ├── mappers.ts   Backend ↔ frontend type conversions
│   └── cn.ts        clsx + tailwind-merge utility
├── types/           TypeScript interfaces (project, node, suggestion)
├── data/            Demo data, AI chat responses, sample timelines
├── styles/          Design tokens, animations, base CSS
├── App.tsx          Routes + providers
└── main.tsx         Entry point
```
