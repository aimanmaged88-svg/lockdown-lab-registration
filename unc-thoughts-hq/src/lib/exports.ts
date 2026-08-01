import { prisma, getOrgId } from "./db";
import { fmt, weekStart, isoDate } from "./time";
import { addDays } from "date-fns";
import {
  engagementRateByReach,
  saveRate,
  averageRetention,
  pct,
} from "./analytics";

// Exports & backups. The weekly Markdown is written to be pasted straight into
// Codex/Claude for analysis: clean headings, plain numbers, no fluff.

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const lines = [cols.join(",")];
  for (const r of rows) lines.push(cols.map((c) => csvEscape(r[c])).join(","));
  return lines.join("\n");
}

export async function contentCsv(): Promise<string> {
  const orgId = await getOrgId();
  const items = await prisma.content.findMany({ where: { orgId }, orderBy: { plannedDate: "asc" } });
  return toCsv(
    items.map((c) => ({
      title: c.title,
      pillar: c.pillar,
      series: c.series ?? "",
      audience: c.audience,
      format: c.format,
      status: c.status,
      plannedDate: c.plannedDate ? isoDate(c.plannedDate) : "",
      postedAt: c.postedAt ? isoDate(c.postedAt) : "",
      instagramUrl: c.instagramUrl ?? "",
      hook: c.hook ?? "",
      question: c.question ?? "",
    })),
  );
}

export async function analyticsCsv(): Promise<string> {
  const orgId = await getOrgId();
  const snaps = await prisma.analyticsSnapshot.findMany({
    where: { content: { orgId } },
    include: { content: { select: { title: true, pillar: true } } },
    orderBy: { capturedAt: "asc" },
  });
  return toCsv(
    snaps.map((s) => ({
      title: s.content.title,
      pillar: s.content.pillar,
      window: s.window,
      capturedAt: isoDate(s.capturedAt),
      views: s.views ?? "",
      reach: s.reach ?? "",
      avgWatchSec: s.avgWatchSec ?? "",
      completionPct: s.completionPct ?? "",
      likes: s.likes ?? "",
      comments: s.comments ?? "",
      saves: s.saves ?? "",
      shares: s.shares ?? "",
      follows: s.follows ?? "",
      engagementByReach: pct(engagementRateByReach(s)),
      saveRate: pct(saveRate(s)),
      retention: pct(averageRetention(s)),
      trialReel: s.wasTrialReel ? "yes" : "no",
      confirmed: s.confirmed ? "yes" : "no",
      source: s.source,
    })),
  );
}

export async function questionsCsv(): Promise<string> {
  const orgId = await getOrgId();
  const qs = await prisma.communityQuestion.findMany({ where: { orgId }, orderBy: { createdAt: "asc" } });
  return toCsv(
    qs.map((q) => ({
      text: q.text,
      pillar: q.pillar ?? "",
      audience: q.audience ?? "",
      problem: q.problem ?? "",
      frequency: q.frequency,
      source: q.source,
      status: q.status,
      answered: q.answeredContentId ? "yes" : "no",
      acknowledged: q.contributorAcknowledged ? "yes" : "no",
    })),
  );
}

export async function talksCsv(): Promise<string> {
  const orgId = await getOrgId();
  const talks = await prisma.talk.findMany({ where: { orgId }, orderBy: { scheduledAt: "asc" } });
  return toCsv(
    talks.map((t) => ({
      title: t.title,
      template: t.template ?? "",
      pillar: t.pillar ?? "",
      guest: t.guestName ?? "",
      scheduledAt: t.scheduledAt ? isoDate(t.scheduledAt) : "",
      status: t.status,
      attendance: t.attendance ?? "",
      externalLink: t.externalLink ?? "",
    })),
  );
}

export async function weeklyMarkdown(week: Date = weekStart()): Promise<string> {
  const orgId = await getOrgId();
  const from = weekStart(week);
  const to = addDays(from, 7);

  const planned = await prisma.content.findMany({
    where: { orgId, plannedDate: { gte: from, lt: to } },
    orderBy: { plannedDate: "asc" },
  });
  const posted = planned.filter((c) => c.postedAt);
  const questions = await prisma.communityQuestion.findMany({
    where: { orgId, createdAt: { gte: from, lt: to } },
  });
  const snaps = await prisma.analyticsSnapshot.findMany({
    where: { content: { orgId }, capturedAt: { gte: from, lt: to } },
    include: { content: { select: { title: true } } },
  });

  const byPillar: Record<string, number> = {};
  planned.forEach((c) => (byPillar[c.pillar] = (byPillar[c.pillar] ?? 0) + 1));

  const lines: string[] = [];
  lines.push(`# UNC Thoughts — Weekly Review`);
  lines.push(``);
  lines.push(`**Week of ${fmt(from, "d MMM yyyy")}** · generated ${fmt(new Date(), "d MMM yyyy, h:mmaaa")} (Australia/Sydney)`);
  lines.push(``);
  lines.push(`## The numbers`);
  lines.push(`- Planned: **${planned.length}**`);
  lines.push(`- Posted: **${posted.length}**`);
  lines.push(`- Completed: **${planned.filter((c) => c.status === "Complete").length}**`);
  lines.push(`- New community questions: **${questions.length}**`);
  lines.push(``);
  lines.push(`## Pillar balance`);
  for (const [p, n] of Object.entries(byPillar)) lines.push(`- ${p}: ${n}`);
  if (!Object.keys(byPillar).length) lines.push(`- (nothing planned this week)`);
  lines.push(``);
  lines.push(`## What went out`);
  if (posted.length) {
    for (const c of posted) {
      const s = snaps.find((x) => x.contentId === c.id);
      const extra = s ? ` — reach ${s.reach ?? "—"}, saves ${s.saves ?? "—"}, ER ${pct(engagementRateByReach(s))}` : "";
      lines.push(`- **${c.title}** (${c.pillar}, ${fmt(c.postedAt!, "EEE d")})${extra}`);
    }
  } else {
    lines.push(`- Nothing posted this week.`);
  }
  lines.push(``);
  lines.push(`## Community questions worth answering`);
  const openQ = questions.filter((q) => q.status === "open").sort((a, b) => b.frequency - a.frequency).slice(0, 5);
  if (openQ.length) openQ.forEach((q) => lines.push(`- "${q.text}" (asked ${q.frequency}×)`));
  else lines.push(`- None outstanding.`);
  lines.push(``);
  lines.push(`## For the AI to analyse`);
  lines.push(`> Given the numbers above, what one change to next week's plan would most improve useful engagement (saves, shares, meaningful comments) without adding to my workload? Keep it to one recommendation.`);
  lines.push(``);
  return lines.join("\n");
}

// Complete JSON backup (all tables for this org).
export async function fullBackup(): Promise<Record<string, unknown>> {
  const orgId = await getOrgId();
  const org = await prisma.organisation.findUnique({ where: { id: orgId } });
  const [content, tasks, analytics, research, practice, questions, inbox, talks, challenges, collaborators, experiments, patterns, reviews, spaces, posts, reports, media, batches] =
    await Promise.all([
      prisma.content.findMany({ where: { orgId } }),
      prisma.dayTask.findMany({ where: { orgId } }),
      prisma.analyticsSnapshot.findMany({ where: { content: { orgId } } }),
      prisma.researchEntry.findMany({ where: { orgId } }),
      prisma.practiceLesson.findMany({ where: { orgId } }),
      prisma.communityQuestion.findMany({ where: { orgId } }),
      prisma.inboxItem.findMany({ where: { orgId } }),
      prisma.talk.findMany({ where: { orgId }, include: { clips: true, questions: true } }),
      prisma.challenge.findMany({ where: { orgId } }),
      prisma.collaborator.findMany({ where: { orgId } }),
      prisma.experiment.findMany({ where: { orgId } }),
      prisma.winningPattern.findMany({ where: { orgId } }),
      prisma.weeklyReview.findMany({ where: { orgId } }),
      prisma.space.findMany({ where: { orgId } }),
      prisma.post.findMany({ where: { orgId } }),
      prisma.report.findMany({ where: { orgId } }),
      prisma.mediaAsset.findMany({ where: { content: { orgId } } }),
      prisma.batchSession.findMany({ where: { orgId }, include: { items: true } }),
    ]);

  return {
    _meta: { app: "unc-thoughts-hq", version: 1, exportedAt: new Date().toISOString(), org: org?.slug },
    organisation: org,
    content,
    tasks,
    analytics,
    research,
    practice,
    questions,
    inbox,
    talks,
    challenges,
    collaborators,
    experiments,
    patterns,
    reviews,
    spaces,
    posts,
    reports,
    media,
    batches,
  };
}
