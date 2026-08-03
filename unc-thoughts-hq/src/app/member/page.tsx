import Link from "next/link";
import { getMember } from "@/lib/member";
import { prisma } from "@/lib/db";
import { ContextCard } from "@/components/member/context-card";
import { MessageCircleQuestion, Trophy, Dumbbell, Apple, Brain, BatteryCharging, Lightbulb, Lock, Flame } from "lucide-react";

export const dynamic = "force-dynamic";

// The member home. Deliberately small: nine things, no feed.
const TILES = [
  { href: "/member/game", label: "Game today", note: "Quick game-day prep", icon: Trophy },
  { href: "/member/training", label: "Training today", note: "Quick training prep", icon: Dumbbell },
  { href: "/member/eat", label: "What should I eat?", note: "Time-aware, general education", icon: Apple },
  { href: "/member/mindset", label: "Mindset reset", note: "One cue, one action", icon: Brain },
  { href: "/member/recovery", label: "Recovery", note: "Post-session basics", icon: BatteryCharging },
  { href: "/member/thought", label: "Thought of the Day", note: "Private accountability", icon: Lightbulb },
];

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
        <h1 className="text-2xl">Ask Unk</h1>
        <p className="text-sm text-grey mt-1">Straight answers for today. Private reflection by default.</p>
      </div>

      {/* 1. Ask Unk — one question field */}
      <form action="/member/ask" method="get" className="flex gap-2">
        <input name="q" className="input flex-1" placeholder="Ask Unk anything about today…" aria-label="Ask Unk" />
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

      {/* 2–7 */}
      <div className="grid grid-cols-2 gap-2.5">
        {TILES.map(({ href, label, note, icon: Icon }) => (
          <Link key={href} href={href} className="card p-4 hover:bg-ink-soft transition-colors">
            <Icon size={18} className="text-paper-dim" />
            <div className="font-medium text-sm mt-2">{label}</div>
            <div className="text-[11px] text-grey mt-0.5">{note}</div>
          </Link>
        ))}
      </div>

      {/* 8. Consistency Chart */}
      <Link href="/member/consistency" className="card p-4 flex items-center justify-between hover:bg-ink-soft transition-colors">
        <span className="flex items-center gap-3">
          <Flame size={16} className="text-paper-dim" />
          <span>
            <span className="block font-medium text-sm">Consistency Chart</span>
            <span className="block text-[11px] text-grey">Tag your day. Your own data shows what works.</span>
          </span>
        </span>
      </Link>

      {/* 9. My answers */}
      <Link href="/member/answers" className="card p-4 flex items-center justify-between hover:bg-ink-soft transition-colors">
        <span className="flex items-center gap-3">
          <Lock size={16} className="text-paper-dim" />
          <span>
            <span className="block font-medium text-sm">My answers</span>
            <span className="block text-[11px] text-grey">Your private reflection history</span>
          </span>
        </span>
        {due > 0 && <span className="chip border-warn/50 text-warn">{due} to check in on</span>}
      </Link>

      <ContextCard ageBand={member?.ageBand ?? null} allergies={member?.allergies ?? null} />

      <p className="text-[11px] text-grey flex items-start gap-1.5">
        <MessageCircleQuestion size={13} className="shrink-0 mt-0.5" />
        Unk answers only from UNC&apos;s approved teaching and Australian sport-nutrition guidance. If it doesn&apos;t know, it says so.
      </p>
    </div>
  );
}
