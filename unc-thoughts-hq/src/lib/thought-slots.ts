import { formatInTimeZone } from "date-fns-tz";
import { TZ, isoDate } from "./time";

// Sydney-day slots: a different thought in the morning, afternoon and evening.
export type Slot = { key: "morning" | "afternoon" | "evening"; label: string };

export function currentSlot(now = new Date()): Slot {
  const hour = parseInt(formatInTimeZone(now, TZ, "H"), 10);
  if (hour < 12) return { key: "morning", label: "Morning thought" };
  if (hour < 17) return { key: "afternoon", label: "Afternoon thought" };
  return { key: "evening", label: "Evening thought" };
}

function seededIndex(seed: string, n: number): number {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return n > 0 ? h % n : 0;
}

type Prompt = { id: string; text: string; pillar: string; actions: string };

// Deterministic per member/day/slot, weighted toward pillars they save:
// each save of a pillar adds one extra "ticket" for that pillar's prompts.
// Earlier slots' picks are excluded so the day doesn't repeat itself.
export function pickThought(
  prompts: Prompt[],
  savedPillarCounts: Record<string, number>,
  memberId: string,
  slot: Slot["key"],
  now = new Date(),
): Prompt | null {
  if (prompts.length === 0) return null;
  const day = isoDate(now);
  const order: Slot["key"][] = ["morning", "afternoon", "evening"];
  const excluded = new Set<string>();
  let pool = prompts;
  for (const s of order) {
    pool = prompts.filter((p) => !excluded.has(p.id));
    if (pool.length === 0) pool = prompts;
    const tickets: Prompt[] = [];
    for (const p of pool) {
      const w = 1 + Math.min(5, savedPillarCounts[p.pillar] ?? 0);
      for (let i = 0; i < w; i++) tickets.push(p);
    }
    const pick = tickets[seededIndex(`${memberId}:${day}:${s}`, tickets.length)];
    if (s === slot) return pick;
    excluded.add(pick.id);
  }
  return null;
}
