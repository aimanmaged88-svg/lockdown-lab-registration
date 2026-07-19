# PokéTrade

A location-aware Pokémon trading app: see trainers near you on a map, see what
they're offering, propose trades, and chat — running live on Supabase.

## Files

| File | What it is |
|------|-----------|
| `index.html` | Marketing/landing page. |
| `app.html`   | **The app** — email-code sign-in, live map (Leaflet/OSM), trade proposals, chat, profile. Mobile-first, works from a link. |
| `brief.html` | Shareable project & security brief. |
| `data.js`    | Sample trainers used by the landing page and the app's signed-out demo mode. |

## Backend

Supabase project `lockdown-lab` (`ymuwuhvqqftgpxwhzoub`) — the same project that
runs the registration site. PokéTrade tables are namespaced with a `pt_` prefix:

- **`pt_profiles`** — trainer profile (username, emoji, offering/wanting lists,
  approximate location). A `security definer` trigger snaps any coordinates to a
  ~500 m grid and nulls them when `share_location` is off, so exact coordinates
  are never stored even if a client sends them. The client also rounds before
  sending, so exact coordinates never leave the phone.
- **`pt_trades`** — proposals with a status machine (`proposed → accepted/declined/
  cancelled → completed/cancelled`). A trigger freezes trade terms after creation
  and enforces who may make each transition (only the receiver can accept, etc.).
- **`pt_messages`** — chat per trade, only while the trade is open.

**RLS on everything** (verified by test):
- signed-out (anon key): sees zero rows in all three tables
- signed-in: can browse profiles; sees **only their own** trades and messages
- impersonating another proposer, self-accepting, or rewriting trade terms: blocked

Auth is Supabase email OTP (6-digit code, no passwords). The browser holds only
the publishable key; RLS does the protecting.

## Notes

- Map tiles: OpenStreetMap. supabase-js and Leaflet load from CDN.
- Realtime is light polling (chat 4 s, trades 15 s) — can be upgraded to
  Supabase Realtime channels later.
- Not yet built: ratings, report/block, push notifications, custom SMTP for
  higher OTP email limits.

Fan project — not affiliated with Nintendo / The Pokémon Company / Niantic.
