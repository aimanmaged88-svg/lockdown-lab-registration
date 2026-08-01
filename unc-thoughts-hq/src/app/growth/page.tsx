import { prisma, getOrgId } from "@/lib/db";
import { Card, Section, Badge, Stat, Empty } from "@/components/ui";
import { CreateExperiment, DecideExperiment, SaveWinningPattern } from "@/components/growth/widgets";
import { REPURPOSE_TARGETS } from "@/lib/coach-content";
import { EXPERIMENT_TYPES } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function GrowthPage() {
  const orgId = await getOrgId();

  const [questions, snaps, talks, replyReels, followups, experiments, patterns, contentOptions] = await Promise.all([
    prisma.communityQuestion.findMany({ where: { orgId } }),
    prisma.analyticsSnapshot.findMany({ where: { content: { orgId } } }),
    prisma.talk.findMany({ where: { orgId }, include: { questions: true } }),
    prisma.content.count({ where: { orgId, format: "ReplyReel" } }),
    prisma.content.count({ where: { orgId, followUpOfId: { not: null } } }),
    prisma.experiment.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } }),
    prisma.winningPattern.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } }),
    prisma.content.findMany({ where: { orgId }, select: { id: true, title: true }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  const saves = snaps.reduce((a, s) => a + (s.saves ?? 0), 0);
  const shares = snaps.reduce((a, s) => a + (s.shares ?? 0), 0);
  const repeatedAsks = questions.reduce((a, q) => a + Math.max(0, q.frequency - 1), 0);
  const talkVotes = talks.reduce((a, t) => a + t.questions.reduce((b, q) => b + q.votes, 0), 0);
  const requested = questions.length;

  // Transparent Community Demand Score — NOT an official Instagram metric.
  const demand = repeatedAsks * 3 + Math.round(saves / 10) + shares * 2 + talkVotes * 2 + requested;

  const expType = (k: string) => EXPERIMENT_TYPES.find((t) => t.key === k)?.label ?? k;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Useful behaviour over vanity metrics</p>
        <h1>Growth Lab</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Saves (total)" value={saves} />
        <Stat label="Shares (total)" value={shares} />
        <Stat label="Questions received" value={requested} />
        <Stat label="Reply Reels made" value={replyReels} />
        <Stat label="Follow-ups" value={followups} />
        <Stat label="Talk votes" value={talkVotes} />
        <Stat label="Repeated asks" value={repeatedAsks} />
        <Stat label="Talks" value={talks.length} />
      </div>

      <Section title="Community Demand Score" desc="A transparent, home-grown score — NOT an official Instagram metric.">
        <Card>
          <div className="text-4xl font-display font-semibold">{demand}</div>
          <div className="mt-3 text-sm text-grey space-y-1">
            <p>How it&apos;s calculated:</p>
            <ul className="list-disc list-inside">
              <li>Repeated asks × 3 = {repeatedAsks * 3}</li>
              <li>Saves ÷ 10 = {Math.round(saves / 10)}</li>
              <li>Shares × 2 = {shares * 2}</li>
              <li>Talk question votes × 2 = {talkVotes * 2}</li>
              <li>Distinct questions × 1 = {requested}</li>
            </ul>
            <p className="text-xs">It reflects demand for useful conversations, not follower count.</p>
          </div>
        </Card>
      </Section>

      <Section title="Experiment Lab" desc="Structured tests, including Instagram Trial Reels. Require a hypothesis; never call a winner on one post.">
        <Card className="mb-3"><CreateExperiment contentOptions={contentOptions} /></Card>
        {experiments.length === 0 ? (
          <Empty title="No experiments yet." />
        ) : (
          <div className="space-y-2">
            {experiments.map((e) => (
              <Card key={e.id}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><Badge tone="accent">{expType(e.type)}</Badge><Badge tone={e.status === "decided" ? "good" : "default"}>{e.status}</Badge></div>
                    <p className="text-sm mt-1">{e.hypothesis}</p>
                    <p className="text-xs text-grey mt-0.5">Variable: {e.variable || "—"} · Held constant: {e.heldConstant || "—"} · Min sample: {e.minSample}</p>
                    {e.result && <p className="text-sm mt-1">Result: {e.result} {e.decision && <Badge>{e.decision}</Badge>} {e.confidence && <Badge tone={e.confidence === "high" ? "good" : "warn"}>{e.confidence}</Badge>}</p>}
                  </div>
                </div>
                {e.status !== "decided" && <DecideExperiment id={e.id} />}
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Winning Pattern Library" desc="Repeatable combos of topic, format, hook, duration and audience that perform.">
        <Card className="mb-3"><SaveWinningPattern /></Card>
        {patterns.length === 0 ? (
          <Empty title="No saved patterns yet." />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {patterns.map((p) => (
              <Card key={p.id}>
                <div className="font-medium">{p.topic}</div>
                <p className="text-sm text-grey mt-1">{p.format} · {p.duration}s · {p.audience}</p>
                <p className="text-sm mt-1">Hook: &ldquo;{p.hook}&rdquo;</p>
                {p.evidence && <p className="text-xs text-grey mt-1">{p.evidence}</p>}
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Repurpose Map" desc="One idea, many surfaces. Turn a winner into a week of touchpoints.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {REPURPOSE_TARGETS.map((r) => (
            <Card key={r.key}>
              <div className="font-medium text-sm">{r.label}</div>
              <p className="text-xs text-grey mt-1">{r.note}</p>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
