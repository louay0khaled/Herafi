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
  '/components/PwaFeaturesModal.tsx',
  
  // Icons and Images
  '/icon.png',
  '/maskable-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/screenshot-desktop.png',
  '/screenshot-mobile.png',
  '/widget-screenshot.png',

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

// -- PWA FEATURES --

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'add-review-sync') {
    console.log('Service Worker: Background sync event triggered.');
    event.waitUntil(
      self.registration.showNotification('تمت المزامنة!', {
        body: 'تمت مزامنة بياناتك في الخلفية بنجاح.',
        icon: '/icon-192.png'
      })
    );
  }
});

// Periodic Sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'get-latest-artisans') {
    console.log('Service Worker: Periodic sync event triggered.');
    event.waitUntil(
      self.registration.showNotification('تحديثات جديدة!', {
        body: 'تم البحث عن حرفيين جدد في منطقتك.',
        icon: '/icon-192.png'
      })
    );
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  let data = { title: 'رسالة جديدة', body: 'لديك إشعار جديد من تطبيق حرفي.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Push event data is not valid JSON', e);
    }
  }
  
  const title = data.title;
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon.svg'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});


// -- WORKBOX ROUTING --

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Share Target Route: Intercepts POST requests from the share action.
workbox.routing.registerRoute(
  ({url, request}) => url.pathname === '/share-target' && request.method === 'POST',
  async ({event}) => {
    const formData = await event.request.formData();
    const text = formData.get('text') || '';
    const title = formData.get('title') || '';
    // Redirect to the main page with shared data in query params
    const redirectUrl = `/?shared_title=${encodeURIComponent(title)}&shared_text=${encodeURIComponent(text)}`;
    return Response.redirect(redirectUrl, 303);
  }
);

// Widget Data Route: Serves JSON data for the PWA widget.
workbox.routing.registerRoute(
  ({url}) => url.pathname === '/widget-data.json',
  () => {
    // In a real app, this would fetch dynamic data. Here we use mock data.
    const mockData = {
      "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
      "type": "AdaptiveCard",
      "version": "1.5",
      "body": [
        {
          "type": "TextBlock",
          "text": "أحمد النجار",
          "weight": "bolder",
          "size": "medium"
        },
        {
          "type": "TextBlock",
          "text": "نجّار",
          "isSubtle": true,
          "spacing": "none"
        }
      ]
    };
    return new Response(JSON.stringify(mockData), { headers: { 'Content-Type': 'application/json' } });
  }
);

// Navigation Route: Network first, then cache, with an offline fallback.
workbox.routing.registerRoute(
  ({request}) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
      }),
      {
        handlerDidError: async () => {
          return await caches.match(offlineFallbackPage);
        }
      }
    ],
  })
);

// Default Route for assets: Stale-while-revalidate for fast responses.
workbox.routing.registerRoute(
  ({request}) => ['style', 'script', 'worker', 'font', 'image'].includes(request.destination),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE
  })
);