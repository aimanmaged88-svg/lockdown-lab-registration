-- THE PACK — run club app.  Sister product to Certified Hooper, same engine:
-- every table is service-role only (RLS on, zero policies) and all access
-- goes through the `runclub-api` edge function.  Identity is a device id +
-- a name, exactly like oc_players — no passwords, no email round-trips.
-- Prefix: rc_*.  Nothing here touches the Lab (ll_*) or Hooper (oc_*) tables.

create table if not exists public.rc_clubs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text not null default '',
  blurb       text not null default '',
  code        text not null unique,            -- 6-char join code
  captain_id  text not null,                   -- device id of the founder
  created_at  timestamptz not null default now()
);

create table if not exists public.rc_members (
  id         text primary key,                 -- device id
  club_id    uuid not null references public.rc_clubs(id) on delete cascade,
  name       text not null,
  handle     text not null default '',         -- @instagram / @strava, no @
  pace       text not null default '',         -- usual pace band, e.g. 5:30
  captain    boolean not null default false,
  banned     boolean not null default false,
  joined_at  timestamptz not null default now()
);
create index if not exists rc_members_club on public.rc_members(club_id);

create table if not exists public.rc_routes (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.rc_clubs(id) on delete cascade,
  name        text not null,
  km          numeric not null default 0,
  surface     text not null default '',        -- road | trail | track | mixed
  shape       text not null default 'loop',    -- loop | out-and-back | point-to-point
  start_name  text not null default '',
  lat         double precision,
  lon         double precision,
  link        text not null default '',        -- Strava / Komoot / Maps route
  notes       text not null default '',
  added_by    text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists rc_routes_club on public.rc_routes(club_id);

create table if not exists public.rc_runs (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.rc_clubs(id) on delete cascade,
  title      text not null default '',
  starts_at  timestamptz not null,
  meet       text not null default '',
  lat        double precision,
  lon        double precision,
  km         numeric not null default 0,
  route_id   uuid references public.rc_routes(id) on delete set null,
  paces      jsonb not null default '[]'::jsonb,   -- ["4:30","5:00","social"]
  notes      text not null default '',
  cancelled  boolean not null default false,
  host_id    text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists rc_runs_club_time on public.rc_runs(club_id, starts_at);

create table if not exists public.rc_rsvp (
  run_id    uuid not null references public.rc_runs(id) on delete cascade,
  member_id text not null,
  pace      text not null default '',
  at        timestamptz not null default now(),
  primary key (run_id, member_id)
);

-- One row per run actually run.  run_id is nullable: solo km count too.
create table if not exists public.rc_logs (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.rc_clubs(id) on delete cascade,
  member_id  text not null,
  run_id     uuid references public.rc_runs(id) on delete set null,
  km         numeric not null,
  secs       integer not null default 0,
  felt       integer not null default 0,       -- 1-5, how it felt
  note       text not null default '',
  ran_on     date not null,                    -- the runner's LOCAL date
  created_at timestamptz not null default now()
);
create index if not exists rc_logs_club_day on public.rc_logs(club_id, ran_on);
create index if not exists rc_logs_member on public.rc_logs(member_id);

alter table public.rc_clubs   enable row level security;
alter table public.rc_members enable row level security;
alter table public.rc_routes  enable row level security;
alter table public.rc_runs    enable row level security;
alter table public.rc_rsvp    enable row level security;
alter table public.rc_logs    enable row level security;

-- Strava is where run clubs actually keep the activity (the Kingsville post
-- links straight out to it), so a member carries their Strava alongside their
-- Instagram, and a logged run can point at the activity itself.
alter table public.rc_members add column if not exists strava text not null default '';
alter table public.rc_logs    add column if not exists link   text not null default '';

-- Chat. One table, two thread kinds: run_id null = the club-wide thread,
-- run_id set = that run's own thread ("running 5 late", "meet at the gate").
-- `name` is snapshotted at send time so a renamed or departed member's old
-- messages still read sensibly.
create table if not exists public.rc_chat (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.rc_clubs(id) on delete cascade,
  run_id     uuid references public.rc_runs(id) on delete cascade,
  member_id  text not null,
  name       text not null,
  text       text not null,
  created_at timestamptz not null default now()
);
create index if not exists rc_chat_thread on public.rc_chat(club_id, run_id, created_at);
alter table public.rc_chat enable row level security;

-- PURELY SOCIAL (2026-09-18, Aiman: "I want it to be purely social, check ins,
-- verse each other all that stuff"). The app is the communication bridge, not a
-- tracker: Strava keeps the distance, we keep who turned up. So rc_rsvp carries
-- the whole social record — you said you were in, then you confirmed you came.
-- `here_on` is the runner's LOCAL date (client-sent) so week maths can't be
-- shifted by a 6am Sydney run landing on the previous UTC day.
alter table public.rc_rsvp add column if not exists here    boolean not null default false;
alter table public.rc_rsvp add column if not exists here_at timestamptz;
alter table public.rc_rsvp add column if not exists here_on date;
create index if not exists rc_rsvp_here on public.rc_rsvp(member_id, here_on);

-- Distance/pace logging is gone with the tracker. The table was empty, so
-- there is nothing to migrate out of it.
drop table if exists public.rc_logs;
