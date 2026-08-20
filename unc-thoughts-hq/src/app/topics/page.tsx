import { prisma, getOrgId } from "@/lib/db";
import { NoteBank } from "@/components/desk/notes-client";
import { TopicMatch } from "@/components/desk/topic-match";
import { Lightbulb } from "lucide-react";

export const dynamic = "force-dynamic";

// The topics bank: a thought lands, you bank it, it waits for you — and the
// matcher up top tells you what you've already said about it.
export default async function TopicsPage() {
  const orgId = await getOrgId();
  const [notes, libRows] = await Promise.all([
    prisma.deskNote.findMany({
      where: { orgId, kind: "topic" },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.communityQuestion.findMany({
      where: { orgId, inLibrary: true, answerText: { not: null } },
      select: { text: true, answerText: true, pillar: true, problem: true },
      orderBy: { answeredAt: "desc" },
      take: 300,
    }),
  ]);
  const library = libRows.map((r) => ({
    q: r.text, a: r.answerText!, pillar: r.pillar ?? "General", subcat: r.problem ?? "",
  }));
  const topicTitles = notes.map((n) => (n.title || n.body).trim()).filter(Boolean);
  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <div>
        <p className="eyebrow">Bank it before it gets away</p>
        <h1 className="flex items-center gap-2"><Lightbulb size={24} /> Topics</h1>
      </div>
      <TopicMatch library={library} topics={topicTitles} />

      <NoteBank
        kind="topic"
        placeholder="A topic worth talking about — dump it here before it disappears…"
        notes={notes.map((n) => ({ id: n.id, title: n.title, body: n.body, pillar: n.pillar, status: n.status, createdAt: n.createdAt.toISOString() }))}
      />
    </div>
  );
}
