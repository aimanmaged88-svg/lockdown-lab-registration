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

## V2 experience layer (design system)

- **Two themes, instant toggle.** A shared token system drives dark (default:
  bg `#090909`, cards `#121212`, accent `#FF7A00`, secondary `#9B9B9B`) and a
  full Apple-Settings light theme. Toggle in every page header; choice persists
  in `localStorage['aos_theme']` with a no-flash `<head>` script. Everything
  uses `var()` tokens, so the flip is instant and complete.
- **Motion tokens** (`--dur*`, `--ease*`, 150–260ms) power fades, hover-lift,
  drawer slide, count-ups, skeletons — all disabled under
  `prefers-reduced-motion`. Focus-visible rings + 44px touch targets throughout.
- **Coach dashboard V2** (`coach.html`): KPI rail (real metrics + honest dashed
  "set-up" tiles for anything needing new data — never a fake `0`), colour-coded
  **Team Health** card (Attendance / Morale / Injuries / Consistency + composite,
  all computed client-side from check-ins & ratings), **Quick Actions** (Send
  Announcement is live via looped `cmsg`; Add Athlete shares the join link; the
  rest open a "coming soon" sheet naming the data they need), **card-based
  athletes** (replacing the table), and a **slide-in athlete drawer** with tabs
  (Overview / Health / Performance* / Attendance* / Comms / Notes / Timeline /
  Settings; `*` = interim proxy + coming-soon). The **Timeline** is built purely
  from existing `cdetail` data (join, check-ins, messages, rating, notes, shared
  mind). Mobile: cards reflow to one column, drawer becomes a bottom sheet, and a
  fixed bottom action bar appears.
- **Scope of this layer:** presentational + client-computed only — no `aos-api`
  changes. Metrics needing new data (true attendance %, fixtures, wellness
  rollup, read receipts) are honest set-up placeholders, sequenced in the
  roadmap below.

## Roadmap (staged, non-breaking)

1. **Roster-lite** edge patch (`checkins_7d`, `last_energy/soreness/sleep_h`,
   `awaiting_reply`) — promotes 4 placeholders (wellness, training completion,
   awaiting-reply, Team-Health Readiness) to real. No new tables.
2. Server `broadcast` action (one call instead of the client `cmsg` loop).
3. ~~Calendar / fixtures~~ **✅ shipped (V2.2)** — see below. Still to add:
   attendance (`aos_attendance`) + Record Attendance.
4. Rich comms (message `read_at` → true unread, attachments, typing).
5. File library (storage + `aos_documents`). 6. Training planner (`aos_drills`).
7. Performance metrics (`aos_perf`: PBs, tests, wearables).
8. **Organisation hierarchy** — Org → Association → Club → Season → Age Group →
   Team → Coach → Athlete. Designed as an additive, nullable-FK migration with a
   backfilled default org/club/season so current flat teams keep working; scoped
   coach accounts (`aos_coaches`) layer in before any hierarchy UI. Ships last
   unless a multi-club customer pulls it forward.
9. Notifications + global search.

## V2.1 — test-ready

- **First-run tutorial** in the athlete app: a 6-step welcome walkthrough on
  first open (localStorage `aos_tutorial_done`), replayable via the header `?`.
- **Custom sport flow**: onboarding has a **＋ My sport** tile. Typing a sport
  recognises it against a built-in dictionary (packs + synonyms + ~90 real
  sports incl. padel, pickleball, etc.). Recognised → accepted instantly with a
  "Found it ✓" confirm; unknown → accepted on a general plan **and queued to the
  coach for approval** (`aos_sport_requests`, `sport_label` column). The coach
  dashboard shows a **Sport requests** panel to approve/reject (`sport_resolve`).
  *Note: recognition is a built-in list, not a live web search — wiring an
  edge-function LLM/web lookup is a small future add.*
- **Seed data** (in the live DB): team **Lockdown Ballers** with 10 basketball
  athletes (PIN `1234`) — varied streaks, XP, ratings, an injury, check-in
  history, peer ratings and messages — plus **Aiman** (PIN `0088`,
  aimanmaged88@gmail.com) on the team. Coach code `OS-COACH`.

## V2.2 — Calendar / Schedule (shipped)

- **`aos_events` table** (live): `id, title, type, starts_at, location, note,
  team_id, created_at`. `type` ∈ `training | game | meeting | other`. A null
  `team_id` = an all-athletes event; a set `team_id` scopes it to that team.
- **Coach dashboard**: a **Schedule** section shows the upcoming agenda (icon,
  date chip, title, type badge, time · location · team · note) with per-event
  delete. **＋ New event** and the **Schedule Training** quick action open a
  create sheet (title, type, date-time, location, team, note). The **Upcoming
  games** KPI is now real (counts future `game` events + shows the next date).
  Coach actions: `event_create`, `event_delete`; `roster` now returns `events`.
- **Athlete app**: a **📅 Next up** card on Home lists the next 4 events for the
  athlete (their team's events + all-athletes events), with friendly relative
  days (Today / Tomorrow / weekday). `state` now returns `events`.
- Seeded: 4 events on **Lockdown Ballers** (team training, skills session, game
  vs Northside Hawks, parent + coach meeting).

## V2.3 — Installable app, themes, notifications (shipped)

- **Installable PWA**: `manifest.webmanifest` + `sw.js` service worker + real PNG
  icons (192/512/maskable/apple-touch). The whole `/athlete-os/` scope installs
  to the home screen and runs full-screen (`display: standalone`). Offline shell
  cached; API calls always hit the network.
- **In-app install guide**: header ⚙ → **Install**. On Android it fires the
  native `beforeinstallprompt` (one-tap install); on iOS it shows the Safari
  *Share → Add to Home Screen* steps. A segmented iPhone/Android guide covers
  both, plus a one-time "Install Athlete OS" nudge banner after login and a
  tutorial step.
- **Notifications**: ⚙ → **Turn on** requests permission, confirms with a
  welcome notification, and schedules a best-effort daily check-in nudge (6pm
  local, once/day, while the app is open). The service worker already implements
  `push` + `notificationclick`, so true background push is a drop-in server add
  (VAPID) later. If the user previously blocked, the sheet shows how to re-enable.
- **5 themes** with a swatch picker (⚙ → Theme): **Dark** (default), **Light**,
  **Midnight** (navy/blue), **Forest** (emerald), **Grape** (violet). Stored in
  `localStorage.aos_theme`; a no-flash head script applies it before paint;
  `theme-color` meta updates per theme. Accent-driven UI (orbs, avatar, AI card,
  "hot" cards) now flows through tokens so every theme is cohesive.

## V2.4 — True background push (shipped)

Real web push that fires even when the app is closed — VAPID + service worker.

- **Tables**: `aos_push_subs` (browser subscriptions per athlete) and
  `aos_config` (VAPID keypair, subject, cron secret — stored in-DB so no edge
  secret-setting is needed; only the service-role edge fn can read them).
- **Edge fn actions**: `push_key` (returns the public VAPID key), athlete-auth
  `push_subscribe` / `push_unsubscribe`, and `push_cron` (secret-header
  protected daily sweep). `web-push@3.6.7` signs/encrypts; dead subscriptions
  (404/410) self-prune.
- **Triggers**: an athlete gets a real push when the coach **messages** them,
  **rates** them, or **schedules an event** for their team/all — plus a **daily
  check-in reminder** for anyone who hasn't logged in yet that day.
- **Scheduling**: `pg_cron` job `aos-daily-checkin-push` calls `push_cron` via
  `pg_net` at 08:00 UTC (6pm Sydney).
- **Client**: on notifications-enable (and on every load if already on) the app
  subscribes via `PushManager` with the VAPID key and registers the endpoint.
  The service worker's `push` + `notificationclick` handlers show the alert and
  deep-link into the right tab.
- Verified end-to-end from Postgres via `pg_net`: `push_key` and `push_cron`
  both return 200; `web-push` imports cleanly in the edge runtime.
- **Coach visibility**: `roster` and `cdetail` return `push_on`/`push_count`, so
  the coach dashboard shows a **🔔 Push / 🔕 No push** chip on every athlete card,
  a **Push reach** KPI (count + % of squad reachable), and a push-status line in
  the athlete drawer — the coach can see at a glance who will actually get alerts.

## V2.5 — Organisation hierarchy, admin, athlete photos (staged)

- **Hierarchy** (additive, nullable FKs): `aos_orgs → aos_clubs → aos_seasons →
  aos_age_groups`, and `aos_teams.age_group_id` links teams in. Existing flat
  teams keep working (they show as "Unassigned"). `aos_athletes.avatar_url` added;
  public `aos-avatars` storage bucket created.
- **Admin page** `athlete-os/admin.html` (coach-code gated, desktop-first): a
  nested tree with create / rename / delete at every level, per-team member
  counts, an "Unassigned teams" section with an age-group dropdown to slot teams
  in, and **bulk import** — paste `Org, Club, Season, Age Group, Team` CSV rows
  (header optional; existing names reused, safe to re-run). Linked from the coach
  dashboard header (🏛 Org). *Live import from other orgs' systems isn't possible;
  export their structure to CSV and paste it.*
- **Edge fn actions** (coach-auth): `org_tree`, `org_node` (create/rename/delete/
  assign), `org_import`; `team_create` accepts `age_group_id`.
- **Athlete photos**: optional avatar. In the app's ⚙ Settings → Profile photo,
  the image is cropped square + resized to 256px client-side (canvas) and sent as
  base64 to `avatar_set`, which stores it in the bucket via service role. Shown on
  the app Home hero, and on coach roster cards. `avatar_clear` removes it.
- **Tutorial**: added a truthfulness/accountability beat — "log the truth; inflate
  your numbers and the gap shows up on the court, and your coach sees your
  performance too."
- **Deploy note**: DB migration + bucket are applied; the **edge function (v9)
  carrying these actions is staged in source and deploys on request**.

## Projects dashboard (`/hub`) — *personal, not part of Athlete OS*

`lockdown-lab-registration.netlify.app/hub` — **"Projects Aiman's Working On"**,
a private control panel for the owner spanning all current projects (Athlete OS,
Lockdown Lab, the 2026 one-pager). Each has big tap-to-open links, tap-to-copy
codes, a "who needs what / who doesn't" split, and a "what to say" script — plus
an owner-only section (Netlify, Supabase, full access hub) marked never-share.
It is a separate dashboard, deliberately not branded as or bundled into Athlete OS.

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
