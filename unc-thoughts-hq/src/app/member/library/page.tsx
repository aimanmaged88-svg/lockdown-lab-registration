import { prisma, getOrgId } from "@/lib/db";
import { LibraryClient } from "@/components/member/library-client";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

// The Library: every question UNC has approved for everyone — categorised,
// searchable, always anonymous. The community's questions become the
// community's knowledge. That's the whole point.
export default async function LibraryPage() {
  const orgId = await getOrgId();
  const rows = await prisma.communityQuestion.findMany({
    where: { orgId, status: "answered", inLibrary: true, answerText: { not: null } },
    orderBy: { answeredAt: "desc" },
    take: 300,
  });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl flex items-center gap-2"><BookOpen size={24} /> The Library</h1>
        <p className="text-sm text-grey mt-1">
          Real questions from the community, answered by UNC. Every one is here because
          he approved it for everyone — always anonymous. Check it before you ask; your
          answer might be waiting already.
        </p>
      </div>
      <LibraryClient
        items={rows.map((q) => ({
          id: q.id, text: q.text, pillar: q.pillar, subcat: q.problem,
          answer: q.answerText!, at: q.answeredAt?.toISOString() ?? q.createdAt.toISOString(),
        }))}
      />
      <p className="text-[11px] text-grey">
        Can&apos;t find yours? <Link href="/member/question" className="underline">Ask UNC himself →</Link>
      </p>
    </div>
  );
}
