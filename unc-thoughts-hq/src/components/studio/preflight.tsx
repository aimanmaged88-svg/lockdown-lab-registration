"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PREFLIGHT_CHECKS } from "@/lib/coach-content";
import { runPreflight } from "@/lib/actions";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

type State = Record<string, { pass: boolean; overrideReason?: string }>;

export function Preflight({
  contentId,
  initial,
  nutritionFlags,
}: {
  contentId?: string;
  initial?: State;
  nutritionFlags?: { category: string; message: string; suggestion: string }[];
}) {
  const [state, setState] = useState<State>(initial ?? Object.fromEntries(PREFLIGHT_CHECKS.map((c) => [c.key, { pass: false }])));
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState<null | boolean>(null);
  const router = useRouter();

  const set = (key: string, patch: Partial<State[string]>) => setState((s) => ({ ...s, [key]: { ...s[key], ...patch } }));
  const allGood = PREFLIGHT_CHECKS.every((c) => state[c.key]?.pass || state[c.key]?.overrideReason);

  function save() {
    if (!contentId) return;
    start(async () => {
      const res = await runPreflight(contentId, PREFLIGHT_CHECKS.map((c) => ({ key: c.key, pass: !!state[c.key]?.pass, overrideReason: state[c.key]?.overrideReason })));
      setSaved(res.passed);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {nutritionFlags && nutritionFlags.length > 0 && (
        <div className="card border-warn/40 p-3 space-y-2">
          <div className="eyebrow text-warn">Nutrition/safety language check</div>
          {nutritionFlags.map((f, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{f.category}:</span> <span className="text-grey">{f.message}</span>{" "}
              <span className="text-paper-dim">→ {f.suggestion}</span>
            </div>
          ))}
        </div>
      )}

      <ul className="space-y-1.5">
        {PREFLIGHT_CHECKS.map((c) => {
          const st = state[c.key] ?? { pass: false };
          const ok = st.pass || !!st.overrideReason;
          return (
            <li key={c.key} className="card p-3">
              <div className="flex items-center justify-between gap-3">
                <span className={cn("text-sm", ok ? "text-paper" : "text-paper-dim")}>{c.label}</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    aria-label="Pass"
                    onClick={() => set(c.key, { pass: true, overrideReason: undefined })}
                    className={cn("btn p-2", st.pass && "btn-primary")}
                  ><Check size={14} /></button>
                  <button
                    aria-label="Fail / needs override"
                    onClick={() => set(c.key, { pass: false })}
                    className={cn("btn p-2", !st.pass && !st.overrideReason && "border-bad/50")}
                  ><X size={14} /></button>
                </div>
              </div>
              {!st.pass && (
                <input
                  className="input mt-2 text-sm"
                  placeholder="Override reason (optional — records why this is OK to skip)"
                  value={st.overrideReason ?? ""}
                  onChange={(e) => set(c.key, { overrideReason: e.target.value })}
                />
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" onClick={save} disabled={pending || !contentId}>
          {pending ? "Saving…" : "Save preflight"}
        </button>
        <span className={cn("text-sm", allGood ? "text-good" : "text-warn")}>
          {allGood ? "All checks clear — safe to mark Ready." : "Some checks still open."}
        </span>
        {saved !== null && <span className="text-sm text-grey">{saved ? "Saved & passed." : "Saved."}</span>}
      </div>
      {!contentId && <p className="text-xs text-grey">Open preflight from a content item to save the result against it.</p>}
    </div>
  );
}
