"use client";
import { useMemo, useState } from "react";
import { HOOK_VARIANTS, SPEAKING } from "@/lib/coach-content";
import { BANNED_OPENINGS, HOOK_PATTERNS } from "@/lib/enums";
import { Copy, Check } from "lucide-react";

// Script & Hook coach: five hook variants per idea (plain, curiosity, problem,
// community-reply, age-specific), editable, plus the speaking coach's flags for
// generic openings.
export function HookCoach() {
  const [topic, setTopic] = useState("");
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const variants = useMemo(
    () => HOOK_VARIANTS.map((v) => ({ ...v, text: edited[v.key] ?? (topic ? v.template(topic) : "") })),
    [topic, edited],
  );

  const flaggedOpening = (text: string) => BANNED_OPENINGS.find((b) => text.toLowerCase().includes(b));

  function copy(key: string, text: string) {
    navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 1200); });
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="label" htmlFor="topic">What's the idea? (a few words)</label>
        <input id="topic" className="input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. resetting after a mistake" />
      </div>

      {topic && (
        <div className="space-y-2">
          <div className="eyebrow">Five hooks — pick one, edit it, keep it honest</div>
          {variants.map((v) => {
            const bad = flaggedOpening(v.text);
            return (
              <div key={v.key} className="card p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="chip">{v.label}</span>
                  <button className="btn btn-ghost p-1.5" onClick={() => copy(v.key, v.text)} aria-label="Copy">
                    {copied === v.key ? <Check size={14} className="text-good" /> : <Copy size={14} />}
                  </button>
                </div>
                <textarea
                  className="input text-sm"
                  rows={2}
                  value={v.text}
                  onChange={(e) => setEdited((s) => ({ ...s, [v.key]: e.target.value }))}
                />
                {bad && <p className="text-xs text-accent-soft mt-1">Avoid the generic opening “{bad}” — front-load the value instead.</p>}
              </div>
            );
          })}
        </div>
      )}

      <div className="card p-4">
        <div className="eyebrow mb-2">Hook patterns to borrow</div>
        <ul className="grid sm:grid-cols-2 gap-1.5 text-sm text-paper-dim">
          {HOOK_PATTERNS.map((h) => <li key={h}>“{h}”</li>)}
        </ul>
      </div>

      <div className="card p-4">
        <div className="eyebrow mb-2">Structure & delivery</div>
        <p className="text-sm text-paper-dim mb-2">{SPEAKING.structure.join(" → ")}</p>
        <ul className="grid sm:grid-cols-2 gap-1.5 text-sm text-paper-dim">
          {SPEAKING.techniques.map((t) => <li key={t}>• {t}</li>)}
        </ul>
      </div>
    </div>
  );
}
