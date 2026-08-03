// Consistency Chart — pure, client-safe logic. No server imports.
//
// The idea (UNC's own routine): tag what you actually did each day — good fats,
// water, sleep, prep — plus how your energy felt. Over time YOUR OWN logs show
// the pattern ("energy's better when I get good fats in the two days before a
// game"). We only ever report what the member's data actually shows, with
// honest sample sizes. No streak mechanics, no shame for gaps.

export type HabitLogLite = {
  day: string; // Sydney YYYY-MM-DD
  tags: string[]; // ids from HABIT_TAGS
  energy: number | null; // 1-5
};

export const HABIT_TAGS = [
  { id: "water", label: "Drank enough water", icon: "💧" },
  { id: "good_fats", label: "Good fats (nuts, avo, fish)", icon: "🥜" },
  { id: "carbs_fuel", label: "Fuelled with carbs", icon: "🍚" },
  { id: "veg_fruit", label: "Fruit & veg", icon: "🍎" },
  { id: "sleep", label: "Solid sleep", icon: "😴" },
  { id: "trained", label: "Trained / played", icon: "🏀" },
  { id: "prepped", label: "Prepped food ahead", icon: "🧊" },
  { id: "game", label: "Game day", icon: "🏆" },
] as const;

export type HabitTagId = (typeof HABIT_TAGS)[number]["id"];
export const HABIT_TAG_IDS = HABIT_TAGS.map((t) => t.id) as string[];

// How far back a habit can plausibly feed a day. UNC's rule of thumb: what you
// eat two days out is what you run on.
export const LOOKBACK_DAYS = 2;

// Minimum days in BOTH groups before we say anything, and the minimum average
// energy difference worth mentioning. Below either → stay silent, honestly.
const MIN_GROUP = 4;
const MIN_GAME_GROUP = 3; // game days are rarer
const MIN_DIFF = 0.4;

export type ConsistencyInsight = {
  tag: HabitTagId;
  kind: "lookback" | "gameday";
  withAvg: number;
  withoutAvg: number;
  withN: number;
  withoutN: number;
  text: string;
};

const label = (id: string) => HABIT_TAGS.find((t) => t.id === id)?.label ?? id;
const round1 = (n: number) => Math.round(n * 10) / 10;
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// Did `tag` appear on any of the `lookback` days BEFORE `day` (not the day itself)?
function taggedInLookback(byDay: Map<string, HabitLogLite>, day: string, tag: string, lookback: number): boolean {
  const d = new Date(day + "T00:00:00Z");
  for (let i = 1; i <= lookback; i++) {
    const prev = new Date(d.getTime() - i * 864e5).toISOString().slice(0, 10);
    if (byDay.get(prev)?.tags.includes(tag)) return true;
  }
  return false;
}

// "You showed up N of the last `window` days." Counted from the newest log day
// backwards over calendar days. Positive framing only — never a broken streak.
export function showedUp(logs: HabitLogLite[], todayYmd: string, window = 28): { days: number; window: number } {
  const start = new Date(new Date(todayYmd + "T00:00:00Z").getTime() - (window - 1) * 864e5)
    .toISOString()
    .slice(0, 10);
  const days = new Set(logs.filter((l) => l.day >= start && l.day <= todayYmd && (l.tags.length > 0 || l.energy != null)).map((l) => l.day));
  return { days: days.size, window };
}

// The honest pattern report. For each food/recovery habit: compare energy on
// days where the habit appeared in the previous LOOKBACK_DAYS vs days it
// didn't. Plus the game-day special: game days with vs without the habit in
// the two days before. Emits nothing until the member's own data clears the
// sample-size bar — we never invent a pattern.
export function computeInsights(logs: HabitLogLite[]): ConsistencyInsight[] {
  const byDay = new Map(logs.map((l) => [l.day, l]));
  const energyDays = logs.filter((l) => l.energy != null);
  const out: ConsistencyInsight[] = [];
  const habitTags: HabitTagId[] = ["good_fats", "water", "carbs_fuel", "veg_fruit", "sleep", "prepped"];

  for (const tag of habitTags) {
    // General: any day with energy, split by tag-in-lookback.
    const withE: number[] = [];
    const withoutE: number[] = [];
    for (const l of energyDays) {
      (taggedInLookback(byDay, l.day, tag, LOOKBACK_DAYS) ? withE : withoutE).push(l.energy!);
    }
    if (withE.length >= MIN_GROUP && withoutE.length >= MIN_GROUP) {
      const a = avg(withE), b = avg(withoutE);
      if (a - b >= MIN_DIFF) {
        out.push({
          tag, kind: "lookback",
          withAvg: round1(a), withoutAvg: round1(b), withN: withE.length, withoutN: withoutE.length,
          text: `Your energy averaged ${round1(a)}/5 in the two days after "${label(tag)}" (${withE.length} days) vs ${round1(b)}/5 without (${withoutE.length} days). Your logs, your pattern.`,
        });
      }
    }

    // Game-day special: only game days, split the same way.
    const gWith: number[] = [];
    const gWithout: number[] = [];
    for (const l of energyDays) {
      if (!l.tags.includes("game")) continue;
      (taggedInLookback(byDay, l.day, tag, LOOKBACK_DAYS) ? gWith : gWithout).push(l.energy!);
    }
    if (gWith.length >= MIN_GAME_GROUP && gWithout.length >= MIN_GAME_GROUP) {
      const a = avg(gWith), b = avg(gWithout);
      if (a - b >= MIN_DIFF) {
        out.push({
          tag, kind: "gameday",
          withAvg: round1(a), withoutAvg: round1(b), withN: gWith.length, withoutN: gWithout.length,
          text: `Game days felt ${round1(a)}/5 when you had "${label(tag)}" in the two days before (${gWith.length} games) vs ${round1(b)}/5 when you didn't (${gWithout.length} games).`,
        });
      }
    }
  }

  // Strongest signals first; game-day findings outrank general ones.
  return out.sort((x, y) => (y.kind === "gameday" ? 1 : 0) - (x.kind === "gameday" ? 1 : 0) || (y.withAvg - y.withoutAvg) - (x.withAvg - x.withoutAvg));
}

// Grid data: the last `window` calendar days ending today, oldest first.
export function gridDays(logs: HabitLogLite[], todayYmd: string, window = 28): { day: string; energy: number | null; tagged: boolean }[] {
  const byDay = new Map(logs.map((l) => [l.day, l]));
  const end = new Date(todayYmd + "T00:00:00Z").getTime();
  return Array.from({ length: window }, (_, i) => {
    const day = new Date(end - (window - 1 - i) * 864e5).toISOString().slice(0, 10);
    const l = byDay.get(day);
    return { day, energy: l?.energy ?? null, tagged: (l?.tags.length ?? 0) > 0 };
  });
}
