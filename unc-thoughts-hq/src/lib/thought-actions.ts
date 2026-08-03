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
  const prompt = await prisma.thoughtPrompt.findFirst({ where: { id: promptId, orgId } });
  if (!prompt) throw new Error("That thought isn't in the bank.");
  await prisma.savedThought.upsert({
    where: { memberId_promptId: { memberId: member.id, promptId } },
    update: {},
    create: { memberId: member.id, promptId, text: prompt.text, pillar: prompt.pillar },
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
