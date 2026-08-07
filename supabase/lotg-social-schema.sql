-- LOTG — Wednesday Night Basketball · CREW social layer (backend reference)
-- Live in Supabase project ymuwuhvqqftgpxwhzoub (same project as the Lab).
-- This file DOCUMENTS what is already deployed — it is not run by CI.
--
-- Frontend: lotg-crew.html (Top Plays + one group chat for the whole crew).
-- Backend:  edge function `lotg-social` (supabase/functions/lotg-social/index.ts),
--           verify_jwt ON — the browser sends the public anon key as Bearer +
--           apikey, exactly like app-api / opencourt-api. All table access is
--           server-side (service role); RLS is ON with NO policies so the anon
--           key can never touch these tables directly.
--
-- This is SEPARATE from the tournament scoreboard. The live scoreboard app
-- (lotg-wednesday-night-basketball.netlify.app) runs on its own Netlify DB; the
-- lotg_teams / lotg_games / lotg_admin tables here are the older Supabase mirror.
-- The crew feed below shares neither — it only needs its own four tables.
--
-- Identity: no passwords. A device registers once with a name + (encouraged)
-- Instagram handle. The handle is how the crew connects — we only ever LINK to
-- instagram.com/<handle>, never log in or post. Every write goes through guard():
-- the device must be registered and not banned, and the server always uses the
-- REGISTERED name/handle (client-sent ones are ignored) so nobody can post as
-- someone else. To remove a troll: set lotg_crew.banned = true (no admin UI yet).

create table if not exists public.lotg_crew (
  id          text primary key,                 -- device uuid: [a-zA-Z0-9._-]{8,64}
  name        text not null,
  ig          text not null default '',         -- instagram handle, no @
  banned      boolean not null default false,
  created_at  timestamptz not null default now(),
  seen_at     timestamptz not null default now()
);

create table if not exists public.lotg_plays (
  id          uuid primary key default gen_random_uuid(),
  device_id   text not null,                    -- submitter (lotg_crew.id)
  name        text not null,                    -- registered name at submit time
  ig          text not null default '',
  caption     text not null,                    -- one line: what happened (<=140)
  url         text not null,                    -- clip link (IG/YouTube/TikTok) — STORED, never fetched
  platform    text not null default 'Clip',     -- derived label for the chip
  week        text not null,                    -- Sydney ISO week, e.g. 2026-W32 (the POTW window)
  hidden      boolean not null default false,   -- coach can soft-hide a play (SQL for now)
  created_at  timestamptz not null default now()
);
create index if not exists lotg_plays_recent_idx on public.lotg_plays(created_at desc) where hidden = false;

create table if not exists public.lotg_play_votes (
  play_id     uuid not null references public.lotg_plays(id) on delete cascade,
  device_id   text not null,                    -- one vote per device per play
  created_at  timestamptz not null default now(),
  primary key (play_id, device_id)
);

create table if not exists public.lotg_chat (
  id          uuid primary key default gen_random_uuid(),
  device_id   text not null,
  name        text not null,
  ig          text not null default '',
  body        text not null,                    -- <=300
  created_at  timestamptz not null default now()
);
create index if not exists lotg_chat_created_idx on public.lotg_chat(created_at);

alter table public.lotg_crew       enable row level security;
alter table public.lotg_plays      enable row level security;
alter table public.lotg_play_votes enable row level security;
alter table public.lotg_chat       enable row level security;
-- No policies on purpose: all reads/writes flow through the lotg-social edge fn.

-- Edge actions (POST { action, ... } to /functions/v1/lotg-social):
--   register    {device,name,ig}            -> upsert crew, returns me
--   board       {device}                    -> { me, plays[], chat[], week }  (poll this)
--   play_submit {device,url,caption}        -> guarded; validates url, detects platform,
--                                              inserts + auto-adds your own vote; <=12/day
--   play_vote   {device,play}               -> guarded; toggle one vote per device per play
--   chat_get    {device}                    -> { chat[] }  (mine computed from device)
--   chat_send   {device,body}               -> guarded; insert; <=20 / 5 min
-- plays[]/chat[] carry a server-computed `mine` (and plays `own`) so the client
-- never sees anyone else's device id. Play of the Week = top-voted play of the
-- current Sydney week; the leaderboard shows this week's plays, ranked by votes.
