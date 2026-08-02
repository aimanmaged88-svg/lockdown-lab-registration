import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, Section, Badge, LinkButton, pillarTone } from "@/components/ui";
import { Checklist } from "@/components/checklist";
import { ContentActions } from "@/components/content-actions";
import { CopyCaption } from "@/components/copy-caption";
import { EnsureTasksButton } from "@/components/ensure-tasks";
import { CHECKLIST_STEPS } from "@/lib/enums";
import { fmt } from "@/lib/time";
import { engagementRateByReach, saveRate, averageRetention, pct } from "@/lib/analytics";
import Link from "next/link";

export const dynamic = "force-dynamic";
const WHY = Object.fromEntries(CHECKLIST_STEPS.map((s) => [s.kind, s.why]));

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="label">{label}</div>
      <p className="text-sm text-paper whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default async function ContentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.content.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { createdAt: "asc" } },
      analytics: { orderBy: { capturedAt: "desc" } },
      preflight: true,
      collaborator: true,
      sourceQuestion: true,
      followUps: true,
    },
  });
  if (!c) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={pillarTone(c.pillar)}>{c.pillar}</Badge>
            {c.series && <Badge>{c.series}</Badge>}
            <Badge>{c.format}</Badge>
            {c.reelSeconds && <Badge>{c.reelSeconds}s</Badge>}
            <Badge>{c.audience}</Badge>
            {c.isTrialReel && <Badge tone="accent">Trial Reel</Badge>}
            <Badge tone={["Posted", "Complete"].includes(c.status) ? "good" : "default"}>{c.status}</Badge>
          </div>
          <h1 className="mt-2">{c.title}</h1>
          <p className="text-sm text-grey mt-1">
            {c.plannedDate ? `Planned ${fmt(c.plannedDate)}` : "No planned date"}
            {c.postedAt && ` · Posted ${fmt(c.postedAt)}`}
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton href={`/content/${c.id}/edit`}>Edit</LinkButton>
          <LinkButton href={`/studio?content=${c.id}`} primary>Recording Studio</LinkButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {c.caption && <CopyCaption caption={c.caption} question={c.question} />}
      </div>
      <ContentActions id={c.id} />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <Field label="Hook" value={c.hook} />
          <Field label="Spoken script" value={c.script} />
          <Field label="Teaching points" value={c.teachingPoints} />
          <Field label="Caption" value={c.caption} />
          <Field label="Conversation question" value={c.question} />
          <Field label="Highlight" value={c.highlight} />
          <Field label="Notes" value={c.notes} />
          {c.instagramUrl && (
            <div>
              <div className="label">Instagram URL</div>
              <a href={c.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline text-paper-dim break-all">{c.instagramUrl}</a>
            </div>
          )}
          {c.sourceQuestion && (
            <div>
              <div className="label">From community question</div>
              <p className="text-sm text-paper">&ldquo;{c.sourceQuestion.text}&rdquo;</p>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          {/* Checklist */}
          <Card>
            {c.tasks.length > 0 ? (
              <Checklist tasks={c.tasks.map((t) => ({ id: t.id, kind: t.kind, label: t.label, done: t.done }))} whyMap={WHY} />
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-grey mb-3">No production checklist yet.</p>
                <EnsureTasksButton contentId={c.id} />
              </div>
            )}
          </Card>

          {/* Preflight */}
          <Card>
            <div className="flex items-center justify-between">
              <span className="eyebrow">Reel preflight</span>
              {c.preflight ? (
                <Badge tone={c.preflight.passed ? "good" : "warn"}>{c.preflight.passed ? "Passed" : "Not passed"}</Badge>
              ) : (
                <Badge>Not run</Badge>
              )}
            </div>
            <p className="text-sm text-grey mt-2">Run the checker in the Recording Studio before you mark this Ready.</p>
            <div className="mt-3"><LinkButton href={`/studio?content=${c.id}&tab=preflight`}>Open preflight</LinkButton></div>
          </Card>
        </div>
      </div>

      {/* Analytics */}
      <Section title="Analytics snapshots" desc="24h, 7d and 30d reads. Rates guard against divide-by-zero and show honestly." action={<LinkButton href={`/analytics?content=${c.id}`}>+ Record analytics</LinkButton>}>
        {c.analytics.length === 0 ? (
          <p className="text-sm text-grey">No analytics recorded yet.</p>
        ) : (
          <div className="overflow-x-auto card p-0">
            <table className="w-full text-sm">
              <thead className="text-left text-grey border-b border-ink-line">
                <tr>
                  <th className="p-3">Window</th><th className="p-3">Reach</th><th className="p-3">Saves</th>
                  <th className="p-3">Shares</th><th className="p-3">ER (reach)</th><th className="p-3">Save rate</th>
                  <th className="p-3">Retention</th><th className="p-3">Confirmed</th>
                </tr>
              </thead>
              <tbody>
                {c.analytics.map((s) => (
                  <tr key={s.id} className="border-b border-ink-line/60">
                    <td className="p-3"><Badge>{s.window}</Badge></td>
                    <td className="p-3">{s.reach ?? "—"}</td>
                    <td className="p-3">{s.saves ?? "—"}</td>
                    <td className="p-3">{s.shares ?? "—"}</td>
                    <td className="p-3">{pct(engagementRateByReach(s))}</td>
                    <td className="p-3">{pct(saveRate(s))}</td>
                    <td className="p-3">{pct(averageRetention(s))}</td>
                    <td className="p-3">{s.confirmed ? <Badge tone="good">yes</Badge> : <Badge tone="warn">no</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {c.followUps.length > 0 && (
        <Section title="Follow-ups">
          <div className="space-y-2">
            {c.followUps.map((f) => (
              <Card key={f.id}><Link href={`/content/${f.id}`} className="hover:underline">{f.title}</Link></Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
