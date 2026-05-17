# 04 — The Screens

Page-by-page detail. Not visual prescription — *requirements*. What data is on the page, what actions are available, what states the page can be in, and what the user is trying to accomplish.

Use this as a checklist: a great design hits every must-have here.

---

## How to read this doc

For each major page, you'll see:

- **Job** — what the user is trying to accomplish
- **Must-show** — data and elements that must be present
- **Must-do** — actions the user must be able to take
- **States** — empty, loading, populated, error
- **Edge cases** — what can go weird
- **Adjacent screens** — where users go next

---

## Operator App

### 4.1 `/welcome` — Landing hero

**Job:** Convince a brand new visitor that this is worth setting up. Get them to click "get started."

**Must-show:**
- Product name + one-line value prop
- A hero animation, illustration, or visual that communicates "AI + your context, in your control"
- 4 short trust signals (e.g., "Your data stays yours," "L1–L4 autonomy levels," "250+ connectors," "Open source core")
- 4 setup steps as a preview (1. Connect Postgres, 2. Connect AI, 3. Connect sources, 4. Meet Tom)
- 2 CTAs: "Get started" (primary) and "See the platform" (secondary, links to /platform/overview)
- Footer with 6 platform links (CLI, MCP, Packs, Eval, SDK, Security)

**Must-do:**
- Click Get started → onboarding
- Click See the platform → marketing/docs surface
- (If already onboarded) Click "Enter VitaOS" → /app

**States:**
- Not onboarded — show full hero
- Already onboarded — show "Enter VitaOS" and "Re-run setup" prominently
- (Optional) Returning visitor with cached partial setup — show "Continue setup"

**Edge cases:**
- Slow first paint (rural connection). Hero must work as static-first, animate-progressively.
- Reduced motion preference — kill animations.

**Adjacent:** `/welcome/workspace` (next step), `/platform/overview` (browse first)

---

### 4.2 `/welcome/workspace` — Name your workspace

**Job:** Take one piece of information from the user and make them feel like they've started something.

**Must-show:**
- One large input for the workspace name
- A subtitle that explains where this shows up
- A clear "next" CTA
- Progress indicator (step 1 of 5)

**Must-do:**
- Type workspace name
- Continue

**States:**
- Empty — placeholder text in input
- Typed but invalid (e.g., empty after typing space) — gentle inline error
- Submitted — animated transition to next step

---

### 4.3 `/welcome/supabase` — Connect Postgres

**Job:** Get the user to paste two strings, deploy a schema, and feel safe doing it.

**Must-show:**
- Two inputs: project URL, service role key
- A "Don't have Supabase?" helper link with subtle prominence
- Explainer copy: "Your data lives in your own Postgres. We never see it."
- Test connection result (success or detailed error)
- (After test passes) A "preview schema SQL" link that opens the SQL in a readable code block
- (After test passes) A "Deploy schema" button
- (After deploy) A "Bootstrap workspace row" button
- Progress indicator (step 2 of 5)

**Must-do:**
- Paste URL + key
- Test connection
- (Optional) Preview the schema SQL
- Deploy schema
- Bootstrap workspace row
- Continue

**States:**
- Connect step — initial inputs
- Testing — animated progress
- Test success → schema preview/deploy step
- Test fail — specific error (auth failure / network / wrong region etc.) + fix link
- Schema deployed — bootstrap step
- All done — continue button

**Edge cases:**
- Connection times out (Supabase region down)
- Schema partially exists (re-running setup)
- Service role key has wrong permissions

---

### 4.4 `/welcome/openrouter` — Connect AI

**Job:** Paste a key, verify, pick a default model.

**Must-show:**
- One input: API key
- Verify button
- (After verify) Model count + dropdown of models with pricing
- (After verify) Default model selector
- Explainer: "One key. Every model. Bring your own."
- Help link: "Don't have OpenRouter? Get an API key →"

**Must-do:**
- Paste API key
- Verify
- Pick default model (Claude 3.5 Sonnet is the default default)
- Continue

**States:**
- Initial
- Verifying
- Verified (model count shown, model picker active)
- Failed (specific error)

---

### 4.5 `/welcome/connect` — Connect sources

**Job:** Get at least one source connected. Make it easy to add several.

**Must-show:**
- A search/filter for Nango providers (250+ of them)
- A featured grid: top 12 most-popular providers with logos
- A "Custom REST API" option below
- A "Skip — I'll add sources later" link (subtle)
- For each connected source: name, status, "last sync" placeholder
- An "Add another" pattern

**Must-do:**
- Search providers
- Click a provider → OAuth flow → returns connected
- Click Custom REST → form with URL, auth header, schema map
- Skip
- Continue

**States:**
- No sources connected — show grid prominently, skip option
- One source connected — celebrate, but show "add another" subtly
- Multiple sources connected — list view of connected + add-more

**Edge cases:**
- OAuth flow fails (user cancels, scopes refused)
- Provider not in Nango list → suggest REST or contact us
- Custom REST schema doesn't match expected shape

---

### 4.6 `/welcome/meet-tom` — The naming moment

**Job:** Make the user feel like they're meeting someone, not configuring software.

**Must-show:**
- A hero greeting: "Hi, I'm Tom" (with default name visible)
- Two name inputs: "What should I call you?" and "What's your personal co-pilot called?" (default Tom) — plus team coordinator (default Tim)
- Autonomy level selector — visual, 4 cards or 4 stops on a track. Each shows the level + one-line description
- A "What I can do at this level" preview that updates as they pick
- Default selection: L2

**Must-do:**
- Set the personal name (default Tom)
- Set the team name (default Tim)
- Choose autonomy level
- Continue

**States:**
- Initial — Tom/Tim defaults selected, L2 highlighted
- Custom names typed
- Different autonomy hovered/selected
- Submitted

**Critical UX:** This is the moment you set personality. Don't overdesign with cute animations. Don't underdesign with cold form fields. Find the third way.

---

### 4.7 `/welcome/done` — You're set

**Job:** Land them in the app with momentum.

**Must-show:**
- Confirmation that everything is set up
- A "your first sync is running" indicator (5-min ETA)
- 3 suggested first questions to ask Tom (clickable, populate the search bar)
- Big CTA to enter the app

**Must-do:**
- Click a first question → /app/search with pre-populated query
- Click "Enter VitaOS" → /app

---

### 4.8 `/app` — Home (the workspace pulse)

**Job:** Tell the user what's happening across their workspace in one glance. Give them the next action.

**Must-show:**
- Greeting (time-of-day aware, by workspace name)
- 4 key counts: entities, sources, pending approvals, recent messages
- "Latest from Tom" — most recent assistant message, prominently styled
- A pending approval count badge (if any) with one-click route to /app/approvals
- Recent activity feed (5-10 items): messages, approvals, sync events, agent actions
- Source health summary (sources OK / failing)
- A prominent "Ask Tom anything" input (links to /app/search with the question)

**Must-do:**
- Ask Tom (inline input)
- Go to approvals
- Click any entity/source/message to drill in
- Refresh / re-sync a specific source from the health summary

**States:**
- New workspace (no entities yet) — inviting empty state, suggested questions, "Tom is still syncing" indicator
- Sync in progress — show progress per source
- Sync errors — show clearly with "fix" CTAs
- Normal — full pulse view
- Loaded but stale (last sync > 24h) — gentle alert

**Edge cases:**
- All sources failing — page is not broken; show clearly
- Tom hasn't said anything yet — empty "latest" state with helpful CTAs

---

### 4.9 `/app/search` — Universal RAG (Ask Tom)

**Job:** The primary "do work" surface. Type a question, get an answer with sources.

**Must-show:**
- Large search input (the focal element of the page)
- (Optional) Suggested questions / recent searches
- The conversation thread (user messages right-aligned, Tom messages left-aligned)
- For each Tom message:
  - The streaming answer text
  - Citation badges (clickable, link to source)
  - Lineage state badge (Verified / Synthesized / Inferred / Stale / Conflicting)
  - Model used (small footnote)
  - "Was this helpful?" — feedback affordance
- Filters: by source kind, by entity type, by date range
- (After several messages) A "Save this conversation" affordance

**Must-do:**
- Type and submit a question
- Click a citation → open the source record
- Click an entity mention → /app/ontology with that entity selected
- Apply filters
- Provide feedback
- Save / clear conversation

**States:**
- Empty (new conversation) — center the input, show suggestions
- Asking — streaming reply, "Tom is thinking" indicator
- Answered — full message with citations
- Failed — specific error (token budget exceeded / model down / etc.) with retry
- No results from RAG — Tom says "I don't have enough context. Let me try without context..." with second attempt

**Edge cases:**
- Question is ambiguous — Tom asks clarifying question
- Question references something Tom can't see (private to another team member's Tom)
- Long answer with 20+ citations — make citations browsable

**Critical UX:** This page must feel like the *best* AI chat experience the user has ever used. Not equal to ChatGPT. Better.

---

### 4.10 `/app/inbox` — Triage destination

**Job:** Combined feed of messages and approvals. The "what's new since I last looked" view.

**Must-show:**
- Mixed feed: assistant messages, pending approvals, sync events, important system events
- Each item has: source, timestamp, summary, action affordance
- Approvals get visual prominence (risk-tier color)
- Filter tabs: All / Approvals / Messages / Events
- Mark-as-read pattern

**Must-do:**
- Click any item → open detail or take action
- Approve/reject approvals inline
- Mark read / archive
- Filter by type

**States:**
- Empty (nothing new) — calm "all caught up" view
- Many items — paginated or virtualized list
- Items with errors (e.g., failed actions) — visually distinct

---

### 4.11 `/app/approvals` — The decisions queue

**Job:** Approve or reject pending decisions. Fast. Informed.

**Must-show:**
- List of pending approvals, sorted by recency + risk
- For each approval:
  - Risk tier badge (L2 / L3 / L4) with color
  - Action summary (the thing Tom wants to do)
  - Proposer (which agent / which workflow)
  - Why (the reasoning + key context)
  - Source citations (what data Tom is acting on)
  - Created-at timestamp + "expires-at" if applicable
  - Approve / Reject / Modify buttons
  - (For L4) Co-approver status
- A "show resolved" toggle for audit
- Bulk actions for L2 approvals (with strong "are you sure?" guard for L3/L4)

**Must-do:**
- Approve
- Reject (with optional reason)
- Modify (open the underlying action for editing, then approve modified)
- See full reasoning
- Drill into a source
- See co-approver status / ping co-approver

**States:**
- Empty (nothing pending) — calm + helpful (e.g., "Tom has nothing for you. Ask him something →")
- 1-5 pending — list view
- 5+ pending — list with risk-tier sections
- L4 pending dual-approval — both approvers visible

**Critical UX:** Each approval card is one of the most-used components. Make it gorgeous and information-rich.

**Edge cases:**
- Approval expired (timeout) — show clearly, offer to re-propose
- Modify path — what happens when user edits Tom's draft

---

### 4.12 `/app/briefings` — Scheduled summaries

**Job:** Show Tom's scheduled briefings (daily 06:30, weekly Monday 07:00, etc.)

**Must-show:**
- Recent briefings as a feed (newest first)
- For each: timestamp, scope (daily / weekly / topic-specific), content
- Schedule status: when is the next one
- "Configure briefings" link → relevant workflow

**Must-do:**
- Read a briefing
- Open any cited entity
- Approve any actions within a briefing
- Configure schedule

---

### 4.13 `/app/ontology` — Entity browser

**Job:** Browse and inspect the entities VitaOS has captured.

**Must-show:**
- Entity-type stats (counts by type: Person, Account, Deal, etc.)
- Filterable list: by type, by source kind, by text search, by date range
- For each entity: title, type, source kind, last updated, link
- A "show schema" view that lets the user see what fields exist per type
- (For each entity, when selected) Its full record + related entities + lineage

**Must-do:**
- Filter / search
- Open an entity
- See related entities
- Drill into lineage
- (For power users) Edit entity properties

**States:**
- Empty (no entities yet) — inviting, "your ontology will appear here as Tom learns"
- Loaded — full browser
- Filtered — show results count + clear-filter

---

### 4.14 `/app/lineage` — Trace any fact

**Job:** Show how any piece of intelligence Tom has stated traces back to source data.

**Must-show (v1, list view):**
- Recent entities sorted by update time
- For each: title, source kind, type, lineage chain (source records → extraction → resolution → entity)
- "Open in graph" placeholder (v2)

**Must-do:**
- Open an entity → see its lineage
- Drill from any node to the source record
- Filter by source kind / type / time

**(v2: D3 graph view)** — designers should sketch this even if not building v1.

---

### 4.15 `/app/connectors` — Source management

**Job:** Add, remove, sync, and inspect sources.

**Must-show:**
- List of connected sources with: name, provider, status, last sync, record count
- For each source: health (OK / warning / error), expand to see details
- An "Add source" affordance (CTA → Nango grid + REST + SDK)
- Sync controls per source: sync now, edit, delete
- Error details when a source is failing, with specific fix instructions

**Must-do:**
- Add a Nango source (provider grid → OAuth)
- Add a REST source (form)
- Add a custom SDK source (contact / docs)
- Sync now
- Edit / delete
- Re-authorize (when token expires)

**States:**
- Empty — encouraging CTA
- Healthy — clean list
- Some failing — visible warnings
- All failing — banner-level alert with system-wide fix

**Edge cases:**
- Sync in progress — show progress per source
- Sync error types: auth, rate limit, network, schema mismatch — each with specific UI

---

### 4.16 `/app/workflows` — Automation pipelines

**Job:** Show what workflows are active. Let the user browse, run, edit (v2).

**Must-show:**
- Template workflows gallery (daily briefing, lead enrichment, customer health)
- For each template: name, description, blocks used, "use this template" affordance
- (For active workflows) Last run, next run, run history
- "Workflow engine" explainer card (engine capabilities)

**Must-do:**
- Browse templates
- Use a template
- (v2) Edit workflow in visual editor
- Run a workflow now

**States:**
- v1: template gallery only
- v2: + active workflow list + editor

---

### 4.17 `/app/blocks` — Block palette

**Job:** Show the ~30 built-in blocks. Let designers browse, learn what they do.

**Must-show:**
- Category sections (Utility / Gate / Entity / Action / Agent / Source)
- For each block: name, category, one-line description
- (On hover/click) full description + inputs/outputs schema

**Must-do:**
- Browse blocks
- (Optional, v2) "Use in a workflow"

---

### 4.18 `/app/agents` — Agent roster

**Job:** Show Tom, Tim, specialists, librarians. Let user configure each.

**Must-show:**
- For each agent: name, role, one-line description, autonomy (overridable per agent), status (active / paused), recent activity count
- A "Configure" affordance per agent

**Must-do:**
- Pause / unpause an agent
- Rename (white-label)
- Set per-agent autonomy override
- View per-agent recent activity

**Critical UX:** Each agent has a *distinct* presence. They are a team, not a list.

---

### 4.19 `/app/policies` — Autonomy + Cedar policies

**Job:** Set workspace-wide autonomy default. Manage Cedar policy rules.

**Must-show:**
- Current default autonomy level (prominent, with one-tap change)
- Boundary rules (the 4 rule rows: internal reads, internal writes, external sends, financial)
- Override switches per action type
- Cedar policy editor (for power users) — collapsed by default

**Must-do:**
- Change default autonomy
- Override per action type
- (Power users) Write Cedar policies

**Critical UX:** Autonomy must be *understandable in 5 seconds* by Linda. Cedar editor is for Marcus.

---

### 4.20 `/app/library` — Ontology pack library

**Job:** Browse and install packs.

**Must-show:**
- Available packs (general, CPA, property, asset, RevOps)
- For each: name, version, object types covered, install status
- "Install" / "Uninstall" affordances
- "Create your own pack" CTA (links to docs/SDK)

**Must-do:**
- Install a pack
- Uninstall
- See pack contents
- (v2) Publish a custom pack

---

### 4.21 `/app/settings/billing` — Usage + plans

**Job:** Show usage, set budget caps, manage plan.

**Must-show:**
- Current usage: tokens, API calls, storage, by month
- Budget cap (with "set cap" affordance)
- Plan badge (Self-hosted / Hosted / Reseller / Bundled)
- Provider keys status (OpenRouter, Supabase)
- (For resellers) Connected accounts, revenue split

**Must-do:**
- Set budget cap
- Switch plan (CTA → sales for hosted, etc.)
- Manage provider keys

---

### 4.22 `/app/settings/team` — Members + invites

**Job:** Invite team members, manage roles.

**Must-show:**
- Workspace members list with avatar, name, role, last active
- "Invite" affordance
- For each member: their Tom (personal) status, Tim (team) status
- Roles: Owner, Admin, Member, Viewer

**Must-do:**
- Invite by email
- Change role
- Remove member
- See who's online

---

### 4.23 `/app/settings/brand` — White-label config

**Job:** Let resellers (and own-brand operators) configure agent names, theme, domain, email.

**Must-show:**
- Agent name inputs (personal, team)
- Theme: accent color (color picker + hex), logo upload
- Domain config + DNS records to add
- Email: DKIM/SPF/DMARC status with one-click DNS records
- **Live preview pane** (operator app, Tom app, Tim app)

**Must-do:**
- Edit names, colors, logo
- See live preview
- Configure domain
- Save

**Critical UX:** This is the reseller moat. It must look like a design tool.

---

## Platform pages (`/platform/*`)

These are marketing/docs-style pages for developer audience. Less structured. Each one is a long-form page with:

- Hero with feature name + one-line value prop
- Why it matters
- Architecture diagram (clean, schematic)
- Code example
- Links to deeper docs

Pages: `overview`, `cli`, `mcp`, `packs`, `eval`, `sdk`, `security`.

**Critical UX:** These pages must look like a great OSS project's docs site (think Vercel docs, Stripe docs, Linear docs). Credibility through clarity.

---

## Tom App

### 4.24 Tom App `/` — Home

**Job:** Greet, summarize, route.

**Must-show:**
- Time-of-day greeting + Tom name
- Latest from Tom (the most recent assistant message, prominently styled)
- Pending approval count (if any) with one-tap route
- Workspace stats (entities, messages, decisions) — compact
- Recent message preview (3-5 items)
- Bottom nav: Home, Ask, Voice, Mind, Approve

**Must-do:**
- Tap latest from Tom → open the message
- Tap Approve badge → /approvals
- Tap any recent → open
- Nav to Ask, Voice, Mind, Approve

**States:**
- New user (no Tom messages yet) — friendly empty state + "Ask Tom your first question"
- Normal — full home
- Tom has urgent message — visual cue

---

### 4.25 Tom App `/ask` — Conversation

**Job:** Talk to Tom. Voice-first. Type as fallback.

**Must-show:**
- Conversation thread (compact, mobile-optimized)
- For each message: role indicator, content, citations as small chips
- Tom thinking indicator (animated dots)
- Input bar at bottom: text input + voice button (large, thumb-reachable)
- Quick-prompt chips above input (suggested questions)

**Must-do:**
- Type and send
- Hold to record voice → transcribe → send
- Tap a citation
- Re-ask, clarify

**States:**
- Empty (no conversation) — greeting + suggested questions
- Active conversation
- Tom replying (streaming)
- Failed — retry option

---

### 4.26 Tom App `/inbox` — All messages

**Job:** Browse all Tom messages chronologically.

**Must-show:**
- Reverse-chronological list of messages (user + assistant)
- Date dividers
- Quick previews (truncated content)

**Must-do:**
- Tap → expand or open in /ask context

---

### 4.27 Tom App `/briefings` — Scheduled summaries

Same as operator briefings but mobile-optimized.

---

### 4.28 Tom App `/approvals` — Personal decisions

**Job:** Approve/reject quickly on mobile.

**Must-show:**
- One approval at a time, focused, swipeable
- Risk tier with color
- Action summary
- Why (compact)
- Sources (compact)
- Approve + Reject buttons, large, thumb-reachable

**Must-do:**
- Approve / Reject
- Tap "see details" → expanded view
- Swipe to next

**Critical UX:** This is the moment of trust. Must feel safe.

---

### 4.29 Tom App `/voice` (v2) — Hands-free

Placeholder for v2. Vapi-powered always-on voice. Designers should sketch.

---

### 4.30 Tom App `/mind` (v2) — Personal graph

Placeholder for v2. The user's personal knowledge graph. Designers should sketch.

---

## Tim App

### 4.31 Tim App `/` — Team room

**Job:** Show how the team is moving. Navigate.

**Must-show:**
- Time-of-day greeting + Tim name
- Team summary (entity count, source count, pending approvals, message count)
- Cards for OKRs, Threads, Brief
- Bottom nav: Team, OKRs, Threads, Brief

---

### 4.32 Tim App `/okrs` — Goal tracking

**Job:** Show OKRs and progress.

**Must-show:**
- List of OKRs (from ontology, entities of type `okr`)
- Per OKR: title, progress %, status (on_track / at_risk / off_track), owner
- Progress bars
- Status colors

**Must-do:**
- Tap an OKR → details
- (v2) Edit progress

---

### 4.33 Tim App `/brief` — Team brief

**Job:** Daily/weekly team summary.

**Must-show:**
- Workspace snapshot (compact stats)
- Recent briefings (assistant messages with team scope)
- Filter by scope (daily / weekly / topic)

---

### 4.34 Tim App `/threads` (v2) — Cross-team routing

Placeholder. Tim routes tasks between team members' Toms. Designers should sketch.

---

## Cross-cutting requirements

These apply to *every* screen:

### Global navigation
- Operator App: sidebar with 6 sections (Workspace, Sources, Intelligence, Automation, Library, Settings) — currently in code as `app-sidebar.tsx`
- Tom App: bottom nav (5 items)
- Tim App: bottom nav (4 items)

### Cmd-K palette (Operator App)
- Universal command palette
- Search by entity, source, command, action
- Keyboard shortcuts visible
- Tom-aware: can also "ask Tom" from the palette

### Notifications
- In-app toast for confirmations
- Persistent inbox for things that need attention
- (v2) Browser notifications, mobile push for Tom/Tim apps

### Privacy indicators
- Visual marker when user is viewing private (personal Tom) content vs. team-shared content
- Visible "switching context" cue when moving between

### Loading patterns
- 0-200ms: feel instant
- 200ms-2s: subtle inline progress
- 2s-30s: progress indicator with text ("Tom is searching across 3 sources...")
- 30s+: progress + cancel + estimated remaining

### Error patterns
- Always specific (which source, which step, which agent)
- Always actionable (here's the button to fix)
- Always recoverable (try again, fall back, etc.)
- Never alarming for non-alarming things

### Empty patterns
- Every page must work at zero-data
- Point to *the next thing* the user should do
- Feel inviting, not embarrassing

### Keyboard
- Cmd-K everywhere (Operator App)
- Esc closes modals
- / focuses search
- Arrow keys navigate lists
- Enter activates focused item
- Tab order must be sensible

### Touch
- Tom/Tim app: 44px minimum tap target
- Thumb-zone awareness on mobile (bottom-third of screen is gold)

### Density
- Operator App: comfortable density (lots of info, no clutter)
- Tom App: spacious (one thing at a time)
- Tim App: medium

### Motion
- Default: subtle, purposeful, fast (150-250ms)
- Reduced-motion respected
- Never block interaction with animation

### Dark mode
- Default
- Light mode supported but secondary
- High-contrast mode works without redesign

---

## What gets designed first

Order of design priority:

1. The autonomy switcher + approval card (most-used + most-important)
2. Operator App home (the daily-driver opener)
3. Search/Ask (the primary "do work" surface)
4. Tom App home + ask + approvals (mobile companion essentials)
5. Onboarding end-to-end (conversion moment)
6. Connectors page (trust depends on healthy sources)
7. Ontology browser (the "data" view)
8. Brand settings (the reseller moat)
9. Everything else in priority order from §03's journeys
