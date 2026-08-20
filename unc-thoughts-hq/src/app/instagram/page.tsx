import { prisma, getOrgId } from "@/lib/db";
import { NoteBank } from "@/components/desk/notes-client";
import { IgTemplateStudio } from "@/components/desk/ig-template-studio";
import { ThoughtCardStudio } from "@/components/desk/thought-card-studio";
import { Instagram } from "lucide-react";

export const dynamic = "force-dynamic";

// Turn a Library answer into a postable one-liner: first full sentence,
// short enough to sit big on a card. This is why the card studio never needs
// anyone to write anything — the lines are already his.
function postableLines(answers: string[]): string[] {
  const out: string[] = [];
  for (const a of answers) {
    for (const raw of a.split(/(?<=[.?!])\s+/)) {
      const s = raw.trim().replace(/\s+/g, " ");
      if (s.length >= 28 && s.length <= 110 && !s.includes("http")) out.push(s);
    }
  }
  return Array.from(new Set(out)).slice(0, 60);
}

// The Instagram one-stop shop: make a grid post from the house template,
// and bank post ideas/captions for later. No layers, no ceremony.
export default async function InstagramPage() {
  const orgId = await getOrgId();
  const [notes, libRows] = await Promise.all([
    prisma.deskNote.findMany({
      where: { orgId, kind: "igpost" },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.communityQuestion.findMany({
      where: { orgId, inLibrary: true, answerText: { not: null } },
      select: { answerText: true },
      orderBy: { answeredAt: "desc" },
      take: 120,
    }),
  ]);
  const lines = postableLines(libRows.map((r) => r.answerText!).filter(Boolean));
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Your grid, made here</p>
        <h1 className="flex items-center gap-2"><Instagram size={24} /> Instagram</h1>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold normal-case tracking-normal">Thought card</h2>
        <p className="text-sm text-grey -mt-1">
          The quiet black post that performs. Pick a line you&apos;ve already said, lift one
          word, choose a look and a size, download. Nothing to write.
        </p>
        <ThoughtCardStudio lines={lines} />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold normal-case tracking-normal">Template studio</h2>
        <p className="text-sm text-grey -mt-1">The house template. The three pillar posts are presets that never change — the middle one is whatever you&apos;re saying this week. Type, preview, download, post.</p>
        <IgTemplateStudio />
      </section>

      <section className="space-y-2 max-w-xl">
        <h2 className="text-lg font-semibold normal-case tracking-normal">Post ideas &amp; captions</h2>
        <p className="text-sm text-grey -mt-1">Bank the caption when it hits you. Tick it off when it&apos;s posted.</p>
        <NoteBank
          kind="igpost"
          withTitle
          placeholder="Caption / post idea — write it how you'd post it…"
          notes={notes.map((n) => ({ id: n.id, title: n.title, body: n.body, pillar: n.pillar, status: n.status, createdAt: n.createdAt.toISOString() }))}
        />
      </section>
    </div>
  );
}
