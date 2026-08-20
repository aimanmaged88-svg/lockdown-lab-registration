import Link from "next/link";
import { getMember } from "@/lib/member";
import { prisma } from "@/lib/db";
import { ContextCard } from "@/components/member/context-card";
import { MessageCircleQuestion, BookOpen, Lightbulb, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

// The member home, stripped back to basics for the Skool era: ask the AI,
// ask UNC himself, browse the Library, get today's thought, see your answers.
// Community talk lives in the Skool community, not here. The old tools
// (game-day, training, eat, recovery, consistency, huddle) keep their routes
// but are no longer surfaced — one commit brings any of them back.
export default async function MemberHome() {
  const member = await getMember();
  let due = 0;
  if (member) {
    due = await prisma.reflection.count({
      where: {
        memberId: member.id,
        followUp: null,
        OR: [{ reminderAt: { lte: new Date() } }, { actionChosen: { not: null }, createdAt: { lte: new Date(Date.now() - 864e5) } }],
      },
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">Ask UNC</h1>
        <p className="text-sm text-grey mt-1">Straight answers. Anonymous by default.</p>
      </div>

      {/* Ask the AI — one question field */}
      <form action="/member/ask" method="get" className="flex gap-2">
        <input name="q" className="input flex-1" placeholder="Ask UNC anything…" aria-label="Ask UNC" />
        <button className="btn btn-primary" type="submit">Ask</button>
      </form>

      {/* Ask UNC himself — the human behind the app */}
      <Link href="/member/question" className="card p-4 flex items-center justify-between hover:bg-ink-soft transition-colors border-paper/20">
        <span className="flex items-center gap-3">
          <MessageCircleQuestion size={18} className="text-paper-dim" />
          <span>
            <span className="block font-medium text-sm">Ask UNC himself</span>
            <span className="block text-[11px] text-grey">Real question → real answer from the man. Anonymous if you want.</span>
          </span>
        </span>
      </Link>

      {/* The Library + Today's thoughts */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/member/library" className="card p-4 hover:bg-ink-soft transition-colors">
          <BookOpen size={18} className="text-paper-dim" />
          <div className="font-medium text-sm mt-2">The Library</div>
          <div className="text-[11px] text-grey mt-0.5">Every question UNC has answered — browse by category</div>
        </Link>
        <Link href="/member/thought" className="card p-4 hover:bg-ink-soft transition-colors">
          <Lightbulb size={18} className="text-paper-dim" />
          <div className="font-medium text-sm mt-2">Today&apos;s thoughts</div>
          <div className="text-[11px] text-grey mt-0.5">Morning · afternoon · evening + your saves</div>
        </Link>
      </div>

      {/* My answers */}
      <Link href="/member/answers" className="card p-4 flex items-center justify-between hover:bg-ink-soft transition-colors">
        <span className="flex items-center gap-3">
          <Lock size={16} className="text-paper-dim" />
          <span>
            <span className="block font-medium text-sm">My answers</span>
            <span className="block text-[11px] text-grey">Your private history</span>
          </span>
        </span>
        {due > 0 && <span className="chip border-warn/50 text-warn">{due} to check in on</span>}
      </Link>

      <ContextCard ageBand={member?.ageBand ?? null} allergies={member?.allergies ?? null} />

      <p className="text-[11px] text-grey flex items-start gap-1.5">
        <MessageCircleQuestion size={13} className="shrink-0 mt-0.5" />
        UNC answers only from UNC&apos;s approved teaching and Australian sport-nutrition guidance. If it doesn&apos;t know, it says so.
      </p>
    </div>
  );
}
