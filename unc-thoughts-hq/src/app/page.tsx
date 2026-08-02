import { Card, Section, Badge, Stat, Empty, LinkButton, Progress, pillarTone } from "@/components/ui";
import { Checklist } from "@/components/checklist";
import { ContentActions } from "@/components/content-actions";
import { TwentyMinuteMode } from "@/components/twenty-minute";
import { PostNowButton } from "@/components/post-now";
import { NotifyButton } from "@/components/notify-button";
import { getTodayContent, getOverdue, getWeekProgress, getRecommendations, getInboxCounts } from "@/lib/queries";
import { prisma, getOrgId } from "@/lib/db";
import { CHECKLIST_STEPS } from "@/lib/enums";
import { fmt } from "@/lib/time";
import Link from "next/link";
import { AlertTriangle, MessageSquare, Sparkles, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

const WHY = Object.fromEntries(CHECKLIST_STEPS.map((s) => [s.kind, s.why]));

export default async function TodayPage() {
  const orgId = await getOrgId();
  const [todays, overdue, week, { recs, nba }, inbox, readyBank] = await Promise.all([
    getTodayContent(),
    getOverdue(),
    getWeekProgress(),
    getRecommendations(),
    getInboxCounts(),
    prisma.content.findMany({ where: { orgId, status: "Ready", postedAt: null }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const focus = todays[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{fmt(new Date(), "EEEE d MMMM yyyy")} · Australia/Sydney</p>
          <h1>Today</h1>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/content/new" primary>+ New content</LinkButton>
          <LinkButton href="/review">Weekly review</LinkButton>
        </div>
      </div>

      {/* The single next best action */}
      <Card className="border-paper/20 bg-ink-soft">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 text-paper-dim shrink-0" size={20} />
          <div className="min-w-0">
            <div className="eyebrow">The single next best action</div>
            {nba ? (
              <>
                <p className="text-lg font-medium mt-1">{nba.title}</p>
                <p className="text-sm text-grey mt-1">{nba.reason}</p>
                {nba.refId && (
                  <div className="mt-3">
                    <LinkButton href={nba.kind === "comment_to_reel" ? `/community` : `/content/${nba.refId}`}>Open</LinkButton>
                  </div>
                )}
              </>
            ) : (
              <p className="text-grey mt-1">You&apos;re on top of it. Pick tomorrow&apos;s idea or bank one in Content.</p>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="This week" value={`${week.posted}/${week.planned}`} sub="posted / planned" />
        <Stat label="Completed" value={week.complete} sub="fully wrapped" />
        <Stat label="Overdue" value={overdue.length} sub={overdue.length ? "needs a decision" : "nothing overdue"} />
        <Stat label="Questions" value={inbox.openQuestions} sub="awaiting a reply" />
      </div>

      {/* Weekly progress bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-grey">Weekly progress</span>
          <span className="text-grey">{week.planned ? Math.round((week.posted / week.planned) * 100) : 0}%</span>
        </div>
        <Progress value={week.posted} max={Math.max(1, week.planned)} />
      </div>

      {/* 20-minute mode */}
      <TwentyMinuteMode
        hasFocus={!!focus}
        focusId={focus?.id}
        openQuestions={inbox.openQuestions}
      />

      {/* Ready to go — the Post Bank shelf. Never be caught with nothing. */}
      <Section
        title="Ready to go"
        desc="Word posts from your bank — pick one, post it, tap done."
        action={<LinkButton href="/compose" primary>+ Compose</LinkButton>}
      >
        {readyBank.length === 0 ? (
          <Card className="flex items-center justify-between gap-3">
            <p className="text-sm text-grey">The bank is empty. Two minutes in Compose fixes that.</p>
            <LinkButton href="/compose">Make 5 drafts</LinkButton>
          </Card>
        ) : (
          <div className="space-y-2">
            {readyBank.map((c) => (
              <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Zap size={13} className="text-paper-dim shrink-0" />
                    <Link href={`/content/${c.id}`} className="text-sm font-medium hover:underline truncate">{c.title}</Link>
                  </div>
                  {c.caption && <p className="text-xs text-grey mt-0.5 line-clamp-2 whitespace-pre-wrap max-w-xl">{c.caption}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={pillarTone(c.pillar)}>{c.pillar}</Badge>
                  <PostNowButton id={c.id} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Phone notifications */}
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-medium text-sm">Phone notifications</div>
          <p className="text-xs text-grey">Morning brief + evening check-in. Calm, not needy.</p>
        </div>
        <NotifyButton compact />
      </Card>

      {/* Overdue */}
      {overdue.length > 0 && (
        <Section title="Overdue" desc="Don't let these sit. Post, simplify, reschedule or skip with a reason.">
          <div className="space-y-2">
            {overdue.map((c) => (
              <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <AlertTriangle size={16} className="text-warn shrink-0" />
                  <div className="min-w-0">
                    <Link href={`/content/${c.id}`} className="font-medium hover:underline">{c.title}</Link>
                    <div className="text-xs text-grey">Planned {fmt(c.plannedDate)} · {c.pillar}</div>
                  </div>
                </div>
                <ContentActions id={c.id} compact />
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Today's planned content + checklist */}
      <Section
        title="Today's content"
        desc={focus ? "Tick off each step. It all persists." : undefined}
        action={<LinkButton href="/calendar">See calendar</LinkButton>}
      >
        {todays.length === 0 ? (
          <Empty
            title="Nothing planned for today."
            hint="Import your roadmap or add a piece of content to get started."
            action={<div className="flex gap-2 justify-center"><LinkButton href="/content/new" primary>+ New content</LinkButton><LinkButton href="/settings">Import roadmap</LinkButton></div>}
          />
        ) : (
          <div className="space-y-4">
            {todays.map((c) => (
              <Card key={c.id}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge tone={pillarTone(c.pillar)}>{c.pillar}</Badge>
                      {c.series && <Badge>{c.series}</Badge>}
                      <Badge>{c.format}</Badge>
                      {c.reelSeconds && <Badge>{c.reelSeconds}s</Badge>}
                      <Badge tone={c.status === "Posted" || c.status === "Complete" ? "good" : "default"}>{c.status}</Badge>
                    </div>
                    <Link href={`/content/${c.id}`} className="block text-lg font-medium mt-2 hover:underline">{c.title}</Link>
                    {c.hook && <p className="text-sm text-grey mt-1">Hook: &ldquo;{c.hook}&rdquo;</p>}
                    {c.question && <p className="text-sm text-grey">Question: &ldquo;{c.question}&rdquo;</p>}
                  </div>
                </div>
                {c.tasks.length > 0 ? (
                  <Checklist tasks={c.tasks.map((t) => ({ id: t.id, kind: t.kind, label: t.label, done: t.done }))} whyMap={WHY} />
                ) : (
                  <p className="text-sm text-grey">Open this item to generate its production checklist.</p>
                )}
                <div className="mt-4 pt-4 border-t border-ink-line">
                  <ContentActions id={c.id} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Why-it-matters recommendations */}
      {recs.length > 0 && (
        <Section title="Why these matter" desc="Plain-language recommendations. Nothing is moved or posted for you.">
          <div className="grid md:grid-cols-2 gap-3">
            {recs.slice(0, 6).map((r) => (
              <Card key={r.id}>
                <div className="flex items-center gap-2">
                  <Badge tone={r.confidence === "high" ? "good" : r.confidence === "low" ? "bad" : "warn"}>{r.confidence} confidence</Badge>
                  {r.kind === "comment_to_reel" && <MessageSquare size={14} className="text-grey" />}
                </div>
                <p className="font-medium mt-2">{r.title}</p>
                <p className="text-sm text-grey mt-1">{r.reason}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
