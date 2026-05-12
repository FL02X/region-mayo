"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { X, Check, Calendar, ChevronRight, ChevronLeft, User, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/shared/phone-input"
import { WhatsAppIconButton } from "@/components/shared/whatsapp-button"
import { ImageGalleryModal } from "@/components/shared/image-gallery-modal"
import useLockBodyScroll from "@/hooks/use-lock-scroll"
import { useConnectivity } from "@/hooks/use-connectivity"
import { formatPhoneForDisplay } from "@/lib/phone-utils"
import type { Event, RegionPresident } from "@/lib/types"

interface RegistrationModalProps {
  event: Event
  isOpen: boolean
  onClose: () => void
  regionPresident: RegionPresident | null
}

export function RegistrationModal({ event, isOpen, onClose, regionPresident }: RegistrationModalProps) {
  const MIN_SUBMIT_LOADING_MS = 250
  const contentScrollRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formStartTime, setFormStartTime] = useState<number>(0)
  const [honeypot, setHoneypot] = useState("")
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const { isOnline } = useConnectivity()
  const isOffline = !isOnline
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    needsLodging: false,
    needsTransport: false,
    attendingAs: "oyente" as "oyente" | "miembro",
    isBaptized: false,
    isCoroMGR: false,
  })

  useLockBodyScroll(isOpen)

  useEffect(() => {
    if (!isOpen) return

    setFormStartTime(Date.now())
    setStep(1)
    setSubmitError(null)
    setSelectedPhotoIndex(null)
  }, [isOpen])

  if (!isOpen) return null

  const totalSteps = 3
  const photos = event.photos || []
  const maxPhotosToShow = 3

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0
    }
    setIsSubmitting(true)
    setSubmitError(null)
    const submitStartTime = performance.now()

    if (isOffline) {
      setSubmitError("Sin conexion. Conectate a internet para completar el registro.")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          eventId: event.id,
          needsLodging: formData.needsLodging,
          needsTransport: formData.needsTransport,
          attendingAs: formData.isCoroMGR ? "miembro" : "oyente",
          isBaptized: formData.isBaptized,
          isCoroMGR: formData.isCoroMGR,
          website: honeypot,
          _requestTime: formStartTime,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al registrarse")
      }

      const elapsed = performance.now() - submitStartTime
      if (elapsed < MIN_SUBMIT_LOADING_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_SUBMIT_LOADING_MS - elapsed))
      }

      setStep(4)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Error al registrarse. Intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const addToGoogleCalendar = () => {
    const startDate = event.date.toISOString().replace(/-|:|\.\d\d\d/g, "")
    const endDate = new Date(event.date.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "")
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(`Evento de Región Mayo: ${event.title}`)}&location=${encodeURIComponent(event.address)}`
    window.open(url, "_blank")
  }

  const openPhotoViewer = (index: number) => {
    setSelectedPhotoIndex(index)
  }

  const closePhotoViewer = () => {
    setSelectedPhotoIndex(null)
  }

  const handlePhotoNavigate = (index: number) => {
    setSelectedPhotoIndex(index)
  }

  const stepLabels = ["Contacto", "Logística", "Confirmar"]

  const ToggleQuestion = ({ label, value, field }: { label: string, value: boolean, field: string }) => (
    <div className="flex items-center justify-between py-4 border-b border-border/50 last:border-0">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex bg-muted/30 border border-input">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleInputChange(field, true)}
          className={`rounded-none h-10 px-5 text-sm ${value ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "hover:bg-muted"}`}
        >
          Sí
        </Button>
        <div className="w-[1px] bg-input" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleInputChange(field, false)}
          className={`rounded-none h-10 px-5 text-sm ${!value ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "hover:bg-muted"}`}
        >
          No
        </Button>
      </div>
    </div>
  )

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div 
          className="absolute inset-0 sm:relative sm:inset-auto bg-background w-full sm:max-w-2xl sm:h-auto sm:max-h-[88vh] md:max-h-[84vh] flex flex-col shadow-2xl animate-in fade-in sm:zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="registration-title"
          aria-describedby="registration-description"
        >
          {/* Header */}
          <div className="shrink-0 bg-background z-10 px-5 py-4 border-b flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <h2 id="registration-title" className="font-bold text-lg text-foreground uppercase tracking-wide">Registro</h2>
              <p id="registration-description" className="text-sm text-muted-foreground truncate">{event.title}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-none shrink-0 h-10 w-10 hover:bg-muted">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Text */}
          {step <= totalSteps && (
            <div className="shrink-0 bg-muted/20 px-5 py-3 border-b">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">
                Paso {step} de {totalSteps} <span className="text-muted-foreground font-normal mx-1">|</span> {stepLabels[step - 1]}
              </p>
            </div>
          )}

          {/* Content */}
          <div ref={contentScrollRef} className="flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-4">
            {isOffline && step <= totalSteps && (
              <div className="mb-4 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                Sin conexion. Esta seccion requiere internet para registrar tu asistencia.
              </div>
            )}
            {/* Step 1: Contact Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="name" className="text-sm font-bold text-foreground uppercase tracking-wider">Nombre completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Escribe tu nombre"
                      className="mt-2 rounded-none h-12 border-input focus-visible:ring-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-bold text-foreground uppercase tracking-wider">Teléfono</Label>
                    <div className="mt-2 [&_input]:rounded-none [&_input]:h-12">
                      <PhoneInput
                        id="phone"
                        value={formData.phone}
                        onChange={(value) => handleInputChange("phone", value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Logistics */}
            {step === 2 && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground mb-4">
                  Ayúdanos a preparar todo para tu llegada respondiendo estas preguntas:
                </p>

                <div className="border border-border/50 bg-background px-4">
                  <ToggleQuestion label="¿Necesitas hospedaje?" value={formData.needsLodging} field="needsLodging" />
                  <ToggleQuestion label="¿Necesitas transporte?" value={formData.needsTransport} field="needsTransport" />
                  <ToggleQuestion label="¿Eres bautizado?" value={formData.isBaptized} field="isBaptized" />
                  <ToggleQuestion label="¿Eres joven del coro MGR?" value={formData.isCoroMGR} field="isCoroMGR" />
                </div>
              </div>
            )}

            {/* Step 3: Review with Clickable Photos */}
            {step === 3 && (
              <div className="space-y-6">
                {isSubmitting ? (
                  <div className="flex min-h-[280px] flex-col items-center justify-center py-16">
                    <div
                      className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
                      aria-hidden="true"
                    />
                    <p className="mt-5 text-sm font-medium text-muted-foreground">Procesando tu registro...</p>
                  </div>
                ) : (
                  <div className="md:grid md:grid-cols-2 md:gap-5 md:items-start">
                {/* Event Photos */}
                {photos.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">
                      Momentos de eventos pasados
                    </p>
                    <div className="relative">
                      <div className="grid grid-cols-3 gap-1">
                        {photos.slice(0, maxPhotosToShow).map((photo, index) => (
                          <button
                            key={index}
                            onClick={() => openPhotoViewer(index)}
                            className="relative aspect-square rounded-none overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          >
                            <Image 
                              src={photo} 
                              alt={`Foto de evento ${index + 1}`} 
                              fill 
                              className="object-cover" 
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-xs font-bold uppercase">Ver</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {/* Indicator for more photos */}
                      {photos.length > maxPhotosToShow && (
                        <button
                          onClick={() => openPhotoViewer(0)}
                          className="mt-3 text-xs text-primary font-bold uppercase tracking-wider flex items-center gap-1 hover:underline"
                        >
                          <span>+ {photos.length - maxPhotosToShow} fotos más</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="border border-border/50 bg-background p-5">
                  <h4 className="font-bold text-xs text-foreground mb-4 uppercase tracking-wider border-b border-border/50 pb-3">Resumen de tu registro</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Nombre:</span>
                      <span className="text-foreground font-medium">{formData.name || "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Teléfono:</span>
                      <span className="text-foreground font-medium">{formData.phone ? `+52 ${formData.phone}` : "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Hospedaje:</span>
                      <span className="text-foreground font-medium">{formData.needsLodging ? "Sí" : "No"}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Transporte:</span>
                      <span className="text-foreground font-medium">{formData.needsTransport ? "Sí" : "No"}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Bautizado:</span>
                      <span className="text-foreground font-medium">{formData.isBaptized ? "Sí" : "No"}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Coro MGR:</span>
                      <span className="text-foreground font-medium">{formData.isCoroMGR ? "Sí" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Asistiré como:</span>
                      <span className="text-foreground font-medium capitalize">{formData.isCoroMGR ? "Miembro" : "Oyente"}</span>
                    </div>
                  </div>
                </div>
                  </div>
                )}
              </div>
            )}

            {/* Confirmation Step */}
            {step === 4 && (
              <ConfirmationStep 
                onAddToCalendar={addToGoogleCalendar}
                eventTitle={event.title}
                regionPresident={regionPresident}
                needsTransport={formData.needsTransport}
                needsLodging={formData.needsLodging}
              />
            )}
          </div>

          {/* Honeypot field */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          {/* Footer */}
          {step <= totalSteps && (
            <div className="shrink-0 bg-background border-t border-border/50 p-4">
              {submitError && (
                <div
                  className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                  role="alert"
                  aria-live="polite"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{submitError}</span>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                {step > 1 && (
                  <Button variant="outline" onClick={handleBack} disabled={isSubmitting} className="rounded-none h-14 px-6 uppercase tracking-wider font-bold">
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Atrás
                  </Button>
                )}
                <Button
                  onClick={step === totalSteps ? handleSubmit : handleNext}
                  disabled={isSubmitting || (step === totalSteps && isOffline)}
                  className="flex-1 rounded-none h-14 bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-wider font-bold text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Procesando
                    </>
                  ) : (
                    <>
                      {step === totalSteps ? "Confirmar Registro" : "Siguiente"}
                      {step < totalSteps && <ChevronRight className="h-5 w-5 ml-1" />}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="shrink-0 bg-background p-4 border-t border-border/50">
              <Button onClick={onClose} className="w-full rounded-none h-14 bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-wider font-bold">
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Photo Viewer */}
      {selectedPhotoIndex !== null && photos.length > 0 && (
        <ImageGalleryModal
          images={photos}
          currentIndex={selectedPhotoIndex}
          onClose={closePhotoViewer}
          onNavigate={handlePhotoNavigate}
          alt="Foto del evento"
        />
      )}
    </>
  )

  return createPortal(modalContent, document.body)
}

// Confirmation step with WhatsApp contact dropdown
function ConfirmationStep({ 
  onAddToCalendar, 
  eventTitle,
  regionPresident,
  needsTransport,
  needsLodging,
}: { 
  onAddToCalendar: () => void
  eventTitle: string
  regionPresident: RegionPresident | null
  needsTransport: boolean
  needsLodging: boolean
}) {
  const showLogisticsInfo = needsTransport || needsLodging

  return (
    <div className="text-center py-6">
      <div className="w-12 h-12 bg-primary flex items-center justify-center mx-auto mb-3 rounded-none">
        <Check className="h-6 w-6 text-primary-foreground" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 uppercase tracking-wide whitespace-nowrap">¡Registro Exitoso!</h3>
      {showLogisticsInfo ? (
        <div className="mb-8 text-left border border-border/50 bg-muted/10 p-4 sm:p-5 space-y-4">
          <p className="text-base sm:text-lg font-bold text-foreground uppercase tracking-wide text-center sm:text-left">
            Esto es lo que haremos
          </p>

          {needsTransport && (
            <div className="flex items-start gap-3 sm:gap-4 border border-border/50 bg-background p-3 sm:p-4">
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden ring-1 ring-border/60 shrink-0">
                <Image
                  src="/images/transporte.webp"
                  alt="Apoyo para transporte"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide">
                  BUSCAREMOS TRANSPORTE
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Trataremos de buscar y comunicarnos lo mas pronto posible con hermanos locales, para ofrecerte transporte gratuito.
                </p>
              </div>
            </div>
          )}

          {needsLodging && (
            <div className="flex items-start gap-3 sm:gap-4 border border-border/50 bg-background p-3 sm:p-4">
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden ring-1 ring-border/60 shrink-0">
                <Image
                  src="/images/hospedaje.webp"
                  alt="Apoyo para hospedaje"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide">
                  BUSCAREMOS HOSPEDAJE
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Trataremos de buscar y comunicarnos lo mas pronto posible con hermanos locales, para ofrecerte hospedaje gratuito.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-8">
          El staff ha sido notificado de tu asistencia. ¡Pronto estaremos en contacto!
        </p>
      )}
      
      <div className="space-y-4">
        <Button onClick={onAddToCalendar} variant="outline" className="w-full rounded-none h-14 gap-2 font-bold uppercase tracking-wider text-sm border-input">
          <Calendar className="h-5 w-5" />
          Agregar a Google Calendar
        </Button>

        {regionPresident ? (
          <div className="text-left border border-border/50 bg-background">
            <div className="p-4 bg-muted/10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 flex items-center justify-center shrink-0 rounded-none">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{regionPresident.fullName}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Presidente Regional</p>
                </div>
                <WhatsAppIconButton 
                  phone={regionPresident.phone} 
                  message={`Hola, me acabo de registrar para ${eventTitle} en el sitio web de Región Mayo.`}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-border/50 bg-muted/10 p-4 text-sm text-muted-foreground text-center font-medium">
            Información de contacto no disponible en este momento.
          </div>
        )}
      </div>
    </div>
  )
}
