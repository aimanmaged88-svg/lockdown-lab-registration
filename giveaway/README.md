# NOVA Rewards — Giveaway Platform

A working prototype of the giveaway / entry platform described in the project
brief. It lives here as a self-contained product (like the other products in
this repo — `athlete-os/`, `pokemon-trade/`, `restaurant/`) so the full
customer journey and admin workflow can be demonstrated end-to-end with no
setup.

## Why a prototype here, and not a WordPress site

The brief specifies **WordPress + WooCommerce**. That's the right production
stack — but WordPress is a PHP/MySQL application and **cannot run inside this
static, Netlify-hosted repo**. Rather than ship nothing runnable, this folder
implements every business rule from the brief as working software you can click
through today, using the same architecture the rest of this repo already uses
(static HTML front-ends + a small JS engine that stands in for the server).

Every rule in [`engine.js`](engine.js) — packages, multipliers, bonus entries,
membership allocations, coupons, affiliate attribution, manual adjustments — is
exactly the logic that would live server-side in production. The public API of
`engine.js` mirrors what a WooCommerce/Supabase backend would expose, so moving
from prototype to production is a matter of swapping the storage layer for real
HTTP calls, not rewriting the rules. See **Production path** below.

> **Prototype note:** data is stored in the browser's `localStorage` and the
> admin login is gated client-side. This is for demonstration only. In
> production, entry balances and admin auth **must** be enforced server-side so
> they can't be edited from the browser. `localStorage.clear()` (or the Reset
> option) restores the seeded demo data.

## Open it

| Page | What it is |
|------|------------|
| [`index.html`](index.html) | Storefront + mobile-first giveaway landing + package selection & checkout |
| [`account.html`](account.html) | Customer dashboard (entries, membership, orders) |
| [`admin.html`](admin.html) | Admin console — customers, entries, orders, coupons, affiliates, giveaways |
| [`affiliates.html`](affiliates.html) | Self-serve affiliate portal (register + track stats) |

**Demo logins**
- Customer dashboard: `john@example.com` or `mia@example.com`
- Admin console token: `nova-admin`

**Try the worked example from the brief:** on `index.html`, today's multiplier
is `30×`. Buy the **Starter ($20 / 15 entries)** package → **450 entries** are
credited automatically. Join membership → **250 permanent bonus entries** land
separately from the monthly allocation.

## Requirement coverage

| # | Requirement | Where it's implemented |
|---|-------------|------------------------|
| 1 | E-commerce platform, easy editing | Storefront in `index.html`; content-driven from `engine.js` config (packages, prices, promo). *Production: WordPress + WooCommerce + a page builder — see below.* |
| 2 | Membership / subscription ($20/mo, auto-renew, monthly entries, sign-up bonus) | `MEMBERSHIP` config + `purchase({membership:true})` in `engine.js`; join flow on `index.html`; status & cancel on `account.html`; managed in admin. |
| 3 | Entry database (name, email, phone, ID, status, package, all entry buckets, lifetime) | Admin **Customers & Entries** tab — every field in the brief is a column; per-customer drawer shows the full breakdown. |
| 4 | Global entry multipliers (2×/5×/10×/20×/30×/custom) | Multiplier control in the admin header; applied at purchase time in `quote()`/`purchase()`; shown live on the storefront. |
| 5 | Permanent bonus entries (separate from monthly) | `bonusEntries` bucket; membership sign-up bonus + coupon bonuses credit it and never reset with the monthly cycle. |
| 6 | Manual entry management (add/remove/membership/promo/comp + notes) | Customer drawer in admin → Adjust entries (bucket + reason), notes log, full audit ledger. |
| 7 | Coupon system (10× / bonus / % / $ / free shipping / member-only, expiry, usage limits, one-per-customer) | `evaluateCoupon()`/`redeemCoupon()`; admin **Coupons** tab to create/edit; applied at checkout. Try `PIKACHU10`, `WELCOME25`, `BONUS500`, `FREESHIP`. |
| 8 | Affiliate program (register, unique link, track clicks/sales/commission, payouts; admin approve/reject/adjust/export) | `affiliates.html` portal + admin **Affiliates** tab; `?ref=` capture on the storefront drives click/sale attribution. |
| 9 | Mobile-first giveaway landing (prize image, headline, countdown, promo banner, Enter Now → scroll to packages) | `index.html` `.draw` section — above the fold, live countdown, promo banner, "Enter Now" smooth-scrolls to `#packages`. |
| 10 | Package selection ($20/15, $50/45, $100/100, $200/250, membership; bonuses prominent) | `PACKAGES` config rendered on `index.html`, with the multiplier-adjusted total shown on each card. |
| 11 | Customer dashboard (membership, totals, bonus, monthly, orders, details, subscription) | `account.html`. |
| 12 | Orders & customer management (history, search, membership, payments, refunds, export) | Admin **Orders** tab (search + refund) and **Customers** tab (search, CSV export). |
| 13 | Giveaway administration (create/end/duplicate, prize image, countdown, banner, toggle multiplier) | Admin **Giveaways** tab — full campaign lifecycle; making a campaign live pushes its multiplier/banner to the storefront. |
| 14 | Positioned as a real business, giveaway as a promo benefit | `index.html` leads with the NOVA store (products, reviews, shipping); the draw is framed as a complimentary promotional benefit. |
| 15 | Fast, responsive, editable, SEO, secure, emails, scalable, reporting | Static + responsive + no heavy deps; meta tags; CSV exports. *Payments/emails/scale are production concerns — see below.* |
| 16 | Seamless CX + complete admin control | The four pages together deliver the customer journey and the admin control surface. |

## Data model (per customer)

Total entries are always the sum of four auditable buckets — this is what makes
multipliers, bonuses and manual tweaks explainable to a customer:

```
totalEntries = purchaseEntries   // package purchases × active multiplier
             + bonusEntries       // permanent: sign-up + coupon bonuses
             + membershipEntries  // recurring monthly allocation
             + manualEntries      // admin add/remove (promo, comp, correction)
```

Every change is written to a per-customer `ledger` so any balance can be traced
back to the order, coupon, membership renewal or admin note that caused it.

## Production path (recommended stack)

To ship the brief as specified, map this prototype onto WordPress:

- **WordPress + WooCommerce** — storefront, cart, secure checkout, orders.
- **Page builder** — Elementor (or the block editor) so non-technical staff edit
  images, headings, copy, deals and prize info without code (Req 1).
- **WooCommerce Subscriptions** — the $20/month membership, auto-renewal (Req 2).
- **Entries engine** — a small custom plugin holding the `engine.js` rules:
  packages→entries, the global multiplier, bonus/membership/manual buckets, and
  the customer entry table (Req 3–6). Hook `woocommerce_order_status_completed`
  to allocate entries automatically.
- **Coupons** — WooCommerce's native coupons for discounts/free-shipping, plus
  the custom plugin for entry-multiplier / bonus-entry coupon types (Req 7).
- **Affiliates** — AffiliateWP or SliceWP for links, tracking, commissions and
  payouts; admin approval and CSV export (Req 8).
- **Landing/admin UI** — the HTML here is a faithful design reference for the
  giveaway landing (Req 9), package grid (Req 10), customer dashboard (Req 11)
  and campaign admin (Req 13).
- **Ops** — a caching/CDN plugin + host for speed and promo-traffic scale;
  Stripe/PayPal for payments; transactional email (WooCommerce emails or a
  service) for confirmations (Req 15).

### Alternative: this repo's own stack

If a WordPress site isn't wanted, the same rules port cleanly to this repo's
existing pattern — a Supabase Postgres schema for customers/entries/orders/
coupons/affiliates and a Supabase edge function (like
`supabase/functions/aos-api/`) enforcing them server-side, with Stripe for
payments and Resend for emails (both already used elsewhere in this repo). The
HTML front-ends here would talk to that function instead of `localStorage`.
