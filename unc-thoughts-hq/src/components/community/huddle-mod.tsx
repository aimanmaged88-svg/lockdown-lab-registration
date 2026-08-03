"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { huddleModerate } from "@/lib/huddle-actions";
import { Badge } from "@/components/ui";
import { Check, EyeOff } from "lucide-react";

type Item = { id: string; topic: string; body: string; name: string; reply: boolean; createdAt: string };

// UNC's verification queue: one tap ✓ makes a post visible to the community
// (and pings its author), one tap hides it forever.
export function HuddleModeration({ pending, recentLive }: { pending: Item[]; recentLive: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();

  const act = (id: string, action: "approve" | "hide") => {
    setBusy(id);
    start(async () => {
      try { await huddleModerate(id, action); } finally { setBusy(null); router.refresh(); }
    });
  };

  return (
    <div className="space-y-3">
      {pending.length === 0 ? (
        <p className="text-sm text-grey">Queue&apos;s clear — everything the community sees has your tick. 🏆</p>
      ) : (
        pending.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <Badge tone="warn">needs your tick</Badge>
              <Badge>{p.topic}</Badge>
              {p.reply && <Badge>reply</Badge>}
              <span className="text-xs text-grey">{p.name}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{p.body}</p>
            <div className="mt-3 flex gap-2">
              <button className="btn btn-primary text-xs" disabled={busy === p.id} onClick={() => act(p.id, "approve")}>
                <Check size={13} /> Verify — put it up
              </button>
              <button className="btn btn-ghost text-xs" disabled={busy === p.id} onClick={() => act(p.id, "hide")}>
                <EyeOff size={13} /> Hide
              </button>
            </div>
          </div>
        ))
      )}

      {recentLive.length > 0 && (
        <details>
          <summary className="text-xs text-grey cursor-pointer">Recently live ({recentLive.length}) — tap to review / take down</summary>
          <div className="space-y-2 mt-2">
            {recentLive.map((p) => (
              <div key={p.id} className="card p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex gap-2 items-center text-[11px] text-grey"><Badge>{p.topic}</Badge>{p.reply && <Badge>reply</Badge>}<span>{p.name}</span></div>
                  <p className="text-sm mt-1">{p.body}</p>
                </div>
                <button className="btn btn-ghost text-xs shrink-0" disabled={busy === p.id} onClick={() => act(p.id, "hide")}>
                  <EyeOff size={13} /> Take down
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
