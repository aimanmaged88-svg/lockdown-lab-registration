# Halloween Shop Run — Pinterest seasonal play (2026)

Aiman's side business for the 2026 Halloween season: Pinterest shops riding the
aesthetics of this season's film releases, then turning over to Christmas.

`playbook.html` is the whole deliverable — a self-contained operational page
(movie calendar, five shop dossiers with copy-paste keyword/pin blocks, a dated
launch sprint checklist, the IP rules, the Christmas turn, unit economics).
Published as a private Artifact: <https://claude.ai/artifact/FGovE2zs9ucE7pGzqjBgGq>

Not wired into the Netlify site. This folder is notes + deliverable only, same
as `giveaway/` and `pokemon-trade/`.

## The three findings that shaped it

1. **No new Scream this season.** Scream 8 is tracking for 2027 (a Paramount
   horror slot sits on 16 Jul 2027). The parody *Scary Movie* already ran in
   2026 (~$231M) and Ghostface stays a top costume search — so Scream is an
   **affiliate** line, never a product line.
2. **The shipping cliff.** Started 18 Sep. Physical print-on-demand must be
   listed by ~10 Oct (customer order cutoff ~17 Oct) to land before the 31st.
   Digital (printables, party packs, cut files, wallpapers) has no cutoff and
   sells through Halloween night — so digital first, physical only if listed in
   the first fortnight. Printify/Printful publish exact cutoffs mid-October;
   the page says to check their fulfilment pages then.
3. **IP is the thing that ends shops.** You cannot sell a film's title,
   characters, masks, logos, taglines or artwork — "inspired by" in a listing
   title is still trademark use. Sell the *aesthetic* the film drives into
   search; affiliate the licensed goods (full URLs only — Pinterest blocks
   cloaked/shortened links, and FTC disclosure is required).

## The five shops (aesthetic, not title)

| # | Shop | Wave behind it | Date |
|---|------|----------------|------|
| 01 | The Owens House — kitchen-witch autumn | Practical Magic 2 | 11 Sep, cinemas |
| 02 | Prom Night, Red — 70s prom gone wrong | Carrie (Mike Flanagan, 8 eps) | 7 Oct, Prime Video |
| 03 | Haunted Carnival — Victorian sideshow | vintage Halloween ~200% YoY; Pan's Labyrinth 4K | season |
| 04 | Camp Final Girl — 80s summer camp | Crystal Lake (Friday the 13th prequel) | 15 Oct, Peacock |
| 05 | The Manuscript — dark academia thriller | Verity (Colleen Hoover) | 2 Oct, cinemas |

Deliberately skipped: Resident Evil (18 Sep — gaming/gore audience, wrong
platform), Clayface (23 Oct — comics crowd), Whalefall (16 Oct — no decor
language), Insidious: The Bleeding World (21 Aug).

## Key dates

- **Halloween 2026 is a Saturday** — parties run both 23–25 and 30–31 Oct.
- ~10 Oct: last safe day to list anything that ships.
- ~17 Oct: physical order cutoff; storefront goes digital-only.
- 20 Oct: Christmas catalogue live (Pinterest Christmas search ramps through
  October, peaks November).
- 1 Nov: flip all five boards to their Christmas turn. Gothic-Christmas films
  carry it: Ebenezer: A Christmas Carol (13 Nov), Violent Night 2 (4 Dec),
  Werwulf (25 Dec).

## Store decision

A true Pinterest shop (Shop tab, catalogue, shopping ads) needs a claimed
website with a product feed → Shopify/WooCommerce. Etsy can't feed a Pinterest
catalogue but lists digital goods in minutes and delivers them itself. **Call:
Etsy now + manual pinning for Halloween, Shopify catalogue for Christmas.**

## Maintaining the page

Edit `playbook.html` and republish to the SAME Artifact URL (pass it as `url`
from a new conversation, or republish the same file path in the original one) —
publishing without the URL creates a duplicate.

The sprint checklist persists via the Artifact `db` capability (doc
`progress/sprint`, `{done:{<id>:true}}`), with a localStorage fallback
(`hsr_done`) so it still works if db is unavailable. Declaring `db` makes the
artifact organisation-internal — it cannot be shared by public link.

Release dates were current at 18 Sep 2026 and move. Recheck before building a
listing on one.
