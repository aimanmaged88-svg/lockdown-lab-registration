"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExperiment, decideExperiment, saveWinningPattern } from "@/lib/actions";
import { EXPERIMENT_TYPES } from "@/lib/enums";

export function CreateExperiment({ contentOptions }: { contentOptions: { id: string; title: string }[] }) {
  const router = useRouter();
  const [v, setV] = useState({ type: "trial_vs_standard", hypothesis: "", variable: "", heldConstant: "", minSample: 3, contentId: "" });
  const [pending, start] = useTransition();
  const set = (k: string, val: unknown) => setV((s) => ({ ...s, [k]: val }));
  return (
    <div className="space-y-2">
      <div className="grid sm:grid-cols-2 gap-2">
        <select className="input" value={v.type} onChange={(e) => set("type", e.target.value)}>
          {EXPERIMENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <select className="input" value={v.contentId} onChange={(e) => set("contentId", e.target.value)}>
          <option value="">Link a content item (optional)…</option>
          {contentOptions.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>
      <input className="input" placeholder="Hypothesis (e.g. 'A curiosity hook beats a plain hook on saves')" value={v.hypothesis} onChange={(e) => set("hypothesis", e.target.value)} />
      <div className="grid sm:grid-cols-2 gap-2">
        <input className="input" placeholder="Variable being changed" value={v.variable} onChange={(e) => set("variable", e.target.value)} />
        <input className="input" placeholder="Everything held constant" value={v.heldConstant} onChange={(e) => set("heldConstant", e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-grey">Min sample</label>
        <input type="number" min={1} className="input w-20" value={v.minSample} onChange={(e) => set("minSample", Number(e.target.value))} />
        <button className="btn btn-primary ml-auto" disabled={pending || !v.hypothesis.trim()} onClick={() => start(async () => {
          await createExperiment({ ...v, contentId: v.contentId || undefined });
          setV({ type: "trial_vs_standard", hypothesis: "", variable: "", heldConstant: "", minSample: 3, contentId: "" });
          router.refresh();
        })}>Start experiment</button>
      </div>
      {v.type === "trial_vs_standard" && <p className="text-xs text-grey">Trial Reel: review the first-24h read, then decide to share with everyone, revise, re-record or archive.</p>}
    </div>
  );
}

export function DecideExperiment({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ decision: "share_all", result: "", confidence: "medium" });
  const set = (k: string, val: string) => setV((s) => ({ ...s, [k]: val }));
  if (!open) return <button className="btn text-xs" onClick={() => setOpen(true)}>Record decision</button>;
  return (
    <div className="mt-2 space-y-2">
      <input className="input text-sm" placeholder="Result (what happened)" value={v.result} onChange={(e) => set("result", e.target.value)} />
      <div className="flex gap-2">
        <select className="input" value={v.decision} onChange={(e) => set("decision", e.target.value)}>
          <option value="share_all">Share with everyone</option>
          <option value="revise">Revise</option>
          <option value="rerecord">Re-record</option>
          <option value="archive">Archive</option>
        </select>
        <select className="input w-32" value={v.confidence} onChange={(e) => set("confidence", e.target.value)}>
          <option value="low">low</option><option value="medium">medium</option><option value="high">high</option>
        </select>
        <button className="btn btn-primary" disabled={pending} onClick={() => start(async () => { await decideExperiment(id, v.decision, v.result, v.confidence); setOpen(false); router.refresh(); })}>Save</button>
      </div>
    </div>
  );
}

export function SaveWinningPattern() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState({ topic: "", format: "Reel", hook: "", duration: 12, audience: "General", evidence: "" });
  const set = (k: string, val: unknown) => setV((s) => ({ ...s, [k]: val }));
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      <input className="input" placeholder="Topic" value={v.topic} onChange={(e) => set("topic", e.target.value)} />
      <input className="input" placeholder="Hook" value={v.hook} onChange={(e) => set("hook", e.target.value)} />
      <input className="input" placeholder="Format" value={v.format} onChange={(e) => set("format", e.target.value)} />
      <input className="input" placeholder="Audience" value={v.audience} onChange={(e) => set("audience", e.target.value)} />
      <input type="number" className="input" placeholder="Duration (s)" value={v.duration} onChange={(e) => set("duration", Number(e.target.value))} />
      <input className="input" placeholder="Evidence" value={v.evidence} onChange={(e) => set("evidence", e.target.value)} />
      <button className="btn btn-primary sm:col-span-2" disabled={pending || !v.topic.trim()} onClick={() => start(async () => { await saveWinningPattern(v); setV({ topic: "", format: "Reel", hook: "", duration: 12, audience: "General", evidence: "" }); router.refresh(); })}>Save pattern</button>
    </div>
  );
}
