# Ask Unk & private accountability

The member-facing layer of UNC Thoughts HQ: a deliberately small home screen,
an "Ask Unk" answer engine grounded in an owner-controlled knowledge base
(**Unk's Brain**), and private-first accountability.

## Core principle

UNC Thoughts questions are not engagement bait. A member never has to publish
an answer, leave a comment or reveal something personal. Every accountability
prompt carries, verbatim:

> You do not have to share your answer. But answer it honestly for yourself.

Private reflection is the default. Public sharing is a separate, optional,
clearly-explained action — and even then it goes through owner moderation
before anyone sees it.

## The member experience (`/member`)

One small home screen, no feed: **Ask Unk** (one question field), **Game
today**, **Training today**, **What should I eat?**, **Mindset reset**,
**Recovery**, **Thought of the Day**, **My answers**.

Member identity is an anonymous device cookie — no account, no password.
Minimal context only, all optional: **age band** (never a birth date), event
times, activity type, time remaining, allergies/restrictions, last meal,
what's available. Never collected: weight, body measurements, medical history,
exact location, school information.

## How Ask Unk answers (honest RAG, no invention)

1. **Safety gate first** (`src/lib/unk/safety.ts`). Escalation topics
   (allergic reaction, diabetes/blood glucose, eating disorders/restrictive
   eating, fainting/chest pain/breathing, severe dehydration, injury
   diagnosis/return-to-play, medication interactions, individual supplement
   dosing) are never answered — the member is directed to a parent/guardian,
   000 for emergencies, a doctor, or an Accredited Sports Dietitian.
   Supplement and "quick burst of speed" asks get the approved no-shortcut
   redirect: no food or product guarantees instant speed; preparation,
   familiar fuelling, fluids, warm-up and one mindset cue. No supplements for
   juniors (AIS position), ever, and no individual protocols for anyone.
2. **Time awareness without false precision** (`timeband.ts`). "7:30 PM"
   becomes a band — 3h+, 2–3h, 1–2h, 30–60m, <30m, after — in
   Australia/Sydney time. Ambiguous times state their assumption.
3. **Retrieval** (`knowledge.ts`). Transparent keyword scoring over
   **approved** Unk's Brain items only. No embeddings, no external AI — the
   owner can always see exactly why an item was used.
4. **Composition** (`answer.ts`). The five-part structure: **Do this now /
   Food and fluids / Mindset cue / Be careful with / Answer this privately**,
   readable in ~20 seconds, with a **Why?** expansion citing the teaching and
   sources used. If the Brain can't support an answer, Unk says so — it never
   invents advice, and the miss is logged for the owner as weak coverage.

This is retrieval + composition, not a generative LLM: every content sentence
comes from an approved knowledge item or the fixed safety copy. An LLM can be
layered later behind the existing `AI_PROVIDER` env without changing the
grounding rule.

## Unk's Brain (`/brain`)

Owner-controlled knowledge base. Item kinds: lessons, captions, transcripts,
teaching notes, mindset principles, approved nutrition guidance, FAQs, source
links, and structured **playbooks** (labelled DO NOW / FOOD / MINDSET /
CAREFUL / PRIVATE / WHY sections). Every item records title, pillar,
audience/age band, source + URL, author, date added, date reviewed, approval
status, safety classification and **version history** (snapshots on every
edit). Only `approved` items are ever used in member answers. The Insights tab
shows frequently asked questions, weak coverage, unclear-marked answers,
escalations, popular quick actions, and each recent answer's informing items —
aggregate member trends unlock only at 5+ members.

### Source hierarchy (nutrition/health)

1. Owner-approved UNC Thoughts teaching.
2. AIS nutrition resources (verified: https://www.ais.gov.au/nutrition, /supplements).
3. Australian Dietary Guidelines / Eat for Health (seeded; link flagged
   "review source" — could not be re-verified from the build environment).
4. Content reviewed by an Accredited Sports Dietitian / health professional.

## Private accountability

Thought of the Day rotates daily from an owner-editable prompt bank. Members
can: think it through **saving nothing**, type a private answer, record a
private voice note, pick one action, and set an optional reminder (surfaces on
next open — no notifications, no streaks, no rankings, no shame). Follow-up
uses the exact line *"You said you would do this. Did you follow through?"*
with **Yes / Partly / Not yet / I changed my plan**.

**Privacy mechanics:** text answers are AES-256-GCM encrypted at rest; voice
notes are encrypted before upload and decrypted only for their owner (cookie
check) via `/api/voice/[id]`; the database's public API role has **no read
access** to reflections; reflections never appear on any profile and are never
used for AI training. Members can delete any reflection permanently.

**Sharing** is a separate button — "Share something with the community" —
never preselected, with an explicit explanation, an editable preview of the
exact public text, a confirm step, and **owner moderation** before it's posted
(anonymously, as "Community member") to Wins & Lessons. Sharing is disabled
entirely while the community beta is off.

## Acceptance tests → coverage

| # | Test | Where |
|---|------|-------|
| 1 | Ask about a 7:30 PM game | e2e `member.spec.ts` "7:30 PM game" |
| 2 | Uses current local time correctly | unit `unk.test.ts` timeband + the same e2e (band label asserted) |
| 3 | Retrieves approved Unk's Brain material | e2e Why? shows "From Unk's approved teaching"; unit compose/rank |
| 4 | Unsupported claims not invented | unit "never invents"; live smoke ("capital of France" → honest miss) |
| 5 | Private answer stays private | e2e save → only in My answers; encrypted at rest (unit crypto); DB anon-read denied |
| 6 | Sharing requires separate confirmation | e2e (share off while community closed; no auto-publish control); ShareDialog preview+confirm+moderation |
| 7 | Supplement question → safety response | unit safety + e2e "quick burst of speed" |
| 8 | Medical-risk question → escalation | unit safety (7 categories) + e2e chest pain → 000 |
| 9 | Guardian message for youth-sensitive guidance | unit compose guardian-note test; unknown age defaults to youth |
| 10 | Normal answer quick, clear, usable | 5-section ~20s card, Why? optional; e2e asserts all sections |
