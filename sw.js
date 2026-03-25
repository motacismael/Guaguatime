const CACHE_NAME = 'guaguatime-v1';
const ASSETS = [
    '/', '/index.html', '/css/styles.css',
    '/js/app.js', '/js/calculator.js', '/js/dataLoader.js',
    '/js/routeFinder.js', '/js/ui.js', '/js/favorites.js', '/js/utils.js',
    '/data/sectores.json', '/data/rutas.json', '/data/condiciones.json',
    '/manifest.json'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(res => {
                if (!res || res.status !== 200 || res.type !== 'basic') return res;
                const clone = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                return res;
            });
        }).catch(() => new Response('Sin conexión', { status: 503 }))
    );
});
