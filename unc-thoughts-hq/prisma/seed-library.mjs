// Seed the public Library with the starter Q&A set (idempotent).
// Each item becomes BOTH a Library entry (an answered, approved CommunityQuestion)
// and a brain FAQ (KnowledgeItem) — exactly what tapping "approve" does on a
// real reply, so the AI can answer these and members see them in the Library.
// Re-running skips anything already seeded (matched on source "seed" + text).
import { PrismaClient } from "@prisma/client";
import { LIBRARY_SEED } from "./library-seed-data.mjs";

const prisma = new PrismaClient();
const org = await prisma.organisation.findUnique({ where: { slug: "unc-thoughts" } });
if (!org) throw new Error("Organisation not seeded.");
const orgId = org.id;

let added = 0, skipped = 0;
for (const it of LIBRARY_SEED) {
  const exists = await prisma.communityQuestion.findFirst({ where: { orgId, source: "seed", text: it.q } });
  if (exists) { skipped++; continue; }

  await prisma.knowledgeItem.create({
    data: {
      orgId, kind: "faq", title: it.q.slice(0, 110), pillar: it.pillar,
      body: `DO NOW: ${it.a}\nPRIVATE: What would you add from your own experience?\nWHY: UNC answered this one for the community.`,
      tags: JSON.stringify(["reply", "seed", it.pillar.toLowerCase()]),
      source: "UNC starter", author: "UNC", approval: "approved", reviewedAt: new Date(),
      safetyClass: it.pillar === "Nutrition" ? "nutrition" : "general",
    },
  });
  await prisma.communityQuestion.create({
    data: {
      orgId, text: it.q, pillar: it.pillar, problem: it.subcat, source: "seed",
      status: "answered", contributorAcknowledged: true, answerText: it.a,
      answeredAt: new Date(), inLibrary: true,
    },
  });
  added++;
}

console.log(`Library seed: ${added} added, ${skipped} already present (${LIBRARY_SEED.length} total).`);
await prisma.$disconnect();
