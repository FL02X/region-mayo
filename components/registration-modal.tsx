"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { X, Check, Calendar, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PhoneInput } from "@/components/phone-input"
import { WhatsAppIconButton } from "@/components/whatsapp-button"
import { formatPhoneForDisplay } from "@/lib/phone-utils"
import type { Event, RegionPresident } from "@/lib/types"

interface RegistrationModalProps {
  event: Event
  isOpen: boolean
  onClose: () => void
  regionPresident: RegionPresident | null
  regions: string[]
}

export function RegistrationModal({ event, isOpen, onClose, regionPresident, regions }: RegistrationModalProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formStartTime, setFormStartTime] = useState<number>(0)
  const [honeypot, setHoneypot] = useState("")
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    region: "",
    isVisiting: false,
    needsLodging: false,
    needsTransport: false,
    attendingAs: "oyente" as "oyente" | "miembro",
    isBaptized: false,
    isCoroMGR: false,
  })

  useEffect(() => {
    if (isOpen) {
      setFormStartTime(Date.now())
      setStep(1)
      setSubmitError(null)
      setSelectedPhotoIndex(null)
    }
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
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          region: formData.region,
          eventId: event.id,
          isVisiting: formData.isVisiting,
          needsLodging: formData.needsLodging,
          needsTransport: formData.needsTransport,
          attendingAs: formData.attendingAs,
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

  const navigatePhoto = (direction: "prev" | "next") => {
    if (selectedPhotoIndex === null) return
    const newIndex = direction === "next" 
      ? (selectedPhotoIndex + 1) % photos.length
      : (selectedPhotoIndex - 1 + photos.length) % photos.length
    setSelectedPhotoIndex(newIndex)
  }

  const stepLabels = ["Logística", "Contacto", "Confirmar"]

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <div 
          className="relative bg-background w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95"
          role="dialog"
          aria-modal="true"
          aria-labelledby="registration-title"
          aria-describedby="registration-description"
        >
          {/* Header */}
          <div className="sticky top-0 bg-background z-10 px-5 py-4 border-b flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <h2 id="registration-title" className="font-semibold text-base text-foreground">Registro</h2>
              <p id="registration-description" className="text-sm text-muted-foreground truncate">{event.title}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0 h-9 w-9">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          {step <= totalSteps && (
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center">
                {[1, 2, 3].map((s, index) => (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-colors ${
                        s <= step
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s < step ? <Check className="h-3.5 w-3.5" /> : s}
                    </div>
                    {index < 2 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${s < step ? "bg-primary" : "bg-muted"}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex mt-2">
                {stepLabels.map((label, index) => (
                  <div 
                    key={label} 
                    className={`${index === 2 ? "w-7" : "flex-1"} flex justify-center`}
                  >
                    <span 
                      className={`text-xs text-center ${step === index + 1 ? "text-primary font-medium" : "text-muted-foreground"}`}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-5 py-4">
            {/* Step 1: Logistics */}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Ayúdanos a preparar todo para tu llegada
                </p>

                {/* Visiting Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <span className="text-sm text-foreground">¿Vienes de otra región?</span>
                  <div className="flex gap-1.5">
                    <Button
                      variant={formData.isVisiting ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("isVisiting", true)}
                      className={`rounded-lg h-8 px-3 text-xs ${formData.isVisiting ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      Sí
                    </Button>
                    <Button
                      variant={!formData.isVisiting ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("isVisiting", false)}
                      className={`rounded-lg h-8 px-3 text-xs ${!formData.isVisiting ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      No
                    </Button>
                  </div>
                </div>

                {/* Lodging Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <span className="text-sm text-foreground">¿Necesitas hospedaje?</span>
                  <div className="flex gap-1.5">
                    <Button
                      variant={formData.needsLodging ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("needsLodging", true)}
                      className={`rounded-lg h-8 px-3 text-xs ${formData.needsLodging ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      Sí
                    </Button>
                    <Button
                      variant={!formData.needsLodging ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("needsLodging", false)}
                      className={`rounded-lg h-8 px-3 text-xs ${!formData.needsLodging ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      No
                    </Button>
                  </div>
                </div>

                {/* Transport Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <span className="text-sm text-foreground">¿Necesitas transporte?</span>
                  <div className="flex gap-1.5">
                    <Button
                      variant={formData.needsTransport ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("needsTransport", true)}
                      className={`rounded-lg h-8 px-3 text-xs ${formData.needsTransport ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      Sí
                    </Button>
                    <Button
                      variant={!formData.needsTransport ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("needsTransport", false)}
                      className={`rounded-lg h-8 px-3 text-xs ${!formData.needsTransport ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      No
                    </Button>
                  </div>
                </div>

                {/* Baptized Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <span className="text-sm text-foreground">¿Eres bautizado?</span>
                  <div className="flex gap-1.5">
                    <Button
                      variant={formData.isBaptized ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("isBaptized", true)}
                      className={`rounded-lg h-8 px-3 text-xs ${formData.isBaptized ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      Sí
                    </Button>
                    <Button
                      variant={!formData.isBaptized ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("isBaptized", false)}
                      className={`rounded-lg h-8 px-3 text-xs ${!formData.isBaptized ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      No
                    </Button>
                  </div>
                </div>

                {/* Coro MGR Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <span className="text-sm text-foreground">¿Eres joven del coro MGR?</span>
                  <div className="flex gap-1.5">
                    <Button
                      variant={formData.isCoroMGR ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("isCoroMGR", true)}
                      className={`rounded-lg h-8 px-3 text-xs ${formData.isCoroMGR ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      Sí
                    </Button>
                    <Button
                      variant={!formData.isCoroMGR ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("isCoroMGR", false)}
                      className={`rounded-lg h-8 px-3 text-xs ${!formData.isCoroMGR ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      No
                    </Button>
                  </div>
                </div>

                {/* Attending As */}
                <div className="p-3 bg-muted/50 rounded-xl">
                  <span className="text-sm text-foreground block mb-2">Asistiré como:</span>
                  <div className="flex gap-2">
                    <Button
                      variant={formData.attendingAs === "oyente" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("attendingAs", "oyente")}
                      className={`rounded-lg h-9 px-4 text-sm flex-1 ${formData.attendingAs === "oyente" ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      Oyente
                    </Button>
                    <Button
                      variant={formData.attendingAs === "miembro" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("attendingAs", "miembro")}
                      className={`rounded-lg h-9 px-4 text-sm flex-1 ${formData.attendingAs === "miembro" ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      Miembro
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Info */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm text-foreground">Nombre completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Tu nombre"
                    className="mt-1.5 rounded-xl h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm text-foreground">Teléfono</Label>
                  <div className="mt-1.5">
                    <PhoneInput
                      id="phone"
                      value={formData.phone}
                      onChange={(value) => handleInputChange("phone", value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-foreground">Mi Región</Label>
                  <Select value={formData.region} onValueChange={(value) => handleInputChange("region", value)}>
                    <SelectTrigger className="mt-1.5 rounded-xl h-11">
                      <SelectValue placeholder="Selecciona tu región" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Review with Clickable Photos */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Event Photos - Clickable with scroll indicator */}
                {photos.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Mira lo que vivirás: Momentos de eventos pasados
                    </p>
                    <div className="relative">
                      <div className="grid grid-cols-3 gap-2">
                        {photos.slice(0, maxPhotosToShow).map((photo, index) => (
                          <button
                            key={index}
                            onClick={() => openPhotoViewer(index)}
                            className="relative aspect-square rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          >
                            <Image 
                              src={photo} 
                              alt={`Foto de evento ${index + 1}`} 
                              fill 
                              className="object-cover transition-transform group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">Ver</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {/* Indicator for more photos */}
                      {photos.length > maxPhotosToShow && (
                        <button
                          onClick={() => openPhotoViewer(0)}
                          className="mt-2 text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                        >
                          <span>+{photos.length - maxPhotosToShow} fotos mas</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-muted/50 rounded-xl p-4">
                  <h4 className="font-semibold text-sm text-foreground mb-3">Resumen de tu registro</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre:</span>
                      <span className="text-foreground font-medium">{formData.name || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Teléfono:</span>
                      <span className="text-foreground font-medium">{formData.phone ? `+52 ${formData.phone}` : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Región:</span>
                      <span className="text-foreground font-medium">{formData.region || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Visitante:</span>
                      <span className="text-foreground font-medium">{formData.isVisiting ? "Sí" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hospedaje:</span>
                      <span className="text-foreground font-medium">{formData.needsLodging ? "Sí" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transporte:</span>
                      <span className="text-foreground font-medium">{formData.needsTransport ? "Sí" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bautizado:</span>
                      <span className="text-foreground font-medium">{formData.isBaptized ? "Sí" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coro MGR:</span>
                      <span className="text-foreground font-medium">{formData.isCoroMGR ? "Sí" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Asistiendo como:</span>
                      <span className="text-foreground font-medium capitalize">{formData.attendingAs}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Step */}
            {step === 4 && (
              <ConfirmationStep 
                onAddToCalendar={addToGoogleCalendar}
                eventTitle={event.title}
                regionPresident={regionPresident}
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
            <div className="sticky bottom-0 bg-background border-t px-5 py-4">
              {submitError && (
                <div className="mb-3 p-3 bg-destructive/10 text-destructive text-sm rounded-xl text-center">
                  {submitError}
                </div>
              )}
              <div className="flex gap-2">
                {step > 1 && (
                  <Button variant="outline" onClick={handleBack} disabled={isSubmitting} className="rounded-xl h-11 px-4">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Atrás
                  </Button>
                )}
                <Button
                  onClick={step === totalSteps ? handleSubmit : handleNext}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/90 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      {step === totalSteps ? "Confirmar Registro" : "Siguiente"}
                      {step < totalSteps && <ChevronRight className="h-4 w-4 ml-1" />}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="px-5 pb-5">
              <Button onClick={onClose} className="w-full rounded-xl h-11 bg-primary hover:bg-primary/90 text-white">
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Photo Viewer */}
      {selectedPhotoIndex !== null && photos.length > 0 && (
        <PhotoViewer
          photos={photos}
          currentIndex={selectedPhotoIndex}
          onClose={closePhotoViewer}
          onNavigate={navigatePhoto}
        />
      )}
    </>
  )
}

// Fullscreen Photo Viewer Component
function PhotoViewer({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: {
  photos: string[]
  currentIndex: number
  onClose: () => void
  onNavigate: (direction: "prev" | "next") => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") onNavigate("prev")
      if (e.key === "ArrowRight") onNavigate("next")
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, onNavigate])

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm font-medium">
          {currentIndex + 1} / {photos.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Main Image */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center px-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous Button */}
        {photos.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("prev")}
            className="absolute left-2 text-white hover:bg-white/20 rounded-full z-10"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        {/* Image */}
        <div className="relative w-full max-w-lg aspect-[3/4] max-h-[70vh]">
          <Image
            src={photos[currentIndex]}
            alt={`Foto ${currentIndex + 1}`}
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Next Button */}
        {photos.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("next")}
            className="absolute right-2 text-white hover:bg-white/20 rounded-full z-10"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>

      {/* Thumbnail Strip */}
      {photos.length > 1 && (
        <div className="p-4 overflow-x-auto">
          <div className="flex gap-2 justify-center">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  // Direct navigation by setting index
                  const diff = index - currentIndex
                  if (diff > 0) {
                    for (let i = 0; i < diff; i++) onNavigate("next")
                  } else if (diff < 0) {
                    for (let i = 0; i < Math.abs(diff); i++) onNavigate("prev")
                  }
                }}
                className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 transition-all ${
                  index === currentIndex 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-black" 
                    : "opacity-50 hover:opacity-80"
                }`}
              >
                <Image
                  src={photo}
                  alt={`Miniatura ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Confirmation step with WhatsApp contact dropdown
function ConfirmationStep({ 
  onAddToCalendar, 
  eventTitle,
  regionPresident,
}: { 
  onAddToCalendar: () => void
  eventTitle: string
  regionPresident: RegionPresident | null
}) {
  const [isContactExpanded, setIsContactExpanded] = useState(false)

  return (
    <div className="text-center py-6">
      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">¡Registro Exitoso!</h3>
      <p className="text-sm text-muted-foreground mb-6">
        El staff ha sido notificado de tu asistencia. ¡Pronto estaremos en contacto!
      </p>
      
      <div className="space-y-3">
        <Button onClick={onAddToCalendar} variant="outline" className="w-full rounded-xl gap-2">
          <Calendar className="h-4 w-4" />
          Agregar a Google Calendar
        </Button>

        {regionPresident ? (
          <div className="text-left">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsContactExpanded(!isContactExpanded)}
              className="w-full justify-between rounded-xl"
            >
              <span className="text-sm">Ver información de contacto</span>
              {isContactExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {isContactExpanded && (
              <div className="mt-2 space-y-3 pt-2 border-t">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{regionPresident.fullName}</p>
                    <p className="text-xs text-muted-foreground">Presidente Regional</p>
                  </div>
                  <WhatsAppIconButton 
                    phone={regionPresident.phone} 
                    message={`Hola, me acabo de registrar para ${eventTitle} en el sitio web de Región Mayo.`}
                  />
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  {formatPhoneForDisplay(regionPresident.phone)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-muted/50 rounded-xl p-3 text-sm text-muted-foreground text-center">
            Información de contacto no disponible en este momento.
          </div>
        )}
      </div>
    </div>
  )
}
