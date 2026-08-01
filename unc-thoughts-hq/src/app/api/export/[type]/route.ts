import { NextRequest, NextResponse } from "next/server";
import { contentCsv, analyticsCsv, questionsCsv, talksCsv, weeklyMarkdown } from "@/lib/exports";
import { prisma, getOrgId } from "@/lib/db";
import { fmt } from "@/lib/time";

export const runtime = "nodejs";

// GET /api/export/weekly|content|analytics|questions|talks|research
export async function GET(_req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  try {
    let body: string;
    let filename: string;
    let contentType = "text/csv; charset=utf-8";

    switch (type) {
      case "weekly":
        body = await weeklyMarkdown();
        filename = "weekly-review.md";
        contentType = "text/markdown; charset=utf-8";
        break;
      case "content":
        body = await contentCsv();
        filename = "content-calendar.csv";
        break;
      case "analytics":
        body = await analyticsCsv();
        filename = "analytics.csv";
        break;
      case "questions":
        body = await questionsCsv();
        filename = "community-questions.csv";
        break;
      case "talks":
        body = await talksCsv();
        filename = "talks.csv";
        break;
      case "research": {
        const orgId = await getOrgId();
        const rs = await prisma.researchEntry.findMany({ where: { orgId } });
        const header = ["recommendation", "platform", "category", "sourceName", "sourceUrl", "dateChecked", "ruleType", "confidence", "reviewBy", "verified"];
        const esc = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
        body = [header.join(","), ...rs.map((r) => [r.recommendation, r.platform, r.category, r.sourceName, r.sourceUrl, fmt(r.dateChecked, "yyyy-MM-dd"), r.ruleType, r.confidence, fmt(r.reviewBy, "yyyy-MM-dd"), r.verified].map(esc).join(","))].join("\n");
        filename = "research-library.csv";
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown export type" }, { status: 404 });
    }

    return new NextResponse(body, {
      headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="${filename}"` },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Export failed" }, { status: 500 });
  }
}
