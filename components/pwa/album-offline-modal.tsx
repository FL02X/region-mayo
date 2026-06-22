// Donde: aviso global al abrir album sin conexion. 
// Viewports: desktop y mobile. 
// Funcion: bloquea esa navegacion y explica por que.

import { WifiOff, X } from "lucide-react";

interface AlbumOfflineModalProps {
  onClose: () => void;
}

export function AlbumOfflineModal({ onClose }: AlbumOfflineModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-album-offline-title"
        className="relative w-full max-w-[360px] border border-border bg-background p-5 text-center shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Cerrar aviso"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-primary/10 text-primary">
          <WifiOff className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 id="pwa-album-offline-title" className="text-sm font-bold uppercase tracking-wide text-foreground">
          Requiere conexion
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          El album de actividades usa contenido pesado y necesita internet para abrirse.
        </p>
      </div>
    </div>
  );
}
