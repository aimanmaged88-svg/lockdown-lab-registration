import { parseSections, type BrainItem } from "./unk/knowledge";
import { BANNED_OPENINGS } from "./enums";

// The Post Bank: turns approved Unk's Brain teaching + real community
// questions into ready-to-post WORD posts (caption + one real question +
// optional quote-card text). Pure + seeded so "shuffle" gives fresh combos and
// tests are deterministic. No AI required — this is his own teaching,
// recombined in his own voice.

export type Draft = {
  kind: "one_liner" | "answer_post" | "three_rules" | "myth_bust" | "ask_squad";
  kindLabel: string;
  pillar: string;
  title: string;      // internal name for the content record
  card: { headline: string; sub?: string };
  caption: string;    // ready-to-paste IG caption
  question: string;   // the one real question
  sourceTitles: string[];
};

export type BankInput = {
  items: BrainItem[]; // approved only
  questions: Array<{ text: string; pillar: string | null }>;
  avoidTitles: string[]; // recent content titles to avoid repeating
  seed: number;
};

// Deterministic PRNG (mulberry32) — same seed, same drafts.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)];

const firstSentence = (s: string) => s.split(/\n/)[0].split(/(?<=[.!?])\s/)[0].trim();
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

const CLOSERS = [
  "That's it. That's the post.",
  "Simple isn't easy. But it is simple.",
  "No shortcuts in this one. Sorry.",
  "Old advice. Still undefeated.",
  "Write it on your shoe if you have to.",
];

const AMPLIFIERS = [
  "Read it twice.",
  "Most players skip this. Don't be most players.",
  "This one's for the honest ones.",
  "Screenshot it for game day.",
  "Send this to a teammate who needs it.",
];

function tidyQuestion(q?: string): string {
  const fallback = "What's your version of this? Real answers only.";
  if (!q) return fallback;
  const s = clean(q);
  return s.endsWith("?") ? s : `${s}?`;
}

export function generateDrafts(input: BankInput, count = 5): Draft[] {
  const r = rng(input.seed);
  const avoid = new Set(input.avoidTitles.map((t) => t.toLowerCase()));
  const drafts: Draft[] = [];

  const mindset = input.items.filter((i) => i.pillar === "Mindset" && (i.kind === "lesson" || i.kind === "playbook"));
  const playbooks = input.items.filter((i) => i.kind === "playbook");
  const nutrition = input.items.filter((i) => i.pillar === "Nutrition" && i.kind !== "source_link");
  const faqs = input.items.filter((i) => i.kind === "faq" || i.kind === "teaching_note");

  const makers: Array<() => Draft | null> = [
    // 1 · UNC Thought — one strong line, card-first.
    () => {
      if (!mindset.length) return null;
      const item = pick(r, mindset);
      const s = parseSections(item.body);
      const line = clean(firstSentence(s.mindset ?? item.title));
      return {
        kind: "one_liner", kindLabel: "UNC Thought (text card)", pillar: "Mindset",
        title: `Text: ${line.slice(0, 50)}`,
        card: { headline: line },
        caption: `${line}\n\n${pick(r, AMPLIFIERS)}`,
        question: tidyQuestion(s.privateQ),
        sourceTitles: [item.title],
      };
    },
    // 2 · Real question, straight answer.
    () => {
      if (!input.questions.length || !playbooks.length) return null;
      const q = pick(r, input.questions);
      const pool = playbooks.filter((p) => !q.pillar || p.pillar === q.pillar);
      const item = pool.length ? pick(r, pool) : pick(r, playbooks);
      const s = parseSections(item.body);
      const answer = clean(firstSentence(s.food ?? s.doNow ?? item.title));
      return {
        kind: "answer_post", kindLabel: "Question answered", pillar: q.pillar ?? item.pillar,
        title: `Answer: ${q.text.slice(0, 45)}`,
        card: { headline: `“${clean(q.text)}”`, sub: "Straight answer below 👇" },
        caption: `Got asked this: “${clean(q.text)}”\n\nStraight answer: ${answer}\n\n${pick(r, CLOSERS)}`,
        question: "What would you add from your own experience?",
        sourceTitles: [item.title],
      };
    },
    // 3 · Three rules — condensed from a playbook.
    () => {
      if (!playbooks.length) return null;
      const item = pick(r, playbooks);
      const s = parseSections(item.body);
      const rules = [s.doNow, s.food ?? s.careful, s.mindset]
        .filter(Boolean)
        .map((x) => clean(firstSentence(x!)))
        .slice(0, 3);
      if (rules.length < 3) return null;
      return {
        kind: "three_rules", kindLabel: "Three rules", pillar: item.pillar,
        title: `3 rules: ${item.title.slice(0, 42)}`,
        card: { headline: item.title.replace(/—.*/, "").trim(), sub: rules.map((x, i) => `${i + 1}. ${x}`).join("\n") },
        caption: `${item.title.replace(/—.*/, "").trim()} — three rules:\n\n1. ${rules[0]}\n2. ${rules[1]}\n3. ${rules[2]}\n\n${pick(r, AMPLIFIERS)}`,
        question: tidyQuestion(s.privateQ),
        sourceTitles: [item.title],
      };
    },
    // 4 · Myth bust — the no-shortcut truths.
    () => {
      const myths = [
        { myth: "Something you eat right before the game gives you instant energy.", truth: "Nothing does. The fuel that shows up tonight went in hours ago. Familiar food, water, warm-up — that's the whole trick.", pillar: "Nutrition" },
        { myth: "Big talents don't need boring preparation.", truth: "The best players are the most boring preparers you'll ever meet. That's the connection nobody posts about.", pillar: "Mindset" },
        { myth: "A bad first quarter means a bad game.", truth: "It means a bad first quarter. The next play doesn't know what happened in the last one — unless you keep introducing them.", pillar: "Mindset" },
        { myth: "Supplements are the missing piece for a junior athlete.", truth: "Food, fluids, sleep and training are the piece. That's the AIS position too — no supplements for juniors, full stop.", pillar: "Nutrition" },
        { myth: "New game-day food is worth a try if it's 'healthy'.", truth: "Game day is the worst day of the week to experiment. Test it on a Tuesday. Play on what your body already knows.", pillar: "Nutrition" },
      ];
      const m = pick(r, myths);
      const src = faqs.length ? pick(r, faqs) : null;
      return {
        kind: "myth_bust", kindLabel: "Myth bust", pillar: m.pillar,
        title: `Myth: ${m.myth.slice(0, 45)}`,
        card: { headline: "MYTH:", sub: m.myth },
        caption: `Myth: ${m.myth}\n\nTruth: ${m.truth}\n\n${pick(r, CLOSERS)}`,
        question: "Which myth did you believe the longest? Be honest.",
        sourceTitles: src ? [src.title] : [],
      };
    },
    // 5 · Ask the squad — question-only engagement post.
    () => {
      const pools: string[] = [];
      for (const i of [...mindset, ...nutrition, ...playbooks]) {
        const q = parseSections(i.body).privateQ;
        if (q) pools.push(clean(q));
      }
      if (!pools.length) return null;
      const q = pick(r, pools);
      return {
        kind: "ask_squad", kindLabel: "Ask the squad", pillar: "Community",
        title: `Ask: ${q.slice(0, 48)}`,
        card: { headline: tidyQuestion(q), sub: "Answers in the comments. Real ones." },
        caption: `Quick one for the squad:\n\n${tidyQuestion(q)}\n\nNo perfect answers. Just real ones.`,
        question: tidyQuestion(q),
        sourceTitles: [],
      };
    },
  ];

  let guard = 0;
  while (drafts.length < count && guard < count * 8) {
    guard++;
    const make = makers[(drafts.length + Math.floor(r() * makers.length)) % makers.length];
    const d = make();
    if (!d) continue;
    if (avoid.has(d.title.toLowerCase())) continue;
    if (drafts.some((x) => x.title === d.title)) continue;
    // Voice guardrails: never open like everyone else.
    const lower = d.caption.toLowerCase();
    if (BANNED_OPENINGS.some((b) => lower.startsWith(b))) continue;
    drafts.push(d);
  }
  return drafts;
}
