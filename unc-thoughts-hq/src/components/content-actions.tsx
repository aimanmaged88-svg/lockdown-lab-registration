"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  markPosted, rescheduleContent, skipContent, duplicateContent, repurposeContent, setContentStatus,
} from "@/lib/actions";

// Quick actions used on Today + Content detail. Reliable inline prompts keep it
// simple and keyboard-accessible; nothing here ever runs without a click.
export function ContentActions({ id, compact }: { id: string; compact?: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });

  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn btn-primary" disabled={pending} onClick={() => run(() => setContentStatus(id, "Ready"))}>
        Mark ready
      </button>
      <button className="btn" disabled={pending} onClick={() => {
        const url = window.prompt("Instagram URL (optional):") ?? undefined;
        run(() => markPosted(id, url || undefined));
      }}>
        Mark posted
      </button>
      <button className="btn" disabled={pending} onClick={() => {
        const d = window.prompt("Reschedule to (YYYY-MM-DD):");
        if (d) run(() => rescheduleContent(id, d));
      }}>
        Reschedule
      </button>
      {!compact && (
        <>
          <button className="btn" disabled={pending} onClick={() => run(() => setContentStatus(id, "Idea"))}>
            Simplify
          </button>
          <button className="btn" disabled={pending} onClick={() => {
            const r = window.prompt("Reason for skipping:");
            if (r) run(() => skipContent(id, r));
          }}>
            Skip
          </button>
          <button className="btn" disabled={pending} onClick={() => run(() => duplicateContent(id))}>
            Duplicate
          </button>
          <button className="btn" disabled={pending} onClick={() => {
            const t = window.prompt("Repurpose as (e.g. Reply Reel, Story poll, Highlight lesson):", "Reply Reel");
            if (t) run(() => repurposeContent(id, t));
          }}>
            Repurpose
          </button>
        </>
      )}
      <Link className="btn" href={`/studio?content=${id}`}>Start recording</Link>
      <Link className="btn" href={`/analytics?content=${id}`}>Add analytics</Link>
    </div>
  );
}
