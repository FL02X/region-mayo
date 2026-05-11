export const WARM_CACHE_ROUTES = [
  "/",
  "/templos",
  "/coros",
  "/album",
  "/directorio",
  "/directiva",
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
  await Promise.allSettled(
    routes.map((route) =>
      fetch(route, {
        cache: "reload",
        credentials: "same-origin",
      }),
    ),
  );
}
