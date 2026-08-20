// Caption + hashtag bank for the thought cards. Curated once, offline: a
// researched set of tags that actually match Aiman's lane (Australian youth
// basketball, parents, mindset, sport nutrition) rather than whatever is
// globally trending, which for a Sydney grassroots page is mostly noise.
// Mix per post = a few broad, a few mid, a few niche/local — the spread that
// gets a small page seen without looking like tag spam.

export type Pillar = "Basketball" | "Nutrition" | "Mindset" | "General";

const BROAD: Record<Pillar, string[]> = {
  Basketball: ["basketball", "hoops", "ballislife", "basketballtraining", "hooper"],
  Nutrition: ["sportsnutrition", "athletenutrition", "fuelyourbody", "healthyeating", "recovery"],
  Mindset: ["mindset", "athletemindset", "mentalgame", "discipline", "confidence"],
  General: ["basketball", "hoops", "mindset", "athlete", "sport"],
};

const MID: Record<Pillar, string[]> = {
  Basketball: ["basketballskills", "playerdevelopment", "basketballiq", "defensewins", "hoopers", "gametime"],
  Nutrition: ["youthathlete", "gamedayfuel", "eatwelltrainwell", "athleterecovery", "fuelforsport"],
  Mindset: ["mentalhealthinsport", "growthmindset", "athletelife", "mindsetmatters", "processoverresults"],
  General: ["playerdevelopment", "athletelife", "youthsport", "coaching"],
};

const NICHE: Record<Pillar, string[]> = {
  Basketball: ["youthbasketball", "juniorbasketball", "grassrootsbasketball", "basketballparents", "basketballcoaching"],
  Nutrition: ["juniorathlete", "sportsdietitian", "teenathlete", "basketballnutrition", "parentsofathletes"],
  Mindset: ["youthsports", "sportsparents", "basketballmindset", "youngathletes", "mentalskills"],
  General: ["youthsports", "grassrootssport", "basketballparents"],
};

const LOCAL = ["sydneybasketball", "australianbasketball", "aussiehoops", "basketballaustralia", "sydneysport"];
const BRAND = ["uncthoughts", "basketballnutritionmindset"];

// Deterministic pick so the same card gives the same tags until you shuffle.
function pick<T>(arr: T[], n: number, seed: number): T[] {
  const out: T[] = [];
  const pool = [...arr];
  let s = seed;
  while (out.length < Math.min(n, arr.length) && pool.length) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    out.push(pool.splice(s % pool.length, 1)[0]);
  }
  return out;
}

export function hashtagsFor(pillar: Pillar, seed = 1): string {
  const p = (["Basketball", "Nutrition", "Mindset"] as Pillar[]).includes(pillar) ? pillar : "General";
  const tags = [
    ...pick(BROAD[p], 3, seed),
    ...pick(MID[p], 4, seed + 7),
    ...pick(NICHE[p], 4, seed + 13),
    ...pick(LOCAL, 3, seed + 21),
    ...BRAND,
  ];
  return Array.from(new Set(tags)).map((t) => `#${t}`).join(" ");
}

// Three caption shapes. Each opens with the line itself (it's the post), then
// gives the reader somewhere to go. Deliberately short and plain — this is a
// draft for Aiman to punch up in his own voice, not a finished caption.
export const ANGLES = ["Straight up", "Ask the room", "Story starter"] as const;
export type Angle = (typeof ANGLES)[number];

const PILLAR_LINE: Record<Pillar, string> = {
  Basketball: "Basketball. Nutrition. Mindset.",
  Nutrition: "Fuel the work. Basketball. Nutrition. Mindset.",
  Mindset: "The mind is the skill nobody trains. Basketball. Nutrition. Mindset.",
  General: "Basketball. Nutrition. Mindset.",
};

export function captionFor(line: string, pillar: Pillar, angle: Angle, seed = 1): string {
  const l = line.trim().replace(/\s+/g, " ");
  const p = (["Basketball", "Nutrition", "Mindset"] as Pillar[]).includes(pillar) ? pillar : "General";
  const cta = "Got a question? It's anonymous — link in bio.";

  const body =
    angle === "Ask the room"
      ? `${l}\n\nWhat's your take — drop it in the comments.\n\n${cta}`
      : angle === "Story starter"
        ? `${l}\n\nSeen this one play out plenty of times around the local game. Some of you are living it right now.\n\n${cta}`
        : `${l}\n\n${PILLAR_LINE[p]}\n\n${cta}`;

  return `${body}\n\n${hashtagsFor(p, seed)}`;
}
