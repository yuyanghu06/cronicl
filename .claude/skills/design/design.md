Design Philosophy of cronicl: 
cronicl has Retro-Futurist and Minimalist Zen Signal — The Storyboard as a Control Console
This interface is built around a single contradiction: nostalgia made modern. It pulls from 1980s–90s dot-matrix printers, early LCD broadcast monitors, film editing consoles, analog teletype machines, and the cathode-ray glow of late-night editing suites — then strips away all the kitsch and grain to make it feel precise, intelligent, and premium. The result is a minimal and calm interface that looks like it was designed in the future by someone who grew up obsessing over old hardware.
The central metaphor is the control console: a professional broadcast or film editing station where every pixel of information is functional, every color signal means something, and the operator trusts the machine completely. The timeline is the edit bay. Nodes are signal frames. Branches are alternate cut paths. The AI is the machine receiving commands. The writer is the director.
This is a soft, approachable creative app with rounded corners, minimal aesthetic, and zen vibes. It is cinematic, structured, minimal, and exacting — but the warmth of a screenplay font in the node text and the familiarity of dot-matrix readouts prevent it from ever feeling hostile. It should feel like the private tool of a serious director: spare, confident, and completely in service of the story.
The core tension the design holds: machine precision meets human narrative. The dot-matrix grid, monochrome palette, and circuit-trace branch lines represent the machine. The screenplay typeface for story prose and the generous negative space around each node represent the human. Neither dominates. Together they produce something that feels like a Kubrick storyboard — rigorous structure in service of deeply human stories.
Form follows function in every single decision. The timeline canvas is the center of gravity. Navigation chrome is minimal so the story stays front and center. Color is strictly structural: the monochrome palette defines spatial zones, and the single orange accent red fires like an indicator light — only on the most important interactive moments.

Color Scheme — Monochrome with Signal Red
No tints, no gradients, no opacity washes of orange. It is either full red or it is absent. This is what makes every use of it feel like a signal rather than a style choice.

Typography
The type system is built on three fonts. Each has a strictly defined role. The three roles never overlap — a font that appears in the wrong context immediately breaks the visual contract the interface makes with the user.
[Display Font — Dot Matrix] is the signal and identity font. It is a dot-matrix typeface built from a visible grid of circular nodes, replicating the LED readouts of broadcast monitors, film timecode displays, dot-matrix receipt printers, and airport departure boards. It appears in: the application wordmark, timeline timecodes and sequence labels (NODE_001, NODE_002), chapter and act headers, the BRANCH, MERGE, and GENERATING... action labels, empty state messages, and generation status readouts. This font is what makes the interface feel like a professional machine rather than a consumer app. It should be used sparingly — never for body text, never for long strings — so that every appearance carries the weight of a readout on a control panel. Free implementation options: Press Start 2P (Google Fonts), VT323 (Google Fonts), Departure Mono, Dot Matrix, or Silkscreen.
[Screenplay Font — Courier New / Courier Prime] is the human and narrative font. It is a monospaced typewriter face that carries the weight of every great film script ever typed. It appears in: node plot summaries and story text, the side panel narrative editor, onboarding copy, empty state descriptions, any place where the content is the story itself rather than the interface. Courier is the font that reminds the user — and the designer — that behind all the machine precision, there is a human writing a story. It also carries cultural specificity: every professional screenplay in Hollywood is written in Courier 12pt. Seeing story content in Courier Prime immediately signals "this is the work." Use Courier Prime (Google Fonts) as the primary implementation — it is a refined modernization of Courier New with better screen rendering while maintaining the typewriter identity.
[System Font — ABC Synt Mono] is the system and technical font. It handles: Gemini prompt input fields, node ID metadata, branch hash labels, generation parameters, debug or status output panels, and any technical interface copy that is machine-facing rather than human-facing. Synt signals "this is the command layer" — clearly differentiating system instructions from story prose. Its excellent character disambiguation (0 vs O, 1 vs l vs I) makes it ideal for technical identifiers in the node system.
The hierarchy rule: Dot-matrix font means machine signal and identity. Courier Prime means human story and narrative content. synt means system commands and technical metadata. Users internalize this within minutes of use. Every screen must use all three fonts in clear hierarchy so the interface always feels like it has a grammar — not just a look.

Iconography
Monoweight line icons throughout. Uniform 1.5px stroke weight at standard size. No fills. No color. No gradients. Monochrome white in dark mode, monochrome black in light mode. Icons are signals, not illustrations — reduced to their most minimal geometric form. Phosphor Icons or Lucide are the recommended icon sets. Avoid any icon set with fills, two-tone styles, or illustrative detail. The only icons allowed to use flat fills are the geometric status indicators (circle/square/diamond/triangle), which use white fills at small sizes to remain legible.

Design Process
You have an empty directory here, I want you to initialize a project with the following specs: 
- Vite 
- Tailwind 
- React 
- Typescript 
- Bun 

The design language should follow the pre-existing design language on the pages.

Use your following design skill to make these designs exceptional.
Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.
The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.
Design Thinking
Before coding, understand the context and commit to a BOLD aesthetic direction:
Purpose: What problem does this interface solve? Who uses it?
Tone: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
Constraints: Technical requirements (framework, performance, accessibility).
Differentiation: What makes this UNFORGETTABLE? What's the one thing someone will remember?
CRITICAL: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.
Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
Production-grade and functional
Visually striking and memorable
Cohesive with a clear aesthetic point-of-view
Meticulously refined in every detail
Frontend Aesthetics Guidelines
Focus on:
Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
Spatial Composition: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
Backgrounds & Visual Details: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.
NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.
Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.
IMPORTANT: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.
Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.