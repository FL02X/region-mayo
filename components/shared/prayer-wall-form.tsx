"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import Script from "next/script"
import { X, Loader2, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useConnectivity } from "@/hooks/use-connectivity"

type GrecaptchaApi = {
  execute: (siteKey: string | undefined, options: { action: string }) => Promise<string>
}

interface PrayerWallFormProps {
  isOpen: boolean
  onClose: () => void
  isCollecting: boolean
}

/**
 * PRAYER WALL FORM
 * Modal para que usuarios envíen oraciones anónimas
 *
 * CARACTERÍSTICAS:
 * - Texto anónimo (sin email, teléfono, nada)
 * - reCAPTCHA v3 invisible (detecta bots)
 * - Límite de 500 caracteres
 * - Rate limit por IP (1 oración/minuto)
 * - Diseño simple y limpio (verde, acorde con action-deck)
 * - Feedback clara al usuario
 */
export function PrayerWallForm({ isOpen, onClose, isCollecting }: PrayerWallFormProps) {
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recaptchaRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  const { isOnline } = useConnectivity()
  const isOffline = !isOnline

  // Auto-focus cuando se abre
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 120)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Cargar reCAPTCHA token si es necesario
  useEffect(() => {
    if (!isOpen) return

    const executeRecaptcha = async () => {
      try {
        const grecaptcha = (window as Window & { grecaptcha?: GrecaptchaApi }).grecaptcha
        if (grecaptcha) {
          const token = await grecaptcha.execute(siteKey, { action: "prayer_submission" })
          recaptchaRef.current = token
        }
      } catch (err) {
        console.error("Error ejecutando reCAPTCHA:", err)
      }
    }

    executeRecaptcha()
  }, [isOpen, siteKey])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)

    if (isOffline) {
      setError("Sin conexion. Conectate a internet para enviar la oracion.")
      return
    }

    if (!text.trim()) {
      setError("Por favor, escribe tu oración")
      return
    }

    if (text.trim().length < 10) {
      setError("La oración debe tener al menos 10 caracteres")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), recaptchaToken: recaptchaRef.current }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Error al enviar la oración")
        return
      }

      setSuccess(true)
      setText("")
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1600)
    } catch (err) {
      console.error("Error enviando oración:", err)
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const modal = (
    <>
      {siteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
          strategy="afterInteractive"
        />
      )}

      <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 overflow-hidden">
        <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={onClose} />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="prayerwall-title"
          className="absolute inset-0 sm:relative sm:inset-auto bg-background w-full sm:max-w-2xl sm:h-auto sm:max-h-[88vh] md:max-h-[84vh] flex flex-col shadow-2xl animate-in fade-in sm:zoom-in-95 duration-200 border border-border"
        >
          {/* Header (green accent) */}
          <div className="shrink-0 bg-background z-10 px-5 py-4 border-b flex items-center justify-between" style={{ background: undefined }}>
            <div className="flex-1 min-w-0 pr-3">
              <h2 id="prayerwall-title" className="font-bold text-lg text-foreground uppercase tracking-wide">Muro de Oraciones</h2>
              <p className="text-sm text-muted-foreground truncate">Envía una petición anónima</p>
            </div>

            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-none shrink-0 h-10 w-10 hover:bg-muted">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-4">
            {!isCollecting ? (
              <div className="space-y-3 text-center py-6">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-emerald-600" fill="currentColor" />
                </div>
                <p className="text-sm font-semibold text-foreground">Muro de Oraciones en MOSTRANDO</p>
                <p className="text-xs text-muted-foreground">
                  En esta fase no se pueden enviar nuevas peticiones. Solo se muestran las oraciones seleccionadas.
                </p>
              </div>
            ) : success ? (
              <div className="space-y-3 text-center py-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-emerald-600" fill="currentColor" />
                </div>
                <p className="text-sm font-semibold text-foreground">¡Gracias por tu petición!</p>
                <p className="text-xs text-muted-foreground">Tu oración ha sido recibida. Estaremos orando contigo.</p>
              </div>
            ) : (
              <form className="space-y-4">
                {isOffline && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-900">
                      Sin conexion. Esta funcion requiere internet.
                    </p>
                  </div>
                )}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-xs text-emerald-900"><strong>🔒 Anónimo:</strong> Tu petición es completamente anónima. No guardamos datos personales.</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="prayer-text" className="block text-sm font-medium text-foreground">Cuéntanos tu petición <span className="text-red-500 ml-1">*</span></label>
                  <textarea
                    ref={textareaRef}
                    id="prayer-text"
                    value={text}
                    onChange={(e) => { setText(e.target.value); setError(null) }}
                    disabled={isSubmitting || isOffline}
                    placeholder="Ej: Oración por mi familia, salud, trabajo..."
                    className="w-full h-36 px-3 py-2 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    maxLength={500}
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{text.length}/500 caracteres</p>
                    {text.length >= 490 && <span className="text-xs text-yellow-600">Casi al límite</span>}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                {/* Honeypot */}
                <input type="text" name="website_url" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

                <p className="text-[10px] text-muted-foreground text-center">Protegido por reCAPTCHA v3 (invisible)</p>
              </form>
            )}
          </div>

          {/* Footer */}
          {isCollecting && (
            <div className="shrink-0 bg-background border-t border-border/50 p-4">
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-none h-14 px-6 uppercase tracking-wider font-bold">Cancelar</Button>
                <Button
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting || isOffline}
                  className="flex-1 rounded-none h-14 bg-emerald-600 hover:bg-emerald-700 text-white uppercase tracking-wider font-bold text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />Procesando...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" fill="currentColor" />Enviar Oración
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )

  return createPortal(modal, document.body)
}
