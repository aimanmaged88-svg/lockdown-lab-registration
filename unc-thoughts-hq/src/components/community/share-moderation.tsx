"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateShare } from "@/lib/unk/actions";

// Owner moderation of member reflection shares: nothing becomes public
// without an explicit approve here.
export function ShareModeration({ reflectionId }: { reflectionId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const run = (approve: boolean) => start(async () => {
    try { await moderateShare(reflectionId, approve); router.refresh(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
  });
  return (
    <div className="flex items-center gap-2">
      {err && <span className="text-xs text-accent-soft">{err}</span>}
      <button className="btn text-xs btn-primary" disabled={pending} onClick={() => run(true)}>Approve → post anonymously</button>
      <button className="btn btn-ghost text-xs" disabled={pending} onClick={() => run(false)}>Decline (stays private)</button>
    </div>
  );
}
