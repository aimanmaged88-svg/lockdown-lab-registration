import { describe, it, expect } from "vitest";
import { pickThought, currentSlot } from "@/lib/thought-slots";

const prompts = [
  { id: "a", text: "A", pillar: "Mindset", actions: "[]" },
  { id: "b", text: "B", pillar: "Basketball", actions: "[]" },
  { id: "c", text: "C", pillar: "Nutrition", actions: "[]" },
  { id: "d", text: "D", pillar: "Mindset", actions: "[]" },
];

describe("thought slots", () => {
  it("is deterministic for the same member/day/slot", () => {
    const now = new Date("2026-08-03T00:00:00Z");
    const p1 = pickThought(prompts, {}, "m1", "morning", now);
    const p2 = pickThought(prompts, {}, "m1", "morning", now);
    expect(p1?.id).toBe(p2?.id);
  });
  it("never repeats within the same day's slots", () => {
    const now = new Date("2026-08-03T00:00:00Z");
    const ids = (["morning", "afternoon", "evening"] as const).map((s) => pickThought(prompts, {}, "m1", s, now)?.id);
    expect(new Set(ids).size).toBe(3);
  });
  it("weights toward saved pillars", () => {
    const now = new Date("2026-08-03T00:00:00Z");
    // heavy Basketball affinity across many members → Basketball picked more often
    let hits = 0;
    for (let i = 0; i < 200; i++) {
      const p = pickThought(prompts, { Basketball: 5 }, `member-${i}`, "morning", now);
      if (p?.pillar === "Basketball") hits++;
    }
    // 1 Basketball prompt with weight 6 of (6+1+1+1)=9 tickets ≈ 67% vs unweighted 25%
    expect(hits).toBeGreaterThan(80);
  });
  it("empty bank returns null; slot labels sane", () => {
    expect(pickThought([], {}, "m", "morning")).toBeNull();
    expect(["Morning thought", "Afternoon thought", "Evening thought"]).toContain(currentSlot().label);
  });
});
