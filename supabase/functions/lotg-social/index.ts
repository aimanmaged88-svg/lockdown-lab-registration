import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// LOTG Wednesday Night Basketball — the crew's social layer.
// Sister of the tournament scoreboard (which lives on its own Netlify DB); this
// is the community side: Top Plays and one group chat for everyone, all week.
// Same engine as Hoops Heaven / the Lab: every DB call is server-side (service
// role); the browser only ever sends the public anon key as Bearer + apikey.
//
// Two sides, two rules (Aiman, 2026-08-07):
//   PLAYS  — anyone can submit a clip link with NO login. It lands in the coach's
//            approval queue (approved=false) and only appears once he approves it.
//            Voting is open too (one per device). We never fetch the clip URL.
//   CHAT   — to be part of the community you sign in with a social handle:
//            Instagram, Facebook or TikTok (NO email). The handle is how the crew
//            connects — we only ever LINK to the profile, never log in or post.
// Coach approval/moderation is authed as any ACTIVE Lab coach (ll_coaches, same
// sha256 scheme as coach_login). Ban a member: set lotg_crew.banned = true.
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
// Sanitize an id for safe interpolation into a PostgREST in.(...) / eq. filter.
const sid = (v: unknown) => String(v ?? "").replace(/[^a-zA-Z0-9._-]/g, "");
// Social handle: strip a leading @, keep the chars handles actually use.
const handleClean = (v: unknown) => String(v ?? "").replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40);
const PROVIDERS = ["instagram", "facebook", "tiktok"];

// Platform label from a clip URL — for the chip. We never fetch the URL.
function platformOf(url: string) {
  if (/instagram\.com/i.test(url)) return "Instagram";
  if (/tiktok\.com/i.test(url)) return "TikTok";
  if (/(youtube\.com|youtu\.be)/i.test(url)) return "YouTube";
  if (/facebook\.com|fb\.watch/i.test(url)) return "Facebook";
  return "Clip";
}

// Sydney ISO week, e.g. "2026-W32" — the Play-of-the-Week window.
function sydWeek() {
  const s = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((t.getTime() - yearStart.getTime()) / 864e5) + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

async function sha256(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, "0")).join("");
}
// Coach/admin auth: any ACTIVE ll_coaches account (same sha256 scheme + claim-on-
// first-PIN as coach_login). Aiman logs in with his email + PIN.
async function coachAuth(user: unknown, pin: unknown) {
  const u = str(user, 120).toLowerCase(), p = str(pin, 8);
  if (!u || !/^\d{4,8}$/.test(p)) return false;
  const rows = await db(`ll_coaches?username=eq.${encodeURIComponent(u)}&status=eq.active&select=id,pin_hash`);
  if (!rows?.length) return false;
  const h = await sha256(`${u}:${p}:lockdownlabcoach`);
  if (!rows[0].pin_hash) { await db(`ll_coaches?id=eq.${rows[0].id}`, { method: "PATCH", body: JSON.stringify({ pin_hash: h }) }); return true; }
  return rows[0].pin_hash === h;
}

// Chat gate: device must be a registered, unbanned crew member who signed in with
// a social handle. Returns the REGISTERED identity, or a ready error Response.
async function guard(device: unknown): Promise<{ p?: { id: string; name: string; provider: string; handle: string }; err?: Response }> {
  const id = str(device, 64);
  if (!id || id.length < 8) return { err: J({ error: "sign in to join the chat", code: "signin" }, 401) };
  const rows = await db(`lotg_crew?id=eq.${encodeURIComponent(id)}&select=id,name,provider,handle,banned`);
  const row = rows?.[0];
  if (!row || !row.handle) return { err: J({ error: "sign in to join the chat", code: "signin" }, 401) };
  if (row.banned) return { err: J({ error: "you're removed from the LOTG crew feed", code: "banned" }, 403) };
  db(`lotg_crew?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ seen_at: new Date().toISOString() }) }).catch(() => {});
  return { p: { id: row.id, name: row.name, provider: row.provider, handle: row.handle } };
}

// APPROVED plays (last 14 days), ranked by votes, plus the viewer's OWN still-
// pending clips so a submitter can see "waiting for approval". Device ids never
// leak — only names/handles and computed booleans go out.
async function playsPayload(viewerId: string) {
  const vid = sid(viewerId);
  const since = new Date(Date.now() - 14 * 864e5).toISOString();
  const live = await db(`lotg_plays?approved=is.true&hidden=is.false&created_at=gte.${since}&select=id,name,caption,url,platform,week,device_id,created_at&order=created_at.desc&limit=80`) || [];
  let votes: Record<string, unknown>[] = [];
  if (live.length) {
    const ids = live.map((p: Record<string, unknown>) => `"${p.id}"`).join(",");
    votes = await db(`lotg_play_votes?play_id=in.(${ids})&select=play_id,device_id`) || [];
  }
  const tally = new Map<string, number>(), mine = new Set<string>();
  for (const v of votes) {
    const pid = v.play_id as string;
    tally.set(pid, (tally.get(pid) || 0) + 1);
    if (v.device_id === vid) mine.add(pid);
  }
  const plays = live.map((p: Record<string, unknown>) => ({
    id: p.id, name: p.name, caption: p.caption, url: p.url, platform: p.platform, week: p.week,
    votes: tally.get(p.id as string) || 0, mine: mine.has(p.id as string),
  })).sort((a, b) => b.votes - a.votes || (a.id < b.id ? 1 : -1));
  // The viewer's own clips still awaiting the coach's approval.
  let pending: Record<string, unknown>[] = [];
  if (vid) {
    const rows = await db(`lotg_plays?approved=is.false&hidden=is.false&device_id=eq.${encodeURIComponent(vid)}&select=id,caption,url,platform,created_at&order=created_at.desc&limit=10`) || [];
    pending = rows.map((p: Record<string, unknown>) => ({ id: p.id, caption: p.caption, url: p.url, platform: p.platform }));
  }
  return { plays, pending };
}

async function chatPayload(viewerId: string) {
  const vid = sid(viewerId);
  const rows = await db(`lotg_chat?select=id,name,provider,handle,body,created_at,device_id&order=created_at.desc&limit=80`) || [];
  return rows.reverse().map((m: Record<string, unknown>) => ({
    id: m.id, name: m.name, provider: m.provider, handle: m.handle, body: m.body, created_at: m.created_at, mine: m.device_id === vid,
  }));
}

async function pendingList() {
  const rows = await db(`lotg_plays?approved=is.false&hidden=is.false&select=id,name,caption,url,platform,created_at&order=created_at.asc&limit=100`) || [];
  return rows;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return J({ error: "POST only" }, 405);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return J({ error: "bad json" }, 400); }
  const action = str(b.action, 40);

  try {
    switch (action) {

      // Community sign-in: name + a social handle (instagram | facebook | tiktok).
      // No email. The handle only ever LINKS to the profile — never posts.
      case "register": {
        const id = str(b.device, 64), name = str(b.name, 40);
        const provider = str(b.provider, 20).toLowerCase(), handle = handleClean(b.handle);
        if (!id || !/^[a-zA-Z0-9._-]{8,64}$/.test(id)) return J({ error: "bad device" }, 400);
        if (!name) return J({ error: "put a name on it" }, 400);
        if (!PROVIDERS.includes(provider) || !handle) return J({ error: "sign in with your Instagram, Facebook or TikTok" }, 400);
        const prev = await db(`lotg_crew?id=eq.${encodeURIComponent(id)}&select=banned`);
        if (prev?.[0]?.banned) return J({ error: "you're removed from the LOTG crew feed", code: "banned" }, 403);
        await db(`lotg_crew?on_conflict=id`, {
          method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ id, name, provider, handle, ig: provider === "instagram" ? handle : "", seen_at: new Date().toISOString() }),
        });
        return J({ ok: true, me: { name, provider, handle, registered: true } });
      }

      // Hydrate: who am I (chat identity), approved plays + my pending clips, chat.
      case "board": {
        const id = str(b.device, 64);
        let me: Record<string, unknown> = { registered: false };
        if (id) {
          const rows = await db(`lotg_crew?id=eq.${encodeURIComponent(id)}&select=name,provider,handle,banned`);
          if (rows?.[0]?.handle) me = { registered: true, name: rows[0].name, provider: rows[0].provider, handle: rows[0].handle, banned: !!rows[0].banned };
        }
        const [pp, chat] = await Promise.all([playsPayload(id), chatPayload(id)]);
        return J({ me, plays: pp.plays, pending: pp.pending, chat, week: sydWeek() });
      }

      // Drop a play — NO login. Lands in the coach's approval queue (approved=false).
      // A device id is still required (rate-limit + your-pending + your starting vote).
      case "play_submit": {
        const device = str(b.device, 64);
        if (!device || !/^[a-zA-Z0-9._-]{8,64}$/.test(device)) return J({ error: "bad device" }, 400);
        const ban = await db(`lotg_crew?id=eq.${encodeURIComponent(device)}&select=banned`);
        if (ban?.[0]?.banned) return J({ error: "you're removed from the LOTG crew feed", code: "banned" }, 403);
        const url = str(b.url, 300), caption = str(b.caption, 140), name = str(b.name, 40) || "Anonymous";
        if (!/^https?:\/\/\S+\.\S+/i.test(url)) return J({ error: "paste a full clip link (starts with https://)" }, 400);
        if (!caption) return J({ error: "add a line on what happened" }, 400);
        const dayAgo = new Date(Date.now() - 864e5).toISOString();
        const mine = await db(`lotg_plays?device_id=eq.${encodeURIComponent(device)}&created_at=gte.${dayAgo}&select=id`);
        if ((mine?.length || 0) >= 12) return J({ error: "easy — that's 12 clips today already" }, 429);
        const [play] = await db(`lotg_plays`, {
          method: "POST", headers: { Prefer: "return=representation" },
          body: JSON.stringify({ device_id: device, name, ig: "", caption, url, platform: platformOf(url), week: sydWeek(), approved: false }),
        });
        // Your own starting vote (counts once the coach approves it).
        await db(`lotg_play_votes?on_conflict=play_id,device_id`, {
          method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ play_id: play.id, device_id: device }),
        });
        const pp = await playsPayload(device);
        return J({ plays: pp.plays, pending: pp.pending, week: sydWeek() });
      }

      // Vote toggle — open (one per device), only on an approved, visible play.
      case "play_vote": {
        const device = str(b.device, 64);
        if (!device || device.length < 8) return J({ error: "bad device" }, 400);
        const ban = await db(`lotg_crew?id=eq.${encodeURIComponent(device)}&select=banned`);
        if (ban?.[0]?.banned) return J({ error: "you're removed from the LOTG crew feed", code: "banned" }, 403);
        const play = str(b.play, 64);
        const rows = await db(`lotg_plays?id=eq.${encodeURIComponent(play)}&approved=is.true&hidden=is.false&select=id`);
        if (!rows?.length) return J({ error: "that play isn't available" }, 404);
        const had = await db(`lotg_play_votes?play_id=eq.${encodeURIComponent(play)}&device_id=eq.${encodeURIComponent(device)}&select=play_id`);
        if (had?.length) {
          await db(`lotg_play_votes?play_id=eq.${encodeURIComponent(play)}&device_id=eq.${encodeURIComponent(device)}`, { method: "DELETE" });
        } else {
          await db(`lotg_play_votes`, { method: "POST", body: JSON.stringify({ play_id: play, device_id: device }) });
        }
        const pp = await playsPayload(device);
        return J({ plays: pp.plays, pending: pp.pending, week: sydWeek() });
      }

      // Group chat — reading is open; posting needs a social sign-in. 20/5min/device.
      case "chat_get": {
        return J({ chat: await chatPayload(str(b.device, 64)) });
      }

      case "chat_send": {
        const g = await guard(b.device); if (g.err) return g.err;
        const me = g.p!;
        const body = str(b.body, 300);
        if (!body) return J({ error: "type something" }, 400);
        const winAgo = new Date(Date.now() - 5 * 6e4).toISOString();
        const recent = await db(`lotg_chat?device_id=eq.${encodeURIComponent(me.id)}&created_at=gte.${winAgo}&select=id`);
        if ((recent?.length || 0) >= 20) return J({ error: "slow down a sec — too many messages" }, 429);
        await db(`lotg_chat`, { method: "POST", body: JSON.stringify({ device_id: me.id, name: me.name, provider: me.provider, handle: me.handle, ig: me.provider === "instagram" ? me.handle : "", body }) });
        return J({ chat: await chatPayload(me.id) });
      }

      // ---- Coach approval / moderation (auth = active ll_coaches user + PIN) ----
      case "admin_pending": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong coach login", code: "auth" }, 401);
        return J({ ok: true, pending: await pendingList() });
      }
      case "admin_approve": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong coach login", code: "auth" }, 401);
        const play = str(b.play, 64);
        await db(`lotg_plays?id=eq.${encodeURIComponent(play)}`, { method: "PATCH", body: JSON.stringify({ approved: true }) });
        return J({ ok: true, pending: await pendingList() });
      }
      case "admin_reject": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong coach login", code: "auth" }, 401);
        const play = str(b.play, 64);
        await db(`lotg_plays?id=eq.${encodeURIComponent(play)}`, { method: "DELETE" });
        return J({ ok: true, pending: await pendingList() });
      }
      // Pull an already-approved clip back down.
      case "admin_takedown": {
        if (!await coachAuth(b.user, b.pin)) return J({ error: "wrong coach login", code: "auth" }, 401);
        const play = str(b.play, 64);
        await db(`lotg_plays?id=eq.${encodeURIComponent(play)}`, { method: "PATCH", body: JSON.stringify({ hidden: true }) });
        return J({ ok: true, pending: await pendingList() });
      }

      default:
        return J({ error: "unknown action" }, 400);
    }
  } catch (e) {
    console.error(action, e);
    return J({ error: "server error" }, 500);
  }
});
