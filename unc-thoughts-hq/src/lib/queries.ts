import { prisma, getOrgId } from "./db";
import { weekStart, isoDate } from "./time";
import { addDays } from "date-fns";
import { recommend, nextBestAction, type EngineInput } from "./recommend";

export async function getTodayContent() {
  const orgId = await getOrgId();
  const today = isoDate(new Date());
  const all = await prisma.content.findMany({
    where: { orgId, plannedDate: { not: null } },
    include: { tasks: true },
    orderBy: { plannedDate: "asc" },
  });
  return all.filter((c) => c.plannedDate && isoDate(c.plannedDate) === today);
}

export async function getOverdue() {
  const orgId = await getOrgId();
  const startToday = new Date(isoDate(new Date()) + "T00:00:00");
  return prisma.content.findMany({
    where: {
      orgId,
      postedAt: null,
      status: { notIn: ["Skipped", "Complete", "Posted"] },
      plannedDate: { lt: startToday },
    },
    orderBy: { plannedDate: "asc" },
  });
}

export async function getWeekProgress() {
  const orgId = await getOrgId();
  const from = weekStart();
  const to = addDays(from, 7);
  const planned = await prisma.content.findMany({ where: { orgId, plannedDate: { gte: from, lt: to } } });
  const posted = planned.filter((c) => c.postedAt).length;
  const complete = planned.filter((c) => c.status === "Complete").length;
  return { planned: planned.length, posted, complete };
}

// Build the engine input from the DB and return recommendations + NBA.
export async function getRecommendations(capacityMinutes = 60) {
  const orgId = await getOrgId();
  const content = await prisma.content.findMany({
    where: { orgId },
    select: {
      id: true, title: true, pillar: true, audience: true, format: true, status: true,
      plannedDate: true, postedAt: true, reelSeconds: true, highlight: true, followUpOfId: true,
    },
  });
  const snaps = await prisma.analyticsSnapshot.findMany({
    where: { content: { orgId } },
    include: { content: { select: { pillar: true, format: true, postedAt: true } } },
    orderBy: { capturedAt: "desc" },
  });
  // latest snapshot per content
  const seen = new Set<string>();
  const metrics = [] as EngineInput["metrics"];
  for (const s of snaps) {
    if (seen.has(s.contentId)) continue;
    seen.add(s.contentId);
    metrics.push({
      contentId: s.contentId,
      pillar: s.content.pillar,
      format: s.content.format,
      saves: s.saves,
      reelSeconds: s.reelSeconds,
      wasPosted: !!s.content.postedAt,
    });
  }
  const questions = await prisma.communityQuestion.findMany({
    where: { orgId },
    select: { id: true, text: true, frequency: true, status: true },
  });

  const input: EngineInput = { today: new Date(), content, metrics, questions, capacityMinutes };
  const recs = recommend(input);
  return { recs, nba: nextBestAction(recs) };
}

export async function getInboxCounts() {
  const orgId = await getOrgId();
  const openQuestions = await prisma.communityQuestion.count({ where: { orgId, status: "open" } });
  const openReports = await prisma.report.count({ where: { orgId, status: "open" } });
  const openInbox = await prisma.inboxItem.count({ where: { orgId, status: "open" } });
  return { openQuestions, openReports, openInbox };
}
