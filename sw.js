const CACHE_NAME = 'marrow-planner-pwa-v6';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './firebase.js',
  './data.js',
  './data_marrow_6_5.js',
  './js/core/namespace.js',
  './js/core/constants.js',
  './js/core/subjects.js',
  './js/core/logo.js',
  './js/features/toast.js',
  './icon.svg',
  './manifest.json'
];

const CURRICULUM_CACHE = 'marrow-curriculum-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(e => console.log('Cache add failed', e));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== CURRICULUM_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const cacheKey = url.origin + url.pathname;

  if (url.pathname.includes('curriculum') || url.pathname.endsWith('/')) {
    event.respondWith(
      caches.open(CURRICULUM_CACHE).then((cache) => {
        return fetch(request).then((networkResponse) => {
          cache.put(cacheKey, networkResponse.clone());
          return networkResponse;
        }).catch(() => cache.match(cacheKey));
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, copy));
        return networkResponse;
      })
      .catch(() => caches.match(cacheKey))
  );
});
