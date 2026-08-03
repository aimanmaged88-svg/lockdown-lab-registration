// One-off local verification of the Consistency Chart.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:4321";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext();
const page = await ctx.newPage();

for (let i = 0; i < 30; i++) {
  try { const r = await page.request.get(BASE + "/member"); if (r.ok()) break; } catch {}
  await new Promise((r) => setTimeout(r, 1000));
}

// Home tile present
await page.goto(BASE + "/member", { waitUntil: "networkidle" });
console.log("home tile:", await page.locator("text=Consistency Chart").count() > 0);

// Open page, tag two habits + energy, save
await page.click("text=Consistency Chart");
await page.waitForURL("**/member/consistency");
await page.click("text=Good fats");
await page.click("text=Drank enough water");
await page.getByRole("button", { name: /4\s*Good/ }).click();
await page.getByRole("button", { name: "Save today" }).click();
await page.waitForSelector("text=Saved for today", { timeout: 15000 });
console.log("saved:", true);

// Reload — state persists from DB
await page.reload({ waitUntil: "networkidle" });
const fats = await page.locator("button", { hasText: "Good fats" }).getAttribute("class");
console.log("persists after reload:", /bg-paper/.test(fats ?? ""));
console.log("showed up chip:", (await page.locator("text=Showed up").textContent())?.trim());

// Empty-insights honesty line
console.log("honest empty state:", await page.locator("text=won't make one up").count() > 0);

// Verbatim privacy principle
console.log("privacy line:", await page.locator("text=But answer it honestly for yourself").count() > 0);

await browser.close();
console.log("DONE");
