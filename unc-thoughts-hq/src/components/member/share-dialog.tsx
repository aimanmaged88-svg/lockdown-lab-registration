"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestShare } from "@/lib/unk/actions";

// Optional sharing — a SEPARATE, never-preselected action. Explains exactly
// what becomes public, shows a preview, requires explicit confirmation, and
// everything still passes moderation before anyone sees it.
export function ShareDialog({ reflectionId, defaultText }: { reflectionId: string; defaultText: string }) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0 closed, 1 compose, 2 preview
  const [text, setText] = useState(defaultText);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (msg) return <p className="text-xs text-grey mt-1">{msg}</p>;

  if (step === 0) {
    return (
      <button className="btn btn-ghost text-xs mt-1" onClick={() => setStep(1)}>
        Share something with the community
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-ink-line2 p-3 space-y-2">
      {step === 1 && (
        <>
          <p className="text-xs text-paper-dim">
            Sharing is optional and separate from your private answer. Edit the text below to exactly what you&apos;re happy
            to make public. It will appear in <strong>Wins &amp; Lessons</strong> as &ldquo;Community member&rdquo; (no name),
            <strong> after UNC reviews it</strong>. Your private answer stays private either way.
          </p>
          <textarea className="input text-sm" rows={3} value={text} onChange={(e) => setText(e.target.value)} aria-label="Text to share" />
          <div className="flex gap-2">
            <button className="btn text-xs" disabled={!text.trim()} onClick={() => setStep(2)}>Preview what becomes public</button>
            <button className="btn btn-ghost text-xs" onClick={() => setStep(0)}>Cancel — keep it private</button>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <div className="eyebrow">Preview — this exact text becomes public after review</div>
          <div className="rounded-lg border border-ink-line bg-ink-soft p-3">
            <p className="text-sm font-medium">Community member</p>
            <p className="text-sm text-paper-dim mt-1 whitespace-pre-wrap">{text}</p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-primary text-xs"
              disabled={pending}
              onClick={() => start(async () => {
                try {
                  await requestShare(reflectionId, text);
                  setMsg("Sent for review. It only becomes public if approved — your private answer is untouched.");
                  router.refresh();
                } catch (e) {
                  setMsg(e instanceof Error ? e.message : "Sharing failed");
                }
              })}
            >
              Confirm — submit for review
            </button>
            <button className="btn btn-ghost text-xs" onClick={() => setStep(1)}>Back</button>
          </div>
        </>
      )}
    </div>
  );
}
