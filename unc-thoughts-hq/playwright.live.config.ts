import { defineConfig, devices } from "@playwright/test";

// Live smoke: runs the member acceptance spec against the DEPLOYED site.
// Usage: LIVE_URL=https://unc-thoughts-hq.netlify.app npx playwright test -c playwright.live.config.ts
// Writes only AskLogs + (one) reflection on the live DB — clean up after.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /member\.spec\.ts/,
  timeout: 60_000,
  workers: 1,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.LIVE_URL || "https://unc-thoughts-hq.netlify.app",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: process.env.PW_CHROMIUM || require("fs").existsSync("/opt/pw-browsers/chromium")
          ? { executablePath: process.env.PW_CHROMIUM || "/opt/pw-browsers/chromium" }
          : {},
      },
    },
  ],
});
