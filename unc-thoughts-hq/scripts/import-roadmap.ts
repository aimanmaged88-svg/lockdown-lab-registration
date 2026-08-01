/**
 * CLI roadmap importer (idempotent). Usage:
 *   npm run import:roadmap -- path/to/UNC-Thoughts-90-Day-Roadmap.xlsx
 * Re-running updates rows in place (by stable importKey) — never duplicates.
 */
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { parseWorkbook, diffAgainstExisting } from "../src/lib/importer";

const ORG_SLUG = "unc-thoughts";

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run import:roadmap -- <file.xlsx>");
    process.exit(1);
  }
  const prisma = new PrismaClient();
  try {
    const org = await prisma.organisation.findUnique({ where: { slug: ORG_SLUG } });
    if (!org) throw new Error("Organisation not seeded. Run `npm run db:seed` first.");

    const rows = parseWorkbook(readFileSync(file));
    if (!rows.length) throw new Error("No content rows found. Check the workbook has a Title/Topic column.");

    const existing = await prisma.content.findMany({
      where: { orgId: org.id },
      select: { importKey: true, title: true, pillar: true, plannedDate: true, status: true },
    });
    const preview = diffAgainstExisting(rows, existing);
    console.log(`Parsed ${rows.length} rows: ${preview.added.length} new, ${preview.changed.length} changed, ${preview.conflicts.length} conflicts.`);

    const owner = await prisma.user.findFirst({ where: { orgId: org.id, role: "owner" } });
    let added = 0, changed = 0;
    const seen = new Set<string>();
    for (const r of rows) {
      if (seen.has(r.importKey)) continue;
      seen.add(r.importKey);
      const data = {
        orgId: org.id, ownerId: owner?.id, title: r.title, pillar: r.pillar, audience: r.audience,
        format: r.format, hook: r.hook, script: r.script, caption: r.caption, question: r.question,
        highlight: r.highlight, plannedDate: r.plannedDate ?? null, status: r.status, notes: r.notes,
      };
      const ex = await prisma.content.findUnique({ where: { importKey: r.importKey } });
      if (ex) { await prisma.content.update({ where: { importKey: r.importKey }, data }); changed++; }
      else { await prisma.content.create({ data: { ...data, importKey: r.importKey } }); added++; }
    }
    await prisma.importRun.create({ data: { orgId: org.id, filename: file, added, changed } });
    console.log(`Applied: ${added} added, ${changed} updated.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
