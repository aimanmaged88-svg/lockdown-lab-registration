# Troubleshooting

## "Organisation not seeded" / empty screens
Run `npm run setup` (or `npm run db:seed`). This creates the org, owner, research
library, lessons, spaces, challenges and sample plan.

## The app won't start
- Make sure Node.js (LTS) is installed: `node -v`.
- Delete `node_modules` and run `npm install` again.
- Check `.env` exists (copy it from `.env.example`).

## Database errors after changing the schema
- Dev: `npm run db:migrate` to create/apply a migration.
- To start clean locally, delete `prisma/dev.db` then run `npm run setup`.

## Import didn't pick up my columns
The importer matches headers by name (Date, Topic/Title, Pillar, Audience,
Format, Hook, Creation instructions, Caption, Conversation CTA, Highlight,
Status, Notes). Rename oddly-named columns to something close, or check the
preview's "conflicts" list. Re-running never duplicates — it updates in place.

## Camera/mic won't start in the Recording Studio
- Browsers only allow camera/mic on `localhost` or HTTPS. Grant permission when
  prompted.
- If your device/browser can't record, the studio automatically falls back to
  **shot-list + teleprompter** mode — use it beside your phone's normal camera.

## Analytics screenshot didn't auto-fill numbers
That's intentional. The app **never saves guessed figures**. Upload the
screenshot (it's preserved), type the numbers you can see, tick to confirm, save.

## Fonts look like a plain sans-serif
The app uses web-safe fallback fonts if the Google Fonts link can't load
(offline). It still works perfectly — just a slightly different typeface.

## Playwright E2E can't find a browser
Set `PW_CHROMIUM` to your Chromium path, or run `npx playwright install chromium`
to let Playwright manage its own browser.

## Community features are missing
Release B is **off by default**. Enable it in **Settings → Feature flags** after
reading `docs/COMMUNITY-SAFETY-CHECKLIST.md`.
