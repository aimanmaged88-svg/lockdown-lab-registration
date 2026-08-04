// Ask Unk safety layer. Runs BEFORE retrieval on every question.
// Three outcomes:
//   escalate  — do not answer; direct to the right human help.
//   redirect  — supplement / "quick speed" asks; answer with the approved
//               no-shortcut response instead of the question asked.
//   proceed   — normal answer (optionally with a guardian note for youth).
// This is general education, not personalised medical care. The app never
// promises instant speed, guaranteed energy/performance, injury treatment,
// rapid weight change, a diagnosis, or a supplement result.

export type SafetyOutcome =
  | { kind: "proceed" }
  | { kind: "redirect"; topic: "supplement" | "quick_speed" | "weight_change" }
  | { kind: "escalate"; topic: EscalationTopic; emergency: boolean };

export type EscalationTopic =
  | "mental_crisis"
  | "allergic_reaction"
  | "diabetes_glucose"
  | "eating_disorder"
  | "collapse_chest_breathing"
  | "severe_dehydration"
  | "injury_diagnosis"
  | "medication"
  | "supplement_dosing";

type Rule = { topic: EscalationTopic; emergency: boolean; test: RegExp };

// Order matters: emergencies first.
const ESCALATIONS: Rule[] = [
  { topic: "mental_crisis", emergency: true, test: /\b(kill (myself|me)|suicid\w*|self[- ]?harm|hurt(ing)? myself|end (it all|my life)|don'?t want to (live|be here|exist)|no reason to live|better off without me|cut(ting)? myself)\b/i },
  { topic: "collapse_chest_breathing", emergency: true, test: /\b(chest pain|can'?t breathe|trouble breathing|breathing difficulty|passed out|fainted|fainting|collapsed?|unconscious)\b/i },
  { topic: "allergic_reaction", emergency: true, test: /\b(allergic reaction|anaphyla|epipen|throat (is )?(closing|swelling)|hives all over|swelling (up|badly))\b/i },
  { topic: "severe_dehydration", emergency: false, test: /\b(severely dehydrated|haven'?t (peed|urinated)|no urine|dark urine and dizzy|vomiting and can'?t keep|heat ?stroke)\b/i },
  { topic: "diabetes_glucose", emergency: false, test: /\b(diabet|blood sugar|blood glucose|insulin|hypo(glycemi|glycaemi)?\b)/i },
  { topic: "eating_disorder", emergency: false, test: /\b(eating disorder|anorexi|bulimi|binge eating|purge|purging|starv(e|ing)|skip(ping)? meals to lose|hate my body|scared (of|to) eat(ing)?|make myself (sick|throw up))\b/i },
  { topic: "injury_diagnosis", emergency: false, test: /\b(is (it|my \w+) (broken|torn|sprained|fractured)|do i have a (fracture|tear|concussion)|concussion|play (through|with) (the )?(pain|injury)|return to play|rolled my ankle|(broken|torn|sprained|injured).{0,30}(can|should) i (still )?(play|train)|injur(y|ed).{0,30}(diagnos|should i play|can i play))\b/i },
  { topic: "medication", emergency: false, test: /\b(medication|medicine|tablet|antibiotic|ibuprofen|paracetamol|adhd med|ventolin|puffer)\b.{0,40}\b(mix|interact|take|safe|with)\b|\b(mix|interact).{0,30}(medication|medicine)\b/i },
  { topic: "supplement_dosing", emergency: false, test: /\b(how (much|many)|dose|dosage|grams? of|mg of|protocol|loading)\b.{0,40}\b(creatine|protein powder|pre[- ]?workout|caffeine|beta[- ]?alanine|supplement)\b/i },
];

const SUPPLEMENT = /\b(supplement|creatine|pre[- ]?workout|protein powder|bcaa|beta[- ]?alanine|caffeine (pill|tablet)|energy drink|red bull|monster|v energy)\b/i;
const QUICK_SPEED = /\b(quick|instant|fast|sudden)\b.{0,25}\b(burst|boost|hit)\b.{0,25}\b(speed|energy|power)\b|\bwhat gives me (a )?(quick|instant).{0,20}(speed|energy)\b|\b(instant|guaranteed) (energy|speed|performance)\b/i;
const WEIGHT = /\b(lose weight fast|drop (weight|kilos) (quick|fast)|cut weight|get shredded|burn fat fast)\b/i;

export function assess(question: string): SafetyOutcome {
  for (const r of ESCALATIONS) {
    if (r.test.test(question)) return { kind: "escalate", topic: r.topic, emergency: r.emergency };
  }
  if (QUICK_SPEED.test(question)) return { kind: "redirect", topic: "quick_speed" };
  if (WEIGHT.test(question)) return { kind: "redirect", topic: "weight_change" };
  if (SUPPLEMENT.test(question)) return { kind: "redirect", topic: "supplement" };
  return { kind: "proceed" };
}

// Plain-language escalation copy. Australian context (000).
export function escalationMessage(topic: EscalationTopic, emergency: boolean, youth: boolean): { headline: string; body: string[] } {
  const adult = youth ? "Tell a parent, guardian or coach right now." : "Get help from a person, not an app.";
  if (topic === "mental_crisis") {
    return {
      headline: "You matter more than any game.",
      body: [
        "Please talk to a real person today — you don't have to carry this alone.",
        "Kids Helpline 1800 55 1800 (free, 24/7, ages 5–25) · Lifeline 13 11 14 · 13YARN 13 92 76. If you're in danger right now, call 000.",
        adult,
        "The court will still be there. You come first.",
      ],
    };
  }
  if (emergency) {
    return {
      headline: "This needs a person, right now — not an app.",
      body: [
        adult,
        "If someone has chest pain, trouble breathing, a serious allergic reaction, or has collapsed or fainted: call 000 (Australia) or get to the nearest adult immediately.",
        "UNC can't help with emergencies. People can.",
      ],
    };
  }
  const map: Record<EscalationTopic, string> = {
    mental_crisis: "You matter more than any game.", // handled above — kept for exhaustiveness
    allergic_reaction: "Allergic reactions need a doctor's plan, not general tips.",
    diabetes_glucose: "Anything involving diabetes, blood sugar or insulin needs your doctor or diabetes team — general food tips aren't safe here.",
    eating_disorder: "Food should never feel like fear or punishment. Please talk to a parent or guardian and a doctor. In Australia, the Butterfly Foundation is on 1800 33 4673.",
    collapse_chest_breathing: "Call 000.",
    severe_dehydration: "Those symptoms need a real check-up — see a doctor or tell an adult today, and don't train until you have.",
    injury_diagnosis: "Diagnosing an injury or deciding whether to play needs a physio or doctor who can actually see you. Guessing wrong makes small injuries big.",
    medication: "Never mix food, sport and medication advice from an app — ask your doctor or pharmacist, they answer this exact question every day.",
    supplement_dosing: "Individual supplement doses aren't something UNC will ever give. The AIS position is that athletes should involve a sports doctor or Accredited Sports Dietitian, because safety, effectiveness and sport eligibility all matter.",
  };
  return {
    headline: "UNC won't guess at this one.",
    body: [map[topic], adult, "When you've spoken to the right person, come back and UNC will help with the basics — preparation, familiar food, fluids and mindset."],
  };
}

// The approved no-shortcut response for supplement / quick-speed asks.
export function redirectMessage(topic: "supplement" | "quick_speed" | "weight_change", youth: boolean): { headline: string; body: string[] } {
  const guardian = youth ? "If you're under 18: supplements aren't for you, and that's not UNC being soft — it's the AIS position. Talk to a parent or guardian first about anything like this." : "";
  if (topic === "quick_speed") {
    return {
      headline: "Straight answer: nothing gives you an instant burst of speed.",
      body: [
        "No food, drink or product does that — anyone who promises it is selling something.",
        "What actually shows up on game day: fuel you've eaten in the hours before, fluids, a proper warm-up, and a clear head.",
        "So: eat familiar, sip water, warm up properly, pick one job for your first minute on court.",
        guardian,
      ].filter(Boolean),
    };
  }
  if (topic === "weight_change") {
    return {
      headline: "UNC doesn't do fast weight change. Ever.",
      body: [
        "Rapid weight change hurts performance and health, especially for young athletes.",
        "Fuel for the sport you play, sleep, train, and let your body do its thing.",
        youth ? "If weight is on your mind a lot, talk to a parent or guardian and a doctor or Accredited Sports Dietitian — that's a conversation for people who know you." : "If body composition genuinely matters for your sport, an Accredited Sports Dietitian is the right person, not an app.",
      ],
    };
  }
  return {
    headline: "UNC doesn't recommend supplements.",
    body: [
      "No supplement turns an unprepared player into a prepared one. Food, fluids, sleep and training do the heavy lifting.",
      "The AIS advice: involve a sports doctor or Accredited Sports Dietitian before touching supplements — safety, whether it works, and sport eligibility all have to be checked.",
      guardian || "Under 18s shouldn't use them at all.",
      "What UNC will help with: familiar pre-game food, fluids, warm-up and one clear mindset cue.",
    ].filter(Boolean),
  };
}

// Should this answer carry a parent/guardian line?
export function needsGuardianNote(youth: boolean, topics: { nutrition?: boolean; sensitive?: boolean }): boolean {
  return youth && !!(topics.nutrition || topics.sensitive);
}

export const GUARDIAN_NOTE =
  "If you're under 18, loop in a parent, guardian or coach on food and health stuff — that's part of doing it properly.";

export const PRIVACY_LINE =
  "You do not have to share your answer. But answer it honestly for yourself.";
