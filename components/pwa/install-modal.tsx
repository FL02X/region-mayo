"use client";

// Donde: /instalar y menu movil. 
// Viewports: desktop y mobile. 
// Funcion: maneja instalacion PWA y prepara cache offline.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import {
  estimateOfflineBundleBytes,
  formatBytes,
  OFFLINE_BUNDLE_FALLBACK_BYTES,
  warmCacheRoutes,
  writeLastSync,
} from "@/lib/pwa-sync";
import {
  InstallModalBody,
  InstallModalHeader,
} from "@/components/pwa/install-modal-content";

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
      // Despues de aceptar la instalacion, calentamos cache para que la app instalada no abra vacia offline.
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
        <InstallModalHeader onClose={onClose} />
        <InstallModalBody
          isInstalled={isInstalled}
          isIos={isIos}
          canInstall={canInstall}
          isPreparingOffline={isPreparingOffline}
          installMessage={installMessage}
          bundleLabel={bundleLabel}
          onInstall={handleInstall}
        />

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
