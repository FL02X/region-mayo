const VERSION = "v4";
const STATIC_CACHE = `rm-static-${VERSION}`;
const PAGE_CACHE = `rm-pages-${VERSION}`;
const DATA_CACHE = `rm-data-${VERSION}`;
const IMAGE_CACHE = `rm-images-${VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE_ROUTES = [
  "/",
  "/offline",
  "/templos",
  "/coros",
  "/album",
  "/directorio",
  "/directiva",
];
const DEV_HOSTS = new Set(["localhost", "127.0.0.1"]);
const IS_DEV_HOST = DEV_HOSTS.has(self.location.hostname);

self.addEventListener("install", (event) => {
  if (!IS_DEV_HOST) {
    event.waitUntil(
      caches.open(STATIC_CACHE).then(async (cache) => {
        try {
          await cache.addAll(PRECACHE_ROUTES);
        } catch (error) {
          // Avoid blocking install if any precache request fails.
        }
      }),
    );
  }
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("rm-") && !key.endsWith(VERSION))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

const isHtmlRequest = (request) =>
  request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");

const isApiRequest = (url, request) =>
  url.pathname.startsWith("/api/") ||
  url.hostname.endsWith("sanity.io") ||
  request.headers.get("accept")?.includes("application/json");

const isBypassRequest = (url) =>
  url.pathname.startsWith("/api/prayers") ||
  url.pathname.startsWith("/api/register") ||
  url.pathname.startsWith("/api/download-himnario") ||
  url.pathname.startsWith("/studio");

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl, { ignoreSearch: true });
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  return cached || fetchPromise;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (IS_DEV_HOST) {
    return;
  }

  if (request.method !== "GET") return;
  if (request.cache === "only-if-cached" && request.mode !== "same-origin" && request.mode !== "navigate") {
    return;
  }

  const url = new URL(request.url);

  if (isBypassRequest(url)) {
    return;
  }

  if (isHtmlRequest(request)) {
    event.respondWith(networkFirst(request, PAGE_CACHE, OFFLINE_URL));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (["style", "script", "font", "worker"].includes(request.destination)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isApiRequest(url, request)) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});
