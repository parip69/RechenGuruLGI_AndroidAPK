const CACHE_NAME = 'rechenguru-lgi-v107';
const CACHE_PREFIX = 'rechenguru-lgi-v';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './version.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

function isCacheable(response) {
  return Boolean(response && response.status === 200 && response.type !== 'opaque');
}

function versionOfCache(name) {
  const match = String(name || '').match(/^rechenguru-lgi-v(\d+)$/);
  return match ? Number(match[1]) : -1;
}

async function findLegacyCache() {
  const keys = await caches.keys();
  return keys
    .filter(key => key !== CACHE_NAME && versionOfCache(key) >= 0)
    .sort((a, b) => versionOfCache(b) - versionOfCache(a))[0] || '';
}

async function fetchFresh(url) {
  const target = new URL(url, self.registration.scope);
  target.searchParams.set('_install', String(Date.now()));
  const response = await fetch(target.toString(), { cache: 'no-store' });
  if (!isCacheable(response)) {
    throw new Error('HTTP ' + (response ? response.status : '?') + ' bei ' + url);
  }
  return response;
}

async function refreshInstalledShell() {
  const cache = await caches.open(CACHE_NAME);
  for (const url of PRECACHE_URLS) {
    const response = await fetchFresh(url);
    await cache.put(url, response.clone());
  }
}

// Eine neue Version wird nicht automatisch installiert: Beim Wechsel wird die bisher
// installierte Version uebernommen, bis der Nutzer bewusst aktualisiert.
async function ensureInstalledShell() {
  const cache = await caches.open(CACHE_NAME);
  if (await cache.match('./index.html', { ignoreSearch: true })) return;

  const legacyName = await findLegacyCache();
  if (legacyName) {
    const legacy = await caches.open(legacyName);
    const index = await legacy.match('./index.html', { ignoreSearch: true });
    if (index) {
      for (const url of PRECACHE_URLS) {
        const stored = await legacy.match(url, { ignoreSearch: true });
        if (stored) await cache.put(url, stored.clone());
      }
      return;
    }
  }

  await refreshInstalledShell();
}

function reply(event, payload) {
  try {
    if (event.ports && event.ports[0]) event.ports[0].postMessage(payload);
  } catch (_) {}
}

self.addEventListener('message', event => {
  const data = event.data || {};

  if (data.type === 'APPLY_UPDATE') {
    event.waitUntil(
      refreshInstalledShell()
        .then(() => reply(event, { ok: true }))
        .catch(error => reply(event, { ok: false, error: error && error.message || String(error) }))
    );
    return;
  }

  if (data.type === 'APPLY_UPDATE_AND_ACTIVATE' || data.type === 'SKIP_WAITING') {
    event.waitUntil(
      refreshInstalledShell()
        .then(async () => {
          reply(event, { ok: true });
          await self.skipWaiting();
        })
        .catch(error => reply(event, { ok: false, error: error && error.message || String(error) }))
    );
  }
});

self.addEventListener('install', event => {
  event.waitUntil(ensureInstalledShell());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await ensureInstalledShell();
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

async function shellFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) await cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // APKs sind Downloads, keine App-Navigation. Niemals durch die HTML-Shell ersetzen.
  if (/\.apk$/i.test(url.pathname)) return;

  // Versionspruefung: immer direkt vom Server, nie in den installierten Cache schreiben.
  if (url.searchParams.has('update-check') || url.searchParams.has('_install')) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const installed =
          (await cache.match('./index.html', { ignoreSearch: true })) ||
          (await cache.match('./', { ignoreSearch: true }));
        return installed || fetch(request);
      })
    );
    return;
  }

  event.respondWith(shellFirst(request));
});
