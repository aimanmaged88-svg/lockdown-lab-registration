import { prisma, getOrgId } from "@/lib/db";
import { Card, Badge, LinkButton, pillarTone } from "@/components/ui";
import { WEEKLY_RHYTHM } from "@/lib/enums";
import { weekStart, isoDate, fmt } from "@/lib/time";
import { addDays } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const orgId = await getOrgId();
  const from = addDays(weekStart(), -7);
  const to = addDays(weekStart(), 28);
  const items = await prisma.content.findMany({
    where: { orgId, plannedDate: { gte: from, lt: to } },
    orderBy: { plannedDate: "asc" },
  });

  const byDay: Record<string, typeof items> = {};
  for (const c of items) {
    const key = isoDate(c.plannedDate!);
    (byDay[key] ??= []).push(c);
  }

  const days: Date[] = [];
  for (let d = from; d < to; d = addDays(d, 1)) days.push(new Date(d));
  const todayKey = isoDate(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Five weeks at a glance</p>
          <h1>Calendar</h1>
        </div>
        <LinkButton href="/content/new" primary>+ New content</LinkButton>
      </div>

      {/* Weekly rhythm reference */}
      <Card>
        <div className="eyebrow mb-2">Your weekly short-reel rhythm</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
          {WEEKLY_RHYTHM.map((r) => (
            <div key={r.day} className="rounded-lg border border-ink-line p-2">
              <div className="font-medium">{r.day}</div>
              <div className="text-grey text-xs">{r.series} · {r.seconds}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-2">
        {days.map((d) => {
          const key = isoDate(d);
          const dayItems = byDay[key] ?? [];
          const isToday = key === todayKey;
          const rhythm = WEEKLY_RHYTHM[(d.getDay() + 6) % 7];
          if (dayItems.length === 0 && !isToday) {
            return (
              <div key={key} className="flex items-center gap-3 px-3 py-1.5 text-sm text-grey">
                <span className="w-28 shrink-0">{fmt(d, "EEE d MMM")}</span>
                <span className="text-xs">{rhythm.series} — nothing planned</span>
              </div>
            );
          }
          return (
            <Card key={key} className={isToday ? "border-paper/30" : ""}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{fmt(d, "EEEE d MMM")} {isToday && <Badge tone="accent">Today</Badge>}</div>
                <div className="text-xs text-grey">{rhythm.series}</div>
              </div>
              {dayItems.length === 0 ? (
                <p className="text-sm text-grey">Nothing planned. <Link href="/content/new" className="underline">Add something</Link>.</p>
              ) : (
                <div className="space-y-2">
                  {dayItems.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3">
                      <Link href={`/content/${c.id}`} className="hover:underline">{c.title}</Link>
                      <div className="flex gap-2 shrink-0">
                        <Badge tone={pillarTone(c.pillar)}>{c.pillar}</Badge>
                        <Badge tone={["Posted", "Complete"].includes(c.status) ? "good" : "default"}>{c.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
