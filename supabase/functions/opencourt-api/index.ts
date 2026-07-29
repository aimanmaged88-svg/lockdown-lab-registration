import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Hoops Heaven (codename OpenCourt) — Sydney's open run. Sister product of
// Lockdown Lab Live, same engine: all DB access is server-side (service
// role), the browser sends the public anon key as Bearer + apikey.
// Identity: no passwords — a device registers once with a name + Instagram
// handle (or an email for the IG-less), accepting the house rules. Every
// write requires a registered, unbanned identity, and the server always uses
// the REGISTERED name/handle (client-sent ones are ignored outside register)
// so identities can't be faked per-request. Bans live in oc_bans and match
// handle, email or device id — re-registering doesn't dodge one. Objects:
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
// Sanitize an id/key for safe interpolation into a PostgREST in.("...",...) list:
// strip everything except the charset our ids/keys use, so no ", &, ) can inject.
const sid = (v: unknown) => String(v ?? "").replace(/[^a-zA-Z0-9._-]/g, "");
const igClean = (v: unknown) => String(v ?? "").replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 30);
const emailClean = (v: unknown) => {
  const e = String(v ?? "").trim().toLowerCase().slice(0, 120);
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,24}$/.test(e) ? e : "";
};
const FORMATS = ["5v5", "4v4", "3v3", "2v2", "1v1", "21", "shootaround"];
const BANNED_MSG = "this account is banned from Hoops Heaven";

function courtOf(b: Record<string, unknown>) {
  const c = (b.court || {}) as Record<string, unknown>;
  const key = str(c.key, 64);
  const name = str(c.name, 80) || "Basketball Court";
  const suburb = str(c.suburb, 60);
  const lat = +(c.lat as number), lon = +(c.lon as number);
  if (!key || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { key, name, suburb, lat, lon };
}

// Any of these identity values on the blocklist?
async function bansHit(values: string[]) {
  const vs = values.filter(Boolean).map(v => `"${v.toLowerCase().replace(/"/g, "")}"`);
  if (!vs.length) return false;
  const rows = await db(`oc_bans?value=in.(${encodeURIComponent(vs.join(","))})&select=value`);
  return !!rows?.length;
}


// Heaven desk auth: any ACTIVE Lab coach account (same sha256 scheme as coach_login).
async function sha256(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, "0")).join("");
}
async function coachAuth(user: unknown, pin: unknown) {
  const u = str(user, 120).toLowerCase(), p = str(pin, 8);
  if (!u || !/^\d{4,8}$/.test(p)) return false;
  const rows = await db(`ll_coaches?username=eq.${encodeURIComponent(u)}&status=eq.active&select=id,pin_hash`);
  if (!rows?.length) return false;
  const h = await sha256(`${u}:${p}:lockdownlabcoach`);
  if (!rows[0].pin_hash) {
    // First login claims the PIN (mirrors coach_login's claim-on-first-PIN).
    await db(`ll_coaches?id=eq.${rows[0].id}`, { method: "PATCH", body: JSON.stringify({ pin_hash: h }) });
    return true;
  }
  return rows[0].pin_hash === h;
}
const mkCode = () => String(Math.floor(10000 + Math.random() * 90000));

// Which of these player ids are account-verified?
async function verifiedSet(ids: string[]) {
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!uniq.length) return new Set<string>();
  const rows = await db(`oc_players?id=in.(${uniq.map(i => `"${sid(i)}"`).join(",")})&verified=is.true&select=id`);
  return new Set<string>((rows || []).map((r: Record<string, unknown>) => r.id as string));
}

// The write gate: device must be registered (terms accepted) and clean.
// Returns {p} with the REGISTERED identity, or {err} as a ready Response.
async function guard(pid: string): Promise<{ p?: { id: string; name: string; ig: string; verified: boolean }; err?: Response }> {
  const id = str(pid, 64);
  if (!id || id.length < 8) return { err: J({ error: "sign in first", code: "terms" }, 401) };
  const rows = await db(`oc_players?id=eq.${encodeURIComponent(id)}&select=id,name,ig,email,accepted_at,banned,verified`);
  const row = rows?.[0];
  if (!row || !row.accepted_at) return { err: J({ error: "sign in and accept the house rules first", code: "terms" }, 401) };
  if (row.banned || await bansHit([row.id, row.ig, row.email])) return { err: J({ error: BANNED_MSG, code: "banned" }, 403) };
  return { p: { id: row.id, name: row.name, ig: row.ig, verified: !!row.verified } };
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
  const vs = await verifiedSet(ps.map(p => p.player_id as string));
  const by: Record<string, unknown[]> = {};
  for (const p of ps) (by[p.run_id as string] ||= []).push({ id: p.player_id, name: p.name, ig: p.ig, v: vs.has(p.player_id as string) });
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
  const vs = await verifiedSet(plays.map(p => p.player_id as string));
  return plays
    .map(p => ({ ...p, fires: n[p.id as string] || 0, fired: !!mine[p.id as string], v: vs.has(p.player_id as string) }))
    .sort((a, b) => (b.fires as number) - (a.fires as number) || String(a.created_at).localeCompare(String(b.created_at)));
}


// Active check-ins at a court (2h window), oldest first.
async function hereFor(courtKey: string) {
  const since = new Date(Date.now() - 2 * 36e5).toISOString();
  const rows: Record<string, unknown>[] = await db(`oc_checkins?court_key=eq.${encodeURIComponent(courtKey)}&checked_in_at=gte.${since}&select=player_id,name,ig,verified,checked_in_at&order=checked_in_at.asc`);
  return rows.map(r => ({ id: r.player_id, name: r.name, ig: r.ig, verified: r.verified, at: r.checked_in_at }));
}


// Rating summary {avg,n} per court for a set of keys (or all when keys null).
async function ratingsFor(keys: string[] | null) {
  const q = keys ? `oc_ratings?court_key=in.(${keys.map(k => `"${sid(k)}"`).join(",")})&select=court_key,stars` : `oc_ratings?select=court_key,stars`;
  const rows: Record<string, unknown>[] = await db(q);
  const agg: Record<string, { s: number; n: number }> = {};
  for (const r of rows || []) {
    const k = r.court_key as string;
    (agg[k] ||= { s: 0, n: 0 });
    agg[k].s += r.stars as number; agg[k].n++;
  }
  const out: Record<string, { avg: number; n: number }> = {};
  for (const k in agg) out[k] = { avg: Math.round(agg[k].s / agg[k].n * 10) / 10, n: agg[k].n };
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return J({ error: "POST only" }, 405);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return J({ error: "bad json" }, 400); }
  const action = str(b.action, 40);

  try {
    switch (action) {

      // Sign-in: device id + name + (IG handle OR email) + terms acceptance.
      // Re-registering refreshes name/handle; banned identities are refused.
      case "register": {
        const p = (b.player || {}) as Record<string, unknown>;
        const id = str(p.id, 64), name = str(p.name, 40);
        const ig = igClean(p.ig), email = emailClean(p.email);
        if (!id || !/^[a-zA-Z0-9._-]{8,64}$/.test(id) || !name) return J({ error: "put a name on it" }, 400);
        if (!ig && !email) return J({ error: "sign in with your Instagram — or an email if you don't have IG" }, 400);
        if (b.accept !== true) return J({ error: "you have to accept the house rules to play" }, 400);
        if (await bansHit([id, ig, email])) return J({ error: BANNED_MSG, code: "banned" }, 403);
        // A banned device row stays banned even if they re-register.
        const prev = await db(`oc_players?id=eq.${encodeURIComponent(id)}&select=banned`);
        if (prev?.[0]?.banned) return J({ error: BANNED_MSG, code: "banned" }, 403);
        const cur = await db(`oc_players?id=eq.${encodeURIComponent(id)}&select=verified,verify_code`);
        const verified = !!cur?.[0]?.verified;
        const verify_code = cur?.[0]?.verify_code || mkCode();
        await db(`oc_players?on_conflict=id`, {
          method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ id, name, ig, email, accepted_at: new Date().toISOString(), verify_code }),
        });
        return J({ ok: true, player: { id, name, ig }, verified, verify_code });
      }

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
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
        if (!player.verified) return J({ error: "verify your account to call runs — takes one DM", code: "verify" }, 403);
        const court = courtOf(b);
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
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
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
        // Leaving is always allowed — even a banned account can only remove itself.
        const id = str(b.run_id, 64), pid = str(b.player_id, 64);
        if (!id || !pid) return J({ error: "bad request" }, 400);
        await db(`oc_run_players?run_id=eq.${encodeURIComponent(id)}&player_id=eq.${encodeURIComponent(pid)}`, { method: "DELETE" });
        const rows = await db(`oc_runs?id=eq.${encodeURIComponent(id)}&select=*`);
        return J({ run: rows?.length ? (await withPlayers(rows))[0] : null });
      }


      // All court overrides (small table) — the app applies name/hidden/photo.
      case "courts_meta": {
        const rows = await db(`oc_courts?select=key,name,notes,photo_url,hidden,lat,lon,suburb,indoor,lit,custom`);
        // live activity per court: active check-ins (2h) + upcoming runs
        const since = new Date(Date.now() - 2 * 36e5).toISOString();
        const cis = await db(`oc_checkins?checked_in_at=gte.${since}&select=court_key`);
        const from = new Date(Date.now() - 3 * 36e5).toISOString();
        const rns = await db(`oc_runs?status=eq.open&run_at=gte.${from}&select=court_key`);
        const here: Record<string, number> = {}, runs: Record<string, number> = {};
        for (const c of cis || []) here[c.court_key as string] = (here[c.court_key as string] || 0) + 1;
        for (const r of rns || []) runs[r.court_key as string] = (runs[r.court_key as string] || 0) + 1;
        return J({ courts: rows || [], here, runs, ratings: await ratingsFor(null) });
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
        const info = (await db(`oc_courts?key=eq.${encodeURIComponent(key)}&select=name,notes,photo_url,hidden`))?.[0] || null;
        const rrows: Record<string, unknown>[] = await db(`oc_ratings?court_key=eq.${encodeURIComponent(key)}&select=player_id,stars,text,created_at&order=created_at.desc&limit=40`);
        const rvs = await verifiedSet((rrows || []).map(r => r.player_id as string));
        const rids = [...new Set((rrows || []).map(r => r.player_id as string))];
        const rnames: Record<string, { name: string; ig: string }> = {};
        if (rids.length) for (const p of await db(`oc_players?id=in.(${rids.map(i => `"${sid(i)}"`).join(",")})&select=id,name,ig`) || []) rnames[p.id] = { name: p.name, ig: p.ig };
        const asAdmin = await coachAuth(b.user, b.pin);
        const reviews = (rrows || []).map(r => ({ ...(asAdmin ? { pid: r.player_id } : {}), stars: r.stars, text: r.text, at: r.created_at, name: rnames[r.player_id as string]?.name || "Hooper", ig: rnames[r.player_id as string]?.ig || "", v: rvs.has(r.player_id as string), mine: r.player_id === me }));
        const rsum = reviews.length ? { avg: Math.round(reviews.reduce((a, r) => a + (r.stars as number), 0) / reviews.length * 10) / 10, n: reviews.length } : null;
        return J({ runs: await withPlayers(runs), plays, week, kotc, here: await hereFor(key), info, reviews, rsum });
      }


      // QR / court check-in: one active check-in per player, new court replaces
      // old, expires after 2h. verified = client geolocation put them at the court.
      case "checkin": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
        const court = courtOf(b);
        if (!court) return J({ error: "bad court" }, 400);
        // housekeeping: drop long-expired rows so the table stays tiny
        await db(`oc_checkins?checked_in_at=lt.${new Date(Date.now() - 48 * 36e5).toISOString()}`, { method: "DELETE" }).catch(() => {});
        await db(`oc_checkins?player_id=eq.${encodeURIComponent(player.id)}`, { method: "DELETE" });
        await db(`oc_checkins`, {
          method: "POST",
          body: JSON.stringify({ court_key: court.key, court_name: court.name, suburb: court.suburb, lat: court.lat, lon: court.lon, player_id: player.id, name: player.name, ig: player.ig, verified: b.verified === true }),
        });
        return J({ here: await hereFor(court.key) });
      }

      case "checkout": {
        // Leaving is always allowed, same as run_leave.
        const pid = str(b.player_id, 64);
        if (!pid) return J({ error: "bad request" }, 400);
        const rows = await db(`oc_checkins?player_id=eq.${encodeURIComponent(pid)}&select=court_key`);
        await db(`oc_checkins?player_id=eq.${encodeURIComponent(pid)}`, { method: "DELETE" });
        return J({ ok: true, here: rows?.[0] ? await hereFor(rows[0].court_key as string) : [] });
      }


      // My account status (verification state + code for the DM).
      case "me": {
        const id = str(b.player_id, 64);
        if (!id) return J({ error: "bad request" }, 400);
        const rows = await db(`oc_players?id=eq.${encodeURIComponent(id)}&select=name,ig,email,verified,verify_code,banned`);
        const row = rows?.[0];
        if (!row) return J({ error: "no account", code: "terms" }, 404);
        let code = row.verify_code;
        if (!code) { code = mkCode(); await db(`oc_players?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ verify_code: code }) }); }
        const req = await db(`oc_inbox?player_id=eq.${encodeURIComponent(id)}&select=player_id`);
        return J({ name: row.name, ig: row.ig, verified: !!row.verified, verify_code: code, banned: !!row.banned, requested: !!req?.length });
      }


      // In-app verification request → lands in the Heaven desk inbox.
      case "verify_request": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
        if (player.verified) return J({ error: "you're already verified ✓" }, 400);
        const rows = await db(`oc_players?id=eq.${encodeURIComponent(player.id)}&select=email`);
        await db(`oc_inbox?on_conflict=player_id`, {
          method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ player_id: player.id, name: player.name, ig: player.ig, email: rows?.[0]?.email || "", text: str(b.text, 300), created_at: new Date().toISOString() }),
        });
        return J({ ok: true });
      }



      // Rate a court: 1-5 stars + optional words. One per player per court.
      case "rate_court": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
        const key = str(b.court_key, 64);
        const stars = num(b.stars, 1, 5, 0);
        if (!key || !/^oc_[a-zA-Z0-9._-]+$/.test(key) || !stars) return J({ error: "pick your stars first" }, 400);
        // Anti-flood: at most 30 distinct courts rated per device per day.
        const dayAgo = new Date(Date.now() - 864e5).toISOString();
        const mineToday = await db(`oc_ratings?player_id=eq.${encodeURIComponent(player.id)}&created_at=gte.${dayAgo}&select=court_key`);
        const already = (mineToday || []).some((r: Record<string, unknown>) => r.court_key === key);
        if (!already && (mineToday?.length || 0) >= 30) return J({ error: "easy — that's a lot of reviews for one day" }, 429);
        await db(`oc_ratings?on_conflict=court_key,player_id`, {
          method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ court_key: key, player_id: player.id, stars, text: str(b.text, 300), created_at: new Date().toISOString() }),
        });
        return J({ ok: true });
      }

      // Heaven desk: add a custom court / delete one / remove a review.
      case "admin_court_add": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const name = str(b.name, 80), suburb = str(b.suburb, 60);
        const lat = +(b.lat as number), lon = +(b.lon as number);
        if (!name) return J({ error: "name the court" }, 400);
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -35.5 || lat > -32.5 || lon < 149.5 || lon > 152.5) return J({ error: "that pin isn't in Sydney — paste \"lat, lon\" from Google Maps" }, 400);
        const key = `oc_c_${crypto.randomUUID().slice(0, 8)}`;
        await db(`oc_courts`, { method: "POST", body: JSON.stringify({ key, name, suburb, lat, lon, indoor: b.indoor === true, lit: b.lit === true, custom: true, updated_at: new Date().toISOString() }) });
        return J({ ok: true, key });
      }

      case "admin_court_del": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        await db(`oc_courts?key=eq.${encodeURIComponent(str(b.key, 64))}&custom=is.true`, { method: "DELETE" });
        return J({ ok: true });
      }

      case "admin_review_del": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const key = str(b.key, 64), pid = str(b.pid, 64);
        if (!key || !pid) return J({ error: "bad request" }, 400);
        await db(`oc_ratings?court_key=eq.${encodeURIComponent(key)}&player_id=eq.${encodeURIComponent(pid)}`, { method: "DELETE" });
        return J({ ok: true });
      }

      // Heaven desk: court overrides (display name, notes, hide) + photo upload.
      case "admin_court_set": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const key = str(b.key, 64);
        if (!key) return J({ error: "bad court" }, 400);
        await db(`oc_courts?on_conflict=key`, {
          method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ key, name: str(b.name, 80), notes: str(b.notes, 400), photo_url: str(b.photo_url, 300), hidden: b.hidden === true, updated_at: new Date().toISOString() }),
        });
        return J({ ok: true });
      }

      case "admin_court_photo": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const key = str(b.key, 64);
        const data = String(b.data ?? "");
        const m = data.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);
        if (!key || !m) return J({ error: "bad image" }, 400);
        const bytes = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
        if (bytes.length > 3_500_000) return J({ error: "image too big" }, 400);
        const path = `courts/${key}-${Date.now()}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
        const up = await fetch(`${SUPABASE_URL}/storage/v1/object/heaven/${path}`, {
          method: "POST",
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": `image/${m[1]}`, "x-upsert": "true" },
          body: bytes,
        });
        if (!up.ok) { console.error("upload", await up.text()); return J({ error: "upload failed" }, 500); }
        const url = `${SUPABASE_URL}/storage/v1/object/public/heaven/${path}`;
        await db(`oc_courts?on_conflict=key`, {
          method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ key, photo_url: url, updated_at: new Date().toISOString() }),
        });
        return J({ ok: true, url });
      }

      // Heaven desk (Lab coach credentials): review + verify + ban.
      case "admin_players": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const rows = await db(`oc_players?select=id,name,ig,email,verified,verify_code,banned,created_at&order=created_at.desc&limit=200`);
        const inbox = await db(`oc_inbox?select=*&order=created_at.asc&limit=100`);
        return J({ players: rows || [], inbox: inbox || [] });
      }

      case "admin_verify": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const pid = str(b.pid, 64);
        if (!pid) return J({ error: "bad request" }, 400);
        await db(`oc_players?id=eq.${encodeURIComponent(pid)}`, { method: "PATCH", body: JSON.stringify({ verified: b.on !== false }) });
        if (b.on !== false) await db(`oc_inbox?player_id=eq.${encodeURIComponent(pid)}`, { method: "DELETE" });
        return J({ ok: true });
      }

      case "admin_inbox_done": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        await db(`oc_inbox?player_id=eq.${encodeURIComponent(str(b.pid, 64))}`, { method: "DELETE" });
        return J({ ok: true });
      }

      case "admin_ban": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const pid = str(b.pid, 64);
        const rows = await db(`oc_players?id=eq.${encodeURIComponent(pid)}&select=id,ig,email`);
        const row = rows?.[0];
        if (!row) return J({ error: "player not found" }, 404);
        if (b.on === false) {
          await db(`oc_players?id=eq.${encodeURIComponent(pid)}`, { method: "PATCH", body: JSON.stringify({ banned: false, ban_reason: "" }) });
          for (const v of [row.id, row.ig, row.email]) if (v) await db(`oc_bans?value=eq.${encodeURIComponent(String(v).toLowerCase())}`, { method: "DELETE" });
        } else {
          await db(`oc_players?id=eq.${encodeURIComponent(pid)}`, { method: "PATCH", body: JSON.stringify({ banned: true, ban_reason: str(b.reason, 200) }) });
          for (const v of [row.id, row.ig, row.email]) if (v) await db(`oc_bans?on_conflict=value`, { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ value: String(v).toLowerCase(), reason: str(b.reason, 200) }) });
        }
        return J({ ok: true });
      }

      // Play of the Week: one clip per player per court per week (resubmit replaces).
      case "play_submit": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
        if (!player.verified) return J({ error: "verify your account to post clips — takes one DM", code: "verify" }, 403);
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
        const g = await guard(str(b.player_id, 64));
        if (g.err) return g.err;
        const pid = g.p!.id, play = str(b.play_id, 64);
        if (!play) return J({ error: "bad request" }, 400);
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
