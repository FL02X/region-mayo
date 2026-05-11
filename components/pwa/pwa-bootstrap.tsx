"use client";

import { useEffect } from "react";
import { applyFontScale, onPreferenceChange, readFontScale } from "@/lib/preferences";
import { readLastSync, warmCacheRoutes, writeLastSync } from "@/lib/pwa-sync";
import { useConnectivity } from "@/hooks/use-connectivity";
import { markPwaInstalled, setDeferredInstallPrompt, type BeforeInstallPromptEvent } from "@/hooks/use-install-prompt";

const SYNC_INTERVAL_FAST_MS = 6 * 60 * 60 * 1000;
const SYNC_INTERVAL_SLOW_MS = 12 * 60 * 60 * 1000;

export function PwaBootstrap() {
  const { isOnline, connection } = useConnectivity();

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
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    };

    window.addEventListener("load", registerServiceWorker, { once: true });

    return () => window.removeEventListener("load", registerServiceWorker);
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

  return null;
}
