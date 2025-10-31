// Simple offline cache for core files
const CACHE = 'lexicon-cache-v1';
const CORE = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest'
  // add './icons/icon-192.png', './icons/icon-512.png' if you add real icons
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // Network-first for images & Scryfall; cache-first for app shell
  if (request.url.includes('api.scryfall.com') || request.destination === 'image') {
    e.respondWith(fetch(request).catch(() => caches.match(request)));
  } else {
    e.respondWith(caches.match(request).then(res => res || fetch(request)));
  }
});
