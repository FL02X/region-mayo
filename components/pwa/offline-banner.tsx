"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConnectivity } from "@/hooks/use-connectivity";

export function OfflineBanner() {
  const { isOnline } = useConnectivity();
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOnlineToast(false);
      return;
    }

    setShowOnlineToast(true);
    const timer = window.setTimeout(() => setShowOnlineToast(false), 3000);
    return () => window.clearTimeout(timer);
  }, [isOnline]);

  if (isOnline && !showOnlineToast) {
    return null;
  }

  const isOffline = !isOnline;

  return (
    <div
      className={cn(
        "fixed left-1/2 bottom-4 z-[70] -translate-x-1/2 rounded-full border px-4 py-2 text-xs font-semibold shadow-lg",
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
            ? "Sin conexion. Algunas funciones requieren internet."
            : "Conexion restaurada."}
        </span>
      </div>
    </div>
  );
}
