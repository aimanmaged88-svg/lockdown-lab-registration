"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { noteAdd, noteSetStatus, noteDelete, type NoteKind } from "@/lib/desk-notes";
import { Check, Plus, RotateCcw, X } from "lucide-react";

export type Note = { id: string; title: string | null; body: string; pillar: string | null; status: string; createdAt: string };

// One box in, one list out. Tick when used, untick to bring it back.
export function NoteBank({ kind, notes, placeholder, withTitle }: {
  kind: NoteKind; notes: Note[]; placeholder: string; withTitle?: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const saved = notes.filter((n) => n.status === "saved");
  const used = notes.filter((n) => n.status === "used");

  function add() {
    setErr(null);
    start(async () => {
      try {
        await noteAdd(kind, body, withTitle ? title : undefined);
        setBody(""); setTitle("");
        router.refresh();
      } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't save."); }
    });
  }

  return (
    <div className="space-y-3">
      <div className="card p-4 space-y-2">
        {withTitle && (
          <input className="input text-sm" maxLength={120} placeholder="Title / hook (optional)"
            value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" />
        )}
        <textarea className="input text-sm" rows={3} maxLength={3000} placeholder={placeholder}
          value={body} onChange={(e) => setBody(e.target.value)} aria-label="New entry"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add(); }} />
        {err && <p className="text-xs text-accent-soft">{err}</p>}
        <button className="btn btn-primary text-sm w-full" disabled={pending || !body.trim()} onClick={add}>
          <Plus size={14} /> Save it
        </button>
      </div>

      {saved.length === 0 && used.length === 0 && (
        <p className="text-sm text-grey">Nothing banked yet — first one takes ten seconds.</p>
      )}

      {saved.map((n) => (
        <div key={n.id} className="card p-3.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {n.title && <p className="text-sm font-semibold">{n.title}</p>}
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{n.body}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button className="btn btn-ghost text-xs px-2" title="Mark used"
              disabled={pending} onClick={() => start(async () => { await noteSetStatus(n.id, "used"); router.refresh(); })}>
              <Check size={14} />
            </button>
            <button className="btn btn-ghost text-xs px-2" title="Delete" aria-label="Delete"
              disabled={pending} onClick={() => start(async () => { await noteDelete(n.id); router.refresh(); })}>
              <X size={14} />
            </button>
          </div>
        </div>
      ))}

      {used.length > 0 && (
        <details>
          <summary className="text-xs text-grey cursor-pointer">Used ({used.length})</summary>
          <div className="space-y-2 mt-2">
            {used.map((n) => (
              <div key={n.id} className="card p-3 flex items-start justify-between gap-3 opacity-60">
                <p className="text-sm line-through">{n.title ? `${n.title} — ` : ""}{n.body.slice(0, 120)}</p>
                <button className="btn btn-ghost text-xs px-2" title="Bring back"
                  disabled={pending} onClick={() => start(async () => { await noteSetStatus(n.id, "saved"); router.refresh(); })}>
                  <RotateCcw size={13} />
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
