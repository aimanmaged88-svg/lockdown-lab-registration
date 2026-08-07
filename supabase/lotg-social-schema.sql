-- LOTG — Wednesday Night Basketball · CREW social layer (backend reference)
-- Live in Supabase project ymuwuhvqqftgpxwhzoub (same project as the Lab).
-- This file DOCUMENTS what is already deployed — it is not run by CI.
--
-- Frontend: lotg-crew.html  (live at https://lotg-crew.netlify.app)
-- Backend:  edge function `lotg-social` (supabase/functions/lotg-social/index.ts),
--           verify_jwt ON — browser sends the public anon key as Bearer + apikey.
--           All table access is server-side (service role); RLS ON, NO policies.
--
-- SEPARATE from the tournament scoreboard (that runs on its own Netlify DB).
-- The lotg_teams / lotg_games / lotg_admin tables are the older Supabase mirror;
-- the crew feed only needs the four tables below.
--
-- Two sides, two rules (Aiman, 2026-08-07):
--   PLAYS — anyone can UPLOAD a short clip (a video file, no login). It lands in
--           the coach's approval queue (approved=false) and only shows once he
--           approves it. Voting is open too (one per device).
--   CHAT  — to post you sign in with a social handle: Instagram, Facebook or TikTok
--           (NO email). The handle only ever LINKS to the profile — never posts.
-- Coach approval/moderation is authed as any ACTIVE ll_coaches account (same
-- sha256 scheme as coach_login; Aiman logs in with his email + PIN).
-- Ban a member: set lotg_crew.banned = true.
--
-- Clip videos live in the public Storage bucket `lotg-clips` (50MB file limit,
-- video/mp4|quicktime|webm). Upload is two-step so bytes never pass through the
-- function: play_upload_init returns a short-lived SIGNED URL the browser PUTs
-- the file straight to; play_submit then records the (pending) play. Rejecting a
-- clip deletes its Storage object.

create table if not exists public.lotg_crew (
  id          text primary key,                 -- device uuid: [a-zA-Z0-9._-]{8,64}
  name        text not null,
  ig          text not null default '',         -- legacy; handle stored below now
  provider    text not null default '',         -- instagram | facebook | tiktok
  handle      text not null default '',          -- social handle, no @ (community sign-in)
  banned      boolean not null default false,
  created_at  timestamptz not null default now(),
  seen_at     timestamptz not null default now()
);

create table if not exists public.lotg_plays (
  id          uuid primary key default gen_random_uuid(),
  device_id   text not null,                    -- submitter's device (no login needed)
  name        text not null,                    -- optional attribution, else 'Anonymous'
  ig          text not null default '',
  caption     text not null,                    -- one line: what happened (<=140)
  url         text not null,                    -- public URL of the uploaded video (lotg-clips bucket)
  video       boolean not null default false,   -- true for uploaded video clips
  clip_path   text not null default '',         -- storage object path (deleted on reject)
  platform    text not null default 'Video',
  week        text not null,                    -- Sydney ISO week, e.g. 2026-W32
  approved    boolean not null default false,   -- coach must approve before it's visible
  hidden      boolean not null default false,   -- coach take-down of an approved clip
  created_at  timestamptz not null default now()
);
create index if not exists lotg_plays_pending_idx on public.lotg_plays(created_at) where approved = false and hidden = false;
create index if not exists lotg_plays_live_idx on public.lotg_plays(created_at desc) where approved = true and hidden = false;

create table if not exists public.lotg_play_votes (
  play_id     uuid not null references public.lotg_plays(id) on delete cascade,
  device_id   text not null,                    -- one vote per device per play (open)
  created_at  timestamptz not null default now(),
  primary key (play_id, device_id)
);

create table if not exists public.lotg_chat (
  id          uuid primary key default gen_random_uuid(),
  device_id   text not null,
  name        text not null,
  ig          text not null default '',
  provider    text not null default '',         -- author's social, for the profile link
  handle      text not null default '',
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
--   PUBLIC
--     register    {device,name,provider,handle}  -> chat sign-in (social only, no email)
--     board            {device}                  -> { me, plays[], pending[], chat[], week }  (poll)
--     play_upload_init {device,contentType}       -> OPEN; { uploadUrl (signed), path, maxBytes }
--     play_submit      {device,path,caption,name?}-> OPEN; verifies the upload, lands pending; <=12/day
--     play_vote        {device,play}              -> OPEN; toggle 1 vote/device on an APPROVED play
--     chat_get    {device}                        -> { chat[] }
--     chat_send   {device,body}                   -> requires social sign-in (guard); <=20/5min
--   COACH (auth = active ll_coaches user + PIN)
--     admin_pending  {user,pin}                   -> plays awaiting approval
--     admin_approve  {user,pin,play}              -> make a clip live
--     admin_reject   {user,pin,play}              -> delete a pending clip
--     admin_takedown {user,pin,play}              -> hide an already-approved clip
-- board.plays are APPROVED clips ranked by votes (Play of the Week = #1 this week);
-- board.pending is the viewer's OWN clips still awaiting approval. plays/chat carry a
-- server-computed `mine`; device ids never leave the server.
