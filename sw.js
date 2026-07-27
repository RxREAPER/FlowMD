const CACHE_NAME = 'marrow-planner-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './icon.svg',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Catch errors silently so it doesn't break installation
      return cache.addAll(ASSETS).catch(e => console.log('Cache add failed', e));
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
