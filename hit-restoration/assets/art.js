/* HIT RESTORATION CO. — prototype placeholder art.
   Every image in this prototype is generated SVG, clearly standing in for the real
   photography the client is shooting ahead of launch. Deterministic per seed so
   before/after pairs show the SAME card, with wear removed. */
(function () {
  const CAT_THEMES = {
    pokemon:  { a: '#F5C518', b: '#2E6FBF', art: '#173B63' },
    sports:   { a: '#D96B2B', b: '#7A4A21', art: '#3A2412' },
    magic:    { a: '#8C5BC4', b: '#3C2660', art: '#241539' },
    yugioh:   { a: '#C4A35A', b: '#4F4433', art: '#2A2417' },
    onepiece: { a: '#2FA8A0', b: '#B23A48', art: '#143634' },
    other:    { a: '#8A8D91', b: '#4A4D52', art: '#26282C' }
  };

  // deterministic pseudo-random from seed string
  function rng(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return ((h >>> 0) % 10000) / 10000;
    };
  }

  /* A stylised trading card, 300x420. state: 'before' (worn) | 'after' (restored) */
  function cardSVG(opts) {
    const { name = 'Sample Card', category = 'other', state = 'after', seed = name } = opts || {};
    const t = CAT_THEMES[category] || CAT_THEMES.other;
    const r = rng(seed);
    const worn = state === 'before';
    const stripes = [];
    for (let i = 0; i < 5; i++) {
      const x = 40 + r() * 200, w = 12 + r() * 40;
      stripes.push(`<rect x="${x.toFixed(0)}" y="86" width="${w.toFixed(0)}" height="170" fill="#FFFFFF" opacity="${worn ? 0.05 : 0.12}" transform="rotate(${(r() * 40 - 20).toFixed(0)} 150 170)"/>`);
    }
    const orbs = [];
    for (let i = 0; i < 3; i++) {
      const cx = 70 + r() * 160, cy = 110 + r() * 120, rad = 18 + r() * 34;
      orbs.push(`<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(0)}" fill="${i % 2 ? t.a : '#FFFFFF'}" opacity="${worn ? 0.10 : 0.20}"/>`);
    }
    // wear only on 'before'
    let wear = '';
    if (worn) {
      const creases = [];
      for (let i = 0; i < 2 + Math.floor(r() * 2); i++) {
        const x1 = 30 + r() * 100, y1 = 60 + r() * 300;
        creases.push(`<path d="M${x1.toFixed(0)} ${y1.toFixed(0)} l${(60 + r() * 160).toFixed(0)} ${(r() * 60 - 30).toFixed(0)}" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="1.6"/>
        <path d="M${x1.toFixed(0)} ${(y1 + 2).toFixed(0)} l${(60 + r() * 160).toFixed(0)} ${(r() * 60 - 30).toFixed(0)}" stroke="#000000" stroke-opacity="0.4" stroke-width="1"/>`);
      }
      const scuffs = [];
      for (let i = 0; i < 8; i++) {
        scuffs.push(`<circle cx="${(30 + r() * 240).toFixed(0)}" cy="${(50 + r() * 330).toFixed(0)}" r="${(1 + r() * 3).toFixed(1)}" fill="#FFFFFF" opacity="${(0.12 + r() * 0.2).toFixed(2)}"/>`);
      }
      wear = `
      ${creases.join('')}
      ${scuffs.join('')}
      <!-- soft corners -->
      <path d="M14 14 q14 -4 30 2 q-8 8 -12 22 q-14 -10 -18 -24z" fill="#D8D2C4" opacity="0.5"/>
      <path d="M286 406 q-14 4 -30 -2 q8 -8 12 -22 q14 10 18 24z" fill="#D8D2C4" opacity="0.45"/>
      <path d="M286 14 q-16 -5 -30 1 q7 9 11 23 q15 -10 19 -24z" fill="#D8D2C4" opacity="0.35"/>
      <rect x="8" y="8" width="284" height="404" rx="14" fill="#5A4A1E" opacity="0.16"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" role="img" aria-label="${esc(name)} — ${worn ? 'before restoration (sample art)' : 'after restoration (sample art)'}">
  <defs>
    <linearGradient id="hg-${cssId(seed)}-${state}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="292" height="412" rx="16" fill="#0E0E0E"/>
  <rect x="8" y="8" width="284" height="404" rx="14" fill="url(#hg-${cssId(seed)}-${state})" opacity="${worn ? 0.55 : 0.9}"/>
  <rect x="22" y="52" width="256" height="240" rx="10" fill="${t.art}"/>
  ${stripes.join('')}${orbs.join('')}
  <rect x="22" y="52" width="256" height="240" rx="10" fill="none" stroke="#FFFFFF" stroke-opacity="${worn ? 0.15 : 0.3}" stroke-width="2"/>
  <rect x="22" y="18" width="256" height="24" rx="6" fill="#0A0A0A" opacity="0.65"/>
  <text x="150" y="35" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="700" fill="#FFFFFF" opacity="0.92">${esc(shorten(name, 26))}</text>
  <rect x="22" y="308" width="256" height="86" rx="8" fill="#0A0A0A" opacity="${worn ? 0.4 : 0.5}"/>
  <text x="34" y="332" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="600" fill="#FFFFFF" opacity="0.75">SAMPLE ARTWORK</text>
  <text x="34" y="350" font-family="Inter,system-ui,sans-serif" font-size="10" fill="#FFFFFF" opacity="0.55">Real restoration photography</text>
  <text x="34" y="365" font-family="Inter,system-ui,sans-serif" font-size="10" fill="#FFFFFF" opacity="0.55">replaces this in the live build</text>
  ${wear}
</svg>`;
  }

  /* Product art, 300x300. kind: bottle | jar | cloth | tool | kit | brush | rack | gloves | wipes | press */
  function productSVG(opts) {
    const { kind = 'bottle', label = 'HRC', tint = '#C8102E' } = opts || {};
    const shapes = {
      bottle: `<rect x="118" y="70" width="64" height="30" rx="6" fill="#2A2A2A"/><rect x="126" y="46" width="48" height="28" rx="5" fill="#1B1B1B" stroke="#3A3A3A"/><path d="M110 100 h80 l10 26 v118 a12 12 0 0 1 -12 12 h-76 a12 12 0 0 1 -12 -12 v-118 z" fill="#202020" stroke="#3A3A3A"/><rect x="112" y="150" width="76" height="72" rx="6" fill="#0E0E0E" stroke="${tint}" stroke-width="1.5"/>`,
      jar: `<rect x="104" y="80" width="92" height="26" rx="8" fill="#2A2A2A"/><rect x="98" y="104" width="104" height="140" rx="16" fill="#202020" stroke="#3A3A3A"/><rect x="110" y="140" width="80" height="66" rx="6" fill="#0E0E0E" stroke="${tint}" stroke-width="1.5"/>`,
      cloth: `<path d="M70 110 q80 -34 160 0 v96 q-80 34 -160 0 z" fill="#23262B" stroke="#3A3A3A"/><path d="M70 134 q80 -34 160 0" fill="none" stroke="#4A4D52"/><path d="M70 158 q80 -34 160 0" fill="none" stroke="#4A4D52"/><rect x="120" y="160" width="60" height="46" rx="6" fill="#0E0E0E" stroke="${tint}" stroke-width="1.5"/>`,
      tool: `<rect x="86" y="86" width="128" height="22" rx="10" fill="#2E3136" transform="rotate(40 150 150)"/><rect x="96" y="150" width="110" height="30" rx="8" fill="#202020" stroke="#3A3A3A" transform="rotate(40 150 150)"/><circle cx="150" cy="150" r="52" fill="none" stroke="${tint}" stroke-width="1.5" stroke-dasharray="4 6"/>`,
      kit: `<rect x="70" y="96" width="160" height="120" rx="12" fill="#1E1E1E" stroke="#3A3A3A"/><rect x="70" y="96" width="160" height="34" rx="12" fill="#141414"/><rect x="96" y="146" width="108" height="52" rx="6" fill="#0E0E0E" stroke="${tint}" stroke-width="1.5"/><circle cx="150" cy="113" r="7" fill="${tint}"/>`,
      brush: `<rect x="132" y="60" width="36" height="96" rx="14" fill="#26292E"/><path d="M126 156 h48 v22 q0 10 -8 16 l-4 34 h-24 l-4 -34 q-8 -6 -8 -16 z" fill="#17181B" stroke="#3A3A3A"/><g stroke="#4A4D52" stroke-width="3" stroke-linecap="round"><path d="M136 228 v18"/><path d="M150 230 v20"/><path d="M164 228 v18"/></g><circle cx="150" cy="100" r="30" fill="none" stroke="${tint}" stroke-width="1.5" stroke-dasharray="4 6"/>`,
      rack: `<rect x="76" y="196" width="148" height="14" rx="7" fill="#26292E"/><g fill="#1B1B1B" stroke="#3A3A3A"><rect x="92" y="112" width="24" height="84" rx="4" transform="skewX(-8)"/><rect x="132" y="104" width="24" height="92" rx="4" transform="skewX(-8)"/><rect x="172" y="112" width="24" height="84" rx="4" transform="skewX(-8)"/></g><path d="M84 214 l-8 22 M216 214 l8 22" stroke="#3A3A3A" stroke-width="6" stroke-linecap="round"/>`,
      gloves: `<path d="M112 220 v-84 q0 -12 11 -12 q10 0 10 11 v-20 q0 -11 10 -11 q11 0 11 11 v-8 q0 -11 10 -11 q10 0 10 11 v22 q6 -16 16 -12 q10 4 6 18 l-14 52 q-6 24 -30 24 h-14 q-26 0 -26 -24z" fill="#202020" stroke="#3A3A3A"/><rect x="106" y="220" width="88" height="20" rx="8" fill="${tint}" opacity="0.85"/>`,
      wipes: `<rect x="82" y="110" width="136" height="110" rx="14" fill="#1E1E1E" stroke="#3A3A3A"/><ellipse cx="150" cy="110" rx="42" ry="12" fill="#141414" stroke="#3A3A3A"/><path d="M136 104 q14 -22 30 -8 q-8 12 -12 14 z" fill="#D8D8D8" opacity="0.8"/><rect x="100" y="146" width="100" height="52" rx="6" fill="#0E0E0E" stroke="${tint}" stroke-width="1.5"/>`,
      press: `<rect x="86" y="80" width="128" height="26" rx="8" fill="#26292E"/><rect x="138" y="106" width="24" height="34" fill="#1B1B1B"/><rect x="76" y="140" width="148" height="26" rx="8" fill="#202020" stroke="#3A3A3A"/><rect x="90" y="176" width="120" height="52" rx="8" fill="#141414" stroke="${tint}" stroke-width="1.5"/><rect x="86" y="234" width="128" height="14" rx="7" fill="#26292E"/>`
    };
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" role="img" aria-label="${esc(label)} product (sample render)">
  <rect width="300" height="300" rx="14" fill="#101010"/>
  <circle cx="150" cy="150" r="104" fill="#161616"/>
  ${shapes[kind] || shapes.bottle}
  <text x="150" y="272" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="10" font-weight="700" letter-spacing="2" fill="#8A8D91">SAMPLE RENDER — REAL PRODUCT PHOTO TBC</text>
</svg>`;
  }

  /* HR slab logo lockup (placeholder for the client's real logo — PNG-only asset exists;
     vector files come from their brand designer). */
  function logoSVG(size) {
    const h = size || 40;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 74 88" style="height:${h}px" role="img" aria-label="Hit Restoration Co. logo (placeholder lockup)">
  <rect x="2" y="2" width="70" height="84" rx="9" fill="#141414" stroke="#3A3A3A" stroke-width="2"/>
  <rect x="8" y="8" width="58" height="16" rx="3.5" fill="#0A0A0A" stroke="#2A2A2A"/>
  <text x="37" y="19.5" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="7.2" font-weight="800" letter-spacing="1.4" fill="#C8102E">RESTORE</text>
  <rect x="8" y="28" width="58" height="52" rx="4" fill="#0E0E0E" stroke="#2A2A2A"/>
  <text x="37" y="63" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="34" fill="#FFFFFF">H<tspan fill="#C8102E">R</tspan></text>
  <text x="37" y="75.5" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="5.6" font-weight="700" letter-spacing="1.6" fill="#8A8D91">SUBMIT</text>
</svg>`;
  }

  function monogramFavicon() {
    return 'data:image/svg+xml,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0A0A0A"/><text x="32" y="46" text-anchor="middle" font-family="Impact,sans-serif" font-size="34" fill="#FFFFFF">H</text><text x="44" y="46" text-anchor="middle" font-family="Impact,sans-serif" font-size="34" fill="#C8102E">R</text></svg>`);
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function cssId(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'x'; }
  function shorten(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  window.HRART = { cardSVG, productSVG, logoSVG, monogramFavicon };
})();
