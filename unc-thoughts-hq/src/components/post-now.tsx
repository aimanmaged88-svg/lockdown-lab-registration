"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markPosted } from "@/lib/actions";
import { Check } from "lucide-react";

// One tap: it's posted. Optional IG link prompt kept out of the way.
export function PostNowButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  if (done) return <span className="chip border-good/50 text-good"><Check size={12} /> Posted</span>;
  return (
    <button
      className="btn btn-primary text-xs"
      disabled={pending}
      onClick={() => start(async () => { await markPosted(id); setDone(true); router.refresh(); })}
    >
      {pending ? "…" : "Mark posted"}
    </button>
  );
}
