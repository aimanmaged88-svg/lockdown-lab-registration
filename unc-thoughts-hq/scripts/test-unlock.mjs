import { chromium } from "@playwright/test";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
const p = await c.newPage();
await p.goto("http://localhost:3700/", { waitUntil: "domcontentloaded" });
console.log("redirected to:", p.url().includes("/unlock") ? "/unlock ✓" : p.url());
// wrong password
await p.getByLabel("Desk password").fill("wrongpass");
await p.getByRole("button", { name: "Unlock" }).click();
await p.waitForURL(/bad=1/, { timeout: 15000 });
console.log("wrong password rejected ✓");
// right password
await p.getByLabel("Desk password").fill("letsgo88");
await p.getByRole("button", { name: "Unlock" }).click();
await p.waitForURL((u) => !u.href.includes("unlock"), { timeout: 15000 });
await p.waitForTimeout(800);
const today = await p.getByText("The single next best action").isVisible().catch(() => false);
console.log("landed on Today:", today ? "✓" : p.url());
// cookie persists across navigation
await p.goto("http://localhost:3700/compose", { waitUntil: "domcontentloaded" });
console.log("compose after unlock:", p.url().includes("compose") ? "✓ stays unlocked" : p.url());
await p.screenshot({ path: "screenshots/w1-unlock.png" });
await b.close();
console.log("DONE");
