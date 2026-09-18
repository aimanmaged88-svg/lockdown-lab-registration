import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// THE PACK — run club app.  Sister product of Certified Hooper, same engine:
// all DB access is server-side (service role); the browser sends the public
// anon key as Bearer + apikey.  Identity is a device id + a name, no
// passwords — a phone joins a club once and that's the account.  Every write
// goes through guard(), which resolves the device to a member row and uses
// the REGISTERED name (client-sent names are ignored outside join/profile),
// so nobody can post as someone else by editing a request.
//
// Objects:
//   clubs   — a run club.  6-char join code is the whole invite system.
//   runs    — a group run: when, where you meet, distance, pace groups.
//   rsvp    — "I'm in", with the pace group you're running.
//   routes  — the club's route library (distance, surface, shape, start pin).
//   logs    — a run you actually ran.  Feeds the board and your streak.
// The board ranks on SHOWING UP (runs logged) as well as km — a run club is
// a habit, not a race, so a 3km-every-week runner can lead it.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const J = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function db(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`db ${r.status}: ${await r.text()}`);
  const txt = await r.text();
  return txt ? JSON.parse(txt) : null;
}
const ins = (t: string, body: unknown) =>
  db(t, { method: "POST", body: JSON.stringify(body), headers: { Prefer: "return=representation" } });
const upd = (t: string, q: string, body: unknown) =>
  db(`${t}?${q}`, { method: "PATCH", body: JSON.stringify(body), headers: { Prefer: "return=representation" } });
const del = (t: string, q: string) => db(`${t}?${q}`, { method: "DELETE" });

const str = (v: unknown, max = 160) => String(v ?? "").slice(0, max).trim();
const num = (v: unknown, lo: number, hi: number, dflt: number) => {
  const n = +(v as number);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt;
};
const int = (v: unknown, lo: number, hi: number, dflt: number) => Math.round(num(v, lo, hi, dflt));
// A coordinate that isn't a real number is NO pin, not a pin at 0,0 in the
// Atlantic.  Returns null for absent or junk.
const coord = (v: unknown, lim: number): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = +(v as number);
  return Number.isFinite(n) && Math.abs(n) <= lim ? n : null;
};
const isUuid = (v: unknown) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v ?? ""));
// Sanitize anything that gets interpolated into a PostgREST filter, so a
// crafted device id can't inject its way out of an in.(...) / eq. list.
const sid = (v: unknown) => String(v ?? "").replace(/[^a-zA-Z0-9._-]/g, "");
const uid = (v: unknown) => String(v ?? "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 40);
const okDevice = (v: unknown) => /^[a-zA-Z0-9._-]{8,64}$/.test(String(v ?? ""));
// Social handle: letters/digits/dot/underscore, no @, max 30 (IG + Strava safe)
const handleClean = (v: unknown) =>
  String(v ?? "").replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 30);
// A pace group is either m:ss per km or a word like "social" / "chatty".
const paceClean = (v: unknown) => {
  const s = String(v ?? "").trim().slice(0, 14);
  if (!s) return "";
  if (/^\d{1,2}:\d{2}$/.test(s)) return s;
  return s.toLowerCase().replace(/[^a-z0-9:'+\- ]/g, "").trim();
};
const isDate = (v: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? ""));
// Strava is where the running actually gets logged, so a member carries theirs
// next to their Instagram.  Accept a pasted profile URL or a bare athlete id;
// store just the id/slug and let the client build the link.
const stravaClean = (v: unknown): string => {
  const raw = String(v ?? "").trim().slice(0, 200);
  if (!raw) return "";
  // A pasted profile link, with or without the scheme — people copy
  // "strava.com/athletes/123" as often as the full URL.
  const m = raw.match(/^(?:https?:\/\/)?(?:www\.)?strava\.com\/athletes\/([A-Za-z0-9._-]{1,40})/i);
  if (m) return m[1];
  // Anything else carrying a slash or colon is a link we don't recognise (an
  // activity URL, someone else's site, a javascript: payload). Drop it rather
  // than strip the punctuation out and store a dead link.
  if (/[/:]/.test(raw)) return "";
  return raw.replace(/^@+/, "").replace(/[^A-Za-z0-9._-]/g, "").slice(0, 40);
};
const httpish = (v: unknown) => {
  const s = str(v, 400);
  return /^https?:\/\/\S+$/i.test(s) ? s : "";
};
// Join codes skip I, L, O, 0 and 1 — they get misread out loud and in DMs.
const CODE_ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function rndCode() {
  let s = "";
  const b = new Uint8Array(6);
  crypto.getRandomValues(b);
  for (const n of b) s += CODE_ABC[n % CODE_ABC.length];
  return s;
}
async function mkCode() {
  for (let i = 0; i < 12; i++) {
    const c = rndCode();
    const hit = await db(`rc_clubs?code=eq.${c}&select=code`);
    if (!hit?.length) return c;
  }
  throw new Error("code space");
}

// --- week maths -----------------------------------------------------------
// Everything club-facing runs on Monday-start weeks, on the runner's own
// LOCAL date (the client sends it) so a Sunday night run never lands in the
// wrong week because the server is on UTC.
const dayMs = 864e5;
function mondayOf(d: string) {
  const t = new Date(d + "T00:00:00Z");
  const dow = (t.getUTCDay() + 6) % 7; // Mon = 0
  return new Date(t.getTime() - dow * dayMs).toISOString().slice(0, 10);
}
function shiftDay(d: string, days: number) {
  return new Date(new Date(d + "T00:00:00Z").getTime() + days * dayMs).toISOString().slice(0, 10);
}

type Member = { id: string; club_id: string; name: string; handle: string; strava: string; pace: string; captain: boolean; banned: boolean; joined_at: string };

async function guard(device: unknown): Promise<Member> {
  const id = sid(device);
  if (!id) throw J({ error: "sign in first", code: "nomember" }, 401);
  const rows = await db(`rc_members?id=eq.${encodeURIComponent(id)}&select=*`);
  const m = rows?.[0];
  if (!m) throw J({ error: "join a club first", code: "nomember" }, 401);
  if (m.banned) throw J({ error: "your spot in this club was removed", code: "banned" }, 403);
  return m as Member;
}
const pub = (m: Member) => ({ id: m.id, name: m.name, handle: m.handle, strava: m.strava, pace: m.pace, captain: m.captain, joined_at: m.joined_at });

// Runs in a window, with their RSVP rosters attached.
async function runsFor(club_id: string, fromIso: string, toIso: string, desc = false, limit = 40) {
  const rows = await db(
    `rc_runs?club_id=eq.${uid(club_id)}&starts_at=gte.${encodeURIComponent(fromIso)}&starts_at=lte.${encodeURIComponent(toIso)}` +
      `&select=*&order=starts_at.${desc ? "desc" : "asc"}&limit=${limit}`,
  ) || [];
  if (!rows.length) return [];
  const ids = rows.map((r: { id: string }) => `"${uid(r.id)}"`).join(",");
  const rsvps = await db(`rc_rsvp?run_id=in.(${ids})&select=run_id,member_id,pace`) || [];
  const mem = await db(`rc_members?club_id=eq.${uid(club_id)}&select=id,name,handle,strava,captain`) || [];
  const byId: Record<string, { name: string; handle: string; strava: string }> = {};
  for (const m of mem) byId[m.id] = { name: m.name, handle: m.handle, strava: m.strava };
  const roster: Record<string, unknown[]> = {};
  for (const r of rsvps) {
    (roster[r.run_id] ||= []).push({
      id: r.member_id,
      name: byId[r.member_id]?.name || "Someone",
      handle: byId[r.member_id]?.handle || "",
      strava: byId[r.member_id]?.strava || "",
      pace: r.pace,
    });
  }
  return rows.map((r: Record<string, unknown>) => ({ ...r, going: roster[r.id as string] || [] }));
}

// The board.  km and runs from rc_logs, "shows" from RSVPs on club runs that
// have already happened — so turning up is measured, not just distance.
async function boardFor(club_id: string, fromDay: string | null, members: Member[]) {
  const q = fromDay ? `&ran_on=gte.${fromDay}` : "";
  const logs = await db(`rc_logs?club_id=eq.${uid(club_id)}${q}&select=member_id,km,secs,ran_on&limit=5000`) || [];
  const nowIso = new Date().toISOString();
  const fromIso = fromDay ? fromDay + "T00:00:00Z" : "1970-01-01T00:00:00Z";
  const pastRuns = await db(
    `rc_runs?club_id=eq.${uid(club_id)}&cancelled=is.false&starts_at=gte.${fromIso}&starts_at=lte.${encodeURIComponent(nowIso)}&select=id&limit=400`,
  ) || [];
  const shows: Record<string, number> = {};
  if (pastRuns.length) {
    const ids = pastRuns.map((r: { id: string }) => `"${uid(r.id)}"`).join(",");
    const rs = await db(`rc_rsvp?run_id=in.(${ids})&select=member_id&limit=5000`) || [];
    for (const r of rs) shows[r.member_id] = (shows[r.member_id] || 0) + 1;
  }
  const agg: Record<string, { km: number; runs: number; secs: number; days: Set<string> }> = {};
  for (const l of logs) {
    const a = (agg[l.member_id] ||= { km: 0, runs: 0, secs: 0, days: new Set() });
    a.km += +l.km;
    a.runs += 1;
    a.secs += l.secs || 0;
    a.days.add(l.ran_on);
  }
  return members
    .map((m) => {
      const a = agg[m.id];
      const km = a ? Math.round(a.km * 10) / 10 : 0;
      const secs = a ? a.secs : 0;
      return {
        id: m.id, name: m.name, handle: m.handle, strava: m.strava, captain: m.captain,
        km, runs: a ? a.runs : 0, days: a ? a.days.size : 0,
        shows: shows[m.id] || 0,
        // Average pace only when both sides are real, so nobody gets a
        // fake 0:00 next to their name.
        pace: km > 0 && secs > 0 ? paceStr(secs / km) : "",
      };
    })
    .sort((a, z) => z.km - a.km || z.runs - a.runs || a.name.localeCompare(z.name));
}
const paceStr = (secsPerKm: number) => {
  const s = Math.round(secsPerKm);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Consecutive Monday-start weeks with at least one logged run.  The current
// week only breaks a streak once it's over, so Monday morning doesn't wipe
// the work you did all last week.
function streakOf(days: string[], todayLocal: string) {
  if (!days.length) return 0;
  const weeks = new Set(days.map(mondayOf));
  const thisWeek = mondayOf(todayLocal);
  let cursor = weeks.has(thisWeek) ? thisWeek : shiftDay(thisWeek, -7);
  if (!weeks.has(cursor)) return 0;
  let n = 0;
  while (weeks.has(cursor)) {
    n++;
    cursor = shiftDay(cursor, -7);
  }
  return n;
}

async function stateFor(m: Member, todayLocal: string) {
  const club = (await db(`rc_clubs?id=eq.${uid(m.club_id)}&select=*`))?.[0];
  if (!club) throw J({ error: "club not found", code: "noclub" }, 404);
  const members: Member[] = await db(`rc_members?club_id=eq.${uid(m.club_id)}&banned=is.false&select=*&order=joined_at.asc`) || [];
  const now = Date.now();
  const [upcoming, past, routes, myLogs, clubLogs] = await Promise.all([
    runsFor(m.club_id, new Date(now - 6 * 36e5).toISOString(), new Date(now + 120 * dayMs).toISOString(), false, 40),
    runsFor(m.club_id, new Date(now - 60 * dayMs).toISOString(), new Date(now - 6 * 36e5).toISOString(), true, 10),
    db(`rc_routes?club_id=eq.${uid(m.club_id)}&select=*&order=km.asc&limit=80`),
    db(`rc_logs?member_id=eq.${encodeURIComponent(sid(m.id))}&select=*&order=ran_on.desc,created_at.desc&limit=60`),
    db(`rc_logs?club_id=eq.${uid(m.club_id)}&ran_on=gte.${mondayOf(todayLocal)}&select=km,member_id&limit=5000`),
  ]);
  const week = mondayOf(todayLocal);
  const mine = myLogs || [];
  const myWeek = mine.filter((l: { ran_on: string }) => l.ran_on >= week);
  const kmOf = (rows: { km: number }[]) => Math.round(rows.reduce((t, r) => t + +r.km, 0) * 10) / 10;
  const longest = mine.reduce((t: number, l: { km: number }) => Math.max(t, +l.km), 0);
  return {
    joined: true,
    me: pub(m),
    club: {
      id: club.id, name: club.name, city: club.city, blurb: club.blurb,
      code: club.code, captain_id: club.captain_id, created_at: club.created_at,
      members: members.length,
    },
    members: members.map(pub),
    runs: upcoming,
    past,
    routes: routes || [],
    logs: mine,
    board: await boardFor(m.club_id, week, members),
    stats: {
      week_km: kmOf(myWeek),
      week_runs: myWeek.length,
      total_km: kmOf(mine),
      total_runs: mine.length,
      longest_km: Math.round(longest * 10) / 10,
      streak: streakOf(mine.map((l: { ran_on: string }) => l.ran_on), todayLocal),
      club_week_km: kmOf(clubLogs || []),
      club_week_runs: (clubLogs || []).length,
    },
  };
}

// A run must belong to the caller's club before they can touch it.
async function runIn(club_id: string, run: unknown) {
  const id = uid(run);
  if (!id || !isUuid(id)) throw J({ error: "which run?", code: "bad" }, 400);
  const r = (await db(`rc_runs?id=eq.${id}&club_id=eq.${uid(club_id)}&select=*`))?.[0];
  if (!r) throw J({ error: "run not found", code: "norun" }, 404);
  return r as Record<string, unknown>;
}
const canEditRun = (m: Member, r: Record<string, unknown>) => m.captain || r.host_id === m.id;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return J({ error: "POST only" }, 405);
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return J({ error: "bad json" }, 400);
  }
  const action = String(b.action || "");
  const today = isDate(b.today) ? String(b.today) : new Date().toISOString().slice(0, 10);

  try {
    switch (action) {
      // ---------- joining ----------
      case "club_find": {
        const code = str(b.code, 12).toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (code.length !== 6) return J({ error: "a join code is 6 characters", code: "badcode" }, 400);
        const c = (await db(`rc_clubs?code=eq.${code}&select=id,name,city,blurb,created_at`))?.[0];
        if (!c) return J({ error: "no club with that code", code: "badcode" }, 404);
        const n = await db(`rc_members?club_id=eq.${uid(c.id)}&banned=is.false&select=id`) || [];
        return J({ club: { name: c.name, city: c.city, blurb: c.blurb, members: n.length } });
      }
      case "club_create": {
        if (!okDevice(b.device)) return J({ error: "bad device", code: "baddevice" }, 400);
        const device = sid(b.device);
        const name = str(b.name, 40);
        const club = str(b.club, 48);
        if (!name) return J({ error: "what do we call you?", code: "noname" }, 400);
        if (!club) return J({ error: "name your club", code: "noclub" }, 400);
        const existing = (await db(`rc_members?id=eq.${encodeURIComponent(device)}&select=club_id`))?.[0];
        if (existing) return J({ error: "you're already in a club", code: "inclub" }, 409);
        const code = await mkCode();
        const c = (await ins("rc_clubs", {
          name: club, city: str(b.city, 40), blurb: str(b.blurb, 200), code, captain_id: device,
        }))[0];
        const m = (await ins("rc_members", {
          id: device, club_id: c.id, name, handle: handleClean(b.handle),
          strava: stravaClean(b.strava), pace: paceClean(b.pace), captain: true,
        }))[0];
        return J(await stateFor(m as Member, today));
      }
      case "club_join": {
        if (!okDevice(b.device)) return J({ error: "bad device", code: "baddevice" }, 400);
        const device = sid(b.device);
        const name = str(b.name, 40);
        if (!name) return J({ error: "what do we call you?", code: "noname" }, 400);
        const code = str(b.code, 12).toUpperCase().replace(/[^A-Z0-9]/g, "");
        const c = (await db(`rc_clubs?code=eq.${code}&select=id`))?.[0];
        if (!c) return J({ error: "no club with that code", code: "badcode" }, 404);
        const prev = (await db(`rc_members?id=eq.${encodeURIComponent(device)}&select=*`))?.[0];
        if (prev?.banned) return J({ error: "your spot in this club was removed", code: "banned" }, 403);
        const row = {
          club_id: c.id, name, handle: handleClean(b.handle),
          strava: stravaClean(b.strava), pace: paceClean(b.pace),
          // Founding a club makes you captain; joining one never does.
          captain: false,
        };
        const m = prev
          ? (await upd("rc_members", `id=eq.${encodeURIComponent(device)}`, row))[0]
          : (await ins("rc_members", { id: device, ...row }))[0];
        return J(await stateFor(m as Member, today));
      }
      case "state": {
        const id = sid(b.device);
        if (!id) return J({ joined: false });
        const rows = await db(`rc_members?id=eq.${encodeURIComponent(id)}&select=*`);
        const m = rows?.[0];
        if (!m) return J({ joined: false });
        if (m.banned) return J({ joined: false, code: "banned", error: "your spot in this club was removed" });
        return J(await stateFor(m as Member, today));
      }
      case "profile_edit": {
        const m = await guard(b.device);
        const name = str(b.name, 40) || m.name;
        const up = (await upd("rc_members", `id=eq.${encodeURIComponent(sid(m.id))}`, {
          name, handle: handleClean(b.handle), strava: stravaClean(b.strava), pace: paceClean(b.pace),
        }))[0];
        return J({ me: pub(up as Member) });
      }
      case "club_edit": {
        const m = await guard(b.device);
        if (!m.captain) return J({ error: "only the captain can edit the club", code: "notcaptain" }, 403);
        const c = (await upd("rc_clubs", `id=eq.${uid(m.club_id)}`, {
          name: str(b.name, 48) || undefined, city: str(b.city, 40), blurb: str(b.blurb, 200),
        }))[0];
        return J({ club: c });
      }
      case "leave": {
        const m = await guard(b.device);
        await del("rc_rsvp", `member_id=eq.${encodeURIComponent(sid(m.id))}`);
        await del("rc_logs", `member_id=eq.${encodeURIComponent(sid(m.id))}`);
        await del("rc_members", `id=eq.${encodeURIComponent(sid(m.id))}`);
        // A club without a captain can't be run.  When the captain walks,
        // the longest-standing member left inherits it.
        if (m.captain) {
          const next = (await db(
            `rc_members?club_id=eq.${uid(m.club_id)}&banned=is.false&select=id&order=joined_at.asc&limit=1`,
          ))?.[0];
          if (next) {
            await upd("rc_members", `id=eq.${encodeURIComponent(sid(next.id))}`, { captain: true });
            await upd("rc_clubs", `id=eq.${uid(m.club_id)}`, { captain_id: next.id });
          }
        }
        return J({ ok: true, joined: false });
      }
      case "club_recode": {
        const m = await guard(b.device);
        if (!m.captain) return J({ error: "only the captain can change the code", code: "notcaptain" }, 403);
        const code = await mkCode();
        await upd("rc_clubs", `id=eq.${uid(m.club_id)}`, { code });
        return J(await stateFor(m, today));
      }
      case "kick": {
        const m = await guard(b.device);
        if (!m.captain) return J({ error: "only the captain can do that", code: "notcaptain" }, 403);
        const who = sid(b.member);
        if (!who || who === m.id) return J({ error: "pick someone else", code: "bad" }, 400);
        const t = (await db(`rc_members?id=eq.${encodeURIComponent(who)}&club_id=eq.${uid(m.club_id)}&select=id`))?.[0];
        if (!t) return J({ error: "not in your club", code: "bad" }, 404);
        await del("rc_rsvp", `member_id=eq.${encodeURIComponent(who)}`);
        await del("rc_logs", `member_id=eq.${encodeURIComponent(who)}`);
        await del("rc_members", `id=eq.${encodeURIComponent(who)}`);
        return J(await stateFor(m, today));
      }

      // ---------- runs ----------
      case "run_create": {
        const m = await guard(b.device);
        const when = new Date(String(b.when || ""));
        if (!when.getTime()) return J({ error: "when is it?", code: "badtime" }, 400);
        const t = when.getTime();
        if (t < Date.now() - 2 * 36e5) return J({ error: "that's in the past", code: "past" }, 400);
        if (t > Date.now() + 200 * dayMs) return J({ error: "too far out", code: "badtime" }, 400);
        const mine = await db(
          `rc_runs?club_id=eq.${uid(m.club_id)}&created_at=gte.${new Date(Date.now() - dayMs).toISOString()}&select=id`,
        ) || [];
        if (mine.length >= 20) return J({ error: "that's a lot of runs for one day", code: "slow" }, 429);
        const paces = Array.isArray(b.paces) ? (b.paces as unknown[]).slice(0, 6).map(paceClean).filter(Boolean) : [];
        const route = isUuid(uid(b.route_id)) ? uid(b.route_id) : "";
        let lat = coord(b.lat, 90);
        let lon = coord(b.lon, 180);
        let km = num(b.km, 0, 300, 0);
        let meet = str(b.meet, 120);
        // A run built on a saved route inherits the route's start pin and
        // distance unless the host typed something else.
        if (route) {
          const r = (await db(`rc_routes?id=eq.${route}&club_id=eq.${uid(m.club_id)}&select=*`))?.[0];
          if (r) {
            if (lat == null) { lat = r.lat; lon = r.lon; }
            if (!km) km = +r.km;
            if (!meet) meet = r.start_name;
          }
        }
        const run = (await ins("rc_runs", {
          club_id: m.club_id, title: str(b.title, 60), starts_at: when.toISOString(),
          meet, lat, lon, km, route_id: route || null, paces,
          notes: str(b.notes, 400), host_id: m.id,
        }))[0];
        // The host is in by default — a run with nobody in it looks dead.
        await ins("rc_rsvp", { run_id: run.id, member_id: m.id, pace: m.pace });
        return J(await stateFor(m, today));
      }
      case "run_edit": {
        const m = await guard(b.device);
        const r = await runIn(m.club_id, b.run);
        if (!canEditRun(m, r)) return J({ error: "only the host or captain can edit this run", code: "notyours" }, 403);
        const patch: Record<string, unknown> = {};
        if (b.title != null) patch.title = str(b.title, 60);
        if (b.meet != null) patch.meet = str(b.meet, 120);
        if (b.notes != null) patch.notes = str(b.notes, 400);
        if (b.km != null) patch.km = num(b.km, 0, 300, 0);
        if ("lat" in b) patch.lat = coord(b.lat, 90);
        if ("lon" in b) patch.lon = coord(b.lon, 180);
        if (Array.isArray(b.paces)) patch.paces = (b.paces as unknown[]).slice(0, 6).map(paceClean).filter(Boolean);
        if (b.when != null) {
          const when = new Date(String(b.when));
          if (!when.getTime()) return J({ error: "when is it?", code: "badtime" }, 400);
          patch.starts_at = when.toISOString();
        }
        await upd("rc_runs", `id=eq.${uid(r.id)}`, patch);
        return J(await stateFor(m, today));
      }
      case "run_cancel": {
        const m = await guard(b.device);
        const r = await runIn(m.club_id, b.run);
        if (!canEditRun(m, r)) return J({ error: "only the host or captain can call it off", code: "notyours" }, 403);
        await upd("rc_runs", `id=eq.${uid(r.id)}`, { cancelled: b.on !== false });
        return J(await stateFor(m, today));
      }
      case "run_del": {
        const m = await guard(b.device);
        const r = await runIn(m.club_id, b.run);
        if (!canEditRun(m, r)) return J({ error: "only the host or captain can delete this", code: "notyours" }, 403);
        await del("rc_runs", `id=eq.${uid(r.id)}`);
        return J(await stateFor(m, today));
      }
      case "rsvp": {
        const m = await guard(b.device);
        const r = await runIn(m.club_id, b.run);
        if (r.cancelled) return J({ error: "that run was called off", code: "cancelled" }, 409);
        if (b.in === false) {
          await del("rc_rsvp", `run_id=eq.${uid(r.id)}&member_id=eq.${encodeURIComponent(sid(m.id))}`);
        } else {
          await db("rc_rsvp?on_conflict=run_id,member_id", {
            method: "POST",
            body: JSON.stringify({ run_id: r.id, member_id: m.id, pace: paceClean(b.pace) || m.pace }),
            headers: { Prefer: "resolution=merge-duplicates" },
          });
        }
        return J(await stateFor(m, today));
      }

      // ---------- routes ----------
      case "route_add": {
        const m = await guard(b.device);
        const name = str(b.name, 60);
        if (!name) return J({ error: "name the route", code: "noname" }, 400);
        const have = await db(`rc_routes?club_id=eq.${uid(m.club_id)}&select=id`) || [];
        if (have.length >= 80) return J({ error: "route library is full", code: "full" }, 429);
        const shape = ["loop", "out-and-back", "point-to-point"].includes(String(b.shape)) ? String(b.shape) : "loop";
        const surface = ["road", "trail", "track", "mixed"].includes(String(b.surface)) ? String(b.surface) : "";
        await ins("rc_routes", {
          club_id: m.club_id, name, km: num(b.km, 0, 300, 0), surface, shape,
          start_name: str(b.start_name, 120),
          lat: coord(b.lat, 90),
          lon: coord(b.lon, 180),
          link: httpish(b.link), notes: str(b.notes, 400), added_by: m.id,
        });
        return J(await stateFor(m, today));
      }
      case "route_del": {
        const m = await guard(b.device);
        const id = uid(b.route);
        if (!isUuid(id)) return J({ error: "which route?", code: "bad" }, 400);
        const r = (await db(`rc_routes?id=eq.${id}&club_id=eq.${uid(m.club_id)}&select=*`))?.[0];
        if (!r) return J({ error: "route not found", code: "bad" }, 404);
        if (!m.captain && r.added_by !== m.id) return J({ error: "only whoever added it, or the captain", code: "notyours" }, 403);
        await del("rc_routes", `id=eq.${id}`);
        return J(await stateFor(m, today));
      }

      // ---------- logs ----------
      case "log_add": {
        const m = await guard(b.device);
        const rawKm = +(b.km as number);
        if (!Number.isFinite(rawKm) || rawKm <= 0) return J({ error: "how far did you go?", code: "badkm" }, 400);
        const km = Math.min(200, rawKm);
        const ran_on = isDate(b.date) ? String(b.date) : today;
        // A log has to be plausibly recent — no back-filling a marathon
        // into last year to top the all-time board.
        if (ran_on > shiftDay(today, 1) || ran_on < shiftDay(today, -31)) {
          return J({ error: "pick a date in the last month", code: "baddate" }, 400);
        }
        const same = await db(
          `rc_logs?member_id=eq.${encodeURIComponent(sid(m.id))}&ran_on=eq.${ran_on}&select=id`,
        ) || [];
        if (same.length >= 6) return J({ error: "that's enough runs for one day", code: "slow" }, 429);
        let run_id: string | null = null;
        if (b.run) {
          const r = await runIn(m.club_id, b.run);
          run_id = r.id as string;
          // Logging a club run counts as having turned up to it.
          await db("rc_rsvp?on_conflict=run_id,member_id", {
            method: "POST",
            body: JSON.stringify({ run_id, member_id: m.id, pace: m.pace }),
            headers: { Prefer: "resolution=merge-duplicates" },
          });
        }
        await ins("rc_logs", {
          club_id: m.club_id, member_id: m.id, run_id, km,
          secs: int(b.secs, 0, 86400, 0), felt: int(b.felt, 0, 5, 0),
          note: str(b.note, 200), ran_on, link: httpish(b.link),
        });
        return J(await stateFor(m, today));
      }
      case "log_del": {
        const m = await guard(b.device);
        const id = uid(b.log);
        if (!isUuid(id)) return J({ error: "which log?", code: "bad" }, 400);
        const l = (await db(`rc_logs?id=eq.${id}&member_id=eq.${encodeURIComponent(sid(m.id))}&select=id`))?.[0];
        if (!l) return J({ error: "log not found", code: "bad" }, 404);
        await del("rc_logs", `id=eq.${id}`);
        return J(await stateFor(m, today));
      }
      case "board": {
        const m = await guard(b.device);
        const w = String(b.window || "week");
        const from = w === "all" ? null : w === "month" ? shiftDay(today, -30) : mondayOf(today);
        const members: Member[] = await db(`rc_members?club_id=eq.${uid(m.club_id)}&banned=is.false&select=*`) || [];
        return J({ window: w, board: await boardFor(m.club_id, from, members) });
      }

      default:
        return J({ error: "unknown action" }, 400);
    }
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(action, e);
    return J({ error: "something broke on our side" }, 500);
  }
});
