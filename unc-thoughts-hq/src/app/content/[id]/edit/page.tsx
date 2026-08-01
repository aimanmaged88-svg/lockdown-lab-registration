import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ContentForm } from "@/components/content-form";
import { isoDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function EditContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.content.findUnique({ where: { id } });
  if (!c) notFound();
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Edit</p>
        <h1>{c.title}</h1>
      </div>
      <ContentForm
        initial={{
          id: c.id,
          title: c.title,
          pillar: c.pillar,
          series: c.series ?? undefined,
          audience: c.audience,
          format: c.format,
          reelSeconds: c.reelSeconds,
          hook: c.hook ?? undefined,
          script: c.script ?? undefined,
          teachingPoints: c.teachingPoints ?? undefined,
          caption: c.caption ?? undefined,
          question: c.question ?? undefined,
          highlight: c.highlight ?? undefined,
          plannedDate: c.plannedDate ? isoDate(c.plannedDate) : undefined,
          status: c.status,
          notes: c.notes ?? undefined,
          instagramUrl: c.instagramUrl ?? undefined,
          recordingLocation: c.recordingLocation ?? undefined,
          equipmentUsed: c.equipmentUsed ?? undefined,
        }}
      />
    </div>
  );
}
