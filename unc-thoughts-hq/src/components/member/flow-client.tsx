"use client";
import { useState, useTransition } from "react";
import { askUnk } from "@/lib/unk/actions";
import type { UnkAnswer } from "@/lib/unk/answer";
import { AnswerCard } from "./answer-card";

// Quick game/training preparation flow. Asks only what changes the answer:
// event time, warm-up time, eaten recently, what's available, allergies note.
// The server turns the time into a BAND — no false precision.
export function FlowClient({ kind, allergies }: { kind: "game" | "training"; allergies?: string | null }) {
  const [time, setTime] = useState("");
  const [warmup, setWarmup] = useState("");
  const [eaten, setEaten] = useState<"yes" | "no" | "">("");
  const [available, setAvailable] = useState("");
  const [result, setResult] = useState<(UnkAnswer & { logId: string }) | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function go() {
    setErr(null);
    const anchor = warmup || time; // answer for warm-up if given — that's the real deadline
    const label = kind === "game" ? "game" : "training";
    const q = [
      `My ${label} is today${time ? ` at ${time}` : ""}.`,
      warmup ? `Warm-up is at ${warmup}.` : "",
      eaten === "yes" ? "I've eaten recently." : eaten === "no" ? "I haven't eaten recently." : "",
      available ? `Available: ${available}.` : "",
      `What should I do now?`,
    ].filter(Boolean).join(" ");
    start(async () => {
      try {
        setResult(await askUnk({ question: q, eventTime: anchor || undefined, source: kind }));
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="ftime">What time is the {kind}?</label>
            <input id="ftime" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="fwarm">Warm-up time (optional)</label>
            <input id="fwarm" type="time" className="input" value={warmup} onChange={(e) => setWarmup(e.target.value)} />
          </div>
        </div>
        <div>
          <span className="label">Have you eaten recently?</span>
          <div className="flex gap-2">
            <button type="button" className={`btn flex-1 ${eaten === "yes" ? "btn-primary" : ""}`} onClick={() => setEaten("yes")}>Yes</button>
            <button type="button" className={`btn flex-1 ${eaten === "no" ? "btn-primary" : ""}`} onClick={() => setEaten("no")}>No</button>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="favail">What familiar options are available? (optional)</label>
          <input id="favail" className="input" placeholder="e.g. banana, sandwiches, water" value={available} onChange={(e) => setAvailable(e.target.value)} />
        </div>
        {allergies && (
          <p className="text-xs text-grey">Your allergy note is on file: <span className="text-paper-dim">{allergies}</span> — Unk will remind you to stick to known-safe options. Update it on the member home screen.</p>
        )}
        <button className="btn btn-primary w-full" onClick={go} disabled={pending || !time}>
          {pending ? "Thinking…" : `What should I do now?`}
        </button>
      </div>

      {err && <p className="text-sm text-accent-soft">{err}</p>}
      {result && <AnswerCard answer={result} logId={result.logId} />}
    </div>
  );
}
