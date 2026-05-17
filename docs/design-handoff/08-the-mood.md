# 08 — The Mood

Visual direction. Light anchors only — *not* prescription. Designers retain full authority on the look. These are the references we admire, the qualities we want, and the things we'd reject.

---

## 8.1 The quality bar

The product should sit comfortably among:

### **Linear** (linear.app)
For: information density that doesn't feel dense. Calm pacing. Keyboard-first power. Dark mode mastery. Restraint.

What to take: the discipline. The "every pixel earned its place" feeling. The pacing of motion.

What to leave: the cycle-graph aesthetic doesn't fit us. Their brand is "for engineers" — ours is for partners.

### **Vercel dashboard** (vercel.com/dashboard)
For: technical credibility expressed visually. Clean monospaced numbers. Subtle gradients. A "developer-tool that won't embarrass you in a board meeting" feel.

What to take: the type discipline. The way they treat "settings" pages as first-class. The way their docs site feels.

What to leave: their visual language is more "platform" than "agent" — we have more humanity to express than they do.

### **Arc Browser** (arc.net)
For: warmth, motion, the way they make heavy software feel light. The boldness with color. The way the brand has personality without being childish.

What to take: the willingness to be *bold*. The motion language. The way "loading" is a moment, not a wait.

What to leave: don't go too far. We're a workspace, not a browser. Don't trade legibility for personality.

### **Notion** (notion.so)
For: how a workspace product makes empty space feel inviting. How heavy navigation can be calm.

What to take: the calm. The white-space discipline. The way blocks feel like Lego.

What to leave: the visual aesthetic is over-familiar. We need to feel newer.

### **Stripe** (stripe.com, dashboard.stripe.com)
For: the quality bar. The way "boring" surfaces (billing, settings, audit) can be *beautiful*.

What to take: the discipline. The fact that nothing is ever ugly, even the API docs.

What to leave: their corporate-trustworthy brand is more conservative than ours should be.

### **Raycast** (raycast.com)
For: the Cmd-K palette. The way keyboard power is exposed without being intimidating.

What to take: the palette pattern. The way every action is keyboardable. The dark-themed depth.

What to leave: their app-launcher aesthetic doesn't apply to a workspace.

### **Apple Notes / Apple Reminders** (the new ones)
For: how a calm, premium product feels native and *quiet*.

What to take: the type. The restraint. The "this could be in iOS itself" feeling.

What to leave: it's too thin for our context-richness needs.

---

## 8.2 What we admire that's *not* on this list

A few specifics designers should know:

- **Things by Cultured Code** — for the way they make checklists feel premium
- **Anthropic's Claude.ai** — for the way they make a chat surface feel like reading and writing prose
- **Lex.page** — for how they make AI feel like a collaborator inside a document
- **Tana** — for the ontology browsing experience (they're closest to us in data model)
- **Reflect.app** — for the way they balance personal context with simplicity
- **Posthog** — for how a deeply technical product can have visual personality
- **Mercury Bank** — for how a "boring" financial UI can feel premium

---

## 8.3 Anti-references (designers should explicitly avoid)

- **HubSpot dashboard** — too crowded, too many colors, too many widgets, "enterprise SaaS" smell
- **Salesforce Lightning** — anything that looks like Salesforce
- **Slack settings** — when a calm product has chaotic deep pages
- **Microsoft Copilot** — too try-hard with the AI aesthetic (sparkles, gradients, "magical" language)
- **Intercom** — friendly to the point of saccharine
- **Most Y Combinator dashboard SaaS from 2018-2022** — generic, gradient, lifeless

---

## 8.4 Qualities we want

If a designer asked "what do you want this to feel like in three words?":

**Calm. Confident. Crafted.**

If allowed five more:

**Substantial. Premium. Quietly powerful. Warm. Modern.**

If the design feels:
- Loud → too far
- Cute → wrong
- Cluttered → wrong
- Generic → unacceptable
- Cold / clinical → not quite right
- Aggressive → wrong

If the design feels:
- Lived-in → yes
- Premium-but-not-luxury → yes
- Personally relevant → yes
- Trustworthy → essential
- Modern → yes
- Engineered → yes

---

## 8.5 The agent presence question

The hardest visual question in the product:

**How do we represent Tom, Tim, and the specialists without anthropomorphizing them?**

We don't want:
- Pixar-style avatar faces
- "AI sparkles" or wand iconography
- Cute mascot characters (Clippy, Cortana, etc.)
- 3D rendered humanoids

We could explore:
- **Wordmarks** — Tom rendered as text in a consistent treatment, like a brand mark
- **Abstract glyphs** — small marks that *suggest* identity without being faces
- **Voice waveforms** — animated shapes during voice interactions
- **Subtle color hues** — each agent has a slight tint (white-label safe)
- **Motion personalities** — each agent moves slightly differently
- **A "presence" indicator** — a dot, a pulse, a subtle animation that says "Tom is here"

This is one of the highest-leverage *and* hardest design problems in the product. We'd love to be in the conversation.

---

## 8.6 Typography direction

Without prescribing a specific typeface, the type system should feel:

- **Display** — confident, modern, could be a geometric sans (Inter, Söhne, Aeonik, GT Walsheim) or a more characterful one (Recoleta, GT Super)
- **Body** — readable at small sizes, comfortable at long-form, generous line-height
- **Numerical / monospace** — tabular figures for the metric dashboards, monospace for keys / IDs / code

The product reads a lot of text (Tom's responses, briefings, citations). Type quality matters more here than in most B2B products.

---

## 8.7 Color direction

Without prescribing a specific palette:

- **Dark mode primary.** This is a serious workspace product. Most users will run dark.
- **Neutral foundation** — not gray-blue, not gray-warm. A *true* gray system, with character.
- **One accent** — confident, customer-configurable
- **Semantic colors** — success, warning, error, info — with serious dignity (not toy-bright)
- **Layered surfaces** — the dark-mode design needs multiple surface tiers to convey depth and grouping

The current code uses a violet/teal accent palette as scaffolding. Replace it with whatever you decide; engineering will adapt.

---

## 8.8 Motion direction

The product is calm, so motion is calm. The product is intelligent, so motion is *meaningful*. Use motion for:

- **Confirmation** — something happened
- **Continuity** — moving between states without losing place
- **Hierarchy** — what matters most catches the eye briefly
- **Streaming** — Tom answering should *feel* alive
- **Status** — sync, processing, "thinking"

Avoid:
- Decorative motion
- Long durations
- Bouncy easing
- Anything that delays a power user

Rough timing budget:
- 75–150ms for state changes
- 150–250ms for layouts
- 400–600ms for moments of consequence (autonomy change, approval landed)
- Streaming text: should *feel* like reading someone typing

---

## 8.9 Iconography direction

A single icon family. Custom-drawn ideally. Coherent stroke weight.

Custom icons we'll need:

- Per-agent glyphs (Tom, Tim, Deny, Lex, Hera, Cal, librarians)
- Autonomy-tier marks (L1, L2, L3, L4)
- Lineage-state marks (verified, synthesized, inferred, stale, conflicting)
- Source-provider logos (use brand assets where required; design fallbacks)
- Block category marks (utility, gate, entity, action, agent, source)

---

## 8.10 Brand direction (the master brand)

VitaOS as a master brand should feel:

- **Modern** — clearly a 2026 product, not 2018
- **Substantive** — not flashy
- **Approachable to non-engineers** — Marcus and Linda should feel welcome
- **Credible to engineers** — Daniel and platform users should respect us

The wordmark, when it exists, should hold its own next to Linear, Notion, Vercel.

The accent color should be confident enough to be a *brand*, not just an accent.

When white-labeled, the brand mechanics must allow complete identity replacement. The product underneath must still feel premium.

---

## 8.11 Quality bar test

After every screen is designed, ask:

1. Would Marcus screenshot this and put it in his agency's pitch deck?
2. Would a designer at Linear, Stripe, or Vercel see this and think "they're serious"?
3. Would Linda, who has never used software like this, understand what to do?
4. Would Daniel, building a vertical SaaS on top, find the brand customization powerful?
5. Would Priya, scrolling on a tram, prefer this to her email?

If all five are "yes," you're done. If any are "no," keep going.

---

## 8.12 What we're *not* asking for

To be totally clear, designers, you have *full authority* on:

- The visual style and aesthetic direction
- Typography choices
- Color palette
- Iconography
- Layout patterns
- Component shapes
- Motion language
- Brand identity
- Specific copy (except for the technical terms — autonomy levels, lineage states, etc.)
- Information architecture details

You should bring your own taste, your own opinions, your own craft.

What we *are* asking for:
- Hit the quality bar (§8.11)
- Carry the journeys (§03)
- Serve the personas (§02)
- Honor the constraints (multi-tenant, accessibility, multi-device)
- Make us proud

---

## 8.13 The deliverable

We expect a complete design package. Approximately:

- **Brand** — wordmark, color, typography, iconography, motion specs
- **Design system** — tokens + primitives + compounds + variants
- **Operator App** — every page, every state, light + dark + high-contrast
- **Tom App** — every page, every state
- **Tim App** — every page, every state
- **Onboarding** — end-to-end flow
- **White-label** — the brand customization experience with examples
- **Marketing surfaces** — `/platform/*` pages, the landing hero

Engineering will pair with you on every page. Nothing is fixed. We expect the design to push back on the current IA and structure where it's wrong.

---

## 8.14 What success looks like, visually

In one year:

- The product is in Figma's "company of the year" list
- Designers at other companies cite us as a reference
- Screenshots get reposted on Twitter / X
- Marcus and Daniel show it off in pitch meetings
- The thing we're most-known-for is not a feature — it's *how it feels*

That's the bar. The product, the engineering, the business — all of it lives or dies by whether you can hit it.
