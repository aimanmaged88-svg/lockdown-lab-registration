"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editAnswer } from "@/lib/unk/actions";
import { Pencil, Check } from "lucide-react";

// Change an answer after you've sent it. Updates the public Library entry and
// the brain copy the AI quotes, so the app never says two different things.
export function EditAnswer({ questionId, answer, inLibrary }: { questionId: string; answer: string; inLibrary: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(answer);
  const [lib, setLib] = useState(inLibrary);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) return <p className="text-[11px] text-good flex items-center gap-1 mt-1"><Check size={12} /> {done}</p>;

  if (!open) {
    return (
      <button className="btn btn-ghost text-[11px] mt-1" onClick={() => setOpen(true)}>
        <Pencil size={11} /> Edit answer
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {err && <p className="text-xs text-accent-soft">{err}</p>}
      <textarea
        className="input text-sm" rows={5} autoFocus value={text}
        onChange={(e) => setText(e.target.value)} aria-label="Edit your answer"
      />
      <label className="flex items-center gap-2 text-[11px] text-paper-dim">
        <input type="checkbox" checked={lib} onChange={(e) => setLib(e.target.checked)} />
        🧠 Keep it in UNC&apos;s brain + the public library — untick to pull it back out
      </label>
      <div className="flex gap-2">
        <button
          className="btn btn-primary text-xs"
          disabled={pending || !text.trim() || (text === answer && lib === inLibrary)}
          onClick={() => start(async () => {
            try {
              setErr(null);
              const r = await editAnswer(questionId, text, lib);
              setDone(r.inLibrary ? "Updated — live in the library and the brain." : "Updated — pulled out of the library.");
              router.refresh();
            } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
          })}
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <button className="btn btn-ghost text-xs" onClick={() => { setOpen(false); setText(answer); setLib(inLibrary); }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
