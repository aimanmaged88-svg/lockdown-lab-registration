"use client";
import { useMemo, useState } from "react";
import { Search, Copy, Check } from "lucide-react";

// "What have I already said about this?" — matches a topic against everything
// in the Library and surfaces UNC's own answers. Pure keyword scoring done in
// the browser over the (already public) Library, so it's instant and free:
// no AI, no API, nothing to pay for.

export type LibEntry = { q: string; a: string; pillar: string; subcat: string };

// Words that carry no topic meaning — without these the top hits fill up with
// whatever answer happens to say "nothing" or "really" the most.
const STOP = new Set([
  "the","a","an","and","or","but","if","of","to","in","on","at","for","with","my","your","you","i","is","are",
  "was","were","be","been","do","does","did","how","what","when","why","should","can","could","would","about",
  "it","that","this","they","them","he","she","we","us","me","get","got","not","dont","don't","im","i'm","its",
  "nothing","something","anything","everything","really","very","just","like","also","even","still","only",
  "then","than","there","here","from","into","over","out","back","much","many","some","any","all","one","two",
  "way","thing","things","time","times","make","makes","made","take","takes","going","goes","keep","keeps",
  "said","say","says","know","knows","think","thinks","good","better","best","own","every","each","more","most",
]);
const PILLAR_ICON: Record<string, string> = { Basketball: "🏀", Nutrition: "🍎", Mindset: "🧠" };

function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").split(/\s+/)
    .map((w) => w.replace(/'s$/, ""))
    .filter((w) => w.length > 2 && !STOP.has(w));
}
// Cheap stem so "shooting" matches "shoot", "nerves" matches "nervous".
function stem(w: string): string {
  return w.replace(/(ing|ed|es|s)$/, "");
}

export function TopicMatch({ library, topics }: { library: LibEntry[]; topics: string[] }) {
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const indexed = useMemo(
    () => library.map((e) => ({
      e,
      qTok: new Set(tokens(e.q).map(stem)),
      sTok: new Set(tokens(e.subcat).map(stem)),
      aTok: new Set(tokens(e.a).map(stem)),
    })),
    [library],
  );

  const hits = useMemo(() => {
    const want = Array.from(new Set(tokens(q).map(stem)));
    if (!want.length) return [];
    return indexed
      .map(({ e, qTok, sTok, aTok }) => {
        let score = 0;
        for (const w of want) {
          if (qTok.has(w)) score += 3;      // it's what they asked
          if (sTok.has(w)) score += 2;      // it's the category
          if (aTok.has(w)) score += 1;      // it's in the answer
        }
        if (e.pillar.toLowerCase().includes(q.trim().toLowerCase())) score += 2;
        return { e, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [q, indexed]);

  async function copy(text: string, i: number) {
    try { await navigator.clipboard.writeText(text); setCopied(i); setTimeout(() => setCopied(null), 1600); } catch { /* clipboard blocked */ }
  }

  return (
    <div className="card p-4 space-y-3">
      <div>
        <label className="label" htmlFor="tmq">What have I already said about…</label>
        <div className="relative mt-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey" />
          <input
            id="tmq" className="input text-sm pl-9" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="nerves before a game, weak left hand, protein powder…"
          />
        </div>
      </div>

      {topics.length > 0 && !q && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] text-grey self-center mr-1">from your bank:</span>
          {topics.slice(0, 8).map((t) => (
            <button key={t} className="chip text-xs" onClick={() => setQ(t)}>{t.length > 34 ? t.slice(0, 34) + "…" : t}</button>
          ))}
        </div>
      )}

      {q && hits.length === 0 && (
        <p className="text-sm text-grey">
          Nothing in the Library on that yet — which makes it a good one to talk about.
          Bank it below and answer it next time it lands in your inbox.
        </p>
      )}

      {hits.map(({ e }, i) => (
        <div key={e.q} className="rounded-lg bg-ink-soft border border-ink-line2 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium">{e.q}</p>
            <button
              className="btn btn-ghost text-[11px] shrink-0"
              onClick={() => copy(e.a, i)}
              aria-label="Copy this answer"
            >
              {copied === i ? <><Check size={11} /> copied</> : <><Copy size={11} /> copy</>}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 my-1.5 text-[11px]">
            <span className="chip pointer-events-none">{PILLAR_ICON[e.pillar] ?? ""} {e.pillar}</span>
            <span className="chip pointer-events-none">{e.subcat}</span>
          </div>
          <p className="text-sm text-paper-dim whitespace-pre-wrap">{e.a}</p>
        </div>
      ))}

      {q && hits.length > 0 && (
        <p className="text-[11px] text-grey">
          Your own words, straight from the Library — copy a line for a caption, a card, or a session.
        </p>
      )}
    </div>
  );
}
