"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Shuffle, Copy, Check } from "lucide-react";
import { captionFor, ANGLES, type Angle, type Pillar } from "@/lib/caption-bank";

// The quiet thought card: black ground, serif italic line, one word lifted in
// colour, hairline rules top and bottom, wordmark underneath. Same geometry as
// the posts that already perform on the grid. Everything is a picker — style,
// size, which word glows, and lines pulled from what UNC has actually said —
// so a post is four taps, no writing required.

type Style = {
  name: string;
  bg: string;
  text: string;
  accent: string;
  rule: string;
  foot: string;
  italic: boolean;
  family: string;
};

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "system-ui, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'Courier New', ui-monospace, monospace";

const STYLES: Style[] = [
  { name: "Gold serif", bg: "#000000", text: "#F4F2ED", accent: "#D7A94B", rule: "#8A6E38", foot: "#8C8C8C", italic: true, family: SERIF },
  { name: "Orange serif", bg: "#0A0A0C", text: "#F4F4F2", accent: "#F0622A", rule: "#7A3418", foot: "#8C8C8C", italic: true, family: SERIF },
  { name: "All white", bg: "#000000", text: "#F4F2ED", accent: "#F4F2ED", rule: "#5A5A5A", foot: "#8C8C8C", italic: true, family: SERIF },
  { name: "Ice", bg: "#05070A", text: "#EEF4F8", accent: "#5FC8E8", rule: "#2C5A6E", foot: "#7E8A93", italic: true, family: SERIF },
  { name: "Cherry", bg: "#0A0506", text: "#F5EFEF", accent: "#D2413F", rule: "#6E2422", foot: "#8C8080", italic: true, family: SERIF },
  { name: "Court green", bg: "#08110C", text: "#EFF5F0", accent: "#5FB37A", rule: "#2C5C3C", foot: "#7E8C82", italic: true, family: SERIF },
  { name: "Charcoal", bg: "#191A1D", text: "#F2F2F0", accent: "#E3B667", rule: "#6A5A3A", foot: "#8E8E8C", italic: true, family: SERIF },
  { name: "Paper", bg: "#F2EFE8", text: "#14140F", accent: "#A8761C", rule: "#B9A98A", foot: "#6B6B63", italic: true, family: SERIF },
  { name: "Chalk", bg: "#E8E9EA", text: "#101114", accent: "#B4462A", rule: "#A6A8AB", foot: "#6C6E70", italic: true, family: SERIF },
  { name: "Bold sans", bg: "#000000", text: "#F4F2ED", accent: "#D7A94B", rule: "#8A6E38", foot: "#8C8C8C", italic: false, family: SANS },
  { name: "Street sans", bg: "#0A0A0C", text: "#F4F4F2", accent: "#F0622A", rule: "#7A3418", foot: "#8C8C8C", italic: false, family: SANS },
  { name: "Locker mono", bg: "#000000", text: "#E8E8E4", accent: "#D7A94B", rule: "#6A5730", foot: "#7F7F7C", italic: false, family: MONO },
];

const SIZES: Record<string, { w: number; h: number; label: string }> = {
  "Square": { w: 1080, h: 1080, label: "1:1 feed" },
  "Portrait": { w: 1080, h: 1350, label: "4:5 feed" },
  "Story": { w: 1080, h: 1920, label: "9:16 story/reel" },
  "Landscape": { w: 1080, h: 566, label: "1.91:1 feed" },
  "Wide": { w: 1200, h: 675, label: "16:9 X / link" },
  "Big square": { w: 2048, h: 2048, label: "print / hi-res" },
};

export function ThoughtCardStudio({ lines }: { lines: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState("wanna build discipline before the sun's up?");
  const [hi, setHi] = useState("discipline");
  const [styleIdx, setStyleIdx] = useState(0);
  const [sizeKey, setSizeKey] = useState<keyof typeof SIZES>("Square");
  const [foot, setFoot] = useState("UNC THOUGHTS");
  const [pick, setPick] = useState(0);
  const [pillar, setPillar] = useState<Pillar>("Mindset");
  const [angle, setAngle] = useState<Angle>("Straight up");
  const [tagSeed, setTagSeed] = useState(1);
  const [copiedCap, setCopiedCap] = useState(false);

  const caption = useMemo(() => captionFor(text, pillar, angle, tagSeed), [text, pillar, angle, tagSeed]);

  const words = Array.from(new Set(text.split(/\s+/).map((w) => w.replace(/[^\w'-]/g, "")).filter((w) => w.length > 2)));

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const S = STYLES[styleIdx];
    const { w: W, h: H } = SIZES[sizeKey];
    canvas.width = W; canvas.height = H;

    ctx.fillStyle = S.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = "alphabetic";

    // Type scales with the canvas so every size keeps the same proportions.
    const maxW = W * 0.78;
    let size = Math.round(W * 0.072);
    const it = S.italic ? "italic " : "";
    const setFont = (s: number) => { ctx.font = `${it}400 ${s}px ${S.family}`; };

    // Wrap to lines that fit, shrinking if it runs long.
    const wrap = (s: number): string[] => {
      setFont(s);
      const out: string[] = [];
      let line = "";
      for (const word of text.trim().split(/\s+/)) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; }
        else line = test;
      }
      if (line) out.push(line);
      return out;
    };
    let lines2 = wrap(size);
    while (lines2.length > 4 && size > W * 0.04) { size -= 4; lines2 = wrap(size); }
    setFont(size);

    const lh = size * 1.34;
    const blockH = lines2.length * lh;
    const cy = H / 2;
    let y = cy - blockH / 2 + size * 0.9;

    // hairline rule above
    const ruleW = W * 0.115;
    ctx.fillStyle = S.rule;
    ctx.fillRect(W / 2 - ruleW / 2, cy - blockH / 2 - size * 0.95, ruleW, 2);

    // the line, with one word lifted
    const target = hi.trim().toLowerCase();
    for (const l of lines2) {
      const parts = l.split(" ");
      let total = 0;
      const widths = parts.map((p, i) => {
        const w = ctx.measureText(i === parts.length - 1 ? p : p + " ").width;
        total += w;
        return w;
      });
      let x = W / 2 - total / 2;
      parts.forEach((p, i) => {
        const clean = p.replace(/[^\w'-]/g, "").toLowerCase();
        ctx.fillStyle = target && clean === target ? S.accent : S.text;
        ctx.fillText(i === parts.length - 1 ? p : p + " ", x, y);
        x += widths[i];
      });
      y += lh;
    }

    // hairline rule below
    ctx.fillStyle = S.rule;
    ctx.fillRect(W / 2 - ruleW / 2, cy + blockH / 2 + size * 0.25, ruleW, 2);

    // wordmark
    const mark = foot.trim().toUpperCase();
    if (mark) {
      const fs = Math.round(W * 0.0205);
      ctx.font = `600 ${fs}px system-ui, sans-serif`;
      ctx.fillStyle = S.foot;
      const track = fs * 0.42;
      let mw = 0;
      for (const ch of mark) mw += ctx.measureText(ch).width + track;
      mw -= track;
      let mx = W / 2 - mw / 2;
      const my = cy + blockH / 2 + size * 0.25 + Math.round(W * 0.055);
      for (const ch of mark) { ctx.fillText(ch, mx, my); mx += ctx.measureText(ch).width + track; }
    }
  }, [text, hi, styleIdx, sizeKey, foot]);

  useEffect(() => { render(); }, [render]);

  function download() {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `unc-thought-${sizeKey.toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }

  function applyLine(i: number) {
    const l = lines[i];
    if (!l) return;
    setText(l);
    // Lift the longest word by default — usually the one carrying the meaning.
    const best = l.split(/\s+/).map((w) => w.replace(/[^\w'-]/g, "")).sort((a, b) => b.length - a.length)[0] ?? "";
    setHi(best);
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-3">
        {lines.length > 0 && (
          <div className="card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="label">Straight from your Library</span>
              <button
                className="btn btn-ghost text-[11px]"
                onClick={() => { const n = (pick + 1) % lines.length; setPick(n); applyLine(n); }}
              >
                <Shuffle size={12} /> Another one
              </button>
            </div>
            <p className="text-sm text-paper-dim italic">&ldquo;{lines[pick]}&rdquo;</p>
            <button className="btn text-xs" onClick={() => applyLine(pick)}>Use this line</button>
          </div>
        )}

        <div className="card p-4 space-y-3">
          <div>
            <label className="label" htmlFor="tcText">The line</label>
            <textarea id="tcText" className="input text-sm" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </div>

          <div>
            <span className="label">Lift one word</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <button className={`chip text-xs ${!hi ? "btn-primary" : ""}`} onClick={() => setHi("")}>none</button>
              {words.map((w) => (
                <button key={w} className={`chip text-xs ${hi.toLowerCase() === w.toLowerCase() ? "btn-primary" : ""}`} onClick={() => setHi(w)}>{w}</button>
              ))}
            </div>
          </div>

          <div>
            <span className="label">Style</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {STYLES.map((s, i) => (
                <button key={s.name} className={`chip text-xs ${styleIdx === i ? "btn-primary" : ""}`} onClick={() => setStyleIdx(i)}>{s.name}</button>
              ))}
            </div>
          </div>

          <div>
            <span className="label">Size</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {Object.entries(SIZES).map(([k, v]) => (
                <button key={k} className={`chip text-xs ${sizeKey === k ? "btn-primary" : ""}`} onClick={() => setSizeKey(k as keyof typeof SIZES)}>{k} · {v.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="tcFoot">Wordmark</label>
            <input id="tcFoot" className="input text-sm" maxLength={30} value={foot} onChange={(e) => setFoot(e.target.value)} />
          </div>

          <button className="btn btn-primary w-full" onClick={download}>
            <Download size={15} /> Download the post
          </button>
        </div>

        {/* Caption draft — yours to punch up, never posted as-is. */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="label">Caption &amp; hashtags</span>
            <button
              className="btn btn-ghost text-[11px]"
              onClick={async () => {
                try { await navigator.clipboard.writeText(caption); setCopiedCap(true); setTimeout(() => setCopiedCap(false), 1600); } catch { /* clipboard blocked */ }
              }}
            >
              {copiedCap ? <><Check size={11} /> copied</> : <><Copy size={11} /> copy all</>}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(["Basketball", "Nutrition", "Mindset"] as Pillar[]).map((p) => (
              <button key={p} className={`chip text-xs ${pillar === p ? "btn-primary" : ""}`} onClick={() => setPillar(p)}>{p}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ANGLES.map((a) => (
              <button key={a} className={`chip text-xs ${angle === a ? "btn-primary" : ""}`} onClick={() => setAngle(a)}>{a}</button>
            ))}
            <button className="chip text-xs" onClick={() => setTagSeed((s) => s + 1)}><Shuffle size={11} /> new tags</button>
          </div>

          <textarea className="input text-sm" rows={9} readOnly value={caption} aria-label="Caption draft" />
          <p className="text-[11px] text-grey">
            A draft to edit into your voice — the hashtags are a researched mix of broad,
            mid and Sydney-local tags for this pillar, not live trending data.
          </p>
        </div>
      </div>

      <div>
        <canvas ref={canvasRef} className="w-full h-auto rounded-lg border border-ink-line2" aria-label="Thought card preview" />
        <p className="text-[11px] text-grey mt-1.5">Live preview — exactly what downloads, ready for the grid.</p>
      </div>
    </div>
  );
}
