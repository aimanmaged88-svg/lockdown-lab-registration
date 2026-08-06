"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";

// The grid template, in-app: eyebrow / lead / big display / rule / body lines /
// footer — identical geometry to the posted series. The three pillar posts stay
// fixed (presets below); the middle post is whatever you type. Renders on a
// 1080×1350 canvas and downloads as a ready-to-post PNG. Body lines starting
// with "/" render grey, like the series' quieter lines.

type Fields = { num: string; lead: string; display: string; body: string; foot: string };

const PRESETS: Record<string, Fields> = {
  "01 · Player/Parent": {
    num: "01", lead: "FOR THE",
    display: "Player.\nParent.",
    body: "THE PERSON BEHIND THE PERFORMANCE.\n/BASKETBALL. NUTRITION. MINDSET.",
    foot: "LIVED EXPERIENCE / BUILT WITH THE COMMUNITY",
  },
  "02 · Lived Experience": {
    num: "02", lead: "NO PERFECT ANSWERS.",
    display: "Lived\nexperience.",
    body: "LOCAL BASKETBALL. REAL DEVELOPMENT.\nHONEST QUESTIONS.",
    foot: "WHAT WE HAVE SEEN / TRIED / LEARNED",
  },
  "03 · Not The Same Thing": {
    num: "03", lead: "NOT EVERYONE",
    display: "Needs the\nsame thing.",
    body: "DIFFERENT PEOPLE.\nDIFFERENT BODIES.\n/DIFFERENT PATHS.",
    foot: "ONE COMMUNITY / MANY STARTING POINTS",
  },
  "Blank (the middle one)": {
    num: "08", lead: "YOUR LEAD LINE",
    display: "Your big\nstatement.",
    body: "FIRST SUPPORT LINE.\n/QUIETER GREY LINE.",
    foot: "LINK IN BIO / BUILT WITH THE COMMUNITY",
  },
};

function drawTracked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number): number {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
  return cx - tracking;
}
function trackedWidth(ctx: CanvasRenderingContext2D, text: string, tracking: number): number {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + tracking;
  return w - tracking;
}

export function IgTemplateStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [f, setF] = useState<Fields>(PRESETS["Blank (the middle one)"]);
  const [fontReady, setFontReady] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    const anton = new FontFace("AntonStudio", "url(/brand/anton.ttf)");
    anton.load().then((face) => { document.fonts.add(face); setFontReady(true); }).catch(() => setFontReady(true));
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = 1080, H = 1350, X = 154, R = 926;
    const overflows: string[] = [];

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    // film-grain speckle
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(255,255,255,${(Math.random() * 0.06).toFixed(3)})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.3, 1.3);
    }
    // frame
    ctx.strokeStyle = "rgba(245,244,240,0.92)";
    ctx.lineWidth = 2;
    ctx.strokeRect(64, 64, W - 128, H - 128);

    ctx.textBaseline = "alphabetic";
    // eyebrow
    ctx.fillStyle = "#8d8d8d";
    ctx.font = "500 30px system-ui, sans-serif";
    drawTracked(ctx, `UNC THOUGHTS / ${f.num.trim() || "00"}`, X, 64 + 56 + 30, 12.6);

    // lead
    const lead = f.lead.trim().toUpperCase();
    let y = 64 + 56 + 30 + 150;
    if (lead) {
      ctx.fillStyle = "#9a9a9a";
      ctx.font = "500 34px system-ui, sans-serif";
      if (trackedWidth(ctx, lead, 10.9) > R - X) overflows.push("lead line");
      drawTracked(ctx, lead, X, y, 10.9);
    }

    // display
    const dispLines = f.display.split("\n").map((l) => l.toUpperCase()).filter(Boolean).slice(0, 4);
    let size = dispLines.length >= 4 ? 104 : dispLines.length === 3 ? 118 : 142;
    ctx.fillStyle = "#f2f1ec";
    ctx.font = `400 ${size}px AntonStudio, system-ui, sans-serif`;
    for (const l of dispLines) {
      if (ctx.measureText(l).width > R - X) { size = Math.max(84, size - 18); ctx.font = `400 ${size}px AntonStudio, system-ui, sans-serif`; }
    }
    y += 30;
    for (const l of dispLines) {
      y += size * 1.05;
      if (ctx.measureText(l).width > R - X) overflows.push(`big line “${l.slice(0, 18)}…”`);
      ctx.fillText(l, X, y);
    }

    // rule
    const bodyLines = f.body.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 4);
    if (bodyLines.length) {
      y += 64;
      ctx.fillStyle = "#f2f1ec";
      ctx.fillRect(X, y, R - X, 3);
      // body
      y += 40;
      for (const raw of bodyLines) {
        const grey = raw.startsWith("/");
        const line = (grey ? raw.slice(1) : raw).trim().toUpperCase();
        ctx.fillStyle = grey ? "#9a9a9a" : "#e8e7e2";
        ctx.font = `${grey ? 500 : 600} 33px system-ui, sans-serif`;
        y += 33 + 40;
        if (trackedWidth(ctx, line, 7.3) > R - X) overflows.push(`support line “${line.slice(0, 18)}…”`);
        drawTracked(ctx, line, X, y, 7.3);
      }
    }

    // footer
    const foot = f.foot.trim().toUpperCase();
    if (foot) {
      ctx.fillStyle = "#7c7c7c";
      ctx.font = "500 25px system-ui, sans-serif";
      if (trackedWidth(ctx, foot, 6.5) > R - X) overflows.push("footer");
      drawTracked(ctx, foot, X, H - 64 - 56 - 26 + 25, 6.5);
    }
    if (y > H - 240) overflows.push("too many lines — it's running into the footer");
    setWarn(overflows.length ? `Heads up, running long: ${[...new Set(overflows)].join(", ")}.` : null);
  }, [f]);

  useEffect(() => { if (fontReady) render(); }, [f, fontReady, render]);

  function download() {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `unc-thoughts-${f.num.trim() || "post"}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([name, preset]) => (
            <button key={name} className="chip text-xs" onClick={() => setF(preset)}>{name}</button>
          ))}
        </div>
        <div className="card p-4 space-y-2.5">
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <div>
              <label className="label" htmlFor="tnum">No.</label>
              <input id="tnum" className="input text-sm" maxLength={3} value={f.num} onChange={set("num")} />
            </div>
            <div>
              <label className="label" htmlFor="tlead">Small lead line</label>
              <input id="tlead" className="input text-sm" maxLength={40} value={f.lead} onChange={set("lead")} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="tdisp">The big statement (one thought per line)</label>
            <textarea id="tdisp" className="input text-sm" rows={3} value={f.display} onChange={set("display")} />
          </div>
          <div>
            <label className="label" htmlFor="tbody">Support lines (start a line with / to grey it)</label>
            <textarea id="tbody" className="input text-sm" rows={3} value={f.body} onChange={set("body")} />
          </div>
          <div>
            <label className="label" htmlFor="tfoot">Footer strip</label>
            <input id="tfoot" className="input text-sm" maxLength={60} value={f.foot} onChange={set("foot")} />
          </div>
          {warn && <p className="text-xs text-warn">{warn}</p>}
          <button className="btn btn-primary w-full" onClick={download}>
            <Download size={15} /> Download the post (1080×1350)
          </button>
        </div>
      </div>
      <div>
        <canvas ref={canvasRef} width={1080} height={1350} className="w-full h-auto rounded-lg border border-ink-line2" aria-label="Post preview" />
        <p className="text-[11px] text-grey mt-1.5">Live preview — exactly what downloads. Post at full quality straight to the grid.</p>
      </div>
    </div>
  );
}
