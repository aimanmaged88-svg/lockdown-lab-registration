"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { memberSnapshot } from "@/lib/unk/actions";
import { ContextCard } from "./context-card";
import { Lock } from "lucide-react";

// The personal tail of the member home. The page itself is static so it
// paints instantly; this reads your context and reflection count afterwards.
export function HomePersonal() {
  const [snap, setSnap] = useState<{ ageBand: string | null; allergies: string | null; due: number } | null>(null);
  useEffect(() => {
    let live = true;
    memberSnapshot().then((s) => { if (live) setSnap(s); }).catch(() => {});
    return () => { live = false; };
  }, []);

  return (
    <>
      <Link href="/member/answers" className="card p-4 flex items-center justify-between hover:bg-ink-soft transition-colors">
        <span className="flex items-center gap-3">
          <Lock size={16} className="text-paper-dim" />
          <span>
            <span className="block font-medium text-sm">My answers</span>
            <span className="block text-[11px] text-grey">Your private history</span>
          </span>
        </span>
        {snap && snap.due > 0 && <span className="chip border-warn/50 text-warn">{snap.due} to check in on</span>}
      </Link>

      <ContextCard key={snap ? "loaded" : "empty"} ageBand={snap?.ageBand ?? null} allergies={snap?.allergies ?? null} />
    </>
  );
}
