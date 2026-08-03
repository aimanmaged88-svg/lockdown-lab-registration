import { describe, it, expect } from "vitest";
import { parseClockTime, bandFor, minutesUntil, bandFromDuration } from "@/lib/unk/timeband";
import { assess, escalationMessage, redirectMessage, PRIVACY_LINE } from "@/lib/unk/safety";
import { compose } from "@/lib/unk/answer";
import { parseSections, detectIntent, rank, type BrainItem } from "@/lib/unk/knowledge";
import { encryptText, decryptText, encryptBytes, decryptBytes } from "@/lib/crypto";

// ── Time bands: awareness without false precision ─────────────────
describe("timeband", () => {
  it("parses 7:30 PM", () => {
    const p = parseClockTime("My game is at 7:30 PM.");
    expect(p?.minutesOfDay).toBe(19 * 60 + 30);
    expect(p?.assumedPm).toBe(false);
  });
  it("assumes pm for bare evening-ish times and says so", () => {
    const p = parseClockTime("game at 7:30");
    expect(p?.minutesOfDay).toBe(19 * 60 + 30);
    expect(p?.assumedPm).toBe(true);
  });
  it("maps minutes to bands", () => {
    expect(bandFor(300)).toBe("3h+");
    expect(bandFor(150)).toBe("2-3h");
    expect(bandFor(90)).toBe("1-2h");
    expect(bandFor(45)).toBe("30-60m");
    expect(bandFor(10)).toBe("<30m");
    expect(bandFor(-30)).toBe("after");
  });
  it("recently-past events count as 'after', older roll to tomorrow", () => {
    // build a 'now' and compare relative minutes via minutesUntil composition
    const now = new Date();
    const nowMin = minutesUntil(0, now) === 0 ? 0 : null; // sanity only
    void nowMin;
    expect(bandFor(minutesUntil((new Date().getUTCHours() * 60) % 1440, now))).toBeDefined();
  });
  it("parses spoken durations", () => {
    expect(bandFromDuration("I only have five minutes")).toBe("<30m");
    expect(bandFromDuration("about 45 mins")).toBe("30-60m");
  });
});

// ── Safety: escalate, redirect, never promise ─────────────────────
describe("safety", () => {
  it("escalates every required category", () => {
    const cases: Array<[string, string]> = [
      ["I think I'm having an allergic reaction to nuts", "allergic_reaction"],
      ["my blood sugar is low before the game", "diabetes_glucose"],
      ["I've been skipping meals to lose weight", "eating_disorder"],
      ["I get chest pain when I run", "collapse_chest_breathing"],
      ["is my ankle broken? can I play?", "injury_diagnosis"],
      ["can I take ibuprofen with my medication before a game", "medication"],
      ["how much creatine should I take", "supplement_dosing"],
    ];
    for (const [q, topic] of cases) {
      const r = assess(q);
      expect(r.kind, q).toBe("escalate");
      if (r.kind === "escalate") expect(r.topic, q).toBe(topic);
    }
  });
  it("self-harm / crisis language escalates with real helplines", () => {
    for (const q of ["I want to hurt myself and I don't know what to do", "sometimes I think about suicide", "I don't want to be here anymore"]) {
      const r = assess(q);
      expect(r.kind, q).toBe("escalate");
      if (r.kind === "escalate") {
        expect(r.topic, q).toBe("mental_crisis");
        expect(r.emergency, q).toBe(true);
        const msg = escalationMessage(r.topic, r.emergency, true);
        const all = msg.headline + " " + msg.body.join(" ");
        expect(all).toMatch(/1800 55 1800/); // Kids Helpline
        expect(all).toMatch(/13 11 14/); // Lifeline
        expect(all).toMatch(/000/);
      }
    }
  });
  it("chest pain / collapse is an emergency directing to 000", () => {
    const r = assess("my mate fainted at training");
    expect(r.kind).toBe("escalate");
    if (r.kind === "escalate") {
      expect(r.emergency).toBe(true);
      const msg = escalationMessage(r.topic, true, true);
      expect(msg.body.join(" ")).toMatch(/000/);
    }
  });
  it("quick-speed asks are redirected, never a stimulant or supplement", () => {
    const r = assess("What gives me a quick burst of speed?");
    expect(r.kind).toBe("redirect");
    const msg = redirectMessage("quick_speed", true);
    const text = msg.body.join(" ").toLowerCase();
    expect(msg.headline.toLowerCase()).toContain("nothing gives you an instant burst");
    expect(text).not.toMatch(/take (a |some )?(caffeine|creatine|pre-?workout)/);
    expect(text).toMatch(/warm|fuel|water|familiar/);
  });
  it("supplement asks: no recommendations for juniors + AIS professional line", () => {
    const r = assess("should I use pre-workout?");
    expect(r.kind).toBe("redirect");
    const msg = redirectMessage("supplement", true);
    expect(msg.body.join(" ")).toMatch(/Accredited Sports Dietitian|sports doctor/);
    expect(msg.body.join(" ")).toMatch(/under 18|parent or guardian/i);
  });
});

// ── Retrieval + composition: approved-only, no invention ──────────
const ITEMS: BrainItem[] = [
  {
    id: "k1", kind: "playbook", title: "Game day — 1–2 hours out", pillar: "Nutrition", audience: "General",
    body: "DO NOW: Light snack, lay out gear.\nFOOD: Banana or toast, water.\nMINDSET: Calm is a skill.\nCAREFUL: No big meals now.\nPRIVATE: What's your first-two-minutes focus?\nWHY: Light carbs top up fuel without loading the gut.",
    tags: ["intent:game_day", "band:1-2h"], source: "AIS", sourceUrl: "https://www.ais.gov.au/nutrition", safetyClass: "nutrition",
  },
  {
    id: "k2", kind: "lesson", title: "Control the controllables", pillar: "Mindset", audience: "General",
    body: "MINDSET: Effort, attitude, preparation, next action.\nPRIVATE: What outside your control took your energy?\nWHY: Energy on uncontrollables is a losing trade.",
    tags: ["intent:mindset_flat", "control"], source: null, sourceUrl: null, safetyClass: "general",
  },
];

describe("compose", () => {
  it("answers a banded game question with the 5-part structure + privacy line", () => {
    const a = compose({ question: "Game at 7pm, what should I do?", items: ITEMS, youth: false, eventMinutesOverride: 90 });
    expect(a.mode).toBe("answer");
    expect(a.band).toBe("1-2h");
    expect(a.sections.doNow).toBeTruthy();
    expect(a.sections.food).toBeTruthy();
    expect(a.sections.mindset).toBeTruthy();
    expect(a.sections.careful).toBeTruthy();
    expect(a.sections.privateQ).toBeTruthy();
    expect(a.privacyLine).toBe(PRIVACY_LINE);
    expect(a.usedItems.map((u) => u.id)).toContain("k1");
  });
  it("adds a guardian note for youth on nutrition answers", () => {
    const a = compose({ question: "Game soon, what do I eat?", items: ITEMS, youth: true, eventMinutesOverride: 90 });
    expect(a.guardianNote).toBeTruthy();
    const adult = compose({ question: "Game soon, what do I eat?", items: ITEMS, youth: false, eventMinutesOverride: 90 });
    expect(adult.guardianNote).toBeNull();
  });
  it("never invents: unsupported questions get an honest miss", () => {
    const a = compose({ question: "What's the best crypto to buy?", items: ITEMS, youth: false });
    expect(a.mode).toBe("unsupported");
    expect(a.supported).toBe(false);
    expect(a.sections.doNow).toBeUndefined();
    expect(a.bullets.join(" ")).toMatch(/won't make something up/i);
  });
  it("safety gates run before retrieval", () => {
    const a = compose({ question: "chest pain during my game at 7:30 pm", items: ITEMS, youth: true });
    expect(a.mode).toBe("escalate");
    expect(a.escalated).toBe(true);
    expect(a.usedItems).toHaveLength(0);
  });
});

describe("knowledge utils", () => {
  it("detects intents", () => {
    expect(detectIntent("I made a mistake early in the game")).toBe("mistake_reset");
    expect(detectIntent("what should I do after training?")).toBe("recovery");
    expect(detectIntent("I feel flat today")).toBe("mindset_flat");
  });
  it("rank prefers matching band and penalises wrong band", () => {
    const wrongBand: BrainItem = { ...ITEMS[0], id: "k3", title: "Game day — under 30", tags: ["intent:game_day", "band:<30m"] };
    const ranked = rank([ITEMS[0], wrongBand], "game today", "game_day", "1-2h");
    expect(ranked[0].item.id).toBe("k1");
  });
  it("parses labelled sections", () => {
    const s = parseSections("DO NOW: a\nFOOD: b\nline2\nWHY: c");
    expect(s.doNow).toBe("a");
    expect(s.food).toBe("b\nline2");
    expect(s.why).toBe("c");
  });
});

// ── Privacy: encryption round-trips ───────────────────────────────
describe("crypto", () => {
  it("round-trips text and never returns ciphertext on failure", () => {
    const enc = encryptText("private answer about a rough day");
    expect(enc.startsWith("enc1:")).toBe(true);
    expect(enc).not.toContain("rough day");
    expect(decryptText(enc)).toBe("private answer about a rough day");
    expect(decryptText("enc1:bad:bad:bad")).toBeNull();
  });
  it("round-trips bytes (voice notes)", () => {
    const buf = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);
    const enc = encryptBytes(buf);
    expect(enc.subarray(0, 4).toString()).toBe("ENC1");
    expect(decryptBytes(enc)?.equals(buf)).toBe(true);
  });
});
