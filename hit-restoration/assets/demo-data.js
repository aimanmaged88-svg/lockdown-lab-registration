/* HIT RESTORATION CO. — prototype demo data.
   All names/orders/numbers are sample data for the clickthrough. Pricing structure,
   stage labels and service copy are REAL (from the client's scope documents). */
(function () {
  const STAGES = [
    { key: 'submitted',            n: 1,  label: 'Submitted',               sub: 'Order created, awaiting cards to arrive',                    say: 'Your order is in. Ship your cards when ready.' },
    { key: 'received',             n: 2,  label: 'Received & inspected',    sub: 'Package arrived, cards logged and photographed',             say: 'Your cards just arrived. Every one gets logged and photographed.' },
    { key: 'quote_ready',          n: 3,  label: 'Quote ready',             sub: 'Your approval needed before work starts',                    say: 'Your firm quote is ready — nothing happens until you approve it.' },
    { key: 'in_restoration',       n: 4,  label: 'In restoration',          sub: 'Active work — corners, surface, creases',                    say: 'Your card just went into restoration.' },
    { key: 'restoration_complete', n: 5,  label: 'Restoration complete',    sub: 'Before/after reveal available in the portal',                say: 'Restoration done. Your reveal is ready.' },
    { key: 'prepped_for_grading',  n: 6,  label: 'Prepped for grading',     sub: 'Sleeved, documented, batched for submission',                say: 'Sleeved, documented and batched for grading.', grading: true },
    { key: 'shipped_to_grader',    n: 7,  label: 'Shipped to grader',       sub: 'Sent to PSA / CGC / BGS / SGC',                              say: 'On its way to the grader.', grading: true },
    { key: 'at_grader',            n: 8,  label: 'At grader',               sub: 'External checkpoint — status as the grader provides it',     say: 'In the grader’s queue. We update this as they do.', grading: true },
    { key: 'graded_returned',      n: 9,  label: 'Graded — returned to us', sub: 'Card is back in-house',                                      say: 'It’s back — graded and in our hands.', grading: true },
    { key: 'final_qc',             n: 10, label: 'Final QC & packaging',    sub: 'Final check before return shipment',                         say: 'Final quality check before it comes home.' },
    { key: 'shipped_to_you',       n: 11, label: 'Shipped to you',          sub: 'Tracking number issued',                                     say: 'On its way back to you — tracked and insured.' },
    { key: 'delivered',            n: 12, label: 'Delivered',               sub: 'Carrier confirms delivery',                                  say: 'Delivered. Enjoy the upgrade.' }
  ];
  const stageIdx = k => STAGES.findIndex(s => s.key === k);

  const SERVICES = [
    { key: 'cleaning',          name: 'Cleaning',          copy: 'Careful surface cleaning that lifts dirt, fingerprints, and handling residue without touching the card’s original print or finish.' },
    { key: 'dent_removal',      name: 'Dent Removal',      copy: 'Dents and indentations worked out using controlled, card-safe techniques that restore a flat surface without damaging the stock underneath.' },
    { key: 'crease_repair',     name: 'Crease Repair',     copy: 'Creases and folds are carefully reduced, softening the visible line and restoring a cleaner overall look.' },
    { key: 'corner_repair',     name: 'Corner Repair',     copy: 'Worn, soft, or rounded corners are rebuilt and sharpened for crisp edges.' },
    { key: 'surface_treatment', name: 'Surface Treatment', copy: 'A finishing pass addressing scratches, print lines, and general surface wear.' }
  ];

  const PRICING = {
    inspection: 10,
    /* Tiered percentage scales with card value (client-confirmed, replaces flat 10%) */
    tiers: [
      { max: 100,   base: 20,  pct: 0.075, label: 'Under $100' },
      { max: 2000,  base: 50,  pct: 0.10,  label: '$100 – $2,000' },
      { max: 10000, base: 120, pct: 0.125, label: '$2,000 – $10,000' },
      { max: null,  base: null, pct: null,  label: '$10,000+', custom: true }
    ],
    /* PSA launch pricing — flat, all-in, per card, by service speed (client-confirmed, final) */
    psaTiers: [
      { key: 'regular', name: 'Regular',       days: '40–50 business days', fee: 225 },
      { key: 'express', name: 'Express',       days: '20–30 business days', fee: 375 },
      { key: 'super',   name: 'Super Express', days: '10 business days',    fee: 850 }
    ],
    /* If PSA reassesses a card into a higher tier after grading:
       customer pays the difference between tier fees + this admin fee. Replaces the old 4% upcharge. */
    tierJumpAdmin: 20,
    storeShipping: { flat: 9.95, freeOver: 99 }
  };

  function restorationTier(value) {
    if (value >= 10000) return PRICING.tiers[3];
    return PRICING.tiers.find(t => t.max !== null && value < t.max) || PRICING.tiers[2];
  }
  function restorationFee(value) {
    const tier = restorationTier(value);
    if (tier.custom) return null; // custom quote
    return Math.round((tier.base + value * tier.pct) * 100) / 100;
  }
  const psaTier = k => PRICING.psaTiers.find(t => t.key === k) || PRICING.psaTiers[0];

  const GRADERS = { psa: 'PSA', cgc: 'CGC', bgs: 'BGS', sgc: 'SGC' };
  /* PSA-only at launch — others are confirmed future additions, shown as coming soon */
  const GRADER_STATUS = { psa: 'live', cgc: 'coming', bgs: 'coming', sgc: 'coming' };

  /* ---------- sample orders (shared by portal, staff and guest tracking) ---------- */
  const ORDERS = [
    {
      id: 'o1', number: 'HR-2026-0342', email: 'hash@demo.com.au', name: 'Jordan Lee',
      service: 'both', created: '2026-06-02', status: 'delivered',
      inspection: 20, inspectionPaid: true, quote: 396.5, quotePaid: true,
      gradingFee: 450, gradingFeePaid: true, upcharge: 170, upchargePaid: true, // 2 × PSA Regular; Charizard re-tiered Regular→Express: $150 diff + $20 admin
      outboundTracking: 'AP334920117AU', carrier: 'Australia Post',
      cards: [
        { id: 'c1', pos: 1, name: '1999 Base Set Charizard Holo', set: 'Pokémon Base Set', category: 'pokemon',
          declared: 1800, confirmed: 1650, service: 'both', jobs: ['cleaning', 'corner_repair', 'surface_treatment'],
          grader: 'psa', psaTier: 'regular', tierOnReturn: 'express', stage: 'delivered', reveal: true, gradeBefore: 'Raw — heavy wear', gradeAfter: 'PSA 8',
          cert: '88231447', gradedValue: 2600 },
        { id: 'c2', pos: 2, name: '1996 Topps Kobe Bryant RC', set: 'Topps Basketball', category: 'sports',
          declared: 900, confirmed: 850, service: 'both', jobs: ['cleaning', 'dent_removal'],
          grader: 'psa', psaTier: 'regular', stage: 'delivered', reveal: true, gradeBefore: 'Raw — dented', gradeAfter: 'PSA 8.5',
          cert: '90114327', gradedValue: 1100 }
      ],
      timeline: [
        { stage: 'submitted', at: '2026-06-02 09:14', note: 'Order created online' },
        { stage: 'received', at: '2026-06-05 11:02', note: '2 cards logged & photographed. Intake values confirmed.' },
        { stage: 'quote_ready', at: '2026-06-05 15:40', note: 'Firm quote issued: $396.50' },
        { stage: 'in_restoration', at: '2026-06-06 08:20', note: 'Quote approved & paid. Work started.' },
        { stage: 'restoration_complete', at: '2026-06-13 16:45', note: 'Reveal published to portal' },
        { stage: 'prepped_for_grading', at: '2026-06-16 10:10', note: 'Batched for submission' },
        { stage: 'shipped_to_grader', at: '2026-06-17 09:00', note: 'Shipped — batch B-014' },
        { stage: 'at_grader', at: '2026-06-20 12:00', note: 'Confirmed received' },
        { stage: 'graded_returned', at: '2026-07-08 14:22', note: 'Back in-house. PSA 8 / PSA 8.5. Charizard re-tiered by PSA — adjustment settled.' },
        { stage: 'final_qc', at: '2026-07-09 09:30', note: 'Final QC passed' },
        { stage: 'shipped_to_you', at: '2026-07-09 15:05', note: 'AP334920117AU (Australia Post, insured)' },
        { stage: 'delivered', at: '2026-07-11 10:48', note: 'Delivered — signature received' }
      ],
      messages: [
        { from: 'customer', at: '2026-06-05 16:02', body: 'Hey — saw the quote come through. Before I approve, is the corner work on the Charizard likely to be noticeable?' },
        { from: 'staff', who: 'Hash', at: '2026-06-05 16:31', body: 'Good question. The rebuild is done to sit flush with the original stock — under normal light you won’t pick it. We’ll shoot close-ups for your reveal so you can judge it yourself before it ships anywhere.' },
        { from: 'customer', at: '2026-06-05 16:44', body: 'Perfect, approved. Go ahead.' },
        { from: 'staff', who: 'Hash', at: '2026-07-08 14:30', body: 'They’re back — PSA 8 on the Charizard, PSA 8.5 on the Kobe. Huge result from where they started. Final QC tomorrow, then they’re on their way to you.' }
      ]
    },
    {
      id: 'o2', number: 'HR-2026-0398', email: 'hash@demo.com.au', name: 'Jordan Lee',
      service: 'restoration', created: '2026-07-06', status: 'in_restoration',
      inspection: 30, inspectionPaid: true, quote: 285, quotePaid: true,
      cards: [
        { id: 'c3', pos: 1, name: '2016 Pikachu Illustrator Promo', set: 'Pokémon Promo', category: 'pokemon',
          declared: 450, confirmed: 480, service: 'restoration', jobs: ['cleaning', 'surface_treatment'],
          stage: 'restoration_complete', reveal: true, gradeBefore: 'Raw — scuffed', gradeAfter: 'Restored' },
        { id: 'c4', pos: 2, name: '2003 LeBron James Topps RC', set: 'Topps Basketball', category: 'sports',
          declared: 750, confirmed: 720, service: 'restoration', jobs: ['crease_repair', 'corner_repair'],
          stage: 'in_restoration', reveal: false },
        { id: 'c5', pos: 3, name: 'Blue-Eyes White Dragon LOB', set: 'Yu-Gi-Oh! LOB', category: 'yugioh',
          declared: 300, confirmed: 300, service: 'restoration', jobs: ['cleaning'],
          stage: 'received', reveal: false }
      ],
      timeline: [
        { stage: 'submitted', at: '2026-07-06 19:22', note: 'Order created online' },
        { stage: 'received', at: '2026-07-09 10:15', note: '3 cards logged & photographed' },
        { stage: 'quote_ready', at: '2026-07-09 14:00', note: 'Firm quote issued: $285.00' },
        { stage: 'in_restoration', at: '2026-07-10 08:05', note: 'Quote approved & paid. Work started.' },
        { stage: 'restoration_complete', at: '2026-07-15 17:30', note: 'Pikachu Illustrator finished — reveal live' }
      ],
      messages: [
        { from: 'staff', who: 'Hash', at: '2026-07-15 17:34', body: 'First one’s done — the Pikachu came up beautifully. Reveal is live in your portal. The LeBron is on the bench now.' }
      ]
    },
    {
      id: 'o3', number: 'HR-2026-0401', email: 'hash@demo.com.au', name: 'Jordan Lee',
      service: 'both', created: '2026-07-12', status: 'quote_ready',
      inspection: 10, inspectionPaid: true, quote: 95, quotePaid: false,
      cards: [
        { id: 'c6', pos: 1, name: '2022 Umbreon VMAX Alt Art', set: 'Evolving Skies', category: 'pokemon',
          declared: 380, confirmed: 350, service: 'both', jobs: ['cleaning', 'corner_repair'],
          grader: 'psa', psaTier: 'regular', stage: 'quote_ready', reveal: false }
      ],
      timeline: [
        { stage: 'submitted', at: '2026-07-12 13:40', note: 'Order created online' },
        { stage: 'received', at: '2026-07-15 09:50', note: 'Card logged & photographed. Intake value confirmed at $350.' },
        { stage: 'quote_ready', at: '2026-07-15 12:10', note: 'Firm quote issued: $95.00 — awaiting your approval' }
      ],
      messages: []
    },
    /* An order belonging to a different (non-logged-in) customer — used to show staff volume */
    {
      id: 'o4', number: 'HR-2026-0405', email: 'sam.r@demo.com.au', name: 'Sam Rivera', staffOnly: true,
      service: 'grading', created: '2026-07-14', status: 'prepped_for_grading',
      inspection: 20, inspectionPaid: true,
      gradingFee: 110, gradingFeePaid: true,
      cards: [
        { id: 'c7', pos: 1, name: '2019 Ja Morant Prizm RC', set: 'Panini Prizm', category: 'sports',
          declared: 250, confirmed: 250, service: 'grading', jobs: [], grader: 'psa', psaTier: 'express', stage: 'prepped_for_grading' },
        { id: 'c8', pos: 2, name: 'Charizard VMAX Shiny', set: 'Shining Fates', category: 'pokemon',
          declared: 180, confirmed: 180, service: 'grading', jobs: [], grader: 'psa', psaTier: 'regular', stage: 'prepped_for_grading' }
      ],
      timeline: [
        { stage: 'submitted', at: '2026-07-14 08:12', note: 'Order created online' },
        { stage: 'received', at: '2026-07-16 10:30', note: '2 cards logged' },
        { stage: 'prepped_for_grading', at: '2026-07-16 15:45', note: 'Assigned to open batch B-015' }
      ],
      messages: []
    },
    {
      id: 'o5', number: 'HR-2026-0407', email: 'mia.k@demo.com.au', name: 'Mia Khan', staffOnly: true,
      service: 'restoration', created: '2026-07-16', status: 'submitted',
      cards: [
        { id: 'c9', pos: 1, name: '1998 Alakazam Holo', set: 'Pokémon Base Set', category: 'pokemon',
          declared: 120, service: 'restoration', jobs: ['cleaning', 'crease_repair'], stage: 'submitted' }
      ],
      timeline: [{ stage: 'submitted', at: '2026-07-16 20:05', note: 'Order created online — awaiting cards' }],
      messages: [
        { from: 'customer', at: '2026-07-16 20:11', body: 'Posted tomorrow via Express — is signature on delivery okay on your end?' }
      ]
    }
  ];

  /* ---------- grading batches (staff) — dealer partner names are INTERNAL ONLY ---------- */
  const BATCHES = [
    { ref: 'B-014', grader: 'psa', dealer: 'SLABD', status: 'returned', shipDate: '2026-06-17',
      outTracking: 'AP221004583AU', estReturn: '2026-07-10', cards: 5,
      note: 'All 5 back 08 Jul. Certs logged.' },
    { ref: 'B-015', grader: 'psa', dealer: 'SLABD', status: 'open', shipDate: null,
      outTracking: null, estReturn: null, cards: 2, note: 'Building — target ship Fri.' },
    { ref: 'B-016', grader: 'psa', dealer: 'Leo Games (Sydney)', status: 'at_grader', shipDate: '2026-07-03',
      outTracking: 'AP228817740AU', estReturn: '2026-08-02', cards: 4, note: '' }
  ];

  /* ---------- products (private-label DIY range — sample catalog) ---------- */
  const PRODUCTS = [
    { id: 'p1', slug: 'card-cleaning-solution', name: 'HRC Card Cleaning Solution', kind: 'bottle', category: 'care',
      desc: 'The same gentle, print-safe solution we use at the bench. Lifts grime and residue without touching gloss or ink.',
      variants: [{ id: 'v1a', name: '50ml', price: 19.95, stock: 34 }, { id: 'v1b', name: '150ml', price: 39.95, stock: 12 }] },
    { id: 'p2', slug: 'microfibre-detail-cloths', name: 'Microfibre Detail Cloths (3-pack)', kind: 'cloth', category: 'care',
      desc: 'Lint-free, edge-stitched cloths cut for card work. Safe on holo and chrome finishes.',
      variants: [{ id: 'v2a', name: '3-pack', price: 12.95, stock: 58 }] },
    { id: 'p3', slug: 'precision-corner-tool', name: 'Precision Corner Tool', kind: 'tool', category: 'tools',
      desc: 'A controlled way to coax soft corners back into shape at home. Includes a quick-start technique card.',
      variants: [{ id: 'v3a', name: 'Standard', price: 24.95, stock: 21 }] },
    { id: 'p4', slug: 'crease-press-kit', name: 'Crease Press Kit', kind: 'press', category: 'kits',
      desc: 'Flatten light creases and warps with graduated pressure plates and card-safe interleaves.',
      variants: [{ id: 'v4a', name: 'Standard', price: 49.95, stock: 8 }] },
    { id: 'p5', slug: 'surface-polish-compound', name: 'Surface Polish Compound', kind: 'jar', category: 'care',
      desc: 'A finishing compound for light scratches and print lines. Use sparingly — a little goes a long way.',
      variants: [{ id: 'v5a', name: '30g', price: 29.95, stock: 3 }] },
    { id: 'p6', slug: 'detail-brush-set', name: 'Soft-Bristle Detail Brush Set', kind: 'brush', category: 'tools',
      desc: 'Three brush weights for dust, debris and edge work. Anti-static bristles.',
      variants: [{ id: 'v6a', name: 'Set of 3', price: 18.95, stock: 40 }] },
    { id: 'p7', slug: 'card-drying-rack', name: 'Card-Safe Drying Rack', kind: 'rack', category: 'tools',
      desc: 'Air-dry cleaned cards vertically without contact marks. Holds 12.',
      variants: [{ id: 'v7a', name: 'Holds 12', price: 34.95, stock: 15 }] },
    { id: 'p8', slug: 'restoration-starter-bundle', name: 'Restoration Starter Bundle', kind: 'kit', category: 'kits',
      desc: 'Solution, cloths, brush set and corner tool — the full home bench, boxed. Save $16 on separates.',
      variants: [{ id: 'v8a', name: 'Bundle', price: 89.95, stock: 6 }] },
    { id: 'p9', slug: 'anti-static-gloves', name: 'Anti-Static Handling Gloves', kind: 'gloves', category: 'accessories',
      desc: 'Fingerprint-free handling for raw cards. Snug fit, washable.',
      variants: [{ id: 'v9a', name: 'S/M', price: 9.95, stock: 0 }, { id: 'v9b', name: 'L/XL', price: 9.95, stock: 26 }] },
    { id: 'p10', slug: 'slab-sleeve-wipes', name: 'Slab & Sleeve Cleaning Wipes (40-pack)', kind: 'wipes', category: 'accessories',
      desc: 'Streak-free wipes for slabs, toploaders and sleeves. Display-case ready.',
      variants: [{ id: 'v10a', name: '40-pack', price: 16.95, stock: 44 }] }
  ];

  /* ---------- gallery (sample entries — real photography replaces the art) ---------- */
  const GALLERY = [
    { id: 'g1', title: '1999 Base Set Charizard Holo', category: 'pokemon', services: ['cleaning', 'corner_repair', 'surface_treatment'], before: 'Raw — heavy wear', after: 'PSA 8', blurb: 'Soft corners rebuilt, surface haze lifted. Came back a PSA 8.', featured: true },
    { id: 'g2', title: '1996 Topps Kobe Bryant RC', category: 'sports', services: ['cleaning', 'dent_removal'], before: 'Raw — dented', after: 'PSA 8.5', blurb: 'Two deep dents worked flat. Graded PSA 8.5.', featured: true },
    { id: 'g3', title: 'Blue-Eyes White Dragon LOB', category: 'yugioh', services: ['cleaning', 'crease_repair'], before: 'Raw — creased', after: 'Restored', blurb: 'A front-to-back crease softened to near-invisible.' },
    { id: 'g4', title: '2003 LeBron James Topps RC', category: 'sports', services: ['corner_repair'], before: 'Raw — corner wear', after: 'PSA 8', blurb: 'All four corners sharpened. PSA 8 on return.' },
    { id: 'g5', title: 'Umbreon VMAX Alt Art', category: 'pokemon', services: ['cleaning', 'surface_treatment'], before: 'Raw — scratched', after: 'PSA 9', blurb: 'Surface scratches polished out of the alt art. PSA 9.', featured: true },
    { id: 'g6', title: 'Black Lotus (Revised)', category: 'magic', services: ['cleaning'], before: 'Raw — grimy', after: 'Restored', blurb: 'Decades of handling residue lifted without touching the print.' },
    { id: 'g7', title: 'Luffy Gear 5 Alt Art', category: 'onepiece', services: ['dent_removal', 'surface_treatment'], before: 'Raw — dented', after: 'PSA 9', blurb: 'Shipping dent removed, surface finished. PSA 9.' },
    { id: 'g8', title: '1998 Pikachu Jungle', category: 'pokemon', services: ['crease_repair', 'cleaning'], before: 'Raw — folded', after: 'Restored', blurb: 'A folded childhood favourite brought back for display.' }
  ];

  const FAQS = [
    { q: 'Do you check for fakes?', a: 'Every card, every time. Counterfeits — including “super fakes” and even fake graded slabs — are the biggest problem in the hobby right now, so an authenticity screen is built into the $10 inspection on every submission. If a card doesn’t pass, we tell you straight, it never goes to restoration or a grader, and it’s returned to you. We’d rather lose a job than pass a fake down the line.' },
    { q: 'Is my card insured while you have it?', a: 'Yes. While your card is in our direct custody it’s covered against loss or damage up to the declared value we confirm together at intake, and every physical handoff is photo-logged with timestamps. Once it’s with a courier or a grading company, their cover applies — we’ll always pass on anything we can recover on your behalf.' },
    { q: 'Do you guarantee a grade?', a: 'No — and you should be wary of anyone who does. Grading decisions belong to the grading companies alone. What we guarantee is careful, skilled work, honest updates at every stage, and a firm quote before anything starts.' },
    { q: 'What does it cost?', a: 'A $10 inspection fee per card at intake (credited to your invoice if you proceed), then a firm restoration quote on your card’s confirmed value — a flat base of $20–$120 by value tier plus 7.5–12.5% of confirmed value (the percentage scales with the tier). PSA grading is a flat, all-in fee by speed: $225 Regular, $375 Express, $850 Super Express. If PSA reassesses a card into a higher tier after grading, you pay just the difference between tier fees plus a $20 admin fee. Nothing is ever charged against a guessed value.' },
    { q: 'Do I have to disclose restoration when I sell?', a: 'Yes — standard hobby practice (and our terms) put that responsibility with you. We’re upfront about this because it protects everyone, including the card’s next owner.' },
    { q: 'How do I get my cards to you?', a: 'You arrange and pay for shipping to us — we recommend tracked and insured. Full packing instructions come with your submission confirmation. Return shipping back to you is tracked and insured via Australia Post or courier.' },
    { q: 'How long does it take?', a: 'Restoration typically runs 1–3 weeks depending on the work. PSA grading depends on the speed you choose: Regular 40–50 business days, Express 20–30, Super Express 10. Your tracker shows the live status the whole way.' },
    { q: 'Which graders do you submit to?', a: 'We’re launching with PSA — the world’s biggest grader — with the entire submission handled on your behalf; you never deal with PSA directly. CGC, BGS and SGC are confirmed future additions once we’re rolling.' },
    { q: 'Can I order restoration without grading, or grading without restoration?', a: 'Both. Restoration only, grading only, or restoration flowing straight into grading as one bundled path — your choice, per card.' }
  ];

  const REPORT = {
    ordersActive: 9, cardsInHouse: 14, avgTurnaroundDays: 24.5, gradeImprovements: 11,
    revenueMonth: { inspection: 180, restoration: 2470, grading: 1800, upcharges: 340, store: 486 },
    cardsByStage: { submitted: 2, received: 3, quote_ready: 1, in_restoration: 3, restoration_complete: 1, prepped_for_grading: 2, shipped_to_grader: 0, at_grader: 4, graded_returned: 0, final_qc: 0, shipped_to_you: 1, delivered: 12 }
  };

  const CUSTOMERS = [
    { name: 'Jordan Lee', email: 'hash@demo.com.au', orders: 3, cards: 6, lifetime: 1642.5, since: '2026-06-02', note: 'Prefers messages over email. Collects vintage Pokémon.' },
    { name: 'Sam Rivera', email: 'sam.r@demo.com.au', orders: 1, cards: 2, lifetime: 130, since: '2026-07-14', note: '' },
    { name: 'Mia Khan', email: 'mia.k@demo.com.au', orders: 1, cards: 1, lifetime: 0, since: '2026-07-16', note: 'First-time submitter.' },
    { name: 'Dean Okafor', email: 'dean.o@demo.com.au', orders: 4, cards: 18, lifetime: 3480, since: '2026-04-19', note: 'Power seller — batches monthly. Phase 2 dealer features candidate.' }
  ];

  const DEALERS = ['SLABD', 'Leo Games (Sydney)', 'House of Cards N Collectables (Sydney)'];

  window.HRDATA = {
    STAGES, stageIdx, SERVICES, PRICING, restorationFee, restorationTier, psaTier, GRADERS, GRADER_STATUS,
    ORDERS, BATCHES, PRODUCTS, GALLERY, FAQS, REPORT, CUSTOMERS, DEALERS
  };
})();
