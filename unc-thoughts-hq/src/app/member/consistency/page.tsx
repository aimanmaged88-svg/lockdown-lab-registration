import { getMember } from "@/lib/member";
import { prisma } from "@/lib/db";
import { isoDate } from "@/lib/time";
import { showedUp, computeInsights, gridDays, type HabitLogLite } from "@/lib/consistency";
import { ConsistencyClient } from "@/components/member/consistency-client";
import Link from "next/link";

export const dynamic = "force-dynamic";

// The Consistency Chart. Tag what you did, log your energy, and let YOUR OWN
// data show what works — like good fats two days before a game. Private to
// this device's member. No streaks, no shame.
export default async function ConsistencyPage() {
  const member = await getMember();
  const today = isoDate(new Date());

  let logs: HabitLogLite[] = [];
  if (member) {
    // 28 display days + the lookback window before them.
    const start = new Date(new Date(today + "T00:00:00Z").getTime() - 31 * 864e5).toISOString().slice(0, 10);
    const rows = await prisma.habitLog.findMany({
      where: { memberId: member.id, day: { gte: start } },
      orderBy: { day: "asc" },
    });
    logs = rows.map((r) => ({ day: r.day, tags: r.tags ? r.tags.split(",") : [], energy: r.energy }));
  }

  const todayLog = logs.find((l) => l.day === today);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/member" className="text-xs text-grey hover:underline">← Back</Link>
        <h1 className="text-2xl mt-1">Consistency Chart</h1>
        <p className="text-sm text-grey mt-1">
          Tag your day. Log your energy. Your own numbers show you what works — that&apos;s Mamba-level honesty.
        </p>
      </div>
      <ConsistencyClient
        initialTags={todayLog?.tags ?? []}
        initialEnergy={todayLog?.energy ?? null}
        grid={gridDays(logs, today)}
        showed={showedUp(logs, today)}
        insights={computeInsights(logs)}
      />
    </div>
  );
}
