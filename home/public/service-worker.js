const CACHE_NAME = 'projects-app-v3';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './img/winged_star.png',
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys =>
                Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Only handle plain http(s) GET requests - the Cache API rejects anything else
    // (e.g. a browser extension's own chrome-extension:// requests can end up here).
    if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
        return;
    }

    // Never cache API calls - links data must stay fresh.
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Network-first: always serve the latest version when online, and fall
    // back to the cache only when offline. Avoids ever needing to remember
    // to bump CACHE_NAME just because a cached file's content changed.
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
