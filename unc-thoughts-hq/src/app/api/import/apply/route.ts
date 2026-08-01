import { NextRequest, NextResponse } from "next/server";
import { prisma, getOrgId } from "@/lib/db";
import { audit } from "@/lib/audit";
import type { ImportRow } from "@/lib/importer";

export const runtime = "nodejs";

// Apply parsed rows idempotently. Upsert by importKey: new rows created, existing
// rows updated in place (never duplicated). Records an ImportRun for undo/history.
export async function POST(req: NextRequest) {
  try {
    const { rows } = (await req.json()) as { rows: ImportRow[] };
    if (!Array.isArray(rows) || !rows.length) return NextResponse.json({ error: "No rows to apply" }, { status: 400 });
    const orgId = await getOrgId();
    const owner = await prisma.user.findFirst({ where: { orgId, role: "owner" } });

    let added = 0;
    let changed = 0;
    const seen = new Set<string>();
    for (const r of rows) {
      if (seen.has(r.importKey)) continue;
      seen.add(r.importKey);
      const existing = await prisma.content.findUnique({ where: { importKey: r.importKey } });
      const data = {
        orgId,
        ownerId: owner?.id,
        title: r.title,
        pillar: r.pillar,
        audience: r.audience,
        format: r.format,
        hook: r.hook,
        script: r.script,
        caption: r.caption,
        question: r.question,
        highlight: r.highlight,
        plannedDate: r.plannedDate ? new Date(r.plannedDate) : null,
        status: r.status,
        notes: r.notes,
      };
      if (existing) {
        await prisma.content.update({ where: { importKey: r.importKey }, data });
        changed++;
      } else {
        await prisma.content.create({ data: { ...data, importKey: r.importKey } });
        added++;
      }
    }

    const run = await prisma.importRun.create({
      data: { orgId, filename: "roadmap", added, changed, summary: JSON.stringify({ added, changed, total: rows.length }) },
    });
    await audit("import.apply", { entity: "ImportRun", entityId: run.id, detail: { added, changed } });
    return NextResponse.json({ ok: true, added, changed, runId: run.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Apply failed" }, { status: 500 });
  }
}
