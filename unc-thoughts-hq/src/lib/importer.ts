import * as XLSX from "xlsx";
import crypto from "crypto";
import { PILLARS, AUDIENCES, CONTENT_STATUSES } from "./enums";

// Roadmap importer. Reads the UNC Thoughts 90-Day Roadmap workbook and maps rows
// to Content. Idempotent: each row gets a stable importKey so re-running updates
// in place instead of duplicating. Column names are matched fuzzily so small
// header differences in the workbook don't break the import.

export type ImportRow = {
  importKey: string;
  title: string;
  pillar: string;
  audience: string;
  format: string;
  hook?: string;
  script?: string;
  caption?: string;
  question?: string;
  highlight?: string;
  plannedDate?: Date;
  status: string;
  notes?: string;
  raw: Record<string, unknown>;
};

// Map many possible header spellings to our fields.
const FIELD_ALIASES: Record<string, string[]> = {
  plannedDate: ["date", "planned date", "post date", "day", "publish date", "scheduled"],
  title: ["title", "topic", "content", "idea", "subject", "theme"],
  pillar: ["pillar", "category", "type", "content pillar"],
  audience: ["audience", "audience segment", "segment", "for"],
  format: ["format", "content type", "media"],
  hook: ["hook", "opening", "opener"],
  script: ["script", "spoken script", "creation instructions", "instructions", "how to create", "creation"],
  caption: ["caption", "post caption"],
  question: ["conversation question", "question", "conversation cta", "cta", "call to action", "engagement cta"],
  highlight: ["highlight", "highlight destination", "highlights"],
  status: ["status", "state", "progress"],
  notes: ["notes", "note", "engagement follow-up", "engagement followup", "follow up", "follow-up", "comments"],
};

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function matchField(header: string): string | null {
  const n = normHeader(header);
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(n)) return field;
    // partial contains match as a fallback
    if (aliases.some((a) => n.includes(a))) return field;
  }
  return null;
}

function coercePillar(v: unknown): string {
  const s = String(v ?? "").trim();
  const hit = PILLARS.find((p) => p.toLowerCase() === s.toLowerCase());
  if (hit) return hit;
  const l = s.toLowerCase();
  if (l.includes("ball") || l.includes("hoop") || l.includes("skill")) return "Basketball";
  if (l.includes("nutri") || l.includes("food") || l.includes("fuel") || l.includes("eat")) return "Nutrition";
  if (l.includes("mind") || l.includes("mental") || l.includes("confidence")) return "Mindset";
  if (l.includes("communit")) return "Community";
  return "Mindset";
}

function coerceAudience(v: unknown): string {
  const s = String(v ?? "").trim();
  const hit = AUDIENCES.find((a) => a.toLowerCase() === s.toLowerCase());
  if (hit) return hit;
  const l = s.toLowerCase();
  if (l.includes("13") || l.includes("teen") || l.includes("junior") || l.includes("player")) return "Players13-17";
  if (l.includes("parent")) return "Parents";
  if (l.includes("coach")) return "Coaches";
  if (l.includes("adult")) return "Adults";
  return "General";
}

function coerceStatus(v: unknown): string {
  const s = String(v ?? "").trim();
  const hit = CONTENT_STATUSES.find((st) => st.toLowerCase() === s.toLowerCase());
  return hit ?? "Planned";
}

function parseDate(v: unknown): Date | undefined {
  if (v == null || v === "") return undefined;
  if (v instanceof Date) return v;
  if (typeof v === "number") {
    // Excel serial date
    const parsed = XLSX.SSF ? XLSX.SSF.parse_date_code(v) : null;
    if (parsed) return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0));
  }
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? undefined : d;
}

function stableKey(parts: (string | undefined)[]): string {
  const basis = parts.filter(Boolean).join("|").toLowerCase();
  return "rm_" + crypto.createHash("sha1").update(basis).digest("hex").slice(0, 16);
}

export function parseWorkbook(buffer: Buffer | ArrayBuffer): ImportRow[] {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const rows: ImportRow[] = [];

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    if (!json.length) continue;

    // Build header → field map from the first row's keys.
    const headers = Object.keys(json[0]);
    const fieldMap: Record<string, string> = {};
    for (const h of headers) {
      const f = matchField(h);
      if (f && !Object.values(fieldMap).includes(f)) fieldMap[h] = f;
    }
    // A sheet is a content sheet only if it has at least a title-ish column.
    if (!Object.values(fieldMap).includes("title")) continue;

    for (const r of json) {
      const get = (field: string): unknown => {
        const header = Object.keys(fieldMap).find((h) => fieldMap[h] === field);
        return header ? r[header] : undefined;
      };
      const title = String(get("title") ?? "").trim();
      if (!title) continue; // skip blank rows

      const plannedDate = parseDate(get("plannedDate"));
      const importKey = stableKey([sheetName, plannedDate ? plannedDate.toISOString().slice(0, 10) : undefined, title]);

      rows.push({
        importKey,
        title,
        pillar: coercePillar(get("pillar")),
        audience: coerceAudience(get("audience")),
        format: String(get("format") ?? "Reel").trim() || "Reel",
        hook: String(get("hook") ?? "").trim() || undefined,
        script: String(get("script") ?? "").trim() || undefined,
        caption: String(get("caption") ?? "").trim() || undefined,
        question: String(get("question") ?? "").trim() || undefined,
        highlight: String(get("highlight") ?? "").trim() || undefined,
        plannedDate,
        status: coerceStatus(get("status")),
        notes: String(get("notes") ?? "").trim() || undefined,
        raw: r,
      });
    }
  }
  return rows;
}

export type ImportPreview = {
  rows: ImportRow[];
  added: ImportRow[];
  changed: Array<{ row: ImportRow; diffs: string[] }>;
  unchanged: ImportRow[];
  conflicts: Array<{ row: ImportRow; reason: string }>;
};

// Compare parsed rows against existing content (by importKey) to build a preview.
export function diffAgainstExisting(
  rows: ImportRow[],
  existing: Array<{ importKey: string | null; title: string; pillar: string; plannedDate: Date | null; status: string }>,
): ImportPreview {
  const byKey = new Map(existing.filter((e) => e.importKey).map((e) => [e.importKey as string, e]));
  const added: ImportRow[] = [];
  const changed: Array<{ row: ImportRow; diffs: string[] }> = [];
  const unchanged: ImportRow[] = [];
  const conflicts: Array<{ row: ImportRow; reason: string }> = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (seen.has(row.importKey)) {
      conflicts.push({ row, reason: "Duplicate row (same date + title) inside the workbook." });
      continue;
    }
    seen.add(row.importKey);
    const ex = byKey.get(row.importKey);
    if (!ex) {
      added.push(row);
      continue;
    }
    const diffs: string[] = [];
    if (ex.title !== row.title) diffs.push(`title: "${ex.title}" → "${row.title}"`);
    if (ex.pillar !== row.pillar) diffs.push(`pillar: ${ex.pillar} → ${row.pillar}`);
    const exDate = ex.plannedDate ? ex.plannedDate.toISOString().slice(0, 10) : "—";
    const rowDate = row.plannedDate ? row.plannedDate.toISOString().slice(0, 10) : "—";
    if (exDate !== rowDate) diffs.push(`date: ${exDate} → ${rowDate}`);
    if (ex.status !== row.status) diffs.push(`status: ${ex.status} → ${row.status}`);
    if (diffs.length) changed.push({ row, diffs });
    else unchanged.push(row);
  }

  return { rows, added, changed, unchanged, conflicts };
}
