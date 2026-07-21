-- Athlete OS — Web push (background notifications).
-- Applied to the live project via Supabase MCP. DDL only: the VAPID keypair,
-- subject and cron secret live in aos_config (seeded directly in the DB, never
-- committed to source control). RLS is on with no anon policies — the aos-api
-- edge function (service role) is the only reader/writer.

create table if not exists aos_push_subs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references aos_athletes(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  ua text,
  created_at timestamptz not null default now(),
  last_notified timestamptz
);
alter table aos_push_subs enable row level security;
create index if not exists idx_aos_push_athlete on aos_push_subs(athlete_id);

create table if not exists aos_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table aos_config enable row level security;

-- Config keys expected by aos-api (seed values set out-of-band, not in VCS):
--   vapid_public      — VAPID public key (also embedded in the client)
--   vapid_private     — VAPID private key  (secret)
--   vapid_subject     — mailto: contact for push services
--   push_cron_secret  — shared secret for the daily push_cron sweep (secret)

-- Daily reminder sweep (pg_cron + pg_net), 08:00 UTC = 6pm Australia/Sydney:
--   select cron.schedule('aos-daily-checkin-push', '0 8 * * *', $$
--     select net.http_post(
--       url := '<project>/functions/v1/aos-api',
--       headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<push_cron_secret>'),
--       body := '{"action":"push_cron"}'::jsonb);
--   $$);
