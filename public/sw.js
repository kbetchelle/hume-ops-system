// HUME Ops System Service Worker
const CACHE_NAME = 'hume-ops-v1';
const STATIC_CACHE_NAME = 'hume-ops-static-v1';
const DYNAMIC_CACHE_NAME = 'hume-ops-dynamic-v1';

// Static assets to cache immediately (app shell)
const STATIC_ASSETS_BASE = [
  '/',
  '/manifest.json',
  // Note: Vite-generated assets will be automatically cached via precache
];

// On Lovable host, /manifest.json redirects to auth-bridge and causes CORS; skip caching it
function getStaticAssets() {
  try {
    var origin = self.location && self.location.origin ? self.location.origin : '';
    if (origin.indexOf('lovableproject.com') !== -1 || origin.indexOf('lovable.app') !== -1) {
      return STATIC_ASSETS_BASE.filter(function (url) { return url !== '/manifest.json'; });
    }
  } catch (e) {}
  return STATIC_ASSETS_BASE;
}

// API routes to cache dynamically
const API_CACHE_PATTERNS = [
  /\/rest\/v1\/checklist_templates/,
  /\/rest\/v1\/checklist_items/,
  /\/rest\/v1\/staff_accounts/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  var toCache = getStaticAssets();

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(toCache);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Remove old versions of our caches
              return name.startsWith('hume-ops-') && 
                     name !== STATIC_CACHE_NAME && 
                     name !== DYNAMIC_CACHE_NAME;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests except for Supabase
  if (url.origin !== self.location.origin && !url.hostname.includes('supabase')) {
    return;
  }

  // Strategy: Network first for API calls, cache fallback
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
    return;
  }

  // Strategy: Cache first for static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
    return;
  }

  // Strategy: Network first for HTML pages
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, STATIC_CACHE_NAME));
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
});

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Cache-first fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache...');
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline page for navigation requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/');
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      })
    );
  }
});

// Background sync for offline uploads
self.addEventListener('sync', (event) => {
  if (event.tag === 'upload-pending') {
    event.waitUntil(processPendingUploads());
  }
});

async function processPendingUploads() {
  // This will be triggered when connectivity is restored
  // The actual upload logic is handled by the useOfflineQueue hook
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_PENDING_UPLOADS' });
  });
}

console.log('[SW] Service worker loaded');
