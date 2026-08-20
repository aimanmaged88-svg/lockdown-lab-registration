import Link from "next/link";
import { HomePersonal } from "@/components/member/home-personal";
import { MessageCircleQuestion, BookOpen, Lightbulb } from "lucide-react";

// Static: the home does no database work before painting. The personal tail
// (your context + reflection count) loads client-side via HomePersonal.
export const dynamic = "force-static";

// The member home, stripped back to basics for the Skool era: ask the AI,
// ask UNC himself, browse the Library, get today's thought, see your answers.
// Community talk lives in the Skool community, not here. The old tools
// (game-day, training, eat, recovery, consistency, huddle) keep their routes
// but are no longer surfaced — one commit brings any of them back.
export default function MemberHome() {
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

      <HomePersonal />

      <p className="text-[11px] text-grey flex items-start gap-1.5">
        <MessageCircleQuestion size={13} className="shrink-0 mt-0.5" />
        UNC answers only from UNC&apos;s approved teaching and Australian sport-nutrition guidance. If it doesn&apos;t know, it says so.
      </p>
    </div>
  );
}
