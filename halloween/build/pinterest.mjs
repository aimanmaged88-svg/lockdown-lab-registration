/* ===========================================================================
   Builds everything Pinterest needs, from build/catalog.js:

     ../p/<key>.html            a landing page per product (Rich Pin markup:
                                OG product tags + schema.org JSON-LD)
     ../feed/products.tsv       the product catalogue feed — this is what turns
                                the profile into a Pinterest SHOP with a Shop
                                tab and priced product pins
     ../pins/<file>.jpg         one pin image per pin defined in the catalogue
     ../PINTEREST-PINS.csv      per-pin title, description, link, board, alt

   usage: node pinterest.mjs           everything
          node pinterest.mjs --no-img  skip re-rendering the pin images
   =========================================================================== */
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs/promises";
import { CATALOG, BOARDS, PROFILE, SITE, BRAND, CURRENCY, CHECKOUT } from "./catalog.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const skipImg = process.argv.includes("--no-img");

const slug = s => s.replace(/<br>/g, " ").replace(/&amp;/g, "and")
  .toLowerCase().replace(/[^a-z0-9 ]/g, "").trim().replace(/\s+/g, "-");

/* every pin, flattened, with the filename it renders to */
const PINS = CATALOG.flatMap(p =>
  p.pins.map((pin, i) => ({
    ...pin,
    product: p,
    n: i + 1,
    file: `${p.key}-${i + 1}_${slug(pin.h)}.jpg`,
  })));

/* a product's lead pin image — derived, so it can never drift from the
   files the renderer actually writes */
const heroFile = p => `${p.key}-1_${slug(p.pins[0].h)}.jpg`;

/* the destination a pin and a feed row point at */
const dest = p => CHECKOUT[p.key] || `${SITE}/p/${p.key}.html`;

/* --------------------------------------------------------------- landing pages */
const esc = s => String(s).replace(/&(?!amp;|lt;|gt;|quot;|#)/g, "&amp;");

function landingPage(p) {
  const url = `${SITE}/p/${p.key}.html`;
  const img = `${SITE}/pins/${heroFile(p)}`;
  const plain = p.blurb.replace(/&amp;/g, "&").replace(/"/g, "&quot;");
  const buy = CHECKOUT[p.key];
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title.replace(/&amp;/g, "&"),
    description: p.blurb.replace(/&amp;/g, "&"),
    sku: p.sku,
    brand: { "@type": "Brand", name: BRAND },
    image: [img, ...(p.shot ? [`${SITE}/shop-img/${p.shot}`] : [])],
    offers: {
      "@type": "Offer",
      url,
      price: p.price,
      priceCurrency: CURRENCY,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(p.title)} — ${BRAND}</title>
<meta name="description" content="${plain}">

<!-- Pinterest Rich Pins read these -->
<meta property="og:type" content="product">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${plain}">
<meta property="og:image" content="${img}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="${BRAND}">
<meta property="product:price:amount" content="${p.price}">
<meta property="product:price:currency" content="${CURRENCY}">
<meta property="product:availability" content="in stock">
<meta property="product:brand" content="${BRAND}">
<meta name="theme-color" content="#120A10">
<link rel="canonical" href="${url}">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>

<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%23120A10'/><path d='M16 6l8 10-8 10-8-10z' fill='%23E8C27A'/></svg>">
<style>
  @font-face{font-family:"HPShow";   src:url("../assets/fonts/rye-400.woff2") format("woff2");          font-display:swap}
  @font-face{font-family:"HPSlab";   src:url("../assets/fonts/alfaslab-400.woff2") format("woff2");     font-display:swap}
  @font-face{font-family:"HPText";   src:url("../assets/fonts/imfell-400.woff2") format("woff2");       font-style:normal; font-display:swap}
  @font-face{font-family:"HPText";   src:url("../assets/fonts/imfell-400i.woff2") format("woff2");      font-style:italic; font-display:swap}
  @font-face{font-family:"HPCaps";   src:url("../assets/fonts/imfellsc-400.woff2") format("woff2");     font-display:swap}
  @font-face{font-family:"HPEngrave";src:url("../assets/fonts/cinzel-400.woff2") format("woff2");       font-weight:400 700; font-display:swap}
  @font-face{font-family:"HPType";   src:url("../assets/fonts/specialelite-400.woff2") format("woff2"); font-display:swap}
  :root{--bg:#120A10;--card:#1E1119;--line:#3A2430;--bone:#F0E4CA;--dim:#B6A28F;
        --faint:#8A7A6D;--gold:#E8C27A;--ox:#C0424E;
        --disp:"HPSlab",Georgia,serif;--show:"HPShow",Georgia,serif;
        --text:"HPText",Georgia,serif;--caps:"HPCaps",Georgia,serif;
        --eng:"HPEngrave",Georgia,serif;--tw:"HPType",ui-monospace,monospace}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--bone);font-family:var(--text);
    font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased;
    background-image:radial-gradient(120% 55% at 50% -8%,rgba(232,194,122,.10),rgba(0,0,0,0) 62%)}
  img{max-width:100%;display:block}
  a{color:var(--gold)}
  .wrap{max-width:1000px;margin:0 auto;padding-inline:18px}
  header{border-bottom:1px solid var(--line);padding-block:15px}
  .mark{display:flex;align-items:center;gap:11px;text-decoration:none;color:var(--bone)}
  .mark .dia{width:16px;height:16px;background:var(--gold);
    clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
  .mark .nm{font-family:var(--eng);font-weight:700;font-size:18px;
    letter-spacing:.2em;text-transform:uppercase}
  .crumb{font-family:var(--caps);text-transform:uppercase;letter-spacing:.22em;
    font-size:11px;color:var(--faint);padding-block:22px 0}
  .crumb a{color:var(--faint);text-decoration:none}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:40px;padding-block:22px 54px;
    align-items:start}
  @media(max-width:780px){.cols{grid-template-columns:1fr;gap:26px}}
  .hero img{border:1px solid var(--line)}
  h1{font-family:var(--disp);font-size:clamp(1.7rem,4.2vw,2.5rem);line-height:1.08;
     margin:0;text-wrap:balance}
  .cnt{font-family:var(--caps);text-transform:uppercase;letter-spacing:.2em;
    font-size:11.5px;color:var(--gold);margin-top:10px}
  .blurb{color:var(--dim);margin:16px 0 0}
  ul{margin:18px 0 0;padding-left:18px;color:var(--dim);font-size:.96rem}
  li{margin-bottom:5px}
  .buy{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:26px;
    padding-top:22px;border-top:1px solid var(--line)}
  .price{font-family:var(--eng);font-weight:700;font-size:2rem;letter-spacing:.03em}
  .was{color:var(--faint);text-decoration:line-through;font-family:var(--tw);
    font-size:15px;margin-left:8px}
  .btn{font-family:var(--caps);text-transform:uppercase;letter-spacing:.2em;font-size:12px;
    background:var(--gold);color:#1A1418;border:1px solid var(--gold);padding:13px 24px;
    text-decoration:none;display:inline-block}
  .btn[aria-disabled="true"]{background:transparent;color:var(--faint);
    border-color:var(--line);cursor:not-allowed}
  .note{font-family:var(--tw);font-size:12.5px;letter-spacing:.06em;color:var(--faint);
    text-transform:uppercase;margin-top:14px}
  .facts{border-top:1px solid var(--line);padding-block:30px}
  .facts h2{font-family:var(--disp);font-size:1.2rem;margin:0 0 12px}
  .facts p{color:var(--dim);font-size:.96rem;margin:0 0 10px;max-width:70ch}
  .thumbs{display:flex;gap:12px;margin-top:14px;flex-wrap:wrap}
  .thumbs img{width:128px;border:1px solid var(--line)}
  footer{border-top:1px solid var(--line);padding-block:28px 40px;color:var(--faint);
    font-size:.86rem;text-align:center}
</style>
</head>
<body>
<header><div class="wrap"><a class="mark" href="../index.html">
  <span class="dia"></span><span class="nm">${BRAND}</span></a></div></header>

<div class="wrap">
  <div class="crumb"><a href="../index.html">The Sheets</a> &nbsp;/&nbsp; ${esc(p.title.split("—")[0].trim())}</div>
  <div class="cols">
    <div class="hero">
      <img src="../pins/${heroFile(p)}" alt="${esc(p.title)}" width="1000" height="1500">
    </div>
    <div>
      <h1>${esc(p.title)}</h1>
      <div class="cnt">${p.sheets} &middot; instant download</div>
      <p class="blurb">${p.blurb}</p>
      <ul>${p.bullets.map(b => `<li>${b}</li>`).join("")}</ul>
      <div class="buy">
        <span class="price">$${p.price.replace(/\.00$/, "")}${p.was ? `<span class="was">$${p.was.replace(/\.00$/, "")}</span>` : ""}</span>
        ${buy ? `<a class="btn" href="${buy}" rel="noopener">Get it</a>`
              : `<a class="btn" href="#" aria-disabled="true"
                   onclick="event.preventDefault()">Get it</a>`}
      </div>
      <div class="note">${buy ? "Files arrive the moment you pay" : "Checkout link not set yet"}</div>
    </div>
  </div>

  <div class="facts">
    <h2>What turns up</h2>
    <p>A zip holding two PDFs &mdash; one A4, one US&nbsp;Letter &mdash; and a short printing
       and licence note. Nothing is posted, so there is no shipping cut-off to miss.</p>
    <h2 style="margin-top:22px">Printing</h2>
    <p>Print at 100% / &ldquo;actual size&rdquo;, never &ldquo;fit to page&rdquo; &mdash; that shrinks the
       sheet and throws the cut lines out. Everything sits inside a 12mm safe margin, so a
       normal home printer will not clip it. Card stock suits labels, tags and place cards;
       plain paper is fine for posters. Solid heavy lines are cuts, dashed lines are guides,
       dotted lines are folds.</p>
    <h2 style="margin-top:22px">Licence</h2>
    <p>Print as often as you like for yourself, your home, your party or your classroom.
       Please don't resell the files, share them, or sell printed copies.</p>
    ${p.extraShots.length ? `<h2 style="margin-top:22px">A closer look</h2>
    <div class="thumbs">${p.extraShots.map(s =>
      `<img src="../shop-img/${s}" alt="Detail from ${esc(p.title)}" loading="lazy">`).join("")}</div>` : ""}
    <p style="margin-top:22px">All artwork original. Nothing here is from any film, book or
       franchise.</p>
  </div>
</div>

<footer><div class="wrap">${BRAND} &middot;
  <a href="../index.html">see the whole shop</a></div></footer>
</body>
</html>`;
}

/* ------------------------------------------------------------------- the feed */
function feed() {
  const cols = ["id", "title", "description", "link", "image_link", "price",
    "availability", "condition", "brand", "product_type",
    "google_product_category", "additional_image_link", "sale_price"];
  const rows = CATALOG.map(p => {
    const clean = s => String(s).replace(/&amp;/g, "&").replace(/\s+/g, " ")
      .replace(/[\t\r\n]/g, " ").trim();
    return {
      id: p.sku,
      title: clean(p.title),
      /* a feed description is plain text — no HTML, no tabs */
      description: clean(`${p.blurb} ${p.bullets.join(". ")}. Instant download, A4 and US Letter included.`),
      link: dest(p),
      image_link: `${SITE}/pins/${heroFile(p)}`,
      price: `${p.was || p.price} ${CURRENCY}`,
      availability: "in stock",
      condition: "new",
      brand: BRAND,
      product_type: p.ptype,
      google_product_category: p.gcat,
      additional_image_link: p.extraShots.map(s => `${SITE}/shop-img/${s}`).join(","),
      /* price carries the RRP, sale_price the actual — only when discounted */
      sale_price: p.was ? `${p.price} ${CURRENCY}` : "",
    };
  });
  return [cols.join("\t"), ...rows.map(r => cols.map(c => r[c]).join("\t"))].join("\n") + "\n";
}

/* -------------------------------------------------------------- the pin sheet */
function pinCsv() {
  const q = s => `"${String(s).replace(/&amp;/g, "&").replace(/"/g, '""')}"`;
  const head = ["Image file", "Title", "Description", "Destination link", "Board", "Alt text"];
  const rows = PINS.map(p => [
    q(`pins/${p.file}`),
    q(p.pinTitle),
    q(p.pinDesc),
    q(dest(p.product)),
    q(p.board || p.product.board),
    q(`${p.pinTitle} — printable, instant download`),
  ].join(","));
  return [head.join(","), ...rows].join("\n") + "\n";
}

/* ------------------------------------------------------------------ pin images */
async function renderPins() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1500 } });
  await page.goto("file://" + path.join(HERE, "pins.html"), { waitUntil: "load" });
  await page.waitForFunction(() => typeof window.renderPin === "function");

  for (const p of PINS) {
    const data = {
      t: p.t, face: p.face || "", ox: !!p.ox, eyebrow: p.eyebrow, h: p.h,
      kick: p.kick, ribbon: p.ribbon,
      price: `$${p.product.price.replace(/\.00$/, "")}`,
      note: p.product.sheets,
      hero: p.product.shot ? `../shop-img/${p.product.shot}` : null,
      extra: p.product.extraShots[0] ? `../shop-img/${p.product.extraShots[0]}` : null,
      artMode: p.product.key === "wallpapers" ? "phones"
             : p.n === 1 && p.product.extraShots[0] ? "stack"
             : p.n === 3 && p.product.extraShots[0] ? "oneExtra"
             : "one",
    };
    await page.evaluate(d => window.renderPin(d), data);
    await page.waitForTimeout(260);
    await page.screenshot({ path: path.join(ROOT, "pins", p.file), type: "jpeg", quality: 92 });
  }
  await browser.close();
}

/* ------------------------------------------------------------------------ main */
await fs.mkdir(path.join(ROOT, "p"), { recursive: true });
await fs.mkdir(path.join(ROOT, "feed"), { recursive: true });
await fs.mkdir(path.join(ROOT, "pins"), { recursive: true });

for (const p of CATALOG) {
  await fs.writeFile(path.join(ROOT, "p", `${p.key}.html`), landingPage(p));
}
await fs.writeFile(path.join(ROOT, "feed", "products.tsv"), feed());
await fs.writeFile(path.join(ROOT, "PINTEREST-PINS.csv"), pinCsv());

if (!skipImg) await renderPins();

console.log(`landing pages : ${CATALOG.length}  -> p/*.html`);
console.log(`feed rows     : ${CATALOG.length}  -> feed/products.tsv`);
console.log(`pins          : ${PINS.length}${skipImg ? " (images skipped)" : ""}  -> pins/*.jpg`);
console.log(`boards        : ${BOARDS.length}`);
console.log(`profile name  : ${PROFILE.displayName}`);
