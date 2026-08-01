import { describe, it, expect } from "vitest";
import { lintNutrition, containsRestricted } from "@/lib/nutrition-safety";

describe("nutrition safety linter", () => {
  it("flags restrictive food language", () => {
    const flags = lintNutrition("Never eat carbs before a game");
    expect(flags.some((f) => f.category === "Restrictive food language")).toBe(true);
  });

  it("flags weight-loss targeting", () => {
    const flags = lintNutrition("This drill helps you lose weight fast");
    expect(flags.some((f) => f.category === "Weight-loss targeting")).toBe(true);
  });

  it("flags guaranteed performance claims", () => {
    const flags = lintNutrition("This will guaranteed make you jump higher");
    expect(flags.some((f) => f.category === "Guaranteed performance claim")).toBe(true);
  });

  it("flags food shame language", () => {
    const flags = lintNutrition("Feel guilty about that meal? Burn it off.");
    expect(flags.some((f) => f.category === "Food shame")).toBe(true);
  });

  it("passes neutral, general education language", () => {
    const flags = lintNutrition("A simple game-day plate has colour, carbs and protein. Drink water.");
    expect(flags.length).toBe(0);
  });

  it("every flag carries a safer suggestion", () => {
    const flags = lintNutrition("cut out sugar, it's a bad food");
    expect(flags.length).toBeGreaterThan(0);
    for (const f of flags) expect(f.suggestion.length).toBeGreaterThan(0);
  });

  it("detects restricted community terms", () => {
    expect(containsRestricted("check this http://spam.example")).toContain("http://");
    expect(containsRestricted("a normal useful comment")).toHaveLength(0);
  });
});
