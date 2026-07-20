/* ============================================================================
 * NOVA Rewards — Giveaway / Entry Engine  (window.GV)
 * ----------------------------------------------------------------------------
 * A self-contained, client-side reference implementation of every business
 * rule in the giveaway brief: packages, global entry multipliers, permanent
 * bonus entries, recurring membership allocations, coupons, affiliate
 * tracking and manual entry management.
 *
 * Persistence is localStorage so the prototype is fully demonstrable with no
 * backend. In production these exact rules live server-side (WooCommerce +
 * a subscriptions plugin, or the Supabase edge function in this repo) so the
 * numbers can never be tampered with from the browser — see README.md.
 * The public API mirrors what that server would expose, so swapping the
 * storage layer for real HTTP calls is a drop-in change.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var KEY = 'nova_rewards_v1';

  /* ---- Catalogue ---------------------------------------------------------
   * Packages map a price to a BASE entry count. The active multiplier is
   * applied on top at purchase time (never stored pre-multiplied so history
   * stays auditable). */
  var PACKAGES = [
    { id: 'p20',  price: 20,  entries: 15,  name: 'Starter',   blurb: 'Perfect first draw' },
    { id: 'p50',  price: 50,  entries: 45,  name: 'Plus',      blurb: 'Best for regulars', tag: 'Popular' },
    { id: 'p100', price: 100, entries: 100, name: 'Pro',       blurb: 'Triple your odds' },
    { id: 'p200', price: 200, entries: 250, name: 'Elite',     blurb: 'Maximum entries', tag: 'Best value' }
  ];

  // Membership: recurring $/mo, a monthly entry allocation and a one-time,
  // PERMANENT sign-up bonus that never expires with the monthly cycle.
  var MEMBERSHIP = { id: 'member', price: 20, monthlyEntries: 15, signupBonus: 250, name: 'Membership' };

  var MULTIPLIERS = [1, 2, 5, 10, 20, 30];

  /* ---- Store shape -------------------------------------------------------*/
  function fresh() {
    return {
      settings: {
        multiplier: 30,          // active global multiplier
        promoText: '30× Entries · Next 200 Customers Only',
        nextCustomerCap: 200,    // "next N customers" promo counter
        drawId: 'draw-2026-08',
        seq: 1000                // customer-id sequence
      },
      // The live giveaway campaign + archive of past ones.
      campaigns: [{
        id: 'draw-2026-08', name: 'August Mega Draw', prize: 'Tesla Model 3 + $5,000 Cash',
        prizeImage: '', endsAt: isoInDays(21), banner: '30× Entries · Next 200 Customers Only',
        multiplier: 30, status: 'live'
      }],
      customers: [],
      coupons: [
        coupon('PIKACHU10', { kind: 'multiplier', multiplier: 10, note: '10× entries on any package' }),
        coupon('WELCOME25', { kind: 'percent', percent: 25, note: '25% off + member perks', memberOnly: false }),
        coupon('BONUS500',  { kind: 'bonus', bonus: 500, note: '+500 permanent bonus entries', perCustomer: true }),
        coupon('FREESHIP',  { kind: 'shipping', note: 'Free shipping', usageLimit: 100 })
      ],
      affiliates: [],
      clicks: []
    };
  }

  function coupon(code, o) {
    return Object.assign({
      code: code.toUpperCase(), kind: 'percent', percent: 0, amount: 0, bonus: 0, multiplier: 1,
      note: '', expiry: isoInDays(30), usageLimit: 0, used: 0, perCustomer: false,
      memberOnly: false, redeemedBy: [], active: true
    }, o || {});
  }

  /* ---- Persistence -------------------------------------------------------*/
  var db = load();
  function load() {
    try {
      var raw = global.localStorage && localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    var d = fresh();
    seed(d);
    save(d);
    return d;
  }
  function save(d) {
    d = d || db;
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
  }
  function reset() { db = fresh(); seed(db); save(db); return db; }

  /* ---- Helpers -----------------------------------------------------------*/
  function isoInDays(n) {
    var t = Date.now() + n * 864e5;
    return new Date(t).toISOString();
  }
  function nowISO() { return new Date().toISOString(); }
  function uid(p) { return (p || 'id') + '_' + Math.random().toString(36).slice(2, 9); }
  function nextCustomerId() {
    db.settings.seq += 1;
    return 'NR-' + db.settings.seq;
  }

  // Sum a customer's four entry buckets into their live + lifetime totals.
  function recompute(c) {
    c.purchaseEntries = c.purchaseEntries || 0;
    c.bonusEntries = c.bonusEntries || 0;
    c.membershipEntries = c.membershipEntries || 0;
    c.manualEntries = c.manualEntries || 0;
    c.totalEntries = c.purchaseEntries + c.bonusEntries + c.membershipEntries + c.manualEntries;
    return c;
  }

  function findCustomer(q) {
    q = (q || '').trim().toLowerCase();
    return db.customers.find(function (c) {
      return c.id.toLowerCase() === q || c.email.toLowerCase() === q;
    });
  }
  function searchCustomers(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return db.customers.slice();
    return db.customers.filter(function (c) {
      return [c.fullName, c.email, c.phone, c.id].some(function (v) {
        return (v || '').toLowerCase().indexOf(q) !== -1;
      });
    });
  }

  /* ---- Customers ---------------------------------------------------------*/
  function createCustomer(o) {
    var c = {
      id: nextCustomerId(), fullName: o.fullName || 'New Customer',
      email: (o.email || '').toLowerCase(), phone: o.phone || '',
      membershipStatus: 'none',           // none | active | cancelled
      package: '',                        // last package purchased
      purchaseEntries: 0, bonusEntries: 0, membershipEntries: 0, manualEntries: 0,
      totalEntries: 0, lifetimeEntries: 0,
      orders: [], notes: [], ledger: [], referredBy: o.referredBy || '',
      createdAt: nowISO()
    };
    recompute(c);
    db.customers.push(c);
    save();
    return c;
  }
  function getOrCreateCustomer(o) {
    var c = o.email && db.customers.find(function (x) { return x.email === o.email.toLowerCase(); });
    if (c) return c;
    return createCustomer(o);
  }

  // Every entry movement is written to a per-customer ledger for auditability.
  function ledger(c, delta, bucket, reason, meta) {
    c.ledger.unshift({
      at: nowISO(), delta: delta, bucket: bucket, reason: reason,
      meta: meta || null, balance: 0
    });
    if (delta > 0) c.lifetimeEntries = (c.lifetimeEntries || 0) + delta;
    recompute(c);
    c.ledger[0].balance = c.totalEntries;
  }

  /* ---- Purchase flow -----------------------------------------------------
   * The heart of the engine. Given a package (or membership) and an optional
   * coupon, it computes the multiplier-adjusted entries, applies discounts,
   * records the order and credits the right entry buckets. */
  function quote(input) {
    // input: { packageId | membership:true, couponCode, isMember }
    var mult = db.settings.multiplier;
    var pkg = input.membership ? MEMBERSHIP : PACKAGES.find(function (p) { return p.id === input.packageId; });
    if (!pkg) return { error: 'Unknown package' };

    var base = input.membership ? MEMBERSHIP.monthlyEntries : pkg.entries;
    var price = pkg.price;
    var couponResult = null, couponMult = 1, couponBonus = 0, discount = 0, freeShip = false;

    if (input.couponCode) {
      couponResult = evaluateCoupon(input.couponCode, { isMember: !!input.isMember });
      if (couponResult.ok) {
        var cp = couponResult.coupon;
        if (cp.kind === 'multiplier') couponMult = cp.multiplier || 1;
        else if (cp.kind === 'bonus') couponBonus = cp.bonus || 0;
        else if (cp.kind === 'percent') discount = Math.round(price * (cp.percent / 100) * 100) / 100;
        else if (cp.kind === 'amount') discount = Math.min(price, cp.amount || 0);
        else if (cp.kind === 'shipping') freeShip = true;
      }
    }

    var effectiveMult = mult * couponMult;         // global × coupon multiplier
    var entriesFromPackage = base * effectiveMult;
    var signupBonus = input.membership ? MEMBERSHIP.signupBonus : 0;
    var total = Math.max(0, Math.round((price - discount) * 100) / 100);

    return {
      package: pkg, base: base, globalMultiplier: mult, couponMultiplier: couponMult,
      effectiveMultiplier: effectiveMult, entriesFromPackage: entriesFromPackage,
      couponBonus: couponBonus, signupBonus: signupBonus,
      price: price, discount: discount, total: total, freeShipping: freeShip,
      isMembership: !!input.membership, coupon: couponResult
    };
  }

  function purchase(input) {
    // input: { customer:{fullName,email,phone}, packageId|membership, couponCode, ref }
    var q = quote({
      packageId: input.packageId, membership: input.membership,
      couponCode: input.couponCode, isMember: input.membership || false
    });
    if (q.error) return q;

    var c = getOrCreateCustomer(Object.assign({}, input.customer, { referredBy: input.ref || '' }));

    // Credit package/multiplier entries.
    if (q.isMembership) {
      c.membershipStatus = 'active';
      c.package = 'Membership $' + MEMBERSHIP.price + '/mo';
      c.membershipEntries += q.entriesFromPackage;
      ledger(c, q.entriesFromPackage, 'membership', 'Monthly membership allocation', { mult: q.effectiveMultiplier });
      if (q.signupBonus) {
        c.bonusEntries += q.signupBonus;
        ledger(c, q.signupBonus, 'bonus', 'Membership sign-up bonus (permanent)');
      }
    } else {
      c.package = q.package.name + ' ($' + q.package.price + ')';
      c.purchaseEntries += q.entriesFromPackage;
      ledger(c, q.entriesFromPackage, 'purchase',
        q.package.name + ' package × ' + q.effectiveMultiplier, { mult: q.effectiveMultiplier });
    }

    // Coupon bonus entries (permanent).
    if (q.couponBonus) {
      c.bonusEntries += q.couponBonus;
      ledger(c, q.couponBonus, 'bonus', 'Coupon ' + input.couponCode + ' bonus');
    }

    // Record redemption + order.
    if (q.coupon && q.coupon.ok) redeemCoupon(input.couponCode, c.id);

    var order = {
      id: uid('ord'), at: nowISO(), item: q.isMembership ? 'Membership' : q.package.name,
      price: q.price, discount: q.discount, total: q.total, coupon: input.couponCode || '',
      entries: q.entriesFromPackage + (q.couponBonus || 0) + (q.signupBonus || 0),
      multiplier: q.effectiveMultiplier, freeShipping: q.freeShipping, status: 'paid'
    };
    c.orders.unshift(order);

    // Affiliate attribution.
    if (input.ref) attributeSale(input.ref, order.total);
    if (db.settings.nextCustomerCap > 0) db.settings.nextCustomerCap -= 1;

    recompute(c);
    save();
    return { ok: true, customer: c, order: order, quote: q };
  }

  /* ---- Manual entry management (admin) -----------------------------------*/
  function manualAdjust(customerId, o) {
    // o: { amount, bucket, reason }  amount may be negative to remove.
    var c = db.customers.find(function (x) { return x.id === customerId; });
    if (!c) return { error: 'Customer not found' };
    var bucket = o.bucket || 'manual';
    var amount = Math.round(+o.amount || 0);
    if (!amount) return { error: 'Enter a non-zero amount' };

    if (bucket === 'membership') c.membershipEntries += amount;
    else if (bucket === 'bonus') c.bonusEntries += amount;
    else c.manualEntries += amount;

    // never let a bucket go negative
    ['membershipEntries', 'bonusEntries', 'manualEntries'].forEach(function (k) {
      if (c[k] < 0) c[k] = 0;
    });

    ledger(c, amount, bucket, o.reason || 'Manual adjustment', { by: 'admin' });
    if (o.reason) c.notes.unshift({ at: nowISO(), by: 'admin', text: o.reason, delta: amount });
    recompute(c);
    save();
    return { ok: true, customer: c };
  }
  function addNote(customerId, text) {
    var c = db.customers.find(function (x) { return x.id === customerId; });
    if (!c) return { error: 'not found' };
    c.notes.unshift({ at: nowISO(), by: 'admin', text: text, delta: 0 });
    save();
    return { ok: true, customer: c };
  }

  /* ---- Coupons -----------------------------------------------------------*/
  function evaluateCoupon(code, ctx) {
    ctx = ctx || {};
    var cp = db.coupons.find(function (x) { return x.code === (code || '').toUpperCase(); });
    if (!cp) return { ok: false, reason: 'Code not found' };
    if (!cp.active) return { ok: false, reason: 'Code inactive' };
    if (cp.expiry && new Date(cp.expiry) < new Date()) return { ok: false, reason: 'Code expired' };
    if (cp.usageLimit && cp.used >= cp.usageLimit) return { ok: false, reason: 'Usage limit reached' };
    if (cp.memberOnly && !ctx.isMember) return { ok: false, reason: 'Members only' };
    if (cp.perCustomer && ctx.customerId && cp.redeemedBy.indexOf(ctx.customerId) !== -1)
      return { ok: false, reason: 'Already used' };
    return { ok: true, coupon: cp };
  }
  function redeemCoupon(code, customerId) {
    var cp = db.coupons.find(function (x) { return x.code === (code || '').toUpperCase(); });
    if (!cp) return;
    cp.used += 1;
    if (customerId && cp.redeemedBy.indexOf(customerId) === -1) cp.redeemedBy.push(customerId);
    save();
  }
  function upsertCoupon(o) {
    var cp = db.coupons.find(function (x) { return x.code === (o.code || '').toUpperCase(); });
    if (cp) Object.assign(cp, o, { code: cp.code });
    else db.coupons.push(coupon(o.code, o));
    save();
    return { ok: true };
  }
  function deleteCoupon(code) {
    db.coupons = db.coupons.filter(function (x) { return x.code !== code; });
    save();
  }

  /* ---- Affiliates --------------------------------------------------------*/
  function registerAffiliate(o) {
    var ref = (o.handle || o.name || 'aff').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || uid('aff');
    if (db.affiliates.find(function (a) { return a.ref === ref; })) ref += Math.floor(Math.random() * 90 + 10);
    var a = {
      id: uid('aff'), name: o.name || 'Affiliate', email: o.email || '', ref: ref,
      status: 'pending', rate: 0.15, clicks: 0, sales: 0, revenue: 0, commission: 0,
      payouts: [], createdAt: nowISO()
    };
    db.affiliates.push(a);
    save();
    return a;
  }
  function setAffiliateStatus(id, status) {
    var a = db.affiliates.find(function (x) { return x.id === id; });
    if (a) { a.status = status; save(); }
    return a;
  }
  function setAffiliateRate(id, rate) {
    var a = db.affiliates.find(function (x) { return x.id === id; });
    if (a) { a.rate = Math.max(0, Math.min(1, +rate || 0)); recomputeAffiliate(a); save(); }
    return a;
  }
  function recomputeAffiliate(a) { a.commission = Math.round(a.revenue * a.rate * 100) / 100; }
  function trackClick(ref) {
    var a = db.affiliates.find(function (x) { return x.ref === ref; });
    if (a && a.status === 'approved') { a.clicks += 1; db.clicks.push({ ref: ref, at: nowISO() }); save(); }
  }
  function attributeSale(ref, amount) {
    var a = db.affiliates.find(function (x) { return x.ref === ref; });
    if (a && a.status === 'approved') {
      a.sales += 1; a.revenue = Math.round((a.revenue + amount) * 100) / 100;
      recomputeAffiliate(a); save();
    }
  }
  function payAffiliate(id, amount) {
    var a = db.affiliates.find(function (x) { return x.id === id; });
    if (a) { a.payouts.unshift({ at: nowISO(), amount: +amount || a.commission }); save(); }
    return a;
  }

  /* ---- Settings / campaigns (giveaway administration) --------------------*/
  function setMultiplier(m) {
    db.settings.multiplier = +m || 1;
    var live = liveCampaign();
    if (live) live.multiplier = db.settings.multiplier;
    save();
  }
  function setPromo(text, cap) {
    db.settings.promoText = text;
    if (cap != null) db.settings.nextCustomerCap = +cap;
    var live = liveCampaign();
    if (live) live.banner = text;
    save();
  }
  function liveCampaign() { return db.campaigns.find(function (c) { return c.status === 'live'; }); }
  function createCampaign(o) {
    var c = Object.assign({
      id: uid('draw'), name: 'New Draw', prize: '', prizeImage: '',
      endsAt: isoInDays(21), banner: '', multiplier: db.settings.multiplier, status: 'draft'
    }, o || {});
    db.campaigns.unshift(c);
    save();
    return c;
  }
  function duplicateCampaign(id) {
    var src = db.campaigns.find(function (c) { return c.id === id; });
    if (!src) return null;
    var copy = Object.assign({}, src, { id: uid('draw'), name: src.name + ' (copy)', status: 'draft', endsAt: isoInDays(21) });
    db.campaigns.unshift(copy);
    save();
    return copy;
  }
  function updateCampaign(id, patch) {
    var c = db.campaigns.find(function (x) { return x.id === id; });
    if (!c) return null;
    Object.assign(c, patch);
    if (patch.status === 'live') {
      db.campaigns.forEach(function (x) { if (x !== c && x.status === 'live') x.status = 'ended'; });
      db.settings.multiplier = c.multiplier;
      db.settings.promoText = c.banner;
      db.settings.drawId = c.id;
    }
    save();
    return c;
  }
  function endCampaign(id) { return updateCampaign(id, { status: 'ended' }); }

  /* ---- Stats -------------------------------------------------------------*/
  function stats() {
    var cs = db.customers;
    return {
      customers: cs.length,
      members: cs.filter(function (c) { return c.membershipStatus === 'active'; }).length,
      totalEntries: cs.reduce(function (a, c) { return a + c.totalEntries; }, 0),
      revenue: cs.reduce(function (a, c) {
        return a + c.orders.reduce(function (s, o) { return s + o.total; }, 0);
      }, 0),
      orders: cs.reduce(function (a, c) { return a + c.orders.length; }, 0),
      affiliates: db.affiliates.filter(function (a) { return a.status === 'approved'; }).length
    };
  }

  function exportCustomersCSV() {
    var cols = ['id', 'fullName', 'email', 'phone', 'membershipStatus', 'package',
      'totalEntries', 'bonusEntries', 'membershipEntries', 'manualEntries',
      'purchaseEntries', 'lifetimeEntries', 'createdAt'];
    var head = ['Customer ID', 'Full Name', 'Email', 'Phone', 'Membership', 'Package',
      'Total Entries', 'Bonus', 'Membership Entries', 'Manual', 'Purchase Entries',
      'Lifetime Entries', 'Joined'];
    var rows = db.customers.map(function (c) {
      return cols.map(function (k) {
        var v = c[k]; if (v == null) v = '';
        v = String(v).replace(/"/g, '""');
        return /[",\n]/.test(v) ? '"' + v + '"' : v;
      }).join(',');
    });
    return [head.join(',')].concat(rows).join('\n');
  }

  /* ---- Demo seed ---------------------------------------------------------*/
  function seed(d) {
    var save0 = save; save = function () {}; // silence saves during seeding
    db = d;
    // John Smith — the brief's worked example: $20 pkg × 30 = 450, +250 bonus.
    var mult = d.settings.multiplier;
    var john = createCustomer({ fullName: 'John Smith', email: 'john@example.com', phone: '+61 400 111 222' });
    john.purchaseEntries = 15 * mult;
    ledger(john, 15 * mult, 'purchase', 'Starter package × ' + mult, { mult: mult });
    john.bonusEntries = 250;
    ledger(john, 250, 'bonus', 'Sign-up bonus (permanent)');
    john.package = 'Starter ($20)';
    john.orders.unshift({ id: uid('ord'), at: isoInDays(-2), item: 'Starter', price: 20, discount: 0, total: 20, coupon: '', entries: 15 * mult, multiplier: mult, freeShipping: false, status: 'paid' });
    recompute(john);

    var mia = createCustomer({ fullName: 'Mia Chen', email: 'mia@example.com', phone: '+61 400 333 444' });
    mia.membershipStatus = 'active';
    mia.membershipEntries = 15 * mult; ledger(mia, 15 * mult, 'membership', 'Monthly membership allocation', { mult: mult });
    mia.bonusEntries = MEMBERSHIP.signupBonus; ledger(mia, MEMBERSHIP.signupBonus, 'bonus', 'Membership sign-up bonus (permanent)');
    mia.manualEntries = 50; ledger(mia, 50, 'manual', 'Goodwill — checkout issue');
    mia.package = 'Membership $20/mo';
    mia.notes.unshift({ at: nowISO(), by: 'admin', text: 'Reported a checkout error, comped 50 entries.', delta: 50 });
    mia.orders.unshift({ id: uid('ord'), at: isoInDays(-5), item: 'Membership', price: 20, discount: 0, total: 20, coupon: '', entries: 15 * mult + MEMBERSHIP.signupBonus, multiplier: mult, freeShipping: false, status: 'paid' });
    recompute(mia);

    var aff = registerAffiliate({ name: 'Coastline Media', email: 'promo@coastline.io', handle: 'coastline' });
    aff.status = 'approved'; aff.clicks = 340; aff.sales = 12; aff.revenue = 640; recomputeAffiliate(aff);
    registerAffiliate({ name: 'Jordan Blake', email: 'jordan@example.com', handle: 'jordan' });

    save = save0;
  }

  /* ---- Public API --------------------------------------------------------*/
  global.GV = {
    PACKAGES: PACKAGES, MEMBERSHIP: MEMBERSHIP, MULTIPLIERS: MULTIPLIERS,
    get db() { return db; },
    settings: function () { return db.settings; },
    campaigns: function () { return db.campaigns; }, liveCampaign: liveCampaign,
    // customers
    createCustomer: createCustomer, findCustomer: findCustomer, searchCustomers: searchCustomers,
    customers: function () { return db.customers; },
    // purchase
    quote: quote, purchase: purchase,
    // manual
    manualAdjust: manualAdjust, addNote: addNote,
    // coupons
    coupons: function () { return db.coupons; }, evaluateCoupon: evaluateCoupon,
    upsertCoupon: upsertCoupon, deleteCoupon: deleteCoupon,
    // affiliates
    affiliates: function () { return db.affiliates; }, registerAffiliate: registerAffiliate,
    setAffiliateStatus: setAffiliateStatus, setAffiliateRate: setAffiliateRate,
    trackClick: trackClick, payAffiliate: payAffiliate,
    // campaigns / settings
    setMultiplier: setMultiplier, setPromo: setPromo, createCampaign: createCampaign,
    duplicateCampaign: duplicateCampaign, updateCampaign: updateCampaign, endCampaign: endCampaign,
    // misc
    stats: stats, exportCustomersCSV: exportCustomersCSV, reset: reset, save: save
  };
})(typeof window !== 'undefined' ? window : this);
