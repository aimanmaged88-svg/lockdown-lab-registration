// Nutrition & safety language linter. Rule-based, transparent, no AI needed.
// Nutrition content is GENERAL EDUCATION — this flags language that drifts into
// restriction, shame, medical advice, guarantees, or targeting individual kids,
// and suggests safer wording. It never blocks; it advises.

export type Severity = "high" | "medium" | "low";

export type SafetyFlag = {
  match: string;
  category: string;
  severity: Severity;
  message: string;
  suggestion: string;
};

type Rule = {
  test: RegExp;
  category: string;
  severity: Severity;
  message: string;
  suggestion: string;
};

const RULES: Rule[] = [
  {
    test: /\b(never eat|don'?t eat|cut out|forbidden|banned food|bad food|toxic|cheat meal)\b/i,
    category: "Restrictive food language",
    severity: "high",
    message: "This frames food as forbidden. Restriction language can be harmful, especially to young people.",
    suggestion: "Talk about 'more often / less often' foods and balance, not banned foods.",
  },
  {
    test: /\b(guilt|shame|ashamed|earn your food|burn it off|punish|make up for)\b/i,
    category: "Food shame",
    severity: "high",
    message: "This links food to guilt or punishment.",
    suggestion: "Keep food neutral. Food fuels performance; it isn't a reward or a debt.",
  },
  {
    test: /\b(guaranteed|guarantee|will definitely|100%|instantly|overnight results|dramatic results)\b/i,
    category: "Guaranteed performance claim",
    severity: "medium",
    message: "Guaranteed outcomes aren't honest — results vary by person.",
    suggestion: "Use 'can help', 'often', 'for many players'. Be honest about variation.",
  },
  {
    test: /\b(lose weight|weight loss|shred|drop kilos|get lean|fat loss|slim down|calorie deficit)\b/i,
    category: "Weight-loss targeting",
    severity: "high",
    message: "Weight-loss targeting is inappropriate for a youth-adjacent audience.",
    suggestion: "Focus on fuelling, energy and recovery for performance — not body size.",
  },
  {
    test: /\b(you should take|prescribe|dose|diagnos|deficien|supplement stack|treat your)\b/i,
    category: "Medical advice",
    severity: "high",
    message: "This edges into individual medical advice.",
    suggestion: "Keep it general education and point people to a doctor or accredited dietitian.",
  },
  {
    test: /\b(your kid|your son|your daughter|this child|little johnny)\b.*\b(should eat|must eat|needs to)\b/i,
    category: "Advice directed at an individual child",
    severity: "high",
    message: "Directing dietary instructions at a specific child is unsafe.",
    suggestion: "Speak to parents/coaches generally and recommend professional guidance for individuals.",
  },
  {
    test: /\b(measure your (waist|body)|body fat %|weigh yourself daily|before and after body)\b/i,
    category: "Body measurement",
    severity: "medium",
    message: "Public body measurement content can be harmful.",
    suggestion: "Avoid body measurements. Track habits and how you feel instead.",
  },
];

export function lintNutrition(text: string | null | undefined): SafetyFlag[] {
  if (!text) return [];
  const flags: SafetyFlag[] = [];
  for (const rule of RULES) {
    const m = text.match(rule.test);
    if (m) {
      flags.push({
        match: m[0],
        category: rule.category,
        severity: rule.severity,
        message: rule.message,
        suggestion: rule.suggestion,
      });
    }
  }
  return flags;
}

// Restricted-word check for community moderation (rate-limit + anti-spam companion).
const RESTRICTED = ["buy now", "click here", "free money", "dm me for", "onlyfans", "crypto", "http://", "https://"];

export function containsRestricted(text: string): string[] {
  const lower = text.toLowerCase();
  return RESTRICTED.filter((w) => lower.includes(w));
}
