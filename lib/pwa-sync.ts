export const WARM_CACHE_ROUTES = [
  "/",
  "/templos",
  "/pastores",
  "/coros",
  "/album",
  "/directiva",
  "/buscar",
  "/configuracion",
  "/instalar",
];

export const LAST_SYNC_KEY = "rm-last-sync";
export const OFFLINE_BUNDLE_FALLBACK_BYTES = 15 * 1024 * 1024;
const CRITICAL_ASSET_URLS = ["/images/region-mayo-logo.jpg", "/placeholder.svg"];
const MAX_MOBILE_IMAGE_WIDTH = 828;
const UNKNOWN_IMAGE_BYTES = 120 * 1024;

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
  await Promise.allSettled(
    CRITICAL_ASSET_URLS.map((url) =>
      fetch(url, {
        cache: "reload",
        credentials: "same-origin",
      }),
    ),
  );

  const responses = await Promise.allSettled(
    routes.map(async (route) => {
      const response = await fetch(route, {
        cache: "reload",
        credentials: "same-origin",
      });
      const html = await response.clone().text().catch(() => "");
      return { route, html };
    }),
  );

  const imageUrls = new Set<string>();
  const assetUrls = new Set<string>();

  for (const result of responses) {
    if (result.status !== "fulfilled") continue;
    collectImageUrls(result.value.html, result.value.route, imageUrls);
    collectStaticAssetUrls(result.value.html, result.value.route, assetUrls);
  }

  await Promise.allSettled(
    Array.from(assetUrls).map((url) =>
      fetch(url, {
        cache: "reload",
        credentials: isSameOrigin(url) ? "same-origin" : "omit",
      }),
    ),
  );

  await Promise.allSettled(
    Array.from(imageUrls).map((url) =>
      fetchImageIfMissing(url),
    ),
  );
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
  const imageUrls = new Set<string>();
  const assetUrls = new Set<string>();

  const criticalAssetSizes = await Promise.allSettled(
    CRITICAL_ASSET_URLS.map((url) => estimateResourceBytes(new URL(url, window.location.origin).href)),
  );
  for (const result of criticalAssetSizes) {
    total += result.status === "fulfilled" ? result.value : UNKNOWN_IMAGE_BYTES;
  }

  for (const result of responses) {
    if (result.status !== "fulfilled") continue;
    total += result.value.bytes || new Blob([result.value.html]).size;
    collectImageUrls(result.value.html, result.value.route, imageUrls);
    collectStaticAssetUrls(result.value.html, result.value.route, assetUrls);
  }

  const assetSizes = await Promise.allSettled(Array.from(assetUrls).map(estimateResourceBytes));
  for (const result of assetSizes) {
    total += result.status === "fulfilled" ? result.value : UNKNOWN_IMAGE_BYTES;
  }

  const imageSizes = await Promise.allSettled(Array.from(imageUrls).map(estimateResourceBytes));
  for (const result of imageSizes) {
    total += result.status === "fulfilled" ? result.value : UNKNOWN_IMAGE_BYTES;
  }

  return total || OFFLINE_BUNDLE_FALLBACK_BYTES;
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "15 MB";
  const mb = bytes / 1024 / 1024;
  if (mb < 1) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${Math.ceil(mb)} MB`;
}

function collectImageUrls(html: string, route: string, target: Set<string>) {
  if (typeof window === "undefined" || !html) return;
  if (isExcludedRoute(route)) return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  doc.querySelectorAll("img[src], source[srcset]").forEach((element) => {
    const src = element.getAttribute("src");
    if (src) addImageUrl(src, route, target);

    const srcset = element.getAttribute("srcset");
    if (srcset) {
      for (const candidate of srcset.split(",")) {
        const [url] = candidate.trim().split(/\s+/);
        if (url) addImageUrl(url, route, target);
      }
    }
  });

  doc
    .querySelectorAll('link[rel~="icon"][href], link[rel="apple-touch-icon"][href]')
    .forEach((element) => {
      const href = element.getAttribute("href");
      if (href) addImageUrl(href, route, target);
    });
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

function addImageUrl(value: string, basePath: string, target: Set<string>) {
  try {
    const url = new URL(value, new URL(basePath, window.location.origin));
    if ((url.protocol === "http:" || url.protocol === "https:") && shouldCacheImageUrl(url, basePath)) {
      target.add(url.href);
    }
  } catch {
    // Ignore malformed URLs in generated or third-party markup.
  }
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

function isSameOrigin(value: string) {
  try {
    return new URL(value).origin === window.location.origin;
  } catch {
    return false;
  }
}

function isExcludedRoute(route: string) {
  try {
    const url = new URL(route, window.location.origin);
    return url.pathname === "/album" || url.pathname.startsWith("/album/");
  } catch {
    return route === "/album" || route.startsWith("/album/");
  }
}

function shouldCacheImageUrl(url: URL, basePath: string) {
  if (isExcludedRoute(basePath)) return false;
  if (isDesktopSizedImage(url)) return false;
  return true;
}

function isDesktopSizedImage(url: URL) {
  const nextImageUrl = url.pathname.startsWith("/_next/image") ? url.searchParams.get("url") : null;
  const width = Number(url.searchParams.get("w") || getNestedWidth(nextImageUrl));
  return Number.isFinite(width) && width > MAX_MOBILE_IMAGE_WIDTH;
}

function getNestedWidth(value: string | null) {
  if (!value) return "";
  try {
    return new URL(value).searchParams.get("w") || "";
  } catch {
    return "";
  }
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
    return Number.isFinite(contentLength) && contentLength > 0 ? contentLength : UNKNOWN_IMAGE_BYTES;
  } catch {
    return UNKNOWN_IMAGE_BYTES;
  }
}

async function fetchImageIfMissing(url: string) {
  if (typeof window !== "undefined" && "caches" in window) {
    const cached = await caches.match(url, { ignoreSearch: false });
    if (cached) return cached;
  }

  return fetch(url, {
    cache: "reload",
    credentials: isSameOrigin(url) ? "same-origin" : "omit",
    mode: isSameOrigin(url) ? "same-origin" : "no-cors",
  });
}
