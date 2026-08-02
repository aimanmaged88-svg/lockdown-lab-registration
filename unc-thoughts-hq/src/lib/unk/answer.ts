import { assess, escalationMessage, redirectMessage, needsGuardianNote, GUARDIAN_NOTE, PRIVACY_LINE } from "./safety";
import { bandFromText, bandFromDuration, BAND_LABEL, type TimeBand } from "./timeband";
import { detectIntent, rank, parseSections, type BrainItem, type Intent } from "./knowledge";

// Composes the member-facing Ask Unk answer. Pure function over the approved
// knowledge items — nothing here invents advice: every content sentence comes
// from an approved KnowledgeItem, or the answer honestly says the Brain
// doesn't cover it yet.

export type UnkAnswer = {
  mode: "answer" | "escalate" | "redirect" | "unsupported";
  intent: Intent;
  band: TimeBand | null;
  bandLabel: string | null;
  timeNote: string | null; // e.g. "Assuming 7:30 pm — if it's a morning game, say 7:30 am."
  headline: string;
  sections: { doNow?: string; food?: string; mindset?: string; careful?: string; privateQ?: string };
  bullets: string[]; // escalation/redirect body lines
  why: string | null;
  guardianNote: string | null;
  privacyLine: string;
  usedItems: Array<{ id: string; title: string; source: string | null; sourceUrl: string | null }>;
  escalated: boolean;
  supported: boolean;
};

export type ComposeInput = {
  question: string;
  items: BrainItem[]; // approved items only (caller guarantees)
  youth: boolean;
  now?: Date;
  eventMinutesOverride?: number | null; // from explicit flow inputs (minutes until event)
};

export function compose(input: ComposeInput): UnkAnswer {
  const { question, items, youth } = input;
  const intent = detectIntent(question);

  // 1) Safety gate first — escalations and redirects never reach retrieval.
  const safety = assess(question);
  if (safety.kind === "escalate") {
    const msg = escalationMessage(safety.topic, safety.emergency, youth);
    return {
      mode: "escalate", intent, band: null, bandLabel: null, timeNote: null,
      headline: msg.headline, sections: {}, bullets: msg.body, why: null,
      guardianNote: youth ? GUARDIAN_NOTE : null, privacyLine: PRIVACY_LINE,
      usedItems: [], escalated: true, supported: true,
    };
  }
  if (safety.kind === "redirect") {
    const msg = redirectMessage(safety.topic, youth);
    return {
      mode: "redirect", intent, band: null, bandLabel: null, timeNote: null,
      headline: msg.headline, sections: {}, bullets: msg.body, why: null,
      guardianNote: youth ? GUARDIAN_NOTE : null, privacyLine: PRIVACY_LINE,
      usedItems: [], escalated: false, supported: true,
    };
  }

  // 2) Time awareness — explicit override (flows) beats free-text parsing.
  let band: TimeBand | null = null;
  let timeNote: string | null = null;
  if (input.eventMinutesOverride != null) {
    const m = input.eventMinutesOverride;
    band = m <= 0 ? "after" : m < 30 ? "<30m" : m < 60 ? "30-60m" : m < 120 ? "1-2h" : m < 180 ? "2-3h" : "3h+";
  } else {
    const t = bandFromText(question, input.now);
    if (t && (intent === "game_day" || intent === "training_before" || intent === "nutrition" || intent === "recovery")) {
      band = t.band;
      if (t.parsed.assumedPm) timeNote = `Assuming ${t.parsed.display} — if it's a morning session, tell Unk "${t.parsed.display.replace("pm", "am")}".`;
    } else {
      const d = bandFromDuration(question);
      if (d) band = d;
    }
  }

  // 3) Retrieval over approved items only.
  const ranked = rank(items, question, intent, band);
  const top = ranked[0];
  const MIN_SCORE = 8;

  if (!top || top.score < MIN_SCORE) {
    // Honest miss — never invent, especially for food/health.
    return {
      mode: "unsupported", intent, band, bandLabel: band ? BAND_LABEL[band] : null, timeNote,
      headline: "Unk's Brain doesn't cover that one yet.",
      sections: {},
      bullets: [
        "Rather than guess, Unk won't make something up.",
        "Try rephrasing (say what the session is and when), or ask one of the quick buttons on the home screen.",
        "This question has been flagged so UNC can add proper teaching for it.",
      ],
      why: null,
      guardianNote: youth && intent === "nutrition" ? GUARDIAN_NOTE : null,
      privacyLine: PRIVACY_LINE,
      usedItems: [], escalated: false, supported: false,
    };
  }

  const primary = parseSections(top.item.body);
  const used: BrainItem[] = [top.item];

  // Fill gaps in the primary playbook from the next-best relevant items.
  const need = (k: keyof typeof primary) => !primary[k];
  for (const r of ranked.slice(1, 5)) {
    if (used.length >= 3) break;
    const s = parseSections(r.item.body);
    let contributed = false;
    for (const k of ["doNow", "food", "mindset", "careful", "privateQ", "why"] as const) {
      if (need(k) && s[k]) {
        primary[k] = s[k];
        contributed = true;
      }
    }
    if (contributed) used.push(r.item);
  }

  const guardian = needsGuardianNote(youth, { nutrition: !!primary.food || intent === "nutrition", sensitive: top.item.safetyClass === "youth_sensitive" })
    ? GUARDIAN_NOTE
    : null;

  return {
    mode: "answer",
    intent,
    band,
    bandLabel: band ? BAND_LABEL[band] : null,
    timeNote,
    headline: top.item.title,
    sections: {
      doNow: primary.doNow,
      food: primary.food,
      mindset: primary.mindset,
      careful: primary.careful,
      privateQ: primary.privateQ,
    },
    bullets: [],
    why: primary.why ?? null,
    guardianNote: guardian,
    privacyLine: PRIVACY_LINE,
    usedItems: used.map((u) => ({ id: u.id, title: u.title, source: u.source, sourceUrl: u.sourceUrl })),
    escalated: false,
    supported: true,
  };
}
