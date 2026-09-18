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
//   chat    — one club thread + a thread per run ("running 5 late").
// PURELY SOCIAL, deliberately: this is the communication bridge, not a
// tracker.  Strava keeps the kilometres; we keep who turned up.  So there is
// no distance, pace or time anywhere in here — the only number the app owns
// is attendance, recorded by a check-in on rc_rsvp, and that is what the
// board ranks and what runners verse each other on.
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
  const rsvps = await db(`rc_rsvp?run_id=in.(${ids})&select=run_id,member_id,pace,here`) || [];
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
      here: !!r.here,
    });
  }
  return rows.map((r: Record<string, unknown>) => ({ ...r, going: roster[r.id as string] || [] }));
}

// The board.  Ranked on TURNING UP, because attendance is the one number this
// app owns — nothing here comes from a tracker.  `shows` = club runs you
// checked in to inside the window; `streak` = consecutive weeks you turned up
// (all-time, so it survives the window switch); `coming` = runs you're in for
// next.
async function boardFor(club_id: string, fromDay: string | null, members: Member[], todayLocal: string) {
  const ids = members.map((m) => `"${sid(m.id)}"`).join(",");
  // All-time attendance for these members.  A member id belongs to exactly one
  // club, and club_join clears the old rows, so this can't leak another club's.
  const all = ids
    ? (await db(`rc_rsvp?member_id=in.(${ids})&here=is.true&select=member_id,run_id,here_on&limit=8000`) || [])
    : [];
  const daysBy: Record<string, string[]> = {};
  for (const r of all) if (r.here_on) (daysBy[r.member_id] ||= []).push(r.here_on);
  const shows: Record<string, number> = {};
  for (const r of all) {
    if (fromDay && !(r.here_on && r.here_on >= fromDay)) continue;
    shows[r.member_id] = (shows[r.member_id] || 0) + 1;
  }
  // Who has said they're in for what's still to come.
  const soon = await db(
    `rc_runs?club_id=eq.${uid(club_id)}&cancelled=is.false&starts_at=gte.${new Date().toISOString()}&select=id&limit=120`,
  ) || [];
  const coming: Record<string, number> = {};
  if (soon.length) {
    const rids = soon.map((r: { id: string }) => `"${uid(r.id)}"`).join(",");
    const rs = await db(`rc_rsvp?run_id=in.(${rids})&select=member_id&limit=4000`) || [];
    for (const r of rs) coming[r.member_id] = (coming[r.member_id] || 0) + 1;
  }
  return members
    .map((m) => {
      const days = (daysBy[m.id] || []).slice().sort();
      return {
        id: m.id, name: m.name, handle: m.handle, strava: m.strava, captain: m.captain,
        shows: shows[m.id] || 0,
        total: days.length,
        streak: streakOf(days, todayLocal),
        coming: coming[m.id] || 0,
        last: days.length ? days[days.length - 1] : "",
      };
    })
    .sort((a, z) => z.shows - a.shows || z.streak - a.streak || z.total - a.total || a.name.localeCompare(z.name));
}
// Consecutive Monday-start weeks you turned up at least once.  The current
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
  const [upcoming, past, routes, myHere, chatRows, postRows] = await Promise.all([
    runsFor(m.club_id, new Date(now - 6 * 36e5).toISOString(), new Date(now + 120 * dayMs).toISOString(), false, 40),
    runsFor(m.club_id, new Date(now - 60 * dayMs).toISOString(), new Date(now - 6 * 36e5).toISOString(), true, 10),
    db(`rc_routes?club_id=eq.${uid(m.club_id)}&select=*&order=km.asc&limit=80`),
    db(`rc_rsvp?member_id=eq.${encodeURIComponent(sid(m.id))}&here=is.true&select=run_id,here_on,here_at&order=here_on.desc&limit=400`),
    // One query gives the club thread's size and every run thread's, so the
    // UI can badge unread without a request per run.
    db(`rc_chat?club_id=eq.${uid(m.club_id)}&select=run_id&limit=4000`),
    db(`rc_posts?club_id=eq.${uid(m.club_id)}&select=id&limit=4000`),
  ]);
  const week = mondayOf(todayLocal);
  const mine = myHere || [];
  const days = mine.map((r: { here_on: string }) => r.here_on).filter(Boolean).sort();
  let chat_n = 0;
  const chat_runs: Record<string, number> = {};
  for (const c of chatRows || []) {
    if (c.run_id) chat_runs[c.run_id] = (chat_runs[c.run_id] || 0) + 1;
    else chat_n++;
  }
  const board = await boardFor(m.club_id, week, members, todayLocal);
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
    here: mine,
    board,
    chat_n,
    chat_runs,
    feed_n: (postRows || []).length,
    stats: {
      week_shows: days.filter((d: string) => d >= week).length,
      total_shows: days.length,
      streak: streakOf(days, todayLocal),
      last: days.length ? days[days.length - 1] : "",
      coming: upcoming.filter((r: { going: { id: string }[] }) => (r.going || []).some((g) => g.id === m.id)).length,
      club_week_shows: board.reduce((t, r) => t + r.shows, 0),
      club_streakers: board.filter((r) => r.streak > 0).length,
    },
  };
}

// A thread is either the club-wide one (run_id null) or one run's.
async function chatFor(club_id: string, run_id: string | null, limit = 80) {
  const q = run_id ? `&run_id=eq.${uid(run_id)}` : "&run_id=is.null";
  const rows = await db(
    `rc_chat?club_id=eq.${uid(club_id)}${q}&select=id,run_id,member_id,name,text,created_at&order=created_at.desc&limit=${limit}`,
  ) || [];
  return rows.reverse();
}

// ---------- the wall ----------
// Chat scrolls away; the wall is what the club keeps.  Reactions are a fixed
// set so nobody can stuff an emoji field with markup.
const PROPS = ["👏", "🔥", "💪", "🏃", "❤️", "😮"];

// A base64 data-url image goes into the public `pack` bucket (writes are
// service-role only; the client never touches storage directly).
async function uploadPhoto(dataUrl: unknown, path: string): Promise<string> {
  const m = String(dataUrl ?? "").match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);
  if (!m) throw J({ error: "that photo didn't come through", code: "badphoto" }, 400);
  let bytes: Uint8Array;
  try { bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0)); }
  catch { throw J({ error: "that photo didn't come through", code: "badphoto" }, 400); }
  if (bytes.length > 3_500_000) throw J({ error: "that photo’s too big — try a smaller one", code: "bigphoto" }, 400);
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  const full = `${path}.${ext}`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/pack/${full}`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": `image/${m[1]}`, "x-upsert": "true" },
    body: bytes,
  });
  if (!up.ok) { console.error("upload", await up.text()); throw J({ error: "the photo wouldn't upload" }, 500); }
  return `${SUPABASE_URL}/storage/v1/object/public/pack/${full}`;
}
const PHOTO_PREFIX = () => `${SUPABASE_URL}/storage/v1/object/public/pack/`;
// Only ever deletes something inside our own bucket, and only by the exact
// URL we minted for that post.
async function dropPhoto(url: unknown) {
  const u = String(url ?? "");
  if (!u.startsWith(PHOTO_PREFIX())) return;
  const path = u.slice(PHOTO_PREFIX().length);
  if (!/^[A-Za-z0-9._\/-]{1,200}$/.test(path)) return;
  try {
    await fetch(`${SUPABASE_URL}/storage/v1/object/pack/${path}`, {
      method: "DELETE",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
  } catch (e) { console.error("dropPhoto", e); }
}

// The app writes its own entries so the wall is a record of the club, not an
// empty box waiting for someone brave enough to post first.  A failure here
// must never sink the action that triggered it.
async function autoPost(m: Member, kind: string, extra: Record<string, unknown> = {}) {
  try {
    await ins("rc_posts", { club_id: m.club_id, member_id: m.id, name: m.name, kind, text: "", ...extra });
  } catch (e) { console.error("autoPost", kind, e); }
}

// Posts newest first with their reactions and comments attached, so the feed
// renders from one round trip.  Pinned posts ride the first page only — they’d
// otherwise reappear on every page of the cursor.
async function feedFor(club_id: string, meId: string, before = "", limit = 20) {
  const cut = /^\d{4}-\d{2}-\d{2}T[\d:.]+/.test(before) ? `&created_at=lt.${encodeURIComponent(before)}` : "";
  const [pins, rest] = await Promise.all([
    cut ? Promise.resolve([]) : db(`rc_posts?club_id=eq.${uid(club_id)}&pinned=is.true&select=*&order=created_at.desc&limit=3`),
    db(`rc_posts?club_id=eq.${uid(club_id)}&pinned=is.false${cut}&select=*&order=created_at.desc&limit=${limit}`),
  ]);
  const tail = rest || [];
  const posts = [...(pins || []), ...tail];
  const out = { posts: [] as unknown[], more: tail.length >= limit, cursor: tail.length ? tail[tail.length - 1].created_at : "" };
  if (!posts.length) return out;
  const ids = posts.map((p: { id: string }) => `"${uid(p.id)}"`).join(",");
  const [props, comments] = await Promise.all([
    db(`rc_props?post_id=in.(${ids})&select=post_id,member_id,emoji`),
    db(`rc_comments?post_id=in.(${ids})&select=*&order=created_at.asc&limit=600`),
  ]);
  const pByPost: Record<string, { member_id: string; emoji: string }[]> = {};
  for (const x of props || []) (pByPost[x.post_id] ||= []).push(x);
  const cByPost: Record<string, unknown[]> = {};
  for (const c of comments || []) {
    (cByPost[c.post_id] ||= []).push({ id: c.id, member_id: c.member_id, name: c.name, text: c.text, created_at: c.created_at });
  }
  out.posts = posts.map((p: Record<string, unknown>) => {
    const pr = pByPost[p.id as string] || [];
    const tally: Record<string, number> = {};
    for (const x of pr) tally[x.emoji] = (tally[x.emoji] || 0) + 1;
    return {
      id: p.id, member_id: p.member_id, name: p.name, kind: p.kind, text: p.text,
      run_id: p.run_id, photo: p.photo, n: p.n, pinned: p.pinned, created_at: p.created_at,
      props: tally, props_n: pr.length,
      mine: pr.find((x) => x.member_id === meId)?.emoji || "",
      comments: cByPost[p.id as string] || [],
    };
  });
  return out;
}

// A post must belong to the caller's club before they can touch it.
async function postIn(club_id: string, post: unknown) {
  const id = uid(post);
  if (!isUuid(id)) throw J({ error: "which post?", code: "bad" }, 400);
  const row = (await db(`rc_posts?id=eq.${id}&club_id=eq.${uid(club_id)}&select=*`))?.[0];
  if (!row) throw J({ error: "post not found", code: "nopost" }, 404);
  return row as Record<string, unknown>;
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
        // Switching clubs leaves the old club's RSVPs behind, which would
        // otherwise follow you onto the new club's board.
        if (prev && prev.club_id !== c.id) {
          await del("rc_rsvp", `member_id=eq.${encodeURIComponent(device)}`);
        }
        const m = prev
          ? (await upd("rc_members", `id=eq.${encodeURIComponent(device)}`, row))[0]
          : (await ins("rc_members", { id: device, ...row }))[0];
        // New face in this club — the wall says hello so nobody arrives to silence.
        if (!prev || prev.club_id !== c.id) await autoPost(m as Member, "joined");
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
        await del("rc_chat", `member_id=eq.${encodeURIComponent(sid(m.id))}`);
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
        await del("rc_chat", `member_id=eq.${encodeURIComponent(who)}`);
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
        await autoPost(m, "called", { run_id: run.id });
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

      // ---------- turning up ----------
      case "checkin": {
        const m = await guard(b.device);
        const r = await runIn(m.club_id, b.run);
        if (r.cancelled) return J({ error: "that run was called off", code: "cancelled" }, 409);
        // You can't confirm you turned up to something that hasn't started.
        if (new Date(String(r.starts_at)).getTime() > Date.now() + 30 * 6e4) {
          return J({ error: "check in once the run starts", code: "early" }, 400);
        }
        const on = b.on !== false;
        const patch = {
          here: on,
          here_at: on ? new Date().toISOString() : null,
          here_on: on ? today : null,
        };
        const q = `run_id=eq.${uid(r.id)}&member_id=eq.${encodeURIComponent(sid(m.id))}`;
        const ex = (await db(`rc_rsvp?${q}&select=member_id`))?.[0];
        // Turning up without having said you would is normal, so create the
        // row if it isn't there rather than refusing.
        if (ex) await upd("rc_rsvp", q, patch);
        else await ins("rc_rsvp", { run_id: r.id, member_id: m.id, pace: m.pace, ...patch });
        if (on) {
          // One wall entry per member per run, however many times they toggle.
          const had = (await db(
            `rc_posts?club_id=eq.${uid(m.club_id)}&member_id=eq.${encodeURIComponent(sid(m.id))}` +
              `&run_id=eq.${uid(r.id as string)}&kind=eq.showed&select=id`,
          )) || [];
          if (!had.length) {
            // `n` snapshots their total turn-ups now, so "that's their 12th"
            // stays true no matter what happens later.
            const all = (await db(
              `rc_rsvp?member_id=eq.${encodeURIComponent(sid(m.id))}&here=is.true&select=run_id&limit=4000`,
            )) || [];
            await autoPost(m, "showed", { run_id: r.id, n: all.length });
          }
        }
        return J(await stateFor(m, today));
      }
      case "versus": {
        const m = await guard(b.device);
        const who = sid(b.member);
        if (!who || who === m.id) return J({ error: "pick someone else", code: "bad" }, 400);
        const other = (await db(`rc_members?id=eq.${encodeURIComponent(who)}&club_id=eq.${uid(m.club_id)}&banned=is.false&select=*`))?.[0];
        if (!other) return J({ error: "not in your club", code: "bad" }, 404);
        const w = String(b.window || "month");
        const from = w === "all" ? null : w === "week" ? mondayOf(today) : shiftDay(today, -30);
        const rows = await db(
          `rc_rsvp?member_id=in.("${sid(m.id)}","${sid(who)}")&here=is.true&select=member_id,run_id,here_on&limit=8000`,
        ) || [];
        const side = (id: string, name: string) => {
          const all = rows.filter((r: { member_id: string }) => r.member_id === id);
          const days = all.map((r: { here_on: string }) => r.here_on).filter(Boolean).sort();
          return {
            id, name,
            shows: from ? days.filter((d: string) => d >= from).length : days.length,
            total: days.length,
            streak: streakOf(days, today),
            last: days.length ? days[days.length - 1] : "",
          };
        };
        // Runs you both turned up to — the point of a club.
        const mineRuns = new Set(rows.filter((r: { member_id: string }) => r.member_id === m.id).map((r: { run_id: string }) => r.run_id));
        const together = rows.filter((r: { member_id: string; run_id: string }) => r.member_id === who && mineRuns.has(r.run_id)).length;
        return J({ window: w, me: side(m.id, m.name), them: side(who, other.name), together });
      }

      // ---------- chat ----------
      case "chat_get": {
        const m = await guard(b.device);
        const run = b.run ? (await runIn(m.club_id, b.run)).id as string : null;
        return J({ run, chat: await chatFor(m.club_id, run) });
      }
      case "chat_send": {
        const m = await guard(b.device);
        const text = str(b.text, 500);
        if (!text) return J({ error: "say something", code: "empty" }, 400);
        const run = b.run ? (await runIn(m.club_id, b.run)).id as string : null;
        const recent = await db(
          `rc_chat?member_id=eq.${encodeURIComponent(sid(m.id))}&created_at=gte.${new Date(Date.now() - 5 * 6e4).toISOString()}&select=id`,
        ) || [];
        if (recent.length >= 30) return J({ error: "slow down a second", code: "slow" }, 429);
        await ins("rc_chat", { club_id: m.club_id, run_id: run, member_id: m.id, name: m.name, text });
        return J({ run, chat: await chatFor(m.club_id, run) });
      }
      case "chat_del": {
        const m = await guard(b.device);
        const id = uid(b.msg);
        if (!isUuid(id)) return J({ error: "which message?", code: "bad" }, 400);
        const row = (await db(`rc_chat?id=eq.${id}&club_id=eq.${uid(m.club_id)}&select=id,member_id,run_id`))?.[0];
        if (!row) return J({ error: "message not found", code: "bad" }, 404);
        // Your own, or the captain's call — a club you can't moderate is a
        // club nobody wants to run.
        if (!m.captain && row.member_id !== m.id) return J({ error: "not yours to delete", code: "notyours" }, 403);
        await del("rc_chat", `id=eq.${id}`);
        return J({ run: row.run_id || null, chat: await chatFor(m.club_id, row.run_id || null) });
      }

      // ---------- the wall ----------
      case "feed_get": {
        const m = await guard(b.device);
        return J(await feedFor(m.club_id, m.id, str(b.before, 40)));
      }
      case "post_add": {
        const m = await guard(b.device);
        const text = str(b.text, 600);
        const photo = b.photo ? await uploadPhoto(b.photo, `posts/${uid(m.club_id).slice(0, 8)}-${Date.now()}`) : "";
        // A post is words, a picture, or both — but not nothing.
        if (!text && !photo) return J({ error: "say something, or add a photo", code: "empty" }, 400);
        const run = b.run ? (await runIn(m.club_id, b.run)).id as string : null;
        const recent = await db(
          `rc_posts?member_id=eq.${encodeURIComponent(sid(m.id))}&kind=eq.said&created_at=gte.${new Date(Date.now() - 36e5).toISOString()}&select=id`,
        ) || [];
        if (recent.length >= 10) return J({ error: "give the wall a breather", code: "slow" }, 429);
        await ins("rc_posts", {
          club_id: m.club_id, member_id: m.id, name: m.name, kind: "said",
          text, run_id: run, photo: photo || null,
        });
        return J(await feedFor(m.club_id, m.id));
      }
      case "post_del": {
        const m = await guard(b.device);
        const row = await postIn(m.club_id, b.post);
        // Your own, or the captain's call.
        if (!m.captain && row.member_id !== m.id) return J({ error: "not yours to delete", code: "notyours" }, 403);
        await del("rc_posts", `id=eq.${uid(row.id as string)}`);
        await dropPhoto(row.photo);
        return J(await feedFor(m.club_id, m.id));
      }
      case "post_pin": {
        const m = await guard(b.device);
        if (!m.captain) return J({ error: "the captain pins posts", code: "notcaptain" }, 403);
        const row = await postIn(m.club_id, b.post);
        await upd("rc_posts", `id=eq.${uid(row.id as string)}`, { pinned: b.on !== false });
        return J(await feedFor(m.club_id, m.id));
      }
      case "post_prop": {
        const m = await guard(b.device);
        const row = await postIn(m.club_id, b.post);
        const q = `post_id=eq.${uid(row.id as string)}&member_id=eq.${encodeURIComponent(sid(m.id))}`;
        const emoji = String(b.emoji ?? "");
        const ex = (await db(`rc_props?${q}&select=emoji`))?.[0];
        // Tapping the one you already gave takes it back; anything else swaps it.
        if (!emoji || (ex && ex.emoji === emoji)) {
          await del("rc_props", q);
        } else {
          if (!PROPS.includes(emoji)) return J({ error: "pick one of the reactions", code: "bad" }, 400);
          if (ex) await upd("rc_props", q, { emoji });
          else await ins("rc_props", { post_id: row.id, member_id: m.id, emoji });
        }
        return J(await feedFor(m.club_id, m.id));
      }
      case "comment_add": {
        const m = await guard(b.device);
        const row = await postIn(m.club_id, b.post);
        const text = str(b.text, 300);
        if (!text) return J({ error: "say something", code: "empty" }, 400);
        const recent = await db(
          `rc_comments?member_id=eq.${encodeURIComponent(sid(m.id))}&created_at=gte.${new Date(Date.now() - 5 * 6e4).toISOString()}&select=id`,
        ) || [];
        if (recent.length >= 30) return J({ error: "slow down a second", code: "slow" }, 429);
        await ins("rc_comments", { post_id: row.id, club_id: m.club_id, member_id: m.id, name: m.name, text });
        return J(await feedFor(m.club_id, m.id));
      }
      case "comment_del": {
        const m = await guard(b.device);
        const id = uid(b.comment);
        if (!isUuid(id)) return J({ error: "which comment?", code: "bad" }, 400);
        const row = (await db(`rc_comments?id=eq.${id}&club_id=eq.${uid(m.club_id)}&select=id,member_id`))?.[0];
        if (!row) return J({ error: "comment not found", code: "bad" }, 404);
        if (!m.captain && row.member_id !== m.id) return J({ error: "not yours to delete", code: "notyours" }, 403);
        await del("rc_comments", `id=eq.${id}`);
        return J(await feedFor(m.club_id, m.id));
      }

      case "board": {
        const m = await guard(b.device);
        const w = String(b.window || "week");
        const from = w === "all" ? null : w === "month" ? shiftDay(today, -30) : mondayOf(today);
        const members: Member[] = await db(`rc_members?club_id=eq.${uid(m.club_id)}&banned=is.false&select=*`) || [];
        return J({ window: w, board: await boardFor(m.club_id, from, members, today) });
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
