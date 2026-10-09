// Lombok Companion — AI chat endpoint.
// Runs on Netlify Functions and talks to Anthropic through Netlify's AI Gateway,
// which injects ANTHROPIC_API_KEY + ANTHROPIC_BASE_URL at runtime (no key to manage).
// Falls back to a user-supplied ANTHROPIC_API_KEY env var if the gateway is off.

const MODELS = ["claude-sonnet-5-5", "claude-sonnet-4-5", "claude-haiku-5-5", "claude-haiku-4-5"];

const SYSTEM = `You are the travel companion inside "Lombok Companion", a personal travel-money app. You're talking to the traveller directly (Aiman, a basketball coach from Sydney, Australia — casual, direct, Aussie-friendly; he said "be my travel companion, full in depth").

You get a CONTEXT block with his exact live finances: budget, buffer, committed costs, remaining pot, today's allowance, spend so far, pace, per-day projections, cash in pocket, recent entries, a suggested 14-day flow and a Lombok guide with rough 2026 prices.

Rules:
- Use the numbers from CONTEXT exactly. Never invent balances. When you quote money, give AUD and the rupiah equivalent using the RATE in context (round sensibly: Rp 350k, Rp 1.2M, $28).
- If he asks "how much will I have on <date>", answer from the DAY TABLE (plan-end and pace-end for that date) and say how many days still need funding after it.
- Be a real companion: when he asks where to go or what to do, give a concrete plan for the day with timings, what it'll cost line by line, and whether it fits today's allowance (or how to make it fit). Suggest cheap swaps when he's over pace. Celebrate when he's under.
- Lombok knowledge beyond the guide is welcome (food — ayam taliwang, plecing kangkung, sate rembiga; warung etiquette; scooter + helmet + police checkpoints; ATM tips: bank-branch ATMs, decline conversion; money changers with the authorised sign; Gili boats from Bangsal; Rinjani operators; weather in October = end of dry season, hot, occasional showers). Mark prices as rough guides when they're not in the context.
- Be honest and specific. Short paragraphs, bold the key numbers with **double asterisks** (the app renders them). No markdown headers, no tables. Keep it under ~220 words unless he asks for a full plan.
- You cannot log spends yourself — if he tells you he spent something, acknowledge it and tell him to tap Log (or quick-add) so the maths updates.
- Safety matters: if he mentions feeling unwell, scooter accidents, or trouble, give practical local guidance (Siloam Hospital Mataram, tourist police, +62 emergency 112) before money talk.`;

function cors(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

export default async (req) => {
  const base = (Netlify.env.get("ANTHROPIC_BASE_URL") || "https://api.anthropic.com").replace(/\/$/, "");
  const key = Netlify.env.get("ANTHROPIC_API_KEY");
  if (req.method === "GET") return cors({ ok: !!key, gateway: !!Netlify.env.get("ANTHROPIC_BASE_URL") });
  if (req.method !== "POST") return cors({ error: "POST only" }, 405);
  if (!key) return cors({ error: "AI gateway not active on this site yet" }, 503);

  let body;
  try { body = await req.json(); } catch { return cors({ error: "bad json" }, 400); }
  const msgs = Array.isArray(body.messages) ? body.messages.slice(-14) : [];
  const context = String(body.context || "").slice(0, 20000);
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return cors({ error: "need a user message" }, 400);
  // Anthropic requires alternating roles starting with user — collapse any run-on turns.
  const clean = [];
  for (const m of msgs) {
    const role = m.role === "assistant" ? "assistant" : "user";
    const content = String(m.content || "").slice(0, 4000);
    if (!content) continue;
    if (clean.length && clean[clean.length - 1].role === role) clean[clean.length - 1].content += "\n" + content;
    else clean.push({ role, content });
  }
  if (clean[0].role !== "user") clean.shift();

  const system = [
    { type: "text", text: SYSTEM },
    { type: "text", text: "CONTEXT (live app state):\n" + context },
  ];

  let lastErr = null;
  for (const model of MODELS) {
    try {
      const r = await fetch(base + "/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: 900, system, messages: clean }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        const text = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
        if (text) return cors({ text, model });
        lastErr = "empty reply";
        continue;
      }
      lastErr = j?.error?.message || `HTTP ${r.status}`;
      // Model not available on this gateway → try the next one; any other error → stop.
      if (r.status === 404 || /model/i.test(lastErr)) continue;
      break;
    } catch (e) {
      lastErr = String(e);
    }
  }
  return cors({ error: lastErr || "AI unavailable" }, 502);
};

export const config = { path: "/api/ai", method: ["GET", "POST"] };
