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
