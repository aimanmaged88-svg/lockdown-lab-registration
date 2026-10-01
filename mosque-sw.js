// Zetland Mosque notification SW — registered at scope /mosque-push/ (controls no pages,
// never touches the site's other service workers). Exists for showNotification + future push.
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',e=>{
  e.waitUntil(self.registration.showNotification('🕌 Zetland Mosque',{
    body:e.data?e.data.text():'Prayer time',icon:'assets/mosque-icon-192.png',
    vibrate:[260,90,260,90,420],tag:'mq'}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(self.clients.openWindow('/mosque.html'));
});
