import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// LockDownLab Live — app API. Players auth with player_id + PIN; the
// Administrator with the coach code; staff coaches with username + PIN.
// Coaches self-onboard with a one-time coach code (COACH-xxxx, 6h) or send an
// access request the Administrator approves. ll_coaches = the coaching
// platform; every coach has a permissions object the Administrator controls.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const COACH_CODE = (Deno.env.get("COACH_CODE") || "LAB-PYOD").toUpperCase();
const CODE_TTL_MS = 6 * 3600 * 1000;
const BATCH_TTL_MS = 7 * 24 * 3600 * 1000;
const COACH_CODE_TTL_MS = 6 * 3600 * 1000; // coach signup codes: one-time, 6 hours
const RUN_TTL_MS = 2 * 3600 * 1000;
const ttlFor = (maxUses: number) => (maxUses > 1 ? BATCH_TTL_MS : CODE_TTL_MS);
const COACH_KEYS = ["dray", "onyx", "sunny", "kaya", "moss", "reno"];

const DEFAULT_COACH_PERMS = {
  canViewEarnings: false, canUseEarningsCalculator: false, canViewPayments: false,
  canEditProfile: true, canJoinSessions: true, canAccessResources: true,
  canViewPlayers: true, canUseTestMode: true, canReceiveNotifications: true,
  canCreateSessions: false, canUploadResources: false, canAccessAnalytics: false,
  canAccessCoachChat: false, canAccessScoutPortal: false,
};

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
const b64u = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function vapidAuth(endpoint: string) {
  const aud = new URL(endpoint).origin;
  const enc = new TextEncoder();
  const header = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "mailto:aimanmaged88@gmail.com" })));
  const unsigned = header + "." + claims;
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, await getVapidKey(), enc.encode(unsigned));
  return `vapid t=${unsigned + "." + b64u(sig)}, k=${VAPID_PUB_B64U}`;
}
async function sendPush(subs: any[]) {
  await Promise.all((subs || []).map(async (row: any) => {
    try {
      const ep = row.sub?.endpoint;
      if (!ep) return;
      const r = await fetch(ep, { method: "POST", headers: { Authorization: await vapidAuth(ep), TTL: "7200", Urgency: "high" } });
      if (r.status === 404 || r.status === 410) await db(`ll_push?id=eq.${row.id}`, { method: "DELETE" });
    } catch (_) { /* one dead endpoint never blocks the rest */ }
  }));
}
async function pushCoach() {
  try { await sendPush(await db("ll_push?role=eq.coach&select=id,sub")); } catch (_) { /* best-effort */ }
}
async function pushPlayer(pid: string) {
  try { if (pid) await sendPush(await db(`ll_push?role=eq.player&player_id=eq.${pid}&select=id,sub`)); } catch (_) { /* best-effort */ }
}
async function pushAllPlayers() {
  try { await sendPush(await db("ll_push?role=eq.player&select=id,sub")); } catch (_) { /* best-effort */ }
}
async function pushStaffCoach(cid: string) {
  try { if (cid) await sendPush(await db(`ll_push?role=eq.staffcoach&player_id=eq.${cid}&select=id,sub`)); } catch (_) { /* best-effort */ }
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function sha(t: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}
const pinHash = (nameKey: string, pin: string) => sha(nameKey + ":" + pin + ":lockdownlab");
const coachPinHash = (username: string, pin: string) => sha(username + ":" + pin + ":lockdownlabcoach");
const mintCode = () => "LAB-" + Array.from(crypto.getRandomValues(new Uint8Array(4))).map(x => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[x % 31]).join("");
const coachMintCode = () => "COACH-" + Array.from(crypto.getRandomValues(new Uint8Array(4))).map(x => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[x % 31]).join("");

const BANNED = ["fuck","shit","bitch","cunt","dick","fag","nigg","retard","kys","kill yourself","slut","whore"];
function clean(t: string, max = 400) {
  let out = String(t || "").slice(0, max);
  for (const w of BANNED) {
    const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = out.replace(re, (m) => "★".repeat(Math.min(m.length, 6)));
  }
  return out.trim();
}
const priv = (t: unknown, max = 500) => String(t || "").slice(0, max).trim();
const sydToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
function sydYesterday() {
  const d = new Date(Date.now() - 864e5);
  return d.toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
}

async function db(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`db ${r.status}: ${await r.text()}`);
  const txt = await r.text();
  return txt ? JSON.parse(txt) : null;
}

async function getPlayer(pid: string) {
  const rows = await db(`ll_players?id=eq.${pid}&select=*`);
  return rows?.[0] || null;
}
async function auth(pid: string, pin: string) {
  const p = await getPlayer(pid);
  if (!p) return null;
  const h = await pinHash(p.name_key, String(pin || ""));
  return h === p.pin_hash ? p : null;
}
async function getCoach(id: string) {
  const rows = await db(`ll_coaches?id=eq.${id}&select=*`);
  return rows?.[0] || null;
}
async function authCoach(id: string, pin: string) {
  const c = await getCoach(id);
  if (!c) return null;
  const h = await coachPinHash(c.username, String(pin || ""));
  return h === c.pin_hash ? c : null;
}
function publicCoach(c: any) {
  return {
    id: c.id, display_name: c.display_name, username: c.username, photo: c.photo || null,
    bio: c.bio || "", philosophy: c.philosophy || "", specialties: c.specialties || [],
    fav_drills: c.fav_drills || "", fav_quote: c.fav_quote || "", experience: c.experience || "",
    teaching_style: c.teaching_style || "", session_rate: Number(c.session_rate || 0), status: c.status,
    availability: c.availability || "", notes: c.notes || "",
    permissions: { ...DEFAULT_COACH_PERMS, ...(c.permissions || {}) }, completed_sessions: c.completed_sessions || 0,
    created_at: c.created_at,
  };
}
const coachSessions = (cid: string) => db(`ll_sessions?coach_id=eq.${cid}&select=id,title,starts_at,link,note,descr,chapters,deck,player_count,status&order=starts_at.asc&limit=60`);

function publicProfile(p: any) {
  return { id: p.id, name: p.name, pos: p.pos, age: p.age, xp: p.xp, streak: p.streak, sessions: p.sessions, last_checkin: p.last_checkin, prefs: p.prefs || {}, founding: !!p.founding };
}

const activeRuns = () => db(`ll_runs?created_at=gt.${encodeURIComponent(new Date(Date.now() - RUN_TTL_MS).toISOString())}&select=court,created_at,player:ll_players(name,founding)&order=created_at.desc&limit=15`);
const upcomingSessions = () => db(`ll_sessions?starts_at=gt.${encodeURIComponent(new Date(Date.now() - 2 * 3600 * 1000).toISOString())}&coach_id=is.null&select=id,title,starts_at,link,note,descr,chapters,deck&order=starts_at.asc&limit=40`);

function buildAI(p: any, checkins: any[], intel: any[], journal: any[]) {
  const out: [string, string][] = [];
  if (!checkins.length) {
    out.push(["▲", "No data yet. Log your first check-in and the Lab starts building your profile."]);
  } else {
    const last = checkins.slice(0, 5);
    const avg = (k: string) => Math.round(last.reduce((a, l) => a + (l[k] || 0), 0) / last.length * 10) / 10;
    const conf = avg("conf"), energy = avg("energy");
    const mins = checkins.reduce((a, l) => a + (l.mins || 0), 0);
    if (checkins.length >= 4) {
      const older = checkins.slice(4, 8);
      if (older.length) {
        const oc = older.reduce((a, l) => a + (l.conf || 0), 0) / older.length;
        out.push(conf > oc + 0.5 ? ["▲", "Confidence trending up — whatever you’re doing, keep the routine."]
          : conf < oc - 0.5 ? ["▼", "Confidence dipped this week. Go back to the four reads — small wins first."]
          : ["●", `Confidence steady at ${conf}/10. Consistency is a skill.`]);
      }
    } else {
      out.push(["●", `Baseline forming: confidence ${conf}/10, energy ${energy}/10 over your last check-ins.`]);
    }
    out.push(["●", `${mins} total minutes logged on your game. ${mins >= 300 ? "Volume is elite." : "Every rep is data."}`]);
    const fc: Record<string, number> = {};
    checkins.forEach(c => (c.focus || []).forEach((f: string) => fc[f] = (fc[f] || 0) + 1));
    const top = Object.entries(fc).sort((a, b) => b[1] - a[1])[0];
    if (top) out.push(["●", `You gravitate to ${top[0]} work (${top[1]}× logged). The Lab will push your weak side next.`]);
    if (p.streak >= 3) out.push(["🔥", `Streak of ${p.streak} days — accountability compounds.`]);
  }
  const mind = journal.filter(j => j.kind === "mind");
  if (mind.length) {
    const tc: Record<string, number> = {};
    mind.forEach(m => { const t = m.data?.trigger; if (t) tc[t] = (tc[t] || 0) + 1; });
    const topT = Object.entries(tc).sort((a, b) => b[1] - a[1])[0];
    if (mind.length >= 2 && topT) out.push(["◎", `Mental file: “${topT[0]}” rattles you most (${topT[1]}×). You’ve already written the counter — run the plan, not the emotion.`]);
    else out.push(["◎", `${mind.length} moment${mind.length > 1 ? "s" : ""} flushed in the mental file. Writing it down IS the rep.`]);
  }
  const fuel = journal.filter(j => j.kind === "fuel").slice(0, 5);
  if (fuel.length >= 2) {
    const aw = fuel.reduce((a, f) => a + (f.data?.water || 0), 0) / fuel.length;
    out.push(aw >= 6 ? ["⬢", `Hydration averaging ${Math.round(aw)}/8 — legs will thank you in the fourth.`]
      : ["⬢", `Water averaging ${Math.round(aw)}/8. Cramps guard nobody — keep the bottle moving.`]);
  }
  intel.slice(-2).forEach(n => out.push(["◆", "Pattern detected: " + n.text]));
  return out;
}

async function playerState(p: any) {
  const [checkins, hw, posts, msgs, intel, journal, invites, coachq, runs, sessions] = await Promise.all([
    db(`ll_checkins?player_id=eq.${p.id}&select=d,energy,conf,mins,focus,note&order=d.desc&limit=14`),
    db(`ll_homework?player_id=eq.${p.id}&select=id,text,done,created_at&order=created_at.desc&limit=10`),
    db(`ll_posts?select=id,author_name,is_coach,text,likes,created_at&order=created_at.desc&limit=30`),
    db(`ll_messages?player_id=eq.${p.id}&select=id,from_coach,text,created_at&order=created_at.asc&limit=100`),
    db(`ll_intel?player_id=eq.${p.id}&select=text,created_at&order=created_at.asc`),
    db(`ll_journal?player_id=eq.${p.id}&select=id,kind,d,data,share_coach,created_at&order=created_at.desc&limit=40`),
    db(`ll_invites?player_id=eq.${p.id}&select=id,friend_name,status,code,code_at,used_by,created_at&order=created_at.desc&limit=10`),
    db(`ll_coach_q?player_id=eq.${p.id}&select=id,coach,question,answer,answered_at,created_at&order=created_at.desc&limit=20`),
    activeRuns(),
    upcomingSessions(),
  ]);
  const today = sydToday();
  return {
    profile: publicProfile(p), checkins, homework: hw, posts, messages: msgs,
    ai: buildAI(p, checkins, intel, journal),
    mind: journal.filter((j: any) => j.kind === "mind").slice(0, 10),
    diary: journal.filter((j: any) => j.kind === "diary").slice(0, 10),
    fuel_today: journal.find((j: any) => j.kind === "fuel" && j.d === today) || null,
    invites, coachq, runs, sessions,
    today,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const b = await req.json().catch(() => ({} as any));
    const a = b.action;

    if (a === "register") {
      const name = String(b.name || "").trim().slice(0, 40);
      const pin = String(b.pin || "").trim();
      const inviteCode = String(b.invite || "").trim().toUpperCase();
      const contact = priv(b.contact, 80);
      const why = priv(b.why, 140);
      if (name.length < 2) return J({ error: "Add your name." }, 400);
      if (!/^\d{4}$/.test(pin)) return J({ error: "PIN must be 4 digits." }, 400);
      const key = name.toLowerCase();
      const dup = await db(`ll_players?name_key=eq.${encodeURIComponent(key)}&select=id`);
      if (dup.length) return J({ error: "That name is taken — log in instead, or add a last initial." }, 409);

      if (!inviteCode) {
        if (why.length < 3) return J({ error: "Make your case — why should UNC let you in?" }, 400);
        const rows = await db("ll_players", { method: "POST", headers: { Prefer: "return=representation" },
          body: JSON.stringify({ name, name_key: key, pos: b.pos || null, age: b.age || null, pin_hash: await pinHash(key, pin), status: "pending", contact: contact || null, why: why || null }) });
        await pushCoach();
        return J({ ok: true, pid: rows[0].id, pending: true });
      }

      const inv = (await db(`ll_invites?code=eq.${encodeURIComponent(inviteCode)}&status=eq.approved&select=id,used_by,player_id,friend_name,code_at,max_uses,use_count`))?.[0];
      if (!inv) return J({ error: "That code doesn’t open this door. Check it — or leave the code blank and knock instead." }, 403);
      const maxUses = inv.max_uses || 1;
      const isBatch = maxUses > 1;
      if (inv.used_by || (inv.use_count || 0) >= maxUses) {
        return J({ error: isBatch ? "That code’s full — every spot’s been claimed. Ask UNC for a fresh one." : "That code’s already been used — each one works once." }, 403);
      }
      if (!inv.code_at || Date.now() - new Date(inv.code_at).getTime() > ttlFor(maxUses)) {
        return J({ error: isBatch ? "That code’s expired. Ask UNC for a fresh one, or leave it blank and knock." : "That code’s burned — they only live 6 hours. Ask for a fresh one, or leave it blank and knock." }, 403);
      }
      const rows = await db("ll_players", { method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ name, name_key: key, pos: b.pos || null, age: b.age || null, pin_hash: await pinHash(key, pin), status: "active", contact: contact || null, why: why || null }) });
      const p = rows[0];
      const patch: any = { use_count: (inv.use_count || 0) + 1 };
      if (!isBatch) { patch.used_by = p.id; patch.used_at = new Date().toISOString(); }
      await db(`ll_invites?id=eq.${inv.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      let vouch = "";
      if (inv.player_id) { const v = await getPlayer(inv.player_id); if (v) vouch = ` Vouched by ${v.name}.`; }
      await db("ll_posts", { method: "POST", body: JSON.stringify({ author_name: "The Lab", is_coach: true, text: `🔒 ${name} just joined the Lab.${vouch} Welcome to the founding squad.` }) });
      return J({ ok: true, pid: p.id, state: await playerState(p) });
    }

    if (a === "login") {
      const key = String(b.name || "").trim().toLowerCase();
      const pin = String(b.pin || "").trim();
      const rows = await db(`ll_players?name_key=eq.${encodeURIComponent(key)}&select=*`);
      const p = rows?.[0];
      if (!p || (await pinHash(key, pin)) !== p.pin_hash) return J({ error: "Name or PIN doesn’t match." }, 401);
      if (p.status === "pending") return J({ ok: true, pid: p.id, pending: true });
      return J({ ok: true, pid: p.id, state: await playerState(p) });
    }

    if (a === "coach_login") {
      const key = String(b.username || "").trim().toLowerCase();
      const pin = String(b.pin || "").trim();
      if (!key) return J({ error: "Enter your username." }, 400);
      const rows = await db(`ll_coaches?username=eq.${encodeURIComponent(key)}&select=*`);
      const c = rows?.[0];
      if (!c || (await coachPinHash(key, pin)) !== c.pin_hash) return J({ error: "Wrong username or PIN." }, 401);
      if (c.status !== "active") return J({ error: "Your coach account is paused. Talk to the admin." }, 403);
      return J({ ok: true, cid: c.id, coach: publicCoach(c), sessions: await coachSessions(c.id) });
    }

    if (a === "coach_register") {
      const code = String(b.code || "").trim().toUpperCase();
      const display = priv(b.display_name, 40);
      const username = priv(b.username, 24).toLowerCase().replace(/[^a-z0-9_]/g, "");
      const pin = String(b.pin || "").trim();
      if (display.length < 2) return J({ error: "Add your name." }, 400);
      if (username.length < 2) return J({ error: "Pick a username (letters and numbers)." }, 400);
      if (!/^\d{4}$/.test(pin)) return J({ error: "PIN must be 4 digits." }, 400);
      const cc = (await db(`ll_coach_codes?code=eq.${encodeURIComponent(code)}&status=eq.open&select=id,created_at`))?.[0];
      if (!cc) return J({ error: "That coach code isn’t valid — check it, or request one." }, 403);
      if (Date.now() - new Date(cc.created_at).getTime() > COACH_CODE_TTL_MS) return J({ error: "That coach code has expired — they only live 6 hours. Ask the admin for a fresh one." }, 403);
      const dup = await db(`ll_coaches?username=eq.${encodeURIComponent(username)}&select=id`);
      if (dup.length) return J({ error: "That username is taken — pick another." }, 409);
      const rows = await db("ll_coaches", { method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ display_name: display, username, pin_hash: await coachPinHash(username, pin), permissions: DEFAULT_COACH_PERMS }) });
      const c = rows[0];
      await db(`ll_coach_codes?id=eq.${cc.id}`, { method: "PATCH", body: JSON.stringify({ status: "used", used_by: c.id }) });
      await pushCoach();
      return J({ ok: true, cid: c.id, coach: publicCoach(c), sessions: [], fresh: true });
    }

    if (a === "coach_request") {
      const name = priv(b.name, 40);
      const contact = priv(b.contact, 80);
      const why = priv(b.why, 300);
      if (name.length < 2) return J({ error: "Add your name." }, 400);
      if (why.length < 10) return J({ error: "Tell the admin a bit about your coaching — a couple of lines." }, 400);
      const pend = await db("ll_coach_reqs?status=eq.pending&select=id");
      if ((pend?.length || 0) >= 50) return J({ error: "Requests are full right now — try again soon." }, 429);
      await db("ll_coach_reqs", { method: "POST", body: JSON.stringify({ name, contact: contact || null, why }) });
      await pushCoach();
      return J({ ok: true });
    }

    if (["coach_state", "coach_profile_edit", "coach_session_complete", "push_sub_coach"].includes(a)) {
      const c = await authCoach(b.cid, b.pin);
      if (!c) return J({ error: "unauthorized" }, 401);
      if (c.status !== "active") return J({ error: "Your coach account is paused." }, 403);
      const perms = { ...DEFAULT_COACH_PERMS, ...(c.permissions || {}) };

      if (a === "coach_state") return J({ ok: true, coach: publicCoach(c), sessions: await coachSessions(c.id) });

      if (a === "push_sub_coach") {
        const sub = b.sub;
        if (!sub || !sub.endpoint) return J({ error: "no subscription" }, 400);
        await db(`ll_push?sub->>endpoint=eq.${encodeURIComponent(sub.endpoint)}`, { method: "DELETE" });
        await db("ll_push", { method: "POST", body: JSON.stringify({ role: "staffcoach", player_id: c.id, sub }) });
        return J({ ok: true });
      }

      if (a === "coach_profile_edit") {
        if (!perms.canEditProfile) return J({ error: "Editing your profile is switched off by the admin." }, 403);
        const patch: any = {};
        if (b.display_name !== undefined) patch.display_name = priv(b.display_name, 40);
        if (b.bio !== undefined) patch.bio = priv(b.bio, 600);
        if (b.philosophy !== undefined) patch.philosophy = priv(b.philosophy, 600);
        if (b.fav_quote !== undefined) patch.fav_quote = priv(b.fav_quote, 200);
        if (b.fav_drills !== undefined) patch.fav_drills = priv(b.fav_drills, 400);
        if (b.experience !== undefined) patch.experience = priv(b.experience, 200);
        if (b.teaching_style !== undefined) patch.teaching_style = priv(b.teaching_style, 120);
        if (b.photo !== undefined) patch.photo = priv(b.photo, 300);
        if (Array.isArray(b.specialties)) patch.specialties = b.specialties.slice(0, 8).map((s: unknown) => priv(s, 30)).filter(Boolean);
        if (b.session_rate !== undefined && perms.canViewEarnings) patch.session_rate = Math.max(0, Math.min(100000, parseFloat(b.session_rate) || 0));
        if (Object.keys(patch).length) await db(`ll_coaches?id=eq.${c.id}`, { method: "PATCH", body: JSON.stringify(patch) });
        return J({ ok: true, coach: publicCoach(await getCoach(c.id)) });
      }

      if (a === "coach_session_complete") {
        if (!perms.canJoinSessions) return J({ error: "not allowed" }, 403);
        const s = (await db(`ll_sessions?id=eq.${b.sid}&coach_id=eq.${c.id}&select=id,status`))?.[0];
        if (!s) return J({ error: "no session" }, 404);
        if (s.status !== "completed") {
          await db(`ll_sessions?id=eq.${b.sid}`, { method: "PATCH", body: JSON.stringify({ status: "completed" }) });
          await db(`ll_coaches?id=eq.${c.id}`, { method: "PATCH", body: JSON.stringify({ completed_sessions: (c.completed_sessions || 0) + 1 }) });
        }
        return J({ ok: true, sessions: await coachSessions(c.id), coach: publicCoach(await getCoach(c.id)) });
      }
    }

    if (["state", "checkin", "post", "like", "msg", "mind", "diary", "fuel", "pref", "invite_req", "askcoach", "run_add", "push_sub_p"].includes(a)) {
      const p = await auth(b.pid, b.pin);
      if (!p) return J({ error: "unauthorized" }, 401);
      if (p.status === "pending") {
        if (a === "state") return J({ ok: true, pending: true });
        return J({ error: "Still waiting on UNC to open the door." }, 403);
      }
      const today = sydToday();

      if (a === "state") return J({ ok: true, state: await playerState(p) });

      if (a === "push_sub_p") {
        const sub = b.sub;
        if (!sub || !sub.endpoint) return J({ error: "no subscription" }, 400);
        await db(`ll_push?sub->>endpoint=eq.${encodeURIComponent(sub.endpoint)}`, { method: "DELETE" });
        await db("ll_push", { method: "POST", body: JSON.stringify({ role: "player", player_id: p.id, sub }) });
        return J({ ok: true });
      }

      if (a === "run_add") {
        const court = priv(b.court, 60);
        if (court.length < 2) return J({ error: "Which court are you at?" }, 400);
        await db(`ll_runs?player_id=eq.${p.id}`, { method: "DELETE" });
        await db("ll_runs", { method: "POST", body: JSON.stringify({ player_id: p.id, court }) });
        return J({ ok: true, runs: await activeRuns() });
      }

      if (a === "pref") {
        const learn = priv(b.learn, 30);
        const prefs = { ...(p.prefs || {}), ...(learn ? { learn } : {}) };
        await db(`ll_players?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ prefs }) });
        return J({ ok: true, prefs });
      }

      if (a === "invite_req") {
        const friend = priv(b.friend, 40);
        if (friend.length < 2) return J({ error: "Who are you bringing? Add their name." }, 400);
        const pend = await db(`ll_invites?player_id=eq.${p.id}&status=eq.pending&select=id`);
        if ((pend?.length || 0) >= 3) return J({ error: "3 invites already waiting on coach. Hold tight." }, 429);
        await db("ll_invites", { method: "POST", body: JSON.stringify({ player_id: p.id, friend_name: friend }) });
        await pushCoach();
        return J({ ok: true, state: await playerState(p) });
      }

      if (a === "askcoach") {
        const coach = String(b.coach || "").toLowerCase();
        if (!COACH_KEYS.includes(coach)) return J({ error: "Pick a coach first." }, 400);
        const q = clean(String(b.question || ""), 500);
        if (q.length < 5) return J({ error: "Ask it properly — give the coach something to work with." }, 400);
        const open = await db(`ll_coach_q?player_id=eq.${p.id}&answer=is.null&select=id`);
        if ((open?.length || 0) >= 5) return J({ error: "5 questions already in the queue. Let the coaches cook." }, 429);
        await db("ll_coach_q", { method: "POST", body: JSON.stringify({ player_id: p.id, coach, question: q }) });
        return J({ ok: true, state: await playerState(p) });
      }

      if (a === "checkin") {
        if (p.last_checkin === today) return J({ error: "Already checked in today." }, 409);
        await db("ll_checkins", { method: "POST", body: JSON.stringify({
          player_id: p.id, d: today,
          energy: Math.max(1, Math.min(10, +b.energy || 5)),
          conf: Math.max(1, Math.min(10, +b.conf || 5)),
          mins: Math.max(0, Math.min(600, +b.mins || 0)),
          focus: Array.isArray(b.focus) ? b.focus.slice(0, 6) : [],
          note: clean(b.note || ""),
        }) });
        const streak = p.last_checkin === sydYesterday() ? p.streak + 1 : 1;
        await db(`ll_players?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ xp: p.xp + 40, streak, last_checkin: today }) });
        return J({ ok: true, state: await playerState(await getPlayer(p.id)) });
      }

      if (a === "mind") {
        const data = {
          trigger: priv(b.trigger, 40), when: priv(b.when, 20),
          said: priv(b.said, 500),
          feelings: Array.isArray(b.feelings) ? b.feelings.slice(0, 6).map((f: unknown) => priv(f, 24)) : [],
          impact: Math.max(1, Math.min(10, +b.impact || 5)),
          plan: priv(b.plan, 500),
        };
        if (!data.said && !data.plan && !data.trigger) return J({ error: "empty" }, 400);
        await db("ll_journal", { method: "POST", body: JSON.stringify({ player_id: p.id, kind: "mind", d: today, data, share_coach: !!b.share_coach }) });
        const todayMind = await db(`ll_journal?player_id=eq.${p.id}&kind=eq.mind&d=eq.${today}&select=id`);
        let gained = 0;
        if ((todayMind?.length || 0) <= 3) { gained = 30; await db(`ll_players?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ xp: p.xp + 30 }) }); }
        return J({ ok: true, gained, state: await playerState(await getPlayer(p.id)) });
      }

      if (a === "diary") {
        const text = priv(b.text, 1000);
        if (!text) return J({ error: "empty" }, 400);
        const already = await db(`ll_journal?player_id=eq.${p.id}&kind=eq.diary&d=eq.${today}&select=id`);
        await db("ll_journal", { method: "POST", body: JSON.stringify({ player_id: p.id, kind: "diary", d: today, data: { text }, share_coach: false }) });
        let gained = 0;
        if (!(already?.length)) { gained = 15; await db(`ll_players?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ xp: p.xp + 15 }) }); }
        return J({ ok: true, gained, state: await playerState(await getPlayer(p.id)) });
      }

      if (a === "fuel") {
        const rows = await db(`ll_journal?player_id=eq.${p.id}&kind=eq.fuel&d=eq.${today}&select=id,data`);
        const ex = rows?.[0];
        const pills = Array.isArray(b.pills) ? b.pills.slice(0, 10).map((x: unknown) => priv(x, 24)) : (ex?.data?.pills || []);
        const water = Math.max(0, Math.min(12, +b.water >= 0 ? +b.water : (ex?.data?.water || 0)));
        let gained = 0;
        const fresh = await getPlayer(p.id);
        const data: any = { pills, water, xp_pills: !!ex?.data?.xp_pills, xp_water: !!ex?.data?.xp_water };
        if (!data.xp_pills && pills.length) { data.xp_pills = true; gained += 20; }
        if (!data.xp_water && water >= 8) { data.xp_water = true; gained += 15; }
        if (ex) await db(`ll_journal?id=eq.${ex.id}`, { method: "PATCH", body: JSON.stringify({ data }) });
        else await db("ll_journal", { method: "POST", body: JSON.stringify({ player_id: p.id, kind: "fuel", d: today, data, share_coach: true }) });
        if (gained) { await db(`ll_players?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ xp: fresh.xp + gained }) }); }
        return J({ ok: true, gained, state: await playerState(await getPlayer(p.id)) });
      }

      if (a === "post") {
        const text = clean(b.text);
        if (!text) return J({ error: "empty" }, 400);
        await db("ll_posts", { method: "POST", body: JSON.stringify({ author_name: p.name, author_id: p.id, text }) });
        return J({ ok: true, state: await playerState(p) });
      }

      if (a === "like") {
        const rows = await db(`ll_posts?id=eq.${b.post_id}&select=likes`);
        if (rows?.[0]) await db(`ll_posts?id=eq.${b.post_id}`, { method: "PATCH", body: JSON.stringify({ likes: rows[0].likes + 1 }) });
        return J({ ok: true });
      }

      if (a === "msg") {
        const text = clean(b.text);
        if (!text) return J({ error: "empty" }, 400);
        await db("ll_messages", { method: "POST", body: JSON.stringify({ player_id: p.id, from_coach: false, text }) });
        const msgs = await db(`ll_messages?player_id=eq.${p.id}&select=id,from_coach,text,created_at&order=created_at.asc&limit=100`);
        return J({ ok: true, messages: msgs });
      }
    }

    if (["roster", "cdetail", "intel_add", "hw_add", "attend", "cmsg", "cpost", "invite_approve", "invite_deny", "invite_mint", "answerq", "knock_approve", "knock_deny", "founding_set", "push_sub", "player_edit", "player_delete", "session_add", "session_del", "program_add", "deckreq_add", "deckreq_done", "deckreq_del", "coach_add", "coach_list", "coach_edit", "coach_set_status", "coach_set_perms", "coach_delete", "coach_assign_session", "coach_unassign_session", "coach_code_mint", "coach_code_del", "coach_req_approve", "coach_req_deny"].includes(a)) {
      if (String(b.code || "").toUpperCase() !== COACH_CODE) return J({ error: "bad coach code" }, 401);

      if (a === "push_sub") {
        const sub = b.sub;
        if (!sub || !sub.endpoint) return J({ error: "no subscription" }, 400);
        await db(`ll_push?sub->>endpoint=eq.${encodeURIComponent(sub.endpoint)}`, { method: "DELETE" });
        await db("ll_push", { method: "POST", body: JSON.stringify({ role: "coach", sub }) });
        return J({ ok: true });
      }
      if (a === "coach_list") {
        const [coaches, reqs, codes] = await Promise.all([
          db("ll_coaches?select=*&order=created_at.asc"),
          db("ll_coach_reqs?status=eq.pending&select=id,name,contact,why,created_at&order=created_at.asc"),
          db("ll_coach_codes?status=eq.open&select=id,code,label,created_at&order=created_at.desc&limit=40"),
        ]);
        const cs = coaches || [];
        const withStats = await Promise.all(cs.map(async (c: any) => {
          const sess = await db(`ll_sessions?coach_id=eq.${c.id}&select=id,title,starts_at,link,note,player_count,status&order=starts_at.asc&limit=60`);
          return { ...publicCoach(c), sessions: sess || [] };
        }));
        const now = Date.now();
        const openCodes = (codes || []).filter((cc: any) => now - new Date(cc.created_at).getTime() <= COACH_CODE_TTL_MS);
        return J({ ok: true, coaches: withStats, requests: reqs || [], codes: openCodes });
      }
      if (a === "coach_code_mint") {
        const label = priv(b.label, 40) || "Coach code";
        const code = coachMintCode();
        await db("ll_coach_codes", { method: "POST", body: JSON.stringify({ code, label }) });
        return J({ ok: true, code });
      }
      if (a === "coach_code_del") {
        await db(`ll_coach_codes?id=eq.${b.ccid}`, { method: "DELETE" });
        return J({ ok: true });
      }
      if (a === "coach_req_approve") {
        await db(`ll_coach_reqs?id=eq.${b.rid}&status=eq.pending`, { method: "PATCH", body: JSON.stringify({ status: "approved" }) });
        const code = coachMintCode();
        await db("ll_coach_codes", { method: "POST", body: JSON.stringify({ code, label: priv(b.label, 40) || "Approved coach" }) });
        return J({ ok: true, code });
      }
      if (a === "coach_req_deny") {
        await db(`ll_coach_reqs?id=eq.${b.rid}&status=eq.pending`, { method: "PATCH", body: JSON.stringify({ status: "denied" }) });
        return J({ ok: true });
      }
      if (a === "coach_add") {
        const display = priv(b.display_name, 40);
        const username = priv(b.username, 24).toLowerCase().replace(/[^a-z0-9_]/g, "");
        const pin = String(b.pin || "").trim();
        if (display.length < 2) return J({ error: "Give the coach a name." }, 400);
        if (username.length < 2) return J({ error: "Give the coach a username (letters/numbers)." }, 400);
        if (!/^\d{4}$/.test(pin)) return J({ error: "Coach PIN must be 4 digits." }, 400);
        const dup = await db(`ll_coaches?username=eq.${encodeURIComponent(username)}&select=id`);
        if (dup.length) return J({ error: "That username is taken." }, 409);
        const rows = await db("ll_coaches", { method: "POST", headers: { Prefer: "return=representation" },
          body: JSON.stringify({ display_name: display, username, pin_hash: await coachPinHash(username, pin), permissions: DEFAULT_COACH_PERMS }) });
        return J({ ok: true, coach: publicCoach(rows[0]) });
      }
      if (a === "coach_edit") {
        const c = await getCoach(b.coach_id);
        if (!c) return J({ error: "no coach" }, 404);
        const patch: any = {};
        for (const f of ["display_name", "bio", "philosophy", "fav_quote", "fav_drills", "experience", "teaching_style", "photo", "availability", "notes"]) {
          if (b[f] !== undefined) patch[f] = priv(b[f], (f === "bio" || f === "philosophy" || f === "fav_drills" || f === "notes") ? 600 : 300);
        }
        if (Array.isArray(b.specialties)) patch.specialties = b.specialties.slice(0, 8).map((s: unknown) => priv(s, 30)).filter(Boolean);
        if (b.session_rate !== undefined) patch.session_rate = Math.max(0, Math.min(100000, parseFloat(b.session_rate) || 0));
        if (b.new_pin) { if (!/^\d{4}$/.test(String(b.new_pin))) return J({ error: "PIN must be 4 digits." }, 400); patch.pin_hash = await coachPinHash(c.username, String(b.new_pin)); }
        if (Object.keys(patch).length) await db(`ll_coaches?id=eq.${c.id}`, { method: "PATCH", body: JSON.stringify(patch) });
        return J({ ok: true });
      }
      if (a === "coach_set_status") {
        await db(`ll_coaches?id=eq.${b.coach_id}`, { method: "PATCH", body: JSON.stringify({ status: b.status === "active" ? "active" : "inactive" }) });
        return J({ ok: true });
      }
      if (a === "coach_set_perms") {
        const c = await getCoach(b.coach_id);
        if (!c) return J({ error: "no coach" }, 404);
        const cur = { ...DEFAULT_COACH_PERMS, ...(c.permissions || {}) };
        const incoming = b.permissions || {};
        const next: any = {};
        for (const k of Object.keys(DEFAULT_COACH_PERMS)) next[k] = typeof incoming[k] === "boolean" ? incoming[k] : (cur as any)[k];
        await db(`ll_coaches?id=eq.${c.id}`, { method: "PATCH", body: JSON.stringify({ permissions: next }) });
        return J({ ok: true, permissions: next });
      }
      if (a === "coach_delete") {
        await db(`ll_sessions?coach_id=eq.${b.coach_id}`, { method: "DELETE" });
        await db(`ll_coaches?id=eq.${b.coach_id}`, { method: "DELETE" });
        return J({ ok: true });
      }
      if (a === "coach_assign_session") {
        const title = priv(b.title, 60);
        const link = priv(b.link, 300);
        const note = priv(b.note, 200);
        const when = new Date(String(b.starts_at || ""));
        const pc = Math.max(0, Math.min(200, parseInt(b.player_count, 10) || 0));
        if (!b.coach_id) return J({ error: "Pick a coach." }, 400);
        if (title.length < 2) return J({ error: "Give the session a name." }, 400);
        if (isNaN(when.getTime())) return J({ error: "Pick a date and time." }, 400);
        if (link && !/^https?:\/\//i.test(link)) return J({ error: "Zoom link needs the full https:// address." }, 400);
        await db("ll_sessions", { method: "POST", body: JSON.stringify({ title, starts_at: when.toISOString(), link: link || null, note: note || null, coach_id: b.coach_id, player_count: pc, status: "scheduled" }) });
        await pushStaffCoach(b.coach_id);
        return J({ ok: true });
      }
      if (a === "coach_unassign_session") {
        await db(`ll_sessions?id=eq.${b.sid}`, { method: "DELETE" });
        return J({ ok: true });
      }
      if (a === "session_add" || a === "program_add") {
        const title = priv(b.title, 60);
        const link = priv(b.link, 300);
        const note = priv(b.note, 200);
        const descr = priv(b.descr, 800);
        const deck = priv(b.deck, 300);
        const chapters = Array.isArray(b.chapters) ? b.chapters.slice(0, 14).map((c: any) => ({ t: priv(c && c.t, 60), d: priv(c && c.d, 90) })).filter((c: any) => c.t) : [];
        const when = new Date(String(b.starts_at || ""));
        const weeks = a === "program_add" ? Math.max(2, Math.min(12, parseInt(b.weeks, 10) || 6)) : 1;
        if (title.length < 2) return J({ error: "Give the session a name." }, 400);
        if (isNaN(when.getTime())) return J({ error: "Pick a date and time." }, 400);
        if (link && !/^https?:\/\//i.test(link)) return J({ error: "That link doesn’t look right — paste the full Zoom URL." }, 400);
        if (deck && !/^https?:\/\//i.test(deck)) return J({ error: "That deck link needs the full https:// address." }, 400);
        const rows = [];
        for (let w = 0; w < weeks; w++) {
          rows.push({ title: weeks > 1 ? `${title} · Week ${w + 1}/${weeks}` : title, starts_at: new Date(when.getTime() + w * 7 * 24 * 3600 * 1000).toISOString(), link: link || null, note: note || null, descr: descr || null, chapters, deck: deck || null });
        }
        await db("ll_sessions", { method: "POST", body: JSON.stringify(rows) });
        await pushAllPlayers();
        return J({ ok: true, count: rows.length, sessions: await upcomingSessions() });
      }
      if (a === "session_del") {
        await db(`ll_sessions?id=eq.${b.sid}`, { method: "DELETE" });
        return J({ ok: true, sessions: await upcomingSessions() });
      }
      if (a === "deckreq_add") {
        const topic = priv(b.topic, 140);
        if (topic.length < 3) return J({ error: "Give the deck a topic." }, 400);
        const open = await db("ll_deckreq?status=eq.pending&select=id");
        if ((open?.length || 0) >= 5) return J({ error: "5 decks already on the bench — let Claude cook." }, 429);
        const rows = await db("ll_deckreq", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ topic }) });
        return J({ ok: true, id: rows[0].id });
      }
      if (a === "deckreq_done") {
        const url = priv(b.url, 300);
        if (url && !/^https?:\/\//i.test(url)) return J({ error: "bad url" }, 400);
        await db(`ll_deckreq?id=eq.${b.rid}`, { method: "PATCH", body: JSON.stringify({ status: "ready", url: url || null }) });
        await pushCoach();
        return J({ ok: true });
      }
      if (a === "deckreq_del") {
        await db(`ll_deckreq?id=eq.${b.rid}`, { method: "DELETE" });
        return J({ ok: true });
      }
      if (a === "player_edit") {
        const p = await getPlayer(b.pid);
        if (!p) return J({ error: "no player" }, 404);
        const patch: any = {};
        if (b.pos !== undefined) patch.pos = priv(b.pos, 8) || null;
        if (b.age !== undefined) patch.age = Math.max(5, Math.min(99, parseInt(b.age, 10) || 0)) || null;
        if (b.contact !== undefined) patch.contact = priv(b.contact, 80) || null;
        if (b.new_pin) {
          if (!/^\d{4}$/.test(String(b.new_pin))) return J({ error: "New PIN must be 4 digits." }, 400);
          patch.pin_hash = await pinHash(p.name_key, String(b.new_pin));
        }
        if (Object.keys(patch).length) await db(`ll_players?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify(patch) });
        return J({ ok: true });
      }
      if (a === "player_delete") {
        const p = await getPlayer(b.pid);
        if (!p) return J({ ok: true });
        for (const t of ["ll_checkins", "ll_homework", "ll_intel", "ll_messages", "ll_journal", "ll_coach_q", "ll_runs", "ll_push"]) {
          try { await db(`${t}?player_id=eq.${p.id}`, { method: "DELETE" }); } catch (_) { /* keep going */ }
        }
        try { await db(`ll_invites?player_id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ player_id: null }) }); } catch (_) {}
        try { await db(`ll_invites?used_by=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ used_by: null }) }); } catch (_) {}
        try { await db(`ll_posts?author_id=eq.${p.id}`, { method: "DELETE" }); } catch (_) {}
        await db(`ll_players?id=eq.${p.id}`, { method: "DELETE" });
        return J({ ok: true });
      }
      if (a === "roster") {
        const cutoff = new Date(Date.now() - BATCH_TTL_MS).toISOString();
        const [players, posts, invites, active, questions, knocks, runs, sessions, deckreqs, creqs] = await Promise.all([
          db("ll_players?status=eq.active&select=id,name,pos,age,xp,streak,sessions,last_checkin,prefs,founding,contact,created_at&order=created_at.asc"),
          db("ll_posts?select=id,author_name,is_coach,text,likes,created_at&order=created_at.desc&limit=30"),
          db("ll_invites?status=eq.pending&select=id,friend_name,created_at,player:ll_players!ll_invites_player_id_fkey(name)&order=created_at.asc"),
          db(`ll_invites?status=eq.approved&used_by=is.null&code_at=gt.${encodeURIComponent(cutoff)}&select=id,friend_name,code,code_at,created_at,max_uses,use_count,player:ll_players!ll_invites_player_id_fkey(name)&order=code_at.desc&limit=60`),
          db("ll_coach_q?answer=is.null&select=id,coach,question,created_at,player:ll_players(name)&order=created_at.asc&limit=30"),
          db("ll_players?status=eq.pending&select=id,name,pos,age,contact,why,created_at&order=created_at.asc"),
          activeRuns(),
          upcomingSessions(),
          db("ll_deckreq?select=id,topic,status,url,created_at&order=created_at.desc&limit=12"),
          db("ll_coach_reqs?status=eq.pending&select=id,name,contact,why,created_at&order=created_at.asc"),
        ]);
        const now = Date.now();
        const active_codes = (active || []).filter((c: any) => {
          const mu = c.max_uses || 1;
          const alive = c.code_at && (now - new Date(c.code_at).getTime()) <= ttlFor(mu);
          return alive && (mu - (c.use_count || 0)) > 0;
        });
        return J({ ok: true, today: sydToday(), players, posts, invites, active_codes, questions, knocks, runs, sessions, deckreqs, coach_reqs: creqs || [] });
      }
      if (a === "knock_approve") {
        const p = await getPlayer(b.pid);
        if (!p || p.status !== "pending") return J({ error: "That knock’s gone." }, 404);
        await db(`ll_players?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ status: "active" }) });
        await db("ll_posts", { method: "POST", body: JSON.stringify({ author_name: "The Lab", is_coach: true, text: `🔒 ${p.name} knocked — UNC opened the door. Welcome to the Lab.` }) });
        await pushPlayer(p.id);
        return J({ ok: true });
      }
      if (a === "knock_deny") {
        await db(`ll_players?id=eq.${b.pid}&status=eq.pending`, { method: "DELETE" });
        return J({ ok: true });
      }
      if (a === "founding_set") {
        await db(`ll_players?id=eq.${b.pid}`, { method: "PATCH", body: JSON.stringify({ founding: !!b.founding }) });
        return J({ ok: true });
      }
      if (a === "answerq") {
        const text = priv(b.text, 800);
        if (!text) return J({ error: "empty" }, 400);
        const q = (await db(`ll_coach_q?id=eq.${b.qid}&select=player_id`))?.[0];
        await db(`ll_coach_q?id=eq.${b.qid}`, { method: "PATCH", body: JSON.stringify({ answer: text, answered_at: new Date().toISOString() }) });
        if (q && q.player_id) await pushPlayer(q.player_id);
        return J({ ok: true });
      }
      if (a === "invite_mint") {
        const label = priv(b.label, 40) || "Coach invite";
        const maxUses = Math.max(1, Math.min(500, parseInt(b.max_uses, 10) || 1));
        const code = mintCode();
        await db("ll_invites", { method: "POST", body: JSON.stringify({ player_id: null, friend_name: label, status: "approved", code, code_at: new Date().toISOString(), max_uses: maxUses }) });
        return J({ ok: true, code, max_uses: maxUses });
      }
      if (a === "invite_approve") {
        const inv = (await db(`ll_invites?id=eq.${b.invite_id}&select=player_id`))?.[0];
        await db(`ll_invites?id=eq.${b.invite_id}&status=eq.pending`, { method: "PATCH", body: JSON.stringify({ status: "approved", code: mintCode(), code_at: new Date().toISOString() }) });
        if (inv && inv.player_id) await pushPlayer(inv.player_id);
        return J({ ok: true });
      }
      if (a === "invite_deny") {
        await db(`ll_invites?id=eq.${b.invite_id}&status=eq.pending`, { method: "PATCH", body: JSON.stringify({ status: "denied" }) });
        return J({ ok: true });
      }
      if (a === "cdetail") {
        const p = await getPlayer(b.pid);
        if (!p) return J({ error: "no player" }, 404);
        const [checkins, intel, msgs, hw, journal] = await Promise.all([
          db(`ll_checkins?player_id=eq.${p.id}&select=d,energy,conf,mins,focus,note&order=d.desc&limit=14`),
          db(`ll_intel?player_id=eq.${p.id}&select=id,text,created_at&order=created_at.asc`),
          db(`ll_messages?player_id=eq.${p.id}&select=id,from_coach,text,created_at&order=created_at.asc&limit=100`),
          db(`ll_homework?player_id=eq.${p.id}&select=id,text,done&order=created_at.desc&limit=10`),
          db(`ll_journal?player_id=eq.${p.id}&share_coach=eq.true&select=kind,d,data,created_at&order=created_at.desc&limit=15`),
        ]);
        return J({ ok: true, profile: publicProfile(p), contact: p.contact || null, checkins, intel, messages: msgs, homework: hw,
          shared_mind: journal.filter((j: any) => j.kind === "mind"),
          fuel: journal.filter((j: any) => j.kind === "fuel").slice(0, 7) });
      }
      if (a === "intel_add") {
        const text = String(b.text || "").trim().slice(0, 300);
        if (!text) return J({ error: "empty" }, 400);
        await db("ll_intel", { method: "POST", body: JSON.stringify({ player_id: b.pid, text }) });
        return J({ ok: true });
      }
      if (a === "hw_add") {
        const text = String(b.text || "").trim().slice(0, 300);
        if (!text) return J({ error: "empty" }, 400);
        await db("ll_homework", { method: "POST", body: JSON.stringify({ player_id: b.pid, text }) });
        await pushPlayer(b.pid);
        return J({ ok: true });
      }
      if (a === "attend") {
        const p = await getPlayer(b.pid);
        if (!p) return J({ error: "no player" }, 404);
        await db(`ll_players?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ sessions: p.sessions + 1, xp: p.xp + 25 }) });
        return J({ ok: true });
      }
      if (a === "cmsg") {
        const text = clean(b.text);
        if (!text) return J({ error: "empty" }, 400);
        await db("ll_messages", { method: "POST", body: JSON.stringify({ player_id: b.pid, from_coach: true, text }) });
        const msgs = await db(`ll_messages?player_id=eq.${b.pid}&select=id,from_coach,text,created_at&order=created_at.asc&limit=100`);
        await pushPlayer(b.pid);
        return J({ ok: true, messages: msgs });
      }
      if (a === "cpost") {
        const text = clean(b.text);
        if (!text) return J({ error: "empty" }, 400);
        await db("ll_posts", { method: "POST", body: JSON.stringify({ author_name: "Coach", is_coach: true, text }) });
        await pushAllPlayers();
        return J({ ok: true });
      }
    }

    return J({ error: "unknown action" }, 400);
  } catch (e) {
    return J({ error: String(e) }, 500);
  }
});
