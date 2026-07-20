import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Eagles Gym — live class timetable API.
// Same engine as the rest of this repo: all DB access is server-side with the
// service-role key. The public site reads the timetable through `get`; the
// admin edits it through `save`, gated by a shared username + password checked
// here on the server (never shipped to the browser).
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_USER = (Deno.env.get("EAGLES_ADMIN_USER") || "eagle").trim().toLowerCase();
const ADMIN_PASS = Deno.env.get("EAGLES_ADMIN_PASS") || "jim2196";

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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const s = (v: unknown, max = 80) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

// Accept whatever the admin panel sends, but sanitise every field and cap the
// list so a bad payload can never bloat or break the row.
function clean(data: any) {
  const list = Array.isArray(data?.classes) ? data.classes : [];
  const classes = list.slice(0, 400).map((c: any, i: number) => ({
    id: s(c?.id, 24) || `c${Date.now().toString(36)}${i}`,
    day: DAYS.includes(s(c?.day, 3)) ? s(c?.day, 3) : "Mon",
    time: s(c?.time, 20),
    name: s(c?.name, 60),
    coach: s(c?.coach, 60),
    level: s(c?.level, 40),
  })).filter((c: any) => c.name || c.coach || c.time);
  return { title: s(data?.title, 80) || "Weekly Class Timetable", classes };
}

async function readRow() {
  const rows = await db("eaglesgym_timetable?id=eq.1&select=data,updated_at");
  return rows?.[0] || { data: { title: "Weekly Class Timetable", classes: [] }, updated_at: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const b = await req.json().catch(() => ({} as any));
    const action = b.action;

    if (action === "get") {
      const row = await readRow();
      return J({ ok: true, data: row.data, updated_at: row.updated_at });
    }

    if (action === "login" || action === "save") {
      const user = s(b.username, 40).toLowerCase();
      const pass = String(b.password ?? "");
      if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
        return J({ error: "Wrong username or password." }, 401);
      }
      if (action === "login") return J({ ok: true });

      const data = clean(b.data);
      await db("eaglesgym_timetable?id=eq.1", {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ data, updated_at: new Date().toISOString() }),
      });
      const row = await readRow();
      return J({ ok: true, data: row.data, updated_at: row.updated_at });
    }

    return J({ error: "unknown action" }, 400);
  } catch (e) {
    return J({ error: String(e) }, 500);
  }
});
