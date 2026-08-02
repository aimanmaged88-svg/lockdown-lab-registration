// Client-side quote-card renderer: 1080×1350 (IG portrait), brand style —
// near-black, off-white condensed headline, grey question footer, small
// wordmark. No external assets, so export always works offline.

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const probe = line ? `${line} ${word}` : word;
      if (ctx.measureText(probe).width > maxWidth && line) {
        out.push(line);
        line = word;
      } else line = probe;
    }
    out.push(line);
  }
  return out;
}

export function renderCard(opts: { headline: string; sub?: string; question?: string }): string {
  const W = 1080, H = 1350, PAD = 96;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // surface
  ctx.fillStyle = "#0B0B0C";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#26262A";
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  // wordmark
  ctx.fillStyle = "#8A8A90";
  ctx.font = "600 34px Oswald, 'Arial Narrow', sans-serif";
  ctx.textBaseline = "top";
  ctx.letterSpacing = "6px";
  ctx.fillText("UNC THOUGHTS", PAD, 92);
  ctx.letterSpacing = "0px";

  // headline — autoscale down until it fits
  const isLong = opts.headline.length > 80;
  let size = isLong ? 64 : 84;
  let lines: string[] = [];
  for (; size >= 40; size -= 6) {
    ctx.font = `700 ${size}px Oswald, 'Arial Narrow', sans-serif`;
    lines = wrap(ctx, opts.headline.toUpperCase(), W - PAD * 2);
    const subLines = opts.sub ? wrap(ctx, opts.sub, W - PAD * 2).length : 0;
    if (lines.length * (size * 1.18) + subLines * 46 < H - 460) break;
  }
  ctx.fillStyle = "#F4F2EC";
  let y = 230;
  ctx.font = `700 ${size}px Oswald, 'Arial Narrow', sans-serif`;
  for (const l of lines) { ctx.fillText(l, PAD, y); y += size * 1.18; }

  // sub
  if (opts.sub) {
    y += 26;
    ctx.fillStyle = "#B9B7AF";
    ctx.font = "400 38px Inter, system-ui, sans-serif";
    for (const l of wrap(ctx, opts.sub, W - PAD * 2)) { ctx.fillText(l, PAD, y); y += 52; }
  }

  // question footer
  if (opts.question) {
    ctx.fillStyle = "#26262A";
    ctx.fillRect(PAD, H - 300, 120, 4);
    ctx.fillStyle = "#8A8A90";
    ctx.font = "500 34px Inter, system-ui, sans-serif";
    let qy = H - 260;
    for (const l of wrap(ctx, opts.question, W - PAD * 2)) { ctx.fillText(l, PAD, qy); qy += 46; }
  }

  return canvas.toDataURL("image/png");
}

export function downloadCard(opts: { headline: string; sub?: string; question?: string }, filename: string) {
  const a = document.createElement("a");
  a.href = renderCard(opts);
  a.download = filename.replace(/[^a-z0-9-]+/gi, "-").toLowerCase() + ".png";
  a.click();
}
