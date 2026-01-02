// BrightAI Service Worker - Optimized for Saudi SEO & Performance
// Version: 2.2.1 (fix fetch errors for Safari)

const CACHE_NAME = 'brightai-saudi-v2.2.1';
const STATIC_CACHE = 'brightai-static-v2.2.1';
const DYNAMIC_CACHE = 'brightai-dynamic-v2.2.1';

// Saudi-specific resources to cache
const SAUDI_RESOURCES = [
    '/',
    '/index.html',
    '/our-products.html',
    '/ai-bots.html',
    '/consultation.html',
    '/data-analysis.html',
    '/smart-automation.html',
    '/contact.html',
    '/about-us.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/sitemap.xml',
    '/robots.txt',
    '/schema-saudi-seo.json',
    'https://www2.0zz0.com/2025/06/23/22/317775783.png', // Logo
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap'
];

// Saudi cities and keywords for enhanced caching
const SAUDI_KEYWORDS = [
    'الرياض', 'جدة', 'الدمام', 'الخبر', 'مكة', 'المدينة المنورة',
    'الذكاء الاصطناعي', 'شركة مُشرقة AI', 'AI السعودية', 'رؤية 2030'
];

// Install event
self.addEventListener('install', event => {
    console.log('[SW] Installing Saudi-optimized service worker...');
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then(cache => cache.addAll(SAUDI_RESOURCES)),
            caches.open(DYNAMIC_CACHE)
        ]).then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(key => {
                if (![STATIC_CACHE, DYNAMIC_CACHE].includes(key)) {
                    return caches.delete(key);
                }
            }))
        ).then(() => self.clients.claim())
    );
});

// ✅ Fixed Fetch event
self.addEventListener('fetch', event => {
    const req = event.request;
    const url = new URL(req.url);

    if (req.method !== 'GET') return;

    // Allow only same-origin + whitelisted externals
    if (url.origin !== location.origin &&
        !url.hostname.includes('fonts.googleapis.com') &&
        !url.hostname.includes('fonts.gstatic.com') &&
        !url.hostname.includes('0zz0.com')) {
        return;
    }

    event.respondWith((async () => {
        try {
            // 1. Try cache
            const cached = await caches.match(req);
            if (cached) {
                const response = cached.clone();
                // Add SEO headers if HTML
                if (req.url.includes('.html') || req.mode === 'navigate') {
                    const headers = new Headers(response.headers);
                    headers.set('X-Saudi-SEO', 'Optimized');
                    headers.set('X-Content-Region', 'Saudi Arabia');
                    headers.set('X-Service-Cities', SAUDI_KEYWORDS.slice(0, 6).join(', '));
                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers
                    });
                }
                return cached;
            }

            // 2. Try network
            const networkResp = await fetch(req);
            if (networkResp && networkResp.ok) {
                const clone = networkResp.clone();
                const cacheName = isStaticResource(req.url) ? STATIC_CACHE : DYNAMIC_CACHE;
                caches.open(cacheName).then(c => c.put(req, clone));
                return networkResp;
            }

            // 3. Fallback if networkResp invalid
            return new Response('<h1>Offline</h1>', {
                status: 503,
                headers: { 'Content-Type': 'text/html' }
            });

        } catch (err) {
            console.error('[SW] fetch failed:', req.url, err);

            // Offline fallback for HTML
            if (req.headers.get('accept')?.includes('text/html')) {
                return caches.match('/index.html') ||
                       new Response('<h1>Offline</h1>', { status: 503 });
            }

            // Generic fallback
            return new Response(null, { status: 504, statusText: 'Gateway Timeout' });
        }
    })());
});

// Helper functions
function shouldCacheResource(url, contentType) {
    const saudiKeywordMatch = SAUDI_KEYWORDS.some(keyword =>
        url.includes(encodeURIComponent(keyword)) || url.toLowerCase().includes(keyword.toLowerCase())
    );
    if (saudiKeywordMatch) return true;

    if (isStaticResource(url)) return true;

    const cacheableTypes = [
        'text/html', 'text/css', 'application/javascript',
        'text/javascript', 'image/', 'font/', 'application/font'
    ];
    return cacheableTypes.some(type => contentType.includes(type));
}

function isStaticResource(url) {
    const exts = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2', '.ttf'];
    return exts.some(ext => url.includes(ext));
}

// Background sync
self.addEventListener('sync', event => {
    if (event.tag === 'saudi-analytics-sync') {
        event.waitUntil(syncSaudiAnalytics());
    }
});

async function syncSaudiAnalytics() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const analyticsData = await cache.match('/saudi-analytics-data');
        if (analyticsData) {
            const data = await analyticsData.json();
            await fetch('/api/saudi-analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, region: 'Saudi Arabia', cities: SAUDI_KEYWORDS.slice(0, 6), timestamp: Date.now() })
            });
            await cache.delete('/saudi-analytics-data');
            console.log('[SW] Saudi analytics data synced');
        }
    } catch (error) {
        console.error('[SW] analytics sync failed:', error);
    }
}

// Push notifications
self.addEventListener('push', event => {
    if (!event.data) return;
    const data = event.data.json();
    const options = {
        body: data.body || 'إشعار جديد من مُشرقة AI',
        icon: 'https://www2.0zz0.com/2025/06/23/22/317775783.png',
        badge: 'https://www2.0zz0.com/2025/06/23/22/317775783.png',
        dir: 'rtl',
        lang: 'ar-SA',
        tag: 'saudi-notification',
        requireInteraction: true,
        actions: [
            { action: 'view', title: 'عرض', icon: 'https://www2.0zz0.com/2025/06/23/22/317775783.png' },
            { action: 'dismiss', title: 'إغلاق' }
        ],
        data: { url: data.url || '/', region: 'Saudi Arabia' }
    };
    event.waitUntil(self.registration.showNotification(
        data.title || 'مُشرقة AI - الذكاء الاصطناعي السعودية',
        options
    ));
});

// Notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    if (event.action === 'view' || !event.action) {
        const url = event.notification.data?.url || '/';
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                for (const client of clientList) {
                    if (client.url === url && 'focus' in client) return client.focus();
                }
                if (clients.openWindow) return clients.openWindow(url);
            })
        );
    }
});

// Messages
self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
    if (event.data?.type === 'CACHE_SAUDI_CONTENT') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE).then(cache => cache.addAll(event.data.urls || []))
        );
    }
});

// Periodic sync
self.addEventListener('periodicsync', event => {
    if (event.tag === 'saudi-content-update') {
        event.waitUntil(updateSaudiContent());
    }
});

async function updateSaudiContent() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const files = ['/sitemap.xml', '/robots.txt', '/schema-saudi-seo.json'];
        for (const file of files) {
            try {
                const resp = await fetch(file);
                if (resp.ok) await cache.put(file, resp);
            } catch (e) {
                console.warn('[SW] Failed to update', file, e);
            }
        }
    } catch (err) {
        console.error('[SW] content update failed:', err);
    }
}

console.log('[SW] BrightAI Saudi-optimized Service Worker v2.2.1 loaded');