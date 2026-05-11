"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PermissionsPanel } from "@/components/pwa/permissions-panel";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useConnectivity } from "@/hooks/use-connectivity";
import {
  applyFontScale,
  readAnalyticsOptIn,
  readFontScale,
  writeAnalyticsOptIn,
  writeFontScale,
  type FontScale,
} from "@/lib/preferences";
import { readLastSync, warmCacheRoutes, writeLastSync } from "@/lib/pwa-sync";

const FONT_OPTIONS: Array<{ value: FontScale; label: string }> = [
  { value: "normal", label: "Normal" },
  { value: "large", label: "Grande" },
  { value: "xlarge", label: "Muy grande" },
];

export default function ConfiguracionPage() {
  const { isInstalled } = useInstallPrompt();
  const { isOnline, connection } = useConnectivity();

  const [fontScale, setFontScale] = useState<FontScale>("normal");
  const [analyticsOptIn, setAnalyticsOptIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(0);

  useEffect(() => {
    setFontScale(readFontScale());
    setAnalyticsOptIn(readAnalyticsOptIn());
    setLastSync(readLastSync());
  }, []);

  const handleFontScale = (value: FontScale) => {
    setFontScale(value);
    writeFontScale(value);
    applyFontScale(value);
  };

  const handleAnalytics = (checked: boolean) => {
    setAnalyticsOptIn(checked);
    writeAnalyticsOptIn(checked);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await warmCacheRoutes();
      const now = Date.now();
      writeLastSync(now);
      setLastSync(now);
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
      <AppHeader />
      <div className="pt-[51px] md:pt-0 max-w-[950px] mx-auto px-4 md:px-6 py-8 space-y-6">
        <section className="bg-white border border-border/60 p-5">
          <h1 className="text-lg font-bold text-foreground uppercase tracking-wide">Configuracion</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajusta tus preferencias para usar la app instalada o la version web.
          </p>
          {!isInstalled && (
            <p className="mt-3 text-xs text-amber-700">
              Estas opciones se guardan en este dispositivo. Para instalar la app, ve a la seccion
              de instalacion.
            </p>
          )}
        </section>

        <section className="bg-white border border-border/60 p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Preferencias</h2>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Tamano de letra</p>
              <p className="text-xs text-muted-foreground">Ajusta la lectura en el dispositivo.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {FONT_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={fontScale === option.value ? "default" : "outline"}
                  size="sm"
                  className="rounded-none"
                  onClick={() => handleFontScale(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
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
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Datos y sincronizacion</h2>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Estado de conexion</p>
              <p className="text-xs text-muted-foreground">
                {isOnline ? "En linea" : "Sin conexion"}
                {connection?.effectiveType ? ` · ${connection.effectiveType}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">Ultima sincronizacion: {lastSyncLabel}</p>
            </div>
            <Button
              onClick={handleSyncNow}
              disabled={!isOnline || isSyncing}
              className="rounded-none h-10 px-4 uppercase tracking-wider text-xs"
            >
              {isSyncing ? "Sincronizando..." : "Sincronizar ahora"}
            </Button>
          </div>
        </section>

        <section className="bg-white border border-border/60 p-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Analitica</h2>
              <p className="text-xs text-muted-foreground">
                Ayudanos a mejorar con datos anonimos de uso.
              </p>
            </div>
            <Switch checked={analyticsOptIn} onCheckedChange={handleAnalytics} />
          </div>
        </section>
      </div>
    </main>
  );
}
