# Hollow Press — Halloween printables shop (2026)

Aiman's Halloween-season side business. Two parts:

1. **`playbook.html`** — the strategy: what's releasing this season, the five
   Pinterest shop concepts, the launch sprint, the IP rules, the Christmas turn.
   Artifact: <https://claude.ai/artifact/FGovE2zs9ucE7pGzqjBgGq>
2. **The shop itself** — a real product line, a storefront and Pinterest pins,
   all built here. This is shop 03 from the playbook ("Haunted Carnival"),
   built out in full because it's the highest-trending concept
   (vintage Halloween ~200% YoY on Pinterest) and carries **zero IP risk** —
   every act, label, name and line is original to this shop.

Brand: **Hollow Press**, a fictional Victorian print house. Name is unregistered
— **trademark-check it before printing anything with it on** (it's set in one
place per file if you want to change it).

---

## ⚠️ The products are NOT in this repo, on purpose

This repo is **public** and auto-deploys to Netlify. Anything committed here is
a free download for anyone who guesses the URL. So `products/`, `dist/` and
`previews/` are git-ignored and the sellable files live **only** on whatever
platform takes the money and delivers them.

Regenerate them any time:

```bash
cd halloween/build
ln -sfn /opt/node22/lib/node_modules node_modules   # or: npm i playwright
node render.mjs          # 5 print products → ../products/*.pdf (A4 + US Letter)
node walls.mjs           # 24 wallpapers    → ../products/gaslight-wallpapers/
node shopimg.mjs         # storefront images → ../shop-img/
node pinterest.mjs       # landing pages + feed + pin CSV + 17 pin images
```

Run `walls.mjs` before `pinterest.mjs` — the wallpaper pins composite the real
wallpaper JPEGs, and those live in the git-ignored `products/` folder.

Then re-zip for upload (writes `dist/*.zip` with the licence file included) —
the packaging step is in the session notes; it's ~30 lines of `zipfile`.

What *is* committed: the build sources (`build/`), the fonts, the storefront,
the small shop images and the pins. Those are marketing, or they regenerate
everything else.

---

## The product line

| # | Product | Sheets | Price | File |
|---|---------|--------|-------|------|
| 1 | The Sideshow Set — 8 Victorian posters | 8 | $12 | `p1-sideshow.html` |
| 2 | Poison & Apothecary Labels — 30 labels | 2 | $7 | `p2-poison.html` |
| 3 | Haunted Carnival Party Pack | 8 | $14 | `p3-party.html` |
| 4 | Admit One — 40 tickets, tags, tokens | 3 | $5 | `p4-tickets.html` |
| 5 | The Mourning Table — dinner set for 16 | 6 | $9 | `p5-table.html` |
| 6 | Gaslight Wallpapers — 12 designs × 2 sizes | 24 files | $4 | `p6-wallpapers.html` |
| 7 | The Whole Vault — all of it | — | $29 | (bundle zip) |

27 printable pages + 24 wallpapers. Prices USD; AUD equivalents in `LISTINGS.md`.

---

## Design decisions worth keeping

- **Printables are ink-on-white line work, never flood-filled.** A customer
  prints these on a home printer. Solid dark backgrounds drain cartridges and
  streak, and it's also what a real letterpress broadside looked like. The
  banner pennants were rebuilt from filled triangles to outlines for exactly
  this reason. The wallpapers are the one dark product — they only touch a screen.
- **No `clip-path` in print artwork.** Chromium's print-to-PDF rasterises it,
  which makes cut edges print soft — and it bloated the tickets PDF from 182KB
  to 1067KB. Shaped artwork (tags, pennants) is inline SVG with
  `vector-effect="non-scaling-stroke"`, so it stays vector at any scale.
- **Everything inside a 12mm safe margin.** Home printers can't full-bleed.
- **Ornaments are SVG backgrounds, not glyphs.** `❧`/`❦` aren't in IM Fell, so
  they fell back to something ugly. Fixed in `brand.css`.
- **Fold-over items print in two halves, the top rotated 180°.** Place cards,
  table numbers and table tents all read from both sides and no type ever
  straddles the crease. (The table tents shipped broken first — text sat
  directly on the fold.)
- **Storefront previews are 560px wide** — fine on screen, far too soft to
  print. A preview should never be usable as the product.

## Fonts

`assets/fonts/` — Rye, Alfa Slab One, IM Fell English (roman + italic), IM Fell
English SC, Cinzel (variable 400–700), Special Elite, Pirata One. All OFL /
Apache, all cleared for commercial print use, latin subsets, 280KB total.

Pulled from the Google Fonts CSS2 API — note it returns **multiple unicode
subsets per weight** and some families are variable (one file covers the whole
range), so pick the block whose `unicode-range` contains `U+0000-00FF` per
weight/style or you end up with latin-ext files named as weights.

---

## The storefront

`index.html` — deploys with the repo, reachable at `/halloween/`.

**To make it sell, paste checkout links.** One `CHECKOUT` object near the bottom
of the file, one URL per product. Until they're filled in, the buttons are
disabled and a yellow setup banner explains what to do; the banner removes
itself once every link is set.

Those links should come from a platform that takes the money **and** delivers
the file — Payhip, Gumroad, Lemon Squeezy or Etsy — so card details, file
delivery and GST/VAT are never handled here.

**Store recommendation** (from the playbook): Etsy first for its own search
traffic, own storefront alongside it for margin, Shopify + a real Pinterest
catalogue later for Christmas. Etsy cannot feed a Pinterest catalogue; Shopify
can.

**Domain:** it currently sits under the Certified Hooper Netlify site, which is
an odd neighbour for a Halloween brand. Fine for launch; a cheap dedicated
domain (or its own Netlify site pointed at this folder) is tidier.

---

## The Pinterest side

`PINTEREST.md` is the runbook — profile copy, the six boards with descriptions,
how to register the catalog, how to validate Rich Pins, and the posting cadence.

Three things make this a Pinterest *shop* rather than a pile of pictures:

1. **`feed/products.tsv`** — the product catalogue feed. Registering it in
   Pinterest (Ads → Catalogs) gives the profile a Shop tab and puts a live
   price on every product pin. Carries all seven required fields plus brand,
   product_type, google_product_category, additional_image_link and sale_price.
2. **`p/<key>.html`** — a landing page per product, carrying `og:type=product`,
   `product:price:amount` and a schema.org `Product` block. That's what
   Pinterest reads for Rich Pins, and it's where the feed's `link` points.
3. **`PINTEREST-PINS.csv`** — a row per pin: image, title, description,
   destination, board, alt text. 17 pins across the six boards.

All three are generated from **`build/catalog.js`**, which is the single source
of truth. Add a pin entry or change a price there and run:

```bash
node build/pinterest.mjs           # pages + feed + CSV + pin images
node build/pinterest.mjs --no-img  # skip re-rendering images
```

`SITE` at the top of `catalog.js` is the only place the domain is written — the
whole feed re-points if the shop moves.

**Pinterest must be able to fetch the URLs**, so the shop has to be publicly
deployed before the feed or Rich Pins will validate. Merging to `main`
auto-deploys it.

Two verification scripts worth re-running after any pin change:
`build/tonecheck.mjs` samples each pin's background and confirms the light/dark
treatment matches the catalog; `build/lptest.mjs` checks a landing page's OG
tags, JSON-LD and images.

## Files

```
halloween/
  playbook.html        the strategy page (also a published artifact)
  index.html           the storefront — paste checkout links here
  LISTINGS.md          titles, 13 Etsy tags, descriptions, pin copy per product
  assets/fonts/        7 OFL/Apache faces
  shop-img/            small storefront previews (committed)
  pins/                12 finished 1000×1500 Pinterest pins (committed)
  PINTEREST.md         the Pinterest runbook — do this, in this order
  PINTEREST-PINS.csv   per-pin title / description / link / board / alt
  p/                   a landing page per product (Rich Pin markup)
  feed/products.tsv    the Pinterest product catalogue feed
  build/
    catalog.js         SINGLE SOURCE OF TRUTH — products, pins, boards, profile
    pinterest.mjs      -> p/*.html + feed/products.tsv + the CSV + pin images
    tonecheck.mjs      confirms each pin's light/dark ground matches the catalog
    lptest.mjs         checks a landing page's OG tags, JSON-LD and images
    brand.css          shared print brand: tokens, type roles, rules, ornaments
    p1…p6*.html        the products; repetitive content is generated in JS
    render.mjs         products → A4 + US Letter PDFs + preview PNGs
    walls.mjs          wallpapers → JPEGs at two phone sizes
    shopimg.mjs        storefront images
    pins.html          pin layouts; exposes window.renderPin(data) because
                       file:// blocks ES module imports, so the generator
                       injects the catalogue rather than the page importing it
    sheet.mjs          contact sheet of any product, for reviewing a whole pack
    overflow.mjs       checks every sheet for content escaping the page
  products/ dist/ previews/    GIT-IGNORED — the sellable files
```

Run `node build/overflow.mjs` after editing any product — it catches content
running off a sheet, which is invisible until someone prints it.
