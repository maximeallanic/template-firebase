// Minimal service worker for PWA installability
// This service worker enables the app to be installed as a PWA

const CACHE_NAME = 'spicy-vs-sweet-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Installed successfully');
        return self.skipWaiting(); // Activate immediately
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[Service Worker] Activated successfully');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - network first, fallback to cache for static assets only
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip caching for:
  // - API calls (Firebase, Cloud Functions)
  // - Non-GET requests
  // - Chrome extension requests
  // Use strict hostname matching to prevent bypass attacks
  const isGoogleAPI = url.hostname === 'googleapis.com' || 
                      url.hostname.endsWith('.googleapis.com');
  const isCloudFunction = url.hostname.endsWith('.cloudfunctions.net');
  
  if (
    event.request.method !== 'GET' ||
    isGoogleAPI ||
    isCloudFunction ||
    url.protocol === 'chrome-extension:' ||
    url.pathname.startsWith('/api/')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses for static assets
        if (response.status === 200) {
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch((error) => {
              console.warn('[Service Worker] Failed to cache response:', error);
            });
        }
        
        return response;
      })
      .catch(() => {
        // If fetch fails, try to return from cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Return a generic offline page or error
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});
