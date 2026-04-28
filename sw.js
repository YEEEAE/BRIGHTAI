/* BrightAI Service Worker - production cache routing for repeat visits */
const CACHE_VERSION = '2026-04-29-1';
const CACHE_PREFIX = 'brightai';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;
const HTML_CACHE = `${CACHE_PREFIX}-html-${CACHE_VERSION}`;
const IMMUTABLE_CACHE = `${CACHE_PREFIX}-immutable-${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-${CACHE_VERSION}`;
const FONT_CACHE = `${CACHE_PREFIX}-fonts-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline/';
const MAX_IMAGE_ENTRIES = 80;
const MAX_FONT_ENTRIES = 30;
const MAX_RUNTIME_ENTRIES = 80;

const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.json',
  '/frontend/css/bundle-critical.css',
  '/frontend/css/main.bundle.min.css',
  '/frontend/js/runtime-config.min.js',
  '/frontend/js/navigation.min.js',
  '/assets/images/logo.png',
  '/assets/images/hero-brain.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => Promise.all(
        PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => null))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(`${CACHE_PREFIX}-`) && !currentCaches().includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (shouldBypass(req, url)) return;

  if (isHtmlRequest(req, url)) {
    event.respondWith(networkFirstHtml(req));
    return;
  }

  if (isCssOrJsRequest(req)) {
    event.respondWith(isHashedAsset(url) ? cacheFirst(req, IMMUTABLE_CACHE) : staleWhileRevalidate(req, RUNTIME_CACHE, MAX_RUNTIME_ENTRIES));
    return;
  }

  if (req.destination === 'image') {
    event.respondWith(cacheFirst(req, IMAGE_CACHE, MAX_IMAGE_ENTRIES));
    return;
  }

  if (req.destination === 'font') {
    event.respondWith(cacheFirst(req, FONT_CACHE, MAX_FONT_ENTRIES));
    return;
  }

  event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE, MAX_RUNTIME_ENTRIES));
});

function currentCaches() {
  return [STATIC_CACHE, HTML_CACHE, IMMUTABLE_CACHE, RUNTIME_CACHE, IMAGE_CACHE, FONT_CACHE];
}

function shouldBypass(req, url) {
  if (url.pathname.startsWith('/api/')) return true;
  if (url.pathname.startsWith('/backend/')) return true;
  if (url.pathname === '/robots.txt' || url.pathname === '/sitemap.xml' || url.pathname.endsWith('.xml')) return true;
  if (req.headers.get('accept')?.includes('text/event-stream')) return true;
  return false;
}

function isHtmlRequest(req, url) {
  if (req.mode === 'navigate' || req.destination === 'document') return true;
  if (url.pathname.endsWith('.html')) return true;
  return req.headers.get('accept')?.includes('text/html') || false;
}

function isCssOrJsRequest(req) {
  return req.destination === 'style' || req.destination === 'script';
}

function isHashedAsset(url) {
  const pathname = url.pathname;
  if (!/\.(css|js)$/i.test(pathname)) return false;
  if (url.searchParams.has('v') || url.searchParams.has('ver') || url.searchParams.has('hash')) return true;
  return /(?:^|[./-])(?:v?\d{8,}|[a-f0-9]{8,})(?:[./-]|$)/i.test(pathname);
}

function fetchFresh(req) {
  return fetch(new Request(req, { cache: 'reload' }));
}

async function networkFirstHtml(req) {
  try {
    const res = await fetchFresh(req);
    if (isCacheableBasicResponse(res)) {
      const cache = await caches.open(HTML_CACHE);
      await cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    const cached = await caches.match(req);
    if (cached) return cached;
    const fallback = await caches.match(OFFLINE_URL);
    return fallback || Response.error();
  }
}

async function cacheFirst(req, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;

  const res = await fetch(req);
  if (isCacheableBasicResponse(res)) {
    await cache.put(req, res.clone());
    if (maxEntries) await trimCache(cache, maxEntries);
  }
  return res;
}

async function staleWhileRevalidate(req, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkUpdate = fetch(req)
    .then(async (res) => {
      if (isCacheableBasicResponse(res)) {
        await cache.put(req, res.clone());
        if (maxEntries) await trimCache(cache, maxEntries);
      }
      return res;
    })
    .catch(() => cached);

  return cached || networkUpdate;
}

function isCacheableBasicResponse(res) {
  return Boolean(res && res.ok && res.type === 'basic');
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}
