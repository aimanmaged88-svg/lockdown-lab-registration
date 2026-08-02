import { prisma, getOrgId } from "../db";
import type { TimeBand } from "./timeband";

// Retrieval over Unk's Brain. ONLY approval="approved" items are ever read.
// Simple, transparent keyword scoring — no embeddings, no external AI — so the
// owner can always see exactly why an item was used.

export type Intent =
  | "game_day"
  | "training_before"
  | "recovery"
  | "nutrition"
  | "mindset_flat"
  | "mistake_reset"
  | "quick_prep"
  | "generic";

const INTENT_TESTS: Array<{ intent: Intent; test: RegExp }> = [
  { intent: "mistake_reset", test: /\b(mistake|turnover|air ?ball|missed .{0,20}(shot|free throw)|stuffed up|messed up|bad (start|play)|how do i reset)\b/i },
  { intent: "quick_prep", test: /\b(only have|got) (about )?(\d+|five|ten|fifteen) min|five minutes\b/i },
  { intent: "recovery", test: /\b(after (the )?(training|game|session)|post[- ](game|training|session)|recover|sore after)\b/i },
  { intent: "game_day", test: /\b(game|match)\b/i },
  { intent: "training_before", test: /\b(before|pre)[- ]?(training|practice|session)\b|\btraining (today|tonight|at)\b/i },
  { intent: "mindset_flat", test: /\b(feel (flat|tired|nervous|off|low)|no energy to|not feeling it|can'?t get up for|flat today)\b/i },
  { intent: "nutrition", test: /\b(eat|food|meal|snack|drink|hungry|breakfast|lunch|dinner|fuel)\b/i },
];

export function detectIntent(question: string): Intent {
  for (const t of INTENT_TESTS) if (t.test.test(question)) return t.intent;
  return "generic";
}

export type BrainItem = {
  id: string;
  kind: string;
  title: string;
  pillar: string;
  audience: string;
  body: string;
  tags: string[];
  source: string | null;
  sourceUrl: string | null;
  safetyClass: string;
};

export async function approvedItems(): Promise<BrainItem[]> {
  const orgId = await getOrgId();
  const rows = await prisma.knowledgeItem.findMany({ where: { orgId, approval: "approved" } });
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    pillar: r.pillar,
    audience: r.audience,
    body: r.body,
    tags: r.tags ? (JSON.parse(r.tags) as string[]) : [],
    source: r.source,
    sourceUrl: r.sourceUrl,
    safetyClass: r.safetyClass,
  }));
}

const STOP = new Set(["the", "a", "an", "is", "at", "i", "my", "me", "what", "should", "do", "to", "of", "and", "for", "in", "on", "it", "can", "how", "have", "am", "pm"]);
function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
}

// Score items for a question + intent + band. Pure so it's unit-testable.
export function rank(items: BrainItem[], question: string, intent: Intent, band: TimeBand | null): Array<{ item: BrainItem; score: number }> {
  const qTokens = new Set(tokens(question));
  return items
    .map((item) => {
      let score = 0;
      if (item.tags.includes(`intent:${intent}`)) score += 8;
      if (band && item.tags.includes(`band:${band}`)) score += 8;
      if (band && item.tags.some((t) => t.startsWith("band:")) && !item.tags.includes(`band:${band}`)) score -= 6;
      for (const t of tokens(item.title)) if (qTokens.has(t)) score += 3;
      for (const tag of item.tags) if (!tag.includes(":") && qTokens.has(tag.toLowerCase())) score += 4;
      const bodyTokens = tokens(item.body.slice(0, 600));
      let hits = 0;
      for (const t of bodyTokens) if (qTokens.has(t)) hits++;
      score += Math.min(4, hits);
      if (item.kind === "playbook") score += 2; // structured answers first
      return { item, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

// Parse a playbook body's labelled sections.
export type Sections = { doNow?: string; food?: string; mindset?: string; careful?: string; privateQ?: string; why?: string };
const LABELS: Array<{ key: keyof Sections; label: RegExp }> = [
  { key: "doNow", label: /^DO NOW:/i },
  { key: "food", label: /^FOOD:/i },
  { key: "mindset", label: /^MINDSET:/i },
  { key: "careful", label: /^CAREFUL:/i },
  { key: "privateQ", label: /^PRIVATE:/i },
  { key: "why", label: /^WHY:/i },
];

export function parseSections(body: string): Sections {
  const out: Sections = {};
  let current: keyof Sections | null = null;
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    const hit = LABELS.find((l) => l.label.test(line));
    if (hit) {
      current = hit.key;
      const rest = line.replace(hit.label, "").trim();
      out[current] = rest;
    } else if (current && line) {
      out[current] = out[current] ? `${out[current]}\n${line}` : line;
    }
  }
  return out;
}
