# UNC Thoughts HQ

Your private Instagram creator command centre — built to grow into a safely
moderated, adults-only community platform.

**The promise it's built around:** _one useful idea in under 20 seconds,
followed by one real question._ The whole app is designed to help you make
better short-form content and build a community around useful conversations —
without becoming more work than Instagram itself.

The voice is the uncle voice: direct, useful, honest, supportive, conversational
— never preachy, never trying too hard to be inspirational.

---

## What it does (Release A — working now)

- **Today** — your daily command centre: the single next best action, three
  priorities, today's content with a persistent 20-step production checklist,
  overdue work, weekly progress, and a **20-minute operating mode** (four calm
  5-minute blocks) so the app never becomes a chore.
- **Calendar** — five weeks at a glance, on the weekly short-reel rhythm.
- **Content** — every idea from spark to posted, with the full record (hook,
  script, teaching points, caption, conversation question, highlight, analytics,
  experiment, follow-ups, repurposing history, and more).
- **Recording Studio** — setup coach, nine recording types, a phone-friendly
  **guided mode** (camera/mic pick, 3-2-1 countdown, teleprompter with size +
  speed, take counter, duration timer, live audio-level meter, save/mark takes),
  a **Speaking & Hooks** coach (five hook variants, generic-opening warnings),
  **Batch Day** (30/60/90-min plans that group Reels to minimise setup changes),
  and the **Reel Preflight** checker.
- **Analytics** — record 24h / 7d / 30d snapshots, upload + confirm screenshots
  (never guessed), and see honest calculated rates with confidence and
  vs-median comparisons. No "best time to post" is ever invented.
- **Community** — a unified inbox, a question inbox, the **Community Signal
  Map**, and **Comment-to-Content** (one click turns a question into a Reply
  Reel) with a **Loop Closer** (was it answered? was the contributor credited?).
- **Talks** — plan live/recorded talks (external links, no streaming infra),
  collect + vote questions, run sheets, and **Talk-to-Clips** (turn moments into
  Reel tasks). Nutrition talks carry a general-education disclaimer.
- **Growth Lab** — useful-behaviour metrics, a transparent **Community Demand
  Score** (clearly not an Instagram metric), the **Experiment Lab** (incl.
  Instagram Trial Reels), the **Winning Pattern Library**, and the Repurpose Map.
- **Practice Library** — lessons across the whole craft, plus the **Research
  Library** of sourced, dated best practices with confidence + review dates and
  a "what changed?" prompt when guidance is due for re-checking.
- **Weekly Review** — a clean Markdown report you can paste straight into Codex
  or Claude.
- **Settings** — roadmap import, exports, backup/restore, feature flags, roles,
  privacy notes, optional-AI status.

## Release B — adult community beta (behind a flag, **off by default**)

Invite-only, **adults 18+ only**. Topic spaces, threaded posts, "useful"
reactions (not likes), reporting, a moderation queue with transparent
enforcement reasons, contributor roles + manual expert verification, invites,
consent records and an audit trail. Turn it on in **Settings → Feature flags**
only after reading `docs/COMMUNITY-SAFETY-CHECKLIST.md`.

> Younger basketball players are served through **public educational content,
> parents, guardians and coaches** — not accounts — until legal, privacy,
> online-safety and safeguarding reviews are complete.

## Release C — future growth

Architecture and roadmap are documented in `docs/ROADMAP-RELEASE-C.md`
(native apps, approved Instagram API, subscriptions, coach/club workspaces,
expert programmes, advanced video analysis, larger moderation teams, live
streaming via external links first, international communities, multiple
creators).

---

## Quick start (non-technical)

**Windows:** double-click **`start-unc-thoughts-hq.bat`**. The first run installs
everything, sets up the database, loads starter data, builds the app, then opens
it at <http://localhost:3000>. Leave the black window open while you use it;
close it to stop.

Then open **Settings → Import the roadmap** and choose your
`UNC-Thoughts-90-Day-Roadmap.xlsx` to load your real plan.

## Quick start (developer)

```bash
npm install
cp .env.example .env
npm run setup        # migrate + generate + seed
npm run dev          # http://localhost:3000
```

One-command production:

```bash
npm run build && npm run start
```

### Add your official logo

The app must show your **official logo, unmodified**. Copy it to:

```
public/brand/logo.png
```

(from `outputs/unc-thoughts-instagram/assets/final-logo/unc-thoughts-simple-border-option-06-final.png`).
Until it's there, the header shows the text wordmark "UNC THOUGHTS" — never a
redrawn logo. See `public/brand/README.md`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run start` | Start the production server |
| `npm run setup` | Migrate + generate + seed (one-command init) |
| `npm run db:migrate` | Create/apply a dev migration |
| `npm run db:seed` | Load starter data (idempotent) |
| `npm run import:roadmap -- <file.xlsx>` | Import the roadmap from the CLI |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |

---

## Importing the 90-Day Roadmap

The importer is **idempotent**: each row gets a stable key from its date + title,
so re-running updates rows in place instead of duplicating them. In
**Settings → Import the roadmap** you get a **preview** (added / changed /
conflicts, with field-level diffs) before anything is written, then confirm to
apply. Columns are matched by name — Date, Topic/Title, Pillar, Audience, Format,
Hook, Creation instructions, Caption, Conversation CTA, Highlight, Status, Notes.

---

## Exports & backups

From **Settings → Exports / Backup & restore**, or directly:

- Weekly report (Markdown) — `/api/export/weekly`
- Content calendar (CSV) — `/api/export/content`
- Analytics (CSV) — `/api/export/analytics`
- Community questions (CSV) — `/api/export/questions`
- Talks (CSV) — `/api/export/talks`
- Research library (CSV) — `/api/export/research`
- Complete backup (JSON) — `/api/backup`
- Restore — upload a backup JSON in Settings (replaces core data; confirm first)

---

## Technology

Next.js (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite (local) ·
Recharts · Zod · date-fns · SheetJS (xlsx) · Vitest · Playwright. Timezone is
**Australia/Sydney** throughout. The app is responsive, keyboard-accessible,
installable as a PWA, and fully functional **without any paid AI service**.

### Moving to PostgreSQL

The schema is written provider-agnostically (no SQLite-only types; JSON stored
as text; enums as const unions). To migrate:

1. Change `datasource db { provider = "postgresql" }` in `prisma/schema.prisma`.
2. Point `DATABASE_URL` at your Postgres server.
3. `npx prisma migrate deploy` (or `migrate dev` to create fresh migrations).

Everything above the data layer (services, repositories via Prisma, storage
abstraction, feature flags, RBAC, audit) is already multi-org ready.

### Optional AI

Off by default. Set `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` in `.env` to let the
app **suggest** replies/hooks. It will **never** send or save generated content
without your explicit approval, costs are billed by the provider, and the full
rule-based system keeps working regardless.

---

## Safety, privacy & safeguarding

Built with **Safety by Design**. The account-based community is **adults 18+
only**. There is **no private adult-to-child messaging** anywhere in the product.
Nutrition content is treated as **general education**, with a linter that flags
restrictive/shaming/medical/weight-loss language and suggests safer wording.
See `docs/PRIVACY.md`, `docs/COMMUNITY-GUIDELINES.md`,
`docs/COMMUNITY-SAFETY-CHECKLIST.md` and `docs/DEPLOYMENT-READINESS.md`.

---

## Documentation

- `docs/ARCHITECTURE.md` — how it's put together and why
- `docs/PRIVACY.md` — what we collect and what we deliberately don't
- `docs/COMMUNITY-GUIDELINES.md` — the useful-first community rules
- `docs/COMMUNITY-SAFETY-CHECKLIST.md` — read before enabling Release B
- `docs/DEPLOYMENT-READINESS.md` — the go-live checklist
- `docs/ROADMAP-RELEASE-C.md` — the growth roadmap
- `docs/TROUBLESHOOTING.md` — common issues

## Troubleshooting

See `docs/TROUBLESHOOTING.md`. Most first-run issues are solved by
`npm run setup`.
