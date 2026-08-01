import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, Section, Badge, pillarTone } from "@/components/ui";
import { ClipTools, ClipToContentButton, TalkQuestionTools, VoteButton } from "@/components/talks/widgets";
import { fmt } from "@/lib/time";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TalkDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await prisma.talk.findUnique({ where: { id }, include: { clips: true, questions: { orderBy: { votes: "desc" } } } });
  if (!t) notFound();
  const runSheet = t.runSheet ? (JSON.parse(t.runSheet) as { seg: string; min: number }[]) : [];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {t.pillar && <Badge tone={pillarTone(t.pillar)}>{t.pillar}</Badge>}
          {t.template && <Badge>{t.template}</Badge>}
          <Badge tone={t.status === "published" ? "good" : "default"}>{t.status}</Badge>
        </div>
        <h1 className="mt-2">{t.title}</h1>
        {t.scheduledAt && <p className="text-sm text-grey mt-1">{fmt(t.scheduledAt, "EEEE d MMM yyyy, h:mmaaa")}</p>}
        {t.guestName && <p className="text-sm text-grey">Guest: {t.guestName}{t.guestCredentials ? ` — ${t.guestCredentials}` : ""}</p>}
        {t.externalLink && <a href={t.externalLink} target="_blank" rel="noopener noreferrer" className="text-sm underline text-paper-dim">External live link</a>}
      </div>

      {t.isMedicalDisclaimer && (
        <Card className="border-warn/40">
          <p className="text-sm text-warn">This is a nutrition talk: content is <strong>general education, not individual medical advice</strong>. Encourage members to see a doctor or accredited dietitian for personal questions.</p>
        </Card>
      )}

      {runSheet.length > 0 && (
        <Section title="Run sheet">
          <Card>
            <ol className="text-sm text-paper-dim list-decimal list-inside space-y-1">
              {runSheet.map((s, i) => <li key={i}>{s.seg} <span className="text-grey">({s.min} min)</span></li>)}
            </ol>
          </Card>
        </Section>
      )}

      <Section title="Questions" desc="Adult members vote; the top ones shape the talk.">
        <Card className="space-y-3">
          <TalkQuestionTools talkId={t.id} />
          <div className="space-y-1.5">
            {t.questions.length === 0 && <p className="text-sm text-grey">No questions yet.</p>}
            {t.questions.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-2">
                <span className="text-sm">{q.text}</span>
                <VoteButton id={q.id} votes={q.votes} />
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Talk-to-Clips" desc="Turn the best moments into Reel tasks with one click.">
        <Card className="space-y-3">
          <ClipTools talkId={t.id} />
          <div className="space-y-2">
            {t.clips.length === 0 && <p className="text-sm text-grey">No clip ideas yet.</p>}
            {t.clips.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-line p-3">
                <div className="min-w-0">
                  <p className="text-sm">{c.idea}</p>
                  {c.turnedIntoContentId && <Link href={`/content/${c.turnedIntoContentId}`} className="text-xs underline text-paper-dim">open the reel task</Link>}
                </div>
                <ClipToContentButton clipId={c.id} done={!!c.turnedIntoContentId} />
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </div>
  );
}
