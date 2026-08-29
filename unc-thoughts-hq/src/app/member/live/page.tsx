import { liveSessions, payLine, mySeats } from "@/lib/live-actions";
import { LiveClient } from "@/components/member/live-client";
import Link from "next/link";
import { Radio } from "lucide-react";

export const dynamic = "force-dynamic";

// UNC LIVE: what's on, what it costs, and a hand-up button. The seat is held
// the moment they ask; UNC confirms it once the money lands.
export default async function LivePage() {
  const [sessions, pay, mine] = await Promise.all([liveSessions(), payLine(), mySeats()]);
  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Online, live, with UNC</p>
        <h1 className="text-2xl flex items-center gap-2"><Radio size={24} /> UNC LIVE</h1>
        <p className="text-sm text-grey mt-1">
          Small online sessions you actually take part in — mindset, defence, nutrition
          and basketball IQ. Cameras on, questions welcome, no lecture. Grab a seat and
          UNC will send you the link.
        </p>
      </div>

      <LiveClient sessions={sessions} payLine={pay} mine={mine} />

      <p className="text-[11px] text-grey">
        Got a question before you commit?{" "}
        <Link href="/member/question" className="underline">Ask UNC himself →</Link>
      </p>
    </div>
  );
}
