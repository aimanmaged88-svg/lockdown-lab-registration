/* LOTG board service worker — exists only for team pings.
   Pushes arrive as payload-free tickles; we pull the real message(s) from
   lotg-board-push (device id is stamped in the 'board-meta' cache at
   subscribe time), then show them loud. No page caching — the app stays
   network-first. */
const FN = "https://ymuwuhvqqftgpxwhzoub.supabase.co/functions/v1/lotg-board-push";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdXd1aHZxcWZ0Z3B4d2h6b3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NjUyMzgsImV4cCI6MjA5OTI0MTIzOH0.sOkWQpulWj_ZSqMNSV7YP55T70UFSm2mP5e5xapQyQo";

self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

async function deviceId() {
  try {
    const c = await caches.open("board-meta");
    const r = await c.match("/device");
    return r ? (await r.text()).trim() : "";
  } catch (e) { return ""; }
}

self.addEventListener("push", e => {
  e.waitUntil((async () => {
    let notifs = [];
    try {
      const dev = await deviceId();
      if (dev) {
        const r = await fetch(FN, {
          method: "POST",
          headers: { Authorization: "Bearer " + KEY, apikey: KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pull", device: dev }),
        });
        notifs = (await r.json()).notifs || [];
      }
    } catch (err) { /* fall through to generic */ }
    if (!notifs.length) notifs = [{ title: "LOTG 🏀", body: "Something just happened on the board — tap in.", url: "/" }];
    for (const n of notifs.reverse()) {
      await self.registration.showNotification(n.title || "LOTG 🏀", {
        body: n.body || "",
        data: { url: n.url || "/" },
        vibrate: [260, 90, 260, 90, 420],
        requireInteraction: false,
        tag: "lotg-" + (n.id || Math.random()),
        icon: "/icon.png",
        badge: "/icon.png",
      });
    }
  })());
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil((async () => {
    const list = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) { if ("focus" in c) { c.navigate(url); return c.focus(); } }
    return clients.openWindow(url);
  })());
});
