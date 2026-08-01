import { prisma, getOrgId } from "@/lib/db";
import { Card, Section, Badge, Stat, LinkButton, Empty } from "@/components/ui";
import { AnalyticsForm } from "@/components/analytics-form";
import { SavesChart } from "@/components/analytics-chart";
import { engagementRateByReach, saveRate, averageRetention, vsMedian, pct, median } from "@/lib/analytics";
import { fmt } from "@/lib/time";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ content?: string }> }) {
  const sp = await searchParams;
  const orgId = await getOrgId();

  const selected = sp.content ? await prisma.content.findUnique({ where: { id: sp.content } }) : null;

  const snaps = await prisma.analyticsSnapshot.findMany({
    where: { content: { orgId } },
    include: { content: { select: { id: true, title: true, pillar: true } } },
    orderBy: { capturedAt: "desc" },
  });

  const chartData = snaps.filter((s) => s.window === "24h").slice(0, 10).reverse().map((s) => ({
    name: s.content.title.slice(0, 14),
    saves: s.saves ?? 0,
    reach: s.reach ?? 0,
  }));

  const saveMedian = median(snaps.filter((s) => s.saves != null).map((s) => s.saves!));
  const reachMedian = median(snaps.filter((s) => s.reach != null).map((s) => s.reach!));

  const postedNeedingAnalytics = await prisma.content.findMany({
    where: { orgId, postedAt: { not: null } },
    select: { id: true, title: true, _count: { select: { analytics: true } } },
    orderBy: { postedAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Learn from what you measure — honestly</p>
        <h1>Analytics</h1>
      </div>

      {selected ? (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg">Record analytics</h2>
            <LinkButton href="/analytics">Done</LinkButton>
          </div>
          <AnalyticsForm contentId={selected.id} contentTitle={selected.title} />
        </Card>
      ) : (
        <Card>
          <div className="eyebrow mb-2">Record analytics for a posted Reel</div>
          {postedNeedingAnalytics.length === 0 ? (
            <p className="text-sm text-grey">Nothing posted yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {postedNeedingAnalytics.map((c) => (
                <Link key={c.id} href={`/analytics?content=${c.id}`} className="chip hover:text-paper">
                  {c.title.slice(0, 28)} {c._count.analytics > 0 && <Badge tone="good" className="ml-1">{c._count.analytics}</Badge>}
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Snapshots" value={snaps.length} />
        <Stat label="Median saves" value={saveMedian ?? "—"} sub={snaps.length < 3 ? "need ≥3 to trust" : "recent"} />
        <Stat label="Median reach" value={reachMedian ?? "—"} />
        <Stat label="Confirmed" value={`${snaps.filter((s) => s.confirmed).length}/${snaps.length}`} />
      </div>

      <Section title="Saves — last 10 (24h)" desc="Saves signal usefulness better than likes. One post never proves a pattern.">
        <Card><SavesChart data={chartData} /></Card>
      </Section>

      <Section title="All snapshots" desc="Rates guard against divide-by-zero. Confidence reflects sample size.">
        {snaps.length === 0 ? (
          <Empty title="No analytics yet." hint="Post something, then record its 24-hour snapshot." />
        ) : (
          <div className="overflow-x-auto card p-0">
            <table className="w-full text-sm">
              <thead className="text-left text-grey border-b border-ink-line">
                <tr>
                  <th className="p-3">Reel</th><th className="p-3">Win</th><th className="p-3">Reach</th>
                  <th className="p-3">Saves</th><th className="p-3">ER</th><th className="p-3">Save rate</th>
                  <th className="p-3">Retention</th><th className="p-3">vs median (saves)</th>
                </tr>
              </thead>
              <tbody>
                {snaps.map((s) => {
                  const peers = snaps.filter((x) => x.id !== s.id && x.saves != null).map((x) => x.saves!);
                  const v = vsMedian(s.saves ?? null, peers);
                  return (
                    <tr key={s.id} className="border-b border-ink-line/60">
                      <td className="p-3"><Link href={`/content/${s.content.id}`} className="hover:underline">{s.content.title.slice(0, 24)}</Link></td>
                      <td className="p-3"><Badge>{s.window}</Badge></td>
                      <td className="p-3">{s.reach ?? "—"}</td>
                      <td className="p-3">{s.saves ?? "—"}</td>
                      <td className="p-3">{pct(engagementRateByReach(s))}</td>
                      <td className="p-3">{pct(saveRate(s))}</td>
                      <td className="p-3">{pct(averageRetention(s))}</td>
                      <td className="p-3 text-grey">{v.verdict} <Badge tone={v.confidence === "high" ? "good" : v.confidence === "low" ? "bad" : "warn"}>{v.confidence}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
