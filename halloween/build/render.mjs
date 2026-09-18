/* Render Hollow Press products: print-ready PDFs (A4 + US Letter) + preview PNGs.
   Chromium print-to-PDF keeps type and CSS shapes as vectors, so output is
   resolution-independent — the right engine for letterpress-style printables.

   usage:  node render.mjs                 # everything in PRODUCTS
           node render.mjs p1-sideshow     # one product
*/
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs/promises";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "products");
const PREV = path.join(HERE, "..", "previews");

export const PRODUCTS = [
  { id: "p1-sideshow", file: "p1-sideshow.html", pdf: "the-sideshow-set" },
  { id: "p2-poison",   file: "p2-poison.html",   pdf: "poison-apothecary-labels" },
  { id: "p3-party",    file: "p3-party.html",    pdf: "haunted-carnival-party-pack" },
  { id: "p4-tickets",  file: "p4-tickets.html",  pdf: "admit-one-tickets-and-tags" },
  { id: "p5-table",    file: "p5-table.html",    pdf: "the-mourning-table", preview: 4 },
];

const only = process.argv[2];

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(PREV, { recursive: true });

  const browser = await chromium.launch();
  const list = only ? PRODUCTS.filter(p => p.id === only) : PRODUCTS;
  if (!list.length) { console.error(`no product matching "${only}"`); process.exit(1); }

  for (const p of list) {
    const src = path.join(HERE, p.file);
    try { await fs.access(src); } catch { console.log(`· skip ${p.id} (not written yet)`); continue; }

    const page = await browser.newPage();
    await page.goto("file://" + src, { waitUntil: "load" });
    // products build their own DOM, then flag ready
    await page.waitForFunction(() => document.documentElement.dataset.ready === "1",
      null, { timeout: 15000 });
    await page.waitForTimeout(400); // let webfonts settle before layout is frozen

    const sheets = await page.evaluate(() => document.querySelectorAll(".page").length);

    for (const [fmt, suffix] of [["A4", "A4"], ["Letter", "US-Letter"]]) {
      const dest = path.join(OUT, `${p.pdf}_${suffix}.pdf`);
      await page.pdf({ path: dest, format: fmt, printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 } });
      const { size } = await fs.stat(dest);
      console.log(`  ${path.basename(dest)}  ${sheets} sheets  ${(size/1024).toFixed(0)} KB`);
    }

    // preview: first sheet, 2x, for the storefront and the pins
    await page.setViewportSize({ width: 794, height: 1123 });
    const shot = page.locator(".page").nth(p.preview ?? 0);
    await shot.screenshot({ path: path.join(PREV, `${p.pdf}.png`), scale: "css" });

    await page.close();
  }
  await browser.close();
}
main();
