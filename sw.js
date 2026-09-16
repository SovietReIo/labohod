/* Лабоход — сервис-воркер. Версия меняется сама при каждой сборке. */
const V = 'labohod-f181a7d22e';
const SHELL = ['./', './index.html', './brief.html', './manifest.webmanifest',
               './icon-192.png', './icon-512.png', './icon-180.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* шрифты и прочая статика со стороны — сначала кеш, потом сеть */
  if (url.origin !== location.origin) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(V).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => hit)));
    return;
  }

  /* свои страницы — сначала сеть (чтобы обновления доезжали), кеш как запасной */
  e.respondWith(fetch(req).then(res => {
    const copy = res.clone();
    caches.open(V).then(c => c.put(req, copy)).catch(() => {});
    return res;
  }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html'))));
});
