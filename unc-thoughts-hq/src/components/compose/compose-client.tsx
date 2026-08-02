"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { freshDrafts, saveDraft, quickIdea } from "@/lib/postbank-actions";
import type { Draft } from "@/lib/postbank";
import { renderCard, downloadCard } from "@/lib/card-canvas";
import { Badge, pillarTone } from "@/components/ui";
import { RefreshCw, Download, Check, Zap, Lightbulb } from "lucide-react";

// The Post Bank: five fresh word-posts on tap, each editable, each one tap
// from "Ready". Built from Unk's Brain + real member questions — so the bank
// gets smarter every time the community talks.
export function ComposeClient() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [saved, setSaved] = useState<Record<number, string>>({});
  const [pending, start] = useTransition();
  const [idea, setIdea] = useState("");
  const [ideaMsg, setIdeaMsg] = useState<string | null>(null);
  const ran = useRef(false);

  function load() {
    start(async () => {
      const r = await freshDrafts();
      setDrafts(r.drafts);
      setSaved({});
    });
  }

  useEffect(() => {
    if (!ran.current) { ran.current = true; load(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const edit = (i: number, patch: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  function save(i: number, as: "Ready" | "Idea") {
    start(async () => {
      await saveDraft(drafts[i], as);
      setSaved((s) => ({ ...s, [i]: as === "Ready" ? "In the bank — ready to post." : "Saved as an idea." }));
      router.refresh();
    });
  }

  function captureIdea() {
    if (!idea.trim()) return;
    start(async () => {
      await quickIdea(idea);
      setIdea("");
      setIdeaMsg("Banked. It's in Content as an Idea.");
      setTimeout(() => setIdeaMsg(null), 2500);
    });
  }

  return (
    <div className="space-y-5">
      {/* Brain-dump capture — for shower thoughts, court thoughts, any thoughts */}
      <div className="card p-3.5">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Brain-dump an idea before it escapes…"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && captureIdea()}
            aria-label="Quick idea"
          />
          <button className="btn" onClick={captureIdea} disabled={pending || !idea.trim()}><Lightbulb size={15} /> Bank it</button>
        </div>
        {ideaMsg && <p className="text-xs text-good mt-1.5">{ideaMsg}</p>}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-grey">Five word-posts, built from your own teaching. Edit, save, download the card — done.</p>
        <button className="btn btn-primary shrink-0" onClick={load} disabled={pending}>
          <RefreshCw size={15} className={pending ? "animate-spin" : ""} /> {drafts.length ? "5 fresh drafts" : "Give me drafts"}
        </button>
      </div>

      <div className="space-y-4">
        {drafts.map((d, i) => (
          <div key={`${d.title}-${i}`} className="card p-4 space-y-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge tone={pillarTone(d.pillar)}>{d.pillar}</Badge>
              <Badge tone="accent"><Zap size={11} /> {d.kindLabel}</Badge>
              {d.sourceTitles.length > 0 && <span className="text-[11px] text-grey">from: {d.sourceTitles.join(" · ")}</span>}
            </div>

            {/* live card preview */}
            <CardPreview headline={d.card.headline} sub={d.card.sub} question={d.question} />

            <div>
              <label className="label" htmlFor={`cap-${i}`}>Caption (edit freely)</label>
              <textarea id={`cap-${i}`} className="input text-sm" rows={4} value={d.caption} onChange={(e) => edit(i, { caption: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor={`q-${i}`}>The one real question</label>
              <input id={`q-${i}`} className="input text-sm" value={d.question} onChange={(e) => edit(i, { question: e.target.value })} />
            </div>

            {saved[i] ? (
              <p className="text-sm text-good flex items-center gap-1.5"><Check size={15} /> {saved[i]}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary" disabled={pending} onClick={() => save(i, "Ready")}>Save as Ready</button>
                <button className="btn" disabled={pending} onClick={() => save(i, "Idea")}>Save as Idea</button>
                <button className="btn" onClick={() => downloadCard({ ...d.card, question: d.question }, d.title)}>
                  <Download size={15} /> Card PNG
                </button>
              </div>
            )}
          </div>
        ))}
        {!drafts.length && pending && <p className="text-sm text-grey">Building drafts from your teaching…</p>}
      </div>
    </div>
  );
}

function CardPreview({ headline, sub, question }: { headline: string; sub?: string; question?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    try { setSrc(renderCard({ headline, sub, question })); } catch { setSrc(null); }
  }, [headline, sub, question]);
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Post card preview" className="w-full max-w-[280px] rounded-lg border border-ink-line" />;
}
