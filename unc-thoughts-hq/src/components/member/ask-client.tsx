"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { askUnk } from "@/lib/unk/actions";
import type { UnkAnswer } from "@/lib/unk/answer";
import { AnswerCard } from "./answer-card";
import { Send } from "lucide-react";

const EXAMPLES = [
  "My game is at 7:30 PM. What should I do now?",
  "What can I eat before training?",
  "I feel flat. What should I focus on?",
  "I made a mistake early in the game. How do I reset?",
  "What should I do after training?",
  "I only have five minutes. What can I prepare?",
];

export function AskClient({ initialQuestion, autorun }: { initialQuestion?: string; autorun?: boolean }) {
  const [q, setQ] = useState(initialQuestion ?? "");
  const [result, setResult] = useState<(UnkAnswer & { logId: string }) | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ran = useRef(false);

  function submit(question: string) {
    if (!question.trim()) return;
    setErr(null);
    start(async () => {
      try {
        setResult(await askUnk({ question, source: "ask" }));
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  useEffect(() => {
    if (autorun && initialQuestion && !ran.current) {
      ran.current = true;
      submit(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => { e.preventDefault(); submit(q); }}
        className="flex gap-2"
      >
        <input
          className="input flex-1"
          placeholder="Ask Unk anything about today…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Ask Unk"
          autoFocus
        />
        <button className="btn btn-primary" disabled={pending || !q.trim()} type="submit">
          <Send size={15} /> {pending ? "…" : "Ask"}
        </button>
      </form>

      {err && <p className="text-sm text-accent-soft">{err}</p>}
      {result && <AnswerCard answer={result} logId={result.logId} question={q} />}

      {!result && !pending && (
        <div>
          <div className="eyebrow mb-1.5">Things people ask</div>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((e) => (
              <button key={e} className="chip hover:text-paper text-left" onClick={() => { setQ(e); submit(e); }}>{e}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
