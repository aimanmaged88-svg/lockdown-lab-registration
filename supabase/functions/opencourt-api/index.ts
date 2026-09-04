import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Certified Hooper (codename OpenCourt) — Sydney pickup basketball. Sister product of
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
// Aussie mobile → canonical 04xxxxxxxx. Accepts +61 4.., 04.., spaces/dashes.
// Returns "" when nothing was supplied, null when what was supplied is junk.
const phoneClean = (v: unknown): string | null => {
  const raw = String(v ?? "").trim();
  if (!raw) return "";
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+61")) d = "0" + d.slice(3);
  else if (d.startsWith("61") && d.length === 11) d = "0" + d.slice(2);
  d = d.replace(/\D/g, "");
  return /^04\d{8}$/.test(d) ? d : null;
};
// app settings (key/value) — invite_only gates closed testing
// The repair board for one court: what's broken, who's on it, what got fixed.
// Fixed items hang around for 5 days so the court sees the good news.
async function issuesFor(court_key: string, viewer?: string) {
  const cutoff = new Date(Date.now() - 5 * 864e5).toISOString();
  const rows = await db(
    `oc_court_issues?court_key=eq.${encodeURIComponent(sid(court_key))}&hidden=is.false&or=(status.neq.fixed,fixed_at.gte.${cutoff})&select=*&order=created_at.desc&limit=40`,
  ) || [];
  if (!rows.length) return [];
  const ids = rows.map((r: { id: string }) => `"${sid(r.id)}"`).join(",");
  const bumps = await db(`oc_issue_bumps?issue_id=in.(${ids})&select=issue_id,player_id`) || [];
  const count: Record<string, number> = {};
  const mine: Record<string, boolean> = {};
  for (const b of bumps) {
    count[b.issue_id] = (count[b.issue_id] || 0) + 1;
    if (viewer && b.player_id === viewer) mine[b.issue_id] = true;
  }
  const rank = (s: string) => (s === "onit" ? 0 : s === "open" ? 1 : 2);
  return rows
    .map((r: Record<string, unknown>) => ({
      id: r.id, kind: r.kind, text: r.text, photo_url: r.photo_url,
      player_id: r.player_id, name: r.name, ig: r.ig, status: r.status,
      fixer_id: r.fixer_id, fixer_name: r.fixer_name,
      fixed_name: r.fixed_name, fixed_photo: r.fixed_photo, fixed_at: r.fixed_at,
      created_at: r.created_at,
      bumps: count[r.id as string] || 0,
      bumped: !!mine[r.id as string],
    }))
    .sort((a, z) => rank(a.status as string) - rank(z.status as string));
}
async function settingOn(key: string): Promise<boolean> {
  try {
    const r = await db(`oc_settings?key=eq.${encodeURIComponent(key)}&select=value`);
    return r?.[0]?.value === "1";
  } catch (_e) { return false; }
}
// Australia-wide court bounds (mainland + Tas). Cities open one at a time,
// but the map is national — a court anywhere in the country can be added.
const inAus = (lat: number, lon: number) =>
  lat >= -44.0 && lat <= -9.5 && lon >= 112.0 && lon <= 154.5;
const inviteClean = (v: unknown) => String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
const AMBIG = "ILO01";
function mkInvite(): string {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789".split("").filter((c) => !AMBIG.includes(c));
  let out = "";
  const buf = new Uint32Array(6);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 6; i++) out += abc[buf[i] % abc.length];
  return out;
}
const emailClean = (v: unknown) => {
  const e = String(v ?? "").trim().toLowerCase().slice(0, 120);
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,24}$/.test(e) ? e : "";
};
const FORMATS = ["5v5", "4v4", "3v3", "2v2", "1v1", "21", "shootaround"];
const BANNED_MSG = "this account is banned from Certified Hooper";
// The coach's own IG handles: any sign-up with one of these is instantly
// verified + coach-flagged (desk pings). Keep lowercase.
const OWNER_IGS = ["uncsthoughts", "lockdownlab33"];

// Pull [lat, lon] out of a Google Maps URL or a plain "lat, lon" string.
// Handles @lat,lon / !3d..!4d.. / ?q=lat,lon / ?ll= / plain paste. Requires
// 3+ decimals so it doesn't grab random numbers.
function parseCoords(s: string): [number, number] | null {
  if (!s) return null;
  const pats = [
    /@(-?\d{1,3}\.\d{3,}),(-?\d{1,3}\.\d{3,})/,
    /!3d(-?\d{1,3}\.\d{3,})!4d(-?\d{1,3}\.\d{3,})/,
    /[?&](?:q|query|ll|center|destination|sll)=(-?\d{1,3}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/,
    /(-?\d{1,3}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/,
  ];
  for (const p of pats) { const m = s.match(p); if (m) return [+m[1], +m[2]]; }
  return null;
}
// Resolve a Google Maps link (incl. short goo.gl / maps.app.goo.gl) to coords.
// SSRF-safe: only follows google/goo.gl hosts, and only ever returns coordinates.
async function resolveMapsUrl(url: string): Promise<[number, number] | null> {
  const direct = parseCoords(url);
  if (direct) return direct;
  let u: URL; try { u = new URL(url); } catch { return null; }
  const host = u.hostname.toLowerCase();
  const okHost = /(^|\.)google\.[a-z.]+$/.test(host) || host === "goo.gl" || host === "maps.app.goo.gl" || host === "g.co" || host === "maps.google.com";
  if (!okHost) return null;
  try {
    const r = await fetch(url, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (compatible; HoopsHeaven/1.0)" } });
    let c = parseCoords(r.url);
    if (!c) c = parseCoords((await r.text()).slice(0, 200000));
    return c;
  } catch (_e) { return null; }
}
// Upload a base64 data-url image to the public `heaven` bucket, return its URL.
async function uploadImg(dataUrl: string, path: string): Promise<string> {
  const m = dataUrl.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);
  if (!m) throw new Error("bad image");
  const bytes = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
  if (bytes.length > 3_500_000) throw new Error("image too big");
  const full = `${path}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/heaven/${full}`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": `image/${m[1]}`, "x-upsert": "true" },
    body: bytes,
  });
  if (!up.ok) { console.error("upload", await up.text()); throw new Error("upload failed"); }
  return `${SUPABASE_URL}/storage/v1/object/public/heaven/${full}`;
}
// Only accept a photo URL that WE minted (our own public `heaven` bucket) — so a
// coach can carry a player-suggested court's already-uploaded photo onto the new
// court without us ever storing an arbitrary attacker-controlled URL.
function ownPhoto(u: unknown): string {
  const s = str(u, 300);
  return s.startsWith(`${SUPABASE_URL}/storage/v1/object/public/heaven/`) ? s : "";
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

// Normalise the rich "get ready" court details a coach fills in at the desk.
// Everything is optional and bounded; water is a small enum so the app can
// render the right icon and derive the leaving-the-house checklist.
function infoOf(b: Record<string, unknown>) {
  const i = (b.info || {}) as Record<string, unknown>;
  const water = ["bubbler", "tap", "none"].includes(String(i.water)) ? String(i.water) : "";
  const bring = Array.isArray(i.bring) ? (i.bring as unknown[]).slice(0, 10).map(x => str(x, 60)).filter(Boolean) : [];
  return {
    surface: str(i.surface, 40),
    hoops: num(i.hoops, 0, 40, 0),
    rim: str(i.rim, 40),
    cost: str(i.cost, 40) || "Free",
    best: str(i.best, 80),
    water,
    toilets: i.toilets === true,
    parking: str(i.parking, 60),
    shade: i.shade === true,
    seating: i.seating === true,
    shop: i.shop === true,
    bring,
    tips: str(i.tips, 400),
  };
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

// community.html review panel: its OWN PIN (sha256 in oc_settings.cc_pin), never the
// desk/coach logins — a leaked PIN can't reach the desk. 8 misses → locked an hour.
async function ccAuth(pin: unknown): Promise<{ ok: boolean; err: string; code: number }> {
  const p = str(pin, 8);
  if (!/^\d{4,8}$/.test(p)) return { ok: false, err: "enter the PIN", code: 400 };
  const g0 = (await db(`oc_login_guard?who=eq.cc_admin`))?.[0];
  if (g0?.locked_until && new Date(g0.locked_until) > new Date()) return { ok: false, err: "too many tries — locked for an hour", code: 429 };
  await new Promise((r) => setTimeout(r, 400));
  const want = (await db(`oc_settings?key=eq.cc_pin&select=value`))?.[0]?.value || "";
  const h = await sha256(`cc:${p}:certifiedhooper`);
  if (!want || h !== want) {
    const fails = (g0?.fails || 0) + 1;
    await db(`oc_login_guard?on_conflict=who`, { method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ who: "cc_admin", fails, locked_until: fails >= 8 ? new Date(Date.now() + 3600e3).toISOString() : null }) });
    return { ok: false, err: "wrong PIN", code: 401 };
  }
  if (g0) await db(`oc_login_guard?who=eq.cc_admin`, { method: "DELETE" });
  return { ok: true, err: "", code: 200 };
}
type Tally = Record<string, { up: number; down: number }>;
async function ccTally(ids: string[], device = ""): Promise<{ tally: Tally; mine: Record<string, boolean> }> {
  const tally: Tally = {}; const mine: Record<string, boolean> = {};
  if (!ids.length) return { tally, mine };
  const vs = await db(`oc_cc_votes?cc_id=in.(${ids.map(sid).join(",")})&select=cc_id,device,up`) || [];
  for (const v of vs) { const t = tally[v.cc_id] ||= { up: 0, down: 0 }; if (v.up) t.up++; else t.down++; if (device && v.device === device) mine[v.cc_id] = !!v.up; }
  return { tally, mine };
}

// Which of these player ids are account-verified?
async function verifiedSet(ids: string[]) {
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!uniq.length) return new Set<string>();
  const rows = await db(`oc_players?id=in.(${uniq.map(i => `"${sid(i)}"`).join(",")})&verified=is.true&select=id`);
  return new Set<string>((rows || []).map((r: Record<string, unknown>) => r.id as string));
}

// The write gate: device must be registered (terms accepted) and clean.
// Returns {p} with the REGISTERED identity, or {err} as a ready Response.
async function guard(pid: string): Promise<{ p?: { id: string; name: string; ig: string; verified: boolean; checkins: number }; err?: Response }> {
  const id = str(pid, 64);
  if (!id || id.length < 8) return { err: J({ error: "sign in first", code: "terms" }, 401) };
  const rows = await db(`oc_players?id=eq.${encodeURIComponent(id)}&select=id,name,ig,tiktok,email,accepted_at,banned,verified,checkins_total`);
  const row = rows?.[0];
  if (!row || !row.accepted_at) return { err: J({ error: "sign in and accept the house rules first", code: "terms" }, 401) };
  if (row.banned || await bansHit([row.id, row.ig, row.tiktok, row.email])) return { err: J({ error: BANNED_MSG, code: "banned" }, 403) };
  return { p: { id: row.id, name: row.name, ig: row.ig, verified: !!row.verified, checkins: Number(row.checkins_total) || 0 } };
}

// NBA-style tier from lifetime check-ins. Purely for hype — the community
// rating is separate. Each tier has a colour the card glows with.
function tierOf(n: number) {
  const T = [
    { min: 100, key: "legend", name: "Legend", color: "#FFC93C" },
    { min: 50, key: "franchise", name: "Franchise", color: "#B98CFF" },
    { min: 25, key: "allstar", name: "All-Star", color: "#FF6A2B" },
    { min: 10, key: "starter", name: "Starter", color: "#2ECC71" },
    { min: 3, key: "rotation", name: "Rotation", color: "#5BC9FF" },
    { min: 0, key: "rookie", name: "Rookie", color: "#8A9099" },
  ];
  const idx = T.findIndex(t => n >= t.min);
  const cur = T[idx];
  const nextUp = idx > 0 ? T[idx - 1] : null; // the tier above (T is high→low)
  return { key: cur.key, name: cur.name, color: cur.color, min: cur.min, next: nextUp ? { name: nextUp.name, at: nextUp.min } : null };
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


// Metres between two lat/lon points (haversine).
function metres(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371000, x = (bLat - aLat) * Math.PI / 180, y = (bLon - aLon) * Math.PI / 180;
  const h = Math.sin(x / 2) ** 2 + Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * Math.sin(y / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
// Authoritative court coordinates — the 971 base courts come from the public
// courts.json (fetched once, cached in memory across warm invocations); custom
// courts come from oc_courts. This is the ground truth the client can't fake.
let GEO_CACHE: Record<string, [number, number]> | null = null;
let GEO_AT = 0;
async function loadGeo(): Promise<Record<string, [number, number]>> {
  if (GEO_CACHE && Date.now() - GEO_AT < 6 * 36e5) return GEO_CACHE;
  try {
    const d = await (await fetch("https://lockdown-lab-registration.netlify.app/courts.json")).json();
    const m: Record<string, [number, number]> = {};
    for (const c of d.courts || []) {
      const k = "oc_" + (+c.lat).toFixed(5) + "_" + (+c.lon).toFixed(5);
      m[k] = [+c.lat, +c.lon];
    }
    GEO_CACHE = m; GEO_AT = Date.now();
  } catch (_e) { if (!GEO_CACHE) GEO_CACHE = {}; }
  return GEO_CACHE;
}
async function courtCoords(key: string): Promise<[number, number] | null> {
  const geo = await loadGeo();
  if (geo[key]) return geo[key];
  const rows = await db(`oc_courts?key=eq.${encodeURIComponent(key)}&select=lat,lon`);
  const r = rows?.[0];
  return (r && r.lat != null && r.lon != null) ? [r.lat as number, r.lon as number] : null;
}
async function courtRadius(key: string) {
  const rows = await db(`oc_courts?key=eq.${encodeURIComponent(key)}&select=radius_m`);
  const r = rows?.[0]?.radius_m;
  return (typeof r === "number" && r >= 80 && r <= 2000) ? r : 300; // default 300m geofence
}

// Active check-ins at a court (2h window), oldest first, + off-app headcount.
async function hereFor(courtKey: string) {
  const since = new Date(Date.now() - 2 * 36e5).toISOString();
  const rows: Record<string, unknown>[] = await db(`oc_checkins?court_key=eq.${encodeURIComponent(courtKey)}&checked_in_at=gte.${since}&select=player_id,name,ig,verified,via,extra,checked_in_at&order=checked_in_at.asc`);
  const list = rows.map(r => ({ id: r.player_id, name: r.name, ig: r.ig, verified: r.verified, via: r.via, extra: Number(r.extra) || 0, at: r.checked_in_at }));
  const extra = rows.reduce((a, r) => a + (Number(r.extra) || 0), 0);
  return { list, total: list.length + extra, extra };
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

// Messages for a run's chat, oldest first, with a verified flag per author.
async function chatFor(runId: string) {
  const rows: Record<string, unknown>[] = await db(`oc_run_chat?run_id=eq.${encodeURIComponent(runId)}&select=id,player_id,name,ig,text,created_at&order=created_at.asc&limit=100`);
  const vs = await verifiedSet((rows || []).map(r => r.player_id as string));
  return (rows || []).map(r => ({ id: r.id, pid: r.player_id, name: r.name, ig: r.ig, text: r.text, at: r.created_at, v: vs.has(r.player_id as string) }));
}

// ---- Closed-app web push (payload-free "tickle"; the SW pulls the exact
// message via notif_pull). Reuses the Lab's VAPID keypair — same Supabase
// project, no new keys needed. Every send is best-effort: a dead endpoint is
// dropped and never blocks the request that triggered it.
const VAPID_PUB_B64U = "BIyZs-g6WqeAhyk4NQsAZ7rq-AoyWOTptKUZkE5z-hvvn61vVW9F1Ord5VbySnizrNu9OrLD4kOE0SMRzbcZRgI";
const VAPID_PRIV_PKCS8_B64 = "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgqooHymUAWgKq2V6W4tZmxqY6bpDs6fLPJJDlwHBcabihRANCAASMmbPoOlqngIcpODULAGe66vgKMljk6bSlGZBOc/ob75+tb1VvRdTq3eVW8kp4s6zbvTqyw+JDhNEjEc23GUYC";
let vapidKey: CryptoKey | null = null;
async function getVapidKey() {
  if (!vapidKey) {
    const raw = Uint8Array.from(atob(VAPID_PRIV_PKCS8_B64), c => c.charCodeAt(0));
    vapidKey = await crypto.subtle.importKey("pkcs8", raw, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  }
  return vapidKey;
}
const b64u = (x: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(x))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function vapidAuth(endpoint: string) {
  const aud = new URL(endpoint).origin;
  const enc = new TextEncoder();
  const header = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "mailto:aimanmaged88@gmail.com" })));
  const unsigned = header + "." + claims;
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, await getVapidKey(), enc.encode(unsigned));
  return `vapid t=${unsigned}.${b64u(sig)}, k=${VAPID_PUB_B64U}`;
}
async function sendHH(pids: string[], notif: { title: string; body: string; tag?: string; url?: string }) {
  try {
    const uniq = [...new Set(pids.filter(Boolean))];
    if (!uniq.length) return;
    const subs: Record<string, unknown>[] = await db(`oc_push?player_id=in.(${uniq.map(i => `"${sid(i)}"`).join(",")})&select=id,player_id,sub`) || [];
    if (!subs.length) return;
    const withSub = [...new Set(subs.map(s => s.player_id as string))];
    await db(`oc_notif`, { method: "POST", body: JSON.stringify(withSub.map(pid => ({ player_id: pid, title: notif.title, body: notif.body, tag: notif.tag || "hh", url: notif.url || "", shown: false, created_at: new Date().toISOString() }))) });
    await Promise.all(subs.map(async row => {
      try {
        const ep = (row.sub as Record<string, unknown>)?.endpoint as string;
        if (!ep) return;
        const r = await fetch(ep, { method: "POST", headers: { Authorization: await vapidAuth(ep), TTL: "86400", Urgency: "high" } });
        if (r.status === 404 || r.status === 410) await db(`oc_push?id=eq.${row.id}`, { method: "DELETE" });
      } catch (_e) { /* one dead endpoint never blocks the rest */ }
    }));
  } catch (_e) { /* push is always best-effort */ }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return J({ error: "POST only" }, 405);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return J({ error: "bad json" }, 400); }
  const action = str(b.action, 40);

  try {
    switch (action) {

      // Sign-in: device id + name + a real social (Instagram OR TikTok) or an
      // email + terms acceptance. The social handle is how the coach verifies
      // you're a real person. Re-registering refreshes handles; bans are refused.
      case "register": {
        const p = (b.player || {}) as Record<string, unknown>;
        const id = str(p.id, 64), name = str(p.name, 40);
        const ig = igClean(p.ig), tiktok = igClean(p.tiktok), email = emailClean(p.email);
        const phone = phoneClean(p.phone);
        if (!id || !/^[a-zA-Z0-9._-]{8,64}$/.test(id) || !name) return J({ error: "put a name on it" }, 400);
        if (!ig && !tiktok && !email) return J({ error: "sign in with your Instagram or TikTok — or a real email" }, 400);
        if (phone === null) return J({ error: "that mobile doesn't look right — use 04xx xxx xxx", code: "badphone" }, 400);
        if (b.accept !== true) return J({ error: "you have to accept the house rules to play" }, 400);
        if (await bansHit([id, ig, tiktok, email])) return J({ error: BANNED_MSG, code: "banned" }, 403);
        // A banned device row stays banned even if they re-register.
        const prev = await db(`oc_players?id=eq.${encodeURIComponent(id)}&select=banned`);
        if (prev?.[0]?.banned) return J({ error: BANNED_MSG, code: "banned" }, 403);
        const cur = await db(`oc_players?id=eq.${encodeURIComponent(id)}&select=verified,verify_code,player_num,phone`);
        // CLOSED TESTING: a new hooper needs an invite code from the coach.
        // The owner's own handles always walk straight in. A device that already
        // has a row (re-register / self-heal) is never re-gated.
        if (!cur?.[0] && !OWNER_IGS.includes(ig) && await settingOn("invite_only")) {
          const code = inviteClean(p.invite ?? b.invite);
          if (!code) return J({ error: "Certified Hooper is invite-only right now — ask the coach for your code", code: "needinvite" }, 403);
          const inv = await db(`oc_invites?code=eq.${encodeURIComponent(code)}&select=code,used_by,revoked`);
          const row = inv?.[0];
          if (!row || row.revoked) return J({ error: "that code isn't valid — check it with the coach", code: "badinvite" }, 403);
          if (row.used_by && row.used_by !== id) return J({ error: "that code has already been used", code: "usedinvite" }, 403);
          // claim it for this device (guarded so two people can't share one code)
          await db(`oc_invites?code=eq.${encodeURIComponent(code)}&used_by=is.null`, {
            method: "PATCH",
            body: JSON.stringify({ used_by: id, used_name: name, used_at: new Date().toISOString() }),
          });
          const chk = await db(`oc_invites?code=eq.${encodeURIComponent(code)}&select=used_by`);
          if (chk?.[0]?.used_by !== id) return J({ error: "that code has already been used", code: "usedinvite" }, 403);
        }
        // A mobile is a prerequisite for NEW hoopers. Existing rows (re-register,
        // self-heal) keep the number already on file so nobody gets locked out.
        const keepPhone = cur?.[0]?.phone || "";
        if (!phone && !keepPhone) return J({ error: "add your mobile number so the coach can reach you", code: "needphone" }, 400);
        let verified = !!cur?.[0]?.verified;
        const verify_code = cur?.[0]?.verify_code || mkCode();
        await db(`oc_players?on_conflict=id`, {
          method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ id, name, ig, tiktok, email, phone: phone || keepPhone, accepted_at: new Date().toISOString(), verify_code }),
        });
        // The owner's own handles always come back verified + coach-flagged,
        // so a fresh-slate wipe never locks the coach out of his own app.
        if (OWNER_IGS.includes(ig)) {
          await db(`oc_players?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ verified: true, coach: true }) });
          verified = true;
        }
        // Every hooper gets a random unique 4-digit player number — their public
        // ID in the app ("Player #4358"), worn on the card like a jersey.
        let player_num = cur?.[0]?.player_num ?? null;
        for (let i = 0; i < 30 && player_num == null; i++) {
          const cand = 1000 + Math.floor(Math.random() * 9000);
          try {
            await db(`oc_players?id=eq.${encodeURIComponent(id)}&player_num=is.null`, { method: "PATCH", body: JSON.stringify({ player_num: cand }) });
            const chk = await db(`oc_players?id=eq.${encodeURIComponent(id)}&select=player_num`);
            player_num = chk?.[0]?.player_num ?? null;
          } catch (_e) { /* number taken — roll again */ }
        }
        return J({ ok: true, player: { id, name, ig, tiktok }, verified, verify_code, player_num });
      }

      // Log back in on a NEW phone: handle/email + the account's 5-digit code
      // moves the whole profile across devices. Brute-force guarded: 650ms
      // constant delay + per-target lockout after 8 misses (1 hour).
      case "login": {
        const who = str(b.who, 120).toLowerCase().replace(/^@+/, "").replace(/[^a-z0-9._@+-]/g, "");
        const code = str(b.code, 8).replace(/\D/g, "");
        if (!who || code.length < 4) return J({ error: "enter your @ (or email) and your 5-digit code" }, 400);
        const g = await db(`oc_login_guard?who=eq.${encodeURIComponent(who)}`);
        const g0 = g?.[0];
        if (g0?.locked_until && new Date(g0.locked_until) > new Date()) {
          return J({ error: "too many tries — this account's locked for a bit. Try again in an hour." }, 429);
        }
        await new Promise((r) => setTimeout(r, 650));
        const w = encodeURIComponent(who);
        const SEL = "id,name,ig,tiktok,email,phone,verified,verify_code,banned,player_num";
        const asPhone = phoneClean(who);
        const rows = /^\d{1,4}$/.test(who) // hooper numbers can be 1–4 digits now (#312)
          ? await db(`oc_players?player_num=eq.${w}&select=${SEL}`)
          : asPhone
          ? await db(`oc_players?phone=eq.${encodeURIComponent(asPhone)}&select=${SEL}`)
          : await db(`oc_players?or=(ig.eq.${w},tiktok.eq.${w},email.eq.${w})&select=${SEL}`);
        const hit = (rows || []).find((p: { verify_code?: string }) => p.verify_code === code);
        if (!hit) {
          const fails = (g0?.fails || 0) + 1;
          await db(`oc_login_guard?on_conflict=who`, {
            method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
            body: JSON.stringify({ who, fails, locked_until: fails >= 8 ? new Date(Date.now() + 3600e3).toISOString() : null }),
          });
          return J({ error: "no match — check your @ (or email) and your code" }, 401);
        }
        if (hit.banned || await bansHit([hit.id, hit.ig, hit.tiktok, hit.email])) return J({ error: BANNED_MSG, code: "banned" }, 403);
        if (g0) await db(`oc_login_guard?who=eq.${w}`, { method: "DELETE" });
        return J({ ok: true, player: { id: hit.id, name: hit.name, ig: hit.ig || "", tiktok: hit.tiktok || "", email: hit.email || "", phone: hit.phone || "" }, verified: !!hit.verified, verify_code: hit.verify_code, player_num: hit.player_num ?? null });
      }

      // "Something broke" — a tester taps the bug button, it lands on the desk.
      // Deliberately NOT guarded: if the app is broken for them we still want
      // the report, even from a half-registered device.
      // ===== Courts by the community (community.html = the bio link) =====
      // No account needed. Honeypot + 3 courts/device/day. Photos land in the
      // public bucket under community/. The coach gets a push like a bug report.
      case "cc_submit": {
        if (str(b.website, 10)) return J({ ok: true }); // honeypot — bots fill it, humans can't see it
        const device = sid(b.device).slice(0, 64);
        if (device.length < 8) return J({ error: "bad request" }, 400);
        const name = str(b.name, 80), suburb = str(b.suburb, 60), where = str(b.where, 200), maps = str(b.maps, 300);
        const sub_name = str(b.sub_name, 40), sub_ig = igClean(b.sub_ig);
        if (!name) return J({ error: "name the court" }, 400);
        if (!suburb && !where && !maps) return J({ error: "tell us where it is — suburb, address or a Google Maps link" }, 400);
        if (!sub_name) return J({ error: "put your name on it" }, 400);
        const since = new Date(Date.now() - 86400e3).toISOString();
        const recent = await db(`oc_cc?device=eq.${encodeURIComponent(device)}&created_at=gte.${encodeURIComponent(since)}&select=id`) || [];
        if (recent.length >= 3) return J({ error: "three courts a day is the cap — send the next one tomorrow" }, 429);
        const f = (b.features || {}) as Record<string, unknown>;
        const water = ["bubbler", "tap", "none"].includes(String(f.water ?? "")) ? String(f.water) : "";
        const features = {
          indoor: f.indoor === true, lit: f.lit === true, full: f.full === true, hoops: num(f.hoops, 0, 20, 0),
          rim: str(f.rim, 30), surface: str(f.surface, 30), water, toilets: f.toilets === true, parking: str(f.parking, 60),
          shade: f.shade === true, seating: f.seating === true, cost: str(f.cost, 40), best: str(f.best, 80),
          bring: str(f.bring, 200), tips: str(f.tips, 600), played: f.played === true,
        };
        let lat: number | null = null, lon: number | null = null;
        try {
          const c = maps ? await resolveMapsUrl(maps) : parseCoords(where);
          if (c && inAus(c[0], c[1])) { lat = c[0]; lon = c[1]; }
        } catch (_e) { /* the pin is optional at this stage */ }
        const id = crypto.randomUUID();
        const photos: string[] = [];
        const raw = Array.isArray(b.photos) ? (b.photos as unknown[]).slice(0, 3) : [];
        for (let i = 0; i < raw.length; i++) {
          try { photos.push(await uploadImg(String(raw[i]), `community/${id}-${i}-${Date.now()}`)); }
          catch (e) { return J({ error: "a photo didn't upload — try a smaller one (" + (e as Error).message + ")" }, 400); }
        }
        await db(`oc_cc`, { method: "POST", body: JSON.stringify({ id, name, suburb, where_txt: where, maps_url: maps, lat, lon, features, photos, sub_name, sub_ig, device, status: "pending" }) });
        try {
          const coaches = await db(`oc_players?coach=is.true&select=id`) || [];
          const ids = coaches.map((c: { id: string }) => c.id);
          if (ids.length) await sendHH(ids, { title: "🏀 New court from the community", body: `${name}${suburb ? " — " + suburb : ""} · by ${sub_name}`, url: "/community.html" });
        } catch (_e) { /* best effort */ }
        return J({ ok: true, id });
      }
      case "cc_list": {
        const device = sid(b.device).slice(0, 64);
        const rows = await db(`oc_cc?status=in.(voting,added)&select=id,created_at,name,suburb,where_txt,maps_url,lat,lon,features,photos,sub_name,sub_ig,status,added_key,decided_at&order=created_at.desc&limit=80`) || [];
        const { tally, mine } = await ccTally(rows.map((r: { id: string }) => r.id), device);
        const pub = rows.map((r: Record<string, unknown>) => ({ ...r, votes: tally[r.id as string] || { up: 0, down: 0 } }));
        return J({ voting: pub.filter((r: { status: string }) => r.status === "voting"), added: pub.filter((r: { status: string }) => r.status === "added").slice(0, 40), mine });
      }
      case "cc_vote": {
        const device = sid(b.device).slice(0, 64); const id = sid(b.id).slice(0, 36);
        if (device.length < 8 || id.length < 32) return J({ error: "bad request" }, 400);
        const row = (await db(`oc_cc?id=eq.${id}&select=id,status`))?.[0];
        if (!row || row.status !== "voting") return J({ error: "this one isn't up for a vote" }, 400);
        const since = new Date(Date.now() - 86400e3).toISOString();
        const n = await db(`oc_cc_votes?device=eq.${encodeURIComponent(device)}&created_at=gte.${encodeURIComponent(since)}&select=cc_id`) || [];
        if (n.length >= 60) return J({ error: "easy — that's enough votes for today" }, 429);
        await db(`oc_cc_votes?on_conflict=cc_id,device`, { method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ cc_id: id, device, up: b.up !== false, created_at: new Date().toISOString() }) });
        const { tally } = await ccTally([id]);
        return J({ ok: true, votes: tally[id] || { up: 0, down: 0 }, mine: b.up !== false });
      }
      case "cc_admin": {
        const a = await ccAuth(b.pin); if (!a.ok) return J({ error: a.err }, a.code);
        const rows = await db(`oc_cc?select=*&order=created_at.desc&limit=300`) || [];
        const { tally } = await ccTally(rows.map((r: { id: string }) => r.id));
        const feedback = await db(`oc_bugs?page=eq.community&select=*&order=created_at.desc&limit=150`) || [];
        return J({ ok: true, courts: rows.map((r: Record<string, unknown>) => ({ ...r, votes: tally[r.id as string] || { up: 0, down: 0 } })), feedback });
      }
      case "cc_status": {
        const a = await ccAuth(b.pin); if (!a.ok) return J({ error: a.err }, a.code);
        const id = sid(b.id).slice(0, 36); const status = str(b.status, 12);
        if (id.length < 32 || !["pending", "voting", "dismissed"].includes(status)) return J({ error: "bad request" }, 400);
        await db(`oc_cc?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status, coach_note: str(b.note, 300), decided_at: status === "dismissed" ? new Date().toISOString() : null }) });
        return J({ ok: true });
      }
      // Add it to the map: becomes a real official court (same shape as the desk's
      // admin_court_add) with the submitter credited in the notes.
      case "cc_add": {
        const a = await ccAuth(b.pin); if (!a.ok) return J({ error: a.err }, a.code);
        const id = sid(b.id).slice(0, 36); if (id.length < 32) return J({ error: "bad request" }, 400);
        const r = (await db(`oc_cc?id=eq.${id}&select=*`))?.[0]; if (!r) return J({ error: "gone" }, 404);
        if (r.status === "added") return J({ error: "already on the map", key: r.added_key }, 409);
        let lat = +(b.lat as number), lon = +(b.lon as number);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          const m = str(b.maps, 300);
          const c = m ? await resolveMapsUrl(m) : (r.lat != null && r.lon != null ? [r.lat, r.lon] as [number, number] : null);
          if (!c) return J({ error: "no pin yet — paste a Google Maps link for it", code: "nopin" }, 400);
          lat = c[0]; lon = c[1];
        }
        if (!inAus(lat, lon)) return J({ error: "that pin isn't in Australia" }, 400);
        const f = (r.features || {}) as Record<string, unknown>;
        const name = str(b.name, 80) || r.name, suburb = str(b.suburb, 60) || r.suburb;
        const key = `oc_c_${crypto.randomUUID().slice(0, 8)}`;
        const info = infoOf({ info: { surface: f.surface, hoops: f.hoops, rim: f.rim, cost: f.cost || "Free", best: f.best, water: f.water, toilets: f.toilets, parking: f.parking, shade: f.shade, seating: f.seating,
          bring: String(f.bring || "").split(",").map((x) => x.trim()).filter(Boolean), tips: f.tips } });
        const photo = ownPhoto((r.photos || [])[0]);
        await db(`oc_courts`, { method: "POST", body: JSON.stringify({ key, name, suburb, lat, lon, indoor: f.indoor === true, lit: f.lit === true, custom: true, official: true, info, radius_m: 300, hidden: false, updated_at: new Date().toISOString(),
          ...(photo ? { photo_url: photo } : {}), notes: `Courts by the community` }) });
        await db(`oc_cc?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status: "added", added_key: key, lat, lon, decided_at: new Date().toISOString(), coach_note: str(b.note, 300) || r.coach_note }) });
        return J({ ok: true, key });
      }
      case "cc_del": {
        const a = await ccAuth(b.pin); if (!a.ok) return J({ error: a.err }, a.code);
        const id = sid(b.id).slice(0, 36); if (id.length < 32) return J({ error: "bad request" }, 400);
        await db(`oc_cc?id=eq.${id}`, { method: "DELETE" });
        return J({ ok: true });
      }
      case "cc_bug_done": {
        const a = await ccAuth(b.pin); if (!a.ok) return J({ error: a.err }, a.code);
        const id = str(b.id, 64); if (!id) return J({ error: "bad request" }, 400);
        if (b.del === true) await db(`oc_bugs?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
        else await db(`oc_bugs?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ done: b.on !== false }) });
        return J({ ok: true });
      }
      case "cc_pin_set": {
        const a = await ccAuth(b.pin); if (!a.ok) return J({ error: a.err }, a.code);
        const np = str(b.new_pin, 8); if (!/^\d{4,8}$/.test(np)) return J({ error: "new PIN must be 4–8 digits" }, 400);
        await db(`oc_settings?on_conflict=key`, { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ key: "cc_pin", value: await sha256(`cc:${np}:certifiedhooper`) }) });
        return J({ ok: true });
      }

      case "bug_report": {
        const p = (b.player || {}) as Record<string, unknown>;
        const text = str(b.text, 600);
        if (!text) return J({ error: "tell us what happened first" }, 400);
        await db(`oc_bugs`, {
          method: "POST",
          body: JSON.stringify({
            player_id: str(p.id, 64), name: str(p.name, 40), ig: igClean(p.ig),
            text, kind: str(b.kind, 12) || "bug", page: str(b.page, 40), ua: str(b.ua, 200),
            created_at: new Date().toISOString(),
          }),
        });
        // buzz the coach's phone like a verify request does
        try {
          const coaches = await db(`oc_players?coach=is.true&select=id`) || [];
          const ids = coaches.map((c: { id: string }) => c.id);
          if (ids.length) {
            await sendHH(ids, {
              title: ({ slow: "🐌 Feels slow", idea: "💡 Tester idea", vibe: "💬 Tester feedback" } as Record<string, string>)[str(b.kind, 12)] || "🐞 Something broke",
              body: `${str(p.name, 40) || "A tester"}: ${text.slice(0, 80)}`,
            // (kind shown on the desk; the ping stays short)
              url: "/hoopsheaven-desk.html",
            });
          }
        } catch (_e) { /* best effort */ }
        return J({ ok: true });
      }

      // Is the door open, and does this code work? (checked before sign-up so
      // a tester sees a clear answer instead of a failed registration)
      case "invite_status": {
        const on = await settingOn("invite_only");
        if (!on) return J({ invite_only: false, ok: true });
        const code = inviteClean(b.code);
        if (!code) return J({ invite_only: true, ok: false });
        const inv = await db(`oc_invites?code=eq.${encodeURIComponent(code)}&select=code,used_by,revoked`);
        const row = inv?.[0];
        const device = str(b.player_id, 64);
        const ok = !!row && !row.revoked && (!row.used_by || row.used_by === device);
        return J({ invite_only: true, ok, used: !!(row && row.used_by && row.used_by !== device) });
      }

      // ---- coach desk: invite codes ----
      case "admin_invite_mint": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const n = Math.max(1, Math.min(25, Number(b.n) || 1));
        const note = str(b.note, 60);
        const made: string[] = [];
        for (let i = 0; i < n; i++) {
          for (let t = 0; t < 6; t++) {
            const code = mkInvite();
            try {
              const r = await db(`oc_invites`, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ code, note, created_at: new Date().toISOString() }) });
              if (r?.[0]?.code) { made.push(r[0].code); break; }
            } catch (_e) { /* collision — roll again */ }
          }
        }
        return J({ ok: true, codes: made });
      }
      case "admin_invite_list": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const rows = await db(`oc_invites?select=*&order=created_at.desc&limit=300`) || [];
        const on = await settingOn("invite_only");
        return J({ invites: rows, invite_only: on });
      }
      case "admin_invite_del": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const code = inviteClean(b.code);
        if (!code) return J({ error: "bad request" }, 400);
        await db(`oc_invites?code=eq.${encodeURIComponent(code)}`, { method: "DELETE" });
        return J({ ok: true });
      }
      case "admin_invite_gate": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const on = b.on === true ? "1" : "0";
        await db(`oc_settings?on_conflict=key`, {
          method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ key: "invite_only", value: on, updated_at: new Date().toISOString() }),
        });
        return J({ ok: true, invite_only: on === "1" });
      }

      // ---- coach desk: bug reports ----
      case "admin_bugs": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const rows = await db(`oc_bugs?select=*&order=created_at.desc&limit=200`) || [];
        return J({ bugs: rows });
      }
      case "admin_bug_done": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const id = str(b.id, 64);
        if (!id) return J({ error: "bad request" }, 400);
        await db(`oc_bugs?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ done: b.on !== false }) });
        return J({ ok: true });
      }
      case "admin_bug_del": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const id = str(b.id, 64);
        if (!id) return J({ error: "bad request" }, 400);
        await db(`oc_bugs?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
        return J({ ok: true });
      }

      // Resolve a Google Maps link (or plain "lat, lon") to coordinates so the
      // coach doesn't have to dig lat/lon out by hand. Sydney-bounded.
      case "resolve_maps": {
        const c = await resolveMapsUrl(str(b.url, 400));
        if (!c) return J({ error: "couldn't read that link — paste the Google Maps share link, or \"lat, lon\"" }, 400);
        if (!inAus(c[0], c[1])) return J({ error: "that pin isn't in Australia" }, 400);
        return J({ lat: c[0], lon: c[1] });
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
        if (!player.verified) return J({ error: "get verified to call runs — tap “Request the ✓” in your profile", code: "verify" }, 403);
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
        // Ping everyone who saved this court (closed-app push).
        try {
          const savers = await db(`oc_saves?court_key=eq.${encodeURIComponent(court.key)}&select=player_id`);
          const ids = (savers || []).map((r: Record<string, unknown>) => r.player_id as string).filter(id => id !== player.id);
          await sendHH(ids, { title: "⚡ Run at a court you saved", body: `${player.name} called a ${format} at ${court.name}${court.suburb ? " · " + court.suburb : ""}`, tag: "hh-run", url: `/hoopsheaven.html?court=${court.key}` });
        } catch (_e) { /* best-effort */ }
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

      // Run chat — coordinate a run ("running late", "who's got a ball"). You
      // must be tapped into the run (or be its host) to post; reading is open.
      case "chat_get": {
        const runId = str(b.run_id, 64);
        if (!runId) return J({ error: "bad run" }, 400);
        return J({ messages: await chatFor(runId) });
      }

      case "chat_send": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
        const runId = str(b.run_id, 64);
        const text = str(b.text, 300);
        if (!runId || !text) return J({ error: "type something" }, 400);
        const run = (await db(`oc_runs?id=eq.${encodeURIComponent(runId)}&select=id,host_id`))?.[0];
        if (!run) return J({ error: "run not found" }, 404);
        const inRun = run.host_id === player.id || ((await db(`oc_run_players?run_id=eq.${encodeURIComponent(runId)}&player_id=eq.${encodeURIComponent(player.id)}&select=player_id`))?.length);
        if (!inRun) return J({ error: "tap into the run first, then you can chat", code: "notin" }, 403);
        // soft flood cap: 20 messages / run / device / 5 min
        const win = new Date(Date.now() - 3e5).toISOString();
        const recent = await db(`oc_run_chat?run_id=eq.${encodeURIComponent(runId)}&player_id=eq.${encodeURIComponent(player.id)}&created_at=gte.${win}&select=id`);
        if ((recent?.length || 0) >= 20) return J({ error: "slow down a sec ✋" }, 429);
        await db(`oc_run_chat`, { method: "POST", body: JSON.stringify({ run_id: runId, player_id: player.id, name: player.name, ig: player.ig, text, created_at: new Date().toISOString() }) });
        // Ping everyone else in the run (closed-app push).
        try {
          const roster = await db(`oc_run_players?run_id=eq.${encodeURIComponent(runId)}&select=player_id`);
          const others = (roster || []).map((r: Record<string, unknown>) => r.player_id as string).filter(id => id !== player.id);
          await sendHH(others, { title: "💬 New message in your run", body: `${player.name}: ${text.slice(0, 90)}`, tag: "hh-chat", url: `/hoopsheaven.html?run=${runId}` });
        } catch (_e) { /* best-effort */ }
        return J({ messages: await chatFor(runId) });
      }

      // City-wide King of the Court: the top hoopers by lifetime check-ins.
      case "leaderboard": {
        const rows: Record<string, unknown>[] = (await db(`oc_players?banned=is.false&checkins_total=gt.0&select=id,name,ig,tiktok,verified,checkins_total&order=checkins_total.desc&limit=25`)) || [];
        return J({ kings: rows.map((r, i) => ({ rank: i + 1, id: r.id, name: r.name, ig: r.ig, tiktok: r.tiktok || "", verified: !!r.verified, checkins: Number(r.checkins_total) || 0, tier: tierOf(Number(r.checkins_total) || 0) })), week: sydWeek() });
      }

      // Store this device's push subscription (enables closed-app notifications).
      case "push_sub": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const sub = b.sub;
        if (!sub || typeof sub !== "object" || !(sub as Record<string, unknown>).endpoint) return J({ error: "bad subscription" }, 400);
        await db(`oc_push?on_conflict=player_id`, { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ player_id: g.p!.id, sub, created_at: new Date().toISOString() }) });
        return J({ ok: true });
      }

      case "push_unsub": {
        const id = str(b.player_id, 64);
        if (id) await db(`oc_push?player_id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
        return J({ ok: true });
      }

      // The SW calls this on a push tickle to get the exact message to show, then
      // it marks the device's pending notifs as shown. Unauthenticated (device
      // ids are public and notifs are non-sensitive coordination pings).
      case "notif_pull": {
        const id = str(b.player_id, 64);
        if (!id) return J({ notif: null });
        const rows: Record<string, unknown>[] = await db(`oc_notif?player_id=eq.${encodeURIComponent(id)}&shown=is.false&select=id,title,body,tag,url&order=created_at.desc&limit=6`) || [];
        if (!rows.length) return J({ notif: null });
        await db(`oc_notif?player_id=eq.${encodeURIComponent(id)}&shown=is.false`, { method: "PATCH", body: JSON.stringify({ shown: true }) });
        const top = rows[0];
        const more = rows.length > 1 ? ` (+${rows.length - 1} more)` : "";
        return J({ notif: { title: top.title, body: String(top.body || "") + more, tag: top.tag || "hh", url: top.url || "" } });
      }

      // Server-side saved court (so run_create can ping everyone who saved it).
      case "save_court": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const key = str(b.court_key, 64);
        if (!key || !/^oc_[a-zA-Z0-9._-]+$/.test(key)) return J({ error: "bad court" }, 400);
        if (b.on === false) await db(`oc_saves?player_id=eq.${encodeURIComponent(g.p!.id)}&court_key=eq.${encodeURIComponent(key)}`, { method: "DELETE" });
        else await db(`oc_saves?on_conflict=player_id,court_key`, { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ player_id: g.p!.id, court_key: key, created_at: new Date().toISOString() }) });
        return J({ ok: true });
      }


      // All court rows — the app builds its picker from the OFFICIAL ones and
      // applies name/hidden/photo/details. Rich `info` + radius come along too.
      case "courts_meta": {
        const rows = await db(`oc_courts?select=key,name,notes,photo_url,hidden,lat,lon,suburb,indoor,lit,custom,official,info,radius_m`);
        // live activity per court: active check-ins (2h) + upcoming runs
        const since = new Date(Date.now() - 2 * 36e5).toISOString();
        const cis = await db(`oc_checkins?checked_in_at=gte.${since}&select=court_key,extra`);
        const from = new Date(Date.now() - 3 * 36e5).toISOString();
        const rns = await db(`oc_runs?status=eq.open&run_at=gte.${from}&select=court_key`);
        const here: Record<string, number> = {}, runs: Record<string, number> = {};
        for (const c of cis || []) here[c.court_key as string] = (here[c.court_key as string] || 0) + 1 + (Number(c.extra) || 0);
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
        const h = await hereFor(key);
        const issues = await issuesFor(key, me);
        return J({ runs: await withPlayers(runs), plays, week, kotc, here: h.list, hereTotal: h.total, hereExtra: h.extra, info, reviews, rsum, issues });
      }


      // Court check-in with SERVER-SIDE geofencing — the whole point is that
      // nobody can claim they're at a court they're not at. The server looks up
      // the court's REAL coordinates (embedded map / custom court) and compares
      // them to the device GPS the client sends. It never trusts a client-sent
      // "verified" flag or client-sent court coords.
      //   via=manual → MUST be inside the geofence, or refused ('toofar'/'needloc')
      //   via=auto   → same (fired automatically when a run player arrives)
      //   via=qr     → scanned the physical court poster; allowed even if GPS is
      //                flaky, but only marked verified ✓ when GPS also confirms
      case "checkin": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
        const court = courtOf(b);
        if (!court) return J({ error: "bad court" }, 400);
        const via = ["qr", "auto", "manual"].includes(str(b.via, 10)) ? str(b.via, 10) : "manual";
        const coords = await courtCoords(court.key);
        const dLat = +(b.lat as number), dLon = +(b.lon as number);
        const haveGeo = Number.isFinite(dLat) && Number.isFinite(dLon);
        let within = false, dist = -1;
        if (coords && haveGeo) { dist = metres(coords[0], coords[1], dLat, dLon); within = dist <= await courtRadius(court.key); }
        // Enforcement: manual/auto REQUIRE being inside the fence.
        if (via !== "qr") {
          if (!haveGeo) return J({ error: "turn on location to check in — or scan the court's QR when you get there", code: "needloc" }, 400);
          if (!coords) return J({ error: "can't place that court — scan its QR instead", code: "needloc" }, 400);
          if (!within) return J({ error: "you're not at this court yet — check in once you're there (or scan the QR)", code: "toofar" }, 403);
        }
        const verified = within; // ✓ only when GPS actually confirms the court
        // housekeeping: drop long-expired rows so the table stays tiny
        await db(`oc_checkins?checked_in_at=lt.${new Date(Date.now() - 48 * 36e5).toISOString()}`, { method: "DELETE" }).catch(() => {});
        await db(`oc_checkins?player_id=eq.${encodeURIComponent(player.id)}`, { method: "DELETE" });
        await db(`oc_checkins`, {
          method: "POST",
          body: JSON.stringify({ court_key: court.key, court_name: court.name, suburb: court.suburb, lat: coords ? coords[0] : court.lat, lon: coords ? coords[1] : court.lon, player_id: player.id, name: player.name, ig: player.ig, verified, via }),
        });
        // Atomic + durable: the DB function counts this only as a genuine fresh
        // arrival (different court, or >6h since last here) so tap-out/tap-in and
        // GPS flapping at the same court can't farm the tally. Returns new total.
        let ciTotal = player.checkins;
        try { ciTotal = Number(await db(`rpc/oc_checkin_bump`, { method: "POST", body: JSON.stringify({ p_id: player.id, p_court: court.key }) })) || player.checkins; } catch (_e) { /* keep prior on failure */ }
        const h = await hereFor(court.key);
        return J({ here: h.list, hereTotal: h.total, hereExtra: h.extra, verified, checkins: ciTotal });
      }

      case "checkout": {
        // Leaving is always allowed, same as run_leave.
        const pid = str(b.player_id, 64);
        if (!pid) return J({ error: "bad request" }, 400);
        const rows = await db(`oc_checkins?player_id=eq.${encodeURIComponent(pid)}&select=court_key`);
        await db(`oc_checkins?player_id=eq.${encodeURIComponent(pid)}`, { method: "DELETE" });
        const h = rows?.[0] ? await hereFor(rows[0].court_key as string) : { list: [], total: 0, extra: 0 };
        return J({ ok: true, here: h.list, hereTotal: h.total, hereExtra: h.extra });
      }

      // Off-app headcount: someone already checked in reports how many EXTRA
      // people are physically playing but not on the app (old heads, casuals).
      // Number only — no free text. Must be checked in at that court already.
      case "set_headcount": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
        const extra = num(b.extra, 0, 40, 0);
        const rows = await db(`oc_checkins?player_id=eq.${encodeURIComponent(player.id)}&select=court_key`);
        if (!rows?.[0]) return J({ error: "check in first, then you can update the headcount", code: "needci" }, 400);
        await db(`oc_checkins?player_id=eq.${encodeURIComponent(player.id)}`, { method: "PATCH", body: JSON.stringify({ extra }) });
        const h = await hereFor(rows[0].court_key as string);
        return J({ ok: true, here: h.list, hereTotal: h.total, hereExtra: h.extra });
      }


      // My account status (verification state + code for the DM).
      case "me": {
        const id = str(b.player_id, 64);
        if (!id) return J({ error: "bad request" }, 400);
        const rows = await db(`oc_players?id=eq.${encodeURIComponent(id)}&select=name,ig,tiktok,email,verified,verify_code,banned,player_num`);
        const row = rows?.[0];
        if (!row) return J({ error: "no account", code: "terms" }, 404);
        let code = row.verify_code;
        if (!code) { code = mkCode(); await db(`oc_players?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ verify_code: code }) }); }
        const req = await db(`oc_inbox?player_id=eq.${encodeURIComponent(id)}&select=player_id`);
        return J({ name: row.name, ig: row.ig, tiktok: row.tiktok || "", verified: !!row.verified, verify_code: code, banned: !!row.banned, requested: !!req?.length, player_num: row.player_num ?? null });
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
        // Buzz the coach's phone(s): every account flagged coach=true gets a
        // push pointing straight at the desk. Best-effort — never blocks.
        try {
          const coaches = await db(`oc_players?coach=is.true&select=id`) || [];
          const pids = coaches.map((c: { id: string }) => c.id).filter((id: string) => id !== player.id);
          if (pids.length) await sendHH(pids, { title: `📨 ${player.name} wants the ✓`, body: `${player.ig ? "@" + player.ig : "New signup"} — check their page, tap verify`, tag: "hh-desk", url: "/hoopsheaven-desk.html" });
        } catch (_e) { /* best-effort */ }
        return J({ ok: true });
      }

      // NBA-style profile for any hooper: tier from check-ins, box score, and
      // the community rating + approved scouting reports. The rating is kept
      // POSITIVE by design — anything under 7 shows as "6−", never a low number.
      case "profile": {
        const id = str(b.player_id, 64);
        if (!id) return J({ error: "bad request" }, 400);
        const viewer = str(b.viewer_id, 64);
        const prow = (await db(`oc_players?id=eq.${encodeURIComponent(id)}&select=id,name,ig,tiktok,verified,checkins_total,created_at,player_num`))?.[0];
        if (!prow) return J({ error: "hooper not found" }, 404);
        const runs = (await db(`oc_run_players?player_id=eq.${encodeURIComponent(id)}&select=run_id`)) || [];
        const clips = (await db(`oc_plays?player_id=eq.${encodeURIComponent(id)}&select=id`)) || [];
        let fires = 0;
        if (clips.length) {
          const f = await db(`oc_play_fires?play_id=in.(${clips.map((c: Record<string, unknown>) => `"${sid(c.id)}"`).join(",")})&select=play_id`);
          fires = (f || []).length;
        }
        // approved feedback only counts toward the rating + shows as comments
        const fb: Record<string, unknown>[] = (await db(`oc_pfeedback?ratee_id=eq.${encodeURIComponent(id)}&approved=is.true&select=rater_id,stars,comment,created_at&order=created_at.desc`)) || [];
        const rcount = fb.length;
        const avg = rcount ? fb.reduce((a, r) => a + (r.stars as number), 0) / rcount : 0;
        const raterIds = [...new Set(fb.map(r => r.rater_id as string))];
        const rnames: Record<string, { name: string; ig: string }> = {};
        if (raterIds.length) for (const p of await db(`oc_players?id=in.(${raterIds.map(i => `"${sid(i)}"`).join(",")})&select=id,name,ig`) || []) rnames[p.id] = { name: p.name, ig: p.ig };
        const comments = fb.filter(r => String(r.comment || "").trim()).map(r => ({ stars: r.stars, comment: r.comment, at: r.created_at, name: rnames[r.rater_id as string]?.name || "A hooper", ig: rnames[r.rater_id as string]?.ig || "" }));
        // Whether the viewer has already rated this player, so the app can label
        // the button. viewer_id is client-supplied and device ids are public, so
        // we NEVER echo back un-approved content here (that would leak the exact
        // pending comment the moderation queue exists to gate). Approved content
        // is already public via `comments`, so it's safe to prefill; pending
        // ratings only surface as {pending:true}.
        let mine: Record<string, unknown> | null = null;
        if (viewer && viewer !== id) {
          const m = (await db(`oc_pfeedback?rater_id=eq.${encodeURIComponent(viewer)}&ratee_id=eq.${encodeURIComponent(id)}&select=stars,comment,approved`))?.[0];
          if (m) mine = m.approved ? { stars: m.stars, comment: m.comment, approved: true } : { pending: true };
        }
        // anti-disheartening rating display
        let rating: Record<string, unknown>;
        if (!rcount) rating = { show: false, label: "Unrated", value: null, count: 0 };
        else if (avg < 7) rating = { show: true, label: "6−", value: null, count: rcount, soft: true };
        else rating = { show: true, label: (Math.round(avg * 10) / 10).toFixed(1), value: Math.round(avg * 10) / 10, count: rcount, soft: false };
        return J({ id: prow.id, name: prow.name, ig: prow.ig, tiktok: prow.tiktok || "", verified: !!prow.verified, num: prow.player_num ?? null, checkins: Number(prow.checkins_total) || 0, runs: runs.length, clips: clips.length, fires, tier: tierOf(Number(prow.checkins_total) || 0), rating, comments: comments.slice(0, 30), mine, joined: prow.created_at });
      }

      // Rate another hooper 1-10 (+ optional scouting note). Coach-moderated:
      // every rating lands PENDING and only counts once approved. One rating per
      // pair (resubmit updates + re-enters moderation). Can't rate yourself.
      case "rate_player": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const rater = g.p!;
        const ratee = str(b.ratee, 64);
        if (!ratee || ratee === rater.id) return J({ error: "you can't rate yourself 😅" }, 400);
        const exists = (await db(`oc_players?id=eq.${encodeURIComponent(ratee)}&select=id`))?.[0];
        if (!exists) return J({ error: "hooper not found" }, 404);
        const stars = num(b.stars, 1, 10, 0);
        if (!stars) return J({ error: "pick 1–10 stars" }, 400);
        // Anti-flood: at most 20 NEW hoopers rated per device per day (updating an
        // existing rating is always allowed). Keeps the moderation queue sane.
        const dayAgo = new Date(Date.now() - 864e5).toISOString();
        const already = (await db(`oc_pfeedback?rater_id=eq.${encodeURIComponent(rater.id)}&ratee_id=eq.${encodeURIComponent(ratee)}&select=ratee_id`))?.length;
        if (!already) {
          const todays = await db(`oc_pfeedback?rater_id=eq.${encodeURIComponent(rater.id)}&created_at=gte.${dayAgo}&select=ratee_id`);
          if ((todays?.length || 0) >= 20) return J({ error: "easy — that's a lot of ratings for one day, come back tomorrow" }, 429);
        }
        await db(`oc_pfeedback?on_conflict=rater_id,ratee_id`, {
          method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ rater_id: rater.id, ratee_id: ratee, stars, comment: str(b.comment, 300), approved: false, created_at: new Date().toISOString() }),
        });
        return J({ ok: true });
      }

      // Suggest a court → Heaven desk. Players never add courts themselves; the
      // coach reviews suggestions and adds the official ones. Rate-limited.
      // ---- community repair board: report it, claim it, prove it's fixed ----
      // Loads with the court page, so it's public: the whole court sees what's
      // broken and who's on it.
      case "issue_report": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
        const court_key = str(b.court_key, 64);
        if (!court_key) return J({ error: "which court?" }, 400);
        const KINDS = ["rim", "net", "lights", "surface", "gate", "rubbish", "other"];
        const kind = KINDS.includes(str(b.kind, 12)) ? str(b.kind, 12) : "other";
        const dayAgo = new Date(Date.now() - 864e5).toISOString();
        const mine = await db(`oc_court_issues?player_id=eq.${encodeURIComponent(player.id)}&created_at=gte.${dayAgo}&select=id`);
        if ((mine?.length || 0) >= 10) return J({ error: "that's a lot of reports today — give it a rest" }, 429);
        let photo_url = "";
        if (typeof b.photo === "string" && b.photo.startsWith("data:image")) {
          photo_url = await uploadImg(b.photo, `issues/${sid(player.id)}-${Date.now()}`).catch(() => "");
        }
        await db(`oc_court_issues`, {
          method: "POST",
          body: JSON.stringify({
            court_key, court_name: str(b.court_name, 80), kind, text: str(b.text, 300), photo_url,
            player_id: player.id, name: player.name, ig: player.ig,
            status: "open", created_at: new Date().toISOString(),
          }),
        });
        return J({ ok: true, issues: await issuesFor(court_key, player.id) });
      }

      // "same here" — confirms it's still broken (one per player, toggles off)
      case "issue_bump": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
        const id = str(b.id, 64);
        const rows = await db(`oc_court_issues?id=eq.${encodeURIComponent(id)}&select=court_key`);
        if (!rows?.[0]) return J({ error: "that report is gone" }, 404);
        const had = await db(`oc_issue_bumps?issue_id=eq.${encodeURIComponent(id)}&player_id=eq.${encodeURIComponent(player.id)}&select=player_id`);
        if (had?.length) {
          await db(`oc_issue_bumps?issue_id=eq.${encodeURIComponent(id)}&player_id=eq.${encodeURIComponent(player.id)}`, { method: "DELETE" });
        } else {
          await db(`oc_issue_bumps`, { method: "POST", body: JSON.stringify({ issue_id: id, player_id: player.id, created_at: new Date().toISOString() }) });
        }
        return J({ ok: true, issues: await issuesFor(rows[0].court_key, player.id) });
      }

      // "I'll fix it" — puts your name on it so nobody doubles up. Tapping
      // again takes your name back off.
      case "issue_claim": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
        const id = str(b.id, 64);
        const rows = await db(`oc_court_issues?id=eq.${encodeURIComponent(id)}&select=court_key,status,fixer_id`);
        const row = rows?.[0];
        if (!row) return J({ error: "that report is gone" }, 404);
        if (row.status === "fixed") return J({ error: "that one's already fixed 🔨" }, 400);
        const mineAlready = row.fixer_id === player.id;
        await db(`oc_court_issues?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify(mineAlready
            ? { status: "open", fixer_id: null, fixer_name: null, fixer_ig: null, claimed_at: null }
            : { status: "onit", fixer_id: player.id, fixer_name: player.name, fixer_ig: player.ig, claimed_at: new Date().toISOString() }),
        });
        return J({ ok: true, claimed: !mineAlready, issues: await issuesFor(row.court_key, player.id) });
      }

      // "it's fixed" — with a photo, that's the proof the court is good again
      case "issue_fixed": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
        const id = str(b.id, 64);
        const rows = await db(`oc_court_issues?id=eq.${encodeURIComponent(id)}&select=court_key,court_name,status,player_id`);
        const row = rows?.[0];
        if (!row) return J({ error: "that report is gone" }, 404);
        if (row.status === "fixed") return J({ error: "already marked fixed" }, 400);
        let fixed_photo = "";
        if (typeof b.photo === "string" && b.photo.startsWith("data:image")) {
          fixed_photo = await uploadImg(b.photo, `issues/fixed-${sid(player.id)}-${Date.now()}`).catch(() => "");
        }
        await db(`oc_court_issues?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "fixed", fixed_by: player.id, fixed_name: player.name, fixed_ig: player.ig, fixed_photo, fixed_at: new Date().toISOString() }),
        });
        // tell whoever reported it that their court got sorted
        try {
          if (row.player_id && row.player_id !== player.id) {
            await sendHH([row.player_id as string], {
              title: "🔨 Fixed at " + (row.court_name || "your court"),
              body: `${player.name} sorted the thing you reported`,
              url: "/hoopsheaven.html?court=" + encodeURIComponent(row.court_key as string),
            });
          }
        } catch (_e) { /* best effort */ }
        return J({ ok: true, issues: await issuesFor(row.court_key, player.id) });
      }

      // coach moderation
      case "admin_issue_del": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const id = str(b.id, 64);
        if (!id) return J({ error: "bad request" }, 400);
        await db(`oc_issue_bumps?issue_id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
        await db(`oc_court_issues?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
        return J({ ok: true });
      }
      case "admin_issues": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const rows = await db(`oc_court_issues?select=*&order=created_at.desc&limit=200`) || [];
        return J({ issues: rows });
      }

      // "Something's off here" — a hooper corrects a court's details or adds a
      // photo. Same desk inbox as new-court suggestions, flagged kind='fix'.
      case "court_fix": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
        const court_key = str(b.court_key, 64);
        const court_name = str(b.court_name, 80);
        const note = str(b.note, 400);
        if (!court_key) return J({ error: "which court?" }, 400);
        let photo_url = "";
        if (typeof b.photo === "string" && b.photo.startsWith("data:image")) {
          photo_url = await uploadImg(b.photo, `suggest/${sid(player.id)}-${Date.now()}`).catch(() => "");
        }
        if (!note && !photo_url) return J({ error: "tell us what's off, or add a photo" }, 400);
        const dayAgo = new Date(Date.now() - 864e5).toISOString();
        const mine = await db(`oc_court_reqs?player_id=eq.${encodeURIComponent(player.id)}&created_at=gte.${dayAgo}&select=id`);
        if ((mine?.length || 0) >= 8) return J({ error: "easy — plenty from you today already, we'll get to them" }, 429);
        await db(`oc_court_reqs`, {
          method: "POST",
          body: JSON.stringify({
            player_id: player.id, name: player.name, ig: player.ig,
            kind: "fix", court_key, court_name, note, photo_url,
            where_txt: "", created_at: new Date().toISOString(),
          }),
        });
        // let the coach know the map needs a touch-up
        try {
          const coaches = await db(`oc_players?coach=is.true&select=id`) || [];
          const ids = coaches.map((c: { id: string }) => c.id);
          if (ids.length) {
            await sendHH(ids, {
              title: photo_url && !note ? "📸 New court photo" : "📝 Court needs a fix",
              body: `${player.name} · ${court_name || "a court"}${note ? ": " + note.slice(0, 70) : ""}`,
              url: "/hoopsheaven-desk.html",
            });
          }
        } catch (_e) { /* best effort */ }
        return J({ ok: true });
      }

      case "court_suggest": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
        const court_name = str(b.court_name, 80);
        if (!court_name) return J({ error: "what's the court called?" }, 400);
        const dayAgo = new Date(Date.now() - 864e5).toISOString();
        const mine = await db(`oc_court_reqs?player_id=eq.${encodeURIComponent(player.id)}&created_at=gte.${dayAgo}&select=id`);
        if ((mine?.length || 0) >= 5) return J({ error: "easy — you've suggested a few today already, we'll get to them" }, 429);
        const where = str(b.where, 300);
        // If they pasted a Maps link (or lat,lon) in the location, resolve it now
        // so the coach gets a court that's already pinned when they approve it.
        const c = where ? await resolveMapsUrl(where) : null;
        const inSyd = c && inAus(c[0], c[1]);
        // Optional court photo → storage (moderated: only shows in the desk).
        let photo_url = "";
        if (typeof b.photo === "string" && b.photo.startsWith("data:image")) {
          photo_url = await uploadImg(b.photo, `suggest/${sid(player.id)}-${Date.now()}`).catch(() => "");
        }
        await db(`oc_court_reqs`, {
          method: "POST",
          body: JSON.stringify({ player_id: player.id, name: player.name, ig: player.ig, kind: "new", court_name, where_txt: where, note: str(b.note, 300), photo_url, lat: inSyd ? c![0] : null, lon: inSyd ? c![1] : null, created_at: new Date().toISOString() }),
        });
        return J({ ok: true });
      }

      case "admin_court_req_done": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        await db(`oc_court_reqs?id=eq.${encodeURIComponent(str(b.id, 64))}`, { method: "DELETE" });
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

      // Heaven desk: add an OFFICIAL court (only the coach can add courts) with
      // full details, or edit / delete one. Players suggest via court_suggest.
      case "admin_court_add": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const name = str(b.name, 80), suburb = str(b.suburb, 60);
        const lat = +(b.lat as number), lon = +(b.lon as number);
        if (!name) return J({ error: "name the court" }, 400);
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || !inAus(lat, lon)) return J({ error: "that pin isn't in Australia — paste \"lat, lon\" from Google Maps" }, 400);
        const key = `oc_c_${crypto.randomUUID().slice(0, 8)}`;
        const photo = ownPhoto(b.photo_url);
        await db(`oc_courts`, { method: "POST", body: JSON.stringify({ key, name, suburb, lat, lon, indoor: b.indoor === true, lit: b.lit === true, custom: true, official: true, info: infoOf(b), radius_m: num(b.radius_m, 80, 2000, 300), hidden: b.hidden === true, ...(photo ? { photo_url: photo } : {}), updated_at: new Date().toISOString() }) });
        return J({ ok: true, key });
      }

      case "admin_court_edit": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const key = str(b.key, 64);
        if (!key) return J({ error: "bad court" }, 400);
        const patch: Record<string, unknown> = { name: str(b.name, 80), suburb: str(b.suburb, 60), indoor: b.indoor === true, lit: b.lit === true, hidden: b.hidden === true, official: b.official !== false, info: infoOf(b), radius_m: num(b.radius_m, 80, 2000, 300), updated_at: new Date().toISOString() };
        const lat = +(b.lat as number), lon = +(b.lon as number);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          if (!inAus(lat, lon)) return J({ error: "that pin isn't in Australia" }, 400);
          patch.lat = lat; patch.lon = lon;
        }
        const ep = ownPhoto(b.photo_url); if (ep) patch.photo_url = ep;
        await db(`oc_courts?key=eq.${encodeURIComponent(key)}`, { method: "PATCH", body: JSON.stringify(patch) });
        return J({ ok: true });
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

      // Heaven desk (Lab coach credentials): review + verify + ban + suggestions.
      case "admin_players": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const rows = await db(`oc_players?select=id,name,ig,tiktok,email,phone,verified,verify_code,banned,checkins_total,created_at,player_num&order=created_at.desc&limit=300`);
        const inbox = await db(`oc_inbox?select=*&order=created_at.asc&limit=100`);
        const court_reqs = await db(`oc_court_reqs?select=*&order=created_at.desc&limit=100`);
        const fb_pending = await db(`oc_pfeedback?approved=is.false&select=id`);
        const courts = await db(`oc_courts?select=key&official=is.true`);
        return J({ players: rows || [], inbox: inbox || [], court_reqs: court_reqs || [], feedback_pending: (fb_pending || []).length, courts_total: (courts || []).length });
      }

      // Feedback moderation queue: player→player ratings + comments. Pending
      // first. The coach approves the good vibes, rejects the rest.
      case "admin_feedback": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const rows: Record<string, unknown>[] = await db(`oc_pfeedback?select=*&order=approved.asc,created_at.desc&limit=300`) || [];
        const ids = [...new Set(rows.flatMap(r => [r.rater_id as string, r.ratee_id as string]))];
        const names: Record<string, { name: string; ig: string }> = {};
        if (ids.length) for (const p of await db(`oc_players?id=in.(${ids.map(i => `"${sid(i)}"`).join(",")})&select=id,name,ig`) || []) names[p.id] = { name: p.name, ig: p.ig };
        return J({ feedback: rows.map(r => ({ id: r.id, stars: r.stars, comment: r.comment, approved: r.approved, at: r.created_at, rater: names[r.rater_id as string] || { name: "?" }, ratee: names[r.ratee_id as string] || { name: "?" } })) });
      }

      case "admin_feedback_set": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const id = str(b.id, 64);
        if (!id) return J({ error: "bad request" }, 400);
        await db(`oc_pfeedback?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ approved: b.on !== false }) });
        return J({ ok: true });
      }

      case "admin_feedback_del": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        await db(`oc_pfeedback?id=eq.${encodeURIComponent(str(b.id, 64))}`, { method: "DELETE" });
        return J({ ok: true });
      }

      case "admin_verify": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const pid = str(b.pid, 64);
        if (!pid) return J({ error: "bad request" }, 400);
        await db(`oc_players?id=eq.${encodeURIComponent(pid)}`, { method: "PATCH", body: JSON.stringify({ verified: b.on !== false }) });
        if (b.on !== false) {
          await db(`oc_inbox?player_id=eq.${encodeURIComponent(pid)}`, { method: "DELETE" });
          // Ping the player that they're in (closed-app push).
          try { await sendHH([pid], { title: "✓ You're Certified", body: "Full access unlocked — call runs, add courts & post clips 🏀", tag: "hh-verify", url: "/hoopsheaven.html" }); } catch (_e) { /* best-effort */ }
        }
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
        const rows = await db(`oc_players?id=eq.${encodeURIComponent(pid)}&select=id,ig,tiktok,email`);
        const row = rows?.[0];
        if (!row) return J({ error: "player not found" }, 404);
        if (b.on === false) {
          await db(`oc_players?id=eq.${encodeURIComponent(pid)}`, { method: "PATCH", body: JSON.stringify({ banned: false, ban_reason: "" }) });
          for (const v of [row.id, row.ig, row.tiktok, row.email]) if (v) await db(`oc_bans?value=eq.${encodeURIComponent(String(v).toLowerCase())}`, { method: "DELETE" });
        } else {
          await db(`oc_players?id=eq.${encodeURIComponent(pid)}`, { method: "PATCH", body: JSON.stringify({ banned: true, ban_reason: str(b.reason, 200) }) });
          for (const v of [row.id, row.ig, row.tiktok, row.email]) if (v) await db(`oc_bans?on_conflict=value`, { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ value: String(v).toLowerCase(), reason: str(b.reason, 200) }) });
        }
        return J({ ok: true });
      }

      // Coach edits a player's details (typo'd handle, name change, add email).
      case "admin_player_edit": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const pid = str(b.pid, 64);
        if (!pid) return J({ error: "bad request" }, 400);
        const name = str(b.name, 40), ig = igClean(b.ig), tiktok = igClean(b.tiktok), email = emailClean(b.email);
        const phone = phoneClean(b.phone);
        if (phone === null) return J({ error: "that mobile doesn't look right — use 04xx xxx xxx" }, 400);
        if (!name) return J({ error: "name can't be empty" }, 400);
        if (!ig && !tiktok && !email) return J({ error: "they need at least one of IG / TikTok / email" }, 400);
        // Hooper number: the coach stamps the follower number from their screenshot (first 1,000 = free for life).
        // Blank = leave as is. Must be 1–9999 and not already someone else's.
        let num: number | undefined = undefined;
        if (b.num !== undefined && b.num !== null && String(b.num).trim() !== "") {
          const n = Number(String(b.num).trim());
          if (!Number.isInteger(n) || n < 1 || n > 9999) return J({ error: "hooper number must be 1–9999" }, 400);
          const taken = await db(`oc_players?player_num=eq.${n}&id=neq.${encodeURIComponent(pid)}&select=id,name`);
          if (taken?.length) return J({ error: `#${n} already belongs to ${taken[0].name} — pick another` }, 409);
          num = n;
        }
        await db(`oc_players?id=eq.${encodeURIComponent(pid)}`, { method: "PATCH", body: JSON.stringify({ name, ig, tiktok, email, phone, ...(num !== undefined ? { player_num: num } : {}) }) });
        return J({ ok: true, player_num: num });
      }

      // Full delete: the player + every trace of them (runs they host included).
      // For duplicates, test accounts and delete-my-data asks — bans are for
      // troublemakers (a deleted troublemaker could just sign up again).
      case "admin_player_del": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong login" }, 401);
        const pid = str(b.pid, 64);
        if (!pid) return J({ error: "bad request" }, 400);
        const e = encodeURIComponent(pid);
        const runs = await db(`oc_runs?host_id=eq.${e}&select=id`) || [];
        for (const r of runs) {
          const re = encodeURIComponent(String(r.id));
          await db(`oc_run_chat?run_id=eq.${re}`, { method: "DELETE" });
          await db(`oc_run_players?run_id=eq.${re}`, { method: "DELETE" });
        }
        await db(`oc_runs?host_id=eq.${e}`, { method: "DELETE" });
        for (const q of [
          `oc_run_players?player_id=eq.${e}`, `oc_run_chat?player_id=eq.${e}`,
          `oc_checkins?player_id=eq.${e}`, `oc_plays?player_id=eq.${e}`,
          `oc_play_fires?player_id=eq.${e}`, `oc_ratings?player_id=eq.${e}`,
          `oc_pfeedback?rater_id=eq.${e}`, `oc_pfeedback?ratee_id=eq.${e}`,
          `oc_inbox?player_id=eq.${e}`, `oc_court_reqs?player_id=eq.${e}`,
          `oc_push?player_id=eq.${e}`, `oc_notif?player_id=eq.${e}`,
          `oc_saves?player_id=eq.${e}`, `oc_players?id=eq.${e}`,
        ]) await db(q, { method: "DELETE" });
        return J({ ok: true });
      }

      // Play of the Week: one clip per player per court per week (resubmit replaces).
      case "play_submit": {
        const g = await guard(((b.player || {}) as Record<string, unknown>).id as string);
        if (g.err) return g.err;
        const player = g.p!;
        if (!player.verified) return J({ error: "get verified to post clips — tap “Request the ✓” in your profile", code: "verify" }, 403);
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
