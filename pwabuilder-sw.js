const CACHE_NAME = 'artisan-connect-cache-v9';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'metadata.json',
  'index.tsx',
  'App.tsx',
  'types.ts',
  'constants.ts',
  'components/icons.tsx',
  'components/StarRating.tsx',
  'components/ArtisanCard.tsx',
  'components/ArtisanProfileModal.tsx',
  'components/FilterPanel.tsx',
  'components/SplashScreen.tsx',
  'components/icon.svg',
  'maskable-icon.svg',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'icons/maskable_icon.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;500;700&family=Cairo:wght@900&display=swap',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client'
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
            // Check if we received a valid response.
            // A response with status 0 is an opaque response for a third-party resource, which we want to cache.
            if(!response || (response.status !== 200 && response.status !== 0)) {
              return response;
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
