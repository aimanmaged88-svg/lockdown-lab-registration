/* Certified Hooper — dedicated push service worker.
   The Lab owns the root /sw.js (scope "/"). This one is registered at a unique
   scope ("/hh-push/") so the two registrations never collide. It controls no
   pages — it exists only to receive closed-app pushes. On a payload-free push
   "tickle" it pulls the exact message from the API (using the device id the app
   stored) and shows it loud. */
const API = 'https://ymuwuhvqqftgpxwhzoub.supabase.co/functions/v1/opencourt-api';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdXd1aHZxcWZ0Z3B4d2h6b3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NjUyMzgsImV4cCI6MjA5OTI0MTIzOH0.sOkWQpulWj_ZSqMNSV7YP55T70UFSm2mP5e5xapQyQo';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let pid = '';
    try { const c = await caches.open('hh-meta'); const r = await c.match('/hh-pid'); if (r) pid = (await r.text()) || ''; } catch (_) {}
    let title = '✓ Certified Hooper', body = 'Something just happened — tap in.', tag = 'hh', url = '/hoopsheaven.html';
    if (pid) {
      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON, 'apikey': ANON },
          body: JSON.stringify({ action: 'notif_pull', player_id: pid }),
        });
        const d = await res.json();
        if (d && d.notif) { title = d.notif.title || title; body = d.notif.body || body; tag = d.notif.tag || 'hh'; if (d.notif.url) url = d.notif.url; }
      } catch (_) {}
    }
    await self.registration.showNotification(title, {
      body, icon: '/assets/hh-icon-192.png', badge: '/assets/hh-icon-192.png',
      tag, renotify: true, vibrate: [220, 90, 220, 90, 320], requireInteraction: true,
      data: { url },
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/hoopsheaven.html';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.includes('hoopsheaven')) return c.focus(); }
    return clients.openWindow(url);
  }));
});
