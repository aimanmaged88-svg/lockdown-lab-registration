import { prisma, getOrgId } from "@/lib/db";
import { Card, Section, Badge, Stat, Empty, pillarTone } from "@/components/ui";
import { AddQuestionForm, QuestionActions, InboxActions } from "@/components/community/widgets";
import { ShareModeration } from "@/components/community/share-moderation";
import { CommunityBeta } from "@/components/community/beta";
import { FlagToggle } from "@/components/flag-toggle";
import { isEnabled } from "@/lib/flags";
import { fmt, isoDate } from "@/lib/time";
import Link from "next/link";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const orgId = await getOrgId();
  const betaOn = await isEnabled("community_beta");

  const questions = await prisma.communityQuestion.findMany({ where: { orgId }, orderBy: [{ status: "asc" }, { frequency: "desc" }] });
  const inbox = await prisma.inboxItem.findMany({ where: { orgId, status: "open" }, orderBy: { priority: "desc" }, take: 20 });

  // Community Signal Map — group open questions by pillar + problem.
  const open = questions.filter((q) => q.status === "open");
  const signal: Record<string, { count: number; asks: number; items: typeof open }> = {};
  for (const q of open) {
    const key = `${q.pillar ?? "General"} · ${q.problem ?? "misc"}`;
    (signal[key] ??= { count: 0, asks: 0, items: [] });
    signal[key].count += 1;
    signal[key].asks += q.frequency;
    signal[key].items.push(q);
  }
  const signalSorted = Object.entries(signal).sort((a, b) => b[1].asks - a[1].asks);

  // Release B data (only queried when beta on)
  let betaData = null as null | Parameters<typeof CommunityBeta>[0];
  if (betaOn) {
    const [spaces, posts, reports, invites, members] = await Promise.all([
      prisma.space.findMany({ where: { orgId }, orderBy: { order: "asc" } }),
      prisma.post.findMany({ where: { orgId }, include: { author: { select: { displayName: true } } }, orderBy: { createdAt: "desc" }, take: 40 }),
      prisma.report.findMany({ where: { orgId }, include: { post: { select: { body: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.invite.findMany({ where: {}, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.user.findMany({ where: { orgId }, orderBy: { createdAt: "asc" } }),
    ]);
    betaData = {
      spaces: spaces.map((s) => ({ id: s.id, key: s.key, name: s.name, readOnly: s.readOnly, locked: s.locked })),
      posts: posts.map((p) => ({ id: p.id, body: p.body, authorName: p.author.displayName, usefulCount: p.usefulCount, status: p.status, spaceId: p.spaceId, createdAt: isoDate(p.createdAt) })),
      reports: reports.map((r) => ({ id: r.id, reason: r.reason, detail: r.detail, postBody: r.post?.body ?? null, status: r.status })),
      invites: invites.map((i) => ({ code: i.code, email: i.email, acceptedAt: i.acceptedAt ? isoDate(i.acceptedAt) : null })),
      members: members.map((m) => ({ id: m.id, displayName: m.displayName, role: m.role, verifiedExpert: m.verifiedExpert })),
    };
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Turn comments and questions into content</p>
        <h1>Community</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Open questions" value={open.length} />
        <Stat label="Answered" value={questions.filter((q) => q.status === "answered").length} />
        <Stat label="Inbox" value={inbox.length} sub="needs attention" />
        <Stat label="Signal groups" value={signalSorted.length} />
      </div>

      <Section title="Log a comment or question" desc="If one person asked it, dozens wondered it.">
        <Card><AddQuestionForm /></Card>
      </Section>

      <Section title="Community Signal Map" desc="Questions grouped by pillar & problem. The biggest bar is your next Reel.">
        {signalSorted.length === 0 ? (
          <Empty title="No open questions." hint="Log a comment above to start mapping demand." />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {signalSorted.map(([key, g]) => (
              <Card key={key}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{key}</span>
                  <Badge tone="accent">{g.asks} asks</Badge>
                </div>
                <p className="text-xs text-grey mt-1">{g.count} distinct question{g.count > 1 ? "s" : ""}</p>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Question inbox" desc="Comment-to-Content: one click turns a question into a Reply Reel.">
        <div className="space-y-2">
          {questions.map((q) => (
            <Card key={q.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm">{q.text}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {q.pillar && <Badge tone={pillarTone(q.pillar)}>{q.pillar}</Badge>}
                    <Badge>{q.source}</Badge>
                    <Badge>asked {q.frequency}×</Badge>
                    <Badge tone={q.status === "answered" ? "good" : q.status === "planned" ? "warn" : "default"}>{q.status}</Badge>
                    {q.answeredContentId && <Link href={`/content/${q.answeredContentId}`} className="text-xs underline text-paper-dim">see the reel</Link>}
                    {q.contributorAcknowledged && <Badge tone="good">loop closed</Badge>}
                  </div>
                </div>
              </div>
              <div className="mt-3"><QuestionActions id={q.id} status={q.status} /></div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Unified inbox" desc="Comments, questions, reports and reminders in one place.">
        {inbox.length === 0 ? (
          <Empty title="You're caught up." />
        ) : (
          <div className="space-y-2">
            {inbox.map((it) => (
              <Card key={it.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge tone={it.type === "report" ? "bad" : it.type === "approval" ? "warn" : "default"}>{it.type}</Badge>
                    <span className="text-sm truncate">{it.title}</span>
                  </div>
                  {it.body && <p className="text-xs text-grey mt-0.5">{it.body}</p>}
                </div>
                {it.type === "approval" && it.refId ? <ShareModeration reflectionId={it.refId} /> : <InboxActions id={it.id} />}
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Release B — adult community beta */}
      <Section title="Adult community beta (Release B)" desc="Invite-only, adults 18+ only. Off by default.">
        <Card className="border-ink-line2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-grey" />
              <div>
                <div className="font-medium">Community beta is {betaOn ? "ON" : "OFF"}</div>
                <p className="text-sm text-grey">The account-based community is restricted to adults 18+. Younger players are served via public content, parents and coaches until legal/privacy/safeguarding reviews are done.</p>
              </div>
            </div>
            <FlagToggle flagKey="community_beta" enabled={betaOn} label={betaOn ? "Enabled" : "Enable"} />
          </div>
        </Card>
        {betaOn && betaData && <div className="mt-4"><CommunityBeta {...betaData} /></div>}
      </Section>
    </div>
  );
}
