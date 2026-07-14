# Lockdown Lab — Backend

The site is a static page (`index.html`) deployed on Netlify, backed by a
Supabase project (`lockdown-lab`, ref `ymuwuhvqqftgpxwhzoub`). No build step.

## Registration capture
- **Table:** `public.registrations` — one row per founding sign-up (all wizard
  fields + `status`, `created_at`, `source`).
- **RLS:** the public site can **INSERT only** (policy `public can submit a
  registration`). There are no SELECT/UPDATE/DELETE policies for `anon`, so the
  public key **cannot read** anyone's data. Admin reads happen server-side only.
- The wizard (`index.html`) POSTs to `…/rest/v1/registrations` with the
  **publishable** key (safe to expose; RLS does the protecting).

## Live seat counter
- `public.registration_count()` — `SECURITY DEFINER` function returning **only an
  integer** (no personal data). Callable by `anon` by design.
- The hero fetches it via `…/rest/v1/rpc/registration_count` to show real
  "early sign-ups" and "founding seats left" (`FOUNDING_CAP` constant in
  `index.html`, currently **30** — change to taste).

## Admin dashboard (`admin.html`)
- Served at **`/admin.html`**. Token-gated; the token is entered by the admin
  and stored only in `sessionStorage`.
- Reads/updates go through the **`admin`** edge function, which uses the
  **service-role key server-side** (never in the browser) to bypass RLS. Auth is
  a shared admin token checked inside the function (`x-admin-token`).
- Features: KPIs, search, status filter, per-row status update, CSV export.

## Confirmation email
- **`send-confirmation`** edge function → sends the founding-member welcome email
  via [Resend](https://resend.com).
- Fired automatically by an `AFTER INSERT` trigger on `registrations`
  (`on_registration_created` → `pg_net` async HTTP call → the edge function).
  Non-blocking: a failed email never fails a registration.
- **Gracefully no-ops until configured.** To turn emails on:
  1. Create a Resend account and an API key.
  2. Verify a sending domain in Resend (needed to send from your own address).
  3. In Supabase → Edge Functions → set secrets:
     - `RESEND_API_KEY` = your key
     - `RESEND_FROM` = e.g. `Lockdown Lab <hello@yourdomain.com>`
  Emails start sending on the next registration. No code change needed.

## Secrets (set in Supabase, not committed here)
- `admin` function: `ADMIN_TOKEN` (falls back to a built-in token if unset).
- `send-confirmation` function: `HOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`.
- Service-role key is auto-injected by Supabase; never place it in client code.

## Not yet built
- Payments (Stripe), player/parent dashboards, auth, gamification persistence.
