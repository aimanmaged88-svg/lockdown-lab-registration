-- LOTG — Wednesday Night Basketball · backend reference
-- Live in Supabase project ymuwuhvqqftgpxwhzoub (same project as the Lab).
-- This file DOCUMENTS what is already deployed — it is not run by CI.
-- Frontend: lotg/index.html (mirrors https://lotg-wednesday-night-basketball.netlify.app/,
-- Netlify site 71a72434-5369-4d03-843e-2a7f405bfb84, manual deploys — not git-driven).
--
-- Auth model: no user accounts. Reads are public (anon key). Writes require the
-- shared admin password sent as an `x-lotg-admin` request header, checked by
-- lotg_is_admin() against the token stored in lotg_admin (id=1). The password is
-- changeable in-app via lotg_change_password (min 4 chars).

create table if not exists public.lotg_teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo        text,                       -- 96x96 data-URI PNG, uploaded in Teams admin
  court_group integer not null default 1, -- 1 or 2: which court's round-robin pool
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.lotg_games (
  id              uuid primary key default gen_random_uuid(),
  court           integer not null,          -- 1 or 2
  slot_index      integer not null,          -- 0..5 round-robin slot (extra games append)
  game_time       text not null default '',  -- display string, e.g. '7:10 PM'
  team1_id        uuid references public.lotg_teams(id) on delete cascade,
  team2_id        uuid references public.lotg_teams(id) on delete cascade,
  score1          integer,
  score2          integer,
  status          text not null default 'upcoming', -- upcoming | live | final
  forfeit_team_id uuid,                      -- set when a Final was a forfeit
  created_at      timestamptz not null default now()
);

create table if not exists public.lotg_admin (
  id    integer primary key default 1,      -- single row, id = 1
  token text not null                       -- the shared admin password (plaintext)
);

-- RLS: public read, admin-header write on both data tables; lotg_admin has no
-- policies (RLS on, service-role/definer-fns only).
alter table public.lotg_teams  enable row level security;
alter table public.lotg_games  enable row level security;
alter table public.lotg_admin  enable row level security;

create policy "public read teams"  on public.lotg_teams for select using (true);
create policy "public read games"  on public.lotg_games for select using (true);
create policy "admin insert teams" on public.lotg_teams for insert with check (public.lotg_is_admin());
create policy "admin update teams" on public.lotg_teams for update using (public.lotg_is_admin()) with check (public.lotg_is_admin());
create policy "admin delete teams" on public.lotg_teams for delete using (public.lotg_is_admin());
create policy "admin insert games" on public.lotg_games for insert with check (public.lotg_is_admin());
create policy "admin update games" on public.lotg_games for update using (public.lotg_is_admin()) with check (public.lotg_is_admin());
create policy "admin delete games" on public.lotg_games for delete using (public.lotg_is_admin());

-- True when the request carries the current admin password in x-lotg-admin.
create or replace function public.lotg_is_admin()
returns boolean
language plpgsql stable security definer
set search_path to 'public'
as $$
declare
  hdr text;
  tok text;
begin
  begin
    hdr := (current_setting('request.headers', true)::json ->> 'x-lotg-admin');
  exception when others then
    hdr := null;
  end;
  select token into tok from public.lotg_admin where id = 1;
  return hdr is not null and tok is not null and hdr = tok;
end;
$$;

-- Login check for the frontend's admin modal.
create or replace function public.lotg_verify_admin(p_token text)
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select exists(select 1 from public.lotg_admin where id = 1 and token = p_token);
$$;

-- In-app password change ("Password" button in the admin bar).
create or replace function public.lotg_change_password(p_old text, p_new text)
returns boolean
language plpgsql security definer
set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.lotg_admin where id = 1 and token = p_old) then
    return false;
  end if;
  if length(coalesce(p_new, '')) < 4 then
    return false;
  end if;
  update public.lotg_admin set token = p_new where id = 1;
  return true;
end;
$$;
