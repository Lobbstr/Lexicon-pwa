// Minimal SW cache for Lexicon PWA
const CACHE = 'lexicon-cache-v1';
const ASSETS = ['/', './', './index.html', './app.js', 'https://cdn.jsdelivr.net/npm/marked/marked.min.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(r => {
      const clone = r.clone(); caches.open(CACHE).then(c => c.put(req, clone));
      return r;
    }).catch(() => cached))
  );
});
