import { prisma, getOrgId } from "@/lib/db";
import { Stat } from "@/components/ui";
import { SessionsClient } from "@/components/studio/sessions-client";
import { CalendarClock } from "lucide-react";
import { payLine } from "@/lib/live-actions";

export const dynamic = "force-dynamic";

// The trainer's one-stop desk: what you'll make (calculator) and what you've
// made (session tracker). AUD.
export default async function SessionsPage() {
  const orgId = await getOrgId();
  const [rows, bookings, pay] = await Promise.all([
    prisma.studioSession.findMany({
      where: { orgId },
      orderBy: [{ status: "asc" }, { date: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.seatBooking.findMany({
      where: { orgId, status: { not: "cancelled" } },
      orderBy: { createdAt: "asc" },
      take: 1000,
    }),
    payLine(),
  ]);
  const seatsBySession = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const list = seatsBySession.get(b.sessionId) ?? [];
    list.push(b);
    seatsBySession.set(b.sessionId, list);
  }
  const waiting = bookings.filter((b) => b.status === "held").length;

  const earned = rows.filter((s) => s.status === "done").reduce((a, s) => a + s.seatsSold * s.pricePerSeat, 0);
  const pipeline = rows.filter((s) => s.status === "planned").reduce((a, s) => a + s.seatsSold * s.pricePerSeat, 0);
  const potential = rows.filter((s) => s.status === "planned").reduce((a, s) => a + s.capacity * s.pricePerSeat, 0);
  const run = rows.filter((s) => s.status === "done").length;
  const seatsFilled = rows.filter((s) => s.status === "done").reduce((a, s) => a + s.seatsSold, 0);
  const money = (n: number) => "$" + n.toLocaleString("en-AU");

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Your trainer desk</p>
        <h1 className="flex items-center gap-2"><CalendarClock size={26} /> Sessions &amp; money</h1>
        <p className="text-sm text-grey mt-1">
          Work out what a run makes, log every session, and watch it add up. Run
          session after session — this keeps the tally.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Earned so far" value={money(earned)} sub={`${run} session${run === 1 ? "" : "s"} run`} />
        <Stat label="Seats filled" value={seatsFilled} sub="all-time, completed" />
        <Stat label="Booked pipeline" value={money(pipeline)} sub="seats sold, upcoming" />
        <Stat label="Waiting on money" value={waiting} sub="seats held, not paid" />
      </div>

      <SessionsClient
        payLine={pay}
        sessions={rows.map((s) => ({
          id: s.id, title: s.title, topic: s.topic, date: s.date ? s.date.toISOString().slice(0, 10) : null,
          pricePerSeat: s.pricePerSeat, capacity: s.capacity, seatsSold: s.seatsSold, status: s.status,
          listed: s.listed, timeText: s.timeText, blurb: s.blurb, ageBand: s.ageBand, joinUrl: s.joinUrl,
          seats: (seatsBySession.get(s.id) ?? []).map((b) => ({
            id: b.id, name: b.name, contact: b.contact, note: b.note,
            status: b.status, at: b.createdAt.toISOString(),
          })),
        }))}
      />
    </div>
  );
}
