import { describe, it, expect } from "vitest";
import {
  engagementRateByReach, saveRate, averageRetention, followConversion,
  median, vsMedian, confidenceFromSample, MIN_SAMPLE,
} from "@/lib/analytics";

describe("analytics — safe maths", () => {
  it("returns null (not NaN/0) when the denominator is missing", () => {
    expect(engagementRateByReach({ likes: 10 })).toBeNull();
    expect(saveRate({ saves: 5 })).toBeNull();
    expect(followConversion({ follows: 2 })).toBeNull();
  });

  it("never divides by zero", () => {
    expect(engagementRateByReach({ reach: 0, likes: 5 })).toBeNull();
    expect(saveRate({ reach: 0, saves: 5 })).toBeNull();
  });

  it("computes engagement rate by reach as a percentage", () => {
    const er = engagementRateByReach({ reach: 100, likes: 5, comments: 3, saves: 2, shares: 0 });
    expect(er).toBeCloseTo(10);
  });

  it("computes retention from completion or watch/length", () => {
    expect(averageRetention({ completionPct: 62 })).toBe(62);
    expect(averageRetention({ avgWatchSec: 7, reelSeconds: 10 })).toBeCloseTo(70);
    expect(averageRetention({ avgWatchSec: 20, reelSeconds: 10 })).toBe(100); // capped
  });

  it("median handles even/odd/empty", () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("maps sample size to honest confidence", () => {
    expect(confidenceFromSample(1)).toBe("low");
    expect(confidenceFromSample(MIN_SAMPLE)).toBe("medium");
    expect(confidenceFromSample(6)).toBe("high");
  });
});

describe("vsMedian — never call a winner on one post", () => {
  it("flags too-early with fewer than the minimum sample", () => {
    const r = vsMedian(100, [10, 20]); // only 2 peers
    expect(r.enough).toBe(false);
    expect(r.verdict).toMatch(/too early|not enough/i);
  });

  it("labels above/below median with enough data", () => {
    const above = vsMedian(200, [80, 100, 120, 90, 110, 100]);
    expect(above.enough).toBe(true);
    expect(above.verdict).toMatch(/above/i);
    const below = vsMedian(40, [80, 100, 120, 90, 110, 100]);
    expect(below.verdict).toMatch(/below/i);
  });
});
