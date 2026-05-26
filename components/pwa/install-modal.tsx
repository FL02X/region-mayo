"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import {
  estimateOfflineBundleBytes,
  formatBytes,
  OFFLINE_BUNDLE_FALLBACK_BYTES,
  warmCacheRoutes,
  writeLastSync,
} from "@/lib/pwa-sync";

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallModal({ isOpen, onClose }: InstallModalProps) {
  const { canInstall, promptInstall, isInstalled, isIos } = useInstallPrompt();
  const [installMessage, setInstallMessage] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [bundleBytes, setBundleBytes] = useState(OFFLINE_BUNDLE_FALLBACK_BYTES);
  const [isPreparingOffline, setIsPreparingOffline] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setInstallMessage(null);
      setIsActive(false);
      return;
    }
    const raf = requestAnimationFrame(() => setIsActive(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    estimateOfflineBundleBytes()
      .then((bytes) => {
        if (!cancelled) setBundleBytes(bytes);
      })
      .catch(() => {
        if (!cancelled) setBundleBytes(OFFLINE_BUNDLE_FALLBACK_BYTES);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen || !isMounted) return null;

  const handleInstall = async () => {
    const choice = await promptInstall();
    if (!choice) {
      setInstallMessage("La instalacion no esta disponible en este navegador.");
      return;
    }

    if (choice.outcome === "accepted") {
      setIsPreparingOffline(true);
      setInstallMessage("Instalacion iniciada. Preparando contenido para usar sin conexion...");
      try {
        await warmCacheRoutes();
        writeLastSync(Date.now());
        setInstallMessage("App instalada y contenido principal disponible sin conexion.");
      } catch {
        setInstallMessage("La app se instalo, pero no se pudo preparar todo el contenido sin conexion.");
      } finally {
        setIsPreparingOffline(false);
      }
    } else {
      setInstallMessage("Instalacion cancelada. Puedes intentarlo mas tarde.");
    }
  };

  const bundleLabel = formatBytes(bundleBytes);

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="presentation">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-150 pointer-events-auto ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        className={`relative bg-background w-[92vw] max-w-[420px] max-h-[80vh] flex flex-col shadow-2xl border border-border transition-[opacity,transform] duration-180 pointer-events-auto ${
          isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div className="shrink-0 bg-background z-10 px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 id="install-title" className="font-bold text-lg text-foreground uppercase tracking-wide">
                Instalar app
              </h2>
              <p className="text-sm text-muted-foreground">Region Mayo en tu dispositivo.</p>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-none shrink-0 h-10 w-10 hover:bg-muted">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {isInstalled ? (
            <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              La app ya esta instalada en este dispositivo.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Agrega la app a tu celular y descarga el contenido principal para usarla sin conexion.
              </p>
              <p className="text-xs text-muted-foreground">
                Algunas secciones pueden requerir conexion.
              </p>

              {!isIos && (
                <Button
                  onClick={handleInstall}
                  className="rounded-none h-12 px-5 uppercase tracking-wider font-semibold"
                  disabled={!canInstall || isPreparingOffline}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isPreparingOffline ? "Preparando..." : `Instalar ahora (${bundleLabel})`}
                </Button>
              )}

              {isIos && (
                <div className="border border-border/60 bg-white p-4">
                  <p className="text-sm font-semibold text-foreground">Instalar en iOS</p>
                  <ol className="mt-2 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Abre esta pagina en Safari.</li>
                    <li>Toca el boton de compartir.</li>
                    <li>Selecciona "Agregar a inicio".</li>
                  </ol>
                </div>
              )}

              {installMessage && (
                <p className="text-xs text-muted-foreground">{installMessage}</p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
