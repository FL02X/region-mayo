"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import useLockBodyScroll from "@/hooks/use-lock-scroll";

interface LightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function Lightbox({ src, alt = "Imagen", onClose }: LightboxProps) {
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

  const content = (
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
  return createPortal(content, document.body);
}
