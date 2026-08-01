import { defineConfig, devices } from "@playwright/test";

// E2E runs against a dedicated SQLite DB (e2e.db) so it never touches dev data.
// The webServer builds nothing — run `npm run build` first (the test:e2e script
// assumes a prod build is present) — it just migrates, seeds, and serves.
const PORT = 3123;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use the environment's pre-installed Chromium (avoids a version-locked
        // browser download). Override with PW_CHROMIUM if your path differs, or
        // remove this to let Playwright manage its own browser.
        launchOptions: process.env.PW_CHROMIUM || require("fs").existsSync("/opt/pw-browsers/chromium")
          ? { executablePath: process.env.PW_CHROMIUM || "/opt/pw-browsers/chromium" }
          : {},
      },
    },
  ],
  webServer: {
    command: `bash -c "DATABASE_URL=file:./e2e.db npx prisma migrate deploy && DATABASE_URL=file:./e2e.db npx tsx prisma/seed.ts && DATABASE_URL=file:./e2e.db npx next start -p ${PORT}"`,
    url: `http://localhost:${PORT}`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
