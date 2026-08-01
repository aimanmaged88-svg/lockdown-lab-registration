import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseWorkbook, diffAgainstExisting } from "@/lib/importer";

function makeWorkbook(rows: Record<string, unknown>[]): Buffer {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Roadmap");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

const SAMPLE = [
  { Date: "2026-08-03", Topic: "The next-play reset", Pillar: "Mindset", Audience: "General", Format: "Reel", Hook: "After a mistake…", Caption: "Reset.", "Conversation CTA": "Your reset?", Status: "Planned" },
  { Date: "2026-08-04", Topic: "Pre-game fuel", Pillar: "Nutrition", Audience: "Parents", Format: "Reel", Hook: "Keep it simple", Caption: "Fuel.", "Conversation CTA": "Your meal?", Status: "Idea" },
];

describe("roadmap importer", () => {
  it("parses rows and maps columns fuzzily", () => {
    const rows = parseWorkbook(makeWorkbook(SAMPLE));
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe("The next-play reset");
    expect(rows[0].pillar).toBe("Mindset");
    expect(rows[1].audience).toBe("Parents");
    expect(rows[0].question).toBe("Your reset?");
  });

  it("produces a stable importKey (idempotent across runs)", () => {
    const a = parseWorkbook(makeWorkbook(SAMPLE));
    const b = parseWorkbook(makeWorkbook(SAMPLE));
    expect(a[0].importKey).toBe(b[0].importKey);
    expect(a[0].importKey).not.toBe(a[1].importKey);
  });

  it("diff: all new the first time", () => {
    const rows = parseWorkbook(makeWorkbook(SAMPLE));
    const preview = diffAgainstExisting(rows, []);
    expect(preview.added).toHaveLength(2);
    expect(preview.changed).toHaveLength(0);
  });

  it("diff: unchanged the second time, detects field changes", () => {
    const rows = parseWorkbook(makeWorkbook(SAMPLE));
    const existing = rows.map((r) => ({ importKey: r.importKey, title: r.title, pillar: r.pillar, plannedDate: r.plannedDate ?? null, status: r.status }));
    const same = diffAgainstExisting(rows, existing);
    expect(same.added).toHaveLength(0);
    expect(same.unchanged).toHaveLength(2);

    // change a status → shows as a change, not a duplicate
    const changedRows = parseWorkbook(makeWorkbook([{ ...SAMPLE[0], Status: "Posted" }, SAMPLE[1]]));
    const diff = diffAgainstExisting(changedRows, existing);
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0].diffs.join(" ")).toMatch(/status/i);
  });

  it("flags duplicate rows inside the same workbook as conflicts", () => {
    const rows = parseWorkbook(makeWorkbook([SAMPLE[0], SAMPLE[0]]));
    const preview = diffAgainstExisting(rows, []);
    expect(preview.conflicts.length).toBeGreaterThanOrEqual(1);
  });
});
