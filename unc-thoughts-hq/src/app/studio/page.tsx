import { prisma, getOrgId } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { StudioTabs } from "@/components/studio/studio-tabs";
import { lintNutrition } from "@/lib/nutrition-safety";
import { fmt } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ content?: string; tab?: string }> }) {
  const sp = await searchParams;
  const orgId = await getOrgId();

  const selected = sp.content
    ? await prisma.content.findUnique({ where: { id: sp.content }, select: { id: true, title: true, hook: true, script: true, caption: true, pillar: true } })
    : null;

  const batchCandidates = await prisma.content.findMany({
    where: { orgId, postedAt: null, status: { notIn: ["Skipped", "Complete"] } },
    select: { id: true, title: true, pillar: true, format: true, recordingLocation: true, equipmentUsed: true },
    orderBy: { plannedDate: "asc" },
    take: 30,
  });

  const nutritionFlags =
    selected && selected.pillar === "Nutrition"
      ? lintNutrition([selected.caption, selected.script].filter(Boolean).join("\n")).map((f) => ({ category: f.category, message: f.message, suggestion: f.suggestion }))
      : undefined;

  const sessions = await prisma.batchSession.findMany({
    where: { orgId },
    include: { items: { include: { content: { select: { title: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const tabMap: Record<string, string> = { preflight: "Preflight", guided: "Guided", batch: "Batch Day" };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Set up, record, and check before you post</p>
        <h1>Recording Studio</h1>
      </div>

      <StudioTabs
        selected={selected}
        batchCandidates={batchCandidates}
        nutritionFlags={nutritionFlags}
        defaultTab={sp.tab ? tabMap[sp.tab] : undefined}
      />

      {sessions.length > 0 && (
        <div className="space-y-2">
          <div className="eyebrow">Recent Batch Day sessions</div>
          {sessions.map((s) => (
            <Card key={s.id} className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-grey">{s.minutes} min · grouped by {s.groupBy} · {s.items.length} Reels · {fmt(s.createdAt)}</div>
              </div>
              <Badge tone={s.status === "done" ? "good" : "default"}>{s.status}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
