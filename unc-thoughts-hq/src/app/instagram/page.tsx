import { prisma, getOrgId } from "@/lib/db";
import { NoteBank } from "@/components/desk/notes-client";
import { IgTemplateStudio } from "@/components/desk/ig-template-studio";
import { Instagram } from "lucide-react";

export const dynamic = "force-dynamic";

// The Instagram one-stop shop: make a grid post from the house template,
// and bank post ideas/captions for later. No layers, no ceremony.
export default async function InstagramPage() {
  const orgId = await getOrgId();
  const notes = await prisma.deskNote.findMany({
    where: { orgId, kind: "igpost" },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Your grid, made here</p>
        <h1 className="flex items-center gap-2"><Instagram size={24} /> Instagram</h1>
      </div>

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
