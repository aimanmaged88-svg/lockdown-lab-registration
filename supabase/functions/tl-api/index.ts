// Traditional Legacies — retreat companion API (tables tl_*).
// Frontend sends the public anon key as Bearer + apikey (verify_jwt on); this
// function talks to the DB with the service role. Auth inside = per-device
// tokens (tl_tokens → tl_members); leaders prove themselves with the retreat PIN.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const H = { apikey: SRK, Authorization: `Bearer ${SRK}`, "Content-Type": "application/json" };
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const bad = (m: string, s = 400) => J({ error: m }, s);

async function q(path: string, init: RequestInit = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  const t = await r.text();
  let j: any = null; try { j = t ? JSON.parse(t) : null; } catch { j = t; }
  if (!r.ok) throw new Error(`db ${r.status} ${typeof j === "string" ? j : JSON.stringify(j)}`);
  return j;
}
const sel = (path: string) => q(path);
const ins = (table: string, row: unknown) => q(table, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) });
const upd = (path: string, row: unknown) => q(path, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) });
const del = (path: string) => q(path, { method: "DELETE", headers: { Prefer: "return=representation" } });

async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
const pinHash = (code: string, pin: string) => sha(`tl:${code}:${pin}:legacy`);
const rnd = (n: number, alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789") => { const a = crypto.getRandomValues(new Uint8Array(n)); return [...a].map((x) => alpha[x % alpha.length]).join(""); };
const token = () => rnd(40, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const uuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

async function auth(tok: string) {
  if (!tok || tok.length < 20) return null;
  const rows = await sel(`tl_tokens?token=eq.${encodeURIComponent(tok)}&select=member_id,tl_members(id,retreat_id,name,role,avatar,bio,phone,removed)`);
  const m = rows?.[0]?.tl_members;
  if (!m || m.removed) return null;
  return m;
}
async function retreatOf(id: string) {
  const r = await sel(`tl_retreats?id=eq.${id}&select=id,name,tagline,start_date,end_date,location,welcome,code,created_at`);
  return r?.[0] || null;
}
async function stateFor(me: any) {
  const rid = me.retreat_id;
  const [retreat, members, schedule, posts, meetups] = await Promise.all([
    retreatOf(rid),
    sel(`tl_members?retreat_id=eq.${rid}&removed=eq.false&select=id,name,role,avatar,bio,joined_at&order=joined_at.asc`),
    sel(`tl_schedule?retreat_id=eq.${rid}&select=id,day,t,title,details,place,kind&order=day.asc,t.asc`),
    sel(`tl_posts?retreat_id=eq.${rid}&select=id,member_id,kind,text,created_at&order=created_at.desc&limit=120`),
    sel(`tl_meetups?retreat_id=eq.${rid}&cancelled=eq.false&select=id,creator_id,title,place,at,note,created_at&order=at.asc`),
  ]);
  let rs: any[] = [];
  if (meetups.length) {
    const ids = meetups.map((m: any) => m.id).join(",");
    rs = await sel(`tl_rsvp?meetup_id=in.(${ids})&select=meetup_id,member_id,status`);
  }
  for (const m of meetups) { m.in = rs.filter((r) => r.meetup_id === m.id && r.status === "in").map((r) => r.member_id); m.out = rs.filter((r) => r.meetup_id === m.id && r.status === "out").map((r) => r.member_id); }
  const leader = members.find((m: any) => m.role === "leader");
  return { retreat, me: { id: me.id, name: me.name, role: me.role, avatar: me.avatar, bio: me.bio, phone: me.phone }, members, leader: leader ? { id: leader.id, name: leader.name, avatar: leader.avatar } : null, schedule, posts: posts.reverse(), meetups, now: new Date().toISOString() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return bad("POST only", 405);
  let b: any; try { b = await req.json(); } catch { return bad("bad json"); }
  const a = String(b.action || "");
  try {
    /* ---------- public ---------- */
    if (a === "retreat_create") {
      const name = str(b.name, 80), start = str(b.start, 10), end = str(b.end, 10), pin = str(b.pin, 12), leader = str(b.leader_name, 40) || "Leader";
      if (!name || !isDate(start) || !isDate(end) || start > end) return bad("name + valid dates needed");
      if (!/^\d{4,8}$/.test(pin)) return bad("PIN must be 4–8 digits");
      let code = ""; for (let i = 0; i < 8; i++) { code = rnd(6); const ex = await sel(`tl_retreats?code=eq.${code}&select=id`); if (!ex.length) break; }
      const r = (await ins("tl_retreats", { name, tagline: str(b.tagline, 80), start_date: start, end_date: end, location: str(b.location, 80), welcome: str(b.welcome, 1200), code, leader_pin_hash: await pinHash(code, pin) }))[0];
      const m = (await ins("tl_members", { retreat_id: r.id, name: leader, role: "leader", avatar: str(b.avatar, 4) || "🏹" }))[0];
      const tok = token(); await ins("tl_tokens", { token: tok, member_id: m.id });
      const me = { ...m, retreat_id: r.id };
      return J({ token: tok, ...(await stateFor(me)) });
    }
    if (a === "leader_login") {
      const code = str(b.code, 6).toUpperCase(), pin = str(b.pin, 12);
      const r = (await sel(`tl_retreats?code=eq.${code}&select=id,leader_pin_hash`))[0];
      await new Promise((res) => setTimeout(res, 500));
      if (!r || r.leader_pin_hash !== await pinHash(code, pin)) return bad("Wrong retreat code or PIN", 401);
      let lead = (await sel(`tl_members?retreat_id=eq.${r.id}&role=eq.leader&removed=eq.false&select=*&limit=1`))[0];
      if (!lead) lead = (await ins("tl_members", { retreat_id: r.id, name: "Leader", role: "leader", avatar: "🏹" }))[0];
      const tok = token(); await ins("tl_tokens", { token: tok, member_id: lead.id });
      return J({ token: tok, ...(await stateFor(lead)) });
    }
    if (a === "join") {
      const code = str(b.code, 6).toUpperCase(), name = str(b.name, 40);
      if (!name) return bad("Tell us your name");
      const r = (await sel(`tl_retreats?code=eq.${code}&select=id`))[0];
      if (!r) return bad("That retreat code doesn't exist", 404);
      const count = await sel(`tl_members?retreat_id=eq.${r.id}&removed=eq.false&select=id`);
      if (count.length >= 60) return bad("This retreat is full", 403);
      const m = (await ins("tl_members", { retreat_id: r.id, name, role: "member", avatar: str(b.avatar, 4) || "", bio: str(b.bio, 160), phone: str(b.phone, 30) }))[0];
      const tok = token(); await ins("tl_tokens", { token: tok, member_id: m.id });
      await ins("tl_posts", { retreat_id: r.id, member_id: m.id, kind: "sys", text: `${name} joined the retreat` });
      return J({ token: tok, ...(await stateFor(m)) });
    }
    if (a === "retreat_peek") {
      const code = str(b.code, 6).toUpperCase();
      const r = (await sel(`tl_retreats?code=eq.${code}&select=name,tagline,start_date,end_date,location`))[0];
      if (!r) return bad("No retreat with that code", 404);
      return J({ retreat: r });
    }

    /* ---------- authed ---------- */
    const me = await auth(str(b.token, 60));
    if (!me) return bad("Sign in again", 401);
    const rid = me.retreat_id;
    const isLeader = me.role === "leader";
    const needLeader = () => isLeader ? null : bad("Leaders only", 403);

    if (a === "state") return J(await stateFor(me));
    if (a === "post") {
      const text = str(b.text, 1000); if (!text) return bad("Say something");
      const last = await sel(`tl_posts?member_id=eq.${me.id}&select=created_at&order=created_at.desc&limit=1`);
      if (last[0] && Date.now() - new Date(last[0].created_at).getTime() < 800) return bad("Slow down", 429);
      const p = (await ins("tl_posts", { retreat_id: rid, member_id: me.id, kind: b.kind === "announce" && isLeader ? "announce" : "msg", text }))[0];
      return J({ post: p });
    }
    if (a === "post_del") {
      if (!uuid(b.id)) return bad("id");
      const p = (await sel(`tl_posts?id=eq.${b.id}&retreat_id=eq.${rid}&select=id,member_id`))[0];
      if (!p || (!isLeader && p.member_id !== me.id)) return bad("Not yours", 403);
      await del(`tl_posts?id=eq.${b.id}`); return J({ ok: true });
    }
    if (a === "me_edit") {
      const row: any = {}; if (b.name != null) row.name = str(b.name, 40) || me.name; if (b.avatar != null) row.avatar = str(b.avatar, 4); if (b.bio != null) row.bio = str(b.bio, 160); if (b.phone != null) row.phone = str(b.phone, 30);
      await upd(`tl_members?id=eq.${me.id}`, row); return J({ ok: true });
    }
    if (a === "leave") { await upd(`tl_members?id=eq.${me.id}`, { removed: true }); await del(`tl_tokens?member_id=eq.${me.id}`); return J({ ok: true }); }
    if (a === "meetup_add") {
      const title = str(b.title, 80), at = str(b.at, 40); if (!title || isNaN(Date.parse(at))) return bad("title + time needed");
      const m = (await ins("tl_meetups", { retreat_id: rid, creator_id: me.id, title, place: str(b.place, 80), at: new Date(at).toISOString(), note: str(b.note, 300) }))[0];
      await ins("tl_rsvp", { meetup_id: m.id, member_id: me.id, status: "in" });
      await ins("tl_posts", { retreat_id: rid, member_id: me.id, kind: "sys", text: `${me.name} set up a meetup: ${title}${m.place ? " @ " + m.place : ""}` });
      return J({ meetup: m });
    }
    if (a === "meetup_cancel") {
      if (!uuid(b.id)) return bad("id");
      const m = (await sel(`tl_meetups?id=eq.${b.id}&retreat_id=eq.${rid}&select=id,creator_id`))[0];
      if (!m || (!isLeader && m.creator_id !== me.id)) return bad("Not yours", 403);
      await upd(`tl_meetups?id=eq.${b.id}`, { cancelled: true }); return J({ ok: true });
    }
    if (a === "rsvp") {
      if (!uuid(b.id)) return bad("id"); const status = b.status === "out" ? "out" : "in";
      const m = (await sel(`tl_meetups?id=eq.${b.id}&retreat_id=eq.${rid}&select=id`))[0]; if (!m) return bad("no meetup", 404);
      await q("tl_rsvp", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ meetup_id: b.id, member_id: me.id, status, at: new Date().toISOString() }) });
      return J({ ok: true });
    }

    /* ---------- leader ---------- */
    if (a === "retreat_edit") { const e = needLeader(); if (e) return e;
      const row: any = {}; for (const k of ["name", "tagline", "location"]) if (b[k] != null) row[k] = str(b[k], 80); if (b.welcome != null) row.welcome = str(b.welcome, 1200);
      if (b.start && isDate(b.start)) row.start_date = b.start; if (b.end && isDate(b.end)) row.end_date = b.end;
      if (row.name === "") delete row.name; await upd(`tl_retreats?id=eq.${rid}`, row); return J({ ok: true }); }
    if (a === "pin_set") { const e = needLeader(); if (e) return e; const pin = str(b.pin, 12); if (!/^\d{4,8}$/.test(pin)) return bad("PIN must be 4–8 digits");
      const r = await retreatOf(rid); await upd(`tl_retreats?id=eq.${rid}`, { leader_pin_hash: await pinHash(r.code, pin) }); return J({ ok: true }); }
    if (a === "schedule_add") { const e = needLeader(); if (e) return e;
      const day = str(b.day, 10), title = str(b.title, 100); if (!isDate(day) || !title) return bad("day + title needed");
      const s = (await ins("tl_schedule", { retreat_id: rid, day, t: str(b.t, 5), title, details: str(b.details, 600), place: str(b.place, 80), kind: str(b.kind, 20) || "activity" }))[0]; return J({ item: s }); }
    if (a === "schedule_edit") { const e = needLeader(); if (e) return e; if (!uuid(b.id)) return bad("id");
      const row: any = {}; if (b.day && isDate(b.day)) row.day = b.day; if (b.t != null) row.t = str(b.t, 5); if (b.title != null) row.title = str(b.title, 100) || undefined; if (b.details != null) row.details = str(b.details, 600); if (b.place != null) row.place = str(b.place, 80); if (b.kind != null) row.kind = str(b.kind, 20);
      await upd(`tl_schedule?id=eq.${b.id}&retreat_id=eq.${rid}`, row); return J({ ok: true }); }
    if (a === "schedule_del") { const e = needLeader(); if (e) return e; if (!uuid(b.id)) return bad("id"); await del(`tl_schedule?id=eq.${b.id}&retreat_id=eq.${rid}`); return J({ ok: true }); }
    if (a === "schedule_copy_day") { const e = needLeader(); if (e) return e; const from = str(b.from, 10), to = str(b.to, 10); if (!isDate(from) || !isDate(to)) return bad("days");
      const items = await sel(`tl_schedule?retreat_id=eq.${rid}&day=eq.${from}&select=t,title,details,place,kind`);
      if (items.length) await ins("tl_schedule", items.map((i: any) => ({ ...i, retreat_id: rid, day: to }))); return J({ copied: items.length }); }
    if (a === "member_remove") { const e = needLeader(); if (e) return e; if (!uuid(b.id) || b.id === me.id) return bad("id");
      await upd(`tl_members?id=eq.${b.id}&retreat_id=eq.${rid}`, { removed: true }); await del(`tl_tokens?member_id=eq.${b.id}`); return J({ ok: true }); }
    if (a === "member_edit") { const e = needLeader(); if (e) return e; if (!uuid(b.id)) return bad("id");
      const row: any = {}; if (b.name != null) row.name = str(b.name, 40); if (b.role === "leader" || b.role === "member") row.role = b.role;
      if (row.name === "") delete row.name; await upd(`tl_members?id=eq.${b.id}&retreat_id=eq.${rid}`, row); return J({ ok: true }); }
    if (a === "retreat_delete") { const e = needLeader(); if (e) return e; if (str(b.confirm, 10) !== "DELETE") return bad("confirm");
      await del(`tl_retreats?id=eq.${rid}`); return J({ ok: true }); }
    return bad("unknown action", 404);
  } catch (err) {
    console.error(err);
    return bad("Something broke on our side — try again", 500);
  }
});
