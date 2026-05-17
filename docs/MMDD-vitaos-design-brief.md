# VitaOS — Master Design Brief

**For:** UI / UX / CX Design Team
**From:** Product & Engineering
**Status:** Engineering build is functionally complete; we need your eyes on the experience.
**Goal of this doc:** Give you everything you need to make great design decisions. We are explicitly *not* telling you what it should look like.

---

## 1. What VitaOS is

VitaOS is a **360° context engine** for the way people actually work today. It connects every tool a person or team uses — email, calendar, CRM, accounting, docs, chat, voice notes — into a single, queryable, AI-ready substrate. On top of that substrate, two AI co-pilots operate:

- **Tom** — the *personal* co-pilot. One per person. Knows their full context. Reads, drafts, reasons, and (with permission) acts on their behalf.
- **Tim** — the *team* co-pilot. One per workspace. Coordinates across all the individual Toms without violating each person's privacy boundaries.

The platform itself — the substrate, the extension surface, the policy engine — is called **VitaOS** and is operated by an **Operator** (the human running the workspace, usually a founder, agency principal, or consulting partner).

> **One-line frame**: We are building "the operating system for AI-native operations" — not another chatbot, not another CRM. A substrate that turns scattered information into an active, accountable workspace.

---

## 2. The three audiences (and the three surfaces)

This is the single most important thing to internalize. There are three distinct people using this system, and each one needs a different experience.

### 2.1 The Operator (Operator App)
**Who:** A founder, partner, or principal who is responsible for the workspace. Often non-technical, but commercially sophisticated. Lives in dashboards and decisions, not in implementation details.

**What they need from the experience:**
- Confidence that the system is alive and working.
- A way to *set boundaries* — what the AI can do alone, what needs review, what requires dual approval — and change them quickly when trust grows or shrinks.
- A clear, calm view of what their AI workforce is doing.
- The ability to add new data sources, see what's been ingested, and ask high-trust questions.
- Tools to brand, customize, and (for agencies) resell the platform to their own clients.

**Surface:** Desktop web (Next.js 14 app). Heavy information density acceptable. Long sessions. Comfortable with sidebars, multi-pane views, dense data tables. Usually a single primary device (laptop), occasionally a second monitor.

### 2.2 The Individual (Tom App)
**Who:** Any team member, including the Operator wearing their personal hat. The end-user of personal AI assistance. Often on the go, in meetings, between contexts.

**What they need from the experience:**
- Something that feels like a calm, intelligent companion — not a tool they have to operate.
- Quick, glanceable answers to "what should I know right now?"
- Frictionless ways to ask, capture, and decide.
- Confidence that Tom understands their full context without needing to be told.
- Voice-first or thumb-first interaction, often one-handed.

**Surface:** Mobile-first PWA, also runs on desktop. Short sessions. Glance, ask, decide, dismiss. Voice is a first-class input.

### 2.3 The Team Lead (Tim App)
**Who:** Sales managers, ops leads, partners who coordinate multiple humans. Often the Operator in smaller orgs, a layer below in larger ones.

**What they need from the experience:**
- A live view of how the team is moving — goals, blockers, decisions in flight.
- Confidence that Tim is routing things to the right person's Tom, not bypassing it.
- The ability to see team-wide patterns without violating individual privacy.

**Surface:** Mobile-first PWA, desktop also. Mid-density. Less voice, more triage.

---

## 3. The shape of the product

VitaOS is three things at once, and a great design will make all three feel like one coherent product:

1. **A data substrate** — Postgres + pgvector + a typed ontology. Every piece of information has a source, a lineage, an extraction history.
2. **An AI workforce** — Tom, Tim, and a roster of specialist agents (Deny for compliance, Lex for legal, Hera for HR, Cal for calendaring, plus librarian agents per domain). Workflows compose blocks (~30 built-ins) into automated pipelines.
3. **A platform** — extension surfaces (CLI, MCP, SDK, packs, eval), white-label branding, multi-tenant policy. The Operator can customize it, agencies can resell it.

You are designing the **human-facing layer over all three** — and the operator needs to feel the platform's power without ever being overwhelmed by it.

---

## 4. Core concepts you must understand

These are non-negotiable concepts the design needs to convey clearly. Use whatever metaphors you think work — but the *meaning* must come through.

### 4.1 Autonomy levels (L1 → L4)
Every action the AI can take falls into one of four bands. The Operator sets the default for their workspace and can override per action type.

| Level | Meaning | Example |
|-------|---------|---------|
| L1 | Tom reads only — never acts | "Tell me what's happening" |
| L2 | Tom writes internally + audits | "Update this CRM record" |
| L3 | Tom acts externally with my approval | "Send this email — show me first" |
| L4 | Tom takes high-stakes action with dual approval | "Sign this contract — needs me + my partner" |

This is the **single most important UX concept** in the product. It needs to feel safe, simple, and visible at all times.

### 4.2 Lineage
Every fact Tom states traces back to a specific record from a specific source at a specific time. "Sarah said yes to the renewal" must be clickable down to the original email/Slack/call transcript. Trust depends on this being effortless to verify.

### 4.3 Approvals
The pending-decisions queue. This is where humans and AI hand off control. The experience of approving (or rejecting, or modifying) an action is one of the most-used flows in the product. It must be:
- Fast (most approvals take 2 seconds)
- Informative (the user must see *enough* to decide — the action, the reason, the risk, the sources)
- Reversible (you can always change your mind for a window after)

### 4.4 The Ontology
Behind the scenes, every entity has a type: Person, Account, Deal, Document, Project, Conversation, etc. Industry packs extend this (CPA, Property, Asset, RevOps). Users don't need to think in these terms, but the design should make it possible to *browse* the ontology — to see "all my Deals" or "everything related to Acme" — without feeling like a database admin tool.

### 4.5 Sources, Connectors, Sync
The Operator connects external systems via Nango (250+ OAuth providers), generic REST, or custom SDK connectors. Each source has health (last sync, error count), volume (records ingested), and freshness. Failure to sync is one of the biggest trust-breakers — make sure problems are visible immediately, with a clear path to fix.

### 4.6 The Three Tiers
This is internal vocabulary, but useful to know:
- **L0** — raw records from a source (an email, a webhook payload)
- **L1** — normalized facts (subject, sender, body)
- **L2** — ontology-aware entities (this email maps to Person X, Deal Y)
- **L3** — derived/synthesized intelligence (Tom's interpretation, summary, judgment)

The Operator should be able to inspect each tier — but the default view is always L2 (entities) with L3 (intelligence) layered on.

---

## 5. The Operator App — what's there

The Operator App has these top-level destinations. Names are working titles — feel free to rename.

| Section | Purpose | Notes |
|---------|---------|-------|
| **Home** | Workspace pulse | Live counts (entities, sources, approvals, messages), recent Tom output, anything that needs attention |
| **Search / Ask** | Universal RAG | Type a question, get an answer with cited sources. The primary "do work" surface. |
| **Inbox** | Combined feed of messages + approvals | Triage destination — what came in since last check |
| **Approvals** | Decisions waiting on the Operator | Approve / reject / modify with risk-tier coloring |
| **Briefings** | Scheduled summaries | Daily 06:30, weekly Mon 07:00 — surfaced by Tom |
| **Ontology** | Entity browser | Stats per type, filter, search. The "data" view. |
| **Lineage** | Trace any fact to its source | Currently flat list — visual graph coming in v2 |
| **Connectors** | Source health + add new | OAuth flows, sync status, error inspection |
| **Workflows** | Composed automation pipelines | Block-based, currently templated — visual editor in v2 |
| **Blocks** | The block palette | ~30 built-in blocks, categorized (Utility / Gate / Entity / Action / Agent / Source) |
| **Agents** | Tom, Tim, specialists | Configure each agent's role, behavior, autonomy |
| **Policies** | Cedar-based ABAC rules | Fine-grained guards. Power-user surface. |
| **Library** | Installable ontology packs | pack-general, pack-cpa, pack-property, pack-asset, pack-revops |
| **Settings → Billing** | Usage, budgets, plan | Self-hosted, reseller, revenue-share, bundled |
| **Settings → Team** | Members, invites, roles | Each member gets their own Tom |
| **Settings → Brand** | White-label config | Agent names, logo, accent, domain, email DKIM/SPF/DMARC |
| **Platform** (`/platform/*`) | Marketing-style docs | CLI, MCP, Packs, Eval, SDK, Security — for developer/agency audience |
| **Onboarding** (`/welcome/*`) | First-run setup flow | 5 steps: workspace → Supabase → OpenRouter → Connect sources → Meet Tom |

---

## 6. The Tom App — what's there

| Section | Purpose |
|---------|---------|
| **Home** | "Good morning" — latest from Tom, key counts, what needs attention |
| **Ask** | Conversational interface, voice-friendly |
| **Inbox** | Messages from Tom |
| **Briefings** | Scheduled summaries (daily / weekly) |
| **Approvals** | Decisions for this individual to make |
| **Voice** | Hands-free Tom — placeholder for v2 |
| **Mind** | The user's personal knowledge graph — placeholder for v2 |

---

## 7. The Tim App — what's there

| Section | Purpose |
|---------|---------|
| **Team** | Workspace stats, navigation hub |
| **OKRs** | Goal tracking from the ontology |
| **Brief** | Daily/weekly team summary |
| **Threads** | Cross-team routing — placeholder for v2 |

---

## 8. Onboarding — the critical first ten minutes

This is where most products lose people. The Operator should be able to:

1. **Connect their workspace** (a name and a sense of "this is mine") — < 30s
2. **Connect Supabase** — paste a URL + service role key, see a "✓ connected" confirmation, deploy the schema, bootstrap the workspace row — < 2 min
3. **Connect OpenRouter** — paste an API key, pick a default model, validate — < 1 min
4. **Connect sources** — pick at least one (Nango OAuth flow OR add a REST source) — < 5 min for the first source
5. **Meet Tom** — name Tom + Tim, choose autonomy level, see Tom's first hello — < 2 min
6. **Land in the app with something to look at** — even with zero entities, the home page should feel inviting, not empty

The whole flow should feel like setting up a beautiful new device, not configuring enterprise software.

---

## 9. The most-used flows (rank order)

If we get these right, the product works:

1. **Ask Tom something** (search → answer → drill into citation)
2. **Approve / reject a pending decision**
3. **Check what's new** (inbox / home pulse)
4. **Add or fix a source**
5. **Adjust autonomy** (panic-button-easy access to L1–L4 settings)
6. **Browse an entity** (see everything about Person X, Deal Y)
7. **Read a briefing**

If a designer asks "should I optimize this for X or Y" and X is in this list and Y is not — pick X.

---

## 10. Tone, personality, and feel (without telling you the look)

We're not prescribing visual style, but we *are* prescribing posture:

- **Calm, not loud.** This is a workspace, not an app store.
- **Confident, not cute.** Tom and Tim have personality but they are not anthropomorphic cartoons. They are colleagues.
- **Honest about uncertainty.** When Tom doesn't know, that must be visible.
- **Premium, not enterprise.** This product is for principals, founders, partners — people who pay attention to taste.
- **Fast to scan, deep to drill.** Everything should be glanceable; everything should reward a closer look.
- **Privacy is felt, not just stated.** When the user does something private, it should feel that way.

**Naming:** Tom and Tim are the *default* names. White-label customers will rename them. Don't bake the names into icons or visual treatments that wouldn't work if they were "Aria" and "Atlas" or "Sage" and "Sentinel."

---

## 11. Multi-tenancy and white-labeling

A meaningful percentage of customers will be agencies who resell VitaOS to their own clients. Every screen needs to imagine itself **rebranded**:

- The agent names change (Tom → "Aria", Tim → "Atlas", etc.)
- The accent color changes
- The logo changes
- The domain changes (ai.client-name.com)
- Email DKIM/SPF/DMARC are auto-configured

This means: don't hard-code the brand into iconography or anywhere a designer can't easily swap. Build the experience as a *frame* that holds varying content.

---

## 12. Accessibility, internationalization, devices

- **WCAG 2.2 AA minimum** across all surfaces.
- **Keyboard navigation** is first-class in the Operator App (power-user surface).
- **Voice** is first-class in Tom App — typed input is the *fallback*, not the default.
- **i18n-ready** — design with longer-language text expansion (German, French) in mind even if v1 ships English-only.
- **Operator App:** ≥ 1280×800 primary, supports 1920×1080+ comfortably. Should not feel cramped at smaller widths.
- **Tom / Tim Apps:** mobile-first, but desktop must not feel like a "wide phone." Treat desktop as a real surface.
- **Dark mode** is the default. Light mode is supported but secondary.
- **High-contrast mode** must work without designer reworking everything.

---

## 13. Empty states and zero-data scenarios

Every page must answer **"what does this look like when there's nothing here yet?"** New workspaces will be empty for days or weeks. The experience must:

- Never feel broken when there's no data.
- Always point to the *one specific thing* the Operator should do next.
- Communicate "we're ready when you are" — not "you haven't done anything."

This is one of the highest-leverage design jobs in the product. Don't treat empty states as afterthoughts.

---

## 14. Loading, latency, and trust

LLM calls take 2–30 seconds. Source syncs can take minutes. Vector searches return in 200ms. The experience must communicate **what's happening** at each scale:

- < 200ms: feels instant, no indicator needed
- 200ms–2s: subtle progress
- 2s–30s: progress + cancellation + estimated time
- > 30s: progress + ability to leave and come back

Tom is allowed to think out loud. Streamed responses are encouraged. Spinners are forbidden where streaming or progressive disclosure is possible.

---

## 15. Error states and trust recovery

When something breaks, the experience must:

- Be specific (which source, which step, which agent).
- Be actionable (here's the button to fix it).
- Be honest (don't paper over real failures).
- Be calm (don't alarm the Operator if it's not alarming).

Common failure modes to design for:
- Source sync errors (auth expired, rate limit, network)
- LLM errors (budget exceeded, model down, content filtered)
- Approval timeouts (Tom asked, nobody answered, what happens?)
- Workspace credentials missing or invalid

---

## 16. The "platform" feeling

There's a marketing/docs surface (`/platform/*`) for the CLI, MCP, Packs, Eval, SDK, and Security pages. These pages serve developers and technically-curious operators. They should feel like **a well-made open-source project's docs site** — credibility through clarity. Not corporate marketing.

---

## 17. What you have free reign over

We are deliberately *not* prescribing:

- The visual style (typography, color, illustration, motion)
- The component library (use what works — we use Tailwind, but you should design first, fit second)
- The information architecture details (you can rename, regroup, restructure)
- The specific layouts of any page
- The interaction patterns for any individual flow
- The animation language
- Iconography
- The exact CTA copy

We *would* like to be in the conversation on:
- The autonomy-level metaphor (it's the most important concept)
- The lineage / citation pattern (trust depends on it)
- Tom and Tim's personality on screen (without baking it in too hard)
- Onboarding's first 10 minutes (the conversion moment)

---

## 18. What success looks like

Six months after launch, we should be able to say:

- "Operators set up their workspace without watching a video."
- "People send Tom screenshots and voice notes the way they used to send them to colleagues."
- "Approvals take seconds, not minutes."
- "When something breaks, users know what to do next."
- "Customers can rebrand the product and it still feels like a single coherent thing."
- "Designers at other companies want to know who designed it."

---

## 19. Constraints and known unknowns

- **Engineering reality:** Built on Next.js 14 (App Router), React 18, Tailwind. Server components are heavily used. Streaming is supported. Server actions handle mutations. This shapes what kinds of interactivity are cheap vs. expensive — engineering will be in the loop on this.
- **Tech-stack-agnostic visual decisions:** Type, color, layout — all yours.
- **No design system inherited:** You are creating the design language.
- **No legacy:** We are pre-launch. Nothing to be backward-compatible with.
- **Timeline:** Engineering work is functionally complete. Design work is the gating path to a beta launch.

---

## 20. The things we don't yet know how to design (your help needed)

- The **autonomy level switcher** — how does a user shift between L1–L4 feeling powerful and safe at once?
- The **lineage drill-down** — graph? tree? cards? something else?
- **Tom's "presence"** in the personal app — avatar? wordmark? abstract shape? voice waveform?
- **The visual workflow editor** (v2) — node-graph? notebook? script-style? something new?
- **The first-30-seconds of the Tom App** for a brand new user — they have no data yet. What should they see?
- **The shape of an approval card** — the right balance of speed and information.
- **The visual language of "this is private"** vs "this is shared with the team."
- **Cross-app coherence** — Tom feels personal, Tim feels collaborative, the Operator App feels controlled. How do we make them feel like one product?

---

## 21. Where to start

We'd suggest, in roughly this order:

1. Define a visual language and core component primitives (type, color, surface, motion, density).
2. Design the **autonomy switcher** and the **approval card** — the two most-used and most-important moments.
3. Design **onboarding** end-to-end (the conversion-critical first run).
4. Design **the Operator App home + search/ask + ontology browser** — the daily-driver triad.
5. Design **Tom App home + ask + approvals** — the mobile companion essentials.
6. Then everything else, in priority order from §9.

---

## 22. Open questions for kickoff

Please come to the first review with positions on these:

1. How do we visually represent Tom and Tim — and what would survive being renamed?
2. What's the mental model for autonomy levels that a non-technical Operator gets in 5 seconds?
3. How do we make lineage feel like a feature, not a forensic tool?
4. What does "the AI is thinking" look like in our product?
5. What's the difference in posture between a personal moment (Tom) and an operational moment (Operator App)?
6. How premium is too premium? We don't want to feel like luxury fashion. We do want to feel like Linear, Vercel, Stripe.

---

*Engineering will pair with you on every page. Nothing on the existing UI is sacred — what's there is a functioning scaffold to prove the data flows. Tear it down and rebuild it your way.*
