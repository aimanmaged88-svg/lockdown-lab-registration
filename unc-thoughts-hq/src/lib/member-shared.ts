// Client-safe member constants (no server imports).
export const AGE_BANDS = [
  { key: "u13", label: "Under 13 (use with a parent or guardian)" },
  { key: "13-15", label: "13–15" },
  { key: "16-17", label: "16–17" },
  { key: "18+", label: "18 or over" },
  { key: "parent_coach", label: "Parent / Coach" },
] as const;

export function isYouthBand(band: string | null | undefined): boolean {
  return band === "u13" || band === "13-15" || band === "16-17";
}

// Ask-UNC-directly category tree: pillar → subcategory. Kept small and human —
// these labels appear on member chips AND as Signal Map problem groups on the
// owner desk, so changing one changes both.
export const QUESTION_TREE: Record<string, { icon: string; subcats: string[] }> = {
  Basketball: {
    icon: "🏀",
    subcats: ["Performance & skills", "Game day", "Training habits", "Team & relationships", "Confidence on court", "Pathways & making teams"],
  },
  Nutrition: {
    icon: "🍎",
    subcats: ["Game-day fuel", "Everyday eating", "Energy & recovery", "Budget & family meals", "Supplements & extras", "Growing bodies"],
  },
  Mindset: {
    icon: "🧠",
    subcats: ["Confidence", "Pressure & nerves", "Discipline & habits", "Setbacks & slumps", "School–life–ball balance", "Parents & coaches"],
  },
};

// Optional third layer: who's asking. Never required — anonymity is the default.
export const WHO_OPTIONS = ["Player", "Parent", "Coach"] as const;

// The Huddle's conversation topics.
export const HUDDLE_TOPICS = ["Basketball", "Nutrition", "Mindset", "General"] as const;
