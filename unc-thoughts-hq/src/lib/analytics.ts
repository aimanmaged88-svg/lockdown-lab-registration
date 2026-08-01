// Safe analytics maths. Every rate guards against divide-by-zero and returns
// null (not 0, not NaN) when the denominator is missing, so the UI can show
// "—" honestly rather than a fabricated figure.

export type Snapshot = {
  views?: number | null;
  reach?: number | null;
  plays?: number | null;
  avgWatchSec?: number | null;
  reelSeconds?: number | null;
  completionPct?: number | null;
  likes?: number | null;
  comments?: number | null;
  saves?: number | null;
  shares?: number | null;
  profileVisits?: number | null;
  follows?: number | null;
};

const div = (a?: number | null, b?: number | null): number | null => {
  if (a == null || b == null || b === 0) return null;
  return a / b;
};

export function engagementRateByReach(s: Snapshot): number | null {
  const eng = (s.likes ?? 0) + (s.comments ?? 0) + (s.saves ?? 0) + (s.shares ?? 0);
  const r = div(eng, s.reach);
  return r == null ? null : r * 100;
}

export function saveRate(s: Snapshot): number | null {
  const r = div(s.saves, s.reach ?? s.views);
  return r == null ? null : r * 100;
}

export function shareRate(s: Snapshot): number | null {
  const r = div(s.shares, s.reach ?? s.views);
  return r == null ? null : r * 100;
}

export function commentRate(s: Snapshot): number | null {
  const r = div(s.comments, s.reach ?? s.views);
  return r == null ? null : r * 100;
}

export function followConversion(s: Snapshot): number | null {
  // follows per profile visit, then per reach as fallback
  const r = div(s.follows, s.profileVisits ?? s.reach);
  return r == null ? null : r * 100;
}

export function averageRetention(s: Snapshot): number | null {
  if (s.completionPct != null) return s.completionPct;
  const r = div(s.avgWatchSec, s.reelSeconds);
  return r == null ? null : Math.min(100, r * 100);
}

// Minimum sample size before we call anything a pattern. Honest confidence.
export const MIN_SAMPLE = 3;

export type Confidence = "low" | "medium" | "high";

export function confidenceFromSample(n: number): Confidence {
  if (n >= 6) return "high";
  if (n >= MIN_SAMPLE) return "medium";
  return "low";
}

export function median(values: number[]): number | null {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (v.length === 0) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

// Compare a value to a recent median. Returns a plain-language verdict and
// guards against calling a winner on too few data points.
export function vsMedian(
  value: number | null,
  peers: number[],
): { verdict: string; delta: number | null; confidence: Confidence; enough: boolean } {
  const enough = peers.length >= MIN_SAMPLE;
  const m = median(peers);
  if (value == null || m == null || m === 0) {
    return { verdict: "Not enough data yet", delta: null, confidence: "low", enough };
  }
  const delta = ((value - m) / m) * 100;
  const confidence = confidenceFromSample(peers.length);
  let verdict: string;
  if (!enough) verdict = "Too early to call — need more posts";
  else if (delta >= 25) verdict = "Well above your recent median";
  else if (delta >= 8) verdict = "Above your recent median";
  else if (delta <= -25) verdict = "Well below your recent median";
  else if (delta <= -8) verdict = "Below your recent median";
  else verdict = "About your recent median";
  return { verdict, delta, confidence, enough };
}

export function pct(n: number | null, digits = 1): string {
  return n == null ? "—" : `${n.toFixed(digits)}%`;
}
