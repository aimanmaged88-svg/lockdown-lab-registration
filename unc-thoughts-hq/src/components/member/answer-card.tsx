"use client";
import { useState, useTransition } from "react";
import type { UnkAnswer } from "@/lib/unk/answer";
import { askFeedback } from "@/lib/unk/actions";
import { ReflectionComposer } from "./reflection-composer";
import { cn } from "@/lib/cn";
import { AlertTriangle, HelpCircle } from "lucide-react";

// Renders an Ask UNC answer: readable in ~20 seconds, Why? for depth.
export function AnswerCard({ answer, logId, question }: { answer: UnkAnswer; logId?: string; question?: string }) {
  const [why, setWhy] = useState(false);
  const [fb, setFb] = useState<string | null>(null);
  const [avail, setAvail] = useState("");
  const [pending, start] = useTransition();

  const tone =
    answer.mode === "escalate" ? "border-bad/60" :
    answer.mode === "redirect" ? "border-warn/60" :
    answer.mode === "unsupported" ? "border-ink-line2" : "border-ink-line";

  const send = (patch: Parameters<typeof askFeedback>[1], label: string) =>
    start(async () => { if (logId) await askFeedback(logId, patch); setFb(label); });

  const Section = ({ title, text }: { title: string; text?: string }) =>
    text ? (
      <div>
        <div className="eyebrow">{title}</div>
        <p className="text-sm text-paper whitespace-pre-wrap mt-0.5">{text}</p>
      </div>
    ) : null;

  return (
    <div className={cn("card p-4 space-y-4 animate-fadein", tone)}>
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg leading-snug normal-case tracking-normal font-semibold font-sans">{answer.headline}</h2>
        {answer.mode === "escalate" && <AlertTriangle size={18} className="text-accent-soft shrink-0 mt-1" />}
      </div>

      {(answer.bandLabel || answer.timeNote) && (
        <div className="text-xs text-grey space-y-0.5">
          {answer.bandLabel && <p>⏱ {answer.bandLabel}</p>}
          {answer.timeNote && <p>{answer.timeNote}</p>}
        </div>
      )}

      {answer.bullets.length > 0 && (
        <div className="space-y-2">
          {answer.bullets.map((b, i) => <p key={i} className="text-sm text-paper">{b}</p>)}
        </div>
      )}

      <Section title="Do this now" text={answer.sections.doNow} />
      <Section title="Food and fluids" text={answer.sections.food} />
      <Section title="Mindset cue" text={answer.sections.mindset} />
      <Section title="Be careful with" text={answer.sections.careful} />

      {answer.sections.privateQ && (
        <div className="rounded-xl border border-ink-line2 bg-ink-soft p-3">
          <div className="eyebrow">Answer this privately</div>
          <p className="text-sm text-paper mt-0.5">{answer.sections.privateQ}</p>
          <p className="text-xs text-grey mt-1.5">{answer.privacyLine}</p>
          <ReflectionComposer promptText={answer.sections.privateQ} compact />
        </div>
      )}

      {answer.guardianNote && <p className="text-xs text-warn">{answer.guardianNote}</p>}

      {answer.why && (
        <div>
          <button className="btn btn-ghost text-xs" onClick={() => setWhy((w) => !w)}>
            <HelpCircle size={13} /> {why ? "Hide why" : "Why?"}
          </button>
          {why && (
            <div className="mt-2 text-sm text-paper-dim whitespace-pre-wrap">
              {answer.why}
              {answer.usedItems.length > 0 && (
                <p className="text-xs text-grey mt-2">
                  From UNC&apos;s approved teaching: {answer.usedItems.map((u) => u.title).join(" · ")}
                  {answer.usedItems.some((u) => u.source) && ` — sources: ${[...new Set(answer.usedItems.map((u) => u.source).filter(Boolean))].join("; ")}`}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* The funnel to the man himself — always available, loudest when UNC couldn't help. */}
      {question && answer.mode !== "escalate" && (
        <a
          href={`/member/question?q=${encodeURIComponent(question.slice(0, 400))}`}
          className={cn("block text-sm underline", answer.mode === "unsupported" ? "text-paper" : "text-grey text-xs")}
        >
          {answer.mode === "unsupported" ? "UNC couldn't back this one — send it to UNC himself →" : "Want the man himself? Send this to UNC →"}
        </a>
      )}

      {logId && answer.mode !== "escalate" && (
        <div className="pt-2 border-t border-ink-line">
          {fb ? (
            <p className="text-xs text-grey">{fb}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-grey">Was this useful?</span>
              <button className="btn btn-ghost text-xs" disabled={pending} onClick={() => send({ useful: true }, "Noted. Good luck out there.")}>Yes</button>
              <button className="btn btn-ghost text-xs" disabled={pending} onClick={() => send({ useful: false, unclear: true }, "Fair enough — flagged so it gets clearer.")}>Unclear</button>
              <input
                className="input w-auto flex-1 min-w-[140px] text-xs py-1.5"
                placeholder="What did you have available? (optional)"
                value={avail}
                onChange={(e) => setAvail(e.target.value)}
                onBlur={() => avail.trim() && send({ hadAvailable: avail }, "Noted. Good luck out there.")}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
