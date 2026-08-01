"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Timer, Play, Pause, RotateCcw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

// The 20-minute operating mode. Four calm 5-minute blocks so the app never
// becomes more work than Instagram itself. No manufactured urgency — the timer
// is a guide you can ignore.
const STEPS = [
  { title: "Review today", detail: "5 min — scan the plan, pick your one thing.", min: 5 },
  { title: "Publish or prepare", detail: "5 min — post what's ready, or record one take.", min: 5 },
  { title: "Reply to comments", detail: "5 min — answer the meaningful ones only.", min: 5 },
  { title: "Analytics + next question", detail: "5 min — log one snapshot, pick the next question.", min: 5 },
];

export function TwentyMinuteMode({ focusId, openQuestions }: { hasFocus?: boolean; focusId?: string; openQuestions: number }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(STEPS[0].min * 60);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
      return () => { if (ref.current) clearInterval(ref.current); };
    }
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  function next() {
    const n = Math.min(STEPS.length - 1, step + 1);
    setStep(n);
    setSeconds(STEPS[n].min * 60);
  }
  function reset() {
    setStep(0);
    setSeconds(STEPS[0].min * 60);
    setRunning(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="card w-full flex items-center justify-between gap-3 p-4 hover:bg-ink-soft transition-colors text-left"
      >
        <span className="flex items-center gap-3">
          <Timer size={20} className="text-paper-dim" />
          <span>
            <span className="block font-medium">Start 20-minute mode</span>
            <span className="block text-sm text-grey">Four calm 5-minute blocks. In, done, out.</span>
          </span>
        </span>
        <ChevronRight size={18} className="text-grey" />
      </button>
    );
  }

  const s = STEPS[step];

  return (
    <div className="card p-5 border-paper/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">20-minute mode · Block {step + 1} of 4</div>
          <h2 className="mt-1 text-lg">{s.title}</h2>
          <p className="text-sm text-grey mt-0.5">{s.detail}</p>
        </div>
        <div className="text-3xl font-display tabular-nums">{mm}:{ss}</div>
      </div>

      {/* Contextual helper per step */}
      <div className="mt-4 text-sm text-paper-dim">
        {step === 0 && <p>Look at Today. If something can wait, leave it for later — this mode is for what matters now.</p>}
        {step === 1 && (
          <p>
            {focusId ? (
              <>Prepare or post today&apos;s content. <Link className="underline" href={`/content/${focusId}`}>Open it</Link> or <Link className="underline" href={`/studio?content=${focusId}`}>record a take</Link>.</>
            ) : (
              <>Nothing planned — <Link className="underline" href="/content/new">bank one idea</Link> for tomorrow.</>
            )}
          </p>
        )}
        {step === 2 && <p>Reply to the {openQuestions} question{openQuestions === 1 ? "" : "s"} that deserve it. <Link className="underline" href="/community">Open the inbox</Link>. Skip the noise.</p>}
        {step === 3 && <p>Log one analytics snapshot and choose the next community question to answer. <Link className="underline" href="/analytics">Analytics</Link> · <Link className="underline" href="/community">Questions</Link>.</p>}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button className="btn btn-primary" onClick={() => setRunning((r) => !r)}>
          {running ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Start</>}
        </button>
        <button className="btn" onClick={next} disabled={step === STEPS.length - 1}>Next block</button>
        <button className="btn btn-ghost" onClick={reset}><RotateCcw size={15} /> Reset</button>
        <button className="btn btn-ghost ml-auto" onClick={() => { setOpen(false); reset(); }}>Close</button>
      </div>

      <div className="mt-4 flex gap-1">
        {STEPS.map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-paper" : "bg-ink-line")} />
        ))}
      </div>
    </div>
  );
}
