"use client";

// Donde: root layout. 
// Viewports: desktop y mobile. 
// Funcion: avisa perdida/restauracion de conexion para la app instalada.

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConnectivity } from "@/hooks/use-connectivity";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import {
  ONLINE_TOAST_DURATION_MS,
  SKIP_ONLINE_TOAST_KEY,
} from "@/components/pwa/pwa-config";

export function OfflineBanner() {
  const { isOnline } = useConnectivity();
  const { isInstalled } = useInstallPrompt();
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOnlineToast(false);
      return;
    }

    if (!isInstalled) {
      setShowOnlineToast(false);
      return;
    }

    try {
      const skipToast = sessionStorage.getItem(SKIP_ONLINE_TOAST_KEY) === "true";
      if (skipToast) {
        sessionStorage.removeItem(SKIP_ONLINE_TOAST_KEY);
        setShowOnlineToast(false);
        return;
      }
    } catch {
      // Si storage falla en modo privado, solo se muestra el toast normal.
    }

    setShowOnlineToast(true);
    const timer = window.setTimeout(() => setShowOnlineToast(false), ONLINE_TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [isOnline, isInstalled]);

  if (isOnline && (!showOnlineToast || !isInstalled)) {
    return null;
  }

  const isOffline = !isOnline;

  return (
    <div
      className={cn(
        "fixed left-1/2 bottom-4 z-[70] -translate-x-1/2 border px-4 py-2 text-xs font-semibold shadow-lg",
        isOffline
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-900",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        {isOffline ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
        <span>
          {isOffline
            ? "Sin conexion."
            : "Conexion restaurada."}
        </span>
      </div>
    </div>
  );
}
