import { differenceInCalendarDays } from "date-fns";
import { PILLARS } from "./enums";
import { median, MIN_SAMPLE, type Confidence } from "./analytics";

// Transparent, rule-based recommendation engine. Every recommendation carries a
// plain-language reason and a confidence. It NEVER moves, publishes, deletes or
// rewrites content — it only suggests. Pure functions so they can be unit-tested
// without a database.

export type Recommendation = {
  id: string;
  kind:
    | "next_best_action"
    | "topic"
    | "pillar"
    | "audience"
    | "duration"
    | "hook"
    | "window"
    | "simplify"
    | "repeat"
    | "stop"
    | "comment_to_reel"
    | "second_part"
    | "talk"
    | "highlight"
    | "followup";
  title: string;
  reason: string; // plain language, e.g. "Nutrition hasn't been covered for 9 days…"
  confidence: Confidence;
  refId?: string;
};

export type EngineInput = {
  today: Date;
  content: Array<{
    id: string;
    title: string;
    pillar: string;
    audience: string;
    format: string;
    status: string;
    plannedDate: Date | null;
    postedAt: Date | null;
    reelSeconds: number | null;
    highlight: string | null;
    followUpOfId: string | null;
  }>;
  // per-content latest metrics we care about
  metrics: Array<{ contentId: string; pillar: string; format: string; saves: number | null; reelSeconds: number | null; wasPosted: boolean }>;
  questions: Array<{ id: string; text: string; frequency: number; status: string }>;
  capacityMinutes: number; // available time today (from settings / quiet-week mode)
};

function conf(n: number): Confidence {
  if (n >= 6) return "high";
  if (n >= MIN_SAMPLE) return "medium";
  return "low";
}

export function recommend(input: EngineInput): Recommendation[] {
  const recs: Recommendation[] = [];
  const { today, content, metrics, questions } = input;

  // ── Overdue work → next best action ──────────────────────────────
  const overdue = content
    .filter((c) => c.plannedDate && !c.postedAt && c.status !== "Skipped" && differenceInCalendarDays(today, c.plannedDate) > 0)
    .sort((a, b) => (a.plannedDate!.getTime() - b.plannedDate!.getTime()));
  if (overdue.length) {
    const c = overdue[0];
    const days = differenceInCalendarDays(today, c.plannedDate!);
    recs.push({
      id: `nba-overdue-${c.id}`,
      kind: "next_best_action",
      title: `Deal with "${c.title}" — ${days} day${days > 1 ? "s" : ""} overdue`,
      reason: `It was planned for ${days} day${days > 1 ? "s" : ""} ago and hasn't posted. Post it, simplify it, or reschedule — don't let it sit.`,
      confidence: "high",
      refId: c.id,
    });
  }

  // ── Pillar balance: longest-neglected pillar ─────────────────────
  const lastPosted: Record<string, number> = {};
  for (const c of content) {
    if (c.postedAt) {
      const d = differenceInCalendarDays(today, c.postedAt);
      if (lastPosted[c.pillar] == null || d < lastPosted[c.pillar]) lastPosted[c.pillar] = d;
    }
  }
  let neglected: { pillar: string; days: number } | null = null;
  for (const p of PILLARS) {
    if (p === "Community") continue;
    const days = lastPosted[p] ?? 999;
    if (!neglected || days > neglected.days) neglected = { pillar: p, days };
  }
  if (neglected && neglected.days >= 7) {
    const daysLabel = neglected.days >= 999 ? "not yet this period" : `${neglected.days} days`;
    recs.push({
      id: `pillar-${neglected.pillar}`,
      kind: "pillar",
      title: `Cover ${neglected.pillar} next`,
      reason: `${neglected.pillar} hasn't been covered for ${daysLabel}. Rotating pillars keeps the account balanced and the audience broad.`,
      confidence: "medium",
    });
  }

  // ── High-performing topics (repeat) — by saves vs median ─────────
  const posted = metrics.filter((m) => m.wasPosted && m.saves != null);
  const saveMedian = median(posted.map((m) => m.saves!));
  if (saveMedian != null && posted.length >= MIN_SAMPLE) {
    const strong = posted.filter((m) => (m.saves ?? 0) >= saveMedian * 1.25);
    if (strong.length) {
      const byPillar: Record<string, number> = {};
      strong.forEach((m) => (byPillar[m.pillar] = (byPillar[m.pillar] ?? 0) + 1));
      const top = Object.entries(byPillar).sort((a, b) => b[1] - a[1])[0];
      if (top) {
        recs.push({
          id: `repeat-${top[0]}`,
          kind: "repeat",
          title: `Do more ${top[0]}`,
          reason: `Your ${top[0]} posts are saving above your recent median (${strong.length} of them beat it by 25%+). Saves mean people want to act on it later.`,
          confidence: conf(posted.length),
        });
      }
    }
    // ── Weak formats (stop / rethink) ──────────────────────────────
    const byFormat: Record<string, number[]> = {};
    posted.forEach((m) => ((byFormat[m.format] ??= []).push(m.saves ?? 0)));
    for (const [format, arr] of Object.entries(byFormat)) {
      if (arr.length >= MIN_SAMPLE) {
        const fm = median(arr)!;
        if (fm < saveMedian * 0.6) {
          recs.push({
            id: `stop-${format}`,
            kind: "stop",
            title: `Rethink the ${format} format`,
            reason: `${format} posts are saving well below your median. Not a ban — but try a different angle before spending a batch on it.`,
            confidence: conf(arr.length),
          });
        }
      }
    }
  }

  // ── Comments to turn into Reply Reels ────────────────────────────
  const hotQ = questions
    .filter((q) => q.status === "open")
    .sort((a, b) => b.frequency - a.frequency)[0];
  if (hotQ) {
    recs.push({
      id: `c2r-${hotQ.id}`,
      kind: "comment_to_reel",
      title: `Answer: "${hotQ.text.slice(0, 60)}${hotQ.text.length > 60 ? "…" : ""}"`,
      reason:
        hotQ.frequency > 1
          ? `This has come up ${hotQ.frequency} times. Repeated questions are the clearest signal of what the community actually wants — make a Reply Reel.`
          : `A real question from the community. Turn it into a short Reply Reel and close the loop.`,
      confidence: hotQ.frequency > 1 ? "high" : "medium",
      refId: hotQ.id,
    });
  }

  // ── Posts that deserve a second part (no follow-up yet, strong saves) ──
  if (saveMedian != null) {
    const strongNoFollowup = content.find(
      (c) => c.postedAt && !content.some((x) => x.followUpOfId === c.id) &&
        (metrics.find((m) => m.contentId === c.id)?.saves ?? 0) >= saveMedian * 1.25,
    );
    if (strongNoFollowup) {
      recs.push({
        id: `second-${strongNoFollowup.id}`,
        kind: "second_part",
        title: `Make a part two of "${strongNoFollowup.title}"`,
        reason: `It performed above your median and has no follow-up yet. Ride the interest while it's warm.`,
        confidence: "medium",
        refId: strongNoFollowup.id,
      });
    }
  }

  // ── Missing highlights ───────────────────────────────────────────
  const postedNoHighlight = content.filter((c) => c.postedAt && !c.highlight).length;
  if (postedNoHighlight >= 3) {
    recs.push({
      id: "highlight-missing",
      kind: "highlight",
      title: `Save ${postedNoHighlight} posted Reels to Highlights`,
      reason: `${postedNoHighlight} posted Reels have no Highlight destination. Highlights are your evergreen lesson shelf for new profile visitors.`,
      confidence: "medium",
    });
  }

  // ── Quiet-week / capacity-aware simplify ─────────────────────────
  if (input.capacityMinutes > 0 && input.capacityMinutes <= 20) {
    const heavy = content.find((c) => !c.postedAt && (c.reelSeconds ?? 0) > 15 && c.status !== "Skipped");
    if (heavy) {
      recs.push({
        id: `simplify-${heavy.id}`,
        kind: "simplify",
        title: `Simplify "${heavy.title}" to 7–10 seconds`,
        reason: `You've got about ${input.capacityMinutes} minutes today. Cut this to one idea and ship it rather than skip it.`,
        confidence: "medium",
        refId: heavy.id,
      });
    }
  }

  return recs;
}

// The single "next best action" — the top recommendation weighted by urgency.
export function nextBestAction(recs: Recommendation[]): Recommendation | null {
  const order: Recommendation["kind"][] = ["next_best_action", "comment_to_reel", "repeat", "pillar", "second_part", "highlight"];
  const sorted = [...recs].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  return sorted[0] ?? null;
}
