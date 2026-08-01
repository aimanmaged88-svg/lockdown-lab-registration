# Deployment-readiness checklist

The app is designed to run happily on your own machine. This checklist is for
when you want to host it (for yourself, or later for a community).

## Local / personal use (default)

- [x] `npm run setup` completes (migrate + generate + seed).
- [x] `npm run build` succeeds.
- [x] `npm run start` serves at <http://localhost:3000>.
- [x] Official logo dropped at `public/brand/logo.png`.
- [x] Roadmap imported (Settings → Import).
- [x] A backup downloaded and kept somewhere safe.

## Before hosting online

- [ ] Move from SQLite to **PostgreSQL** (see README "Moving to PostgreSQL").
- [ ] Set all environment variables (`DATABASE_URL`, `AUTH_SECRET`,
      `NEXT_PUBLIC_APP_URL`) — never commit `.env`.
- [ ] Put the app behind HTTPS.
- [ ] Move file storage to a cloud provider (implement the `StorageProvider`
      interface in `src/lib/storage.ts` for S3/GCS; the app only uses relative
      keys, so nothing else changes).
- [ ] Configure backups of the database.
- [ ] Add authentication for the owner/admin surfaces if the host is public.
- [ ] Review the security headers in `next.config.ts` for your domain.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`.

## Before opening the community (Release B)

- [ ] Complete `COMMUNITY-SAFETY-CHECKLIST.md` in full.
- [ ] Publish community guidelines and a lawyer-reviewed privacy policy.
- [ ] Confirm 18+ enforcement and no adult-to-child DMs.
- [ ] Set up moderation coverage and an incident escalation path.

## Performance notes

- Pages are server-rendered on demand and fast on ordinary hardware.
- The SQLite file lives at `prisma/dev.db`; keep it backed up.
- The PWA service worker (production only) gives an offline shell; API responses
  are never cached.
