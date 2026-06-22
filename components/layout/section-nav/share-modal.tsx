import { createPortal } from "react-dom";
import { Copy, X, type LucideIcon } from "lucide-react";

interface ShareModalProps {
  isMounted: boolean;
  isOpen: boolean;
  currentLabel: string;
  currentUrl: string;
  qrUrl: string;
  copied: boolean;
  icon: LucideIcon;
  onClose: () => void;
  onCopyLink: () => void;
}

export function ShareModal({
  isMounted,
  isOpen,
  currentLabel,
  currentUrl,
  qrUrl,
  copied,
  icon: Icon,
  onClose,
  onCopyLink,
}: ShareModalProps) {
  if (!isMounted || !isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Compartir sección"
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Cerrar compartir"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md overflow-hidden border border-black bg-white shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-14 items-center justify-between bg-[#757575] pl-5">
          <h3 className="text-[17px] font-bold text-white">Compartir</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-full w-14 items-center justify-center bg-[#434343] text-white transition-colors hover:bg-[#2f2f2f]"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-4 flex items-center gap-3 border border-border bg-[#f7f7f7] p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-white text-primary shadow-sm">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{currentLabel}</p>
              <p className="truncate text-xs text-muted-foreground">{currentUrl}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onCopyLink}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-2 hover:underline"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copied ? "Enlace copiado" : "Copiar enlace"}
            </button>

            {qrUrl ? (
              <img
                src={qrUrl}
                alt={`Código QR para ${currentLabel}`}
                className="h-28 w-28 border border-border bg-white"
                loading="lazy"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
