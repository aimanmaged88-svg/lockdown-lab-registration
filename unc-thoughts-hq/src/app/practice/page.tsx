import { prisma, getOrgId } from "@/lib/db";
import { Card, Section, Badge } from "@/components/ui";
import { fmt } from "@/lib/time";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab === "research" ? "research" : "lessons";
  const orgId = await getOrgId();

  const lessons = await prisma.practiceLesson.findMany({ where: { orgId }, orderBy: { topic: "asc" } });
  const research = await prisma.researchEntry.findMany({ where: { orgId }, orderBy: [{ category: "asc" }, { platform: "asc" }] });

  const now = new Date();
  const dueForReview = research.filter((r) => r.reviewBy < now).length;

  const byTopic: Record<string, typeof lessons> = {};
  for (const l of lessons) (byTopic[l.topic] ??= []).push(l);

  const byCat: Record<string, typeof research> = {};
  for (const r of research) (byCat[r.category] ??= []).push(r);

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Learn the craft · cite the sources</p>
        <h1>Practice Library</h1>
      </div>

      <div className="flex gap-1 border-b border-ink-line">
        <Link href="/practice" className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === "lessons" ? "border-paper text-paper" : "border-transparent text-grey"}`}>Lessons ({lessons.length})</Link>
        <Link href="/practice?tab=research" className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === "research" ? "border-paper text-paper" : "border-transparent text-grey"}`}>Research library ({research.length})</Link>
      </div>

      {tab === "lessons" ? (
        <div className="space-y-8">
          {Object.entries(byTopic).map(([topic, items]) => (
            <Section key={topic} title={topic}>
              <div className="space-y-2">
                {items.map((l) => {
                  const checklist = JSON.parse(l.checklist) as string[];
                  return (
                    <details key={l.id} className="card group">
                      <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                        <span className="font-medium">{l.title}</span>
                        <Badge tone={l.confidence === "high" ? "good" : l.confidence === "low" ? "bad" : "warn"}>{l.confidence}</Badge>
                      </summary>
                      <div className="mt-3 space-y-3 text-sm">
                        <div><span className="label">2-minute version</span><p className="text-paper-dim">{l.quickVersion}</p></div>
                        <div><span className="label">The deeper version</span><p className="text-paper-dim">{l.deep}</p></div>
                        <div><span className="label">Why it matters</span><p className="text-paper-dim">{l.whyMatters}</p></div>
                        <div>
                          <span className="label">Checklist</span>
                          <ul className="text-paper-dim space-y-0.5">{checklist.map((c) => <li key={c}>□ {c}</li>)}</ul>
                        </div>
                        <div><span className="label">Practical exercise</span><p className="text-paper-dim">{l.exercise}</p></div>
                        {l.sourceUrl && (
                          <div><span className="label">Source</span>
                            <a href={l.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline text-paper-dim">{l.sourceName}</a>
                            {l.dateChecked && <span className="text-grey"> · checked {fmt(l.dateChecked)}</span>}
                          </div>
                        )}
                        <div className="flex gap-2 pt-1">
                          <Link href={`/content/new`} className="btn text-xs">Test this in a Reel</Link>
                          <Link href={`/growth`} className="btn btn-ghost text-xs">Make it an experiment</Link>
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </Section>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {dueForReview > 0 && (
            <Card className="border-warn/40">
              <div className="eyebrow text-warn mb-1">What changed?</div>
              <p className="text-sm text-paper-dim">{dueForReview} entr{dueForReview === 1 ? "y is" : "ies are"} past their review date. Platform guidance changes — re-verify these against the official source and update the date.</p>
            </Card>
          )}
          {Object.entries(byCat).map(([cat, items]) => (
            <Section key={cat} title={cat}>
              <div className="space-y-2">
                {items.map((r) => {
                  const stale = r.reviewBy < now;
                  return (
                    <Card key={r.id}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-medium min-w-0">{r.recommendation}</p>
                        <div className="flex gap-1 shrink-0">
                          <Badge>{r.platform}</Badge>
                          <Badge tone={r.ruleType === "official_rule" ? "good" : r.ruleType === "experiment" ? "accent" : "warn"}>{r.ruleType.replace("_", " ")}</Badge>
                          <Badge tone={r.verified ? "good" : "bad"}>{r.verified ? "verified" : "needs verification"}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-grey mt-1">Why for UNC: {r.whyForUnc}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-grey">
                        <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{r.sourceName}</a>
                        <span>· checked {fmt(r.dateChecked)}</span>
                        <span className={stale ? "text-warn" : ""}>· review by {fmt(r.reviewBy)}{stale ? " (due)" : ""}</span>
                        <Badge tone={r.confidence === "high" ? "good" : r.confidence === "low" ? "bad" : "warn"}>{r.confidence}</Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Section>
          ))}
        </div>
      )}
    </div>
  );
}
