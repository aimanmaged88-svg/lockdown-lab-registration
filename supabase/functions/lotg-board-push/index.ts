import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// LOTG board — team pings. Pick your team on the board and get closed-app
// pushes: FINAL scores to everyone subscribed, "you're up next" to the two
// teams in the following game on that court, and coach announcements (new
// draw / recap drops). Pushes are payload-free VAPID "tickles" — the board's
// service worker pulls the actual message from lotg_notif (the Lab's proven
// pattern, same VAPID keypair, same Supabase project).
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
const str = (v: unknown, max = 200) => String(v ?? "").slice(0, max).trim();
const sid = (v: unknown) => String(v ?? "").replace(/[^a-zA-Z0-9._-]/g, "");
async function passOk(pass: unknown) {
  const rows = await db(`lotg_admin?id=eq.1&select=token`);
  return !!rows?.[0]?.token && rows[0].token === str(pass, 40);
}

// Queue a message for each device, then tickle their endpoints (no payload —
// the SW pulls). Dead endpoints (404/410) are pruned.
async function notify(rows: { device: string; sub: Record<string, unknown> }[], title: string, body: string, url = "/") {
  if (!rows.length) return 0;
  await db(`lotg_notif`, { method: "POST", body: JSON.stringify(rows.map(r => ({ device: r.device, title, body, url }))) });
  await Promise.all(rows.map(async r => {
    try {
      const ep = (r.sub as Record<string, unknown>)?.endpoint as string;
      if (!ep) return;
      const resp = await fetch(ep, { method: "POST", headers: { Authorization: await vapidAuth(ep), TTL: "7200", Urgency: "high" } });
      if (resp.status === 404 || resp.status === 410) await db(`lotg_push?device=eq.${encodeURIComponent(r.device)}`, { method: "DELETE" });
    } catch (_) { /* one dead endpoint never blocks the rest */ }
  }));
  return rows.length;
}
const allSubs = () => db(`lotg_push?select=device,sub,team_id`);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return J({ error: "POST only" }, 405);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return J({ error: "bad json" }, 400); }
  const action = str(b.action, 30);

  try {
    switch (action) {

      // Pick a team on this device (or move the pick) — stores the push sub.
      case "sub": {
        const device = str(b.device, 64), team = sid(b.team_id);
        const sub = b.sub as Record<string, unknown>;
        if (!/^[a-zA-Z0-9._-]{8,64}$/.test(device) || !team || !sub?.endpoint) return J({ error: "bad request" }, 400);
        const t = await db(`lotg_teams?id=eq.${team}&select=id,name`);
        if (!t?.length) return J({ error: "team not found" }, 404);
        await db(`lotg_push?on_conflict=device`, {
          method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ device, team_id: team, sub }),
        });
        return J({ ok: true, team: t[0].name });
      }

      case "unsub": {
        const device = sid(b.device);
        if (device) await db(`lotg_push?device=eq.${encodeURIComponent(device)}`, { method: "DELETE" });
        return J({ ok: true });
      }

      // The service worker pulls the newest unshown messages after a tickle.
      case "pull": {
        const device = sid(b.device);
        if (!device) return J({ notifs: [] });
        const rows = await db(`lotg_notif?device=eq.${encodeURIComponent(device)}&shown=is.false&select=id,title,body,url&order=created_at.desc&limit=4`) || [];
        if (rows.length) {
          const ids = rows.map((r: Record<string, unknown>) => `"${r.id}"`).join(",");
          await db(`lotg_notif?id=in.(${ids})`, { method: "PATCH", body: JSON.stringify({ shown: true }) });
        }
        return J({ notifs: rows });
      }

      // Board calls this right after a score is saved (first time only).
      // FINAL score -> everyone subscribed; "you're up next" -> both teams of
      // the next upcoming game on the same court.
      case "game_final": {
        if (!await passOk(b.pass)) return J({ error: "wrong passcode", code: "auth" }, 401);
        const gid = sid(b.game_id);
        const g = (await db(`lotg_games?id=eq.${gid}&select=*`))?.[0];
        if (!g || g.status !== "final") return J({ error: "game not final" }, 400);
        const teams = await db(`lotg_teams?select=id,name`);
        const nm = new Map((teams || []).map((t: Record<string, unknown>) => [t.id, t.name]));
        const t1 = nm.get(g.team1_id) || "Team", t2 = nm.get(g.team2_id) || "Team";
        const subs = await allSubs() || [];
        let sent = 0;
        sent += await notify(subs, `FINAL · Court ${g.court} 🏀`, `${t1} ${g.score1} — ${g.score2} ${t2}`);
        const next = (await db(`lotg_games?week=eq.${g.week ?? 1}&court=eq.${g.court}&status=eq.upcoming&slot_index=gt.${g.slot_index}&select=*&order=slot_index.asc&limit=1`))?.[0];
        let nextInfo = null;
        if (next) {
          const n1 = nm.get(next.team1_id) || "Team", n2 = nm.get(next.team2_id) || "Team";
          const upSubs = subs.filter((s: Record<string, unknown>) => s.team_id === next.team1_id || s.team_id === next.team2_id);
          sent += await notify(upSubs, `You're up next ⏱️`, `Court ${next.court} at ${next.game_time} — ${n1} vs ${n2}. Get loose 🏀`);
          nextInfo = { game: `${n1} vs ${n2}`, pinged: upSubs.length };
        }
        return J({ ok: true, sent, next: nextInfo });
      }

      // Coach announcement to everyone subscribed (new draw, recap drop, etc).
      case "announce": {
        if (!await passOk(b.pass)) return J({ error: "wrong passcode", code: "auth" }, 401);
        const title = str(b.title, 60) || "LOTG 🏀";
        const body = str(b.body, 160);
        const sent = await notify(await allSubs() || [], title, body);
        return J({ ok: true, sent });
      }

      default:
        return J({ error: "unknown action" }, 400);
    }
  } catch (e) {
    console.error(action, e);
    return J({ error: "server error" }, 500);
  }
});
