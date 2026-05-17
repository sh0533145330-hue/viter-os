# 01 — The Product

A detailed, concrete picture of what VitaOS is and does.

---

## 1.1 The three things at once

VitaOS is simultaneously:

### a) A data substrate
Every email, calendar event, CRM record, document, message, voice note, and webhook from every connected source — captured, normalized, typed, and made queryable. Postgres with `pgvector`. Hybrid search (FTS + vector + reranking). Every piece of data carries its lineage — where it came from, when, who touched it, what transformations it went through.

### b) An AI workforce
A roster of agents that work on top of the substrate:

- **Tom** — personal co-pilot (1 per user). General-purpose, learns the user's voice, holds private context.
- **Tim** — team co-pilot (1 per workspace). Coordinates across all Toms without violating their privacy.
- **Specialists** — Deny (compliance/legal review), Lex (legal drafting), Hera (HR), Cal (calendaring).
- **Librarians** — one per domain (CRM, accounting, calendar, email, docs, comms, finance, ops). Quietly maintain the ontology in their domain.

Agents compose **blocks** (~30 built-in: utility, gates, entity ops, actions, agent calls, source queries) into **workflows** (daily briefings, weekly OKR reviews, lead enrichment, customer health checks).

### c) A platform
Extension points so industry-specific intelligence compounds on top:

- **Connectors** — Nango (250+ OAuth providers), custom REST, custom SDK
- **Packs** — installable ontology extensions (CPA, Property, Asset, RevOps, custom industries) signed with Ed25519
- **MCP servers** — Tom and Tim expose their capabilities via Model Context Protocol so other AI tools can read/write
- **CLI** — `vita init`, `vita new block`, `vita new pack`, `vita doctor`
- **Eval framework** — measure agent quality, run regressions
- **SDK** — TypeScript SDK for building extensions
- **White-label** — fully rebrand for resale (agent names, accent, logo, domain, email DKIM/SPF/DMARC)
- **Billing** — direct, reseller, revenue-share, bundled (Stripe Connect)
- **Policy** — Cedar-based ABAC for fine-grained authorization

The Operator App is the demonstration of the platform's power. The platform itself is the moat.

---

## 1.2 The four-tier data model

Behind the scenes, every fact lives at one of four levels:

| Tier | Name | What it is | Example |
|------|------|------------|---------|
| **L0** | Raw | Source records, untouched | The original Gmail message bytes |
| **L1** | Normalized | Parsed, typed facts | `{from, to, subject, body, timestamp}` |
| **L2** | Ontology | Entities and relationships | "This message is from Person:Sarah, about Deal:Acme-Renewal, sent 2026-05-13" |
| **L3** | Derived | Synthesized intelligence | "Sarah is leaning yes on renewal but wants SSO" |

The default user view is L2 (entities) with L3 (intelligence) layered on. Power users can drill into L1 and L0. Designers should make all four feel like the same surface — *not* four different products.

---

## 1.3 The autonomy model — read this twice

The single most important UX concept in the product. Everything Tom or any agent does falls into one of four bands:

### L1 — Read-only
Tom can read everything. Tom can answer questions. Tom *cannot* write anywhere or send anything. Used by:
- New customers in their first week (build trust)
- Regulated industries (legal, healthcare) by default
- Operators who want a "watch but don't touch" stance on day-1

### L2 — Internal writes
Tom can write to internal systems with full audit. Update a CRM record, create a task, file a document, log a note. *Internal* means "inside your workspace only — not visible to anyone outside." Used by:
- Most workspaces by default after the trust period
- The everyday workflow ("update the deal, log the call, file the contract")

### L3 — External sends with approval
Tom can draft external communications (emails, Slack messages, calendar invites, client portal updates) but cannot send without the human's approval. The approval is fast — typically 2-second tap on mobile. Used by:
- All client-facing communication
- Any external commitment

### L4 — High-stakes with dual approval
Financial actions, contract signing, irreversible commitments. Requires two humans — typically the partner + a named co-approver. Used by:
- Payments above a threshold
- Contract execution
- Anything the firm has policy concerns about

**Critical UX detail:** The user changes their default level via a single, prominent control. Per-action overrides exist for power users but the *default* governs 95% of the experience.

---

## 1.4 The five lineage states

Every piece of intelligence Tom produces has a lineage state. Designers need to make these visible without being clinical:

| State | Meaning | UI implication |
|-------|---------|----------------|
| **Verified** | Tom is quoting a specific source record verbatim or near-verbatim | Show citation badge, source link |
| **Synthesized** | Tom is combining multiple sources to form a conclusion | Show all sources, indicate this is interpretation |
| **Inferred** | Tom is making an inference from patterns | Visible "inferred" marker, lower confidence weight |
| **Stale** | The underlying source data is older than freshness threshold | Visual marker, suggest refresh |
| **Conflicting** | Multiple sources disagree | Show the conflict explicitly, never silently pick a winner |

This is one of the highest-leverage design areas. Trust depends on it.

---

## 1.5 The three apps

### Operator App (`/welcome`, `/app`, `/platform`)
**Audience:** workspace owner (founder, partner, principal, agency operator)
**Surface:** desktop-first web. 1280×800 minimum, 1920×1080+ comfortable. Long sessions (30 min – 4 hours).
**Posture:** controlled, dense-but-calm, professional.
**Primary jobs:** configure the workspace, monitor the AI workforce, ask high-trust questions, review approvals, brand for clients.

### Tom App (PWA, port 3001)
**Audience:** individual team member (including the Operator wearing their personal hat)
**Surface:** mobile-first, also desktop. Short sessions (1-5 min). One-handed common. Voice-first preferred.
**Posture:** calm, personal, conversational.
**Primary jobs:** ask Tom anything, see what's new, approve quick decisions, dictate notes.

### Tim App (PWA, port 3002)
**Audience:** team coordinators (managers, partners with team responsibility)
**Surface:** mobile-first, also desktop. Mid-density. Mid-frequency.
**Posture:** orchestral, organized, calm-but-active.
**Primary jobs:** see how the team is moving, triage cross-team blockers, route work through individual Toms.

---

## 1.6 What's in each app — full destination map

### Operator App

```
/                              → redirect to /app (if onboarded) or /welcome
/welcome                       → landing hero, autonomy explainer
/welcome/workspace             → name your workspace
/welcome/supabase              → connect Postgres + deploy schema + bootstrap row
/welcome/openrouter            → connect LLM provider + verify + pick default model
/welcome/connect               → connect first sources (Nango OAuth + REST)
/welcome/meet-tom              → name Tom + Tim, choose autonomy default, see hello
/welcome/done                  → "you're set" + first-task prompts

/app                           → home (workspace pulse + recent + actions)
/app/search                    → universal RAG (ask anything, get cited answer)
/app/inbox                     → messages + approvals (combined triage)
/app/approvals                 → pending decisions (approve/reject with risk colors)
/app/briefings                 → scheduled summaries from Tom
/app/ontology                  → entity browser (stats per type, filter, search)
/app/lineage                   → trace any fact (list view; graph view v2)
/app/connectors                → source health + add new
/app/workflows                 → composed automation pipelines (templates; visual editor v2)
/app/blocks                    → block palette (~30 built-ins, browsable)
/app/agents                    → Tom, Tim, specialists, librarians
/app/policies                  → autonomy + Cedar policy rules
/app/library                   → installable ontology packs
/app/settings/billing          → usage, budgets, plan
/app/settings/team             → members, invites, roles
/app/settings/brand            → white-label config

/platform/overview             → "the platform" landing
/platform/cli                  → vita CLI docs
/platform/mcp                  → MCP server docs (Tom + Tim)
/platform/packs                → pack SDK docs
/platform/eval                 → eval framework docs
/platform/sdk                  → TypeScript SDK docs
/platform/security             → security architecture, audit, custody
```

### Tom App

```
/                              → home (greeting, latest from Tom, key counts)
/ask                           → conversation with Tom (voice + typed)
/inbox                         → all Tom messages
/briefings                     → scheduled summaries
/approvals                     → personal decisions waiting
/voice                         → hands-free Tom (v2)
/mind                          → personal knowledge graph (v2)
```

### Tim App

```
/                              → team room (stats, navigation hub)
/okrs                          → goal tracking from ontology
/brief                         → daily/weekly team summary
/threads                       → cross-team routing (v2)
```

---

## 1.7 The 30 built-in blocks

Workflows compose these. Designers don't need to expose all 30 prominently, but the Block catalog page should browse cleanly:

**Utility (7):** transform, format, log, sleep, parallel, foreach, sub-workflow
**Gate (5):** conditional, approval-gate, autonomy-gate, time-window-gate, policy-gate
**Entity (7):** create, update, delete, link, query, find-or-create, batch
**Action (3):** invoke, propose, await-approval
**Agent (3):** call, route-to-specialist, run-in-tom-context
**Source (6):** fetch-raw-rows (L0), fetch-facts (L1), fetch-entities (L2), fetch-derived (L3), search-query, embedding-query

---

## 1.8 The connector tiers

Sources have three implementation tiers:

| Tier | What | Effort | Examples |
|------|------|--------|----------|
| **Nango** | OAuth via Nango.dev's 250+ providers | Zero code | Notion, Slack, GitHub, Gmail, Calendar, HubSpot, Stripe, Linear |
| **REST** | Generic REST API connector | Config-only | Custom internal APIs, vendor APIs not on Nango |
| **SDK** | TypeScript-based custom connector | Code | Bespoke proprietary systems, legacy ERPs |

The Operator should be able to add a source in under 2 minutes for Nango, under 5 minutes for REST, and contact the team for SDK.

---

## 1.9 The agent roster

Designers should know each agent has a distinct role. They share a visual language but each has a slightly different presence:

| Agent | Role | Default name | Customizable |
|-------|------|--------------|--------------|
| **Tom** | Personal co-pilot | "Tom" | Yes — white-label |
| **Tim** | Team coordinator | "Tim" | Yes — white-label |
| **Deny** | Compliance / legal review | "Deny" | Yes |
| **Lex** | Legal drafting | "Lex" | Yes |
| **Hera** | HR / people ops | "Hera" | Yes |
| **Cal** | Calendaring / scheduling | "Cal" | Yes |
| **Librarians** | Domain ontology curators | per domain | Yes |

A great design treats the agent roster like a TV-show cast — distinct, memorable, but ensemble.

---

## 1.10 The pricing model (designers need to know)

This affects what designers emphasize:

- **Self-hosted free tier** — Operator brings their own Supabase + OpenRouter. We charge nothing. (This is the *open* version.)
- **Hosted plans** — we run the infra, charge per seat per month with usage caps.
- **Reseller / agency** — agency pays us a wholesale rate, charges their clients retail. Revenue split via Stripe Connect.
- **Revenue share** — for some partnerships, we take a percentage of agency revenue.
- **Bundled** — included in larger enterprise packages.

What this means for design:
- The Operator App must make the *self-hosted* path feel premium (we want OSS love).
- The branding section must make *reselling* feel powerful (we want agency adoption).
- Billing screens are a place to show value, not bury complexity.

---

## 1.11 The technical surface (designers should know, not need)

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind |
| Backend | Server actions, Postgres (Supabase), pgvector |
| LLMs | OpenRouter (any model — defaults to Claude 3.5 Sonnet) |
| Embeddings | OpenAI text-embedding-3-small (configurable) |
| OAuth | Nango.dev |
| Search | Hybrid: Postgres FTS + pgvector + reranker |
| Policy | Cedar ABAC |
| Voice | Vapi (placeholder, v2) |
| Workers | Node.js worker processes |
| MCP | Model Context Protocol servers |

Designers don't need to design *around* these. Engineering will adapt. But know: streaming is supported, server components are heavily used, real-time is feasible.

---

## 1.12 What v1 ships with

| Capability | v1 | v2 |
|------------|----|----|
| Workspace setup | ✅ | — |
| Connect sources (Nango + REST) | ✅ | SDK marketplace |
| Universal search / Ask | ✅ | Multi-turn refinement |
| Approvals with risk tiers | ✅ | Bulk approval, scheduled approval |
| Briefings (daily/weekly) | ✅ | Custom cadences |
| Ontology browser | ✅ | Visual schema editor |
| Lineage | List view | D3 graph view |
| Workflows | Template gallery | Visual block editor |
| Block catalog | ✅ | Marketplace + community blocks |
| Agents | Tom, Tim, specialists, librarians | Custom agent SDK |
| Policies | Autonomy + Cedar | Policy templates gallery |
| Library | 5 seed packs | Community pack marketplace |
| Billing | Direct + reseller | Revenue-share automation |
| White-label | Names, colors, logo, domain | Full theme editor |
| Voice (Tom) | Placeholder | Vapi-powered always-on |
| Mind (Tom personal graph) | Placeholder | Full personal context graph |
| Threads (Tim cross-team) | Placeholder | Live cross-team routing |

Design for v1 first. Design v2 only at sketch level so we know we're not painting into a corner.
