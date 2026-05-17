# 07 — The Market

Business context. Designers need this to understand stakes, who's paying, and why a beautiful design matters commercially.

---

## 7.1 The opportunity

The total addressable market is the *entirety* of professional services — accounting, consulting, legal, agency, advisory, asset management, real estate operations, financial planning, healthcare admin. In the US alone, this is ~$2 trillion in annual revenue.

We're not selling to enterprises — we're selling to the **operator class**. There are roughly:

- **600,000 accounting firms** in the US
- **400,000 marketing/creative agencies**
- **170,000 law firms**
- **150,000 management consultancies**
- **250,000 financial advisory practices**

Of these, the firms that are *most ready* to buy us:

- 5 to 50 people in headcount
- Founder-led or partner-led
- Already using "modern" tools (Slack, Notion, HubSpot, cloud accounting)
- Frustrated with the cost of context-switching
- Have heard the AI hype but haven't found the right shape

Conservative target: **30,000 firms in our first 24 months**. Average revenue per firm: $4,800/year. That's a $144M ARR opportunity from this segment alone.

---

## 7.2 The customer types

We sell to three personas:

### Type 1 — Direct-to-firm (Marcus, Linda)
The firm partner installs and pays. This is our primary motion in year 1.

- Buyer = user
- 1-week consideration cycle
- $400/month avg (4-5 seats)
- Self-serve onboarding
- Discord + docs are the support model

### Type 2 — Agency reseller (Daniel)
A consultancy/agency installs VitaOS, rebrands as their own product, deploys to *their* clients.

- Buyer = agency principal
- 2-week consideration cycle
- Wholesale rate to us, retail rate to client
- We don't talk to the end client
- High leverage — one Daniel deploys to 20+ firms

### Type 3 — Industry vertical packaging
A vertical operator (e.g., someone who knows CPA firms deeply) takes VitaOS + their pack + their brand and creates a vertical SaaS.

- Buyer = vertical entrepreneur
- 1-3 month partnership cycle
- Revenue share model
- We become the platform, they become the product

---

## 7.3 The pricing model

**Self-hosted (Free)**
- Operator brings their own Supabase and OpenRouter
- $0 to us
- Full feature set
- This is the OSS / community version
- Goal: hearts and minds, GitHub stars, signals to enterprise buyers

**Hosted Pro ($49 / seat / month)**
- We run the Postgres, the embeddings, the vector store
- Operator brings OpenRouter (their AI bill)
- Full feature set
- Best for firms that don't want infra
- 5–50 seat range

**Hosted Team ($79 / seat / month)**
- All of Pro
- Plus: priority support, eval suite, dedicated success
- 20–500 seat range

**Reseller Wholesale (negotiated)**
- 35–55% of retail pricing to the agency
- Stripe Connect revenue split
- White-label included
- Agencies set their own retail pricing

**Enterprise (custom)**
- Self-hosted with dedicated support
- SLAs, custom packs, custom MCP integrations
- $50K–$500K annual

---

## 7.4 What designers need to know about pricing

- **The Free tier matters.** It's the funnel. Designers should make the self-hosted experience feel premium — not like a stripped-down trial.
- **Per-seat pricing means seat sprawl is a feature.** Designers should make it easy to invite team members and easy to see who's active.
- **Reseller is high-leverage.** Brand settings, billing screens, and the white-label experience are *the* deciding factor for resellers. Get those screens right and we ship 10x.
- **Usage caps matter.** OpenRouter token spend can run away. Designers must make budgets visible and friendly.

---

## 7.5 The competitive landscape

We don't compete with one product. We sit at the intersection of four categories:

### Category 1 — General AI chat
**Players:** ChatGPT, Claude.ai, Perplexity, Microsoft Copilot
**What they do:** Generic chat, you provide context manually
**Where we win:** We *are* the context. Generic chat is a feature inside us.
**Where they win:** Brand recognition, frontier model access, "I just want to talk to AI"

**Design implication:** Our chat surface (/app/search and Tom /ask) must be *as good as* ChatGPT. Not 80% as good. Better — because we have context they don't.

### Category 2 — AI in CRM
**Players:** HubSpot Breeze, Salesforce Einstein, Pipedrive AI, Attio AI
**What they do:** AI features bolted onto a CRM
**Where we win:** We're outside, above, and across every tool. We're not tied to one record system.
**Where they win:** "I already use HubSpot, why would I add another tool?"

**Design implication:** We must demonstrate breadth — Tom answers questions a CRM AI cannot, because Tom has Slack, calendar, docs, voice notes, etc.

### Category 3 — Agent platforms
**Players:** LangChain, CrewAI, Microsoft AutoGen, custom builds
**What they do:** Frameworks for building your own AI agents
**Where we win:** We're for the partner who needs it to work on Monday. They're for the engineer who wants to build for six months.
**Where they win:** Customizability, no per-seat pricing

**Design implication:** We should *expose* our extensibility (CLI, SDK, MCP) but never make it a barrier. The default experience must be amazing without writing code.

### Category 4 — Vertical AI tools
**Players:** Harvey (legal), Glean (enterprise search), Bardeen (workflow automation), Hebbia, Klue
**What they do:** AI for specific verticals or specific functions
**Where we win:** We're horizontal substrate with vertical packs. Customers pick their vertical via the Library.
**Where they win:** Deep vertical expertise, high enterprise willingness to pay

**Design implication:** Our packs (pack-cpa, pack-property, etc.) must feel as *vertical* as a dedicated vertical product. The Library page is critical.

---

## 7.6 Positioning statement

**For** founders and partners running 5-50 person professional services firms

**Who are** drowning in context switching across email, chat, CRM, docs, and calendar

**VitaOS** is a 360° context engine and AI co-pilot platform

**That** captures every piece of business context, makes it queryable, and lets AI act within boundaries the human controls

**Unlike** generic AI chat (no context), AI-in-CRM (locked to one tool), or agent frameworks (built for engineers)

**Our product** gives partners a *colleague* — Tom — who knows everything and asks before acting.

---

## 7.7 The brand voice (for marketing surfaces)

The product is calm and confident. The marketing is also calm and confident — not loud, not breathless.

**We say:**
- "Your 360° context engine"
- "AI that works inside your boundaries"
- "A co-pilot, not a chatbot"
- "Open core. Yours to extend."

**We don't say:**
- "Revolutionary AI"
- "The future of work"
- "Game-changing"
- "Disrupt"
- "10x productivity"

The marketing surface (`/platform/*`, the landing page hero, etc.) should feel like Linear or Vercel — not like Series-A SaaS marketing.

---

## 7.8 The product narrative for the marketing site

If we were writing a long-form home page, the structure would be:

1. **Hero** — One-liner + animated hero element
2. **The problem** — "You're not drowning in information. You're drowning in synthesis."
3. **The shape of the solution** — Substrate + agents + boundaries
4. **Meet Tom** — what a personal co-pilot looks like (with animated example)
5. **Meet Tim** — what a team co-pilot looks like
6. **The boundary system** — L1-L4 explained visually
7. **The lineage** — every fact, traced
8. **The platform** — CLI, SDK, packs, MCP (one-line each)
9. **For agencies** — the white-label story
10. **Pricing** — three tiers (Free / Pro / Team) + Reseller / Enterprise
11. **Trust signals** — security, open source, audit
12. **CTA** — Start your workspace

Designers will inherit a marketing site eventually. v1 ships with the in-product `/platform/*` pages standing in for a real marketing site.

---

## 7.9 Customer evidence (use these in marketing surfaces eventually)

These quotes are fictional but representative of the kind of testimonial we expect:

> "I check Tom before I open my inbox. I haven't gone back."
> — Marcus T., Hone & Tan

> "We onboarded a new associate. She used Tom for 30 days. She now knows the firm better than people who've been here for years."
> — Marcus T., Hone & Tan

> "I was at my daughter's recital and an L4 came in. Two taps. Done. I was back in the room before the next song."
> — Marcus T., Hone & Tan

> "My clients communicate by WhatsApp. Tom reads them. I trust it more than I trust me."
> — Linda O., Mendez & Co

> "I've deployed VitaOS to seven firms this year. The white-label is the killer feature."
> — Daniel L., Levrai Group

---

## 7.10 The strategic moat

In the long term, what defends us:

1. **The ontology substrate** — once a customer has 6 months of typed, lineage-tracked context, they can't leave
2. **The pack ecosystem** — industry-specific packs compound; the more we ship, the harder we are to displace
3. **The reseller network** — Daniels become our distribution
4. **The eval framework** — we know how good our agents are; competitors don't
5. **The MCP servers** — Tom and Tim can be consumed by *other* AI tools, making us the substrate beneath the whole AI workspace stack
6. **The brand** — if Tom feels like *the* AI colleague, the brand itself is defensible

**Design implication:** Every screen contributes to one or more of these moats. The ontology browser makes the substrate visible. The Library makes the pack ecosystem visible. The brand settings make resellers happy. The eval pages make the quality story visible. The agent roster makes the brand vivid.

A design that hits any one of these well makes the product. A design that hits all of them makes the company.
