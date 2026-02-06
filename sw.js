/* Bright AI Service Worker - caching for repeat visits */
const CACHE_VERSION = '2026-02-06-1';
const STATIC_CACHE = `brightai-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `brightai-runtime-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/frontend/css/bundle-critical.css?v=20260206',
  '/frontend/css/main.bundle.css?v=20260206',
  '/frontend/js/main.bundle.js?v=20260206',
  '/frontend/js/schema-loader.js?v=20260206',
  '/frontend/js/search.js?v=20260206',
  '/frontend/js/chat-widget.js?v=20260206',
  '/frontend/assets/images/Gemini.webp.png',
  '/frontend/assets/images/hero-brain.svg',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('brightai-') && ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(networkFirst(req));
    return;
  }

  if (['style', 'script', 'image', 'font'].includes(req.destination)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  event.respondWith(staleWhileRevalidate(req));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok && res.type === 'basic') {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(req, res.clone());
  }
  return res;
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === 'basic') {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    const cached = await caches.match(req);
    return cached || caches.match('/index.html');
  }
}

async function staleWhileRevalidate(req) {
  const cached = await caches.match(req);
  const fetchPromise = fetch(req).then(async (res) => {
    if (res && res.ok && res.type === 'basic') {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, res.clone());
    }
    return res;
  }).catch(() => cached);
  return cached || fetchPromise;
}
