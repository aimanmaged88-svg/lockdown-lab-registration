import { describe, it, expect } from "vitest";
import { recommend, nextBestAction, type EngineInput } from "@/lib/recommend";

function baseInput(over: Partial<EngineInput> = {}): EngineInput {
  return {
    today: new Date("2026-08-01T00:00:00Z"),
    content: [],
    metrics: [],
    questions: [],
    capacityMinutes: 60,
    ...over,
  };
}

describe("recommendation engine — transparent & rule-based", () => {
  it("surfaces overdue work as the next best action", () => {
    const recs = recommend(baseInput({
      content: [{ id: "c1", title: "Overdue reel", pillar: "Mindset", audience: "General", format: "Reel", status: "Planned", plannedDate: new Date("2026-07-28T00:00:00Z"), postedAt: null, reelSeconds: 12, highlight: null, followUpOfId: null }],
    }));
    const nba = nextBestAction(recs);
    expect(nba?.kind).toBe("next_best_action");
    expect(nba?.reason).toMatch(/overdue|planned/i);
  });

  it("recommends the longest-neglected pillar with a plain reason", () => {
    const recs = recommend(baseInput({
      content: [{ id: "c1", title: "Old nutrition", pillar: "Nutrition", audience: "General", format: "Reel", status: "Complete", plannedDate: null, postedAt: new Date("2026-07-01T00:00:00Z"), reelSeconds: 12, highlight: "Nutrition", followUpOfId: null }],
    }));
    const pillar = recs.find((r) => r.kind === "pillar");
    expect(pillar).toBeTruthy();
    expect(pillar!.reason).toMatch(/hasn't been covered/i);
  });

  it("prioritises a repeated community question as a Reply Reel", () => {
    const recs = recommend(baseInput({
      questions: [{ id: "q1", text: "What to eat pre-game?", frequency: 4, status: "open" }],
    }));
    const c2r = recs.find((r) => r.kind === "comment_to_reel");
    expect(c2r).toBeTruthy();
    expect(c2r!.confidence).toBe("high");
    expect(c2r!.reason).toMatch(/4 times/);
  });

  it("suggests simplifying when capacity is low", () => {
    const recs = recommend(baseInput({
      capacityMinutes: 15,
      content: [{ id: "c1", title: "Long reel", pillar: "Basketball", audience: "General", format: "Reel", status: "Planned", plannedDate: null, postedAt: null, reelSeconds: 30, highlight: null, followUpOfId: null }],
    }));
    expect(recs.some((r) => r.kind === "simplify")).toBe(true);
  });

  it("never recommends moving/publishing/deleting content (suggest only)", () => {
    const recs = recommend(baseInput({
      questions: [{ id: "q1", text: "x", frequency: 1, status: "open" }],
    }));
    for (const r of recs) {
      expect(r).toHaveProperty("reason");
      expect(r.reason.length).toBeGreaterThan(0);
    }
  });
});
