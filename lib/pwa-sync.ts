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

  for (const result of responses) {
    if (result.status !== "fulfilled") continue;
    collectImageUrls(result.value.html, result.value.route, imageUrls);
  }

  await Promise.allSettled(
    Array.from(imageUrls).map((url) =>
      fetch(url, {
        cache: "reload",
        credentials: isSameOrigin(url) ? "same-origin" : "omit",
        mode: isSameOrigin(url) ? "same-origin" : "no-cors",
      }),
    ),
  );
}

function collectImageUrls(html: string, route: string, target: Set<string>) {
  if (typeof window === "undefined" || !html) return;

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

function addImageUrl(value: string, basePath: string, target: Set<string>) {
  try {
    const url = new URL(value, new URL(basePath, window.location.origin));
    if (url.protocol === "http:" || url.protocol === "https:") {
      target.add(url.href);
    }
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
