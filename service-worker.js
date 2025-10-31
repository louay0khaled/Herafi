
const CACHE_NAME = 'artisan-connect-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon.svg',
  '/maskable-icon.svg',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/components/icons.tsx',
  '/components/StarRating.tsx',
  '/components/ArtisanCard.tsx',
  '/components/ArtisanProfileModal.tsx',
  '/components/FilterPanel.tsx',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;500;700&display=swap',
  'https://fonts.gstatic.com/s/tajawal/v9/Iura6YBwB5j_7_j23J-h-JM53g.woff2', // Pre-caching fonts
  'https://fonts.gstatic.com/s/amiri/v20/J7acnpd8CGxBHpU2iL_S-Q.woff2'
];

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use addAll with a new Request object with cache: 'reload' to bypass HTTP cache
        const requests = urlsToCache.map(url => new Request(url, { cache: 'reload' }));
        return cache.addAll(requests);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              if (event.request.url.startsWith('https://aistudiocdn.com')) {
                 // Don't cache opaque responses from CDNs
                 return response;
              }
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});


self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});