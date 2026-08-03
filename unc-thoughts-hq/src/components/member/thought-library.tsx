"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveThought, unsaveThought } from "@/lib/thought-actions";
import { Heart, X } from "lucide-react";

// One-tap save: the heart is the taste signal that tunes tomorrow's thoughts.
export function SaveThoughtButton({ promptId, saved }: { promptId: string; saved: boolean }) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(saved);
  const [pending, start] = useTransition();
  return (
    <button
      className={`btn text-xs ${isSaved ? "btn-primary" : ""}`}
      disabled={pending}
      onClick={() => start(async () => {
        await saveThought(promptId);
        setIsSaved(true);
        router.refresh();
      })}
      aria-pressed={isSaved}
    >
      <Heart size={13} fill={isSaved ? "currentColor" : "none"} /> {isSaved ? "In your library" : "Save this one"}
    </button>
  );
}

export function LibraryList({ items }: { items: { id: string; text: string; pillar: string }[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [gone, setGone] = useState<Set<string>>(new Set());
  const shown = items.filter((i) => !gone.has(i.id));
  if (shown.length === 0) return <p className="text-sm text-grey">Tap the ♥ on any thought that hits — it lands here, and tomorrow&apos;s thoughts start sounding more like you.</p>;
  return (
    <div className="space-y-2">
      {shown.map((t) => (
        <div key={t.id} className="card p-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm leading-relaxed">{t.text}</p>
            <span className="text-[11px] text-grey">{t.pillar}</span>
          </div>
          <button
            className="btn btn-ghost text-xs shrink-0" aria-label="Remove from library"
            onClick={() => start(async () => { setGone(new Set([...gone, t.id])); await unsaveThought(t.id); router.refresh(); })}
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
