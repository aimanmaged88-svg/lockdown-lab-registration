/* HIT RESTORATION CO. — prototype shell: shared chrome + widgets.
   Include order on every page: brand.css, art.js, demo-data.js, shell.js */
(function () {
  const PAGES = [
    { href: 'services.html', label: 'Services' },
    { href: 'how-it-works.html', label: 'How it works' },
    { href: 'pricing.html', label: 'Pricing' },
    { href: 'gallery.html', label: 'Before & after' },
    { href: 'store.html', label: 'Store' },
    { href: 'track.html', label: 'Track an order' }
  ];

  const here = location.pathname.split('/').pop() || 'index.html';

  function injectHead() {
    const fav = document.createElement('link');
    fav.rel = 'icon'; fav.href = HRART.monogramFavicon();
    document.head.appendChild(fav);
  }

  function ribbonHTML() {
    return `<div class="proto-ribbon" role="note">
      <strong>INTERACTIVE PROTOTYPE</strong>
      <span>— clickable skeleton with sample data & placeholder imagery. Nothing here is live or final.</span>
    </div>`;
  }

  function headerHTML() {
    return `<header class="site-head" id="siteHead">
      <div class="container bar">
        <a class="logo-lockup" href="index.html" aria-label="Hit Restoration Co. — home">
          ${HRART.logoSVG(40)}
          <span class="logo-word">Hit Restoration<br>Co.<small>RESTORE — SUBMIT</small></span>
        </a>
        <nav class="main" aria-label="Main">
          ${PAGES.map(p => `<a href="${p.href}" class="${here === p.href ? 'active' : ''}">${p.label}</a>`).join('')}
          <a href="portal.html" class="nav-only-mobile">Portal</a>
          <a href="portal.html#submit" class="nav-only-mobile">Start a submission</a>
        </nav>
        <div class="head-cta">
          <a class="btn btn-ghost btn-sm" href="portal.html">Portal</a>
          <a class="btn btn-red btn-sm" href="portal.html#submit">Start a submission</a>
          <button class="nav-burger" id="navBurger" aria-label="Menu" aria-expanded="false">☰</button>
        </div>
      </div>
    </header>`;
  }

  function footerHTML() {
    return `<footer class="site-foot">
      <div class="container">
        <div class="cols">
          <div>
            <a class="logo-lockup" href="index.html" style="margin-bottom:14px">${HRART.logoSVG(34)}
              <span class="logo-word" style="font-size:.9rem">Hit Restoration Co.<small>RESTORE — SUBMIT</small></span></a>
            <p class="small muted" style="max-width:300px">Trading-card restoration and full grading concierge. Melbourne, Australia. All pricing in AUD.</p>
            <span class="badge badge-warning">Prototype — sample content</span>
          </div>
          <div>
            <h5>Services</h5>
            <a href="services.html">Restoration</a>
            <a href="services.html#grading">Grading concierge</a>
            <a href="pricing.html">Pricing</a>
            <a href="store.html">DIY care store</a>
          </div>
          <div>
            <h5>Trust</h5>
            <a href="how-it-works.html">How it works</a>
            <a href="gallery.html">Before & after</a>
            <a href="track.html">Track an order</a>
            <a href="about.html#faq">FAQ</a>
          </div>
          <div>
            <h5>Company</h5>
            <a href="about.html">About</a>
            <a href="about.html#contact">Contact</a>
            <a href="legal.html">Terms & waiver (draft)</a>
            <a href="staff.html">Staff admin ↗</a>
          </div>
        </div>
        <div class="fine">
          <span>© 2026 Hit Restoration Co. · ABN TBC · Australia-only at launch</span>
          <span><a href="https://instagram.com/hitrestorationco" target="_blank" rel="noopener" style="display:inline; padding:0">Instagram @hitrestorationco</a> · Sister brand: <a href="#" style="display:inline; padding:0" title="Cross-link to the existing Hit Collectables Shopify store (kept inert in this prototype)">Hit Collectables ↗</a></span>
        </div>
      </div>
    </footer>`;
  }

  function brainstormHTML() {
    return `<section class="brainstorm" id="brainstorm" aria-label="Brainstorm">
      <div class="container">
        <div class="bs-card">
          <span class="bs-eyebrow">◆ Hash's space</span>
          <h3>Hey Hash — brainstorm here 💭</h3>
          <p class="muted mb0">Anything you love, want tweaked, or just thought of while clicking around — drop it in below and it comes straight back to the team. No idea's too small or too wild.</p>
          <form class="bs-form" id="bsForm" name="brainstorm" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/">
            <input type="hidden" name="form-name" value="brainstorm">
            <input type="hidden" name="page" id="bsPage">
            <p hidden><label>Skip: <input name="bot-field"></label></p>
            <div class="field mb1"><input class="input" name="name" id="bsName" placeholder="Your name (optional)" autocomplete="off"></div>
            <div class="field mb0"><textarea class="textarea" name="idea" id="bsIdea" placeholder="e.g. Love the reveal slider — can the grade badge be gold? Also want a bulk upload for dealer submissions…" required></textarea></div>
            <div class="bs-actions">
              <span class="status" id="bsStatus">Goes straight to the team ✓</span>
              <button type="submit" class="btn btn-red" id="bsSend">Send it through →</button>
            </div>
          </form>
          <div class="bs-recent" id="bsRecent"></div>
        </div>
      </div>
    </section>`;
  }

  function renderRecent() {
    const box = document.getElementById('bsRecent');
    if (!box) return;
    const list = store.get('brainstorm', []);
    if (!list.length) { box.innerHTML = ''; return; }
    box.innerHTML = `<h4>Your recent notes (${list.length})</h4>` +
      list.slice(-4).reverse().map(n => `<div class="bs-note">${escapeHTML(n.idea)}<div class="m">${n.name ? escapeHTML(n.name) + ' · ' : ''}${escapeHTML(n.page)} · just now</div></div>`).join('');
  }

  function wireBrainstorm() {
    const form = document.getElementById('bsForm');
    if (!form) return;
    document.getElementById('bsPage').value = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
    renderRecent();
    form.addEventListener('submit', e => {
      e.preventDefault();
      const idea = document.getElementById('bsIdea').value.trim();
      const name = document.getElementById('bsName').value.trim();
      if (!idea) { toast('Type an idea first 🙂'); return; }
      const page = document.getElementById('bsPage').value;
      // mirror locally so it feels instant + shows in the staff "Brainstorm inbox" (same-browser demo)
      const list = store.get('brainstorm', []);
      list.push({ idea, name, page, at: new Date().toISOString().slice(0, 16).replace('T', ' ') });
      store.set('brainstorm', list);
      // Netlify Forms → captured in the Netlify dashboard + staff "Brainstorm inbox",
      // and auto-emailed to the team via the form's Netlify email notification.
      const body = new URLSearchParams({ 'form-name': 'brainstorm', page, name, idea, 'bot-field': '' }).toString();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
        .catch(() => {}); // offline/local dev: local mirror still captured it
      document.getElementById('bsIdea').value = '';
      document.getElementById('bsName').value = '';
      const s = document.getElementById('bsStatus');
      if (s) s.textContent = 'Sent — thanks Hash! Keep them coming ✓';
      toast('Sent to the team 🚀');
      renderRecent();
    });
  }

  function escapeHTML(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function mount() {
    injectHead();
    document.body.insertAdjacentHTML('afterbegin', ribbonHTML() + headerHTML());
    if (!document.body.dataset.nobrainstorm) document.body.insertAdjacentHTML('beforeend', brainstormHTML());
    if (!document.body.dataset.nofooter) document.body.insertAdjacentHTML('beforeend', footerHTML());
    const head = document.getElementById('siteHead');
    const burger = document.getElementById('navBurger');
    if (burger) burger.addEventListener('click', () => {
      const open = head.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    wireBrainstorm();
    // scroll-reveal
    const io = ('IntersectionObserver' in window) ? new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 }) : null;
    document.querySelectorAll('.fx').forEach(el => io ? io.observe(el) : el.classList.add('in'));
  }

  /* ---------- helpers ---------- */
  function fmtAUD(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function buildNote(text) { return `<div class="note-build">${text}</div>`; }

  function stageChip(stageKey) {
    const s = HRDATA.STAGES.find(x => x.key === stageKey);
    if (!s) return '';
    const cls = stageKey === 'delivered' ? 'done' : 'live';
    return `<span class="stage-chip ${cls}">${s.label}</span>`;
  }

  /* Vertical 12-stage stepper. cur = stage key; grading=false hides grading-only stages. */
  function stepperHTML(cur, opts) {
    const o = opts || {};
    const grading = o.grading !== false;
    const ci = HRDATA.stageIdx(cur);
    return `<div class="stepper">` + HRDATA.STAGES.map((s, i) => {
      const skip = !grading && s.grading;
      const state = skip ? 'skipped' : (i < ci ? 'done' : (i === ci ? 'current' : ''));
      const mark = i < ci ? '✓' : s.n;
      return `<div class="step ${state}">
        <div class="s-dot">${skip ? '—' : mark}</div>
        <div><div class="s-title">${s.label}</div>
        <div class="s-sub">${skip ? 'Skipped — restoration only' : (i === ci && s.say ? s.say : s.sub)}</div></div>
      </div>`;
    }).join('') + `</div>`;
  }

  function miniStepper(cur, grading) {
    const ci = HRDATA.stageIdx(cur);
    return `<div class="stepper-mini" aria-label="progress">` + HRDATA.STAGES.map((s, i) => {
      if (grading === false && s.grading) return '';
      const cls = i < ci ? 'done' : (i === ci ? 'current' : '');
      return `<i class="${cls}"></i>`;
    }).join('') + `</div>`;
  }

  /* Before/after reveal slider. host = element; b/a = inner SVG or <img> HTML strings. */
  function mountReveal(host, beforeHTML, afterHTML) {
    host.classList.add('reveal');
    host.innerHTML = `<div class="rv-before">${beforeHTML}</div>
      <div class="rv-after">${afterHTML}</div>
      <div class="rv-handle" role="slider" aria-label="Before and after reveal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" tabindex="0"></div>
      <span class="rv-tag before">Before</span><span class="rv-tag after">After</span>`;
    const after = host.querySelector('.rv-after');
    const handle = host.querySelector('.rv-handle');
    function setP(p) {
      p = Math.max(2, Math.min(98, p));
      after.style.clipPath = `inset(0 0 0 ${p}%)`;
      handle.style.left = p + '%';
      handle.setAttribute('aria-valuenow', Math.round(p));
    }
    function fromEvent(e) {
      const r = host.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      setP((x / r.width) * 100);
    }
    let drag = false;
    host.addEventListener('pointerdown', e => { drag = true; fromEvent(e); host.setPointerCapture(e.pointerId); });
    host.addEventListener('pointermove', e => drag && fromEvent(e));
    host.addEventListener('pointerup', () => drag = false);
    host.addEventListener('pointercancel', () => drag = false);
    handle.addEventListener('keydown', e => {
      const cur = parseFloat(handle.style.left) || 50;
      if (e.key === 'ArrowLeft') { setP(cur - 6); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setP(cur + 6); e.preventDefault(); }
    });
    setP(50);
  }

  /* localStorage-backed prototype state (cart, demo session, simulated order changes) */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('hrproto.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('hrproto.' + k, JSON.stringify(v)); } catch (e) { } },
    del(k) { try { localStorage.removeItem('hrproto.' + k); } catch (e) { } }
  };

  function cartCount() {
    const c = store.get('cart', []);
    return c.reduce((n, i) => n + i.qty, 0);
  }

  window.HR = { mount, fmtAUD, toast, buildNote, stageChip, stepperHTML, miniStepper, mountReveal, store, cartCount };
  document.addEventListener('DOMContentLoaded', mount);
})();
