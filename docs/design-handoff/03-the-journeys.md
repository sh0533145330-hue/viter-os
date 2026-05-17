# 03 — The Journeys

Designers, these are the stories you're designing. Each one is a real moment in real time with real stakes. If your design can carry these moments, the product works.

---

## Journey 1 — Marcus sets up VitaOS on a Saturday night

**Saturday, 9:42 PM. Marcus's kitchen. He has a Negroni, his laptop, and 45 minutes before his partner gets home.**

He's been thinking about this for two weeks since seeing a YC post. He opens the VitaOS site, clicks Get Started.

**Minute 0:** The landing screen says "Your 360° context engine." There's an animated hero element that feels alive — not a stock illustration. Two buttons: "Get started" and "See the platform." He clicks Get started.

**Minute 1 — Workspace name.** "What's your workspace called?" One input. Helpful subtext: "This is the name your team will see. You can change it later." He types "Hone & Tan." Clicks continue.

**Minute 2 — Supabase.** A screen explains why he needs Postgres: "VitaOS runs on your own database. Your data stays yours." Two inputs: project URL, service role key. Below: a link "Don't have Supabase? Create a free project in 2 minutes." He has one. He pastes. Clicks Test connection. A 1.5-second animated check happens. ✓ Connected.

A second step appears: "Deploy the schema." A preview of the SQL is collapsible. He doesn't need to read it. Clicks Deploy. Green check. Bootstraps the workspace row. Green check.

**Minute 4 — OpenRouter.** "VitaOS uses OpenRouter for AI models. One key, every model." A field for API key. He pastes. Clicks Verify. ✓ 247 models available. He picks Claude 3.5 Sonnet as default.

**Minute 6 — Connect sources.** "Connect at least one source to give Tom context." A grid of provider logos appears — Notion, Slack, Gmail, HubSpot, Linear, Stripe, Calendar, GitHub, Drive, Dropbox, Asana, Linear... He clicks HubSpot. A Nango OAuth flow opens. He authorizes. Returns. ✓ HubSpot connected.

He adds Slack. Then Gmail. Three sources. "You can add more anytime." He continues.

**Minute 12 — Meet Tom.** A screen that feels like meeting someone. "Hi, I'm Tom. I'll be your personal co-pilot." Below: "What should I call you?" (Tom is the default — he keeps it.) "And your team coordinator?" (Tim is the default — he keeps it.) "What's your starting autonomy level?" A clean visual selector: L1, L2, L3, L4 with one-line descriptions. He picks L2 (default for most).

**Minute 14 — You're set.** "Tom is reading your sources now. This first sync takes about 5 minutes. Here's what you can do in the meantime: ..." Three suggested first questions for Tom. He clicks "What's currently in my pipeline?"

**Minute 14:30 — His first answer.** The app loads `/app/search` with his question pre-populated. Tom is streaming: "I see 12 open deals in HubSpot worth $487K total. The largest is Acme at $145K, stage 'Negotiation,' last touched Friday. Two deals have been quiet for over 14 days: Carillon ($28K) and Globex ($52K). Want me to draft check-ins for those?"

Below the answer, citations: HubSpot. Clickable.

Marcus laughs out loud. Texts his partner: "I think I just had a religious experience."

**What this journey tells you:**
- 14 minutes from "land on site" to "Tom answers a real question with real data."
- Each step has *one job*. Never two.
- The pacing is fast but never rushed. Animations are confirmation, not delay.
- The autonomy choice is a *moment*, not a checkbox.
- The first answer matters more than anything else in the product.

---

## Journey 2 — Priya's Monday morning

**Monday, 7:47 AM. Train, North Sydney to Wynyard.**

Priya is standing, holding the pole with her left hand. Her right thumb scrolls.

She opens the Tom app. The home screen says "Good morning, Priya." Below, a card: "Your Monday brief — 4 clients, 3 things to know."

She taps. A scrollable view, beautifully typeset:

> **Acme — Bree** is back from leave today. She replied to your Friday email at 7:23 AM. *Tone read: positive. Open to your proposal.*
>
> **Carillon — Tom** is concerned. The brief sign-off hasn't moved in 9 days. The last message from Mei was vague. *Suggested: a 5-min stand-up call to unblock.*
>
> **Globex — All clear.** Q3 work delivered Friday. Invoice raised. Mei's team is happy in their last Slack message.
>
> **Lume — New brief landed Sunday night.** Daniel sent over the v2 brief at 11pm. *Worth reviewing before your 10 AM with him.*

Each item is tappable. Each has a "draft a reply" or "schedule" or "open thread" action.

She taps Carillon. Tom shows the relevant thread, the 9-day gap, and a draft message: "Hey Mei — wanted to check in on the brief sign-off. Anything I can do to help unblock? Happy to jump on a quick call this morning."

She taps Send. Approve. Tom confirms: "Sent at 7:51 AM. I'll let you know when she replies."

She's at Wynyard. She walks to the office. Before her first coffee, three of her four accounts are in a known state, and she's pre-empted one issue.

**What this journey tells you:**
- The morning brief is the killer feature for Priya. It must be *beautiful* on mobile.
- Every item must be both *readable* (skimmable) and *actionable* (one tap to do).
- Tom's "tone read" and "suggested" annotations are intelligence on top of facts. The design must make these feel different from raw quotes.
- The approval flow inside a briefing must be inline, not a different page.

---

## Journey 3 — Linda's trust-building first month

**Week 1, Day 3, 2 PM. Linda's office, Phoenix.**

She's been using VitaOS in L1 (read-only). She's asked Tom 23 questions in three days. So far, every answer has been correct or honestly inconclusive.

Today she asks Tom: "Did Carlos at Sun Construction file his Q1 estimated taxes?"

Tom replies: "I see in QuickBooks that Carlos paid $4,200 to the Arizona Department of Revenue on April 13, posted as 'Q1 ES Tax.' He paid the federal portion of $11,800 on April 14, posted as 'Q1 Federal Estimate.' I don't see a confirmation receipt in TaxDome, though. Would you like me to flag that for follow-up?"

Linda is *delighted*. Tom didn't just answer — Tom noticed something she would have noticed (the missing receipt) and flagged it.

She thinks: "I'm switching to L2 next week."

**Week 2, Monday morning.** She goes to /app/policies. The autonomy section is at the top. A visual selector shows the current level (L1) and the others. She taps L2. A confirmation card: "L2 means Tom can write to your internal systems — like filing notes against client records — and you'll see every action in the audit log. You can switch back anytime." She confirms.

Tom: "Got it, Linda. I'll start filing as I learn. You can review everything I've done in Audit."

**Week 3, Tuesday.** She's on a call with Carlos. While he talks, she opens Tom on her phone and dictates: "Carlos needs to extend the 2024 return. He's missing the QBE schedule. I'll follow up Thursday."

Tom transcribes. Files the note against Carlos's engagement record. Surfaces a 2024 return entity card and offers: "I can also draft the extension paperwork. Approve?" She'll do that herself — she's not ready for L3 on tax forms.

**Week 4, Monday.** She switches the default to L3 for *client communications only* (not tax forms). She uses the per-action override.

That afternoon, Tom drafts the Thursday follow-up to Carlos. She edits one sentence. Sends. Tom logs the send.

**What this journey tells you:**
- The path from L1 → L2 → L3 must feel like *building trust*, not unlocking features.
- The per-action override (different default for different action types) must be findable but not in your face.
- Tom must demonstrate competence *before* asking for trust.
- Audit logs are a trust artifact, not a debug tool. Treat them like a feature.

---

## Journey 4 — The L4 approval, mid-recital

**Friday, 7:15 PM. Marcus is at his daughter's piano recital.**

She's about to play. He's silenced his phone. A buzz — Tom Watch notification: "Urgent: Acme contract is ready to send. $145K, requires L4."

He frowns. He thought this was tomorrow. He glances at his partner across the auditorium. She's looking at him.

He opens Tom. The approval card:

> **Acme Renewal — Annual Retainer**
> *Send DocuSign envelope to Bree Park*
>
> **Amount:** $145,000 / year, billed monthly
> **Term:** 12 months from June 1, 2026
> **Risk: L4** — financial commitment + external send
>
> **Why now:** Bree confirmed pricing 11 minutes ago via Slack. The legal review by Lex completed. The DocuSign template is loaded. Waiting on your approval and Cris's.
>
> **Cris has already approved (4 minutes ago).**

He glances at Cris's approval. Two taps: **Approve & Send.** Tom: "Sent at 7:16 PM. I'll let you know when Bree opens it."

He puts his phone away. His daughter starts playing.

**What this journey tells you:**
- L4 approvals are *moments of high stakes*. The card must make the decision clear in under 5 seconds.
- The "co-approver has already approved" indicator is a critical detail. If Cris hadn't approved yet, the card must say that — and offer to ping him.
- The "why now" section is what makes the human comfortable approving in a hallway / piano recital / car park.
- Nothing about this experience should feel like enterprise software. The stakes are personal.

---

## Journey 5 — Aisha's first day

**Tuesday, 9:15 AM. Hone & Tan office.**

Aisha is 30 minutes into her first day. She has her laptop, a Notion onboarding doc Marcus made, and a profound sense of not knowing anyone or anything.

Priya opens up the Tom app on Aisha's phone and walks her through setup. "Tom is your assistant. Ask him anything. Don't try to remember everything by yourself."

Aisha's first question to Tom: "Who is Bree?"

Tom: "Bree Park is the VP of Marketing at Acme Corp. She's the primary contact on our retainer. We've worked with her for 8 months. She prefers Slack to email. Her birthday is March 14. Last time she was happy with us was around the Q1 brand work; the current relationship temperature is positive but cautious."

Aisha laughs. "Holy shit." She asks: "Who else should I know about?"

Tom returns a list of 14 people across Acme, Carillon, Globex, Lume — with one-line context on each.

She spends her first hour reading Tom answers about people, companies, recent decisions. By lunch, she could have an intelligent conversation about any active project.

That afternoon, in a team stand-up, Priya mentions a "trade-off conversation" with Mei from Carillon. Aisha, instead of nodding through it, opens Tom and asks: "What's the trade-off conversation with Mei about?" Tom shows her the thread. Aisha catches up in 90 seconds.

**What this journey tells you:**
- A *new team member* journey is different from a new *operator* journey. Aisha doesn't configure anything. She just uses Tom.
- The "who is X?" pattern is critical. Make it elegant.
- An entity card (Person card) must be glanceable, dense, and human-readable.
- Tom's understanding of *relationships* — temperature, history, preferences — is what makes the experience magical.

---

## Journey 6 — Daniel ships his white-label

**Sunday, 3 PM. Daniel's coworking space, Cologne.**

He's installing VitaOS for his fourth client — a 19-person property management firm called Lutter Immobilien. He's about to demo on Monday at 10 AM.

He's done this three times before, but this time he's racing. He has 90 minutes.

He goes to /app/settings/brand. The screen lets him:

- Set the agent name. He types **Hugo** for personal, **Helga** for team. (His clients respond well to German names.)
- Set the accent color. He pastes Lutter's brand hex.
- Upload a logo. (Drag-drop.)
- Set the custom domain. He's pre-configured `ai.lutter-immobilien.de`. The screen shows DNS records to add (already added in his CI).
- Set email DKIM/SPF/DMARC. The screen confirms each is configured.

A *live preview* on the right shows what the operator app, Tom app, and Tim app would look like with the new brand. Everything updates as he types.

He clicks "Save brand settings." Done.

He goes to /welcome (the onboarding flow). It now says "Hi, I'm Hugo." The accent color is Lutter green. The logo is in the top-left.

He spends the next 60 minutes connecting Lutter's actual systems and pre-loading the workspace with their data. By 4:45 PM, he's done. He records a 4-minute Loom for his client showing what they'll see.

Monday's demo lands. Lutter signs.

**What this journey tells you:**
- The brand settings screen is *the* moat for resellers. It must be ridiculously well-designed.
- Live preview is non-negotiable. Designers should think of this as a "design tool inside the product."
- Every screen in the app must be *brandable* — there cannot be one hard-coded "VitaOS" anywhere in the resold experience.
- The onboarding flow must work for both "I'm setting this up for myself" and "I'm setting this up for a client."

---

## Journey 7 — Something breaks (and Linda doesn't panic)

**Wednesday, 10:30 AM. Linda's office.**

She tries to ask Tom about a client and Tom replies: "I'm having trouble reaching QuickBooks right now. Your last sync was 14 hours ago. I can answer based on what I have, or you can refresh — that should take about 2 minutes. Either way, this looks like an authentication issue: your QuickBooks token expired last night."

A button: **Refresh QuickBooks now.** Another: **Answer with what you have.**

She clicks Refresh. A modal opens with a "Re-authorize" button. She clicks it. QuickBooks OAuth opens. She authorizes. Tom: "Reconnected. Syncing now. I'll have everything up to date in about 2 minutes."

She continues her work. Two minutes later a small notification: "QuickBooks sync complete. 47 new transactions, 3 updated invoices."

**What this journey tells you:**
- Failures are *not* "Oops! Something went wrong." They are specific, honest, and actionable.
- The user must always know *what* failed, *why*, and *what to do next*.
- The recovery path must be one click.
- Background recovery (background sync) must communicate when it completes without interrupting work.
- This is one of the highest-leverage design surfaces in the product.

---

## Journey 8 — The autonomy panic moment

**Thursday, 6:47 PM. Marcus is at dinner.**

He looks at his phone. Tom sent something to a client. Tom sent something he *now* wishes he hadn't.

He needs to stop Tom from doing anything else, right now, in case it happens again.

He opens the Tom app. The home screen has, in a discoverable but not panicky place, a control labeled **Set autonomy**. He taps it. The current level (L3) is highlighted. He taps **L1**. A confirmation: "Tom is now read-only. No actions will be taken until you change this."

He puts his phone away. He'll figure out what happened tomorrow.

**What this journey tells you:**
- "Panic-button" access to L1 is a *feature* and must be designable. Not buried in settings.
- The audit log must show *exactly* what Tom did, when, why, and how to undo it (if undoable).
- The user must never feel like they don't have an emergency brake.

---

## Journey 9 — Marcus shows it to a friend

**Sunday, 11 AM. Café in Surry Hills.**

Marcus is meeting his friend James, who runs a 6-person digital agency. They meet for coffee every couple of weeks. James asks how the business is going.

Marcus opens his laptop. "You have to see this thing I'm using."

He opens the Operator App. He's on the Home view. The page is calm, informative, beautiful. James leans in.

Marcus does a 4-minute demo:
1. Home — "this is my workspace pulse"
2. Search — types "what's at risk in my pipeline?" — Tom answers in 4 seconds
3. Approvals — shows two pending decisions
4. Ontology — "this is every person, deal, project, document I've ever worked on, all linked"
5. Brand — shows the white-label preview
6. Back to home

James: "Send me the link."

**What this journey tells you:**
- The product must be *demo-able* in 4 minutes by a customer who isn't trying to demo it.
- Every screen, on its own, must look great in a screenshot.
- The home view must work as both "my daily driver" and "the demo opener."
- The product is its own best marketing channel. Make every screen ready for that.

---

## Journey themes (use as your design north)

Across all these journeys:

- **Trust is built in small moments, broken in single moments.** Design every interaction as if it's the one that builds or breaks trust.
- **Speed is felt, not measured.** Streaming, optimistic UI, instant feedback. Spinners are a failure of imagination.
- **Mobile is not a smaller desktop.** It's a different posture: thumb, voice, glance, decide.
- **Tom has a voice but no face.** Don't invent a mascot. The product *is* Tom's body.
- **Failure is a feature.** When something breaks, the user must end up *more* trusting, not less.
- **Empty is a chance.** New workspaces are empty for days. Empty must be *inviting*, not embarrassing.
