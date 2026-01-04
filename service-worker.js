// BrightAI Service Worker - Optimized for Saudi SEO & Performance
// Version: 3.0.0 (PWA Enhancement with improved cache strategy)
// Requirements: 8.1, 8.2, 8.3 - PWA Support

// Cache Configuration
const CACHE_VERSION = '3.0.0';
const CACHE_NAME = `brightai-saudi-v${CACHE_VERSION}`;
const STATIC_CACHE = `brightai-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `brightai-dynamic-v${CACHE_VERSION}`;

// Critical resources to cache on install (Requirements 8.2)
// These are essential for offline functionality
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/our-products.html',
    '/ai-bots.html',
    '/consultation.html',
    '/data-analysis.html',
    '/smart-automation.html',
    '/contact.html',
    '/about-us.html',
    '/blog.html',
    '/health-bright.html',
    '/style.css',
    '/script.js',
    '/chatbot.css',
    '/chatbot.js',
    '/smart-search.css',
    '/smart-search.js',
    '/theme-controller.js',
    '/scroll-animations.js',
    '/particle-system.js',
    '/background.css',
    '/background.js',
    '/manifest.json',
    '/sitemap.xml',
    '/robots.txt',
    '/schema-saudi-seo.json'
];

// External resources to cache
const EXTERNAL_RESOURCES = [
    'https://www2.0zz0.com/2025/06/23/22/317775783.png', // Logo
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap'
];

// Combined resources for initial cache
const SAUDI_RESOURCES = [...CRITICAL_RESOURCES, ...EXTERNAL_RESOURCES];

// Saudi cities and keywords for enhanced caching
const SAUDI_KEYWORDS = [
    'الرياض', 'جدة', 'الدمام', 'الخبر', 'مكة', 'المدينة المنورة',
    'الذكاء الاصطناعي', 'شركة مُشرقة AI', 'AI السعودية', 'رؤية 2030'
];

// Install event - Cache critical resources (Requirements 8.1, 8.2)
self.addEventListener('install', event => {
    console.log('[SW] Installing BrightAI service worker v' + CACHE_VERSION);
    event.waitUntil(
        Promise.all([
            // Cache static resources
            caches.open(STATIC_CACHE).then(cache => {
                console.log('[SW] Caching critical resources...');
                // Use addAll for critical resources, but handle failures gracefully
                return cache.addAll(CRITICAL_RESOURCES).catch(err => {
                    console.warn('[SW] Some critical resources failed to cache:', err);
                    // Try to cache resources individually
                    return Promise.all(
                        CRITICAL_RESOURCES.map(url => 
                            cache.add(url).catch(e => console.warn('[SW] Failed to cache:', url, e))
                        )
                    );
                });
            }),
            // Cache external resources separately (may fail due to CORS)
            caches.open(STATIC_CACHE).then(cache => {
                return Promise.all(
                    EXTERNAL_RESOURCES.map(url =>
                        fetch(url, { mode: 'cors' })
                            .then(response => {
                                if (response.ok) {
                                    return cache.put(url, response);
                                }
                            })
                            .catch(e => console.warn('[SW] External resource failed:', url, e))
                    )
                );
            }),
            // Initialize dynamic cache
            caches.open(DYNAMIC_CACHE)
        ]).then(() => {
            console.log('[SW] Installation complete, skipping waiting...');
            return self.skipWaiting();
        })
    );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating BrightAI service worker v' + CACHE_VERSION);
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    // Delete old caches that don't match current version
                    if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Claiming clients...');
            return self.clients.claim();
        })
    );
});

// Fetch event - Serve cached content when offline (Requirements 8.3)
// Strategy: Cache-first for static assets, Network-first for HTML
self.addEventListener('fetch', event => {
    const req = event.request;
    const url = new URL(req.url);

    // Only handle GET requests
    if (req.method !== 'GET') return;

    // Allow only same-origin + whitelisted externals
    if (url.origin !== location.origin &&
        !url.hostname.includes('fonts.googleapis.com') &&
        !url.hostname.includes('fonts.gstatic.com') &&
        !url.hostname.includes('0zz0.com')) {
        return;
    }

    // Determine cache strategy based on request type
    const isNavigationRequest = req.mode === 'navigate';
    const isStaticAsset = isStaticResource(req.url);

    event.respondWith((async () => {
        try {
            if (isStaticAsset) {
                // Cache-first strategy for static assets
                const cached = await caches.match(req);
                if (cached) {
                    // Return cached version, update cache in background
                    updateCacheInBackground(req);
                    return cached;
                }
            }

            // Network-first for HTML/navigation requests
            if (isNavigationRequest) {
                try {
                    const networkResp = await fetch(req);
                    if (networkResp && networkResp.ok) {
                        // Cache the response for offline use
                        const clone = networkResp.clone();
                        caches.open(DYNAMIC_CACHE).then(c => c.put(req, clone));
                        return addSEOHeaders(networkResp, req);
                    }
                } catch (networkError) {
                    // Network failed, try cache
                    const cached = await caches.match(req);
                    if (cached) {
                        return addSEOHeaders(cached, req);
                    }
                    // Return offline fallback
                    return getOfflineFallback();
                }
            }

            // Try cache first
            const cached = await caches.match(req);
            if (cached) {
                return cached;
            }

            // Try network
            const networkResp = await fetch(req);
            if (networkResp && networkResp.ok) {
                const clone = networkResp.clone();
                const cacheName = isStaticAsset ? STATIC_CACHE : DYNAMIC_CACHE;
                caches.open(cacheName).then(c => c.put(req, clone));
                return networkResp;
            }

            // Fallback for failed requests
            return new Response('<h1>غير متصل</h1><p>يرجى التحقق من اتصالك بالإنترنت</p>', {
                status: 503,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });

        } catch (err) {
            console.error('[SW] Fetch failed:', req.url, err);

            // Offline fallback for HTML
            if (req.headers.get('accept')?.includes('text/html')) {
                return getOfflineFallback();
            }

            // Generic fallback
            return new Response(null, { status: 504, statusText: 'Gateway Timeout' });
        }
    })());
});

// Add SEO headers to HTML responses
function addSEOHeaders(response, req) {
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
    return response;
}

// Get offline fallback page
async function getOfflineFallback() {
    const cached = await caches.match('/index.html');
    if (cached) {
        return cached;
    }
    return new Response(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>غير متصل - مُشرقة AI</title>
            <style>
                body { font-family: 'Tajawal', sans-serif; background: #0A192F; color: #8892B0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
                .container { padding: 2rem; }
                h1 { color: #64FFDA; font-size: 2rem; margin-bottom: 1rem; }
                p { font-size: 1.1rem; margin-bottom: 1.5rem; }
                button { background: #64FFDA; color: #0A192F; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem; font-family: inherit; }
                button:hover { opacity: 0.9; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>أنت غير متصل بالإنترنت</h1>
                <p>يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى</p>
                <button onclick="location.reload()">إعادة المحاولة</button>
            </div>
        </body>
        </html>
    `, {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// Update cache in background (stale-while-revalidate)
function updateCacheInBackground(req) {
    fetch(req).then(response => {
        if (response && response.ok) {
            const cacheName = isStaticResource(req.url) ? STATIC_CACHE : DYNAMIC_CACHE;
            caches.open(cacheName).then(cache => cache.put(req, response));
        }
    }).catch(() => {
        // Silently fail - we already served from cache
    });
}

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

console.log('[SW] BrightAI Saudi-optimized Service Worker v' + CACHE_VERSION + ' loaded');