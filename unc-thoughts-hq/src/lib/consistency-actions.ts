"use server";
import { prisma } from "./db";
import { requireMember } from "./member";
import { isoDate } from "./time";
import { HABIT_TAG_IDS } from "./consistency";
import { revalidatePath } from "next/cache";

// Save (or update) today's Consistency Chart entry for this device's member.
// One row per Sydney day; re-saving replaces. Tags outside the fixed set are
// dropped, energy is clamped to 1-5 or cleared.
export async function saveHabitLog(input: { tags: string[]; energy: number | null }) {
  const member = await requireMember();
  const day = isoDate(new Date());
  const tags = [...new Set(input.tags.filter((t) => HABIT_TAG_IDS.includes(t)))];
  const energy = input.energy == null ? null : Math.min(5, Math.max(1, Math.round(input.energy)));

  await prisma.habitLog.upsert({
    where: { memberId_day: { memberId: member.id, day } },
    update: { tags: tags.join(","), energy },
    create: { memberId: member.id, day, tags: tags.join(","), energy },
  });
  revalidatePath("/member/consistency");
  return { ok: true as const, day };
}
