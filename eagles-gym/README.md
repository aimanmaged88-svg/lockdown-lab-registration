# 🦅 Eagles Gym Staff Hub

A modern, mobile-first PWA that replaces paper checklists and makes every staff
member accountable. Built with plain **HTML + Tailwind (CDN) + vanilla JS** — no
build step, no backend required. Fully static and Netlify-ready.

Live path once deployed: **`/eagles-gym/`**

## Features
- **Home dashboard** — live time/date, staff on shift, open vs completed tasks,
  emergency contacts, shift progress bar and quick buttons to every section.
- **Daily checklist** — Morning / Afternoon / Closing. Every completed task is
  stamped with *who / time / date*.
- **Cleaning** — rolling rounds (hourly / 2-hourly / 4-hourly) plus an
  **automatic reminders** toggle using the Notifications API + vibration.
- **Equipment checks** — checklist + "Report Broken Equipment" (equipment,
  issue, photo upload, priority, submitted-by).
- **Reception SOP** — greeting, phone script, new-member flow.
- **Memberships / GymMaster Guide** — numbered step-by-step cards (screenshots
  can be dropped in later).
- **Issue reporting** — category, priority, resolve/reopen.
- **Shift handover** — structured form + a running log of past handovers.
- **SOP Library** — accordion knowledge base (rules, emergency, opening/closing,
  cleaning standards, pricing, FAQs).
- **Accountability** — completions store staff name + time + date; per-shift
  progress bars and completion %.

## Design
Clean black / orange / white gym theme, dark mode, rounded cards, large touch
targets, smooth animations. Installable to the home screen (PWA) and works
offline via `sw.js`.

## Data & live sync
Local state lives in `localStorage` (`eg_*` keys) and is the offline cache.
**Live sync is on** via Supabase: one shared `public.eg_kv(k, v jsonb, ts)`
key/value table in the `lockdown-lab` project (`ymuwuhvqqftgpxwhzoub`), realtime
enabled. Every device hydrates from the table on load, pushes writes (debounced),
and subscribes to changes — so calls, the calendar, Team Log, issues, checklists
and settings sync across all staff phones in real time. Id-bearing collections
(calls/teamlog/issues/reports/ideas) merge by id and name lists (onshift/roster)
union, to avoid clobbering concurrent adds.

**v1 access model:** shared — anyone with the app (public anon key) reads/writes
the one gym dataset (RLS policies are open). Next step: Supabase Auth so only
logged-in staff can access (the call log holds customer PII). Closed-app push
notifications for follow-ups are also a backend follow-up.

## Files
- `index.html` — the entire app
- `manifest.json` — PWA manifest
- `sw.js` — offline service worker
