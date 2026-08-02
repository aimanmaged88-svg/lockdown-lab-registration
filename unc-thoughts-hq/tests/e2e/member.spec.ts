import { test, expect } from "@playwright/test";

// Ask Unk acceptance tests (see docs/ASK-UNK.md for the full mapping).

test("member home shows the eight things and nothing feed-like", async ({ page }) => {
  await page.goto("/member");
  await expect(page.getByPlaceholder("Ask Unk anything about today…")).toBeVisible(); // 1 Ask Unk
  for (const label of ["Game today", "Training today", "What should I eat?", "Mindset reset", "Recovery", "Thought of the Day", "My answers"]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
});

test("asking about a 7:30 PM game returns a structured, time-banded answer from approved teaching", async ({ page }) => {
  await page.goto("/member/ask");
  await page.getByLabel("Ask Unk").fill("My game is at 7:30 PM. What should I do now?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByText("Do this now")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("Food and fluids")).toBeVisible();
  await expect(page.getByText("Mindset cue")).toBeVisible();
  await expect(page.getByText("Answer this privately")).toBeVisible();
  await expect(page.getByText("You do not have to share your answer. But answer it honestly for yourself.")).toBeVisible();
  await expect(page.getByText(/to go|after the session/)).toBeVisible(); // band, not fake precision
  // Why? reveals depth + which approved teaching informed it
  await page.getByRole("button", { name: /Why\?/ }).click();
  await expect(page.getByText(/From Unk's approved teaching/)).toBeVisible();
});

test("supplement / quick-speed question gets the safety redirect, not a product", async ({ page }) => {
  await page.goto("/member/ask");
  await page.getByLabel("Ask Unk").fill("What gives me a quick burst of speed?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByText(/nothing gives you an instant burst of speed/i)).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/AIS|Accredited Sports Dietitian|warm-up|familiar/i).first()).toBeVisible();
});

test("medical-risk question escalates to humans (000)", async ({ page }) => {
  await page.goto("/member/ask");
  await page.getByLabel("Ask Unk").fill("I get chest pain when I run hard");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByText(/needs a person, right now/i)).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/000/).first()).toBeVisible();
});

test("a private answer saves, stays private, and sharing is a separate confirmed step", async ({ page }) => {
  await page.goto("/member/thought");
  const marker = `Private thought ${Date.now()}`;
  await page.getByLabel("Private answer").fill(marker);
  await page.getByRole("button", { name: "Save privately" }).click();
  await expect(page.getByText(/Saved — private to you/)).toBeVisible({ timeout: 15000 });

  await page.goto("/member/answers");
  await expect(page.getByText(marker)).toBeVisible();
  // Sharing is optional + separate: with the community closed, sharing is OFF
  // and nothing offers to publish; the answer explicitly stays private.
  await expect(page.getByText(/Sharing is off while the community is closed/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Confirm — submit for review/ })).toHaveCount(0);
});
