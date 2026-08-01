import { prisma, getOrgId } from "@/lib/db";
import { Badge, LinkButton, Empty, pillarTone } from "@/components/ui";
import { CONTENT_STATUSES } from "@/lib/enums";
import { fmt } from "@/lib/time";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ status?: string; pillar?: string }> }) {
  const sp = await searchParams;
  const orgId = await getOrgId();
  const items = await prisma.content.findMany({
    where: {
      orgId,
      status: sp.status || undefined,
      pillar: sp.pillar || undefined,
    },
    orderBy: [{ plannedDate: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Every idea, from spark to posted</p>
          <h1>Content</h1>
        </div>
        <LinkButton href="/content/new" primary>+ New content</LinkButton>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Link href="/content" className="chip hover:text-paper">All</Link>
        {CONTENT_STATUSES.map((s) => (
          <Link key={s} href={`/content?status=${encodeURIComponent(s)}`} className="chip hover:text-paper">{s}</Link>
        ))}
      </div>

      {items.length === 0 ? (
        <Empty title="No content yet." hint="Add one, or import your roadmap from Settings." action={<LinkButton href="/content/new" primary>+ New content</LinkButton>} />
      ) : (
        <div className="overflow-x-auto card p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-grey border-b border-ink-line">
              <tr>
                <th className="p-3 font-medium">Title</th>
                <th className="p-3 font-medium">Pillar</th>
                <th className="p-3 font-medium hidden md:table-cell">Series</th>
                <th className="p-3 font-medium hidden md:table-cell">Planned</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-ink-line/60 hover:bg-ink-soft">
                  <td className="p-3">
                    <Link href={`/content/${c.id}`} className="font-medium hover:underline">{c.title}</Link>
                    {c.reelSeconds && <span className="text-grey"> · {c.reelSeconds}s</span>}
                  </td>
                  <td className="p-3"><Badge tone={pillarTone(c.pillar)}>{c.pillar}</Badge></td>
                  <td className="p-3 hidden md:table-cell text-grey">{c.series ?? "—"}</td>
                  <td className="p-3 hidden md:table-cell text-grey">{c.plannedDate ? fmt(c.plannedDate) : "—"}</td>
                  <td className="p-3"><Badge tone={["Posted", "Complete"].includes(c.status) ? "good" : c.status === "Skipped" ? "bad" : "default"}>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
