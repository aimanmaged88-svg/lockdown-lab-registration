import { formatInTimeZone } from "date-fns-tz";
import { TZ } from "../time";

// Time awareness without false precision. We turn "my game is at 7:30 PM" into
// a BAND (3h+, 2–3h, 1–2h, 30–60m, <30m, after) and answer for the band.
export const TIME_BANDS = ["3h+", "2-3h", "1-2h", "30-60m", "<30m", "after"] as const;
export type TimeBand = (typeof TIME_BANDS)[number];

export const BAND_LABEL: Record<TimeBand, string> = {
  "3h+": "3 hours or more to go",
  "2-3h": "about 2–3 hours to go",
  "1-2h": "about 1–2 hours to go",
  "30-60m": "30–60 minutes to go",
  "<30m": "under 30 minutes to go",
  after: "after the session",
};

export type ParsedTime = {
  minutesOfDay: number; // 0..1439 in Sydney time
  display: string; // "7:30 pm"
  assumedPm: boolean; // no am/pm given, we assumed evening — say so
};

// Parse a clock time out of free text ("7:30 PM", "at 19:30", "game at 7").
export function parseClockTime(text: string): ParsedTime | null {
  const m = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const mer = m[3]?.toLowerCase().replace(/\./g, "");
  if (hour > 23 || minute > 59) return null;
  let assumedPm = false;
  if (mer === "pm" && hour < 12) hour += 12;
  else if (mer === "am" && hour === 12) hour = 0;
  else if (!mer && hour >= 1 && hour <= 11) {
    // No am/pm: assume evening (most junior games/training) and SAY SO.
    hour += 12;
    assumedPm = true;
  }
  const h12 = ((hour + 11) % 12) + 1;
  return {
    minutesOfDay: hour * 60 + minute,
    display: `${h12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "pm" : "am"}`,
    assumedPm,
  };
}

export function nowMinutesInSydney(now: Date = new Date()): number {
  const h = parseInt(formatInTimeZone(now, TZ, "H"), 10);
  const m = parseInt(formatInTimeZone(now, TZ, "m"), 10);
  return h * 60 + m;
}

// Minutes until the event's next occurrence. If it finished within the last
// 4 hours we treat it as "after"; older than that we assume tomorrow.
export function minutesUntil(eventMinutes: number, now: Date = new Date()): number {
  let diff = eventMinutes - nowMinutesInSydney(now);
  if (diff < -240) diff += 1440;
  return diff;
}

export function bandFor(minutes: number): TimeBand {
  if (minutes <= 0) return "after";
  if (minutes < 30) return "<30m";
  if (minutes < 60) return "30-60m";
  if (minutes < 120) return "1-2h";
  if (minutes < 180) return "2-3h";
  return "3h+";
}

export function bandFromText(text: string, now: Date = new Date()): { band: TimeBand; parsed: ParsedTime; minutes: number } | null {
  // Only treat it as a time if the text actually talks about a clock time.
  if (!/\d/.test(text)) return null;
  const parsed = parseClockTime(text);
  if (!parsed) return null;
  const minutes = minutesUntil(parsed.minutesOfDay, now);
  return { band: bandFor(minutes), parsed, minutes };
}

// "I only have five minutes" style durations.
export function bandFromDuration(text: string): TimeBand | null {
  const m = text.match(/(\d+|five|ten|fifteen|twenty|thirty)\s*(minutes|minute|mins|min)\b/i);
  if (!m) return null;
  const words: Record<string, number> = { five: 5, ten: 10, fifteen: 15, twenty: 20, thirty: 30 };
  const n = words[m[1].toLowerCase()] ?? parseInt(m[1], 10);
  if (!Number.isFinite(n)) return null;
  return bandFor(n);
}
