"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BATCH_PLANS, GROUP_BY_OPTIONS } from "@/lib/coach-content";
import { createBatch } from "@/lib/actions";
import { cn } from "@/lib/cn";

type Item = { id: string; title: string; pillar: string; format: string; recordingLocation: string | null; equipmentUsed: string | null };

// Batch Day: pick the next six Reels, group them to minimise setup changes, and
// track the session. 30 / 60 / 90-minute plans.
export function BatchDay({ candidates }: { candidates: Item[] }) {
  const router = useRouter();
  const [minutes, setMinutes] = useState<30 | 60 | 90>(60);
  const [groupBy, setGroupBy] = useState<(typeof GROUP_BY_OPTIONS)[number]>("pillar");
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);

  const plan = BATCH_PLANS[minutes];
  const cap = plan.reels;

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < cap ? [...s, id] : s));
  }

  // group + order the selection
  const grouped = useMemo(() => {
    const chosen = candidates.filter((c) => selected.includes(c.id));
    const keyOf = (c: Item) =>
      groupBy === "location" ? c.recordingLocation ?? "Any location"
      : groupBy === "equipment" ? c.equipmentUsed ?? "Basic kit"
      : groupBy === "pillar" ? c.pillar
      : groupBy === "demo" ? c.format
      : "Group";
    const map: Record<string, Item[]> = {};
    for (const c of chosen) (map[keyOf(c)] ??= []).push(c);
    return map;
  }, [candidates, selected, groupBy]);

  function save() {
    if (!selected.length) return;
    // order = grouped order so setup changes are minimised
    const ordered = Object.values(grouped).flat().map((c) => c.id);
    start(async () => {
      const s = await createBatch({ name: `Batch Day — ${new Date().toLocaleDateString("en-AU")}`, minutes, groupBy, contentIds: ordered });
      setDone(s.id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <div className="label">Session length</div>
          <div className="flex gap-2">
            {([30, 60, 90] as const).map((m) => (
              <button key={m} onClick={() => setMinutes(m)} className={cn("btn flex-1", minutes === m && "btn-primary")}>{m} min</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="groupby">Group by (minimise setup changes)</label>
          <select id="groupby" className="input" value={groupBy} onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}>
            {GROUP_BY_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-4">
        <div className="eyebrow mb-2">{minutes}-minute plan · up to {cap} Reels</div>
        <ol className="text-sm text-paper-dim space-y-1 list-decimal list-inside">
          {plan.blocks.map((b, i) => <li key={i}>{b}</li>)}
        </ol>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="eyebrow">Pick up to {cap} ({selected.length} selected)</div>
        </div>
        {candidates.length === 0 ? (
          <p className="text-sm text-grey">No unposted content to batch. Add ideas in Content first.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {candidates.map((c) => (
              <button key={c.id} onClick={() => toggle(c.id)} className={cn("card p-3 text-left", selected.includes(c.id) && "border-paper/40 bg-ink-soft")}>
                <div className="text-sm font-medium">{c.title}</div>
                <div className="text-xs text-grey">{c.pillar} · {c.format}{c.recordingLocation ? ` · ${c.recordingLocation}` : ""}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="card p-4">
          <div className="eyebrow mb-2">Recording order (grouped by {groupBy})</div>
          {Object.entries(grouped).map(([g, items]) => (
            <div key={g} className="mb-3">
              <div className="text-sm font-medium mb-1">{g}</div>
              <ol className="text-sm text-paper-dim list-decimal list-inside">
                {items.map((c) => <li key={c.id}>{c.title}</li>)}
              </ol>
            </div>
          ))}
          <button className="btn btn-primary" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save Batch Day session"}</button>
          {done && <span className="ml-3 text-sm text-good">Saved. Track it below.</span>}
        </div>
      )}
    </div>
  );
}
