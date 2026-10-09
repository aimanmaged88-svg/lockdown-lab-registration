// Travel Companion — AI endpoint (chat, translate, journal draft).
// Runs on Netlify Functions and talks to Anthropic through Netlify's AI Gateway,
// which injects ANTHROPIC_API_KEY + ANTHROPIC_BASE_URL at runtime (no key to manage).

const MODELS = ["claude-sonnet-4-5", "claude-sonnet-5-5", "claude-haiku-5-5", "claude-haiku-4-5"];

const CHAT_SYSTEM = `You are the travel companion inside "Travel Companion", a personal trip app (money, map + day plans, translator, journal). You talk to the traveller directly — casual, direct, warm, Aussie-friendly if they're Australian. They asked you to be "full in depth, my travel companion".

You get a CONTEXT block with their exact live state: budget, buffer, committed costs, remaining pot, today's allowance, spend so far, pace, per-day projections, cash in pocket, recent entries, their own day plans and journal, map pins, and (for Indonesia/Lombok/Gili trips) a suggested flow, a guide with rough 2026 prices, island notes and the real places on the Gili Air map.

Rules:
- Use the numbers from CONTEXT exactly. Never invent balances. Quote money in the home currency AND the local one using the RATE (round sensibly: Rp 350k, Rp 1.2M, $28).
- "How much will I have on <date>" → answer from the DAY TABLE (plan-end and pace-end) and say how many days still need funding after it.
- Be a real companion: when asked where to go / what to do, give a concrete plan with timings, line-by-line costs, and whether it fits the allowance (or how to make it fit). Use the map places by name when relevant so they can find them on the Map tab. Suggest cheap swaps when over pace; celebrate when under.
- Local knowledge is welcome (Lombok/Gili: ayam taliwang, plecing kangkung, sate rembiga; warung etiquette; Gili Air has no motor vehicles; public boats Bangsal; ATM tips — bank ATMs, decline conversion; money changers with the authorised sign; October = end of dry season, hot, odd showers; respect — Muslim Sasak community, cover up in the village, prayer times). Mark prices as rough guides when not in context.
- Short paragraphs, bold key numbers with **double asterisks** (the app renders them). No markdown headers, no tables. Under ~220 words unless asked for a full plan.
- You cannot log spends or edit plans yourself — if they tell you they spent something, acknowledge it and say to tap Log (or quick-add); for plans, say to add places on the Map tab.
- Safety first: illness, accidents, trouble → practical local guidance (Indonesia emergency 112; Siloam Hospital Mataram for Lombok) before money talk.`;

const TRANSLATE_SYSTEM = `You are a precise travel translator. Translate the user's text between the two languages given. Output ONLY compact JSON with keys: t (the translation, natural and polite as a traveller would say it), p (a simple English-phonetic pronunciation guide for the translation when the target is not English, else empty string), n (one short note on usage/politeness/alternatives, or empty string). No markdown, no extra keys.`;

const JOURNAL_SYSTEM = `You ghost-write a traveller's personal journal entry in first person, past tense, in their voice: honest, vivid, a little funny, no clichés, no hashtags, no emojis. Use ONLY the facts given (don't invent events or people; it's fine to add sensory colour consistent with the place). First line = a short title (max 7 words), then a blank line, then 90–160 words. Mention money only if the facts include spends worth a line.`;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

async function callClaude(base, key, system, messages, max_tokens, minLen = 0) {
  let lastErr = null;
  for (const model of MODELS) {
    try {
      const r = await fetch(base + "/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens, system, messages }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        const text = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
        if (text && text.length >= minLen) return { text, model, stop: j.stop_reason };
        lastErr = text ? "reply too short" : "empty reply";
        continue;
      }
      lastErr = j?.error?.message || `HTTP ${r.status}`;
      if (r.status === 404 || r.status === 429 || r.status >= 500 || /model/i.test(lastErr)) continue;
      break;
    } catch (e) {
      lastErr = String(e);
    }
  }
  return { error: lastErr || "AI unavailable" };
}

export default async (req) => {
  const base = (Netlify.env.get("ANTHROPIC_BASE_URL") || "https://api.anthropic.com").replace(/\/$/, "");
  const key = Netlify.env.get("ANTHROPIC_API_KEY");
  if (req.method === "GET") return json({ ok: !!key, gateway: !!Netlify.env.get("ANTHROPIC_BASE_URL") });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!key) return json({ error: "AI gateway not active on this site yet" }, 503);

  let body;
  try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const mode = body.mode || "chat";

  if (mode === "translate") {
    const text = String(body.text || "").slice(0, 1200);
    const from = String(body.from || "English").slice(0, 40), to = String(body.to || "Indonesian").slice(0, 40);
    if (!text) return json({ error: "no text" }, 400);
    const r = await callClaude(base, key, TRANSLATE_SYSTEM, [{ role: "user", content: `From ${from} to ${to}:\n${text}` }], 400);
    if (r.error) return json({ error: r.error }, 502);
    try {
      const m = r.text.match(/\{[\s\S]*\}/);
      const o = JSON.parse(m ? m[0] : r.text);
      return json({ t: String(o.t || ""), p: String(o.p || ""), n: String(o.n || ""), model: r.model });
    } catch {
      return json({ t: r.text.replace(/^[^:]*:\s*/, "").trim(), p: "", n: "", model: r.model });
    }
  }

  if (mode === "journal") {
    const facts = String(body.facts || "").slice(0, 4000);
    const name = String(body.name || "the traveller").slice(0, 40);
    const r = await callClaude(base, key, JOURNAL_SYSTEM, [{ role: "user", content: `Traveller: ${name}.\nFacts: ${facts}` }], 500);
    if (r.error) return json({ error: r.error }, 502);
    return json({ text: r.text, model: r.model });
  }

  // chat
  const msgs = Array.isArray(body.messages) ? body.messages.slice(-14) : [];
  const context = String(body.context || "").slice(0, 28000);
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json({ error: "need a user message" }, 400);
  const clean = [];
  for (const m of msgs) {
    const role = m.role === "assistant" ? "assistant" : "user";
    const content = String(m.content || "").slice(0, 4000);
    if (!content) continue;
    if (clean.length && clean[clean.length - 1].role === role) clean[clean.length - 1].content += "\n" + content;
    else clean.push({ role, content });
  }
  if (clean.length && clean[0].role !== "user") clean.shift();
  if (!clean.length) return json({ error: "need a user message" }, 400);
  const system = [{ type: "text", text: CHAT_SYSTEM }, { type: "text", text: "CONTEXT (live app state):\n" + context }];
  const r = await callClaude(base, key, system, clean, 900, 60);
  if (r.error) return json({ error: r.error }, 502);
  return json({ text: r.text, model: r.model, stop: r.stop });
};

export const config = { path: "/api/ai", method: ["GET", "POST"] };
