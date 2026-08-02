"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { followUpReflection } from "@/lib/unk/actions";

// The follow-through check. No streaks, no shame — honest reflection and the
// next useful action.
const OPTIONS: Array<{ key: "yes" | "partly" | "not_yet" | "changed_plan"; label: string; reply: string }> = [
  { key: "yes", label: "Yes", reply: "Good. That's how standards get built." },
  { key: "partly", label: "Partly", reply: "Partly counts. What would make it all the way next time?" },
  { key: "not_yet", label: "Not yet", reply: "No drama. It's still there when you're ready — pick a smaller version if it helps." },
  { key: "changed_plan", label: "I changed my plan", reply: "Fair enough — plans should change when you learn something. Own the new one." },
];

export function FollowUp({ reflectionId }: { reflectionId: string }) {
  const router = useRouter();
  const [reply, setReply] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (reply) return <p className="text-xs text-paper-dim mt-1">{reply}</p>;
  return (
    <div className="mt-2">
      <p className="text-sm text-paper">You said you would do this. Did you follow through?</p>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            disabled={pending}
            className="btn text-xs"
            onClick={() => start(async () => { await followUpReflection(reflectionId, o.key); setReply(o.reply); router.refresh(); })}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
