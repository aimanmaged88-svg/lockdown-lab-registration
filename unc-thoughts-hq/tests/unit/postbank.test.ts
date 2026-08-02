import { describe, it, expect } from "vitest";
import { generateDrafts, type BankInput } from "@/lib/postbank";
import { BANNED_OPENINGS } from "@/lib/enums";
import type { BrainItem } from "@/lib/unk/knowledge";

const ITEMS: BrainItem[] = [
  {
    id: "m1", kind: "lesson", title: "Standards beat moods", pillar: "Mindset", audience: "General",
    body: "MINDSET: A standard is what you do on the days you don't feel like it.\nPRIVATE: What's one standard you hold on your worst day?\nWHY: Moods are weather; standards are climate.",
    tags: [], source: null, sourceUrl: null, safetyClass: "general",
  },
  {
    id: "p1", kind: "playbook", title: "Game day — 1–2 hours out", pillar: "Nutrition", audience: "General",
    body: "DO NOW: Light snack, lay out gear.\nFOOD: Banana or toast, water.\nMINDSET: Calm is a skill.\nCAREFUL: No big meals now.\nPRIVATE: What's your first-two-minutes focus?\nWHY: Light carbs.",
    tags: ["intent:game_day", "band:1-2h"], source: "AIS", sourceUrl: "https://www.ais.gov.au/nutrition", safetyClass: "nutrition",
  },
  {
    id: "f1", kind: "faq", title: "Water — the unglamorous edge", pillar: "Nutrition", audience: "General",
    body: "DO NOW: Fill a bottle.\nCAREFUL: Energy drinks are a no for juniors.\nPRIVATE: Where's your bottle right now?\nWHY: Mild dehydration drags.",
    tags: [], source: "AIS", sourceUrl: "https://www.ais.gov.au/nutrition", safetyClass: "nutrition",
  },
];

function input(over: Partial<BankInput> = {}): BankInput {
  return {
    items: ITEMS,
    questions: [{ text: "What should my kid eat before a Saturday game?", pillar: "Nutrition" }],
    avoidTitles: [],
    seed: 42,
    ...over,
  };
}

describe("post bank generator", () => {
  it("produces the requested number of complete drafts", () => {
    const drafts = generateDrafts(input(), 5);
    expect(drafts).toHaveLength(5);
    for (const d of drafts) {
      expect(d.caption.length).toBeGreaterThan(20);
      expect(d.question).toContain("?"); // every draft carries one real question
      expect(d.card.headline.length).toBeGreaterThan(3);
    }
  });

  it("is deterministic for a seed and varies across seeds", () => {
    const a = generateDrafts(input(), 5).map((d) => d.title);
    const b = generateDrafts(input(), 5).map((d) => d.title);
    const c = generateDrafts(input({ seed: 999 }), 5).map((d) => d.title);
    expect(a).toEqual(b);
    expect(c.join()).not.toEqual(a.join());
  });

  it("never opens with the banned generic lines", () => {
    for (const seed of [1, 7, 42, 1234]) {
      for (const d of generateDrafts(input({ seed }), 5)) {
        const lower = d.caption.toLowerCase();
        for (const banned of BANNED_OPENINGS) expect(lower.startsWith(banned)).toBe(false);
      }
    }
  });

  it("avoids recently used titles", () => {
    const first = generateDrafts(input(), 5);
    const again = generateDrafts(input({ avoidTitles: first.map((d) => d.title) }), 5);
    const overlap = again.filter((d) => first.some((f) => f.title === d.title));
    expect(overlap).toHaveLength(0);
  });

  it("builds answer posts from real community questions", () => {
    // scan several seeds — the mix is random per seed
    const all = [1, 2, 3, 4, 5].flatMap((seed) => generateDrafts(input({ seed }), 5));
    const answers = all.filter((d) => d.kind === "answer_post");
    expect(answers.length).toBeGreaterThan(0);
    expect(answers[0].caption).toContain("What should my kid eat");
  });

  it("never promises shortcuts in myth-busts", () => {
    const all = [1, 2, 3].flatMap((seed) => generateDrafts(input({ seed }), 8));
    for (const d of all.filter((x) => x.kind === "myth_bust")) {
      expect(d.caption.toLowerCase()).not.toMatch(/guaranteed (energy|results|performance)/);
      expect(d.caption).toMatch(/Truth:/);
    }
  });
});
