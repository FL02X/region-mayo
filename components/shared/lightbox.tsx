"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Wifi, X } from "lucide-react";
import { useConnectivity } from "@/hooks/use-connectivity";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import useLockBodyScroll from "@/hooks/use-lock-scroll";

interface LightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function Lightbox({ src, alt = "Imagen", onClose }: LightboxProps) {
  const { isStandalone } = useInstallPrompt();
  const { isOnline } = useConnectivity();
  const shouldShowOfflineNotice = isStandalone && !isOnline;
  useLockBodyScroll(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const offlineNotice = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black/85 p-4"
    >
      <button
        aria-label="Cerrar imagen"
        onClick={onClose}
        className="absolute right-4 top-4 z-[101] inline-flex items-center justify-center rounded-full bg-white/90 p-2 shadow"
      >
        <X className="h-4 w-4 text-black" />
      </button>

      <div
        className="flex h-full w-full items-center justify-center"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-[360px] border border-border bg-background p-5 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-primary/10">
            <Wifi className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold uppercase tracking-wide text-foreground">
            Requiere conexion a internet
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Para ahorrar datos y almacenamiento, las imagenes ampliadas no se descargan para uso sin conexion.
          </p>
        </div>
      </div>
    </div>
  );

  const lightbox = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black/85 p-4"
    >
      <button
        aria-label="Cerrar imagen"
        onClick={onClose}
        className="absolute right-4 top-4 z-[101] inline-flex items-center justify-center rounded-full bg-white/90 p-2 shadow"
      >
        <X className="h-4 w-4 text-black" />
      </button>

      <div
        className="flex h-full w-full items-center justify-center"
        onClick={onClose}
      >
        <div
          className="relative flex max-h-[100vh] max-w-[100vw] items-center justify-center md:max-h-[78vh] md:max-w-[72vw]"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={src}
            alt={alt}
            className="block max-h-[100vh] max-w-[100vw] w-auto h-auto object-contain shadow-2xl md:max-h-[78vh] md:max-w-[72vw]"
            loading="eager"
          />
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(shouldShowOfflineNotice ? offlineNotice : lightbox, document.body);
}
