"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createKnowledge, updateKnowledge, setKnowledgeApproval, type KnowledgeInput } from "@/lib/unk/actions";
import { PILLARS } from "@/lib/enums";

const KINDS = ["playbook", "lesson", "caption", "transcript", "teaching_note", "mindset", "nutrition", "faq", "source_link"];
const AUDIENCES = ["General", "u13", "13-15", "16-17", "18+", "parent_coach"];
const SAFETY = ["general", "nutrition", "youth_sensitive"];

export function BrainEditor({ initial, id, onClose }: { initial?: Partial<KnowledgeInput>; id?: string; onClose?: () => void }) {
  const router = useRouter();
  const [v, setV] = useState<KnowledgeInput>({
    kind: initial?.kind ?? "playbook",
    title: initial?.title ?? "",
    pillar: initial?.pillar ?? "Mindset",
    audience: initial?.audience ?? "General",
    body: initial?.body ?? "DO NOW: \nFOOD: \nMINDSET: \nCAREFUL: \nPRIVATE: \nWHY: ",
    tags: initial?.tags ?? "",
    source: initial?.source ?? "",
    sourceUrl: initial?.sourceUrl ?? "",
    safetyClass: initial?.safetyClass ?? "general",
  });
  const [approveNow, setApproveNow] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof KnowledgeInput, val: string) => setV((s) => ({ ...s, [k]: val }));

  function save() {
    setErr(null);
    start(async () => {
      try {
        if (id) await updateKnowledge(id, v);
        else {
          const newId = await createKnowledge(v);
          if (approveNow) await setKnowledgeApproval(newId, "approved");
        }
        onClose?.();
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <div className="space-y-2.5">
      {err && <p className="text-sm text-accent-soft">{err}</p>}
      <div className="grid sm:grid-cols-3 gap-2">
        <select className="input" value={v.kind} onChange={(e) => set("kind", e.target.value)} aria-label="Kind">
          {KINDS.map((k) => <option key={k}>{k}</option>)}
        </select>
        <select className="input" value={v.pillar} onChange={(e) => set("pillar", e.target.value)} aria-label="Pillar">
          {PILLARS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="input" value={v.audience} onChange={(e) => set("audience", e.target.value)} aria-label="Audience">
          {AUDIENCES.map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>
      <input className="input" placeholder="Title" value={v.title} onChange={(e) => set("title", e.target.value)} aria-label="Title" />
      <textarea className="input font-mono text-xs" rows={9} value={v.body} onChange={(e) => set("body", e.target.value)} aria-label="Body"
        placeholder={"Playbooks use labelled sections:\nDO NOW: …\nFOOD: …\nMINDSET: …\nCAREFUL: …\nPRIVATE: …\nWHY: …"} />
      <div className="grid sm:grid-cols-2 gap-2">
        <input className="input" placeholder="Tags (comma) — e.g. intent:game_day, band:1-2h" value={v.tags} onChange={(e) => set("tags", e.target.value)} aria-label="Tags" />
        <select className="input" value={v.safetyClass} onChange={(e) => set("safetyClass", e.target.value)} aria-label="Safety classification">
          {SAFETY.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input className="input" placeholder="Source name" value={v.source} onChange={(e) => set("source", e.target.value)} aria-label="Source name" />
        <input className="input" placeholder="Source URL" value={v.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} aria-label="Source URL" />
      </div>
      <div className="flex items-center gap-3">
        <button className="btn btn-primary text-sm" onClick={save} disabled={pending || !v.title.trim() || !v.body.trim()}>
          {pending ? "Saving…" : id ? "Save (keeps version history)" : "Create"}
        </button>
        {!id && (
          <label className="text-xs text-grey flex items-center gap-1.5">
            <input type="checkbox" checked={approveNow} onChange={(e) => setApproveNow(e.target.checked)} />
            Approve immediately (usable in member answers)
          </label>
        )}
        {onClose && <button className="btn btn-ghost text-sm" onClick={onClose}>Cancel</button>}
      </div>
    </div>
  );
}

export function ApprovalButtons({ id, approval }: { id: string; approval: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (a: "draft" | "approved" | "archived") => start(async () => { await setKnowledgeApproval(id, a); router.refresh(); });
  return (
    <div className="flex gap-1.5">
      {approval !== "approved" && <button className="btn text-xs btn-primary" disabled={pending} onClick={() => go("approved")}>Approve</button>}
      {approval === "approved" && <button className="btn text-xs" disabled={pending} onClick={() => go("draft")}>Unapprove</button>}
      {approval !== "archived" && <button className="btn btn-ghost text-xs" disabled={pending} onClick={() => go("archived")}>Archive</button>}
    </div>
  );
}

export function EditToggle({ id, initial }: { id: string; initial: Partial<KnowledgeInput> }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button className="btn btn-ghost text-xs" onClick={() => setOpen(true)}>Edit</button>;
  return (
    <div className="mt-3 w-full">
      <BrainEditor id={id} initial={initial} onClose={() => setOpen(false)} />
    </div>
  );
}

export function NewItemToggle() {
  const [open, setOpen] = useState(false);
  if (!open) return <button className="btn btn-primary" onClick={() => setOpen(true)}>+ New knowledge item</button>;
  return (
    <div className="card p-4">
      <div className="eyebrow mb-2">New knowledge item</div>
      <BrainEditor onClose={() => setOpen(false)} />
    </div>
  );
}
