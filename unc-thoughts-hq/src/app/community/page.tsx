import { prisma, getOrgId } from "@/lib/db";
import { Card, Section, Badge, Stat, Empty } from "@/components/ui";
import { AddQuestionForm, InboxActions } from "@/components/community/widgets";
import { QuestionInbox } from "@/components/community/question-inbox";
import { HuddleModeration } from "@/components/community/huddle-mod";
import { huddleQueue } from "@/lib/huddle-actions";
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

  // Accurate totals from cheap counts; render a capped, open-first slice so a
  // large backlog never bogs the desk down. Open questions are what need action,
  // so they come first (oldest first); recent answered give context.
  const [openCount, answeredCount, openQs, answeredQs] = await Promise.all([
    prisma.communityQuestion.count({ where: { orgId, status: "open" } }),
    prisma.communityQuestion.count({ where: { orgId, status: "answered" } }),
    prisma.communityQuestion.findMany({ where: { orgId, status: "open" }, orderBy: { createdAt: "asc" }, take: 250 }),
    prisma.communityQuestion.findMany({ where: { orgId, status: "answered" }, orderBy: { answeredAt: "desc" }, take: 50 }),
  ]);
  const questions = [...openQs, ...answeredQs];
  const huddle = await huddleQueue();
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
        <Stat label="Open questions" value={openCount} />
        <Stat label="Answered" value={answeredCount} />
        <Stat label="Inbox" value={inbox.length} sub="needs attention" />
        <Stat label="Signal groups" value={signalSorted.length} />
      </div>

      <Section title="🧪 Test drive — see it like a member" desc="Run the whole loop yourself in two minutes. What you see is exactly what they see.">
        <Card>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-paper-dim">
            <li><a className="underline" href="/member/question" target="_blank" rel="noreferrer">Open the member app in a new tab</a> — that tab is &quot;the kid&quot;. Pick a category, write a test question, tick <em>ping this phone</em>.</li>
            <li>Send it. Your phone buzzes (&quot;New question&quot;) and it lands in the inbox below — filter it by category.</li>
            <li>Tap <strong>Reply</strong> under it, write an answer, send. That one tap: teaches UNC&apos;s brain, closes the loop, pings the asker.</li>
            <li>Go back to the member tab: your question now shows <strong>✓ answered</strong> with your words under &quot;UNC says&quot;.</li>
          </ol>
          <p className="text-xs text-grey mt-2">Test questions are just questions — answer them or archive them from the inbox when you&apos;re done.</p>
        </Card>
      </Section>

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

      <Section title="Question inbox" desc="Members ask from the app (anonymous by default). Answer once: it teaches UNC, closes the loop, and pings the asker if they opted in.">
        <QuestionInbox
          questions={questions.map((q) => ({
            id: q.id, text: q.text, pillar: q.pillar, subcat: q.problem,
            audience: q.audience, askedBy: q.askedBy, source: q.source, frequency: q.frequency,
            status: q.status, notify: q.notify, fromMember: q.source === "member",
            answeredContentId: q.answeredContentId, contributorAcknowledged: q.contributorAcknowledged,
            createdAt: isoDate(q.createdAt),
          }))}
        />
      </Section>

      <Section title={`The Huddle — verify the conversation${huddle.pending.length ? ` (${huddle.pending.length} waiting)` : ""}`} desc="Topic talk from members. Nothing shows in the app until you tick it.">
        <HuddleModeration pending={huddle.pending} recentLive={huddle.recentLive} />
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
