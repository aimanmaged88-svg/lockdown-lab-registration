# Athlete OS — Powered by the Lockdown Lab Engine

A standalone sister product of **Lockdown Lab Live**: a private, individual,
multi-sport performance hub. Same engine, same design language, broader
audience. Lives in `athlete-os/` and deploys with the rest of the static site
(no build step).

## Pages

| Page | Purpose |
|---|---|
| `athlete-os/index.html` | Marketing landing page (mirrors the Lockdown Lab landing patterns) |
| `athlete-os/app.html` | The athlete app — onboarding wizard + private hub (mirrors `app.html`) |
| `athlete-os/coach.html` | Coach dashboard — roster, filters, athlete files, private notes, CSV (mirrors `admin.html`) |
| `athlete-os/fonts.css` | Shared self-hosted fonts (Bebas Neue + Manrope), extracted from the engine |

## What's reused from the Lockdown Lab engine

- **Design system**: identical `:root` tokens (near-black glass, `#ff6b00`
  accent, Bebas/Manrope/mono type roles), `.card`/`.pill`/`.chip`/`.stat`/
  `.xpbar`/`.ai` components, phone-shell app with the bottom pill nav,
  ambient orbs, `rise`/`pulse`/`scan` animations, reduced-motion guard.
- **Architecture**: single-file HTML apps, no framework, one action-based
  edge function per product, PIN auth (name + 4-digit PIN, hashed
  server-side), coach code for the coach side, localStorage session
  (`aos_sess_v1`), 30s soft-refresh polling.
- **Gamification**: XP (+40 check-in, +30 mind, +15 diary, +15/+20 fuel),
  streaks, levels (Prospect → Franchise), conic XP ring.

## What's different (by design)

- **Private, not community**: no feed, no posts, no likes, no runs. Athletes
  can never see each other; only the coach sees the roster.
- **Multi-sport**: one shared engine, content swaps per sport. The `SPORTS`
  config in `app.html` holds positions, check-in focus tags, drill banks and
  terminology per sport (basketball, soccer, MMA, oztag, netball, rugby, AFL,
  tennis, swimming, running, volleyball, general). Adding a sport = adding
  one config entry, no new screens.
- **Onboarding captures the athlete profile**: sport, age, competition
  level, position, goals (tags + note), injuries, training frequency,
  competition schedule, equipment, optional contact.
- **Check-in is athlete-generic**: energy, sleep hours, soreness, minutes
  trained, sport-specific focus tags, note. Feeds readiness + AI insights.

## Two-way accountability (messaging + ratings)

- **Direct messages** between each athlete and the coach — private 1:1 thread
  (`aos_messages`). Athlete sends via the **Coach** tab (`msg` action); coach
  replies from inside the athlete file (`cmsg`). No athlete sees another's thread.
- **Coach rating** of each athlete, 1–10 with an optional note (`rate` action,
  stored on `aos_athletes.coach_rating`). Shown to the athlete on the Coach tab
  and surfaced in their AI insights; shown to the coach in the roster + file.
- **Logo**: Athlete OS has its own mark — a performance ring with an ascending
  "A" (`athlete-os/favicon.svg`, and the inline `#ll` symbol in `app.html`/
  `index.html`). It no longer reuses the Lockdown Lab flask logo.
- **Team-based peer ratings**: the coach creates teams (`aos_teams`) and assigns
  athletes (`team_assign`). Only athletes on the **same team** can see and rate
  each other (`peer_rate`), shown to everyone as an **anonymous aggregate**
  (`aos_peer_ratings` → avg + count). Athletes with no team stay fully private —
  the core "athletes never see each other" rule holds outside a team. Athletes
  rate teammates from the **Squad** section of the Coach tab; the coach sees each
  athlete's peer average in their file and assigns teams there.

## Backend (Supabase project `lockdown-lab`, ref `ymuwuhvqqftgpxwhzoub`)

- **Edge function `aos-api`** (source: `supabase/functions/aos-api/index.ts`)
  — the only way in or out of the database, mirroring `app-api`:
  - Athlete actions: `register`, `login`, `state`, `checkin`, `mind`,
    `diary`, `fuel`, `goals_set`, `profile_set` (auth = `aid` + `pin`).
  - Coach actions: `roster`, `cdetail`, `note_add`, `status_set`
    (auth = coach code).
  - `buildAI()` generates the AI Performance Coach insights server-side from
    the athlete's own check-ins/journal, phrased in the athlete's sport
    terminology. It educates and motivates; it never diagnoses.
- **Tables** (all RLS-enabled with **no** anon policies — service-role only,
  same model as the `ll_*` tables):
  - `aos_athletes` — profile + onboarding fields + xp/streak/status
  - `aos_checkins` — daily log (unique per athlete per day)
  - `aos_journal` — `mind` / `diary` / `fuel` entries (`share_coach` flag)
  - `aos_notes` — coach-only private notes (never returned to athletes)
- **Secrets**: set `AOS_COACH_CODE` in Supabase → Edge Functions secrets to
  change the coach code (falls back to a built-in default if unset, like
  `COACH_CODE` does for the Lab).

## Scalability hooks (not built, architecture ready)

- New sports → one entry in the `SPORTS`/`MOBILITY` configs.
- New AI modules → extend `buildAI()` in `aos-api`.
- Wearables / video analysis → locked "PRO · Coming Soon" cards already sit
  on the Train tab; data lands in `aos_checkins`/`aos_journal` shapes.
- Group messaging → add an `aos_messages` table + actions, UI patterns exist
  in the Lab (`thread`/`composer`).
- Payments/memberships → same place Lockdown Lab will add them.
