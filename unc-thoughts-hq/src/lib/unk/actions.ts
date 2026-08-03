"use server";

import { prisma, getOrgId } from "../db";
import { audit } from "../audit";
import { revalidatePath } from "next/cache";
import { requireMember, isYouthBand } from "../member";
import { approvedItems } from "./knowledge";
import { compose, type UnkAnswer } from "./answer";
import { parseClockTime, minutesUntil } from "./timeband";
import { encryptText, encryptBytes } from "../crypto";
import { storage } from "../storage";
import { isEnabled } from "../flags";

// ── Ask Unk ─────────────────────────────────────────────────────
export type AskInput = {
  question: string;
  eventTime?: string; // "19:30" from flow inputs — server computes the band
  eventMinutes?: number; // explicit minutes-until, if the flow knows it
  source?: string; // ask | game | training | eat | mindset | recovery
};

export async function askUnk(input: AskInput): Promise<UnkAnswer & { logId: string }> {
  const member = await requireMember();
  const orgId = await getOrgId();
  const question = (input.question ?? "").slice(0, 500).trim();
  if (!question) throw new Error("Ask something first.");

  let eventMinutesOverride: number | null = null;
  if (typeof input.eventMinutes === "number") eventMinutesOverride = input.eventMinutes;
  else if (input.eventTime) {
    const p = parseClockTime(input.eventTime);
    if (p) eventMinutesOverride = minutesUntil(p.minutesOfDay);
  }

  // Unknown age is treated as youth: safety-first default for guardian notes.
  const youth = !member.ageBand || isYouthBand(member.ageBand);
  const items = await approvedItems();
  const answer = compose({ question, items, youth, eventMinutesOverride });

  // Allergy reminder — the member's own note read back, never dietary advice.
  if (member.allergies && answer.sections.food) {
    answer.sections.careful = [answer.sections.careful, `Your note says allergies: ${member.allergies}. Stick to your known-safe options — this is general education, not a personal plan.`]
      .filter(Boolean)
      .join("\n");
  }

  const log = await prisma.askLog.create({
    data: {
      orgId,
      memberId: member.id,
      question,
      intent: answer.intent,
      timeBand: answer.band,
      usedItemIds: JSON.stringify(answer.usedItems.map((u) => u.id)),
      supported: answer.supported,
      escalated: answer.escalated,
      guardianNote: !!answer.guardianNote,
    },
  });
  return { ...answer, logId: log.id };
}

export async function askFeedback(logId: string, patch: { useful?: boolean; unclear?: boolean; followed?: boolean; hadAvailable?: string }) {
  const member = await requireMember();
  await prisma.askLog.updateMany({
    where: { id: logId, memberId: member.id },
    data: { useful: patch.useful, unclear: patch.unclear, followed: patch.followed, hadAvailable: patch.hadAvailable?.slice(0, 200) },
  });
}

// ── Member context (minimal by design) ──────────────────────────
export async function updateMemberContext(patch: { ageBand?: string | null; allergies?: string | null; dietaryNotes?: string | null }) {
  const member = await requireMember();
  await prisma.member.update({
    where: { id: member.id },
    data: {
      ageBand: patch.ageBand === undefined ? undefined : patch.ageBand,
      allergies: patch.allergies === undefined ? undefined : patch.allergies?.slice(0, 200) || null,
      dietaryNotes: patch.dietaryNotes === undefined ? undefined : patch.dietaryNotes?.slice(0, 200) || null,
    },
  });
  revalidatePath("/member");
}

// ── Private reflections ─────────────────────────────────────────
export async function saveReflection(input: {
  promptText: string;
  answer?: string;
  voiceBase64?: string; // webm/ogg audio, data URL or raw base64
  actionChosen?: string;
  reminderAt?: string; // ISO
}) {
  const member = await requireMember();
  if (!input.answer?.trim() && !input.voiceBase64 && !input.actionChosen && !input.reminderAt) {
    throw new Error("Nothing to save — and that's allowed: thinking it through without saving is always an option.");
  }
  let voicePath: string | null = null;
  if (input.voiceBase64) {
    const raw = input.voiceBase64.replace(/^data:audio\/[a-z0-9+.-]+;base64,/i, "");
    const buf = Buffer.from(raw, "base64");
    if (buf.length > 4_000_000) throw new Error("Voice note too long — keep it under ~2 minutes.");
    voicePath = await storage.save(encryptBytes(buf), "voice-note.webm.enc", "voice");
  }
  const r = await prisma.reflection.create({
    data: {
      memberId: member.id,
      promptText: input.promptText.slice(0, 500),
      answerEnc: input.answer?.trim() ? encryptText(input.answer.trim().slice(0, 4000)) : null,
      voicePath,
      actionChosen: input.actionChosen?.slice(0, 200) || null,
      reminderAt: input.reminderAt ? new Date(input.reminderAt) : null,
    },
  });
  revalidatePath("/member/answers");
  revalidatePath("/member/thought");
  return { id: r.id };
}

export async function followUpReflection(id: string, status: "yes" | "partly" | "not_yet" | "changed_plan") {
  const member = await requireMember();
  await prisma.reflection.updateMany({
    where: { id, memberId: member.id },
    data: { followUp: status, followUpAt: new Date() },
  });
  revalidatePath("/member/answers");
  revalidatePath("/member/thought");
}

export async function deleteReflection(id: string) {
  const member = await requireMember();
  const r = await prisma.reflection.findFirst({ where: { id, memberId: member.id } });
  if (!r) return;
  if (r.voicePath) await storage.delete(r.voicePath);
  await prisma.reflection.delete({ where: { id: r.id } });
  revalidatePath("/member/answers");
}

// ── Optional sharing (never preselected; moderated before visible) ──
export async function requestShare(reflectionId: string, sharedText: string) {
  const member = await requireMember();
  if (!(await isEnabled("community_beta"))) {
    throw new Error("The community isn't open yet, so sharing is off. Your answer stays private.");
  }
  const text = sharedText.trim().slice(0, 1000);
  if (!text) throw new Error("Write what you want to share — nothing is shared automatically.");
  const orgId = await getOrgId();
  const r = await prisma.reflection.findFirst({ where: { id: reflectionId, memberId: member.id } });
  if (!r) throw new Error("Not found.");
  await prisma.reflection.update({ where: { id: r.id }, data: { shareStatus: "pending", sharedText: text } });
  await prisma.inboxItem.create({
    data: { orgId, type: "approval", title: "Member wants to share a reflection", body: text, refId: r.id, priority: 2 },
  });
  await audit("reflection.share_requested", { entity: "Reflection", entityId: r.id });
  revalidatePath("/member/answers");
  revalidatePath("/community");
}

// Owner moderation: approve → posted anonymously to Wins & Lessons.
export async function moderateShare(reflectionId: string, approve: boolean) {
  const orgId = await getOrgId();
  const r = await prisma.reflection.findUnique({ where: { id: reflectionId } });
  if (!r || r.shareStatus !== "pending" || !r.sharedText) throw new Error("Nothing pending for that reflection.");
  if (!approve) {
    await prisma.reflection.update({ where: { id: r.id }, data: { shareStatus: "declined" } });
  } else {
    const space = await prisma.space.findFirst({ where: { orgId, key: "wins" } });
    if (!space) throw new Error("Wins & Lessons space missing.");
    const anon = await prisma.user.upsert({
      where: { email: "community-anonymous@unc-thoughts.local" },
      update: {},
      create: { orgId, email: "community-anonymous@unc-thoughts.local", displayName: "Community member", role: "member", isAdult: true },
    });
    const post = await prisma.post.create({
      data: { orgId, spaceId: space.id, authorId: anon.id, body: r.sharedText, tags: JSON.stringify(["shared-reflection"]) },
    });
    await prisma.reflection.update({ where: { id: r.id }, data: { shareStatus: "approved", sharedPostId: post.id } });
  }
  await prisma.inboxItem.updateMany({ where: { refId: reflectionId, type: "approval" }, data: { status: "done" } });
  await audit("reflection.share_moderated", { entity: "Reflection", entityId: reflectionId, detail: { approve } });
  revalidatePath("/community");
}

// ── Unk's Brain (owner) ─────────────────────────────────────────
export type KnowledgeInput = {
  kind: string; title: string; pillar: string; audience?: string; body: string;
  tags?: string; source?: string; sourceUrl?: string; safetyClass?: string; approval?: string;
};

export async function createKnowledge(input: KnowledgeInput) {
  const orgId = await getOrgId();
  const item = await prisma.knowledgeItem.create({
    data: {
      orgId, kind: input.kind, title: input.title, pillar: input.pillar,
      audience: input.audience || "General", body: input.body,
      tags: input.tags ? JSON.stringify(input.tags.split(",").map((t) => t.trim()).filter(Boolean)) : null,
      source: input.source || null, sourceUrl: input.sourceUrl || null,
      safetyClass: input.safetyClass || "general",
      approval: input.approval === "approved" ? "approved" : "draft",
      reviewedAt: input.approval === "approved" ? new Date() : null,
    },
  });
  await audit("brain.create", { entity: "KnowledgeItem", entityId: item.id });
  revalidatePath("/brain");
  return item.id;
}

export async function updateKnowledge(id: string, input: KnowledgeInput) {
  const existing = await prisma.knowledgeItem.findUnique({ where: { id } });
  if (!existing) throw new Error("Not found");
  // Version history: snapshot the outgoing content before overwriting.
  await prisma.knowledgeVersion.create({
    data: { itemId: id, version: existing.version, title: existing.title, body: existing.body },
  });
  await prisma.knowledgeItem.update({
    where: { id },
    data: {
      kind: input.kind, title: input.title, pillar: input.pillar,
      audience: input.audience || "General", body: input.body,
      tags: input.tags ? JSON.stringify(input.tags.split(",").map((t) => t.trim()).filter(Boolean)) : null,
      source: input.source || null, sourceUrl: input.sourceUrl || null,
      safetyClass: input.safetyClass || "general",
      version: existing.version + 1,
    },
  });
  await audit("brain.update", { entity: "KnowledgeItem", entityId: id });
  revalidatePath("/brain");
}

// One-box reply: UNC answers a community question once and it goes everywhere —
// into Unk's Brain (approved, so members get this answer from now on), the
// question is closed + credited, and optionally it becomes a Ready text post.
export async function replyToQuestion(questionId: string, answer: string, alsoPost: boolean) {
  const orgId = await getOrgId();
  const text = answer.trim();
  if (!text) throw new Error("Write the answer first.");
  const q = await prisma.communityQuestion.findUnique({ where: { id: questionId } });
  if (!q) throw new Error("Question not found.");

  const pillar = q.pillar && ["Basketball", "Nutrition", "Mindset", "Community"].includes(q.pillar) ? q.pillar : "Mindset";
  const item = await prisma.knowledgeItem.create({
    data: {
      orgId,
      kind: "faq",
      title: q.text.slice(0, 110),
      pillar,
      body: `DO NOW: ${text}\nPRIVATE: What would you add from your own experience?\nWHY: UNC answered this one directly for the community.`,
      tags: JSON.stringify(["reply", pillar.toLowerCase()]),
      source: "UNC reply",
      author: "UNC",
      approval: "approved",
      reviewedAt: new Date(),
      safetyClass: pillar === "Nutrition" ? "nutrition" : "general",
    },
  });

  await prisma.communityQuestion.update({
    where: { id: q.id },
    data: { status: "answered", contributorAcknowledged: true, answerText: text, answeredAt: new Date() },
  });
  await prisma.inboxItem.updateMany({ where: { questionId: q.id }, data: { status: "done" } });

  // Close the loop with the asker: their answer shows in the app, and if they
  // opted in, their phone gets the ping.
  let pinged = 0;
  if (q.memberId && q.notify) {
    const { sendToMemberDevices } = await import("../push");
    const r = await sendToMemberDevices(q.memberId, {
      title: "UNC answered your question 🤝",
      body: text.slice(0, 140),
      url: "/member/question",
      tag: "unc-answer",
    }).catch(() => ({ sent: 0 }));
    pinged = r.sent;
  }

  let postId: string | null = null;
  if (alsoPost) {
    const owner = await prisma.user.findFirst({ where: { orgId, role: "owner" } });
    const post = await prisma.content.create({
      data: {
        orgId,
        ownerId: owner?.id,
        title: `Answer: ${q.text.slice(0, 60)}`,
        pillar,
        series: "Post Bank",
        format: "Text post",
        caption: `Got asked: “${q.text}”\n\nStraight answer: ${text}`,
        question: "What would you add from your own experience?",
        status: "Ready",
        notes: "From a one-tap reply",
        inspirationSource: "Community question",
        sourceQuestionId: q.id,
      },
    });
    postId = post.id;
  }

  await audit("question.replied", { entity: "CommunityQuestion", entityId: q.id, detail: { brainItem: item.id, postId, pinged } });
  revalidatePath("/community");
  revalidatePath("/brain");
  revalidatePath("/");
  revalidatePath("/member/question");
  return { brainItemId: item.id, postId, pinged };
}

export async function setKnowledgeApproval(id: string, approval: "draft" | "approved" | "archived") {
  await prisma.knowledgeItem.update({
    where: { id },
    data: { approval, reviewedAt: approval === "approved" ? new Date() : undefined },
  });
  await audit("brain.approval", { entity: "KnowledgeItem", entityId: id, detail: { approval } });
  revalidatePath("/brain");
}
