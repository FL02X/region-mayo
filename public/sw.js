const VERSION = "v7";
const STATIC_CACHE = `rm-static-${VERSION}`;
const DATA_CACHE = `rm-data-${VERSION}`;
const IMAGE_CACHE = `rm-images-${VERSION}`;
const OFFLINE_URL = "/offline";
const IMAGE_FALLBACK_URL = "/placeholder.svg";
const PRECACHE_ROUTES = [
  "/",
  "/offline",
  IMAGE_FALLBACK_URL,
  "/templos",
  "/pastores",
  "/coros",
  "/directiva",
  "/buscar",
  "/configuracion",
  "/instalar",
];
const DEV_HOSTS = new Set(["localhost", "127.0.0.1"]);
const IS_DEV_HOST = DEV_HOSTS.has(self.location.hostname);
const MAX_MOBILE_IMAGE_WIDTH = 828;

self.addEventListener("install", (event) => {
  if (!IS_DEV_HOST) {
    event.waitUntil(
      caches.open(STATIC_CACHE).then(async (cache) => {
        await Promise.allSettled(
          PRECACHE_ROUTES.map(async (route) => {
            try {
              const response = await fetch(route, { credentials: "same-origin" });
              if (isCacheableResponse(response)) {
                await cache.put(route, response);
              }
            } catch (error) {
              // Avoid blocking install if any single route fails.
            }
          }),
        );
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

const isCacheableResponse = (response) =>
  response && (response.ok || response.type === "opaque");

const isApiRequest = (url, request) =>
  url.pathname.startsWith("/api/") ||
  url.hostname.endsWith("sanity.io") ||
  request.headers.get("accept")?.includes("application/json");

const isImageRequest = (url, request) =>
  request.destination === "image" ||
  url.pathname.startsWith("/_next/image") ||
  /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname) ||
  (url.hostname === "cdn.sanity.io" && url.pathname.includes("/images/"));

const isBypassRequest = (url) =>
  url.searchParams.has("pwa-estimate") ||
  url.pathname.startsWith("/api/prayers") ||
  url.pathname.startsWith("/api/register") ||
  url.pathname.startsWith("/api/download-himnario") ||
  url.pathname.startsWith("/studio");

const isAlbumRoute = (url) => url.pathname === "/album" || url.pathname.startsWith("/album/");

const getReferrerUrl = (request) => {
  try {
    return request.referrer ? new URL(request.referrer) : null;
  } catch {
    return null;
  }
};

const isFromAlbum = (request) => {
  const referrerUrl = getReferrerUrl(request);
  return !!referrerUrl && referrerUrl.origin === self.location.origin && isAlbumRoute(referrerUrl);
};

const isDesktopSizedImage = (url) => {
  const width = Number(url.searchParams.get("w") || "");
  return Number.isFinite(width) && width > MAX_MOBILE_IMAGE_WIDTH;
};

async function imageFallbackResponse() {
  const fallback = await caches.match(IMAGE_FALLBACK_URL, { ignoreSearch: true });
  if (fallback) return fallback;
  return new Response("", { status: 204 });
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (cacheName === IMAGE_CACHE) {
      return imageFallbackResponse();
    }
    throw error;
  }
}

async function networkOnlyWithFallback(request, fallbackUrl) {
  try {
    return await fetch(request);
  } catch (error) {
    if (isImageRequest(new URL(request.url), request)) {
      return imageFallbackResponse();
    }
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl, { ignoreSearch: true });
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function networkFirstWithCacheFallback(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
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
      if (isCacheableResponse(response)) {
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

  if (isAlbumRoute(url) || isFromAlbum(request)) {
    event.respondWith(networkOnlyWithFallback(request, isHtmlRequest(request) ? OFFLINE_URL : undefined));
    return;
  }

  if (isHtmlRequest(request)) {
    event.respondWith(networkFirstWithCacheFallback(request, STATIC_CACHE, OFFLINE_URL));
    return;
  }

  if (isImageRequest(url, request)) {
    if (isDesktopSizedImage(url)) {
      event.respondWith(networkOnlyWithFallback(request));
      return;
    }
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
