// This is the service worker with the combined offline experience (Offline page + Offline copy of pages)
// Based on the user's provided template, with necessary corrections for a robust offline experience.

const CACHE = "pwabuilder-offline-page";

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const offlineFallbackPage = "/index.html";

// A more comprehensive list of assets to cache for a full offline experience.
const assetsToCache = [
  // Core files
  '/',
  offlineFallbackPage,
  '/manifest.json',
  
  // Scripts
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',

  // Components
  '/components/ArtisanCard.tsx',
  '/components/ArtisanProfileModal.tsx',
  '/components/FilterPanel.tsx',
  '/components/icons.tsx',
  '/components/SplashScreen.tsx',
  '/components/StarRating.tsx',
  
  // Icons and Images
  '/icon.svg',
  '/maskable-icon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/screenshot-desktop.svg',
  '/screenshot-mobile.svg',

  // External assets
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;500;700&family=Cairo:wght@900&display=swap',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client'
];


self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => {
        console.log('Caching offline fallback page and essential assets');
        return cache.addAll(assetsToCache);
      })
      .catch(err => {
        console.error('Failed to cache assets during install:', err);
      })
  );
});

// Clean up old caches on activation
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE];
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

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// StaleWhileRevalidate for all requests. The manual fetch listener below will override for navigation.
workbox.routing.registerRoute(
  new RegExp('.*'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE
  })
);

// Network-first with offline fallback for navigation requests
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;
        if (preloadResp) {
          return preloadResp;
        }

        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {
        console.log('Fetch failed for navigation; returning offline page.', error);
        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
});