"use server";

// Ask UNC directly: anonymous member questions, categorised so UNC can filter
// his inbox by pillar/subcategory, answered personally, and (opt-in) pinged
// back to the asker's device. Anonymity is the default — a name is optional.

import { prisma, getOrgId } from "../db";
import { audit } from "../audit";
import { requireMember } from "../member";
import { QUESTION_TREE, WHO_OPTIONS, isYouthBand } from "../member-shared";
import { assess, escalationMessage } from "./safety";
import { sendToOwnerDevices } from "../push";
import { revalidatePath } from "next/cache";

export type SendQuestionInput = {
  question: string;
  pillar: string;
  subcat?: string;
  who?: string; // Player | Parent | Coach — optional third layer
  askedBy?: string; // optional free-text name/handle — anonymity is the default
  notify?: boolean;
  pushSub?: { endpoint: string; keys: { p256dh: string; auth: string } } | null;
};

export type SendQuestionResult =
  | { ok: true; id: string }
  | { ok: false; escalated: true; headline: string; body: string[] }
  | { ok: false; escalated?: false; error: string };

export async function sendQuestionToUnc(input: SendQuestionInput): Promise<SendQuestionResult> {
  const member = await requireMember();
  const orgId = await getOrgId();

  const question = (input.question ?? "").trim().slice(0, 500);
  if (question.length < 5) return { ok: false, error: "Write your question first — a sentence is plenty." };

  const pillar = Object.keys(QUESTION_TREE).includes(input.pillar) ? input.pillar : null;
  if (!pillar) return { ok: false, error: "Pick a category — Basketball, Nutrition or Mindset." };
  const subcat = pillar && QUESTION_TREE[pillar].subcats.includes(input.subcat ?? "") ? input.subcat! : null;
  const who = (WHO_OPTIONS as readonly string[]).includes(input.who ?? "") ? input.who! : null;

  // Safety net: crisis-type questions get real help immediately, not a queue.
  const safety = assess(question);
  if (safety.kind === "escalate") {
    const youth = !member.ageBand || isYouthBand(member.ageBand);
    const msg = escalationMessage(safety.topic, safety.emergency, youth);
    await audit("question.escalated", { detail: { topic: safety.topic, emergency: safety.emergency } });
    return { ok: false, escalated: true, ...msg };
  }

  // Gentle rate limit: 5 questions per device per day.
  const sentToday = await prisma.communityQuestion.count({
    where: { memberId: member.id, createdAt: { gte: new Date(Date.now() - 864e5) } },
  });
  if (sentToday >= 5) return { ok: false, error: "That's 5 questions in a day — give UNC a minute to catch up, and send the next one tomorrow." };

  const notify = !!input.notify;
  const q = await prisma.communityQuestion.create({
    data: {
      orgId,
      text: question,
      pillar,
      problem: subcat,
      audience: who,
      askedBy: input.askedBy?.trim().slice(0, 60) || null,
      source: "member",
      memberId: member.id,
      notify,
    },
  });
  await prisma.inboxItem.create({
    data: {
      orgId,
      type: "question",
      title: question.slice(0, 120),
      body: [pillar, subcat, who, input.askedBy?.trim() || "anonymous"].filter(Boolean).join(" · "),
      questionId: q.id,
      priority: 1,
    },
  });

  // Their ping registration (only when they asked for it).
  if (notify && input.pushSub?.endpoint) {
    await prisma.pushSub.upsert({
      where: { endpoint: input.pushSub.endpoint },
      update: { p256dh: input.pushSub.keys.p256dh, auth: input.pushSub.keys.auth, role: "member", memberId: member.id },
      create: {
        orgId,
        endpoint: input.pushSub.endpoint,
        p256dh: input.pushSub.keys.p256dh,
        auth: input.pushSub.keys.auth,
        role: "member",
        memberId: member.id,
        label: "asker",
      },
    });
  }

  // Buzz UNC's phone so the inbox never goes stale.
  await sendToOwnerDevices({
    title: `New question · ${[pillar, subcat].filter(Boolean).join(" / ")}`,
    body: question.slice(0, 140),
    url: "/community",
    tag: "unc-question",
  }).catch(() => {});

  await audit("question.member_asked", { entity: "CommunityQuestion", entityId: q.id, detail: { pillar, subcat, who, notify } });
  revalidatePath("/community");
  revalidatePath("/member/question");
  return { ok: true, id: q.id };
}

// The asker's own view: their questions with status + UNC's answer when it lands.
export async function myQuestions() {
  const member = await requireMember();
  const rows = await prisma.communityQuestion.findMany({
    where: { memberId: member.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return rows.map((q) => ({
    id: q.id,
    text: q.text,
    pillar: q.pillar,
    subcat: q.problem,
    status: q.status,
    answerText: q.answerText,
    answeredAt: q.answeredAt?.toISOString() ?? null,
    createdAt: q.createdAt.toISOString(),
  }));
}
