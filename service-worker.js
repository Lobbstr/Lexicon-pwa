// Simple offline cache for core files (v3)
const CACHE = 'lexicon-cache-v3';
const CORE = [
  './',
  './index.html?v=3',
  './app.js?v=3',
  './manifest.webmanifest?v=3',
  './app-icons/icon-192.png',
  './app-icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.url.includes('api.scryfall.com') || request.destination === 'image') {
    e.respondWith(fetch(request).catch(() => caches.match(request)));
  } else {
    e.respondWith(caches.match(request).then(res => res || fetch(request)));
  }
});
