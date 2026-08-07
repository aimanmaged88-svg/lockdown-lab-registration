import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// LOTG Wednesday Night Basketball — the crew's social layer.
// Sister of the tournament scoreboard (which lives on its own Netlify DB); this
// is the community side: Top Plays and one group chat for everyone, all week.
// Same engine as Hoops Heaven / the Lab: every DB call is server-side (service
// role); the browser only ever sends the public anon key as Bearer + apikey.
// Identity: no passwords. A device registers once with a name + Instagram handle
// (the handle is how the crew connects — we NEVER log into or post to Instagram,
// we only link out to it). Writes require that registered, unbanned identity, and
// the server always uses the REGISTERED name/handle (client-sent ones are ignored
// outside register) so nobody can post as someone else.
//   plays — a clip link + one line; the crew votes; the week's leader is crowned
//   chat  — one room, every team, all week
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
// Sanitize an id for safe interpolation into a PostgREST in.(...) / eq. filter:
// strip to the charset our device ids use so no ", &, ) can inject.
const sid = (v: unknown) => String(v ?? "").replace(/[^a-zA-Z0-9._-]/g, "");
const igClean = (v: unknown) => String(v ?? "").replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 30);

// Platform label from a clip URL — for the chip. We never fetch the URL.
function platformOf(url: string) {
  if (/instagram\.com/i.test(url)) return "Instagram";
  if (/tiktok\.com/i.test(url)) return "TikTok";
  if (/(youtube\.com|youtu\.be)/i.test(url)) return "YouTube";
  return "Clip";
}

// Sydney ISO week, e.g. "2026-W32" — the Play-of-the-Week window.
function sydWeek() {
  const s = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" }); // YYYY-MM-DD
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  const day = t.getUTCDay() || 7;            // Mon=1..Sun=7
  t.setUTCDate(t.getUTCDate() + 4 - day);    // nearest Thursday
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((t.getTime() - yearStart.getTime()) / 864e5) + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// The write gate: device must be registered (accepted the vibe) and not banned.
// Returns the REGISTERED identity, or a ready error Response.
async function guard(device: unknown): Promise<{ p?: { id: string; name: string; ig: string }; err?: Response }> {
  const id = str(device, 64);
  if (!id || id.length < 8) return { err: J({ error: "set your name to join", code: "signin" }, 401) };
  const rows = await db(`lotg_crew?id=eq.${encodeURIComponent(id)}&select=id,name,ig,banned`);
  const row = rows?.[0];
  if (!row) return { err: J({ error: "set your name to join", code: "signin" }, 401) };
  if (row.banned) return { err: J({ error: "you're removed from the LOTG crew feed", code: "banned" }, 403) };
  // Keep last-seen fresh (best-effort).
  db(`lotg_crew?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ seen_at: new Date().toISOString() }) }).catch(() => {});
  return { p: { id: row.id, name: row.name, ig: row.ig } };
}

// Recent non-hidden plays (last 14 days), each with its vote tally and whether
// the viewer has voted — sorted by votes then recency. Device ids never leak out;
// only names/handles and computed booleans are returned.
async function playsPayload(viewerId: string) {
  const since = new Date(Date.now() - 14 * 864e5).toISOString();
  const plays = await db(`lotg_plays?hidden=is.false&created_at=gte.${since}&select=id,name,ig,caption,url,platform,week,device_id,created_at&order=created_at.desc&limit=80`) || [];
  const vid = sid(viewerId);
  let votes: Record<string, unknown>[] = [];
  if (plays.length) {
    const ids = plays.map((p: Record<string, unknown>) => `"${p.id}"`).join(",");
    votes = await db(`lotg_play_votes?play_id=in.(${ids})&select=play_id,device_id`) || [];
  }
  const tally = new Map<string, number>();
  const mine = new Set<string>();
  for (const v of votes) {
    const pid = v.play_id as string;
    tally.set(pid, (tally.get(pid) || 0) + 1);
    if (v.device_id === vid) mine.add(pid);
  }
  return plays.map((p: Record<string, unknown>) => ({
    id: p.id, name: p.name, ig: p.ig, caption: p.caption, url: p.url, platform: p.platform, week: p.week,
    votes: tally.get(p.id as string) || 0,
    mine: mine.has(p.id as string),
    own: p.device_id === vid,
  })).sort((a, b) => b.votes - a.votes || (a.id < b.id ? 1 : -1));
}

// Recent chat, oldest→newest. `mine` is computed from the viewer's device so
// the client can right-align your own messages WITHOUT us ever leaking device ids.
async function chatPayload(viewerId: string) {
  const vid = sid(viewerId);
  const rows = await db(`lotg_chat?select=id,name,ig,body,created_at,device_id&order=created_at.desc&limit=80`) || [];
  return rows.reverse().map((m: Record<string, unknown>) => ({
    id: m.id, name: m.name, ig: m.ig, body: m.body, created_at: m.created_at, mine: m.device_id === vid,
  }));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return J({ error: "POST only" }, 405);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return J({ error: "bad json" }, 400); }
  const action = str(b.action, 40);

  try {
    switch (action) {

      // Sign in: device id + name + (encouraged) Instagram handle. The handle is
      // how the crew finds each other — we only ever link to instagram.com/<handle>.
      case "register": {
        const id = str(b.device, 64), name = str(b.name, 40), ig = igClean(b.ig);
        if (!id || !/^[a-zA-Z0-9._-]{8,64}$/.test(id)) return J({ error: "bad device" }, 400);
        if (!name) return J({ error: "put a name on it" }, 400);
        const prev = await db(`lotg_crew?id=eq.${encodeURIComponent(id)}&select=banned`);
        if (prev?.[0]?.banned) return J({ error: "you're removed from the LOTG crew feed", code: "banned" }, 403);
        await db(`lotg_crew?on_conflict=id`, {
          method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ id, name, ig, seen_at: new Date().toISOString() }),
        });
        return J({ ok: true, me: { name, ig, registered: true } });
      }

      // One call to hydrate the app: who am I, the plays leaderboard, the chat.
      case "board": {
        const id = str(b.device, 64);
        let me: Record<string, unknown> = { registered: false };
        if (id) {
          const rows = await db(`lotg_crew?id=eq.${encodeURIComponent(id)}&select=name,ig,banned`);
          if (rows?.[0]) me = { registered: true, name: rows[0].name, ig: rows[0].ig, banned: !!rows[0].banned };
        }
        const [plays, chat] = await Promise.all([playsPayload(id), chatPayload(id)]);
        return J({ me, plays, chat, week: sydWeek() });
      }

      // Drop a play: a clip link + one line on what happened. Auto-counts your own
      // vote to start (you rate it a top play — that's the +1). Max 12/day/device.
      case "play_submit": {
        const g = await guard(b.device); if (g.err) return g.err;
        const me = g.p!;
        const url = str(b.url, 300), caption = str(b.caption, 140);
        if (!/^https?:\/\/\S+\.\S+/i.test(url)) return J({ error: "paste a full clip link (starts with https://)" }, 400);
        if (!caption) return J({ error: "add a line on what happened" }, 400);
        const dayAgo = new Date(Date.now() - 864e5).toISOString();
        const mine = await db(`lotg_plays?device_id=eq.${encodeURIComponent(me.id)}&created_at=gte.${dayAgo}&select=id`);
        if ((mine?.length || 0) >= 12) return J({ error: "easy — that's 12 clips today already" }, 429);
        const [play] = await db(`lotg_plays`, {
          method: "POST", headers: { Prefer: "return=representation" },
          body: JSON.stringify({ device_id: me.id, name: me.name, ig: me.ig, caption, url, platform: platformOf(url), week: sydWeek() }),
        });
        await db(`lotg_play_votes?on_conflict=play_id,device_id`, {
          method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ play_id: play.id, device_id: me.id }),
        });
        return J({ plays: await playsPayload(me.id), week: sydWeek() });
      }

      // Vote toggle — one per device per play.
      case "play_vote": {
        const g = await guard(b.device); if (g.err) return g.err;
        const me = g.p!;
        const play = str(b.play, 64);
        const rows = await db(`lotg_plays?id=eq.${encodeURIComponent(play)}&select=id&limit=1`);
        if (!rows?.length) return J({ error: "that play's gone" }, 404);
        const had = await db(`lotg_play_votes?play_id=eq.${encodeURIComponent(play)}&device_id=eq.${encodeURIComponent(me.id)}&select=play_id`);
        if (had?.length) {
          await db(`lotg_play_votes?play_id=eq.${encodeURIComponent(play)}&device_id=eq.${encodeURIComponent(me.id)}`, { method: "DELETE" });
        } else {
          await db(`lotg_play_votes`, { method: "POST", body: JSON.stringify({ play_id: play, device_id: me.id }) });
        }
        return J({ plays: await playsPayload(me.id), week: sydWeek() });
      }

      // Group chat — one room. Reading is open; posting needs a name. 20/5min/device.
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
        await db(`lotg_chat`, { method: "POST", body: JSON.stringify({ device_id: me.id, name: me.name, ig: me.ig, body }) });
        return J({ chat: await chatPayload(me.id) });
      }

      default:
        return J({ error: "unknown action" }, 400);
    }
  } catch (e) {
    console.error(action, e);
    return J({ error: "server error" }, 500);
  }
});
