# Architecture

A single-file mental model: **screens → server actions/API → services (`src/lib`)
→ Prisma → SQLite**, with clean seams so it grows to multi-org Postgres without a
rewrite.

## Layers

- **UI** (`src/app/**`, `src/components/**`) — Next.js App Router. Server
  Components fetch data; small Client Components handle interaction. Visual
  identity is black / off-white / restrained grey, bold condensed headings,
  minimal motion (all animation is under `prefers-reduced-motion`).
- **Mutations** — React **Server Actions** in `src/lib/actions.ts` (creator OS)
  and `src/lib/community-actions.ts` (Release B, flag-guarded). File uploads,
  exports, imports, backup/restore and media serving use **route handlers**
  under `src/app/api/**`.
- **Services / domain** (`src/lib`):
  - `enums.ts` — the shared vocabulary (pillars, statuses, the 20 checklist
    steps, weekly rhythm, hook patterns…). Const unions, not DB enums, so they
    migrate cleanly to Postgres and drive DB + Zod + UI from one place.
  - `analytics.ts` — safe rate maths (null on missing denominators, never NaN),
    median + confidence + vs-median. Pure, unit-tested.
  - `recommend.ts` — the transparent rule-based engine. Pure functions; never
    moves/publishes/deletes; every recommendation has a plain-language reason.
  - `nutrition-safety.ts` — the nutrition/safety language linter + restricted
    words. Pure, unit-tested.
  - `importer.ts` — idempotent roadmap import (fuzzy column mapping, stable keys,
    preview/diff). Pure, unit-tested.
  - `exports.ts` — Markdown / CSV / JSON exports + full backup.
  - `coach-content.ts` — recording/speaking/preflight/batch reference data.
  - `time.ts` — everything shown in **Australia/Sydney**, stored as UTC.
  - Cross-cutting: `db.ts` (Prisma client + org resolver), `env.ts` (Zod-validated
    environment), `flags.ts` (feature flags: env default + DB override),
    `rbac.ts` (capability matrix), `audit.ts` (audit events), `storage.ts`
    (`StorageProvider` abstraction — local disk today, swappable for cloud),
    `logger.ts` (structured logging).
- **Data** (`prisma/schema.prisma`) — ~30 models covering content, tasks,
  analytics, research, practice, community questions/inbox, talks, challenges,
  collaborators, experiments, patterns, weekly reviews, batch sessions,
  preflight, Release-B spaces/posts/reports/roles/invites/consent, and
  cross-cutting audit/flags/import-runs.

## Design decisions

- **Multi-tenant seam from day one.** Every row hangs off an `Organisation`; all
  queries funnel through `getOrgId()`. One org today; clubs/orgs later without
  reshaping the schema.
- **Provider-agnostic data.** No SQLite-only column types; JSON is stored as text
  and parsed in the service layer; enums are const unions. Flip the datasource to
  `postgresql` and migrate.
- **Feature flags** gate Release B. Env sets the default; a DB row can override
  per-org at runtime (Settings).
- **RBAC** is a small explicit capability map (`can(role, capability)`), not
  scattered role-string checks — auditable and easy to extend.
- **Audit everything consequential.** Moderation, imports, restores, role
  changes and content mutations all write `AuditEvent`s; audit never breaks the
  primary action.
- **Honesty over vanity.** Rates return `null` (shown as "—") when they can't be
  computed; nothing is called a "winner" below the minimum sample; the Community
  Demand Score shows its formula and is explicitly not an Instagram metric; no
  universal "best time to post" is ever fabricated.
- **Safety by Design.** 18+ community, no adult-to-child DMs, nutrition linter,
  consent records, reporting/moderation with transparent enforcement reasons.

## Background jobs

There is a lightweight seam for background work (analytics reminders, review
generation) — today these are computed on read. When volume warrants it, move
them behind a job runner without changing callers.

## Testing

- **Unit** (Vitest) — the pure domain logic: analytics maths, the recommendation
  engine, the nutrition linter, and importer idempotency/diff.
- **E2E** (Playwright) — the highest-value flows against a dedicated `e2e.db`:
  Today + checklist persistence, content creation, preflight, question →
  Reply Reel, talks, weekly review.
