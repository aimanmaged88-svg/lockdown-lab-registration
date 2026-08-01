"use server";

import { prisma, getOrgId } from "./db";
import { audit } from "./audit";
import { revalidatePath } from "next/cache";
import { CHECKLIST_STEPS, CONTENT_STATUSES } from "./enums";
import { PREFLIGHT_CHECKS } from "./coach-content";
import { z } from "zod";
import { storage } from "./storage";

async function ownerId(): Promise<string | undefined> {
  const u = await prisma.user.findFirst({ where: { role: "owner" } });
  return u?.id;
}

// ── Daily checklist ─────────────────────────────────────────────
export async function ensureDayTasks(contentId: string) {
  const orgId = await getOrgId();
  const count = await prisma.dayTask.count({ where: { contentId } });
  if (count > 0) return;
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  let i = 0;
  for (const step of CHECKLIST_STEPS) {
    await prisma.dayTask.create({
      data: {
        orgId,
        contentId,
        kind: step.kind,
        label: step.label,
        dueDate: content?.plannedDate ?? null,
        priority: i < 7 ? 2 : 1,
      },
    });
    i++;
  }
  revalidatePath("/");
  revalidatePath(`/content/${contentId}`);
}

export async function toggleTask(taskId: string, done: boolean) {
  const task = await prisma.dayTask.update({
    where: { id: taskId },
    data: { done, doneAt: done ? new Date() : null },
  });
  await audit("task.toggle", { entity: "DayTask", entityId: taskId, detail: { done } });
  // If "posted" step ticked, reflect on content status.
  if (task.contentId && task.kind === "posted" && done) {
    await prisma.content.update({ where: { id: task.contentId }, data: { postedAt: new Date(), status: "Posted" } });
  }
  revalidatePath("/");
  if (task.contentId) revalidatePath(`/content/${task.contentId}`);
  return task;
}

// ── Content ─────────────────────────────────────────────────────
const contentSchema = z.object({
  title: z.string().min(1),
  pillar: z.string(),
  series: z.string().optional(),
  audience: z.string().default("General"),
  format: z.string().default("Reel"),
  reelSeconds: z.coerce.number().int().positive().optional(),
  hook: z.string().optional(),
  script: z.string().optional(),
  teachingPoints: z.string().optional(),
  caption: z.string().optional(),
  question: z.string().optional(),
  highlight: z.string().optional(),
  plannedDate: z.string().optional(),
  status: z.string().default("Idea"),
  notes: z.string().optional(),
  recordingLocation: z.string().optional(),
  equipmentUsed: z.string().optional(),
});

export async function createContent(input: unknown) {
  const orgId = await getOrgId();
  const data = contentSchema.parse(input);
  const content = await prisma.content.create({
    data: {
      orgId,
      ownerId: await ownerId(),
      ...data,
      plannedDate: data.plannedDate ? new Date(data.plannedDate) : null,
    },
  });
  await audit("content.create", { entity: "Content", entityId: content.id });
  revalidatePath("/content");
  revalidatePath("/calendar");
  return content;
}

export async function updateContent(id: string, input: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};
  const allow = [
    "title", "pillar", "series", "audience", "format", "reelSeconds", "hook", "script",
    "teachingPoints", "shotList", "caption", "question", "highlight", "status", "notes",
    "instagramUrl", "recordingLocation", "equipmentUsed", "inspirationSource",
    "isExperiment", "isTrialReel",
  ];
  for (const k of allow) if (k in input) patch[k] = input[k];
  if ("plannedDate" in input) patch.plannedDate = input.plannedDate ? new Date(String(input.plannedDate)) : null;
  if ("reelSeconds" in input && input.reelSeconds) patch.reelSeconds = Number(input.reelSeconds);
  const content = await prisma.content.update({ where: { id }, data: patch });
  await audit("content.update", { entity: "Content", entityId: id, detail: patch });
  revalidatePath(`/content/${id}`);
  revalidatePath("/content");
  revalidatePath("/");
  return content;
}

export async function setContentStatus(id: string, status: string) {
  if (!CONTENT_STATUSES.includes(status as (typeof CONTENT_STATUSES)[number])) throw new Error("Bad status");
  const data: Record<string, unknown> = { status };
  if (status === "Posted") data.postedAt = new Date();
  await prisma.content.update({ where: { id }, data });
  await audit("content.status", { entity: "Content", entityId: id, detail: { status } });
  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath(`/content/${id}`);
}

export async function markPosted(id: string, instagramUrl?: string) {
  await prisma.content.update({
    where: { id },
    data: { status: "Posted", postedAt: new Date(), instagramUrl: instagramUrl || undefined },
  });
  // tick the "posted" checklist step if present
  await prisma.dayTask.updateMany({ where: { contentId: id, kind: "posted" }, data: { done: true, doneAt: new Date() } });
  await audit("content.posted", { entity: "Content", entityId: id });
  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath(`/content/${id}`);
}

export async function rescheduleContent(id: string, newDate: string) {
  await prisma.content.update({
    where: { id },
    data: { plannedDate: new Date(newDate), status: "Rescheduled" },
  });
  await prisma.dayTask.updateMany({ where: { contentId: id }, data: { dueDate: new Date(newDate) } });
  await audit("content.reschedule", { entity: "Content", entityId: id, detail: { newDate } });
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath(`/content/${id}`);
}

export async function skipContent(id: string, reason: string) {
  await prisma.content.update({ where: { id }, data: { status: "Skipped", notes: reason } });
  await audit("content.skip", { entity: "Content", entityId: id, detail: { reason } });
  revalidatePath("/");
  revalidatePath("/content");
}

export async function duplicateContent(id: string) {
  const orgId = await getOrgId();
  const c = await prisma.content.findUnique({ where: { id } });
  if (!c) throw new Error("Not found");
  const copy = await prisma.content.create({
    data: {
      orgId,
      ownerId: c.ownerId,
      title: `${c.title} (copy)`,
      pillar: c.pillar,
      series: c.series,
      audience: c.audience,
      format: c.format,
      reelSeconds: c.reelSeconds,
      hook: c.hook,
      script: c.script,
      teachingPoints: c.teachingPoints,
      caption: c.caption,
      question: c.question,
      status: "Idea",
    },
  });
  await audit("content.duplicate", { entity: "Content", entityId: copy.id, detail: { from: id } });
  revalidatePath("/content");
  return copy;
}

export async function repurposeContent(id: string, target: string) {
  const orgId = await getOrgId();
  const c = await prisma.content.findUnique({ where: { id } });
  if (!c) throw new Error("Not found");
  const copy = await prisma.content.create({
    data: {
      orgId,
      ownerId: c.ownerId,
      title: `${c.title} → ${target}`,
      pillar: c.pillar,
      audience: c.audience,
      format: target === "Reply Reel" ? "ReplyReel" : target === "Story poll" ? "Story" : "Reel",
      hook: c.hook,
      question: c.question,
      status: "Idea",
      repurposedFromId: c.id,
      notes: `Repurposed from "${c.title}" as ${target}.`,
    },
  });
  await audit("content.repurpose", { entity: "Content", entityId: copy.id, detail: { from: id, target } });
  revalidatePath("/content");
  return copy;
}

// ── Analytics ───────────────────────────────────────────────────
const analyticsSchema = z.object({
  contentId: z.string(),
  window: z.enum(["24h", "7d", "30d"]),
  views: z.coerce.number().optional(),
  reach: z.coerce.number().optional(),
  plays: z.coerce.number().optional(),
  avgWatchSec: z.coerce.number().optional(),
  reelSeconds: z.coerce.number().optional(),
  completionPct: z.coerce.number().optional(),
  likes: z.coerce.number().optional(),
  comments: z.coerce.number().optional(),
  saves: z.coerce.number().optional(),
  shares: z.coerce.number().optional(),
  profileVisits: z.coerce.number().optional(),
  follows: z.coerce.number().optional(),
  storyShares: z.coerce.number().optional(),
  wasTrialReel: z.coerce.boolean().optional(),
  sharedToAll: z.coerce.boolean().optional(),
  source: z.string().default("manual"),
  screenshotPath: z.string().optional(),
  confirmed: z.coerce.boolean().default(true),
});

export async function addAnalytics(input: unknown) {
  const data = analyticsSchema.parse(input);
  const snap = await prisma.analyticsSnapshot.create({ data });
  // record on the checklist + status
  await prisma.dayTask.updateMany({ where: { contentId: data.contentId, kind: "analytics_recorded" }, data: { done: true, doneAt: new Date() } });
  await audit("analytics.add", { entity: "AnalyticsSnapshot", entityId: snap.id, detail: { window: data.window } });
  revalidatePath(`/content/${data.contentId}`);
  revalidatePath("/analytics");
  revalidatePath("/");
  return snap;
}

// Save an uploaded screenshot (base64) and return its stored path — values are
// NOT saved until the user confirms them via addAnalytics.
export async function saveScreenshot(base64: string, filename: string): Promise<string> {
  const m = base64.match(/^data:(.+?);base64,(.*)$/);
  const raw = m ? m[2] : base64;
  const buffer = Buffer.from(raw, "base64");
  return storage.save(buffer, filename, "screenshots");
}

// ── Community questions & comment-to-content ────────────────────
export async function addQuestion(input: { text: string; pillar?: string; audience?: string; source?: string; problem?: string }) {
  const orgId = await getOrgId();
  if (!input.text?.trim()) throw new Error("Question text required");
  const q = await prisma.communityQuestion.create({
    data: {
      orgId,
      text: input.text.trim(),
      pillar: input.pillar,
      audience: input.audience,
      problem: input.problem,
      source: input.source ?? "comment",
    },
  });
  await prisma.inboxItem.create({
    data: { orgId, type: "question", title: q.text, questionId: q.id, priority: 1, tags: input.pillar ? JSON.stringify([input.pillar]) : null },
  });
  await audit("question.add", { entity: "CommunityQuestion", entityId: q.id });
  revalidatePath("/community");
  revalidatePath("/");
  return q;
}

export async function bumpQuestionFrequency(id: string) {
  const q = await prisma.communityQuestion.update({ where: { id }, data: { frequency: { increment: 1 } } });
  revalidatePath("/community");
  return q;
}

// Comment-to-Content: turn a question into a Reply Reel content item (one click).
export async function commentToReel(questionId: string) {
  const orgId = await getOrgId();
  const q = await prisma.communityQuestion.findUnique({ where: { id: questionId } });
  if (!q) throw new Error("Question not found");
  const content = await prisma.content.create({
    data: {
      orgId,
      ownerId: await ownerId(),
      title: `Reply: ${q.text.slice(0, 60)}`,
      pillar: q.pillar ?? "Community",
      audience: q.audience ?? "General",
      format: "ReplyReel",
      series: "Comment Reply",
      hook: "A coach asked this—here is the short answer.",
      question: "What would you add?",
      script: `Question: ${q.text}\n\nAnswer (keep it under 15s):\n- `,
      status: "Planned",
      sourceQuestionId: q.id,
    },
  });
  await prisma.communityQuestion.update({ where: { id: questionId }, data: { status: "planned", answeredContentId: content.id } });
  await audit("question.to_reel", { entity: "Content", entityId: content.id, detail: { questionId } });
  revalidatePath("/community");
  revalidatePath("/content");
  return content;
}

// Loop Closer: mark a question publicly answered + contributor acknowledged.
export async function closeLoop(questionId: string, acknowledged: boolean) {
  await prisma.communityQuestion.update({
    where: { id: questionId },
    data: { status: "answered", contributorAcknowledged: acknowledged },
  });
  await audit("question.loop_closed", { entity: "CommunityQuestion", entityId: questionId, detail: { acknowledged } });
  revalidatePath("/community");
}

// ── Inbox ───────────────────────────────────────────────────────
export async function updateInboxItem(id: string, patch: { status?: string; snoozeUntil?: string | null; priority?: number; tags?: string[] }) {
  await prisma.inboxItem.update({
    where: { id },
    data: {
      status: patch.status,
      snoozeUntil: patch.snoozeUntil === undefined ? undefined : patch.snoozeUntil ? new Date(patch.snoozeUntil) : null,
      priority: patch.priority,
      tags: patch.tags ? JSON.stringify(patch.tags) : undefined,
    },
  });
  revalidatePath("/community");
}

// ── Preflight ───────────────────────────────────────────────────
export async function runPreflight(contentId: string, results: Array<{ key: string; pass: boolean; overrideReason?: string }>) {
  const passed = results.every((r) => r.pass || !!r.overrideReason);
  const enriched = results.map((r) => ({
    ...r,
    label: PREFLIGHT_CHECKS.find((c) => c.key === r.key)?.label ?? r.key,
  }));
  await prisma.preflightResult.upsert({
    where: { contentId },
    update: { results: JSON.stringify(enriched), passed, checkedAt: new Date() },
    create: { contentId, results: JSON.stringify(enriched), passed },
  });
  if (passed) {
    await prisma.dayTask.updateMany({ where: { contentId, kind: "preflight_completed" }, data: { done: true, doneAt: new Date() } });
    await prisma.content.updateMany({ where: { id: contentId, status: { in: ["Editing", "Recording", "Script ready"] } }, data: { status: "Ready" } });
  }
  await audit("preflight.run", { entity: "Content", entityId: contentId, detail: { passed } });
  revalidatePath(`/content/${contentId}`);
  revalidatePath("/");
  return { passed };
}

// ── Experiments ─────────────────────────────────────────────────
export async function createExperiment(input: {
  contentId?: string; type: string; hypothesis: string; variable: string; heldConstant: string; minSample?: number;
}) {
  const orgId = await getOrgId();
  const exp = await prisma.experiment.create({
    data: {
      orgId,
      contentId: input.contentId,
      type: input.type,
      hypothesis: input.hypothesis,
      variable: input.variable,
      heldConstant: input.heldConstant,
      minSample: input.minSample ?? 3,
    },
  });
  if (input.contentId) {
    await prisma.content.update({ where: { id: input.contentId }, data: { isExperiment: true, isTrialReel: input.type === "trial_vs_standard" } });
  }
  await audit("experiment.create", { entity: "Experiment", entityId: exp.id });
  revalidatePath("/growth");
  return exp;
}

export async function decideExperiment(id: string, decision: string, result: string, confidence: string) {
  await prisma.experiment.update({ where: { id }, data: { decision, result, confidence, status: "decided" } });
  await audit("experiment.decide", { entity: "Experiment", entityId: id, detail: { decision } });
  revalidatePath("/growth");
}

// ── Batch Day ───────────────────────────────────────────────────
export async function createBatch(input: { name: string; minutes: number; groupBy: string; contentIds: string[] }) {
  const orgId = await getOrgId();
  const session = await prisma.batchSession.create({
    data: {
      orgId,
      name: input.name,
      minutes: input.minutes,
      groupBy: input.groupBy,
      items: { create: input.contentIds.map((cid, i) => ({ contentId: cid, order: i })) },
    },
    include: { items: true },
  });
  await audit("batch.create", { entity: "BatchSession", entityId: session.id, detail: { count: input.contentIds.length } });
  revalidatePath("/studio");
  return session;
}

export async function toggleBatchItem(itemId: string, done: boolean) {
  await prisma.batchItem.update({ where: { id: itemId }, data: { done } });
  revalidatePath("/studio");
}

// ── Talks ───────────────────────────────────────────────────────
export async function createTalk(input: { title: string; template?: string; pillar?: string; guestName?: string; scheduledAt?: string; externalLink?: string; isMedical?: boolean }) {
  const orgId = await getOrgId();
  const talk = await prisma.talk.create({
    data: {
      orgId,
      title: input.title,
      template: input.template,
      pillar: input.pillar,
      guestName: input.guestName,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      externalLink: input.externalLink,
      isMedicalDisclaimer: input.isMedical ?? input.pillar === "Nutrition",
    },
  });
  await audit("talk.create", { entity: "Talk", entityId: talk.id });
  revalidatePath("/talks");
  return talk;
}

export async function addTalkClip(talkId: string, idea: string) {
  const clip = await prisma.talkClip.create({ data: { talkId, idea } });
  revalidatePath(`/talks/${talkId}`);
  return clip;
}

// Talk-to-Clips: turn a clip idea into a Reel content task.
export async function clipToContent(clipId: string) {
  const orgId = await getOrgId();
  const clip = await prisma.talkClip.findUnique({ where: { id: clipId }, include: { talk: true } });
  if (!clip) throw new Error("Clip not found");
  const content = await prisma.content.create({
    data: {
      orgId,
      ownerId: await ownerId(),
      title: `Clip: ${clip.idea.slice(0, 60)}`,
      pillar: clip.talk.pillar ?? "Community",
      format: "Reel",
      series: "Community talk clip",
      caption: clip.caption ?? undefined,
      script: clip.script ?? undefined,
      status: "Planned",
      inspirationSource: `Talk: ${clip.talk.title}`,
    },
  });
  await prisma.talkClip.update({ where: { id: clipId }, data: { turnedIntoContentId: content.id } });
  await audit("talk.clip_to_content", { entity: "Content", entityId: content.id, detail: { clipId } });
  revalidatePath(`/talks/${clip.talkId}`);
  revalidatePath("/content");
  return content;
}

export async function addTalkQuestion(talkId: string, text: string) {
  await prisma.talkQuestion.create({ data: { talkId, text } });
  revalidatePath(`/talks/${talkId}`);
}
export async function voteTalkQuestion(id: string) {
  await prisma.talkQuestion.update({ where: { id }, data: { votes: { increment: 1 } } });
  revalidatePath("/talks");
}

// ── Winning patterns ────────────────────────────────────────────
export async function saveWinningPattern(input: { topic: string; format: string; hook: string; duration: number; audience: string; evidence?: string }) {
  const orgId = await getOrgId();
  await prisma.winningPattern.create({ data: { orgId, ...input } });
  await audit("pattern.save", {});
  revalidatePath("/growth");
}

// ── Flags ───────────────────────────────────────────────────────
export async function setFeatureFlag(key: string, enabled: boolean) {
  const orgId = await getOrgId();
  await prisma.featureFlag.upsert({
    where: { orgId_key: { orgId, key } },
    update: { enabled },
    create: { orgId, key, enabled },
  });
  await audit("flag.set", { detail: { key, enabled } });
  revalidatePath("/settings");
  revalidatePath("/community");
}
