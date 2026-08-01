"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createContent, updateContent } from "@/lib/actions";
import { PILLARS, AUDIENCES, FORMATS, CONTENT_STATUSES } from "@/lib/enums";

type Values = {
  id?: string;
  title?: string; pillar?: string; series?: string; audience?: string; format?: string;
  reelSeconds?: number | null; hook?: string; script?: string; teachingPoints?: string;
  caption?: string; question?: string; highlight?: string; plannedDate?: string;
  status?: string; notes?: string; instagramUrl?: string; recordingLocation?: string; equipmentUsed?: string;
  inspirationSource?: string;
};

export function ContentForm({ initial }: { initial?: Values }) {
  const router = useRouter();
  const [v, setV] = useState<Values>(initial ?? { pillar: "Mindset", audience: "General", format: "Reel", status: "Idea" });
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof Values, val: unknown) => setV((s) => ({ ...s, [k]: val }));

  function submit() {
    setErr(null);
    start(async () => {
      try {
        if (initial?.id) {
          await updateContent(initial.id, v as Record<string, unknown>);
          router.push(`/content/${initial.id}`);
        } else {
          const c = await createContent(v);
          router.push(`/content/${c.id}`);
        }
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {err && <div className="card border-bad/40 text-accent-soft p-3 text-sm">{err}</div>}
      <div>
        <label className="label" htmlFor="title">Title</label>
        <input id="title" className="input" value={v.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="e.g. The next-play reset" />
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="pillar">Pillar</label>
          <select id="pillar" className="input" value={v.pillar} onChange={(e) => set("pillar", e.target.value)}>
            {PILLARS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="audience">Audience</label>
          <select id="audience" className="input" value={v.audience} onChange={(e) => set("audience", e.target.value)}>
            {AUDIENCES.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="format">Format</label>
          <select id="format" className="input" value={v.format} onChange={(e) => set("format", e.target.value)}>
            {FORMATS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="series">Series</label>
          <input id="series" className="input" value={v.series ?? ""} onChange={(e) => set("series", e.target.value)} placeholder="UNC Thought" />
        </div>
        <div>
          <label className="label" htmlFor="seconds">Reel duration (s)</label>
          <input id="seconds" type="number" min={3} className="input" value={v.reelSeconds ?? ""} onChange={(e) => set("reelSeconds", e.target.value ? Number(e.target.value) : null)} placeholder="12" />
        </div>
        <div>
          <label className="label" htmlFor="date">Planned date</label>
          <input id="date" type="date" className="input" value={v.plannedDate?.slice(0, 10) ?? ""} onChange={(e) => set("plannedDate", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="hook">Hook</label>
        <input id="hook" className="input" value={v.hook ?? ""} onChange={(e) => set("hook", e.target.value)} placeholder="After a mistake, your next job is this." />
      </div>
      <div>
        <label className="label" htmlFor="script">Spoken script</label>
        <textarea id="script" rows={4} className="input" value={v.script ?? ""} onChange={(e) => set("script", e.target.value)} placeholder="Keep it under 20 seconds. One idea." />
      </div>
      <div>
        <label className="label" htmlFor="teaching">Teaching points</label>
        <textarea id="teaching" rows={2} className="input" value={v.teachingPoints ?? ""} onChange={(e) => set("teachingPoints", e.target.value)} placeholder="One per line" />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="caption">Caption</label>
          <textarea id="caption" rows={3} className="input" value={v.caption ?? ""} onChange={(e) => set("caption", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="question">Conversation question</label>
          <textarea id="question" rows={3} className="input" value={v.question ?? ""} onChange={(e) => set("question", e.target.value)} placeholder="One real question they can answer from experience." />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="highlight">Highlight</label>
          <input id="highlight" className="input" value={v.highlight ?? ""} onChange={(e) => set("highlight", e.target.value)} placeholder="Mindset" />
        </div>
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" className="input" value={v.status} onChange={(e) => set("status", e.target.value)}>
            {CONTENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="location">Recording location</label>
          <input id="location" className="input" value={v.recordingLocation ?? ""} onChange={(e) => set("recordingLocation", e.target.value)} />
        </div>
      </div>

      {initial?.id && (
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="url">Instagram URL</label>
            <input id="url" className="input" value={v.instagramUrl ?? ""} onChange={(e) => set("instagramUrl", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="equip">Equipment used</label>
            <input id="equip" className="input" value={v.equipmentUsed ?? ""} onChange={(e) => set("equipmentUsed", e.target.value)} />
          </div>
        </div>
      )}

      <div>
        <label className="label" htmlFor="notes">Notes</label>
        <textarea id="notes" rows={2} className="input" value={v.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={submit} disabled={pending || !v.title}>
          {initial?.id ? "Save changes" : "Create content"}
        </button>
        <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
      </div>
    </div>
  );
}
