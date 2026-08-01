"use client";
import { useState, useTransition } from "react";
import { toggleTask } from "@/lib/actions";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export type TaskLite = { id: string; kind: string; label: string; done: boolean };

const WHY: Record<string, string> = Object.fromEntries(
  // pulled from enums CHECKLIST_STEPS.why at runtime via data attribute instead
  [],
);

export function Checklist({ tasks, whyMap }: { tasks: TaskLite[]; whyMap?: Record<string, string> }) {
  const [items, setItems] = useState(tasks);
  const [pending, start] = useTransition();

  function flip(id: string, done: boolean) {
    setItems((xs) => xs.map((t) => (t.id === id ? { ...t, done } : t))); // optimistic
    start(async () => {
      try {
        await toggleTask(id, done);
      } catch {
        setItems((xs) => xs.map((t) => (t.id === id ? { ...t, done: !done } : t)));
      }
    });
  }

  const doneCount = items.filter((t) => t.done).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="eyebrow">Production checklist</span>
        <span className="text-xs text-grey">{doneCount}/{items.length}</span>
      </div>
      <ul className="divide-y divide-ink-line">
        {items.map((t) => (
          <li key={t.id}>
            <button
              onClick={() => flip(t.id, !t.done)}
              disabled={pending}
              className="w-full flex items-start gap-3 py-2 text-left group"
              aria-pressed={t.done}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                  t.done ? "bg-paper border-paper text-ink" : "border-ink-line2 text-transparent group-hover:border-paper/40",
                )}
              >
                <Check size={14} strokeWidth={3} />
              </span>
              <span className="min-w-0">
                <span className={cn("text-sm", t.done ? "text-grey line-through" : "text-paper")}>{t.label}</span>
                {whyMap?.[t.kind] && !t.done && (
                  <span className="block text-xs text-grey mt-0.5">{whyMap[t.kind]}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
