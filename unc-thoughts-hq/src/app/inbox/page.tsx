import { prisma, getOrgId } from "@/lib/db";
import { Badge, pillarTone } from "@/components/ui";
import { QuickReply } from "@/components/community/quick-reply";
import { HuddleModeration } from "@/components/community/huddle-mod";
import { huddleQueue } from "@/lib/huddle-actions";
import { QUESTION_TREE } from "@/lib/member-shared";
import { fmt } from "@/lib/time";
import Link from "next/link";
import { Bell, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

// The simple inbox: every open question, one reply box each, nothing else.
// Reply once → they're notified, the brain learns, the loop closes, the card
// leaves. The full Community desk (filters, Signal Map, history) stays put.
export default async function InboxPage() {
  const orgId = await getOrgId();
  const [questions, huddle] = await Promise.all([
    prisma.communityQuestion.findMany({ where: { orgId, status: "open" }, orderBy: { createdAt: "asc" } }),
    huddleQueue(),
  ]);
  const waiting = questions.length + huddle.pending.length;

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Read → reply → done</p>
          <h1 className="flex items-center gap-2"><Inbox size={26} /> Inbox</h1>
        </div>
        <span className={`chip pointer-events-none ${waiting ? "border-warn/50 text-warn" : "text-good"}`}>
          {waiting ? `${waiting} waiting` : "all clear 🏆"}
        </span>
      </div>

      <p className="text-sm text-grey -mt-2">
        Every reply here does it all: answers them in the app, pings their phone,
        and becomes part of UNC&apos;s brain — your answers are the wisdom feed now.
      </p>

      {questions.length === 0 ? (
        <div className="card p-5 text-sm text-grey">No open questions. When one lands, your phone buzzes and it shows up here — oldest first, so nobody waits longest.</div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="card p-4">
              <p className="text-[15px] leading-relaxed">{q.text}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {q.pillar && <Badge tone={pillarTone(q.pillar)}>{QUESTION_TREE[q.pillar]?.icon} {q.pillar}</Badge>}
                {q.problem && <Badge>{q.problem}</Badge>}
                {q.audience && <Badge>{q.audience}</Badge>}
                <Badge tone="accent">{q.askedBy || "Anonymous"}</Badge>
                {q.notify && <Badge tone="warn"><Bell size={10} className="inline mr-0.5" />gets the ping</Badge>}
                <span className="text-[11px] text-grey ml-auto">{fmt(q.createdAt)}</span>
              </div>
              <div className="mt-3">
                <QuickReply questionId={q.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="eyebrow mb-2">Huddle — waiting for your tick ({huddle.pending.length})</div>
        <HuddleModeration pending={huddle.pending} recentLive={[]} />
      </div>

      <p className="text-xs text-grey">
        Need filters, history or the Signal Map? <Link href="/community" className="underline">Open the full Community desk →</Link>
      </p>
    </div>
  );
}
