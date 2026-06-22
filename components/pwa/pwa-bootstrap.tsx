"use client";

// Donde: root layout sin UI fija. 
// Viewports: todos. 
// Funcion: registra SW, sincroniza cache/preferencias y protege rutas offline.

import { useEffect, useState } from "react";
import { applyFontScale, onPreferenceChange, readFontScale } from "@/lib/preferences";
import { readLastSync, warmCacheRoutes, writeLastSync } from "@/lib/pwa-sync";
import { useConnectivity } from "@/hooks/use-connectivity";
import {
  checkStandalone,
  markPwaInstalled,
  setDeferredInstallPrompt,
  type BeforeInstallPromptEvent,
} from "@/hooks/use-install-prompt";
import { AlbumOfflineModal } from "@/components/pwa/album-offline-modal";
import {
  FONT_SCALE_STORAGE_KEY,
  SYNC_INTERVAL_FAST_MS,
  SYNC_INTERVAL_SLOW_MS,
} from "@/components/pwa/pwa-config";

function isStudioPath(pathname: string) {
  return pathname === "/studio" || pathname.startsWith("/studio/");
}

function getSyncInterval(connection: ReturnType<typeof useConnectivity>["connection"]) {
  const effectiveType = connection?.effectiveType ?? "";
  const isSlowConnection = ["slow-2g", "2g", "3g"].includes(effectiveType);
  const isSavingData = Boolean(connection?.saveData);

  return isSlowConnection || isSavingData ? SYNC_INTERVAL_SLOW_MS : SYNC_INTERVAL_FAST_MS;
}

function unregisterServiceWorkers() {
  return navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

export function PwaBootstrap() {
  const { isOnline, connection } = useConnectivity();
  const [isAlbumOfflineModalOpen, setIsAlbumOfflineModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    applyFontScale(readFontScale());

    const stopListening = onPreferenceChange((detail) => {
      if (detail.key === FONT_SCALE_STORAGE_KEY) {
        applyFontScale(readFontScale());
      }
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key === FONT_SCALE_STORAGE_KEY) {
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
    if (!checkStandalone()) return;

    const lastSync = readLastSync();
    const now = Date.now();

    const minInterval = getSyncInterval(connection);

    if (now - lastSync < minInterval) return;

    warmCacheRoutes()
      .then(() => writeLastSync(Date.now()))
      .catch(() => undefined);
  }, [isOnline, connection]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    if (isStudioPath(window.location.pathname)) {
      // Studio no debe quedar bajo el service worker publico porque sus requests de Sanity son muy sensibles al cache.
      unregisterServiceWorkers();
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      unregisterServiceWorkers();
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

      if (!navigator.onLine && url.pathname.startsWith("/album")) {
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
      if (navigator.onLine) {
        warmCacheRoutes()
          .then(() => writeLastSync(Date.now()))
          .catch(() => undefined);
      }
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
        <AlbumOfflineModal onClose={() => setIsAlbumOfflineModalOpen(false)} />
      )}
    </>
  );
}
