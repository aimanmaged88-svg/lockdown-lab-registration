"use server";

import { prisma, getOrgId } from "./db";
import { approvedItems } from "./unk/knowledge";
import { generateDrafts, type Draft } from "./postbank";
import { audit } from "./audit";
import { revalidatePath } from "next/cache";

// Generate fresh drafts from approved teaching + real community questions.
export async function freshDrafts(seed?: number): Promise<{ drafts: Draft[]; seed: number }> {
  const orgId = await getOrgId();
  const [items, questions, recent] = await Promise.all([
    approvedItems(),
    prisma.communityQuestion.findMany({ where: { orgId, status: "open" }, select: { text: true, pillar: true }, take: 20 }),
    prisma.content.findMany({ where: { orgId }, orderBy: { createdAt: "desc" }, take: 30, select: { title: true } }),
  ]);
  const s = seed ?? Math.floor(Math.random() * 1e9);
  return { drafts: generateDrafts({ items, questions, avoidTitles: recent.map((c) => c.title), seed: s }), seed: s };
}

// Save a (possibly edited) draft into the pipeline.
export async function saveDraft(draft: Draft, as: "Ready" | "Idea") {
  const orgId = await getOrgId();
  const owner = await prisma.user.findFirst({ where: { orgId, role: "owner" } });
  const c = await prisma.content.create({
    data: {
      orgId,
      ownerId: owner?.id,
      title: draft.title.slice(0, 120),
      pillar: ["Basketball", "Nutrition", "Mindset", "Community"].includes(draft.pillar) ? draft.pillar : "Mindset",
      series: "Post Bank",
      format: "Text post",
      caption: draft.caption,
      question: draft.question,
      status: as,
      notes: `Post Bank · ${draft.kindLabel}${draft.sourceTitles.length ? ` · from: ${draft.sourceTitles.join(", ")}` : ""}`,
      inspirationSource: "Post Bank",
    },
  });
  await audit("postbank.save", { entity: "Content", entityId: c.id, detail: { as, kind: draft.kind } });
  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath("/compose");
  return { id: c.id };
}

// Brain-dump capture: half-formed idea in, Content Idea out.
export async function quickIdea(text: string) {
  const orgId = await getOrgId();
  const t = text.trim();
  if (!t) throw new Error("Type the idea first.");
  const owner = await prisma.user.findFirst({ where: { orgId, role: "owner" } });
  const c = await prisma.content.create({
    data: {
      orgId, ownerId: owner?.id,
      title: t.slice(0, 90),
      pillar: /food|eat|fuel|water|meal/i.test(t) ? "Nutrition" : /drill|handle|shot|defence|defense|court/i.test(t) ? "Basketball" : "Mindset",
      format: "Reel",
      status: "Idea",
      notes: t.length > 90 ? t : undefined,
      inspirationSource: "Quick capture",
    },
  });
  await audit("idea.capture", { entity: "Content", entityId: c.id });
  revalidatePath("/compose");
  revalidatePath("/content");
  return { id: c.id };
}
