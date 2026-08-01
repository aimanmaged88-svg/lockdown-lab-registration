import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const BASE = "http://localhost:3400";
const OUT = "screenshots";
mkdirSync(OUT, { recursive: true });

const exe = "/opt/pw-browsers/chromium";
const browser = await chromium.launch({ executablePath: exe });

async function shot(page, name) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log("shot", name);
}

// ---------- Desktop ----------
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await shot(page, "01-today");

// open 20-minute mode
try { await page.getByRole("button", { name: /Start 20-minute mode/ }).click(); await page.waitForTimeout(500); await shot(page, "02-today-20min"); } catch {}

await page.goto(`${BASE}/calendar`, { waitUntil: "domcontentloaded" }); await shot(page, "03-calendar");
await page.goto(`${BASE}/content`, { waitUntil: "domcontentloaded" }); await shot(page, "04-content");

// content detail — first row link
await page.locator("table tbody tr td a").first().click();
await page.waitForLoadState("domcontentloaded"); await shot(page, "05-content-detail");

await page.goto(`${BASE}/content/new`, { waitUntil: "domcontentloaded" }); await shot(page, "06-content-new");

// studio tabs
await page.goto(`${BASE}/studio`, { waitUntil: "domcontentloaded" }); await shot(page, "07-studio-guided");
await page.getByRole("tab", { name: "Types" }).click(); await shot(page, "08-studio-types");
await page.getByRole("tab", { name: "Speaking & Hooks" }).click();
// give the hook coach a topic so it renders variants
try { await page.getByLabel(/What's the idea/).fill("resetting after a mistake"); await page.waitForTimeout(400); } catch {}
await shot(page, "09-studio-speaking");
await page.getByRole("tab", { name: "Batch Day" }).click(); await shot(page, "10-studio-batch");
await page.goto(`${BASE}/studio?tab=preflight`, { waitUntil: "domcontentloaded" }); await shot(page, "11-studio-preflight");

await page.goto(`${BASE}/analytics`, { waitUntil: "domcontentloaded" }); await shot(page, "12-analytics");

// analytics record form for a posted reel
const posted = await page.locator("a.chip").first();
try { await posted.click(); await page.waitForLoadState("domcontentloaded"); await shot(page, "13-analytics-record"); } catch {}

await page.goto(`${BASE}/community`, { waitUntil: "domcontentloaded" }); await shot(page, "14-community");
await page.goto(`${BASE}/talks`, { waitUntil: "domcontentloaded" }); await shot(page, "15-talks");
await page.locator("a", { hasText: "Ask UNC" }).first().click(); await page.waitForLoadState("domcontentloaded"); await shot(page, "16-talk-detail");
await page.goto(`${BASE}/growth`, { waitUntil: "domcontentloaded" }); await shot(page, "17-growth");
await page.goto(`${BASE}/practice`, { waitUntil: "domcontentloaded" }); await shot(page, "18-practice-lessons");
await page.goto(`${BASE}/practice?tab=research`, { waitUntil: "domcontentloaded" }); await shot(page, "19-practice-research");
await page.goto(`${BASE}/review`, { waitUntil: "domcontentloaded" }); await shot(page, "20-weekly-review");
await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" }); await shot(page, "21-settings");

await ctx.close();

// ---------- Mobile ----------
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const mp = await m.newPage();
await mp.goto(`${BASE}/`, { waitUntil: "domcontentloaded" }); await shot(mp, "22-mobile-today");
await mp.goto(`${BASE}/community`, { waitUntil: "domcontentloaded" }); await shot(mp, "23-mobile-community");
// open the mobile drawer
try { await mp.getByRole("button", { name: "Open menu" }).click(); await mp.waitForTimeout(400); await mp.screenshot({ path: `${OUT}/24-mobile-menu.png` }); console.log("shot 24-mobile-menu"); } catch {}
await m.close();

await browser.close();
console.log("DONE");
