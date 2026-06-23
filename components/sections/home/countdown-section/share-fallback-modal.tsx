// Donde: modal de compartir del countdown mobile. Viewports: mobile. Funcion: muestra texto para copiar y enlace de WhatsApp cuando Web Share no aplica.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, X } from "lucide-react";
import useLockBodyScroll from "@/hooks/use-lock-scroll";
import { useModalHistoryClose } from "@/hooks/use-modal-history-close";

function WhatsAppLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M20.5 3.5A11.4 11.4 0 0 0 12.04 0C5.71 0 .56 5.14.56 11.47c0 2.02.53 4 1.55 5.76L0 24l6.98-2.06a11.45 11.45 0 0 0 5.04 1.17h.01c6.33 0 11.47-5.15 11.47-11.47 0-3.06-1.19-5.93-3.34-8.14Zm-8.46 17.67h-.01c-1.69 0-3.35-.46-4.79-1.34l-.34-.2-4.14 1.22 1.24-4.03-.22-.36a9.34 9.34 0 0 1-1.43-4.99c0-5.16 4.2-9.36 9.37-9.36 2.5 0 4.86.98 6.64 2.74a9.32 9.32 0 0 1 2.74 6.64c0 5.17-4.2 9.36-9.06 9.68Zm5.34-6.6c-.29-.15-1.72-.85-1.98-.95-.27-.1-.46-.15-.66.15-.2.29-.76.95-.93 1.14-.17.2-.34.22-.63.07-.29-.15-1.23-.45-2.34-1.43-.86-.77-1.45-1.72-1.62-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.52-.07-.15-.66-1.58-.9-2.16-.24-.57-.48-.49-.66-.5h-.56c-.2 0-.52.07-.79.37-.27.29-1.03 1-.99 2.44.05 1.45 1.06 2.85 1.21 3.04.15.2 2.08 3.18 5.04 4.46.71.31 1.27.5 1.71.64.72.23 1.38.2 1.9.12.58-.09 1.72-.7 1.96-1.37.24-.66.24-1.23.17-1.37-.07-.15-.27-.22-.56-.37Z" />
    </svg>
  );
}

export function ShareFallbackModal({
  isOpen,
  title,
  shareText,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  shareText: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  useLockBodyScroll(isOpen);
  useModalHistoryClose(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const copyShareText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Compartir evento"
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
          <div className="mb-5 max-h-44 overflow-y-auto border border-border bg-[#f7f7f7] p-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {shareText}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={copyShareText}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-2 hover:underline"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copied ? "Texto copiado" : "Copiar texto"}
            </button>

            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit flex-col items-center gap-2 rounded-sm border border-border bg-white px-5 py-4 text-foreground transition-colors hover:bg-muted/40"
              aria-label={`Compartir ${title} por WhatsApp`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white">
                <WhatsAppLogo className="h-6 w-6" />
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink">
                WhatsApp
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
