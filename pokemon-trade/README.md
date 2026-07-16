# PokéTrade — skeleton

A lightweight skeleton for a Pokémon trading app that shows nearby trainers on a
map and lets you propose trades. **No frameworks, no build step, no external
libraries or network calls** — just open the files in a browser.

## Files

| File | What it is |
|------|-----------|
| `index.html` | **Skeleton website** — hero, a map of nearby trainers, and a trade board. |
| `app.html`   | **Skeleton mobile app** — phone-framed UI with a bottom nav (Map / Trades / Profile). |
| `data.js`    | **Sample data** — the trainers, their locations, and what they offer/want. Shared by both. |

## Try it

Open `pokemon-trade/index.html` (or `app.html`) directly in a browser. Everything
runs client-side.

## What's fake (on purpose)

This is a skeleton, so the heavy parts are stubbed:

- **The map** is drawn with plain CSS/SVG and percentage coordinates — no map
  tiles, no location library. Swap in Leaflet/Mapbox + real `lat/lng` when ready.
- **Locations & trainers** are static sample data in `data.js`.
- **No accounts, no backend.** "Propose trade" / "Trade" buttons just show an alert.

## Where to plug in real pieces later

1. **Real location** — `navigator.geolocation.getCurrentPosition(...)` for the
   user, a map library for tiles, and real coordinates on each trainer.
2. **Real data** — replace `data.js` with a `fetch()` to your API. (This repo
   already uses Supabase for the existing site — an easy backend to reuse.)
3. **Trading & chat** — wire the buttons to create trade requests and message threads.
4. **Accounts** — sign-in so trainers have profiles and a trade history.

Not affiliated with Nintendo / The Pokémon Company. Sample only.
