"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/nav-bar";
import Chatbot from "@/components/shared/chatbot";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PermissionsPanel } from "@/components/pwa/permissions-panel";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useConnectivity } from "@/hooks/use-connectivity";
import { readAnalyticsOptIn, writeAnalyticsOptIn } from "@/lib/preferences";
import {
  estimateOfflineBundleBytes,
  formatBytes,
  OFFLINE_BUNDLE_FALLBACK_BYTES,
  readLastSync,
  warmCacheRoutes,
  writeLastSync,
} from "@/lib/pwa-sync";

export default function ConfiguracionPage() {
  const { isInstalled } = useInstallPrompt();
  const { isOnline, connection } = useConnectivity();
  const headerBehavior = isInstalled ? "sticky" : "fixed";

  const [analyticsOptIn, setAnalyticsOptIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(0);
  const [storageUsed, setStorageUsed] = useState<number | null>(null);
  const [offlineBundleBytes, setOfflineBundleBytes] = useState(OFFLINE_BUNDLE_FALLBACK_BYTES);
  const [syncFeedback, setSyncFeedback] = useState<
    | { tone: "success" | "error"; message: string }
    | null
  >(null);

  useEffect(() => {
    setAnalyticsOptIn(readAnalyticsOptIn());
    setLastSync(readLastSync());
    refreshStorageEstimate();
    if (isInstalled) {
      estimateOfflineBundleBytes()
        .then(setOfflineBundleBytes)
        .catch(() => setOfflineBundleBytes(OFFLINE_BUNDLE_FALLBACK_BYTES));
    }
  }, [isInstalled]);

  const refreshStorageEstimate = async () => {
    if (!navigator.storage?.estimate) return;
    const estimate = await navigator.storage.estimate();
    setStorageUsed(typeof estimate.usage === "number" ? estimate.usage : null);
  };

  const handleAnalytics = (checked: boolean) => {
    setAnalyticsOptIn(checked);
    writeAnalyticsOptIn(checked);
  };

  const handleSyncNow = async () => {
    if (!isInstalled) {
      setSyncFeedback({
        tone: "error",
        message: "Instala la app para preparar contenido sin conexión.",
      });
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await warmCacheRoutes();
      const now = Date.now();
      writeLastSync(now);
      setLastSync(now);
      await refreshStorageEstimate();
      setSyncFeedback({
        tone: "success",
        message: "Sincronización completada.",
      });
    } catch {
      setSyncFeedback({
        tone: "error",
        message: "No se pudo sincronizar. Intenta de nuevo.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const lastSyncLabel = useMemo(() => {
    if (!lastSync) return "Sin datos";
    return new Date(lastSync).toLocaleString("es-MX");
  }, [lastSync]);

  return (
    <main className="min-h-screen bg-[#f1f1f1]">
      <AppHeader behavior={headerBehavior} />
      <div className="pt-[51px] md:pt-0 max-w-[950px] mx-auto px-4 md:px-6 py-8 space-y-6">
        <section className="bg-white border border-border/60 p-5">
          <h1 className="text-lg font-bold text-foreground uppercase tracking-wide">Configuración</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajusta tus preferencias para usar la app instalada o la versión web.
          </p>
          {!isInstalled && (
            <p className="mt-3 text-xs text-amber-700">
              Estas opciones se guardan en este dispositivo. Para instalar la app, ve a la sección
              de instalación.
            </p>
          )}
        </section>

        <section className="bg-white border border-border/60 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Permisos</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Activa solo lo que necesites. Puedes hacerlo en cualquier momento.
            </p>
          </div>
          <PermissionsPanel />
        </section>

        <section className="bg-white border border-border/60 p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Datos y sincronización</h2>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Estado de conexión</p>
              <p className="text-xs text-muted-foreground">
                {isOnline ? "En línea" : "Sin conexión"}
                {connection?.effectiveType ? ` · ${connection.effectiveType}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">Última sincronización: {lastSyncLabel}</p>
              <p className="text-xs text-muted-foreground">
                Almacenamiento usado: {storageUsed === null ? "No disponible" : formatBytes(storageUsed)}
              </p>
              <p className="text-xs text-muted-foreground">
                Descarga offline estimada: {isInstalled ? formatBytes(offlineBundleBytes) : "Disponible al instalar"}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSyncNow}
                disabled={!isInstalled || !isOnline || isSyncing}
                className="rounded-none h-10 px-4 uppercase tracking-wider text-xs"
              >
                {isSyncing ? "Sincronizando..." : "Sincronizar ahora"}
              </Button>
              {syncFeedback && (
                <div
                  className={`text-xs font-medium px-3 py-2 border rounded-none ${
                    syncFeedback.tone === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {syncFeedback.message}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white border border-border/60 p-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Analítica</h2>
              <p className="text-xs text-muted-foreground">
                Ayúdanos a mejorar con datos anónimos de uso.
              </p>
            </div>
            <Switch checked={analyticsOptIn} onCheckedChange={handleAnalytics} />
          </div>
        </section>
      </div>
      <Chatbot />
    </main>
  );
}
