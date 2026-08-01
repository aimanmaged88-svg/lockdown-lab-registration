# Release C — future growth roadmap

Release C is **documented, not built** (by design). The architecture is ready
for it; this is the sequence and how each piece slots into what already exists.

> Do **not** build expensive custom live-streaming infrastructure for the first
> release. Use external event links (already how Talks work) until scale
> justifies more.

## 1. Native mobile applications
- Wrap the PWA first (it's already installable), then evaluate React Native /
  Capacitor for true background features (e.g. geofenced reminders) the web
  can't do. The API/service layer is already client-agnostic.

## 2. Approved Instagram/Meta API integrations
- Replace manual analytics entry with the **Instagram Graph API** (Insights)
  behind a `ProviderAdapter` (the analytics import already has a `source` field:
  `manual | screenshot_ocr | api`). Never scrape; only approved APIs.

## 3. Professional subscriptions
- Introduce plans + entitlements. RBAC (`src/lib/rbac.ts`) and feature flags are
  the seam; add a `Plan` model and gate capabilities per org.

## 4. Coach & club workspaces (multi-org)
- The schema is already multi-tenant (`Organisation` on every row; all queries
  via `getOrgId()`). Add org switching, per-org membership, and org-scoped RBAC.
  This is the biggest lever and needs the least reshaping.

## 5. Expert-led programmes
- Build on Talks + Collaborators + Verified Experts. Add a `Programme` model
  (multi-session curriculum) linking content, talks and challenges.

## 6. Advanced video analysis
- Optional local FFmpeg inspection is already flagged (`FEATURE_VIDEO_INSPECT`).
  Add opt-in transcription for filler words / pace / hook timing — always framed
  as guidance, never a judgement of the person.

## 7. Larger community moderation teams
- Extend roles + the moderation queue with assignment, SLAs, and a transparency
  log. Audit events already capture the trail.

## 8. Live streaming
- Keep using external links first. Only invest in hosted streaming when demand
  and budget clearly justify it.

## 9. International communities
- Timezone is already abstracted (`src/lib/time.ts`, currently Australia/Sydney)
  and copy is centralised enough to localise. Add per-org locale + i18n.

## 10. Multiple UNC Thoughts creators
- Multi-org + roles enable multiple creators, each with their own workspace under
  a shared brand, without exposing that complexity in a single creator's UI.

## Sequencing suggestion

Multi-org (4) and approved API (2) unlock the most and reshape the least — do
those first. Subscriptions (3) fund the rest. Native (1) and video analysis (6)
follow demand. Live streaming (8) last.
