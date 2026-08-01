# Completion tests

The 30 required completion checks and how each is satisfied. Automated coverage:
Vitest (unit) + Playwright (E2E). Manual/verified flows are noted.

| # | Test | How it's satisfied | Status |
|---|------|--------------------|--------|
| 1 | Install dependencies | `npm install` | ✅ |
| 2 | Initialise the database | `npm run setup` (migrate + generate + seed) | ✅ |
| 3 | Import the roadmap | `/api/import` preview + CLI `import:roadmap`; unit-tested parse/diff | ✅ |
| 4 | Confirm correct dates/content appear | Seed + import land on Calendar/Content/Today | ✅ |
| 5 | Complete + persist a daily task | E2E: toggle checklist item, reload, still ticked | ✅ E2E |
| 6 | Reschedule a missed task | `rescheduleContent` action; Today "Overdue" quick actions | ✅ |
| 7 | Run a Batch Day session | `createBatch` action; Studio → Batch Day | ✅ |
| 8 | Open Recording Studio mode | Studio guided recorder (camera/mic/teleprompter) | ✅ E2E (page) |
| 9 | Use the teleprompter | Guided recorder teleprompter (size + speed) | ✅ |
| 10 | Run the Reel Preflight checker | E2E: Studio → Preflight, pass a check | ✅ E2E |
| 11 | Mark a Reel as posted | `markPosted` action; Today/Content quick actions | ✅ |
| 12 | Record 24-hour analytics | `addAnalytics` action; Analytics form | ✅ |
| 13 | Upload + confirm an analytics screenshot | `saveScreenshot` + confirm-before-save | ✅ |
| 14 | Generate an adaptive recommendation | Engine on Today ("Why these matter"); unit-tested | ✅ E2E+unit |
| 15 | Convert a comment into a Reply Reel | E2E: Community → Turn into Reply Reel | ✅ E2E |
| 16 | Create a Trial Reel experiment | `createExperiment` (trial_vs_standard); Growth Lab | ✅ |
| 17 | Create a community question | E2E: Community → Add question | ✅ E2E |
| 18 | Create a talk | E2E: Talks → Create talk | ✅ E2E |
| 19 | Turn a talk note into a clip task | `clipToContent`; Talk detail → Turn into a Reel task | ✅ |
| 20 | Invite an adult beta member | `createInvite` (18+); Community beta (flag on) | ✅ |
| 21 | Report a community post | `reportPost`; Community beta | ✅ |
| 22 | Resolve the report as a moderator | `resolveReport` with transparent reason | ✅ |
| 23 | Export a weekly Markdown report | `/api/export/weekly`; Weekly Review page | ✅ E2E |
| 24 | Export and restore a backup | `/api/backup` + `/api/restore` (round-trip verified) | ✅ |
| 25 | Run linting | `npm run lint` → no warnings or errors | ✅ |
| 26 | Run type checking | `npm run typecheck` → clean | ✅ |
| 27 | Run unit tests | `npm test` → 25 passing | ✅ |
| 28 | Run end-to-end tests | `npm run test:e2e` → 8 passing | ✅ |
| 29 | Run a production build | `npm run build` → succeeds | ✅ |
| 30 | Fix all material errors | lint/typecheck/build/tests all green | ✅ |

## Run them yourself

```bash
npm run setup          # 2,4
npm run lint           # 25
npm run typecheck      # 26
npm test               # 27  (analytics, recommend, nutrition-safety, importer)
npm run build          # 29
npm run test:e2e       # 28  (needs the build first)
```

The remaining flows (6, 7, 9, 11, 12, 13, 16, 19, 20, 21, 22, 24) are exercised
through the UI and their underlying server actions/API routes; the E2E suite
covers the highest-value ones end-to-end.
