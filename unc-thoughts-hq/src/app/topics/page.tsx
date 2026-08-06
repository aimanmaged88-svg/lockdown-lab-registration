import { prisma, getOrgId } from "@/lib/db";
import { NoteBank } from "@/components/desk/notes-client";
import { Lightbulb } from "lucide-react";

export const dynamic = "force-dynamic";

// The topics bank: a thought lands, you bank it, it waits for you.
export default async function TopicsPage() {
  const orgId = await getOrgId();
  const notes = await prisma.deskNote.findMany({
    where: { orgId, kind: "topic" },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <div>
        <p className="eyebrow">Bank it before it gets away</p>
        <h1 className="flex items-center gap-2"><Lightbulb size={24} /> Topics</h1>
      </div>
      <NoteBank
        kind="topic"
        placeholder="A topic worth talking about — dump it here before it disappears…"
        notes={notes.map((n) => ({ id: n.id, title: n.title, body: n.body, pillar: n.pillar, status: n.status, createdAt: n.createdAt.toISOString() }))}
      />
    </div>
  );
}
