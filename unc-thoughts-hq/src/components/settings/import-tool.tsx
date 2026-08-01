"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

type Preview = {
  filename: string; total: number; added: number; changed: number; conflicts: number; unchanged: number;
  changes: { title: string; diffs: string[] }[];
  conflictList: { title: string; reason: string }[];
  rows: unknown[];
};

// Idempotent roadmap importer: upload → preview (added / changed / conflicts) →
// confirm apply. Running it again won't duplicate content.
export function ImportTool() {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setMsg(null); setPreview(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/import", { method: "POST", body: fd });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(data.error ?? "Import failed"); return; }
    setPreview(data);
  }

  async function apply() {
    if (!preview) return;
    setBusy(true); setMsg(null);
    const res = await fetch("/api/import/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: preview.rows }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(data.error ?? "Apply failed"); return; }
    setMsg(`Applied: ${data.added} added, ${data.changed} updated.`);
    setPreview(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <label className="btn cursor-pointer w-fit">
        <Upload size={15} /> Choose roadmap (.xlsx)
        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={onFile} disabled={busy} />
      </label>
      <p className="text-xs text-grey">
        Point it at <code>UNC-Thoughts-90-Day-Roadmap.xlsx</code>. Columns are matched by name (Date, Topic/Title, Pillar,
        Audience, Format, Hook, Creation instructions, Caption, Conversation CTA, Highlight, Status, Notes).
      </p>

      {msg && <div className="card p-3 text-sm">{msg}</div>}

      {preview && (
        <div className="card p-4 space-y-3">
          <div className="eyebrow">Preview — {preview.filename}</div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="chip">Total {preview.total}</span>
            <span className="chip">Added {preview.added}</span>
            <span className="chip">Changed {preview.changed}</span>
            <span className="chip">Unchanged {preview.unchanged}</span>
            <span className="chip">Conflicts {preview.conflicts}</span>
          </div>
          {preview.changes.length > 0 && (
            <div className="text-sm">
              <div className="label">Changes</div>
              <ul className="text-paper-dim space-y-1 max-h-48 overflow-y-auto">
                {preview.changes.map((c, i) => <li key={i}><span className="text-paper">{c.title}</span>: {c.diffs.join("; ")}</li>)}
              </ul>
            </div>
          )}
          {preview.conflictList.length > 0 && (
            <div className="text-sm">
              <div className="label text-warn">Conflicts (skipped)</div>
              <ul className="text-grey space-y-1">{preview.conflictList.map((c, i) => <li key={i}>{c.title} — {c.reason}</li>)}</ul>
            </div>
          )}
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={apply} disabled={busy}>{busy ? "Applying…" : "Confirm & apply"}</button>
            <button className="btn btn-ghost" onClick={() => setPreview(null)} disabled={busy}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
