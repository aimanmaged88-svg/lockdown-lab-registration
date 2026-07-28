import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// OpenCourt — Sydney's open run. Sister product of Lockdown Lab Live, same
// engine: all DB access is server-side (service role), the browser sends the
// public anon key as Bearer + apikey. OpenCourt is OPEN by design — no
// accounts, no PINs. A player is a device-generated id + a name + an
// Instagram handle; the IG handle is how people connect. Objects:
//   runs  — pickup games called at a court; anyone taps in until it's full
//   plays — Play of the Week: one clip link per player per court per week,
//           ranked by 🔥 fires from other players
// King of the Court comes later; run tap-ins per court accrue from day one.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function db(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`db ${r.status}: ${await r.text()}`);
  const txt = await r.text();
  return txt ? JSON.parse(txt) : null;
}

const str = (v: unknown, max = 120) => String(v ?? "").slice(0, max).trim();
const num = (v: unknown, lo: number, hi: number, dflt: number) => {
  const n = +(v as number);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : dflt;
};
// IG handles: letters/digits/dot/underscore, max 30, no @
const igClean = (v: unknown) => String(v ?? "").replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 30);
const FORMATS = ["5v5", "4v4", "3v3", "2v2", "1v1", "21", "shootaround"];

// Player identity as sent by the client. id is a device uuid — no auth, but
// every write is tied to it so a player can only remove/replace their own rows.
function playerOf(b: Record<string, unknown>) {
  const p = (b.player || {}) as Record<string, unknown>;
  const id = str(p.id, 64);
  const name = str(p.name, 40);
  const ig = igClean(p.ig);
  if (!id || id.length < 8 || !name) return null;
  return { id, name, ig };
}

function courtOf(b: Record<string, unknown>) {
  const c = (b.court || {}) as Record<string, unknown>;
  const key = str(c.key, 64);
  const name = str(c.name, 80) || "Basketball Court";
  const suburb = str(c.suburb, 60);
  const lat = +(c.lat as number), lon = +(c.lon as number);
  if (!key || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { key, name, suburb, lat, lon };
}

// ISO week of the current Sydney date, e.g. "2026-W31" — the POTW window.
function sydWeek() {
  const s = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" }); // YYYY-MM-DD
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yy = t.getUTCFullYear();
  const w = Math.ceil(((t.getTime() - Date.UTC(yy, 0, 1)) / 864e5 + 1) / 7);
  return `${yy}-W${String(w).padStart(2, "0")}`;
}

// Attach rosters to a list of runs in one query.
async function withPlayers(runs: Record<string, unknown>[]) {
  if (!runs.length) return runs;
  const ids = runs.map(r => r.id).join(",");
  const ps: Record<string, unknown>[] = await db(`oc_run_players?run_id=in.(${ids})&select=run_id,player_id,name,ig,joined_at&order=joined_at.asc`);
  const by: Record<string, unknown[]> = {};
  for (const p of ps) (by[p.run_id as string] ||= []).push({ id: p.player_id, name: p.name, ig: p.ig });
  return runs.map(r => ({ ...r, players: by[r.id as string] || [] }));
}

// Plays for a court+week with fire counts, hottest first; `me` marks my fires.
async function playsFor(courtKey: string, week: string, me: string) {
  const plays: Record<string, unknown>[] = await db(`oc_plays?court_key=eq.${encodeURIComponent(courtKey)}&week=eq.${encodeURIComponent(week)}&select=id,player_id,name,ig,clip_url,created_at&order=created_at.asc`);
  if (!plays.length) return [];
  const ids = plays.map(p => p.id).join(",");
  const fires: Record<string, unknown>[] = await db(`oc_play_fires?play_id=in.(${ids})&select=play_id,player_id`);
  const n: Record<string, number> = {}, mine: Record<string, boolean> = {};
  for (const f of fires) {
    n[f.play_id as string] = (n[f.play_id as string] || 0) + 1;
    if (f.player_id === me) mine[f.play_id as string] = true;
  }
  return plays
    .map(p => ({ ...p, fires: n[p.id as string] || 0, fired: !!mine[p.id as string] }))
    .sort((a, b) => (b.fires as number) - (a.fires as number) || String(a.created_at).localeCompare(String(b.created_at)));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return J({ error: "POST only" }, 405);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return J({ error: "bad json" }, 400); }
  const action = str(b.action, 40);

  try {
    switch (action) {

      // The board: every open run from 3h ago (still live) to +14 days.
      case "board": {
        const from = new Date(Date.now() - 3 * 36e5).toISOString();
        const runs = await db(`oc_runs?status=eq.open&run_at=gte.${from}&select=*&order=run_at.asc&limit=80`);
        return J({ runs: await withPlayers(runs), week: sydWeek() });
      }

      case "run_get": {
        const id = str(b.run_id, 64);
        const rows = await db(`oc_runs?id=eq.${encodeURIComponent(id)}&select=*`);
        if (!rows?.length) return J({ error: "run not found" }, 404);
        return J({ run: (await withPlayers(rows))[0] });
      }

      case "run_create": {
        const player = playerOf(b);
        const court = courtOf(b);
        if (!player) return J({ error: "add your name first" }, 400);
        if (!court) return J({ error: "pick a court" }, 400);
        const at = new Date(str(b.run_at, 40));
        if (isNaN(at.getTime())) return J({ error: "bad time" }, 400);
        const mins = (at.getTime() - Date.now()) / 6e4;
        if (mins < -60) return J({ error: "that tip-off already passed — pick a later time" }, 400);
        if (mins > 14 * 1440) return J({ error: "runs can be called up to 14 days out" }, 400);
        const format = FORMATS.includes(str(b.format, 20)) ? str(b.format, 20) : "5v5";
        const cap = num(b.cap, 2, 30, 10);
        // Soft rate-limit: max 6 runs called per device per day.
        const dayAgo = new Date(Date.now() - 864e5).toISOString();
        const mine = await db(`oc_runs?host_id=eq.${encodeURIComponent(player.id)}&created_at=gte.${dayAgo}&select=id`);
        if ((mine?.length || 0) >= 6) return J({ error: "easy — you've called 6 runs today already" }, 429);
        const [run] = await db(`oc_runs`, {
          method: "POST", headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            court_key: court.key, court_name: court.name, suburb: court.suburb, lat: court.lat, lon: court.lon,
            run_at: at.toISOString(), format, cap, host_id: player.id, host_name: player.name, host_ig: player.ig,
          }),
        });
        // The host is automatically first in.
        await db(`oc_run_players`, { method: "POST", body: JSON.stringify({ run_id: run.id, player_id: player.id, name: player.name, ig: player.ig }) });
        return J({ run: (await withPlayers([run]))[0] });
      }

      case "run_join": {
        const player = playerOf(b);
        if (!player) return J({ error: "add your name first" }, 400);
        const id = str(b.run_id, 64);
        const rows = await db(`oc_runs?id=eq.${encodeURIComponent(id)}&select=*`);
        const run = rows?.[0];
        if (!run) return J({ error: "run not found" }, 404);
        if (run.status !== "open") return J({ error: "this run is closed" }, 400);
        if (new Date(run.run_at).getTime() < Date.now() - 3 * 36e5) return J({ error: "this run already happened" }, 400);
        const ps = await db(`oc_run_players?run_id=eq.${run.id}&select=player_id`);
        const already = ps.some((p: Record<string, unknown>) => p.player_id === player.id);
        if (!already && ps.length >= run.cap) return J({ error: "run's full" }, 400);
        await db(`oc_run_players?on_conflict=run_id,player_id`, {
          method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ run_id: run.id, player_id: player.id, name: player.name, ig: player.ig }),
        });
        return J({ run: (await withPlayers([run]))[0] });
      }

      case "run_leave": {
        const id = str(b.run_id, 64), pid = str(b.player_id, 64);
        if (!id || !pid) return J({ error: "bad request" }, 400);
        await db(`oc_run_players?run_id=eq.${encodeURIComponent(id)}&player_id=eq.${encodeURIComponent(pid)}`, { method: "DELETE" });
        const rows = await db(`oc_runs?id=eq.${encodeURIComponent(id)}&select=*`);
        return J({ run: rows?.length ? (await withPlayers(rows))[0] : null });
      }

      // Court page: upcoming runs here, this week's plays, early KOTC leaders.
      case "court": {
        const key = str(b.court_key, 64);
        const me = str(b.player_id, 64);
        if (!key) return J({ error: "bad court" }, 400);
        const from = new Date(Date.now() - 3 * 36e5).toISOString();
        const runs = await db(`oc_runs?court_key=eq.${encodeURIComponent(key)}&status=eq.open&run_at=gte.${from}&select=*&order=run_at.asc&limit=20`);
        const week = sydWeek();
        const plays = await playsFor(key, week, me);
        // KOTC seed: tap-ins at this court in the last 90 days, counted per player.
        const since = new Date(Date.now() - 90 * 864e5).toISOString();
        const past = await db(`oc_runs?court_key=eq.${encodeURIComponent(key)}&run_at=gte.${since}&select=id`);
        let kotc: unknown[] = [];
        if (past?.length) {
          const ids = past.map((r: Record<string, unknown>) => r.id).join(",");
          const taps: Record<string, unknown>[] = await db(`oc_run_players?run_id=in.(${ids})&select=player_id,name,ig`);
          const agg: Record<string, { name: unknown; ig: unknown; runs: number }> = {};
          for (const t of taps) {
            const k = t.player_id as string;
            (agg[k] ||= { name: t.name, ig: t.ig, runs: 0 }).runs++;
            agg[k].name = t.name; agg[k].ig = t.ig;
          }
          kotc = Object.values(agg).sort((a, b) => b.runs - a.runs).slice(0, 5);
        }
        return J({ runs: await withPlayers(runs), plays, week, kotc });
      }

      // Play of the Week: one clip per player per court per week (resubmit replaces).
      case "play_submit": {
        const player = playerOf(b);
        if (!player) return J({ error: "add your name first" }, 400);
        const key = str(b.court_key, 64);
        const name = str(b.court_name, 80), suburb = str(b.suburb, 60);
        const url = str(b.clip_url, 300);
        if (!key) return J({ error: "bad court" }, 400);
        if (!/^https?:\/\/\S+$/i.test(url)) return J({ error: "paste a link to your clip (IG post, reel, YouTube…)" }, 400);
        const week = sydWeek();
        await db(`oc_plays?on_conflict=court_key,player_id,week`, {
          method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ court_key: key, court_name: name, suburb, player_id: player.id, name: player.name, ig: player.ig, clip_url: url, week }),
        });
        return J({ plays: await playsFor(key, week, player.id), week });
      }

      case "play_fire": {
        const pid = str(b.player_id, 64), play = str(b.play_id, 64);
        if (!pid || pid.length < 8 || !play) return J({ error: "bad request" }, 400);
        const rows = await db(`oc_plays?id=eq.${encodeURIComponent(play)}&select=id,court_key,week,player_id`);
        const p = rows?.[0];
        if (!p) return J({ error: "play not found" }, 404);
        if (p.player_id === pid) return J({ error: "can't fire your own clip" }, 400);
        const had = await db(`oc_play_fires?play_id=eq.${p.id}&player_id=eq.${encodeURIComponent(pid)}&select=play_id`);
        if (had?.length) {
          await db(`oc_play_fires?play_id=eq.${p.id}&player_id=eq.${encodeURIComponent(pid)}`, { method: "DELETE" });
        } else {
          await db(`oc_play_fires`, { method: "POST", body: JSON.stringify({ play_id: p.id, player_id: pid }) });
        }
        return J({ plays: await playsFor(p.court_key, p.week, pid), week: p.week });
      }

      default:
        return J({ error: "unknown action" }, 400);
    }
  } catch (e) {
    console.error(action, e);
    return J({ error: "server error" }, 500);
  }
});
