"use client";

import { useEffect, useState } from "react";
import { WifiOff, X } from "lucide-react";
import { applyFontScale, onPreferenceChange, readFontScale } from "@/lib/preferences";
import { readLastSync, warmCacheRoutes, writeLastSync } from "@/lib/pwa-sync";
import { useConnectivity } from "@/hooks/use-connectivity";
import { markPwaInstalled, setDeferredInstallPrompt, type BeforeInstallPromptEvent } from "@/hooks/use-install-prompt";

const SYNC_INTERVAL_FAST_MS = 6 * 60 * 60 * 1000;
const SYNC_INTERVAL_SLOW_MS = 12 * 60 * 60 * 1000;

export function PwaBootstrap() {
  const { isOnline, connection } = useConnectivity();
  const [isAlbumOfflineModalOpen, setIsAlbumOfflineModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    applyFontScale(readFontScale());

    const stopListening = onPreferenceChange((detail) => {
      if (detail.key === "rm-font-scale") {
        applyFontScale(readFontScale());
      }
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "rm-font-scale") {
        applyFontScale(readFontScale());
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      stopListening();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isOnline) return;

    const lastSync = readLastSync();
    const now = Date.now();

    const effectiveType = connection?.effectiveType ?? "";
    const isSlowConnection = ["slow-2g", "2g", "3g"].includes(effectiveType);
    const isSavingData = Boolean(connection?.saveData);
    const minInterval = isSlowConnection || isSavingData ? SYNC_INTERVAL_SLOW_MS : SYNC_INTERVAL_FAST_MS;

    if (now - lastSync < minInterval) return;

    warmCacheRoutes()
      .then(() => writeLastSync(Date.now()))
      .catch(() => undefined);
  }, [isOnline, connection]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await registration.update();
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    };

    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (!anchor.href) return;

      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin) return;

      if (!navigator.onLine && url.pathname === "/album") {
        event.preventDefault();
        setIsAlbumOfflineModalOpen(true);
        return;
      }

      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

      if (isStandalone && !navigator.onLine) {
        event.preventDefault();
        window.location.href = url.href;
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setDeferredInstallPrompt(null);
      markPwaInstalled();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  return (
    <>
      {isAlbumOfflineModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-album-offline-title"
            className="relative w-full max-w-[360px] border border-border bg-background p-5 text-center shadow-xl"
          >
            <button
              type="button"
              onClick={() => setIsAlbumOfflineModalOpen(false)}
              className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Cerrar aviso"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-primary/10 text-primary">
              <WifiOff className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 id="pwa-album-offline-title" className="text-sm font-bold uppercase tracking-wide text-foreground">
              Requiere conexion
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              El album de actividades usa contenido pesado y necesita internet para abrirse.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
