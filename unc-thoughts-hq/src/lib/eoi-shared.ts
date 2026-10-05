// Expression-of-interest options and the normalising rules, shared by the
// public form, the server action and the admin table. Kept out of
// eoi-actions.ts because a "use server" file may only export async functions.

// ── Where a registration goes ───────────────────────────────────────────────
// The app's own Supabase database is paused (free plan, two-active-project
// limit), so registrations are landing in Netlify Forms instead — it needs no
// database and the public page works today. Flip this to "db" the moment the
// database is back and the server action takes over again; nothing else
// changes, including the URL people have been given.
export const SINK: "netlify" | "db" = "netlify";
export const NETLIFY_FORM = "coaching-eoi";

export const LEVELS = ["Beginner", "Social", "Club", "Rep", "Senior"] as const;
export const POSITIONS = ["Guard", "Wing", "Big", "Not sure"] as const;
export const INTERESTS = ["Group sessions", "One-on-ones", "Both"] as const;
export const FOCUS = [
  "Mindset",
  "Reading the game",
  "Rebounding",
  "Shooting",
  "Decision making",
  "Confidence",
  "Other",
] as const;
export const TIMES = ["Weekday evenings", "Weekends", "Flexible"] as const;

export const MINOR_AGE = 18;

export type InterestInput = {
  fullName: string;
  age: string;
  guardianName: string;
  guardianPhone: string;
  mobile: string;
  email: string;
  instagram: string;
  suburb: string;
  level: string;
  position: string;
  interest: string[];
  focus: string[];
  focusOther: string;
  bestTime: string;
  notes: string;
};

export type InterestRow = {
  id: string;
  at: string;
  fullName: string;
  age: number;
  guardianName: string | null;
  guardianPhone: string | null;
  mobile: string;
  email: string;
  instagram: string | null;
  suburb: string | null;
  level: string;
  position: string;
  interest: string[];
  focus: string[];
  focusOther: string | null;
  bestTime: string;
  notes: string | null;
};

export function normEmail(v: string): string {
  return String(v ?? "").trim().toLowerCase();
}

// Australian mobiles land as 04xxxxxxxx so +61 412…, 0412…, and 0412 345 678
// are all the same person. Anything else keeps its digits, which still catches
// the same number typed twice.
export function normMobile(v: string): string {
  const digits = String(v ?? "").replace(/\D/g, "");
  if (/^61[45]\d{8}$/.test(digits)) return "0" + digits.slice(2);
  if (/^0[45]\d{8}$/.test(digits)) return digits;
  if (/^[45]\d{8}$/.test(digits)) return "0" + digits;
  return digits;
}

export function validEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normEmail(v));
}

// The whole point of the number is that he can ring them, so a too-short one
// is a typo, not a preference.
export function validMobile(v: string): boolean {
  return normMobile(v).length >= 8;
}

export function isMinor(age: number): boolean {
  return Number.isFinite(age) && age < MINOR_AGE;
}

// Returns a field->message map; empty means it's good to send.
export function checkInterest(f: InterestInput): Record<string, string> {
  const e: Record<string, string> = {};
  if (f.fullName.trim().length < 2) e.fullName = "Your full name, please.";
  const age = Number(f.age);
  if (!/^\d{1,2}$/.test(f.age.trim()) || !Number.isFinite(age) || age < 5 || age > 99) {
    e.age = "Age in years — somewhere between 5 and 99.";
  } else if (isMinor(age)) {
    if (f.guardianName.trim().length < 2) e.guardianName = "Parent or guardian name is required under 18.";
    if (!validMobile(f.guardianPhone)) e.guardianPhone = "A phone number for your parent or guardian.";
  }
  if (!validMobile(f.mobile)) e.mobile = "A mobile number he can reach you on.";
  if (!validEmail(f.email)) e.email = "An email address that works.";
  if (!LEVELS.includes(f.level as (typeof LEVELS)[number])) e.level = "Pick your level.";
  if (!POSITIONS.includes(f.position as (typeof POSITIONS)[number])) e.position = "Pick a position.";
  if (!TIMES.includes(f.bestTime as (typeof TIMES)[number])) e.bestTime = "Pick a time that suits.";
  return e;
}
