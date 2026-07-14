# LOTG — Wednesday Night Basketball (ladder + live scores)

Single-file app (`index.html`, no build step) deployed to Netlify site
**lotg-wednesday-night-basketball** (`https://lotg-wednesday-night-basketball.netlify.app`).

> Source lives in this repo so it can never be lost again — the first version of
> this app was built on a local machine whose Supabase project
> (`gsrsveuwhcvgzlcfckzj`) was later deleted, which killed the deployed site.

## Backend

Supabase project **lockdown-lab** (`ymuwuhvqqftgpxwhzoub`), tables prefixed `lotg_`:

- `lotg_teams` — id, name, logo (data-URL PNG, resized to 96px client-side),
  `court_group` (1 or 2), sort_order.
- `lotg_games` — court, slot_index, game_time (text, e.g. `7:10 PM`), team1_id,
  team2_id, score1, score2, status (`upcoming` / `live` / `final`), forfeit_team_id.
- `lotg_admin` — single row holding the shared admin password. **No RLS policies**,
  so it is invisible to the public API; only `SECURITY DEFINER` functions touch it.

### Auth model (shared admin password for Aiman & SJ)

- `lotg_verify_admin(p_token)` — login check, returns boolean.
- `lotg_is_admin()` — reads the `x-lotg-admin` request header and compares it to the
  stored password. All INSERT/UPDATE/DELETE policies on `lotg_teams` / `lotg_games`
  require it. Public gets SELECT only.
- `lotg_change_password(p_old, p_new)` — change the shared password from the admin UI.

The client sends the password as the `x-lotg-admin` header on every write after login
(kept in `sessionStorage`).

## Features

- Public: ladder (P/W/L/PF/PA/+/-), schedule for both courts with live/final status,
  auto-refresh every 30s.
- Admin: edit team names, upload/remove logos, assign court groups, start/final/reopen
  games, score entry, forfeits (FF = 20–0), edit game times, generate round-robin
  fixtures (4 teams per court × 6 slots: 7:10, 7:23, 7:36, 7:49, 8:02, 8:15 PM —
  times from the "LOTG Wednesday Night Run" Google Sheet), clear scores, change password.

## Deploying

Publish the `lotg-wednesday-night/` directory to the Netlify site
(site id `71a72434-5369-4d03-843e-2a7f405bfb84`). No build command.
