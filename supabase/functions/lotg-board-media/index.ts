import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// LOTG board — recap media uploads (videos + big images) for the intro takeover.
// Auth = the board's shared admin passcode (lotg_admin.token, the same one the
// scoreboard uses), passed in the body; verified server-side against the DB.
// Storage: public bucket `lotg-media` (200MB, image+video mimes), path board/*.
// Signed-upload flow: the browser PUTs the file straight to Storage — bytes
// never pass through this function.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "lotg-media";
const EXT: Record<string, string> = {
  "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm",
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function sfetch(path: string, init: RequestInit = {}) {
  return await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
}
async function passOk(pass: unknown) {
  const p = String(pass ?? "").trim();
  if (!p) return false;
  const r = await sfetch(`/rest/v1/lotg_admin?id=eq.1&select=token`);
  if (!r.ok) return false;
  const rows = await r.json();
  return rows?.[0]?.token === p;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return J({ error: "POST only" }, 405);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return J({ error: "bad json" }, 400); }
  const action = String(b.action ?? "");

  try {
    if (!await passOk(b.pass)) return J({ error: "wrong passcode", code: "auth" }, 401);

    // Signed URL for one file — browser PUTs the bytes straight to Storage.
    if (action === "init") {
      const ext = EXT[String(b.contentType ?? "").toLowerCase()];
      if (!ext) return J({ error: "use MP4/MOV/WebM video or JPG/PNG/WebP image" }, 400);
      const path = `board/${crypto.randomUUID().slice(0, 13)}.${ext}`;
      const r = await sfetch(`/storage/v1/object/upload/sign/${BUCKET}/${path}`, { method: "POST", body: "{}" });
      if (!r.ok) return J({ error: `sign failed (${r.status})` }, 500);
      const { url } = await r.json();
      return J({
        uploadUrl: `${SUPABASE_URL}/storage/v1${url}`,
        path,
        publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`,
      });
    }

    // Wipe all board media objects (used when a new week's recap replaces the old).
    if (action === "clear") {
      const l = await sfetch(`/storage/v1/object/list/${BUCKET}`, { method: "POST", body: JSON.stringify({ prefix: "board/", limit: 1000 }) });
      const items = l.ok ? await l.json() : [];
      const names = (items || []).map((o: Record<string, unknown>) => `board/${o.name}`).filter((n: string) => !n.endsWith("/"));
      if (names.length) await sfetch(`/storage/v1/object/${BUCKET}`, { method: "DELETE", body: JSON.stringify({ prefixes: names }) });
      return J({ ok: true, removed: names.length });
    }

    return J({ error: "unknown action" }, 400);
  } catch (e) {
    console.error(action, e);
    return J({ error: "server error" }, 500);
  }
});
