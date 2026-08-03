import { describe, it, expect } from "vitest";
import { computeInsights, showedUp, gridDays, HABIT_TAGS, type HabitLogLite } from "@/lib/consistency";

const day = (i: number) => new Date(Date.UTC(2026, 6, 1 + i)).toISOString().slice(0, 10); // 2026-07-01 + i

function log(i: number, tags: string[], energy: number | null): HabitLogLite {
  return { day: day(i), tags, energy };
}

describe("consistency insights", () => {
  it("reports nothing on sparse data (never invents a pattern)", () => {
    const logs = [log(0, ["good_fats"], 4), log(1, [], 2), log(2, ["good_fats"], 5)];
    expect(computeInsights(logs)).toEqual([]);
  });

  it("finds a 2-day lookback pattern when both groups clear the bar", () => {
    const logs: HabitLogLite[] = [];
    // 5 "good fats" days each followed next day by high energy
    for (let i = 0; i < 5; i++) {
      logs.push(log(i * 4, ["good_fats"], null));
      logs.push(log(i * 4 + 1, [], 5));
    }
    // 5 plain low-energy days far from any good_fats day
    for (let i = 0; i < 5; i++) logs.push(log(40 + i * 3, [], 2));
    const insights = computeInsights(logs);
    const hit = insights.find((x) => x.tag === "good_fats" && x.kind === "lookback");
    expect(hit).toBeTruthy();
    expect(hit!.withAvg).toBeGreaterThan(hit!.withoutAvg);
    expect(hit!.withN).toBeGreaterThanOrEqual(4);
    expect(hit!.withoutN).toBeGreaterThanOrEqual(4);
  });

  it("stays silent when the difference is too small to mean anything", () => {
    const logs: HabitLogLite[] = [];
    for (let i = 0; i < 5; i++) {
      logs.push(log(i * 4, ["water"], null));
      logs.push(log(i * 4 + 1, [], 3));
    }
    for (let i = 0; i < 5; i++) logs.push(log(40 + i * 3, [], 3));
    expect(computeInsights(logs).filter((x) => x.tag === "water")).toEqual([]);
  });

  it("finds the game-day pattern: good fats two days before game day", () => {
    const logs: HabitLogLite[] = [];
    // 3 games with good_fats 2 days before → energy 5
    for (let i = 0; i < 3; i++) {
      const base = i * 10;
      logs.push(log(base, ["good_fats"], null));
      logs.push(log(base + 2, ["game"], 5));
    }
    // 3 games without → energy 2
    for (let i = 0; i < 3; i++) logs.push(log(50 + i * 10, ["game"], 2));
    const insights = computeInsights(logs);
    const hit = insights.find((x) => x.tag === "good_fats" && x.kind === "gameday");
    expect(hit).toBeTruthy();
    expect(hit!.text).toContain("Game days");
    // game-day findings sort first
    expect(insights[0].kind).toBe("gameday");
  });

  it("does not count the day itself as its own lookback", () => {
    // tag + energy on the SAME day only — lookback window is days 1..2 before,
    // so this must not produce a "with" group.
    const logs: HabitLogLite[] = [];
    for (let i = 0; i < 6; i++) logs.push(log(i * 4, ["sleep"], 5));
    for (let i = 0; i < 6; i++) logs.push(log(40 + i * 3, [], 2));
    expect(computeInsights(logs).filter((x) => x.tag === "sleep")).toEqual([]);
  });
});

describe("showedUp", () => {
  it("counts logged days in the window, positively framed", () => {
    const logs = [log(27, ["water"], null), log(26, [], 3), log(0, ["water"], 4)];
    const r = showedUp(logs, day(27), 28);
    expect(r).toEqual({ days: 3, window: 28 });
  });

  it("ignores empty logs and days outside the window", () => {
    const logs = [log(27, [], null), log(-5, ["water"], 4)];
    expect(showedUp(logs, day(27), 28).days).toBe(0);
  });
});

describe("gridDays", () => {
  it("returns exactly the window, oldest first, today last", () => {
    const g = gridDays([log(27, ["water"], 4)], day(27), 28);
    expect(g).toHaveLength(28);
    expect(g[0].day).toBe(day(0));
    expect(g[27]).toMatchObject({ day: day(27), energy: 4, tagged: true });
  });
});

describe("tag set", () => {
  it("has unique ids and includes the game-day tag", () => {
    const ids = HABIT_TAGS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("game");
    expect(ids).toContain("good_fats");
  });
});
