/* ===========================================================================
   HOLLOW PRESS — single source of truth for the catalogue.
   Feeds: the Pinterest product feed, the per-product landing pages, and the
   pin metadata sheet. Edit here, re-run `node build/pinterest.mjs`.
   ---------------------------------------------------------------------------
   SITE is where the shop is published. It is baked into every URL in the
   Pinterest feed, so if the shop moves to its own domain, change it here and
   re-run — nothing else needs touching.
   =========================================================================== */

export const SITE = "https://certifiedhooper.netlify.app/halloween";
export const BRAND = "Hollow Press";
export const CURRENCY = "USD";

/* Where each product's checkout lives. Same links you paste into
   index.html's CHECKOUT block — leave blank and the feed points at the
   product's own landing page instead, which is still a valid destination. */
export const CHECKOUT = {
  sideshow: "", poison: "", party: "", tickets: "", table: "", wallpapers: "", vault: "",
};

export const CATALOG = [
  {
    key: "sideshow",
    sku: "HP-001",
    title: "The Sideshow Set — 8 Vintage Halloween Posters",
    price: "12.00",
    was: null,
    sheets: "8 sheets",
    shot: "the-sideshow-set.jpg",
    extraShots: ["poster-vesper.jpg"],
    gcat: "Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork",
    ptype: "Printables > Wall Art > Halloween",
    board: "Vintage Halloween Decor",
    /* short line for the card + the feed's first sentence */
    blurb: "Eight Victorian sideshow bills — the Hollow Man, Madame Vesper, the Hall of Mirrors, the Last Carousel. Full pages of proper playbill typography.",
    bullets: [
      "8 different posters across 5 layouts",
      "A4 and US Letter, both included",
      "Prints on plain paper — line work, no flood fills",
    ],
    /* pin headlines: one pin image per entry, so three pins per product */
    pins: [
      { h: "8 SIDESHOW<br>POSTERS", t: "lt", face: "",
        eyebrow: "Vintage Halloween", ribbon: "A4 + US Letter",
        kick: "Victorian carnival broadsides. Print at home, frame tonight.",
        pinTitle: "8 Printable Vintage Halloween Posters (Victorian Sideshow)",
        pinDesc: "Turn your walls into a Victorian sideshow. Eight printable carnival broadsides in burgundy and ink — the Hollow Man, Madame Vesper, the Hall of Mirrors. Print at home tonight, frame them by morning. A4 and US Letter both included. Instant download." },
      { h: "He Casts<br>No Shadow", t: "dk", face: "show",
        eyebrow: "For One Night Only", ribbon: "new",
        kick: "A set of eight sideshow bills for your Halloween walls.",
        pinTitle: "Victorian Sideshow Poster Set — Gothic Halloween Wall Art",
        pinDesc: "Vintage Halloween wall art that isn't orange plastic. Eight sideshow posters set like real 19th-century playbills, in burgundy, plum and ink. Instant download, print at home, A4 + US Letter." },
      { h: "A QUIETER<br>HALLOWEEN", t: "dk", face: "", ox: true,
        eyebrow: "No Orange, No Plastic", ribbon: "vintage",
        kick: "Burgundy, plum and antique gold. Letterpress, not clip art.",
        pinTitle: "Vintage Halloween Decor Printables — Burgundy & Antique Gold",
        pinDesc: "A quieter Halloween: burgundy, plum and antique gold instead of orange and black. Letterpress-style printable posters you print at home. Instant download." },
    ],
  },

  {
    key: "poison",
    sku: "HP-002",
    title: "Poison & Apothecary Labels — 30 Printable Jar Labels",
    price: "7.00",
    was: null,
    sheets: "2 sheets, 30 labels",
    shot: "poison-apothecary-labels.jpg",
    extraShots: ["labels-sheet-2.jpg"],
    gcat: "Home & Garden > Decor",
    ptype: "Printables > Labels > Halloween",
    board: "Witch Kitchen & Apothecary",
    blurb: "Thirty jar labels in three alternating treatments. Real botanicals, real Latin names, and dosing notes that are none of your business.",
    bullets: [
      "Belladonna, hemlock, wolfsbane, mandrake, henbane…",
      "Fits standard jam, spice and preserve jars",
      "Cut guides on every label",
    ],
    pins: [
      { h: "30 POISON<br>JAR LABELS", t: "lt", face: "",
        eyebrow: "Apothecary", ribbon: "30 labels",
        kick: "Real botanicals, real Latin, properly ominous dosing notes.",
        pinTitle: "30 Printable Poison Bottle Labels — Vintage Apothecary Jars",
        pinDesc: "Thirty printable apothecary labels for the shelf you don't let guests near. Real botanicals with real Latin names and dosing notes that are none of your business. Fits standard jars. Instant download, A4 + US Letter." },
      { h: "BELLADONNA<br>HEMLOCK<br>WOLFSBANE", t: "dk", face: "eng",
        eyebrow: "Handle With Gloves", ribbon: "labels",
        kick: "Turn any jar into something from the poison cabinet.",
        pinTitle: "Witch Kitchen Jar Labels Printable — Poison Apothecary Set",
        pinDesc: "Turn any jar into something out of the poison cabinet. Thirty vintage apothecary labels — belladonna, hemlock, wolfsbane, mandrake root. Print, cut, stick. Instant download." },
      { h: "TWO DROPS.<br>NO MORE.", t: "dk", face: "", ox: true,
        eyebrow: "Dosing Notes Included", ribbon: "print & cut",
        kick: "Three label treatments, so a shelf of jars has rhythm.",
        pinTitle: "Halloween Potion Labels Printable — Gothic Apothecary Decor",
        pinDesc: "Gothic apothecary labels with the detail most printables skip: real Latin binomials and proper dosing notes. Three alternating designs across thirty labels. Instant download." },
    ],
  },

  {
    key: "party",
    sku: "HP-003",
    title: "Haunted Carnival Party Pack — Printable Halloween Party Kit",
    price: "14.00",
    was: null,
    sheets: "8 sheets",
    shot: "haunted-carnival-party-pack.jpg",
    extraShots: ["party-pennants.jpg", "party-menu.jpg"],
    gcat: "Home & Garden > Decor",
    ptype: "Printables > Party > Halloween",
    board: "Halloween Party Ideas",
    blurb: "One download and the room is done: invitations, a banner that spells HAUNTED CARNIVAL, photo-booth signs, table tents and a drinks menu.",
    bullets: [
      "Invitations, 2 per sheet, with lines to fill in",
      "18 banner pennants — outlined, not ink-flooded",
      "4 photo-booth signs, 4 table tents and a full drinks menu",
    ],
    pins: [
      { h: "HAUNTED<br>CARNIVAL<br>PARTY KIT", t: "dk", face: "",
        eyebrow: "Throw The Whole Thing", ribbon: "best value",
        kick: "Invitations, banner, photo-booth signs, table tents, drinks menu.",
        pinTitle: "Printable Halloween Party Kit — Vintage Haunted Carnival Decor",
        pinDesc: "A whole Halloween party in one file: invitations, a banner that spells HAUNTED CARNIVAL, four photo-booth signs, table tents and a drinks menu with seven cocktails already written. Print tonight, host tomorrow. Instant download." },
      { h: "A PARTY IN<br>ONE FILE", t: "lt", face: "",
        board: "Printables to Print Tonight",
        eyebrow: "Print Tonight, Host Tomorrow", ribbon: "A4 + US Letter",
        kick: "Everything the room needs, in one download. No posting, no waiting.",
        pinTitle: "Halloween Party Decorations Printable — Invitation, Banner, Signs",
        pinDesc: "Everything the room needs in one download — and nothing to post, so there's no shipping cut-off to miss. Invitations, banner, photo-booth signs, table tents, menu. Instant download, A4 + US Letter." },
      { h: "STEP<br>RIGHT UP", t: "dk", face: "show", ox: true,
        eyebrow: "The Barker", ribbon: "party pack",
        kick: "Eight sheets of vintage carnival party decor.",
        pinTitle: "Vintage Circus Halloween Party Printables — Banner & Signs",
        pinDesc: "Step right up. Eight sheets of vintage carnival party decor — pennant banner, photo-booth signs, table tents, invitations and a drinks menu. Instant download." },
    ],
  },

  {
    key: "tickets",
    sku: "HP-004",
    title: "Admit One — 40 Printable Tickets, Tags & Tokens",
    price: "5.00",
    was: null,
    sheets: "3 sheets, 40 pieces",
    shot: "admit-one-tickets-and-tags.jpg",
    extraShots: ["gift-tags.jpg"],
    gcat: "Home & Garden > Decor",
    ptype: "Printables > Party > Favours",
    board: "Halloween Party Ideas",
    blurb: "Twelve tear-off admission stubs with numbered spines, twelve gift tags and sixteen ride tokens. The small things that make a party look planned.",
    bullets: [
      "Numbered stubs with a torn spine",
      "Punch-hole gift tags with a line for a name",
      "16 drink and ride tokens",
    ],
    pins: [
      { h: "40 TICKETS,<br>TAGS &amp;<br>TOKENS", t: "lt", face: "",
        eyebrow: "Admit One", ribbon: "40 pieces",
        kick: "Tear-off stubs, gift tags and ride tokens for the whole night.",
        pinTitle: "Printable Vintage Carnival Tickets — 40 Tags, Stubs & Tokens",
        pinDesc: "Forty printable pieces: twelve numbered admission stubs with tear-off spines, twelve punch-hole gift tags and sixteen ride tokens. The detail that makes a party look planned. Instant download." },
      { h: "ADMIT<br>ONE", t: "dk", face: "",
        eyebrow: "Keep This", ribbon: "tickets",
        kick: "Twelve numbered stubs, each for a different attraction.",
        pinTitle: "Admit One Ticket Printable — Vintage Halloween Party Favors",
        pinDesc: "Vintage admit-one tickets you print at home — numbered, with a proper tear-off spine. Twelve stubs, twelve gift tags, sixteen tokens. Instant download." },
    ],
  },

  {
    key: "table",
    sku: "HP-005",
    title: "The Mourning Table — Halloween Dinner Party Printables",
    price: "9.00",
    was: null,
    sheets: "6 sheets, seats 16",
    shot: "the-mourning-table.jpg",
    extraShots: ["party-menu.jpg"],
    gcat: "Home & Garden > Kitchen & Dining > Tableware",
    ptype: "Printables > Party > Tablescape",
    board: "Gothic Tablescapes & Dinner Parties",
    blurb: "A dinner service for the last night of October: sixteen fold-over place cards, a six-course menu, table numbers I–XII and a seating plan for the door.",
    bullets: [
      "Place cards read from both sides when folded",
      "Six-course menu, printable as it comes",
      "Table numbers I to XII, plus a seating plan",
    ],
    pins: [
      { h: "THE<br>MOURNING<br>TABLE", t: "dk", face: "eng",
        eyebrow: "Six Courses, One Empty Chair", ribbon: "new",
        kick: "Place cards, menu, table numbers and a seating plan.",
        pinTitle: "Halloween Dinner Party Printables — Place Cards, Menu, Table Numbers",
        pinDesc: "Set a Halloween table properly. Sixteen fold-over place cards, a six-course menu, table numbers I–XII and a seating plan for the door. Gothic, quiet, and not a plastic spider in sight. Instant download." },
      { h: "SIX COURSES<br>ONE EMPTY<br>CHAIR", t: "lt", face: "",
        eyebrow: "All Hallows' Eve, Eight O'Clock", ribbon: "seats 16",
        kick: "A dinner service for the last night of October.",
        pinTitle: "Gothic Tablescape Printables — Victorian Halloween Dinner Set",
        pinDesc: "A Victorian dinner service for the last night of October — place cards, menu, table numbers and seating plan, all printable. Seats sixteen. Instant download, A4 + US Letter." },
    ],
  },

  {
    key: "wallpapers",
    sku: "HP-006",
    title: "Gaslight Wallpapers — 12 Halloween Phone Backgrounds",
    price: "4.00",
    was: null,
    sheets: "12 designs, 24 files",
    shot: null,
    extraShots: [],
    gcat: "Arts & Entertainment > Hobbies & Creative Arts",
    ptype: "Digital > Wallpapers",
    board: "Halloween Phone Wallpapers",
    blurb: "Twelve phone wallpapers from the same world, set low on the screen so the type sits clear of your clock. Supplied for both iPhone and Android.",
    bullets: [
      "1290 × 2796 and 1440 × 3120 — 24 files",
      "Type sits clear of the lock-screen clock",
      "Dark enough that your icons still read",
    ],
    pins: [
      { h: "12 PHONE<br>WALLPAPERS", t: "dk", face: "",
        eyebrow: "Instant Download", ribbon: "wallpapers",
        kick: "Gaslit, quiet, and clear of your clock. iPhone and Android.",
        pinTitle: "12 Halloween Phone Wallpapers — Dark Academia Lock Screens",
        pinDesc: "Twelve gaslit Halloween phone wallpapers with vintage carnival type, set low so it clears your lock-screen clock. iPhone and Android sizes both included. Instant download." },
      { h: "IT NEVER<br>STOPS<br>TURNING", t: "dk", face: "", ox: true,
        eyebrow: "The Last Carousel", ribbon: "24 files",
        kick: "Twelve designs, two phone sizes, dark enough for your icons.",
        pinTitle: "Dark Academia Phone Wallpaper Pack — Vintage Halloween",
        pinDesc: "Moody vintage Halloween wallpapers for your phone — plum, oxblood and antique gold, with the type set low and clear of your clock. 12 designs, iPhone + Android. Instant download." },
    ],
  },

  {
    key: "vault",
    sku: "HP-100",
    title: "The Whole Vault — Complete Vintage Halloween Printable Bundle",
    price: "29.00",
    was: "51.00",
    sheets: "27 pages + 24 wallpapers",
    shot: "the-sideshow-set.jpg",
    extraShots: ["poison-apothecary-labels.jpg", "party-menu.jpg"],
    gcat: "Home & Garden > Decor",
    ptype: "Printables > Bundles > Halloween",
    board: "Vintage Halloween Decor",
    blurb: "Every sheet in the shop — 27 printable pages and 24 wallpapers — plus everything we print for the rest of the season, at the same download link.",
    bullets: [
      "All six products, bought separately $51",
      "Everything we add this season, same link",
      "A4 and US Letter throughout",
    ],
    pins: [
      { h: "THE WHOLE<br>VAULT", t: "lt", face: "",
        eyebrow: "Hollow Press", ribbon: "bundle",
        kick: "Every sheet in the shop, plus everything we print next. One price.",
        pinTitle: "Vintage Halloween Printable Bundle — 27 Pages + 24 Wallpapers",
        pinDesc: "Every Halloween printable in one bundle: eight sideshow posters, thirty poison labels, a full party kit, forty tickets and tags, a dinner set for sixteen and twelve phone wallpapers. 27 pages plus 24 wallpapers, $51 of printables. Instant download." },
      { h: "BOTH<br>WEEKENDS", t: "dk", face: "eng",
        board: "Printables to Print Tonight",
        eyebrow: "Halloween Is A Saturday This Year", ribbon: "shop",
        kick: "Print it the same night. Nothing to post, nothing to wait for.",
        pinTitle: "Last Minute Halloween Decor — Printable, Ready Tonight",
        pinDesc: "Halloween falls on a Saturday this year, so the parties run both weekends. These are instant downloads — print them the same night, nothing to post and no shipping cut-off to miss. Instant download." },
    ],
  },
];

/* ---- Pinterest boards: name, description and which products feed them ---- */
export const BOARDS = [
  { name: "Vintage Halloween Decor",
    desc: "Vintage Halloween decor ideas and printable wall art — Victorian sideshow posters, antique carnival ephemera, and a burgundy, plum and antique gold palette instead of orange and black. Printable, instant download, A4 and US Letter." },
  { name: "Halloween Party Ideas",
    desc: "Halloween party ideas you can print at home the same night: invitations, pennant banners, photo-booth signs, table tents, drinks menus, tickets and favour tags. Vintage haunted carnival theme. Instant download printables." },
  { name: "Witch Kitchen & Apothecary",
    desc: "Witch kitchen and apothecary decor — printable poison bottle labels, herb and potion jar labels with real botanical names, and gothic pantry styling. Print, cut and stick onto standard jars." },
  { name: "Gothic Tablescapes & Dinner Parties",
    desc: "Gothic and Victorian tablescape ideas for Halloween dinner parties — printable place cards, menus, table numbers and seating plans. Dark academia table styling, instant download." },
  { name: "Halloween Phone Wallpapers",
    desc: "Dark academia and vintage Halloween phone wallpapers — moody plum, oxblood and antique gold lock screens with the type set clear of your clock. iPhone and Android sizes." },
  { name: "Printables to Print Tonight",
    desc: "Last-minute Halloween decor you can have on the wall within the hour. Instant-download printables — no postage, no shipping cut-off. A4 and US Letter included." },
];

/* ---- Profile copy ---- */
export const PROFILE = {
  /* Pinterest weights the display name in search — lead with what you sell */
  displayName: "Hollow Press | Vintage Halloween Printables",
  about: "Printable vintage Halloween decor, letterpress-style. Victorian sideshow posters, poison jar labels, party kits and gothic tablescapes — instant download, print at home, A4 and US Letter. All artwork original.",
};
