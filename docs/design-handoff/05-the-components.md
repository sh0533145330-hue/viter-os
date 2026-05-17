# 05 — The Components

The reusable pieces. Designers should produce a component library; this is the inventory of what's needed and what each piece must do.

---

## 5.1 Foundational

### Type system
- Display heading (hero, marketing pages, large numbers)
- H1, H2, H3 (page hierarchy)
- Body — readable at small + large sizes
- UI label — for buttons, badges, micro-copy
- Code — monospace, used for keys, IDs, code blocks
- Footnote — citation, lineage state, metadata

Need: consistent vertical rhythm, comfortable line-height, supports German/French expansion without breaking.

### Color system
- Background tiers (multiple surface levels for layering)
- Text tiers (primary, dim, muted, disabled)
- Accent (the customer-configurable brand color)
- Semantic: success (green), warning (amber), error (rose), info (teal/blue)
- Risk tier colors for autonomy:
  - L1 — neutral / calm
  - L2 — confident (accent)
  - L3 — caution (amber)
  - L4 — gravity (rose / red-orange)
- Lineage state colors:
  - Verified — strong, confident
  - Synthesized — accent
  - Inferred — softer
  - Stale — dim
  - Conflicting — amber

Dark mode primary. Light mode supported.

### Surface system
- Page background
- Card / Glass surface
- Elevated card / popover
- Tooltip / overlay
- Modal background

### Iconography
- Coherent icon family
- One stroke-weight system
- Sized: 12, 14, 16, 20, 24, 32, 48
- Need: agent identity glyphs (without anthropomorphizing too hard), source provider logos, autonomy-tier marks, lineage-state marks, status marks

### Motion
- Standard easing curve
- Standard durations (75, 150, 250, 400, 600 ms tiers)
- Specific motion vocabulary for: streaming, thinking, syncing, succeeding, failing

---

## 5.2 Primitives

- **Button** — variants: primary, secondary, ghost, destructive, icon-only
- **Input** — text, password, email, URL, search
- **Textarea**
- **Select / Dropdown**
- **Checkbox / Radio / Toggle**
- **Slider** (autonomy tier picker uses this)
- **Tab** — segmented control
- **Badge / Pill / Chip** — with variants for semantic meaning
- **Tooltip**
- **Modal / Dialog / Sheet** — desktop modal, mobile bottom sheet
- **Toast / Notification**
- **Progress** — linear and circular, determinate and indeterminate
- **Skeleton** — for loading states
- **Avatar** — for users + agents
- **Card** — base + variants (interactive, elevated, glass)
- **Divider**
- **Separator section header**
- **Empty state** — primary illustration, message, CTA
- **Error state** — specific error component pattern

---

## 5.3 The headline components

These are the most-used, most-important. Get these right and most of the product follows.

### `AutonomySwitcher`

The single most important control in the product.

**Variants:**
- Compact (header / sidebar — shows current state, click to change)
- Detail (settings page — full 4-stop picker with explanations)
- Panic (Tom mobile — quick switch to L1)

**Must-show:**
- Current level prominently
- All 4 levels visible
- One-line description per level
- "What I can do at this level" preview

**Must-do:**
- Change level
- See change confirmation (state change is a *moment*)
- Optionally: per-action override links

**States:**
- L1, L2, L3, L4 selected
- Mid-switch (confirming)
- Just-switched (brief celebration / confirmation)
- Locked (rare: workspace admin has locked autonomy)

### `ApprovalCard`

The decision-making unit. Used in /app/approvals, /app/inbox, Tom mobile.

**Must-show:**
- Risk tier badge (L2/L3/L4) with color
- Action summary (one line, "do X for reason Y")
- Proposer (agent name + workflow)
- Why (2-4 sentence reasoning)
- Sources (citation chips)
- Created time + (if applicable) expires time
- (For L4) Co-approver status

**Must-do:**
- Approve (primary button)
- Reject (with optional reason)
- Modify (open editor for the underlying action)
- Drill into source
- (For L4) Ping co-approver

**Variants:**
- List card (compact, in /app/approvals list)
- Mobile focused card (Tom app, one-at-a-time)
- Inline card (in /app/briefings)
- Detail view (full screen / modal)

**States:**
- Pending
- Approved (just-decided animation)
- Rejected
- Expired
- Modified-then-approved
- Awaiting co-approver

### `EntityCard`

The shape of any entity (Person, Account, Deal, Document, Project, etc.).

**Variants:**
- List item (compact)
- Detail panel (right rail)
- Full page (when entity is the page subject)
- Inline mention (in Tom's responses)
- Hover card (preview on link hover)

**Must-show (by variant):**
- Title + entity-type badge
- Source kind
- Primary properties (varies by type)
- Last updated
- Related entities (related count + drill-in)
- Lineage state if relevant
- Action affordances (open in source, add note, link to deal, etc.)

### `Citation` / `Lineage badge`

Tom's claims are anchored by citations. Citations must be:

- Visible (not buried)
- Clickable (open the source record)
- Lightweight (don't dominate the message)
- Stateful (verified vs. synthesized vs. inferred)

**Variants:**
- Chip (most common)
- Inline footnote number (in long answers)
- Full expanded panel (when user drills in)

### `SourceCard`

Each connector in /app/connectors and elsewhere.

**Must-show:**
- Provider name + logo
- Tier badge (Nango / REST / SDK)
- Health (OK / warning / error) with color
- Last sync + sync state (idle / syncing / failed)
- Record count
- Actions: sync, edit, delete, re-auth

**States:**
- Healthy
- Warning (e.g., last sync > 24h)
- Error (auth expired, rate limit, network)
- Syncing in progress
- Just-added (welcome animation)

### `AgentCard`

For /app/agents and references throughout.

**Must-show:**
- Agent name (customizable)
- Default role label (cannot be changed by user; e.g., "Personal co-pilot")
- Status (active / paused)
- Autonomy override (if set)
- Recent activity (24h count)
- Glyph / mark (subtle)

### `MessageBubble`

For conversations in /app/search, Tom app /ask, briefings, inbox.

**Variants:**
- User message
- Assistant message
- System message
- Streaming (with typing animation)
- Error message
- Message with citations
- Message with action (e.g., embedded approval card)

### `BlockCard`

For /app/blocks catalog.

**Must-show:**
- Block name
- Category badge
- Description
- (On expand) Inputs schema, outputs schema

### `WorkflowCard`

For /app/workflows.

**Must-show:**
- Workflow name
- Description
- Blocks used (visual mini-flow)
- Status (template / active / paused)
- Last run, next run (if scheduled)

### `BrandPreview`

Live preview of brand customization. Used in /app/settings/brand.

**Must-show:**
- Mini renderings of: operator app home, Tom app home, Tim app home
- Live update as user types names, picks colors, uploads logo
- Toggle between desktop/mobile preview

---

## 5.4 Layout patterns

### Page header pattern
Every page has a consistent header pattern: title, subtitle/context, action affordance (right side). Designers should establish this once.

### Sidebar (Operator App)
Currently 6 sections in the code (`app-sidebar.tsx`):
- Workspace (Home, Inbox, Briefings, Search, Approvals)
- Sources (Connectors)
- Intelligence (Ontology, Lineage)
- Automation (Workflows, Blocks)
- Library (Agents, Policies, Library)
- Settings (Billing, Team, Brand)

Designers free to regroup.

### Bottom nav (Tom App, Tim App)
- Tom: Home, Ask, Voice, Mind, Approve (5)
- Tim: Team, OKRs, Threads, Brief (4)

### Right panel pattern
Pages like Ontology, Connectors use a "list + detail" pattern. Establish the right-panel as a reusable shape.

### Onboarding step layout
5-step flow with persistent progress, single-column content, primary CTA at bottom.

### Empty state pattern
Centered content: illustration / mark, headline, body, CTA. Establish as a reusable.

---

## 5.5 Conversational components

### Suggestion chips
Above the input on /app/search and Tom app /ask. Suggest questions the user might ask.

### Streaming indicator
"Tom is thinking" → "Tom is answering" (with streaming text)

### Voice button
Hold-to-record, with visual waveform feedback. Mobile-first.

### Citation drill-down
Click a citation → expand inline OR open a detail panel. Designers pick.

---

## 5.6 Status / health components

### `SourceHealthBadge`
- OK / Warning / Error variants with color + icon

### `SyncStatus`
- Idle / Syncing / Just-synced / Failed
- Optionally with progress

### `LineageStateBadge`
- Verified / Synthesized / Inferred / Stale / Conflicting

### `RiskBadge`
- L1 / L2 / L3 / L4 with color

### `BudgetMeter`
- Visual representation of usage vs. cap (settings/billing)

---

## 5.7 Branding components

These must accommodate white-label:

- Brand logo holder (configurable per-workspace)
- Brand accent variable
- Brand agent names (Tom/Tim placeholders)

Designers should *never* hardcode "VitaOS" or "Tom" or "Tim" anywhere a reseller can't override.

---

## 5.8 The vibe of agent identity

Tom, Tim, and the specialists have *presence* but no anthropomorphic mascot. Designers should explore:

- Wordmarks (Tom rendered as text in a consistent treatment)
- Abstract glyphs (small marks that represent each agent)
- Voice waveform / animated shape during interaction
- Color (each agent could have a subtle hue, but white-label safe)
- Motion (each agent could have a slightly different motion personality)

We do *not* want:
- Cartoon avatars
- Pixar-style faces
- Cute mascot characters
- 3D renders of "people"

We *do* want:
- A sense that Tom is a *colleague*
- Calm, confident presence
- Something that survives renaming

---

## 5.9 What designers should produce

A complete design system, including:

1. **Tokens** — color, type, spacing, radius, shadow, motion
2. **Primitives** — every base component above
3. **Compounds** — the headline components (Approval, Entity, Source, Agent cards, etc.)
4. **Page templates** — onboarding step, app page, settings page, etc.
5. **Variants** — every variant of every component, light + dark + high-contrast
6. **Empty / loading / error states** — for every component that needs them
7. **Motion specs** — for every animated behavior
8. **Brand guidelines** — how to white-label without breaking the design system

---

## 5.10 Engineering reality check

Tech context (don't design around, but be aware):

- React 18 + Next.js 14 App Router
- Tailwind for styling
- Server components are heavily used (most pages)
- Streaming is supported (use it)
- Forms use Server Actions
- No state management library by default (React state + server)
- Real-time updates feasible (Supabase realtime)

This means: simple is cheap, complex is doable, real-time is fine.

If a design needs a heavy frontend pattern, engineering will adapt. But "everything must be a SPA" or "everything must be canvas-rendered" creates friction. Tilt server-side when in doubt.
