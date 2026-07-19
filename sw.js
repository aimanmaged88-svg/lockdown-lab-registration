/* Lockdown Lab Live — service worker.
   Network-first for pages (always fresh app), cache-first for static assets. */
const V = 'lll-v2';
const STATIC = ['/icons/icon-192.png', '/icons/icon-512.png', '/favicon.png', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(STATIC)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    // pages: network first, fall back to last cached copy when offline
    e.respondWith(
      fetch(e.request).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); return r; })
        .catch(() => caches.match(e.request))
    );
  } else {
    // static: cache first
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); return r; }))
    );
  }
});
/* Web push (payload-free ping from the Lab API). The device's stored role
   decides the message: coach hears the door, players hear the Lab. */
self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let role = 'coach';
    try { const c = await caches.open('ll-meta'); const r = await c.match('/ll-role'); if (r) role = (await r.text()) || 'coach'; } catch (err) {}
    const coach = role !== 'player';
    await self.registration.showNotification(
      coach ? '\ud83d\udeaa The Door \u00b7 Lockdown Lab' : '\ud83d\udd12 The Lab \u00b7 Lockdown Lab Live',
      {
        body: coach ? "Someone's knocking or asking for a code. Open the Desk \u2014 bang bang."
                    : "Something's landed for you \u2014 coach might've replied. Tap in.",
        icon: '/icons/icon-192.png', badge: '/icons/icon-192.png',
        tag: coach ? 'll-door' : 'll-lab', renotify: true
      }
    );
  })());
});
/* Notification click: door pings open the Desk, everything else the app */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = e.notification.tag === 'll-door' ? '/admin.html' : '/app.html';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.includes(target)) return c.focus(); }
    return clients.openWindow(target);
  }));
});
