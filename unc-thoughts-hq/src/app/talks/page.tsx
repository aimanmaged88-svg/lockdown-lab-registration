import { prisma, getOrgId } from "@/lib/db";
import { Card, Section, Badge, Empty, pillarTone } from "@/components/ui";
import { CreateTalkForm } from "@/components/talks/widgets";
import { TALK_TEMPLATES } from "@/lib/enums";
import { fmt } from "@/lib/time";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TalksPage() {
  const orgId = await getOrgId();
  const talks = await prisma.talk.findMany({ where: { orgId }, include: { clips: true, questions: true }, orderBy: { scheduledAt: "desc" } });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Live or recorded community conversations</p>
        <h1>Talks</h1>
      </div>

      <Section title="Plan a talk" desc="Uses external links for live — no expensive streaming infrastructure.">
        <Card><CreateTalkForm /></Card>
      </Section>

      <Card>
        <div className="eyebrow mb-2">Templates</div>
        <div className="flex flex-wrap gap-2">
          {TALK_TEMPLATES.map((t) => <span key={t} className="chip">{t}</span>)}
        </div>
      </Card>

      <Section title="Your talks">
        {talks.length === 0 ? (
          <Empty title="No talks yet." hint="Plan one above — one talk can feed a week of Reels." />
        ) : (
          <div className="space-y-2">
            {talks.map((t) => (
              <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/talks/${t.id}`} className="font-medium hover:underline">{t.title}</Link>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {t.pillar && <Badge tone={pillarTone(t.pillar)}>{t.pillar}</Badge>}
                    {t.template && <Badge>{t.template}</Badge>}
                    <Badge tone={t.status === "published" ? "good" : "default"}>{t.status}</Badge>
                    {t.scheduledAt && <span className="text-xs text-grey">{fmt(t.scheduledAt, "EEE d MMM, h:mmaaa")}</span>}
                    {t.isMedicalDisclaimer && <Badge tone="warn">general education</Badge>}
                  </div>
                </div>
                <div className="text-xs text-grey">{t.clips.length} clips · {t.questions.length} questions</div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
