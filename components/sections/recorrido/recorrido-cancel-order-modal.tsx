"use client"

import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"

interface RecorridoCancelOrderModalProps {
  isOpen: boolean
  isCancelling: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => void
}

export function RecorridoCancelOrderModal({
  isOpen,
  isCancelling,
  error,
  onClose,
  onConfirm,
}: RecorridoCancelOrderModalProps) {
  const pathname = usePathname()
  const isRecorrido = pathname === "/recorrido-mayo-2026"

  if (!isOpen || typeof document === "undefined") return null

  const close = () => {
    if (!isCancelling) onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-order-title"
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Cerrar confirmación de cancelación"
        onClick={close}
      />
      <div
        className="relative w-full max-w-md overflow-hidden border border-black bg-white shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-14 items-center justify-between bg-[#757575] pl-5">
          <h3 id="cancel-order-title" className="text-[17px] font-bold text-white">Cancelar pedido</h3>
          <button
            type="button"
            onClick={close}
            disabled={isCancelling}
            className="flex h-full w-14 items-center justify-center bg-[#434343] text-white transition-colors hover:bg-[#2f2f2f] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5">
          {isCancelling ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center py-6">
              <div
                className={`h-20 w-20 animate-spin rounded-full border-4 ${isRecorrido ? "border-brand-green/20 border-t-brand-green" : "border-primary/20 border-t-primary"}`}
                aria-hidden="true"
              />
              <p className="mt-5 text-sm font-medium text-muted-foreground">Cancelando pedido...</p>
            </div>
          ) : (
            <>
              <p className="text-base font-semibold leading-snug text-foreground">¿Estás seguro que quieres cancelar este pedido?</p>
              <p className={`mt-2 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>
                {error || "El pedido se marcará como CANCELADO y se eliminará de este dispositivo."}
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={close}
                  className={`min-h-11 border bg-white px-5 text-sm font-semibold transition-colors ${isRecorrido ? "border-brand-green text-brand-green-active hover:bg-brand-green-soft" : "border-black text-foreground hover:bg-[#f1f1f1]"}`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`min-h-11 px-5 text-sm font-semibold text-white transition-colors ${isRecorrido ? "bg-brand-green hover:bg-brand-green-hover" : "bg-[#434343] hover:bg-[#2f2f2f]"}`}
                >
                  Sí
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
