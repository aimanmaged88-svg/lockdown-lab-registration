# Privacy notice

UNC Thoughts HQ is built to collect the **minimum data needed** and to protect
it, in line with the Australian Privacy Principles (OAIC) and child-safe
practice. This is an operational notice for the app as built; it is **not legal
advice**. Have a solicitor review your public-facing privacy policy before you
open any community to real members.

## What the app stores

- **Creator content & plans** — your ideas, scripts, captions, schedule, notes.
- **Analytics you enter** — figures you type or read off screenshots you upload.
  Screenshots are stored locally under `storage/` and served only to you.
- **Community questions** — the text of comments/questions you log. Log the
  content, not people's private details.
- **Release B members (if enabled)** — display name, email, an **18+
  confirmation** (not a date of birth), role, and consent records.

## What the app deliberately does NOT collect

- Exact live location
- School information (unless you genuinely, explicitly need it — avoid it)
- Unnecessary birth dates (we store an 18+ confirmation, not a DOB)
- Health diagnoses
- Body measurements
- Detailed dietary records
- Private information about children

## Your controls

- **Export my data** — full JSON backup (`/api/backup`) plus per-area CSVs.
- **Delete content** — delete any content item; delete/skip flows are recorded.
- **Delete account** (Release B) — member `status` can be set to `deleted`.
- **Consent records** — 18+, community guidelines, recording appearance and data
  processing are stored per member.
- **Access logs** — administrators' consequential actions are in the audit trail.
- **Data retention** — you hold the SQLite database; nothing leaves your machine
  unless you deploy it or enable optional AI (which you configure explicitly).

## Sensitive information

Nutrition and any health-adjacent notes are treated as **sensitive**: collect
them sparingly, use them only for the stated purpose, and keep collaborators'
private contact details out of member-facing views (the schema separates
`contactPrivate` for exactly this reason).

## Security

- Environment is validated at boot (`src/lib/env.ts`); secrets live in `.env`
  (git-ignored). Set a strong `AUTH_SECRET` before enabling Release B accounts.
- Passwords (Release B) are stored hashed, never in plain text.
- Security headers (nosniff, frame options, referrer policy, restricted
  camera/mic, geolocation disabled) are set in `next.config.ts`.

## Instagram

The app **never** scrapes private Instagram pages or automates login/posting.
Analytics come only from what you manually enter, upload, or confirm, or from
approved APIs you choose to connect later.
