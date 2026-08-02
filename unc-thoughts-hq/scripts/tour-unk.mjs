import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const BASE = "http://localhost:3500";
const OUT = "screenshots";
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

async function shot(page, name, full = true) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log("shot", name);
}

// ── Member app (phone-first) ──
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const p = await m.newPage();

await p.goto(`${BASE}/member`, { waitUntil: "domcontentloaded" });
await shot(p, "u1-member-home");

// Ask Unk — 7:30 PM game answer
await p.goto(`${BASE}/member/ask`, { waitUntil: "domcontentloaded" });
await p.getByLabel("Ask Unk").fill("My game is at 7:30 PM. What should I do now?");
await p.getByRole("button", { name: "Ask", exact: true }).click();
await p.getByText("Do this now").waitFor({ timeout: 20000 });
await p.getByRole("button", { name: /Why\?/ }).click();
await shot(p, "u2-ask-game-730");

// Safety redirect
await p.goto(`${BASE}/member/ask`, { waitUntil: "domcontentloaded" });
await p.getByLabel("Ask Unk").fill("What gives me a quick burst of speed?");
await p.getByRole("button", { name: "Ask", exact: true }).click();
await p.getByText(/nothing gives you an instant burst/i).waitFor({ timeout: 20000 });
await shot(p, "u3-ask-safety-redirect");

// Game flow
await p.goto(`${BASE}/member/game`, { waitUntil: "domcontentloaded" });
await p.locator("#ftime").fill("19:30");
await p.getByRole("button", { name: "Yes" }).click();
await p.getByRole("button", { name: "What should I do now?" }).click();
await p.getByText("Do this now").waitFor({ timeout: 20000 });
await shot(p, "u4-game-flow");

// Thought of the Day + save a private answer
await p.goto(`${BASE}/member/thought`, { waitUntil: "domcontentloaded" });
await p.getByLabel("Private answer").fill("Being honest — I coasted at training on Tuesday. This week I go first in every drill.");
await p.locator(".chip").first().click().catch(() => {});
await shot(p, "u5-thought-of-day");
await p.getByRole("button", { name: "Save privately" }).click();
await p.getByText(/Saved — private to you/).waitFor({ timeout: 15000 });

// My answers
await p.goto(`${BASE}/member/answers`, { waitUntil: "domcontentloaded" });
await shot(p, "u6-my-answers");
await m.close();

// ── Owner: Unk's Brain (desktop) ──
const d = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const dp = await d.newPage();
await dp.goto(`${BASE}/brain`, { waitUntil: "domcontentloaded" });
await dp.waitForTimeout(600);
await dp.screenshot({ path: `${OUT}/u7-brain-knowledge.png`, clip: { x: 0, y: 0, width: 1280, height: 1600 } });
console.log("shot u7-brain-knowledge");
await dp.goto(`${BASE}/brain?tab=insights`, { waitUntil: "domcontentloaded" });
await shot(dp, "u8-brain-insights");
await d.close();

await browser.close();
console.log("DONE");
