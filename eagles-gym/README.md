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

## Data
All state lives in `localStorage` on the device (`eg_*` keys). **Future-ready
for Supabase** — swap the `store` helper for Supabase auth + tables to sync
staff accounts across devices.

## Files
- `index.html` — the entire app
- `manifest.json` — PWA manifest
- `sw.js` — offline service worker
