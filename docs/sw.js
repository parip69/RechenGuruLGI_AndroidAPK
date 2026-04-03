const CACHE_NAME = 'rechenguru-lgi-v40';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './version.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

function putResponseInCache(request, response) {
  if (!response || response.status !== 200 || response.type === 'opaque') {
    return response;
  }

  const copy = response.clone();
  caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return putResponseInCache(request, response);
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  return putResponseInCache(request, response);
}

function shouldUseNetworkFirst(request, url) {
  if (request.mode === 'navigate' || request.destination === 'document') {
    return true;
  }

  const pathname = url.pathname.toLowerCase();
  return (
    pathname.endsWith('/index.html') ||
    pathname.endsWith('/manifest.webmanifest') ||
    pathname.endsWith('/version.json')
  );
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (shouldUseNetworkFirst(request, url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
