"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface LightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function Lightbox({ src, alt = "Imagen", onClose }: LightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={(e) => {
        // close when clicking backdrop
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-w-[98vw] max-h-[98vh] w-full">
        <button
          aria-label="Cerrar imagen"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 inline-flex items-center justify-center rounded-full bg-white/90 p-2 shadow"
        >
          <X className="h-4 w-4 text-black" />
        </button>

        <img
          src={src}
          alt={alt}
          className="mx-auto max-h-[92vh] w-auto max-w-full object-contain"
          loading="eager"
        />
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
