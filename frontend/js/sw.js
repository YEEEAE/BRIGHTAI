const CACHE_NAME = 'bright-ai-cache-v1';
const urlsToCache = [
    '/',
    '/our-products.css',
    '/our-products.js',
    '/images/',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
