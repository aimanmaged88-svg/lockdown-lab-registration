import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Athlete OS — app API. Sister product of LockDownLab Live, same engine:
// all DB access is server-side (service role), athletes authenticate with
// athlete_id + PIN, the coach with a coach code. Every athlete is private;
// the only cross-athlete visibility is inside a coach-created TEAM, where
// teammates can rate each other (shown as an anonymous aggregate).
// Two-way accountability: athlete <-> coach direct messages + a coach rating.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const COACH_CODE = (Deno.env.get("AOS_COACH_CODE") || "OS-COACH").toUpperCase();

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
const pinHash = (nameKey: string, pin: string) => sha(nameKey + ":" + pin + ":athleteos");

const priv = (t: unknown, max = 500) => String(t || "").slice(0, max).trim();
const num = (v: unknown, lo: number, hi: number, dflt: number) => Math.max(lo, Math.min(hi, +(v as number) >= lo ? +(v as number) : dflt));
const sydToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
function sydYesterday() {
  const d = new Date(Date.now() - 864e5);
  return d.toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
}

const SPORTS = ["basketball", "mma", "soccer", "oztag", "netball", "rugby", "afl", "tennis", "swimming", "running", "volleyball", "general"];
// Light terminology map so AI insights speak the athlete's language.
const SPORT_WORD: Record<string, string> = {
  basketball: "on the court", mma: "on the mats", soccer: "on the pitch", oztag: "on the field",
  netball: "on the court", rugby: "on the field", afl: "on the field", tennis: "on the court",
  swimming: "in the pool", running: "on the track", volleyball: "on the court", general: "in training",
};

async function db(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`db ${r.status}: ${await r.text()}`);
  const txt = await r.text();
  return txt ? JSON.parse(txt) : null;
}

async function getAthlete(aid: string) {
  const rows = await db(`aos_athletes?id=eq.${aid}&select=*`);
  return rows?.[0] || null;
}
async function auth(aid: string, pin: string) {
  const p = await getAthlete(aid);
  if (!p) return null;
  const h = await pinHash(p.name_key, String(pin || ""));
  return h === p.pin_hash ? p : null;
}
const msgsFor = (aid: string) => db(`aos_messages?athlete_id=eq.${aid}&select=id,from_coach,text,created_at&order=created_at.asc&limit=100`);
const teamsList = () => db("aos_teams?select=id,name&order=name.asc");
async function peerAgg(aid: string) {
  const rows = await db(`aos_peer_ratings?ratee_id=eq.${aid}&select=score`);
  const n = rows?.length || 0;
  return { avg: n ? Math.round(rows.reduce((a: number, r: any) => a + r.score, 0) / n * 10) / 10 : null, count: n };
}

function profile(p: any) {
  return {
    id: p.id, name: p.name, sport: p.sport, sport_label: p.sport_label || null, age: p.age, level: p.level, position: p.position,
    goals: p.goals || {}, injuries: p.injuries, train_freq: p.train_freq, comp_schedule: p.comp_schedule,
    equipment: p.equipment || [], xp: p.xp, streak: p.streak, last_checkin: p.last_checkin,
    prefs: p.prefs || {}, created_at: p.created_at, team_id: p.team_id || null,
    coach_rating: p.coach_rating ?? null, coach_rating_note: p.coach_rating_note || null, coach_rating_at: p.coach_rating_at || null,
  };
}

// Rule-driven AI Performance Coach — reads the athlete's own inputs and
// speaks in their sport's terms. Educates and motivates; never diagnoses.
function buildAI(p: any, checkins: any[], journal: any[], peer: any) {
  const out: [string, string][] = [];
  const where = SPORT_WORD[p.sport] || SPORT_WORD.general;
  if (!checkins.length) {
    out.push(["▲", `No data yet. Log your first check-in and Athlete OS starts building your ${p.sport} profile.`]);
  } else {
    const last = checkins.slice(0, 5);
    const avg = (k: string) => Math.round(last.reduce((a, l) => a + (+l[k] || 0), 0) / last.length * 10) / 10;
    const energy = avg("energy"), sleep = avg("sleep_h"), sore = avg("soreness");
    const mins = checkins.reduce((a, l) => a + (l.mins || 0), 0);
    if (checkins.length >= 4) {
      const older = checkins.slice(4, 8);
      if (older.length) {
        const oe = older.reduce((a, l) => a + (+l.energy || 0), 0) / older.length;
        out.push(energy > oe + 0.5 ? ["▲", "Energy trending up — your recovery habits are paying for themselves."]
          : energy < oe - 0.5 ? ["▼", `Energy dipped this week. Protect sleep first — that's where ${p.sport} form is built.`]
          : ["●", `Energy steady at ${energy}/10. Consistency is a skill.`]);
      }
    } else {
      out.push(["●", `Baseline forming: energy ${energy}/10, sleep ${sleep || "—"}h over your last check-ins.`]);
    }
    out.push(["●", `${mins} total minutes logged ${where}. ${mins >= 300 ? "Volume is elite." : "Every rep is data."}`]);
    if (sleep && sleep < 7.5) out.push(["◑", `Sleep averaging ${sleep}h. Champions are made between 8 and 10 — aim for one more hour.`]);
    else if (sleep >= 8) out.push(["◑", `Sleep averaging ${sleep}h — elite recovery. Keep the routine.`]);
    if (sore >= 6) out.push(["▼", `Soreness running ${sore}/10. Swap one session for mobility work and let the body catch up. If pain persists, see a professional.`]);
    const fc: Record<string, number> = {};
    checkins.forEach(c => (c.focus || []).forEach((f: string) => fc[f] = (fc[f] || 0) + 1));
    const top = Object.entries(fc).sort((a, b) => b[1] - a[1])[0];
    if (top) out.push(["●", `You gravitate to ${top[0]} work (${top[1]}× logged). Athlete OS will push your weak side next.`]);
    if (p.streak >= 3) out.push(["🔥", `Streak of ${p.streak} days — accountability compounds.`]);
    if (p.train_freq && checkins.length >= 7) {
      const week = checkins.filter(c => (Date.now() - new Date(c.d).getTime()) < 7 * 864e5).length;
      if (week >= p.train_freq) out.push(["▲", `${week} check-ins this week — you hit your ${p.train_freq}-day target. That's how goals fall.`]);
    }
  }
  const mind = journal.filter(j => j.kind === "mind");
  if (mind.length) {
    const tc: Record<string, number> = {};
    mind.forEach(m => { const t = m.data?.trigger; if (t) tc[t] = (tc[t] || 0) + 1; });
    const topT = Object.entries(tc).sort((a, b) => b[1] - a[1])[0];
    if (mind.length >= 2 && topT) out.push(["◎", `Mental file: “${topT[0]}” rattles you most (${topT[1]}×). You've already written the counter — run the plan, not the emotion.`]);
    else out.push(["◎", `${mind.length} moment${mind.length > 1 ? "s" : ""} logged in the mental file. Writing it down IS the rep.`]);
  }
  const fuel = journal.filter(j => j.kind === "fuel").slice(0, 5);
  if (fuel.length >= 2) {
    const aw = fuel.reduce((a, f) => a + (f.data?.water || 0), 0) / fuel.length;
    out.push(aw >= 6 ? ["⬢", `Hydration averaging ${Math.round(aw)}/8 — your engine runs clean.`]
      : ["⬢", `Water averaging ${Math.round(aw)}/8. Fatigue loves dehydration — keep the bottle moving.`]);
  }
  if (p.coach_rating) out.push(["★", `Your coach rates you ${p.coach_rating}/10 right now.${p.coach_rating_note ? " “" + p.coach_rating_note + "”" : ""} Message them in the Coach tab.`]);
  if (peer && peer.count >= 2) out.push(["◈", `Your teammates rate you ${peer.avg}/10 (${peer.count} peers). Respect is earned in reps.`]);
  if (p.injuries) out.push(["◆", "Injury noted on file. Train around it, not through it — and keep your health professional in the loop."]);
  return out;
}

async function athleteState(p: any) {
  const [checkins, journal, messages, peer] = await Promise.all([
    db(`aos_checkins?athlete_id=eq.${p.id}&select=d,energy,sleep_h,water,soreness,mins,focus,note&order=d.desc&limit=14`),
    db(`aos_journal?athlete_id=eq.${p.id}&select=id,kind,d,data,share_coach,created_at&order=created_at.desc&limit=40`),
    msgsFor(p.id),
    peerAgg(p.id),
  ]);
  let team = null, teammates: any[] = [];
  if (p.team_id) {
    team = (await db(`aos_teams?id=eq.${p.team_id}&select=id,name`))?.[0] || null;
    const [mates, mine] = await Promise.all([
      db(`aos_athletes?team_id=eq.${p.team_id}&id=neq.${p.id}&status=eq.active&select=id,name,position,sport&order=name.asc`),
      db(`aos_peer_ratings?rater_id=eq.${p.id}&select=ratee_id,score`),
    ]);
    const myMap: Record<string, number> = Object.fromEntries((mine || []).map((r: any) => [r.ratee_id, r.score]));
    teammates = (mates || []).map((m: any) => ({ id: m.id, name: m.name, position: m.position, my_rating: myMap[m.id] || null }));
  }
  const today = sydToday();
  return {
    profile: profile(p), checkins, messages, peer, team, teammates,
    ai: buildAI(p, checkins, journal, peer),
    mind: journal.filter((j: any) => j.kind === "mind").slice(0, 10),
    diary: journal.filter((j: any) => j.kind === "diary").slice(0, 10),
    fuel_today: journal.find((j: any) => j.kind === "fuel" && j.d === today) || null,
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
      if (name.length < 2) return J({ error: "Add your name." }, 400);
      if (!/^\d{4}$/.test(pin)) return J({ error: "PIN must be 4 digits." }, 400);
      const key = name.toLowerCase();
      const dup = await db(`aos_athletes?name_key=eq.${encodeURIComponent(key)}&select=id`);
      if (dup.length) return J({ error: "That name is taken — log in instead, or add a last initial." }, 409);
      const sport = SPORTS.includes(String(b.sport || "").toLowerCase()) ? String(b.sport).toLowerCase() : "general";
      const sportLabel = priv(b.sport_label, 40) || null;
      const goals = {
        tags: Array.isArray(b.goal_tags) ? b.goal_tags.slice(0, 6).map((g: unknown) => priv(g, 40)) : [],
        note: priv(b.goal_note, 500),
      };
      const rows = await db("aos_athletes", { method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          name, name_key: key, pin_hash: await pinHash(key, pin),
          sport, sport_label: sportLabel, age: b.age ? num(b.age, 5, 99, 0) || null : null,
          level: priv(b.level, 40) || null, position: priv(b.position, 40) || null,
          goals, injuries: priv(b.injuries, 300) || null,
          train_freq: b.train_freq ? num(b.train_freq, 1, 7, 3) : null,
          comp_schedule: priv(b.comp_schedule, 120) || null,
          equipment: Array.isArray(b.equipment) ? b.equipment.slice(0, 12).map((e: unknown) => priv(e, 30)) : [],
          location: priv(b.location, 80) || null, contact: priv(b.contact, 80) || null,
        }) });
      const p = rows[0];
      if (b.sport_pending && sportLabel) {
        await db("aos_sport_requests", { method: "POST", body: JSON.stringify({ athlete_id: p.id, athlete_name: name, sport: sportLabel }) });
      }
      return J({ ok: true, aid: p.id, state: await athleteState(p) });
    }

    if (a === "login") {
      const key = String(b.name || "").trim().toLowerCase();
      const pin = String(b.pin || "").trim();
      const rows = await db(`aos_athletes?name_key=eq.${encodeURIComponent(key)}&select=*`);
      const p = rows?.[0];
      if (!p || (await pinHash(key, pin)) !== p.pin_hash) return J({ error: "Name or PIN doesn't match." }, 401);
      return J({ ok: true, aid: p.id, state: await athleteState(p) });
    }

    if (["state", "checkin", "mind", "diary", "fuel", "goals_set", "profile_set", "msg", "peer_rate"].includes(a)) {
      const p = await auth(b.aid, b.pin);
      if (!p) return J({ error: "unauthorized" }, 401);
      const today = sydToday();

      if (a === "state") return J({ ok: true, state: await athleteState(p) });

      if (a === "msg") {
        const text = priv(b.text, 600);
        if (!text) return J({ error: "empty" }, 400);
        await db("aos_messages", { method: "POST", body: JSON.stringify({ athlete_id: p.id, from_coach: false, text }) });
        return J({ ok: true, messages: await msgsFor(p.id) });
      }

      if (a === "peer_rate") {
        if (!p.team_id) return J({ error: "You're not in a team yet." }, 400);
        const ratee = String(b.ratee || "");
        if (ratee === p.id) return J({ error: "You can't rate yourself." }, 400);
        const mate = await getAthlete(ratee);
        if (!mate || mate.team_id !== p.team_id) return J({ error: "That athlete isn't on your team." }, 403);
        const score = num(b.score, 1, 10, 0);
        if (!score) return J({ error: "Pick a rating from 1 to 10." }, 400);
        const ex = await db(`aos_peer_ratings?rater_id=eq.${p.id}&ratee_id=eq.${ratee}&select=id`);
        if (ex?.length) await db(`aos_peer_ratings?id=eq.${ex[0].id}`, { method: "PATCH", body: JSON.stringify({ score, updated_at: new Date().toISOString() }) });
        else await db("aos_peer_ratings", { method: "POST", body: JSON.stringify({ rater_id: p.id, ratee_id: ratee, score }) });
        return J({ ok: true, state: await athleteState(await getAthlete(p.id)) });
      }

      if (a === "checkin") {
        if (p.last_checkin === today) return J({ error: "Already checked in today." }, 409);
        await db("aos_checkins", { method: "POST", body: JSON.stringify({
          athlete_id: p.id, d: today,
          energy: num(b.energy, 1, 10, 5),
          sleep_h: Math.max(0, Math.min(14, +b.sleep_h || 0)) || null,
          water: num(b.water, 0, 12, 0),
          soreness: num(b.soreness, 1, 10, 3),
          mins: num(b.mins, 0, 600, 0),
          focus: Array.isArray(b.focus) ? b.focus.slice(0, 6).map((f: unknown) => priv(f, 30)) : [],
          note: priv(b.note, 400),
        }) });
        const streak = p.last_checkin === sydYesterday() ? p.streak + 1 : 1;
        await db(`aos_athletes?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ xp: p.xp + 40, streak, last_checkin: today }) });
        return J({ ok: true, gained: 40, state: await athleteState(await getAthlete(p.id)) });
      }

      if (a === "mind") {
        const data = {
          trigger: priv(b.trigger, 40), when: priv(b.when, 20),
          said: priv(b.said, 500),
          feelings: Array.isArray(b.feelings) ? b.feelings.slice(0, 6).map((f: unknown) => priv(f, 24)) : [],
          impact: num(b.impact, 1, 10, 5),
          plan: priv(b.plan, 500),
        };
        if (!data.said && !data.plan && !data.trigger) return J({ error: "empty" }, 400);
        await db("aos_journal", { method: "POST", body: JSON.stringify({ athlete_id: p.id, kind: "mind", d: today, data, share_coach: !!b.share_coach }) });
        const todayMind = await db(`aos_journal?athlete_id=eq.${p.id}&kind=eq.mind&d=eq.${today}&select=id`);
        let gained = 0;
        if ((todayMind?.length || 0) <= 3) { gained = 30; await db(`aos_athletes?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ xp: p.xp + 30 }) }); }
        return J({ ok: true, gained, state: await athleteState(await getAthlete(p.id)) });
      }

      if (a === "diary") {
        const text = priv(b.text, 1000);
        if (!text) return J({ error: "empty" }, 400);
        const already = await db(`aos_journal?athlete_id=eq.${p.id}&kind=eq.diary&d=eq.${today}&select=id`);
        await db("aos_journal", { method: "POST", body: JSON.stringify({ athlete_id: p.id, kind: "diary", d: today, data: { text }, share_coach: false }) });
        let gained = 0;
        if (!(already?.length)) { gained = 15; await db(`aos_athletes?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ xp: p.xp + 15 }) }); }
        return J({ ok: true, gained, state: await athleteState(await getAthlete(p.id)) });
      }

      if (a === "fuel") {
        const rows = await db(`aos_journal?athlete_id=eq.${p.id}&kind=eq.fuel&d=eq.${today}&select=id,data`);
        const ex = rows?.[0];
        const pills = Array.isArray(b.pills) ? b.pills.slice(0, 10).map((x: unknown) => priv(x, 24)) : (ex?.data?.pills || []);
        const water = Math.max(0, Math.min(12, +b.water >= 0 ? +b.water : (ex?.data?.water || 0)));
        let gained = 0;
        const fresh = await getAthlete(p.id);
        const data: any = { pills, water, xp_pills: !!ex?.data?.xp_pills, xp_water: !!ex?.data?.xp_water };
        if (!data.xp_pills && pills.length) { data.xp_pills = true; gained += 20; }
        if (!data.xp_water && water >= 8) { data.xp_water = true; gained += 15; }
        if (ex) await db(`aos_journal?id=eq.${ex.id}`, { method: "PATCH", body: JSON.stringify({ data }) });
        else await db("aos_journal", { method: "POST", body: JSON.stringify({ athlete_id: p.id, kind: "fuel", d: today, data, share_coach: true }) });
        if (gained) { await db(`aos_athletes?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ xp: fresh.xp + gained }) }); }
        return J({ ok: true, gained, state: await athleteState(await getAthlete(p.id)) });
      }

      if (a === "goals_set") {
        const goals = {
          tags: Array.isArray(b.goal_tags) ? b.goal_tags.slice(0, 6).map((g: unknown) => priv(g, 40)) : (p.goals?.tags || []),
          note: priv(b.goal_note, 500) || p.goals?.note || "",
        };
        await db(`aos_athletes?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ goals }) });
        return J({ ok: true, state: await athleteState(await getAthlete(p.id)) });
      }

      if (a === "profile_set") {
        const patch: any = {};
        if (b.injuries !== undefined) patch.injuries = priv(b.injuries, 300) || null;
        if (b.train_freq !== undefined) patch.train_freq = num(b.train_freq, 1, 7, 3);
        if (b.comp_schedule !== undefined) patch.comp_schedule = priv(b.comp_schedule, 120) || null;
        if (b.position !== undefined) patch.position = priv(b.position, 40) || null;
        if (b.level !== undefined) patch.level = priv(b.level, 40) || null;
        if (Array.isArray(b.equipment)) patch.equipment = b.equipment.slice(0, 12).map((e: unknown) => priv(e, 30));
        if (!Object.keys(patch).length) return J({ error: "empty" }, 400);
        await db(`aos_athletes?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify(patch) });
        return J({ ok: true, state: await athleteState(await getAthlete(p.id)) });
      }
    }

    if (["roster", "cdetail", "note_add", "status_set", "cmsg", "rate", "team_create", "team_assign", "sport_resolve"].includes(a)) {
      if (String(b.code || "").toUpperCase() !== COACH_CODE) return J({ error: "bad coach code" }, 401);

      if (a === "roster") {
        const [athletes, teams, peers, sportReqs] = await Promise.all([
          db("aos_athletes?select=id,name,sport,sport_label,age,level,position,goals,injuries,train_freq,comp_schedule,equipment,location,contact,xp,streak,last_checkin,status,created_at,team_id,coach_rating,coach_rating_at&order=created_at.asc"),
          teamsList(),
          db("aos_peer_ratings?select=ratee_id,score"),
          db("aos_sport_requests?status=eq.pending&select=id,athlete_name,sport,created_at&order=created_at.desc"),
        ]);
        const pmap: Record<string, number[]> = {};
        (peers || []).forEach((r: any) => { (pmap[r.ratee_id] = pmap[r.ratee_id] || []).push(r.score); });
        (athletes || []).forEach((x: any) => {
          const arr = pmap[x.id];
          x.peer_avg = arr && arr.length ? Math.round(arr.reduce((s: number, v: number) => s + v, 0) / arr.length * 10) / 10 : null;
          x.peer_count = arr ? arr.length : 0;
        });
        return J({ ok: true, today: sydToday(), athletes, teams: teams || [], sport_requests: sportReqs || [] });
      }
      if (a === "sport_resolve") {
        const status = ["approved", "rejected"].includes(String(b.status)) ? String(b.status) : "approved";
        await db(`aos_sport_requests?id=eq.${b.req_id}`, { method: "PATCH", body: JSON.stringify({ status, resolved_at: new Date().toISOString() }) });
        return J({ ok: true });
      }
      if (a === "cdetail") {
        const p = await getAthlete(b.aid);
        if (!p) return J({ error: "no athlete" }, 404);
        const [checkins, notes, journal, messages, peer, teams] = await Promise.all([
          db(`aos_checkins?athlete_id=eq.${p.id}&select=d,energy,sleep_h,water,soreness,mins,focus,note&order=d.desc&limit=14`),
          db(`aos_notes?athlete_id=eq.${p.id}&select=id,text,created_at&order=created_at.asc`),
          db(`aos_journal?athlete_id=eq.${p.id}&share_coach=eq.true&select=kind,d,data,created_at&order=created_at.desc&limit=15`),
          msgsFor(p.id),
          peerAgg(p.id),
          teamsList(),
        ]);
        return J({ ok: true, profile: profile(p), contact: p.contact || null, status: p.status, checkins, notes, messages, peer, teams: teams || [],
          shared_mind: journal.filter((j: any) => j.kind === "mind"),
          fuel: journal.filter((j: any) => j.kind === "fuel").slice(0, 7) });
      }
      if (a === "team_create") {
        const name = priv(b.name, 60);
        if (name.length < 2) return J({ error: "Name the team." }, 400);
        const rows = await db("aos_teams", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ name }) });
        return J({ ok: true, team: rows[0], teams: await teamsList() });
      }
      if (a === "team_assign") {
        if (!(await getAthlete(b.aid))) return J({ error: "no athlete" }, 404);
        const team_id = b.team_id ? String(b.team_id) : null;
        await db(`aos_athletes?id=eq.${b.aid}`, { method: "PATCH", body: JSON.stringify({ team_id }) });
        return J({ ok: true });
      }
      if (a === "cmsg") {
        const text = priv(b.text, 600);
        if (!text) return J({ error: "empty" }, 400);
        if (!(await getAthlete(b.aid))) return J({ error: "no athlete" }, 404);
        await db("aos_messages", { method: "POST", body: JSON.stringify({ athlete_id: b.aid, from_coach: true, text }) });
        return J({ ok: true, messages: await msgsFor(b.aid) });
      }
      if (a === "rate") {
        const score = num(b.score, 1, 10, 0);
        if (!score) return J({ error: "Pick a rating from 1 to 10." }, 400);
        if (!(await getAthlete(b.aid))) return J({ error: "no athlete" }, 404);
        await db(`aos_athletes?id=eq.${b.aid}`, { method: "PATCH", body: JSON.stringify({ coach_rating: score, coach_rating_note: priv(b.note, 200) || null, coach_rating_at: new Date().toISOString() }) });
        return J({ ok: true });
      }
      if (a === "note_add") {
        const text = String(b.text || "").trim().slice(0, 300);
        if (!text) return J({ error: "empty" }, 400);
        await db("aos_notes", { method: "POST", body: JSON.stringify({ athlete_id: b.aid, text }) });
        return J({ ok: true });
      }
      if (a === "status_set") {
        const status = ["active", "paused"].includes(String(b.status)) ? String(b.status) : "active";
        await db(`aos_athletes?id=eq.${b.aid}`, { method: "PATCH", body: JSON.stringify({ status }) });
        return J({ ok: true });
      }
    }

    return J({ error: "unknown action" }, 400);
  } catch (e) {
    return J({ error: String(e) }, 500);
  }
});
