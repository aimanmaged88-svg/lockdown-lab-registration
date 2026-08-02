import { prisma, getOrgId } from "@/lib/db";
import { Card, Section, Badge, Stat, Empty, pillarTone } from "@/components/ui";
import { NewItemToggle, ApprovalButtons, EditToggle } from "@/components/brain/brain-editor";
import { fmt } from "@/lib/time";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Unk's Brain: the owner-controlled knowledge base behind every member answer,
// plus the learning-loop insights. Only APPROVED items are used in answers.
export default async function BrainPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: tabParam } = await searchParams;
  const tab = tabParam === "insights" ? "insights" : "knowledge";
  const orgId = await getOrgId();

  const [items, logs, memberCount] = await Promise.all([
    prisma.knowledgeItem.findMany({ where: { orgId, approval: { not: "archived" } }, include: { versions: { orderBy: { version: "desc" } } }, orderBy: [{ approval: "asc" }, { pillar: "asc" }, { title: "asc" }] }),
    prisma.askLog.findMany({ where: { orgId }, orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.member.count({ where: { orgId } }),
  ]);

  const approved = items.filter((i) => i.approval === "approved");
  const itemTitle = new Map(items.map((i) => [i.id, i.title] as const));

  // Insights (aggregate only; trends gated behind a minimum member count).
  const norm = (q: string) => q.toLowerCase().replace(/\d+/g, "#").slice(0, 70);
  const freq = new Map<string, { text: string; n: number }>();
  for (const l of logs) {
    const k = norm(l.question);
    const e = freq.get(k);
    if (e) e.n++;
    else freq.set(k, { text: l.question, n: 1 });
  }
  const frequent = [...freq.values()].sort((a, b) => b.n - a.n).slice(0, 8);
  const unsupported = logs.filter((l) => !l.supported).slice(0, 8);
  const unclear = logs.filter((l) => l.unclear).slice(0, 8);
  const escalations = logs.filter((l) => l.escalated);
  const trendsOk = memberCount >= 5;

  const popularActions = await prisma.reflection.groupBy({
    by: ["actionChosen"],
    where: { member: { orgId }, actionChosen: { not: null } },
    _count: { actionChosen: true },
    orderBy: { _count: { actionChosen: "desc" } },
    take: 8,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Only approved teaching reaches members</p>
          <h1>Unk&apos;s Brain</h1>
        </div>
        <Link href="/member" className="btn">Open member view</Link>
      </div>

      <div className="flex gap-1 border-b border-ink-line">
        <Link href="/brain" className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === "knowledge" ? "border-paper text-paper" : "border-transparent text-grey"}`}>Knowledge ({items.length})</Link>
        <Link href="/brain?tab=insights" className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === "insights" ? "border-paper text-paper" : "border-transparent text-grey"}`}>Insights ({logs.length} asks)</Link>
      </div>

      {tab === "knowledge" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Approved" value={approved.length} sub="usable in answers" />
            <Stat label="Drafts" value={items.length - approved.length} />
            <Stat label="Needs review" value={items.filter((i) => !i.reviewedAt).length} sub="source not re-verified" />
          </div>
          <NewItemToggle />
          <div className="space-y-2">
            {items.map((i) => (
              <Card key={i.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={pillarTone(i.pillar)}>{i.pillar}</Badge>
                      <Badge>{i.kind}</Badge>
                      <Badge tone={i.approval === "approved" ? "good" : "warn"}>{i.approval}</Badge>
                      {i.safetyClass !== "general" && <Badge tone="accent">{i.safetyClass}</Badge>}
                      {!i.reviewedAt && <Badge tone="bad">review source</Badge>}
                      <span className="text-[11px] text-grey">v{i.version}{i.versions.length ? ` · ${i.versions.length} past version${i.versions.length > 1 ? "s" : ""}` : ""}</span>
                    </div>
                    <p className="font-medium mt-1.5">{i.title}</p>
                    <p className="text-xs text-grey mt-0.5">
                      {i.author} · added {fmt(i.addedAt)}{i.reviewedAt ? ` · reviewed ${fmt(i.reviewedAt)}` : ""}
                      {i.source && <> · <a className="underline" href={i.sourceUrl ?? "#"} target="_blank" rel="noopener noreferrer">{i.source}</a></>}
                    </p>
                  </div>
                  <ApprovalButtons id={i.id} approval={i.approval} />
                </div>
                <details className="mt-2">
                  <summary className="text-xs text-grey cursor-pointer">Show content{i.versions.length ? " + version history" : ""}</summary>
                  <pre className="text-xs text-paper-dim whitespace-pre-wrap mt-2 font-mono">{i.body}</pre>
                  {i.versions.map((vv) => (
                    <details key={vv.id} className="mt-1 ml-2">
                      <summary className="text-[11px] text-grey cursor-pointer">v{vv.version} — {fmt(vv.editedAt, "d MMM, h:mmaaa")}</summary>
                      <pre className="text-[11px] text-grey whitespace-pre-wrap mt-1 font-mono">{vv.body}</pre>
                    </details>
                  ))}
                </details>
                <EditToggle id={i.id} initial={{ kind: i.kind, title: i.title, pillar: i.pillar, audience: i.audience, body: i.body, tags: i.tags ? (JSON.parse(i.tags) as string[]).join(", ") : "", source: i.source ?? "", sourceUrl: i.sourceUrl ?? "", safetyClass: i.safetyClass }} />
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Questions asked" value={logs.length} />
            <Stat label="Couldn't answer" value={logs.filter((l) => !l.supported).length} sub="honest misses to fix" />
            <Stat label="Escalated" value={escalations.length} sub="sent to humans" />
            <Stat label="Members" value={memberCount} />
          </div>

          <Section title="Frequently asked" desc="What members actually want to know — future Reels live here.">
            {frequent.length === 0 ? <Empty title="No questions yet." /> : (
              <div className="space-y-1.5">{frequent.map((f, i) => (
                <Card key={i} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm">{f.text}</span><Badge>{f.n}×</Badge>
                </Card>
              ))}</div>
            )}
          </Section>

          <Section title="Weak knowledge coverage" desc="Asks the Brain couldn't support — add or approve teaching for these.">
            {unsupported.length === 0 ? <Empty title="No gaps found yet." /> : (
              <div className="space-y-1.5">{unsupported.map((l) => (
                <Card key={l.id} className="py-2.5"><span className="text-sm">{l.question}</span> <span className="text-xs text-grey">· {fmt(l.createdAt)}</span></Card>
              ))}</div>
            )}
          </Section>

          <Section title="Marked unclear" desc="Members said these answers didn't land — guidance to sharpen or send for professional review.">
            {unclear.length === 0 ? <Empty title="Nothing marked unclear." /> : (
              <div className="space-y-1.5">{unclear.map((l) => (
                <Card key={l.id} className="py-2.5"><span className="text-sm">{l.question}</span></Card>
              ))}</div>
            )}
          </Section>

          <Section title="Popular quick actions" desc="What members commit to after prompts.">
            {popularActions.length === 0 ? <Empty title="No actions chosen yet." /> : (
              <div className="flex flex-wrap gap-1.5">
                {popularActions.map((a) => <span key={a.actionChosen} className="chip">{a.actionChosen} · {a._count.actionChosen}</span>)}
              </div>
            )}
          </Section>

          <Section title="Recent answers — what informed them" desc="Owner-facing trace: each answer and the approved items it drew on.">
            <div className="space-y-1.5">
              {logs.slice(0, 12).map((l) => {
                const used = l.usedItemIds ? (JSON.parse(l.usedItemIds) as string[]) : [];
                return (
                  <Card key={l.id} className="py-2.5">
                    <p className="text-sm">{l.question}</p>
                    <p className="text-xs text-grey mt-0.5">
                      {l.intent}{l.timeBand ? ` · ${l.timeBand}` : ""} · {l.escalated ? "escalated" : l.supported ? (used.length ? `used: ${used.map((id) => itemTitle.get(id) ?? "deleted item").join(" · ")}` : "safety response") : "unsupported"}
                    </p>
                  </Card>
                );
              })}
            </div>
          </Section>

          {!trendsOk && <p className="text-xs text-grey">Aggregate member trends unlock at 5+ members — small numbers would expose individuals.</p>}
        </div>
      )}
    </div>
  );
}
