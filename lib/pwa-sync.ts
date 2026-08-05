export const WARM_CACHE_ROUTES = [
  "/",
  "/templos",
  "/pastores",
  "/coros",
  "/directiva",
  "/directiva-dorcas",
  "/directiva-varones",
  "/buscar",
  "/configuracion",
];

export const LAST_SYNC_KEY = "rm-last-sync";
export const OFFLINE_BUNDLE_FALLBACK_BYTES = 5 * 1024 * 1024;
const PWA_CACHE_VERSION = "v11";
const STATIC_CACHE = `rm-static-${PWA_CACHE_VERSION}`;
const OFFLINE_REQUIRED_CACHE = `rm-required-${PWA_CACHE_VERSION}`;
const OFFLINE_SHELL_ASSET_URLS = ["/offline", "/placeholder.svg"];
const OFFLINE_REQUIRED_IMAGE_URLS = [
  "/images/region-mayo-logo-64.jpg",
  "/images/logo_hero.png",
  "/images/event-conference.jpg",
];
const UNKNOWN_ASSET_BYTES = 64 * 1024;

export function readLastSync(): number {
  if (typeof window === "undefined") return 0;
  const stored = window.localStorage.getItem(LAST_SYNC_KEY);
  return stored ? Number(stored) : 0;
}

export function writeLastSync(value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_SYNC_KEY, String(value));
}

export async function warmCacheRoutes(routes: string[] = WARM_CACHE_ROUTES) {
  await fetchAndCacheUrls(OFFLINE_SHELL_ASSET_URLS, STATIC_CACHE);

  const responses = await Promise.allSettled(
    routes.map(async (route) => {
      const response = await fetch(route, {
        cache: "reload",
        credentials: "same-origin",
      });
      const html = await response.clone().text().catch(() => "");
      await cacheResponse(route, response.clone(), STATIC_CACHE);
      return { route, html };
    }),
  );

  const assetUrls = new Set<string>();
  const requiredImageUrls = new Set<string>(
    OFFLINE_REQUIRED_IMAGE_URLS.map((url) => new URL(url, window.location.origin).href),
  );

  for (const result of responses) {
    if (result.status !== "fulfilled") continue;
    collectStaticAssetUrls(result.value.html, result.value.route, assetUrls);
    collectRequiredImageUrls(result.value.html, result.value.route, requiredImageUrls);
  }

  await fetchAndCacheUrls(Array.from(assetUrls), STATIC_CACHE);

  await fetchAndCacheUrls(Array.from(requiredImageUrls), OFFLINE_REQUIRED_CACHE);
}

export async function estimateOfflineBundleBytes(routes: string[] = WARM_CACHE_ROUTES): Promise<number> {
  if (typeof window === "undefined") return OFFLINE_BUNDLE_FALLBACK_BYTES;

  const responses = await Promise.allSettled(
    routes.map(async (route) => {
      const estimateUrl = new URL(route, window.location.origin);
      estimateUrl.searchParams.set("pwa-estimate", "1");
      const response = await fetch(estimateUrl.href, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const html = await response.clone().text().catch(() => "");
      const contentLength = Number(response.headers.get("content-length") || 0);
      return { route, html, bytes: Number.isFinite(contentLength) ? contentLength : 0 };
    }),
  );

  let total = 0;
  const assetUrls = new Set<string>();
  const requiredImageUrls = new Set<string>(
    OFFLINE_REQUIRED_IMAGE_URLS.map((url) => new URL(url, window.location.origin).href),
  );

  const offlineShellAssetSizes = await Promise.allSettled(
    OFFLINE_SHELL_ASSET_URLS.map((url) => estimateResourceBytes(new URL(url, window.location.origin).href)),
  );
  for (const result of offlineShellAssetSizes) {
    total += result.status === "fulfilled" ? result.value : UNKNOWN_ASSET_BYTES;
  }

  for (const result of responses) {
    if (result.status !== "fulfilled") continue;
    total += result.value.bytes || new Blob([result.value.html]).size;
    collectStaticAssetUrls(result.value.html, result.value.route, assetUrls);
    collectRequiredImageUrls(result.value.html, result.value.route, requiredImageUrls);
  }

  const assetSizes = await Promise.allSettled(Array.from(assetUrls).map(estimateResourceBytes));
  for (const result of assetSizes) {
    total += result.status === "fulfilled" ? result.value : UNKNOWN_ASSET_BYTES;
  }

  const requiredImageSizes = await Promise.allSettled(Array.from(requiredImageUrls).map(estimateResourceBytes));
  for (const result of requiredImageSizes) {
    total += result.status === "fulfilled" ? result.value : UNKNOWN_ASSET_BYTES;
  }

  return total || OFFLINE_BUNDLE_FALLBACK_BYTES;
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "5 MB";
  const mb = bytes / 1024 / 1024;
  if (mb < 1) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${Math.ceil(mb)} MB`;
}

function collectStaticAssetUrls(html: string, route: string, target: Set<string>) {
  if (typeof window === "undefined" || !html) return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  doc
    .querySelectorAll(
      [
        "script[src]",
        'link[rel="stylesheet"][href]',
        'link[rel="preload"][href]',
        'link[rel="modulepreload"][href]',
      ].join(","),
    )
    .forEach((element) => {
      const value = element.getAttribute("src") || element.getAttribute("href");
      if (!value) return;
      addStaticAssetUrl(value, route, target);
    });
}

function collectRequiredImageUrls(html: string, route: string, target: Set<string>) {
  if (typeof window === "undefined" || !html) return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  doc.querySelectorAll("img[data-offline-required][src]").forEach((element) => {
    const value = element.getAttribute("src");
    if (!value) return;
    addRequiredImageUrl(value, route, target);
  });
}

function addStaticAssetUrl(value: string, basePath: string, target: Set<string>) {
  try {
    const url = new URL(value, new URL(basePath, window.location.origin));
    if (url.origin !== window.location.origin) return;
    if (!url.pathname.startsWith("/_next/static/")) return;
    target.add(url.href);
  } catch {
    // Ignore malformed URLs in generated or third-party markup.
  }
}

function addRequiredImageUrl(value: string, basePath: string, target: Set<string>) {
  try {
    const url = new URL(value, new URL(basePath, window.location.origin));
    if (url.protocol !== "http:" && url.protocol !== "https:") return;
    target.add(url.href);
  } catch {
    // Ignore malformed URLs in generated or third-party markup.
  }
}

function isSameOrigin(value: string) {
  try {
    return new URL(value).origin === window.location.origin;
  } catch {
    return false;
  }
}

async function fetchAndCacheUrls(urls: string[], cacheName: string) {
  if (typeof window === "undefined") return;

  await Promise.allSettled(
    urls.map(async (url) => {
      const absoluteUrl = new URL(url, window.location.origin).href;
      const request = new Request(absoluteUrl, {
        cache: "reload",
        credentials: isSameOrigin(absoluteUrl) ? "same-origin" : "omit",
        mode: isSameOrigin(absoluteUrl) ? "same-origin" : "no-cors",
      });
      const response = await fetch(request);
      await cacheResponse(request, response.clone(), cacheName);
      return response;
    }),
  );
}

async function cacheResponse(request: RequestInfo | URL, response: Response, cacheName: string) {
  if (typeof window === "undefined" || !("caches" in window)) return;
  if (!response.ok && response.type !== "opaque") return;

  const cache = await caches.open(cacheName).catch(() => null);
  if (!cache) return;
  await cache.put(request, response);
}

async function estimateResourceBytes(url: string) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      credentials: isSameOrigin(url) ? "same-origin" : "omit",
      mode: isSameOrigin(url) ? "same-origin" : "cors",
    });
    const contentLength = Number(response.headers.get("content-length") || 0);
    return Number.isFinite(contentLength) && contentLength > 0 ? contentLength : UNKNOWN_ASSET_BYTES;
  } catch {
    return UNKNOWN_ASSET_BYTES;
  }
}
