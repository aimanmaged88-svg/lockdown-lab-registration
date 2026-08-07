import { prisma, getOrgId } from "@/lib/db";
import { Stat } from "@/components/ui";
import { SessionsClient } from "@/components/studio/sessions-client";
import { CalendarClock } from "lucide-react";

export const dynamic = "force-dynamic";

// The trainer's one-stop desk: what you'll make (calculator) and what you've
// made (session tracker). AUD.
export default async function SessionsPage() {
  const orgId = await getOrgId();
  const rows = await prisma.studioSession.findMany({
    where: { orgId },
    orderBy: [{ status: "asc" }, { date: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

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
        <Stat label="If they sell out" value={money(potential)} sub="upcoming at capacity" />
      </div>

      <SessionsClient
        sessions={rows.map((s) => ({
          id: s.id, title: s.title, topic: s.topic, date: s.date ? s.date.toISOString().slice(0, 10) : null,
          pricePerSeat: s.pricePerSeat, capacity: s.capacity, seatsSold: s.seatsSold, status: s.status,
        }))}
      />
    </div>
  );
}
