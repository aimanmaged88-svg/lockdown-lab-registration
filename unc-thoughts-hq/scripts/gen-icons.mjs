import { chromium } from "@playwright/test";
import { readFileSync } from "fs";
const svg = readFileSync("public/brand/icon.svg", "utf8");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const size of [180, 192, 512]) {
  const ctx = await b.newContext({ viewport: { width: size, height: size } });
  const p = await ctx.newPage();
  await p.setContent(`<style>*{margin:0}</style><div style="width:${size}px;height:${size}px">${svg.replace(/width="512" height="512"/, `width="${size}" height="${size}"`)}</div>`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `public/brand/icon-${size}.png` });
  await ctx.close();
  console.log("icon", size);
}
await b.close();
