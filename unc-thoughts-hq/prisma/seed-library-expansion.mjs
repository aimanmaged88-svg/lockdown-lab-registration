// Seed the approved Library expansion (IG-mined + authored bank) — idempotent.
// Mirrors exactly what the inbox "approve" does: each entry becomes a brain FAQ
// (KnowledgeItem) + a public Library row (answered CommunityQuestion, inLibrary).
// Re-running skips anything already present (matched on question text).
import { PrismaClient } from "@prisma/client";
import { LIBRARY_EXPANSION } from "./library-expansion-data.mjs";

const prisma = new PrismaClient();
const org = await prisma.organisation.findUnique({ where: { slug: "unc-thoughts" } });
if (!org) throw new Error("Organisation not seeded.");
const orgId = org.id;

let added = 0, skipped = 0;
for (const it of LIBRARY_EXPANSION) {
  const exists = await prisma.communityQuestion.findFirst({ where: { orgId, source: "seed", text: it.q } });
  if (exists) { skipped++; continue; }

  await prisma.knowledgeItem.create({
    data: {
      orgId, kind: "faq", title: it.q.slice(0, 110), pillar: it.pillar,
      body: `DO NOW: ${it.a}\nPRIVATE: What would you add from your own experience?\nWHY: UNC answered this one for the community.`,
      tags: JSON.stringify(["reply", it.origin, it.pillar.toLowerCase()]),
      source: it.origin === "ig" ? "UNC IG" : "UNC bank",
      author: "UNC", approval: "approved", reviewedAt: new Date(),
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

console.log(`Library expansion: ${added} added, ${skipped} already present (${LIBRARY_EXPANSION.length} total).`);
await prisma.$disconnect();
