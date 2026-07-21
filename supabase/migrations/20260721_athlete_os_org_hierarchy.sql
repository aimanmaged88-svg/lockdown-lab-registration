-- Athlete OS — organisation hierarchy + athlete avatars (applied via Supabase MCP).
-- Additive & nullable so existing flat teams keep working.
-- Chain: Org -> Club -> Season -> Age Group -> Team -> Athlete.
create table if not exists aos_orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists aos_clubs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references aos_orgs(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists aos_seasons (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references aos_clubs(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists aos_age_groups (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references aos_seasons(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
alter table aos_orgs       enable row level security;
alter table aos_clubs      enable row level security;
alter table aos_seasons    enable row level security;
alter table aos_age_groups enable row level security;
create index if not exists idx_aos_clubs_org       on aos_clubs(org_id);
create index if not exists idx_aos_seasons_club     on aos_seasons(club_id);
create index if not exists idx_aos_agegroups_season on aos_age_groups(season_id);

-- Teams join the tree (nullable); optional athlete avatar.
alter table aos_teams    add column if not exists age_group_id uuid references aos_age_groups(id) on delete set null;
create index if not exists idx_aos_teams_agegroup on aos_teams(age_group_id);
alter table aos_athletes add column if not exists avatar_url text;

-- Public avatar bucket (edge fn uploads via service role; public read for <img>).
insert into storage.buckets (id, name, public) values ('aos-avatars', 'aos-avatars', true)
on conflict (id) do update set public = true;
