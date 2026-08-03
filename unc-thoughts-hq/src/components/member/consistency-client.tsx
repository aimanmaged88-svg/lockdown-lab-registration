"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveHabitLog } from "@/lib/consistency-actions";
import { HABIT_TAGS, type ConsistencyInsight } from "@/lib/consistency";
import { cn } from "@/lib/cn";
import { Check, Flame } from "lucide-react";

const ENERGY = [
  { v: 1, label: "Flat" },
  { v: 2, label: "Low" },
  { v: 3, label: "Okay" },
  { v: 4, label: "Good" },
  { v: 5, label: "Electric" },
];

// Dot shade per energy level (grid). No log = hollow. Tagged-but-no-energy = dim.
function dotClass(energy: number | null, tagged: boolean): string {
  if (energy == null && !tagged) return "border border-ink-line bg-transparent";
  if (energy == null) return "bg-paper/25";
  return ["bg-paper/20", "bg-paper/35", "bg-paper/55", "bg-paper/75", "bg-paper"][energy - 1];
}

export function ConsistencyClient({
  initialTags,
  initialEnergy,
  grid,
  showed,
  insights,
}: {
  initialTags: string[];
  initialEnergy: number | null;
  grid: { day: string; energy: number | null; tagged: boolean }[];
  showed: { days: number; window: number };
  insights: ConsistencyInsight[];
}) {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>(initialTags);
  const [energy, setEnergy] = useState<number | null>(initialEnergy);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const toggle = (id: string) => {
    setSaved(false);
    setTags((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  };

  return (
    <div className="space-y-5">
      {/* Today's log */}
      <div className="card p-4 space-y-4">
        <div>
          <div className="font-medium text-sm">Tag today</div>
          <p className="text-[11px] text-grey mt-0.5">Only what you actually did. Honest logs are the whole point.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {HABIT_TAGS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={cn(
                "chip text-xs transition-colors",
                tags.includes(t.id) ? "bg-paper text-ink border-paper" : "hover:bg-ink-soft"
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div>
          <div className="label mb-1.5">How was your energy?</div>
          <div className="flex gap-1.5">
            {ENERGY.map((e) => (
              <button
                key={e.v}
                type="button"
                onClick={() => { setSaved(false); setEnergy(energy === e.v ? null : e.v); }}
                className={cn(
                  "flex-1 rounded-lg border px-1 py-2 text-center transition-colors",
                  energy === e.v ? "bg-paper text-ink border-paper" : "border-ink-line hover:bg-ink-soft"
                )}
              >
                <div className="text-sm font-medium">{e.v}</div>
                <div className="text-[10px] opacity-80">{e.label}</div>
              </button>
            ))}
          </div>
        </div>
        <button
          className="btn btn-primary w-full"
          disabled={pending}
          onClick={() => start(async () => {
            await saveHabitLog({ tags, energy });
            setSaved(true);
            router.refresh();
          })}
        >
          {saved ? <><Check size={15} /> Saved for today</> : pending ? "Saving…" : "Save today"}
        </button>
      </div>

      {/* 28-day chart */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium text-sm">Last 28 days</div>
          <span className="chip text-xs"><Flame size={12} /> Showed up {showed.days}/{showed.window}</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((d) => (
            <div key={d.day} className="flex flex-col items-center gap-1">
              <span className={cn("h-5 w-5 rounded-full", dotClass(d.energy, d.tagged))} title={d.day} />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-grey mt-3">Brighter dot = better energy that day. Gaps are just gaps — life happens. Pick it back up today.</p>
      </div>

      {/* Honest patterns */}
      <div className="card p-4">
        <div className="font-medium text-sm mb-1">Your patterns</div>
        {insights.length === 0 ? (
          <p className="text-xs text-grey">
            Nothing to report yet — and Unk won&apos;t make one up. Keep tagging honestly for a couple of weeks and your own
            numbers will start talking. That&apos;s the experiment: fuel right two days out, then watch your game-day energy.
          </p>
        ) : (
          <ul className="space-y-2 mt-2">
            {insights.map((i, idx) => (
              <li key={idx} className="text-xs text-paper flex gap-2">
                <span className="shrink-0">{i.kind === "gameday" ? "🏆" : "📈"}</span>
                <span>{i.text}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-grey mt-3">Early signals from your own logs — not science, not a promise. Keep testing.</p>
      </div>

      <p className="text-[11px] text-grey">You do not have to share your answer. But answer it honestly for yourself.</p>
    </div>
  );
}
