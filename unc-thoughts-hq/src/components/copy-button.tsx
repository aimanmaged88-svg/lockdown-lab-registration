"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button className="btn" onClick={() => navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1400); })}>
      {done ? <Check size={15} className="text-good" /> : <Copy size={15} />} {done ? "Copied" : label}
    </button>
  );
}
