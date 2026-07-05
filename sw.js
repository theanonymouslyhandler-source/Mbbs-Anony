const CACHE_NAME = 'mbbs-anony-v4';

const urlsToCache = [
  './view.html',           // Main starting page
  './manifest.json',
  './logo.png',
  'https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore-compat.js'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - Stronger caching for start_url
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(event.request)
          .then(response => {
            // Cache important files
            if (response.ok && 
                (url.pathname.endsWith('.html') || 
                 url.pathname.endsWith('.json') || 
                 url.pathname.endsWith('.png') ||
                 url.pathname.includes('firebase'))) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
            }
            return response;
          })
          .catch(() => {
            // Offline - always serve view.html for navigation
            if (event.request.destination === 'document') {
              return caches.match('./view.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});
