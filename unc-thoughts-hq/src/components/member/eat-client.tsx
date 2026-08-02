"use client";
import { useState, useTransition } from "react";
import { askUnk } from "@/lib/unk/actions";
import type { UnkAnswer } from "@/lib/unk/answer";
import { AnswerCard } from "./answer-card";
import { cn } from "@/lib/cn";

// Time-aware "what should I eat?" — general education only. The member picks a
// situation and (optionally) how far away it is; the server answers by band.
const SITUATIONS = [
  { key: "training", label: "Before training", q: "What can I eat before training?" },
  { key: "game", label: "Before a game", q: "What should I eat before my game?" },
  { key: "after", label: "After a session", q: "What should I eat after training?" },
  { key: "normal", label: "Normal day", q: "What should I eat on a normal day?" },
];

const WINDOWS = [
  { label: "3+ hours away", minutes: 200 },
  { label: "About 2 hours", minutes: 120 },
  { label: "About 1 hour", minutes: 70 },
  { label: "Under 30 minutes", minutes: 20 },
];

export function EatClient() {
  const [sit, setSit] = useState(SITUATIONS[0]);
  const [win, setWin] = useState<number | null>(null);
  const [result, setResult] = useState<(UnkAnswer & { logId: string }) | null>(null);
  const [pending, start] = useTransition();

  function go() {
    start(async () => {
      const needsWindow = sit.key === "training" || sit.key === "game";
      setResult(await askUnk({
        question: sit.q,
        eventMinutes: sit.key === "after" ? 0 : needsWindow ? (win ?? 120) : undefined,
        source: "eat",
      }));
    });
  }

  const needsWindow = sit.key === "training" || sit.key === "game";

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {SITUATIONS.map((s) => (
            <button key={s.key} className={cn("chip hover:text-paper", sit.key === s.key && "border-paper/60 text-paper")} onClick={() => { setSit(s); setResult(null); }}>
              {s.label}
            </button>
          ))}
        </div>
        {needsWindow && (
          <div className="flex flex-wrap gap-1.5">
            {WINDOWS.map((w) => (
              <button key={w.label} className={cn("chip hover:text-paper", win === w.minutes && "border-paper/60 text-paper")} onClick={() => setWin(w.minutes)}>
                {w.label}
              </button>
            ))}
          </div>
        )}
        <button className="btn btn-primary w-full" onClick={go} disabled={pending}>{pending ? "Thinking…" : "Tell me"}</button>
      </div>
      {result && <AnswerCard answer={result} logId={result.logId} />}
    </div>
  );
}
