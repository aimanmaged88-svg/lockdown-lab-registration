import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { startOfWeek, addDays, format } from "date-fns";

// Everything the creator sees is in their local Sydney time. Stored as UTC.
export const TZ = process.env.APP_TIMEZONE || "Australia/Sydney";

export function nowInTz(): Date {
  return toZonedTime(new Date(), TZ);
}

export function fmt(date: Date | string | null | undefined, pattern = "EEE d MMM"): string {
  if (!date) return "—";
  return formatInTimeZone(new Date(date), TZ, pattern);
}

export function fmtDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return formatInTimeZone(new Date(date), TZ, "EEE d MMM, h:mmaaa");
}

export function isoDate(date: Date | string): string {
  return formatInTimeZone(new Date(date), TZ, "yyyy-MM-dd");
}

// Monday-start week, aligned to Sydney.
export function weekStart(date: Date = new Date()): Date {
  const zoned = toZonedTime(date, TZ);
  const monday = startOfWeek(zoned, { weekStartsOn: 1 });
  return monday;
}

export function sameDay(a: Date | string, b: Date | string): boolean {
  return isoDate(a) === isoDate(b);
}

export function weekDays(from: Date = weekStart()): { date: Date; label: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(from, i);
    return { date: d, label: format(d, "EEE d") };
  });
}
