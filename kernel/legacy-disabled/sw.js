/* BrightAI Kernel Service Worker v2 — enhanced caching strategies */
const KERNEL_CACHE_VERSION = '2026-06-10-1';
const CACHE_PREFIX = 'brightai-kernel';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${KERNEL_CACHE_VERSION}`;
const API_CACHE = `${CACHE_PREFIX}-api-${KERNEL_CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${KERNEL_CACHE_VERSION}`;
const OFFLINE_URL = '/kernel/offline.html';
const APPROVAL_SYNC_TAG = 'brightai-kernel-pending-approvals';
const PERIODIC_SYNC_TAG = 'brightai-kernel-periodic-sync';
const DB_NAME = 'brightai-kernel-sw';
const DB_VERSION = 1;
const APPROVAL_STORE = 'pendingApprovals';

/* Cacheable response thresholds — only cache responses matching these criteria */
const CACHEABLE_RESPONSE_CONFIG = {
  statuses: [0, 200],
  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days for static assets
};

const PRECACHE_URLS = [
  OFFLINE_URL,
  '/kernel/',
  '/kernel/manifest.json',
  '/kernel/assets/css/kernel.css',
  '/kernel/assets/js/kernel-utils.js',
  '/kernel/assets/js/kernel-nav.js',
  '/kernel/assets/js/kernel-notifications.js',
  '/kernel/assets/js/kernel-pwa.js',
  '/kernel/kernel-web-vitals.js',
  '/kernel/kernel-perf.js',
  '/frontend/images/android-chrome-192x192.png',
  '/frontend/images/android-chrome-512x512.png'
];

/* ── Install ─────────────────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => Promise.all(
        PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => null))
      ))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate ────────────────────────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      cleanOldCaches(),
      self.clients.claim(),
      enableNavigationPreload()
    ])
  );
});

async function cleanOldCaches() {
  const keys = await caches.keys();
  return Promise.all(
    keys
      .filter((key) => key.startsWith(`${CACHE_PREFIX}-`) && ![STATIC_CACHE, API_CACHE, RUNTIME_CACHE].includes(key))
      .map((key) => caches.delete(key))
  );
}

/* ── Navigation Preload ─────────────────────────────────── */
async function enableNavigationPreload() {
  if (!self.registration.navigationPreload) return;
  try {
    await self.registration.navigationPreload.enable();
  } catch (_error) {
    // Navigation preload not supported — safe to ignore.
  }
}

/* ── Fetch ───────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  /* Static assets → cache-first */
  if (request.method === 'GET' && isStaticAsset(request, url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  /* Navigation requests → network-first with preload support */
  if (request.method === 'GET' && isNavigationRequest(request)) {
    event.respondWith(networkFirstNavigation(request, event));
    return;
  }

  /* Kernel API GET → stale-while-revalidate for speed */
  if (isKernelApiRequest(url)) {
    if (request.method === 'GET') {
      event.respondWith(staleWhileRevalidate(request, API_CACHE));
      return;
    }

    if (request.method === 'POST' && isApprovalMutation(url)) {
      event.respondWith(networkFirstApprovalMutation(request));
      return;
    }

    event.respondWith(networkFirstApiMutation(request));
  }
});

/* ── Background Sync ────────────────────────────────────── */
self.addEventListener('sync', (event) => {
  if (event.tag === APPROVAL_SYNC_TAG) {
    event.waitUntil(replayPendingApprovals());
  }
});

/* ── Periodic Background Sync ───────────────────────────── */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(periodicBackgroundSync());
  }
});

async function periodicBackgroundSync() {
  try {
    /* Refresh key API data in background so the next load is fresh */
    const endpoints = [
      '/api/kernel/approvals',
      '/api/kernel/stats'
    ];

    const cache = await caches.open(API_CACHE);
    await Promise.allSettled(
      endpoints.map(async (path) => {
        try {
          const response = await fetch(path, { cache: 'reload' });
          if (isCacheableWithPlugin(response)) {
            await cache.put(new Request(path), response.clone());
          }
        } catch (_error) {
          // Network unavailable during periodic sync — ignore.
        }
      })
    );

    postPerfMetric('periodic_sync', {
      status: 'success',
      endpoints: endpoints.length,
      timestamp: Date.now()
    });
  } catch (_error) {
    postPerfMetric('periodic_sync', { status: 'error' });
  }
}

/* ── Push ────────────────────────────────────────────────── */
self.addEventListener('push', (event) => {
  const payload = readPushPayload(event);
  const isPendingApproval = payload.type === 'pending_approval' || payload.type === 'pending_approvals';
  const title = payload.title || (isPendingApproval ? 'موافقات معلقة في BrightAI Kernel' : 'BrightAI Kernel');
  const body = payload.body || (isPendingApproval ? 'يوجد طلب جديد يحتاج مراجعة بشرية.' : 'وصل تحديث جديد من BrightAI Kernel.');

  event.waitUntil(showKernelNotification(title, {
    body,
    tag: payload.tag || 'brightai-kernel-pending-approvals',
    data: {
      url: payload.url || '/kernel/approvals/',
      traceId: payload.traceId || payload.trace_id || '',
      ...payload.data
    },
    renotify: true
  }));
});

/* ── Notification Click ──────────────────────────────────── */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/kernel/approvals/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((client) => client.url.startsWith(targetUrl));
      if (existing) return existing.focus();
      return clients.openWindow(targetUrl);
    })
  );
});

/* ── Message ─────────────────────────────────────────────── */
self.addEventListener('message', (event) => {
  const message = event.data || {};
  if (message.type === 'SHOW_PENDING_APPROVAL_NOTIFICATION') {
    const count = Number(message.count) || 0;
    event.waitUntil(showKernelNotification('موافقات معلقة في BrightAI Kernel', {
      body: count > 1 ? `لديك ${count} طلبات بانتظار الموافقة.` : 'لديك طلب واحد بانتظار الموافقة.',
      tag: 'brightai-kernel-pending-approvals',
      data: { url: '/kernel/approvals/' },
      renotify: true
    }));
  }

  /* Handle update notification → activate new SW immediately */
  if (message.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ════════════════════════════════════════════════════════════
   Caching Strategies
   ════════════════════════════════════════════════════════════ */

/* ── Helpers ─────────────────────────────────────────────── */
function isStaticAsset(request, url) {
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'font') return true;
  return /\.(?:css|js|woff2?|ttf|otf|png|jpg|jpeg|svg|webp)$/i.test(url.pathname);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document' || request.headers.get('accept')?.includes('text/html');
}

function isKernelApiRequest(url) {
  return url.pathname.startsWith('/api/kernel/');
}

function isApprovalMutation(url) {
  return url.pathname === '/api/kernel/approvals' || url.pathname.startsWith('/api/kernel/approve/') || url.pathname.startsWith('/api/kernel/reject/');
}

/**
 * Cacheable Response Plugin logic — validates response before caching.
 * Rejects opaque cross-origin responses and non-2xx statuses.
 */
function isCacheableWithPlugin(response) {
  if (!response) return false;
  if (!CACHEABLE_RESPONSE_CONFIG.statuses.includes(response.status)) return false;
  return response.type === 'basic' || response.type === 'cors';
}

function isCacheable(response) {
  return Boolean(response && response.ok && response.type === 'basic');
}

/* ── Strategy: Cache First ───────────────────────────────── */
async function cacheFirst(request, cacheName) {
  const start = performance.now();
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    postPerfMetric('cache', {
      result: 'hit',
      cacheName,
      url: new URL(request.url).pathname,
      duration: Math.round(performance.now() - start)
    });
    return cached;
  }

  const response = await fetch(request);
  if (isCacheableWithPlugin(response)) await cache.put(request, response.clone());
  postPerfMetric('cache', {
    result: 'miss',
    cacheName,
    url: new URL(request.url).pathname,
    duration: Math.round(performance.now() - start),
    status: response.status
  });
  return response;
}

/* ── Strategy: Network First (Navigation with preload) ──── */
async function networkFirstNavigation(request, event) {
  const start = performance.now();

  /* Use navigation preload response if available */
  if (event.preloadResponse) {
    try {
      const preloadResponse = await event.preloadResponse;
      if (preloadResponse && preloadResponse.ok) {
        postPerfMetric('navigation', {
          source: 'preload',
          url: new URL(request.url).pathname,
          duration: Math.round(performance.now() - start)
        });
        return preloadResponse;
      }
    } catch (_error) {
      // Preload response failed — fall through to normal fetch.
    }
  }

  try {
    const response = await fetch(new Request(request, { cache: 'reload' }));
    return response;
  } catch (_error) {
    postPerfMetric('offline_fallback_latency', {
      url: new URL(request.url).pathname,
      duration: Math.round(performance.now() - start)
    });

    /* Try cache for previously visited pages */
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    return caches.match(OFFLINE_URL) || Response.error();
  }
}

/* ── Strategy: Stale-While-Revalidate (API calls) ───────── */
async function staleWhileRevalidate(request, cacheName) {
  const start = performance.now();
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  /* Fire-and-forget network request to update cache in background */
  const fetchPromise = fetch(new Request(request, { cache: 'reload' }))
    .then((networkResponse) => {
      if (isCacheableWithPlugin(networkResponse)) {
        cache.put(request, networkResponse.clone());
      }
      postPerfMetric('cache', {
        result: cached ? 'revalidated' : 'miss',
        cacheName,
        url: new URL(request.url).pathname,
        duration: Math.round(performance.now() - start),
        status: networkResponse.status
      });
      return networkResponse;
    })
    .catch(() => null);

  /* Return cached immediately if available, otherwise wait for network */
  if (cached) {
    postPerfMetric('cache', {
      result: 'hit',
      cacheName,
      url: new URL(request.url).pathname,
      duration: Math.round(performance.now() - start),
      strategy: 'stale-while-revalidate'
    });
    return cached;
  }

  const networkResponse = await fetchPromise;
  if (networkResponse) return networkResponse;

  /* Both cache and network failed → API fallback */
  postPerfMetric('cache', {
    result: 'miss',
    cacheName,
    url: new URL(request.url).pathname,
    duration: Math.round(performance.now() - start),
    fallback: true
  });
  return apiFallback(request);
}

/* ── Strategy: Network First (API mutations) ─────────────── */
async function networkFirstApi(request) {
  const start = performance.now();
  const cache = await caches.open(API_CACHE);

  try {
    const response = await fetch(new Request(request, { cache: 'reload' }));
    if (isCacheable(response)) await cache.put(request, response.clone());
    postPerfMetric('cache', {
      result: 'miss',
      cacheName: API_CACHE,
      url: new URL(request.url).pathname,
      duration: Math.round(performance.now() - start),
      status: response.status
    });
    return response;
  } catch (_error) {
    const cached = await cache.match(request);
    if (cached) {
      postPerfMetric('cache', {
        result: 'hit',
        cacheName: API_CACHE,
        url: new URL(request.url).pathname,
        duration: Math.round(performance.now() - start)
      });
      return cached;
    }
    postPerfMetric('cache', {
      result: 'miss',
      cacheName: API_CACHE,
      url: new URL(request.url).pathname,
      duration: Math.round(performance.now() - start),
      fallback: true
    });
    return apiFallback(request);
  }
}

async function networkFirstApprovalMutation(request) {
  try {
    return await fetch(request.clone());
  } catch (_error) {
    const queued = await queueApprovalMutation(request.clone());
    await registerApprovalSync();

    return jsonResponse({
      queued: true,
      offline: true,
      queueId: queued.id,
      status: 'queued_offline',
      message: 'تم حفظ قرار الموافقة محلياً وسيتم إرساله تلقائياً عند عودة الاتصال.'
    }, 202);
  }
}

async function networkFirstApiMutation(request) {
  try {
    return await fetch(request.clone());
  } catch (_error) {
    return apiFallback(request);
  }
}

/* ── API Fallback Responses ─────────────────────────────── */
function apiFallback(request) {
  const url = new URL(request.url);
  if (url.pathname.endsWith('/approvals')) {
    return jsonResponse({
      offline: true,
      pending: [],
      recent: [],
      total: 0,
      summary: { totalPending: 0, criticalCount: 0, highCount: 0, completedToday: 0 }
    });
  }

  if (url.pathname.endsWith('/stats')) {
    return jsonResponse({
      offline: true,
      totalRequests: 0,
      pendingApproval: 0,
      avgRisk: 0,
      piiDetectionRate: 0,
      complianceRate: 0,
      statusDistribution: {},
      riskLevels: {},
      latestTraces: []
    });
  }

  return jsonResponse({
    offline: true,
    error: 'الاتصال غير متاح حالياً. يعرض BrightAI Kernel نسخة offline عند توفرها.',
    errorCode: 'KERNEL_OFFLINE'
  }, 503);
}

/* ════════════════════════════════════════════════════════════
   IndexedDB — Pending Approvals Queue
   ════════════════════════════════════════════════════════════ */

async function queueApprovalMutation(request) {
  const body = await request.clone().text().catch(() => '');
  const headers = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    url: request.url,
    method: request.method,
    headers,
    body,
    createdAt: Date.now()
  };

  const db = await openDatabase();
  await putStoreItem(db, APPROVAL_STORE, item);
  return item;
}

async function replayPendingApprovals() {
  const db = await openDatabase();
  const queued = await getAllStoreItems(db, APPROVAL_STORE);
  const completed = [];

  for (const item of queued) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body || undefined
      });

      if (response.ok) completed.push(item.id);
    } catch (_error) {
      break;
    }
  }

  await Promise.all(completed.map((id) => deleteStoreItem(db, APPROVAL_STORE, id)));
  if (completed.length) {
    await showKernelNotification('تمت مزامنة موافقات BrightAI Kernel', {
      body: `تم إرسال ${completed.length} قرار معلّق بعد عودة الاتصال.`,
      tag: 'brightai-kernel-sync-complete',
      data: { url: '/kernel/approvals/' }
    });
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(APPROVAL_STORE)) db.createObjectStore(APPROVAL_STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function putStoreItem(db, storeName, item) {
  return storeTransaction(db, storeName, 'readwrite', (store) => store.put(item));
}

function deleteStoreItem(db, storeName, id) {
  return storeTransaction(db, storeName, 'readwrite', (store) => store.delete(id));
}

function getAllStoreItems(db, storeName) {
  return storeTransaction(db, storeName, 'readonly', (store) => store.getAll());
}

function storeTransaction(db, storeName, mode, callback) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const request = callback(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function registerApprovalSync() {
  if (!('sync' in self.registration)) return;
  try {
    await self.registration.sync.register(APPROVAL_SYNC_TAG);
  } catch (_error) {
    await replayPendingApprovals();
  }
}

/* ════════════════════════════════════════════════════════════
   Utilities
   ════════════════════════════════════════════════════════════ */

function readPushPayload(event) {
  if (!event.data) return {};
  try {
    return event.data.json();
  } catch (_error) {
    return { body: event.data.text() };
  }
}

function showKernelNotification(title, options = {}) {
  if (!self.registration.showNotification) return Promise.resolve();
  return self.registration.showNotification(title, {
    icon: '/frontend/images/android-chrome-192x192.png',
    badge: '/frontend/images/android-chrome-192x192.png',
    ...options
  });
}

function postPerfMetric(name, payload = {}) {
  if (!self.clients?.matchAll) return;
  self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: 'KERNEL_PWA_PERF',
          metric: {
            name,
            timestamp: Date.now(),
            ...payload
          }
        });
      });
    })
    .catch(() => {});
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
