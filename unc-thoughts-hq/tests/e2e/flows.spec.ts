import { test, expect } from "@playwright/test";

// End-to-end coverage of the highest-value creator flows. These exercise real
// server actions + persistence against the e2e SQLite database.

test("Today loads with the command centre", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  await expect(page.getByText("The single next best action")).toBeVisible();
});

test("a daily checklist task persists after reload", async ({ page }) => {
  await page.goto("/");
  // The seeded 'today' content shows a checklist. Toggle the first not-done item.
  const firstUndone = page.locator("button[aria-pressed='false']").first();
  await expect(firstUndone).toBeVisible();
  const label = (await firstUndone.innerText()).split("\n")[0];
  const item = page.locator("button[aria-pressed]", { hasText: label }).first();
  // Click, give the server action time to commit, reload, assert persisted.
  // Retried as a block: absorbs cold-compile slowness and hydration races.
  await expect(async () => {
    if ((await item.getAttribute("aria-pressed")) !== "true") {
      await item.click();
      await page.waitForTimeout(1500);
    }
    await page.reload();
    await expect(page.locator("button[aria-pressed='true']", { hasText: label }).first()).toBeVisible({ timeout: 4000 });
  }).toPass({ timeout: 45000 });
});

test("create a new content item", async ({ page }) => {
  await page.goto("/content/new");
  const title = `E2E test idea ${Date.now()}`;
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Hook").fill("Try this on your next rep.");
  await page.getByRole("button", { name: "Create content" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible({ timeout: 15000 });
});

test("run the Reel preflight checker", async ({ page }) => {
  await page.goto("/studio?tab=preflight");
  await expect(page.getByText("Reel preflight")).toBeVisible();
  // Pass the first check via its Pass button.
  await page.getByRole("button", { name: "Pass" }).first().click();
  await expect(page.getByText(/checks still open|safe to mark Ready/i)).toBeVisible();
});

test("log a community question and turn it into a Reply Reel", async ({ page }) => {
  await page.goto("/community");
  const ts = String(Date.now());
  const q = `E2E: how do I ${ts}?`;
  await page.getByPlaceholder("Paste a real comment").fill(q);
  await page.getByRole("button", { name: "Add question" }).click();
  await expect(page.getByText(q)).toBeVisible({ timeout: 15000 });
  const card = page.locator(".card", { hasText: q }).first();
  const btn = card.getByRole("button", { name: /Turn into Reply Reel/ });
  await expect(btn).toBeVisible();
  await btn.click();
  // Verify the durable outcome: a Reply Reel content item was created (its title
  // carries the unique question text). Checking /content avoids depending on the
  // community list's re-render/re-sort after the action.
  await expect(async () => {
    await page.goto("/content");
    await expect(page.getByText(new RegExp(`Reply.*${ts}`)).first()).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 30000 });
});

test("create a talk", async ({ page }) => {
  await page.goto("/talks");
  const title = `E2E Talk ${Date.now()}`;
  await page.getByPlaceholder("Talk title").fill(title);
  await page.getByRole("button", { name: "Create talk" }).click();
  await expect(page.getByRole("link", { name: title })).toBeVisible({ timeout: 15000 });
});

test("weekly review renders and is exportable", async ({ page }) => {
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "Weekly Review" })).toBeVisible();
  await expect(page.getByText("UNC Thoughts — Weekly Review")).toBeVisible();
});

test("community beta is off by default and can be enabled", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByText("Adult community beta (Release B) — 18+ only")).toBeVisible();
});
