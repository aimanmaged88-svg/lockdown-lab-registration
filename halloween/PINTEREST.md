# Hollow Press on Pinterest — the whole setup

Everything here is built and waiting. Work down the list.

**One dependency first:** Pinterest has to be able to *fetch* your images and
pages. That means the shop must be publicly live. Right now it's on the
`claude/halloween-movie-merchandise-qpet2g` branch — merging to `main`
auto-deploys it to Netlify and every URL below starts working. Until then,
Pinterest will reject the feed and refuse to claim the site.

---

## 1. Account and profile

Create a **Pinterest Business account** (free) or convert your personal one.

| Field | Paste this |
|---|---|
| Display name | `Hollow Press \| Vintage Halloween Printables` |
| About | `Printable vintage Halloween decor, letterpress-style. Victorian sideshow posters, poison jar labels, party kits and gothic tablescapes — instant download, print at home, A4 and US Letter. All artwork original.` |
| Website | `https://certifiedhooper.netlify.app/halloween/` |

The display name is search-weighted, which is why it carries the keywords
rather than just the brand. Don't shorten it to "Hollow Press".

**Then claim the website.** Settings → Claimed accounts → Claim website. Paste
the URL, choose the **HTML tag** method, and Pinterest gives you a
`<meta name="p:domain_verify" content="…">` tag. Send me that tag and I'll add
it to `halloween/index.html` — or paste it yourself just under the `<title>`.

Claiming does three things you need: it attributes every pin from your site to
your profile, it unlocks analytics, and **the catalog in step 3 will not work
without it.**

---

## 2. The six boards

Create these exactly, and paste the description into each — board descriptions
are indexed, and most people leave them empty.

**Vintage Halloween Decor**
> Vintage Halloween decor ideas and printable wall art — Victorian sideshow posters, antique carnival ephemera, and a burgundy, plum and antique gold palette instead of orange and black. Printable, instant download, A4 and US Letter.

**Halloween Party Ideas**
> Halloween party ideas you can print at home the same night: invitations, pennant banners, photo-booth signs, table tents, drinks menus, tickets and favour tags. Vintage haunted carnival theme. Instant download printables.

**Witch Kitchen & Apothecary**
> Witch kitchen and apothecary decor — printable poison bottle labels, herb and potion jar labels with real botanical names, and gothic pantry styling. Print, cut and stick onto standard jars.

**Gothic Tablescapes & Dinner Parties**
> Gothic and Victorian tablescape ideas for Halloween dinner parties — printable place cards, menus, table numbers and seating plans. Dark academia table styling, instant download.

**Halloween Phone Wallpapers**
> Dark academia and vintage Halloween phone wallpapers — moody plum, oxblood and antique gold lock screens with the type set clear of your clock. iPhone and Android sizes.

**Printables to Print Tonight**
> Last-minute Halloween decor you can have on the wall within the hour. Instant-download printables — no postage, no shipping cut-off. A4 and US Letter included.

Set **Vintage Halloween Decor** as the featured board on your profile.

---

## 3. The catalog — this is what makes it a *shop*

Pins alone are just pictures. A **catalog** gives your profile a Shop tab,
turns your items into product pins with a price on them, and makes them
eligible for shopping ads.

The feed is already generated and sitting at:

```
https://certifiedhooper.netlify.app/halloween/feed/products.tsv
```

In Pinterest: **Ads → Catalogs → Get started → Add a data source**, paste that
URL, set the currency to **USD**, and schedule a daily fetch.

It carries all seven fields Pinterest requires — `id`, `title`, `description`,
`link`, `image_link`, `price`, `availability` — plus `condition`, `brand`,
`product_type`, `google_product_category`, `additional_image_link` and
`sale_price` (used on the bundle, so it shows $29 struck through from $51).

First fetch usually takes a few hours to process. Errors show per-row in the
Catalogs screen; if one appears, tell me the row and the message.

---

## 4. Rich Pins

Every product page carries `og:type=product`, `product:price:amount` and a
schema.org `Product` block with the offer. That's what Pinterest reads to put
a live price and an in-stock flag on the pin.

Validate one page here: **https://developers.pinterest.com/tools/url-debugger/**
— paste `https://certifiedhooper.netlify.app/halloween/p/sideshow.html`.
It needs to report a **Product** rich pin. Approval covers the whole domain,
so you only validate once.

---

## 5. The 17 pins

`PINTEREST-PINS.csv` has a row per pin: image file, title, description,
destination link, board, alt text. The images are in `pins/`, all 1000×1500.

Titles are front-loaded with the search term because Pinterest truncates them
in the feed. Descriptions run 150–300 characters with the keyword repeated
naturally and "instant download" in every one — that phrase is doing real work
this late in the season.

**Don't upload all 17 on day one.** Pinterest rewards steady fresh pins and
throttles bursts from new accounts. Spread them:

| When | Do |
|---|---|
| Day 1 | Profile, claim the site, six boards, **3 pins** |
| Day 2–6 | **3 pins a day** until all 17 are up |
| From then | 1–3 *new* pins a day — new image, same product, new title |

That last row is the important one. Pinterest treats a fresh image as fresh
content and a repeat of the same image as spam, so the way to keep growing is
new pin images for products you've already pinned — not re-pinning. When you
want more, add a pin entry to `build/catalog.js` and re-run
`node build/pinterest.mjs`; it renders the image and adds the CSV row.

---

## 6. What not to do

- **No film titles in a pin title, description or board name.** Not even
  "inspired by". Board descriptions and blog text are commentary and are a
  different matter; a pin that sells something is commerce, and that's where
  trademark use gets the pin — and eventually the account — pulled.
- **No shortened or cloaked links.** Pinterest flags bit.ly and redirect
  wrappers as spam and can block the account. Paste full URLs.
- **Affiliate pins need a disclosure** in the description ("affiliate link"),
  near the front, per Pinterest and FTC rules. None of the 17 pins here are
  affiliate — this is your own product — but the playbook's licensed-merch
  pins will be.

---

## 7. Where the numbers will show up

Pinterest analytics lag by a day or two, and a new account takes 2–6 weeks to
find its audience normally. You don't have 2–6 weeks — but you're not starting
from cold demand either, because Halloween search is at its annual peak right
now. Expect impressions within days and the first saves before clicks.

The signal worth watching in the first fortnight is **outbound clicks per pin**,
not impressions. Impressions tell you Pinterest is showing the pin; clicks tell
you the pin is worth showing. Whichever two or three pins get clicks, make five
more like them.
