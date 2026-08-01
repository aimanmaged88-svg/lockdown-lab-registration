import { NextRequest, NextResponse } from "next/server";
import { prisma, getOrgId } from "@/lib/db";
import { parseWorkbook, diffAgainstExisting } from "@/lib/importer";

export const runtime = "nodejs";

// POST a .xlsx file → returns an idempotent preview: which rows are new, which
// would change (with field-level diffs), and conflicts. Nothing is written.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseWorkbook(buffer);
    if (!rows.length) return NextResponse.json({ error: "No content rows found. Check the workbook has a title/topic column." }, { status: 400 });

    const orgId = await getOrgId();
    const existing = await prisma.content.findMany({
      where: { orgId },
      select: { importKey: true, title: true, pillar: true, plannedDate: true, status: true },
    });
    const preview = diffAgainstExisting(rows, existing);
    return NextResponse.json({
      filename: file.name,
      total: rows.length,
      added: preview.added.length,
      changed: preview.changed.length,
      conflicts: preview.conflicts.length,
      unchanged: preview.unchanged.length,
      changes: preview.changed.slice(0, 50).map((c) => ({ title: c.row.title, diffs: c.diffs })),
      conflictList: preview.conflicts.slice(0, 20).map((c) => ({ title: c.row.title, reason: c.reason })),
      rows: preview.rows,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Import failed" }, { status: 500 });
  }
}
