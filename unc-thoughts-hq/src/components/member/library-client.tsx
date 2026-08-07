"use client";
import { useState } from "react";
import { QUESTION_TREE } from "@/lib/member-shared";
import { Search } from "lucide-react";

type Item = { id: string; text: string; pillar: string | null; subcat: string | null; answer: string; at: string };

// Category chips + live search over the approved Q&A library. Tap a card to
// open the full answer.
export function LibraryClient({ items }: { items: Item[] }) {
  const [pillar, setPillar] = useState("All");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const needle = q.trim().toLowerCase();
  const shown = items.filter((i) => {
    if (pillar !== "All" && i.pillar !== pillar) return false;
    if (needle && !`${i.text} ${i.answer} ${i.subcat ?? ""}`.toLowerCase().includes(needle)) return false;
    return true;
  });
  const count = (p: string) => items.filter((i) => p === "All" || i.pillar === p).length;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey" />
        <input
          className="input text-sm pl-9" placeholder="Search the library…"
          value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the library"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {["All", ...Object.keys(QUESTION_TREE)].map((p) => (
          <button key={p} className={`chip ${pillar === p ? "btn-primary" : ""}`} onClick={() => setPillar(p)}>
            {p === "All" ? "All" : `${QUESTION_TREE[p].icon} ${p}`} <span className="opacity-70">({count(p)})</span>
          </button>
        ))}
      </div>

      {items.length === 0 && (
        <div className="card p-4">
          <p className="text-sm text-paper">The shelves are being filled right now.</p>
          <p className="text-xs text-grey mt-1">Every question UNC answers and approves lands here for everyone. Ask one — you might write the first page.</p>
        </div>
      )}
      {items.length > 0 && shown.length === 0 && (
        <p className="text-sm text-grey py-3">Nothing matches that — try another word, or ask UNC directly.</p>
      )}

      {shown.map((i) => {
        const open = openId === i.id;
        return (
          <button
            key={i.id}
            className="card p-4 w-full text-left hover:bg-ink-soft transition-colors"
            onClick={() => setOpenId(open ? null : i.id)}
            aria-expanded={open}
          >
            <p className="text-sm font-medium">{i.text}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5 text-[11px]">
              {i.pillar && <span className="chip pointer-events-none">{QUESTION_TREE[i.pillar]?.icon} {i.pillar}</span>}
              {i.subcat && <span className="chip pointer-events-none">{i.subcat}</span>}
              {!open && <span className="text-grey self-center">tap for UNC&apos;s answer ↓</span>}
            </div>
            {open && (
              <div className="rounded-lg bg-ink-soft border border-ink-line2 p-3 mt-2.5">
                <p className="text-[11px] text-grey mb-1">UNC says:</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{i.answer}</p>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
