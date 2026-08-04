"use server";

// Thought library: save the thoughts that hit, and the daily rotation starts
// leaning toward what you save. Morning / afternoon / evening each serve their
// own thought — a friend checking in, not an app demanding streaks.

import { prisma, getOrgId } from "./db";
import { requireMember } from "./member";
import { revalidatePath } from "next/cache";

export async function saveThought(promptId: string) {
  const member = await requireMember();
  const orgId = await getOrgId();

  // Two kinds of thoughts: the curated bank, and UNC's real answers (q_<id>).
  let text: string | null = null;
  let pillar = "Mindset";
  if (promptId.startsWith("q_")) {
    const q = await prisma.communityQuestion.findFirst({ where: { id: promptId.slice(2), orgId, status: "answered" } });
    if (!q?.answerText) throw new Error("That thought isn't in the bank.");
    text = q.answerText;
    pillar = q.pillar ?? "Mindset";
  } else {
    const prompt = await prisma.thoughtPrompt.findFirst({ where: { id: promptId, orgId } });
    if (!prompt) throw new Error("That thought isn't in the bank.");
    text = prompt.text;
    pillar = prompt.pillar;
  }

  await prisma.savedThought.upsert({
    where: { memberId_promptId: { memberId: member.id, promptId } },
    update: {},
    create: { memberId: member.id, promptId, text, pillar },
  });
  revalidatePath("/member/thought");
  return { ok: true };
}

export async function unsaveThought(id: string) {
  const member = await requireMember();
  await prisma.savedThought.deleteMany({ where: { id, memberId: member.id } });
  revalidatePath("/member/thought");
  return { ok: true };
}
