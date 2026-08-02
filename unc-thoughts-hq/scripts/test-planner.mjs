// One-off local verification of the "Plan my week" button.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:4321";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();

// wait for server
for (let i = 0; i < 30; i++) {
  try { const r = await page.request.get(BASE + "/calendar"); if (r.ok()) break; } catch {}
  await new Promise((r) => setTimeout(r, 1000));
}

await page.goto(BASE + "/calendar", { waitUntil: "networkidle" });
const before = await page.locator("text=nothing planned").count();
console.log("empty-day rows before:", before);

await page.getByRole("button", { name: /Plan my week/ }).click();
await page.waitForTimeout(4000);
const msg1 = await page.locator(".text-good").first().textContent().catch(() => null);
console.log("first click message:", msg1);

const after = await page.locator("text=nothing planned").count();
console.log("empty-day rows after:", after);

// second click must be a no-op (idempotent)
await page.getByRole("button", { name: /Plan my week/ }).click();
await page.waitForTimeout(4000);
const msg2 = await page.locator(".text-good").first().textContent().catch(() => null);
console.log("second click message:", msg2);

// grab planned titles for the next 7 days section
const titles = await page.locator("main a[href^='/content/']").allTextContents();
console.log("calendar items:", titles.length);

await browser.close();
const created = /planned from your teaching/.test(msg1 ?? "");
const idempotent = /already full|nothing to add/i.test(msg2 ?? "") || msg2 === msg1 && !created;
console.log(created && /already full/i.test(msg2 ?? "") ? "PASS" : (created ? "PARTIAL: " + msg2 : "CHECK: " + msg1));
