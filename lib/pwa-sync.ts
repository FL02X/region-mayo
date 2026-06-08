export const WARM_CACHE_ROUTES = [
  "/",
  "/templos",
  "/pastores",
  "/coros",
  "/directiva",
  "/buscar",
  "/configuracion",
];

export const LAST_SYNC_KEY = "rm-last-sync";
export const OFFLINE_BUNDLE_FALLBACK_BYTES = 5 * 1024 * 1024;
const OFFLINE_SHELL_ASSET_URLS = ["/offline", "/placeholder.svg"];
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
  await Promise.allSettled(
    OFFLINE_SHELL_ASSET_URLS.map((url) =>
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

  const assetUrls = new Set<string>();

  for (const result of responses) {
    if (result.status !== "fulfilled") continue;
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
  }

  const assetSizes = await Promise.allSettled(Array.from(assetUrls).map(estimateResourceBytes));
  for (const result of assetSizes) {
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
