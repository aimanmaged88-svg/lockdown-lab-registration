"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

// One tap: caption (with its question) on the clipboard, ready to paste into
// Instagram. The 30-second post becomes a 10-second post.
export function CopyCaption({ caption, question }: { caption: string; question?: string | null }) {
  const [done, setDone] = useState(false);
  const text = question && !caption.includes(question) ? `${caption}\n\n${question}` : caption;
  return (
    <button
      className="btn text-xs"
      onClick={() => navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}
    >
      {done ? <><Check size={13} className="text-good" /> Copied</> : <><Copy size={13} /> Copy caption</>}
    </button>
  );
}
