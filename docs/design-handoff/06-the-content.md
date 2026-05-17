# 06 — The Content

Designers, you'll be laying out a lot of words. Here's what those words actually look like. Use these samples as concrete fixtures while you design.

---

## 6.1 A real Tom briefing (daily, morning)

This is what arrives on Marcus's Tom app at 6:30 AM on a Monday.

> **Monday brief — May 18, 2026**
>
> Three things from this weekend.
>
> 1. **Acme — Bree replied at 11:47 PM Sunday.** She's a "soft yes" on the renewal at the existing rate, but she wants SSO included before signing. *Sources: Slack thread, email chain.* I've drafted a reply that loops in our SSO PM. Approve to send.
>
> 2. **Carillon — Mei has gone quiet.** No reply on the v3 brief since Wednesday. The last message ended with her saying "let me consult the board." It's been 5 days. *Worth nudging today.* Suggested: a short Slack from you, not from me — this is a relationship-level signal.
>
> 3. **Globex — invoice paid.** The Q1 retainer hit your Stripe account at 2:14 AM Sunday. $52,000. *Sources: Stripe webhook, Xero record.*
>
> Two minor things: Aisha started Tuesday and has been using me — she's already up to speed on 11 client relationships. Daniel from Lume sent the v2 brief Sunday night; nothing actionable until your 10 AM with him.
>
> Have a good Monday.
> — Tom

**Notes for designers:**
- Tom speaks in a clear, confident voice — like a senior associate
- Numbers and times are specific
- Sources are inline, conversational
- "Suggested:" patterns are explicit suggestions, not demands
- The signoff is human

---

## 6.2 A Tom approval card

This is what Marcus sees at 7:15 PM during his daughter's piano recital:

```
┌─────────────────────────────────────────────┐
│  [L4]  Acme Renewal — $145,000              │
│                                              │
│  Send DocuSign envelope to Bree Park        │
│                                              │
│  Why now: Bree confirmed pricing 11         │
│  minutes ago via Slack. Lex completed       │
│  legal review at 6:52 PM. The DocuSign      │
│  template is loaded and ready.              │
│                                              │
│  Sources:  [Slack thread]  [Lex review]     │
│            [DocuSign template]              │
│                                              │
│  ✓ Cris approved 4 minutes ago              │
│                                              │
│  ┌─────────────┐  ┌──────────┐              │
│  │ Approve     │  │  Reject  │              │
│  └─────────────┘  └──────────┘              │
└─────────────────────────────────────────────┘
```

**Notes for designers:**
- Risk tier badge top-left (L4 — high gravity)
- Action summary in plain English
- "Why now" — Tom explains the timing
- Sources are chips, clickable
- Co-approver status is *critical* visible info for L4
- Two actions, equally prominent (don't bury reject)

---

## 6.3 A Tom conversation

Priya asks Tom a question on her commute:

> **Priya:** What did Bree commit to on the Friday call?
>
> **Tom:** Bree committed to three things on the Friday call (May 16, 2:00–2:45 PM AEST):
>
> 1. **Decision by Tuesday** on whether to renew at $145K or push to $160K with new scope.
> 2. **Loop in Maria from Procurement** by Monday — she said Maria's the gatekeeper for anything over $100K this year.
> 3. **SSO must be in the proposal** — non-negotiable. She mentioned this twice in the call.
>
> The call recording is in Notion. The transcript is here if you want to skim it.
>
> Three sources: *Call transcript, Maria intro Slack, Bree's follow-up email at 4:18 PM.*
>
> Anything you want me to do with this?

**Notes:**
- Tom always cites sources
- Tom offers next actions ("Anything you want me to do?")
- Specific times and names build trust
- "Non-negotiable" is Bree's language being faithfully relayed, not Tom's interpretation

---

## 6.4 Tom delivering bad news

> **Marcus:** Did Carillon ever sign the SOW?
>
> **Tom:** No, and this is worth flagging — the SOW has been "out for signature" for 11 days now. The last update from Mei was on May 7, when she said the board would discuss it on Tuesday May 14. There's been no follow-up since.
>
> Three possible reads:
> - The board passed and Mei forgot to follow up (low probability — she's responsive)
> - The board pushed back and Mei is figuring out how to deliver that (medium probability)
> - The deal is dying and Mei is avoiding the conversation (you'd know better than me)
>
> Sources: *SOW email thread, Slack DM with Mei, Notion deal record.*
>
> Want me to draft a low-key check-in for her?

**Notes:**
- Tom is honest about uncertainty
- Multiple interpretations are surfaced explicitly
- "You'd know better than me" — Tom defers to human judgment on relationship-emotional reads
- Action suggestion is restrained

---

## 6.5 Tom not knowing

> **Marcus:** What's the budget for the Globex Q3 work?
>
> **Tom:** I don't have a clear answer. Here's what I see:
>
> - The Q2 SOW is in Notion at $48,000 over 8 weeks.
> - There's a Slack message from Adam on March 11 mentioning "Q3 we're thinking around 50."
> - There's no signed Q3 SOW yet that I can find.
>
> I'd treat $50K as a reasonable working number, but it's not confirmed.
>
> Want me to ask Adam for a confirmed number?

**Notes:**
- Tom is comfortable saying "I don't know"
- Tom shares what it *does* know, with sources
- Tom suggests how to resolve the uncertainty

---

## 6.6 An inbox entry — Tom is concerned

In Linda's /app/inbox:

> **[2:14 PM, today]** Tom flagged something
>
> Carlos at Sun Construction has filed Q1 estimates but I can't find the confirmation receipts in TaxDome. I checked Drake, QuickBooks, and the email thread — the payments are there but no receipts. Worth confirming with Carlos.
>
> [Open Carlos]  [Draft a message]  [Dismiss]

---

## 6.7 An error state — source sync failed

> **Connector: HubSpot**
>
> Sync failed at 3:14 PM. Auth token expired.
>
> Your HubSpot OAuth token expired this afternoon. This happens periodically (usually every 60 days). It takes about 90 seconds to refresh.
>
> [Re-authorize HubSpot]    [Skip this sync]

**Notes:**
- Specific
- Honest
- Actionable
- Estimated time set expectations
- "Skip this sync" is an honest second option (some users will want it)

---

## 6.8 An empty state — new workspace

On `/app` for a workspace with 0 entities:

> **Welcome to your workspace, Marcus.**
>
> Tom is still reading your sources for the first time. This takes about 5 minutes for most workspaces.
>
> In the meantime, you can:
> - **Ask Tom a question** — he can answer with what's already loaded
> - **Add another source** — more context, better answers
> - **Set up your team** — invite your partners and senior team
>
> [Ask Tom]  [Add a source]  [Set up team]

**Notes:**
- Not empty-feeling
- Three concrete next actions
- Patience-building (the 5-minute wait is acknowledged)

---

## 6.9 A Tim weekly brief (Tim app `/brief`)

> **Hone & Tan — week of May 18**
>
> The team shipped 4 things last week and has 6 in flight. Two need attention.
>
> **Shipped:**
> - Acme Q2 strategy deck (Priya)
> - Carillon brand audit (Marcus)
> - Globex Q1 retro (Priya)
> - Lume positioning sprint (Aisha + Priya)
>
> **In flight, healthy:**
> - Acme renewal proposal (Marcus, due Tuesday)
> - Lume v2 brief (Daniel reviewing, due Friday)
> - Globex Q3 SOW (Marcus, draft phase)
> - Carillon v3 brief (Priya, awaiting Mei sign-off)
>
> **Needs attention:**
> - **Carillon brief sign-off is 5 days late.** Recommend Priya or Marcus reach out today.
> - **Aisha's onboarding milestone (day 14)** is Wednesday. Marcus, your 1:1 is scheduled.
>
> **OKRs:** Q2 revenue tracking at 78% of target with 6 weeks remaining. Two of three retention OKRs on track; partnerships OKR at risk.
>
> Have a good week.
> — Tim

**Notes:**
- Tim coordinates *across* people without violating individual context
- Tim doesn't say "Priya has X on her plate" — it says "Carillon needs attention, suggest Priya or Marcus"
- Calm, organized, briefing-style prose
- OKRs are summarized, not preached

---

## 6.10 The autonomy switcher copy

When Linda is about to change from L1 to L2:

> **Change autonomy to L2 — Internal writes + audit**
>
> Tom will be allowed to:
> - File notes against client engagement records
> - Update CRM-style records
> - Create tasks and reminders
> - Log calls, meetings, and observations
>
> Tom will **not** be allowed to:
> - Send any external messages (emails, Slack, calendar invites)
> - Take any financial actions
> - Make irreversible changes
>
> Every action is recorded in your audit log. You can switch back to L1 anytime.
>
> [Confirm]  [Cancel]

**Notes:**
- Plain English about what changes
- Both "can" and "cannot" — important for trust
- Audit reassurance
- Reversibility reassurance

---

## 6.11 Onboarding copy — the supabase step

> **Connect your Postgres**
>
> VitaOS runs on your own database. Your data stays yours — we never see it.
>
> [Project URL input]
> [Service role key input]
>
> Don't have Supabase? [Create a free project →]
>
> [Test connection]

After test passes:

> ✓ Connected to your Supabase project.
>
> **Next: deploy the schema**
>
> We'll add the tables VitaOS needs to your database. This is one-time and safe to re-run.
>
> [Preview the SQL ▾]
>
> [Deploy schema]

---

## 6.12 Meet Tom copy

> **Hi, I'm Tom.**
>
> I'll be your personal co-pilot. I read everything in your workspace, and I help you act on it — within the boundaries you set.
>
> **What should I call you?**
> [Your name]
>
> **And what should you call me?**
> [Tom] *(you can change this anytime)*
>
> **What about your team coordinator?**
> [Tim] *(also customizable)*
>
> **How much can I do on your behalf?**
>
> [4 autonomy cards: L1, L2, L3, L4]
>
> The default is L2. You can change this anytime, and you can set per-action overrides later.
>
> [Continue]

---

## 6.13 The platform overview hero

For `/platform/overview`:

> **The platform behind VitaOS**
>
> An ontology substrate. A workforce of AI agents. A boundary system. A white-label engine. An eval framework. A pack marketplace. A CLI. An SDK.
>
> Every piece is composable. Every piece is open-source at its core. Every piece is yours to extend.
>
> [Read the architecture →]    [Browse the SDK →]

---

## 6.14 Sample entity card text

A Person entity (Bree Park):

> **Bree Park**
> *VP Marketing at Acme Corp*
>
> Primary contact since: Aug 2025
> Last contact: 2 hours ago (Slack)
> Relationship temperature: Positive, cautious
>
> Communication preferences: Slack > email > call
>
> Recent context:
> - Renewal conversation (active)
> - Q2 deck review (closed positive)
> - SSO requirement (open, blocker)
>
> 14 related entities — 8 messages, 3 deals, 2 documents, 1 meeting
>
> [Open in HubSpot ↗]   [Add a note]   [Draft a message]

---

## 6.15 Voice / tone summary

Tom and Tim should sound:

- **Like a competent associate at the firm** — not a butler, not a buddy, not a robot
- **Concise** — never filler, never hedge-words, never throat-clearing
- **Specific** — numbers, names, times, sources
- **Honest about uncertainty** — "I don't know" is allowed and respected
- **Action-oriented** — every message ends with a suggested next step or question
- **Calm** — never urgent unless urgent is appropriate
- **Familiar but professional** — uses your first name, but not "Hey Marcus, buddy!"

What they should *not* sound like:

- "I'd be happy to help you with that!"
- "Let me check on that for you, one moment..."
- "Great question! Let me think about that..."
- "As an AI language model..."
- "I hope this helps!"

These are anti-patterns. They are the sound of a chatbot, not a co-pilot.

---

## 6.16 Copy for designers to use as placeholder

When you need lorem-ipsum-ish content, use realistic phrases:

**Entity titles:** Acme Renewal Q2, Carillon Brand Audit, Globex Q3 SOW, Lume Brief v2, Sun Construction Q1 Estimates, Mendez Tax Engagement 2026

**Person names:** Bree Park, Mei Chen, Adam Bauer, Maria Santos, Aisha Bhandari, Cris Tan, Sarah Kim, Carlos Rodriguez, Linda Okoye-Mendez

**Companies:** Acme Corp, Carillon Group, Globex Industries, Lume Studio, Sun Construction, Mendez & Co, Hone & Tan

**Source kinds:** HubSpot, Slack, Notion, Gmail, Calendar, Linear, Stripe, Xero, TaxDome, Drake, QuickBooks, DocuSign, Loom, Figma

**Use these names everywhere** so the design has consistent fixtures. Don't use "Lorem ipsum." It tells you nothing about how the product feels.
