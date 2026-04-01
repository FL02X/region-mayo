"use client"

import { useState } from "react"
import Image from "next/image"
import { X, Check, Calendar, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, User } from "lucide-react"
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

  if (!isOpen) return null

  const totalSteps = 3

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

  const handleSubmit = () => {
    setStep(4) // Confirmation step
  }

  const addToGoogleCalendar = () => {
    const startDate = event.date.toISOString().replace(/-|:|\.\d\d\d/g, "")
    const endDate = new Date(event.date.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "")
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(`Evento de Región Mayo: ${event.title}`)}&location=${encodeURIComponent(event.address)}`
    window.open(url, "_blank")
  }

  const stepLabels = ["Logística", "Contacto", "Confirmar"]

  return (
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
                        ? "bg-primary text-primary-foreground"
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
                  className={`flex-1 ${index === 2 ? "flex-none" : ""}`}
                >
                  <span 
                    className={`text-xs block ${
                      index === 0 ? "text-left" : index === 1 ? "text-center" : "text-right"
                    } ${step === index + 1 ? "text-primary font-medium" : "text-muted-foreground"}`}
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
                    className="rounded-lg h-8 px-3 text-xs"
                  >
                    Sí
                  </Button>
                  <Button
                    variant={!formData.isVisiting ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInputChange("isVisiting", false)}
                    className="rounded-lg h-8 px-3 text-xs"
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
                    className="rounded-lg h-8 px-3 text-xs"
                  >
                    Sí
                  </Button>
                  <Button
                    variant={!formData.needsLodging ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInputChange("needsLodging", false)}
                    className="rounded-lg h-8 px-3 text-xs"
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
                    className="rounded-lg h-8 px-3 text-xs"
                  >
                    Sí
                  </Button>
                  <Button
                    variant={!formData.needsTransport ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInputChange("needsTransport", false)}
                    className="rounded-lg h-8 px-3 text-xs"
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
                    className="rounded-lg h-8 px-3 text-xs"
                  >
                    Sí
                  </Button>
                  <Button
                    variant={!formData.isBaptized ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInputChange("isBaptized", false)}
                    className="rounded-lg h-8 px-3 text-xs"
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
                    className="rounded-lg h-8 px-3 text-xs"
                  >
                    Sí
                  </Button>
                  <Button
                    variant={!formData.isCoroMGR ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInputChange("isCoroMGR", false)}
                    className="rounded-lg h-8 px-3 text-xs"
                  >
                    No
                  </Button>
                </div>
              </div>

              {/* Attending As - Updated to Oyente/Miembro */}
              <div className="p-3 bg-muted/50 rounded-xl">
                <span className="text-sm text-foreground block mb-2">Asistiré como:</span>
                <div className="flex gap-2">
                  <Button
                    variant={formData.attendingAs === "oyente" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInputChange("attendingAs", "oyente")}
                    className="rounded-lg h-9 px-4 text-sm flex-1"
                  >
                    Oyente
                  </Button>
                  <Button
                    variant={formData.attendingAs === "miembro" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInputChange("attendingAs", "miembro")}
                    className="rounded-lg h-9 px-4 text-sm flex-1"
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

          {/* Step 3: Review with Photos */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Event Photos - Only show if event has photos */}
              {event.photos && event.photos.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Mira lo que vivirás: Momentos de eventos pasados
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {event.photos.slice(0, 3).map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                        <Image src={photo} alt={`Foto de evento ${index + 1}`} fill className="object-cover" />
                      </div>
                    ))}
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

        {/* Footer */}
        {step <= totalSteps && (
          <div className="sticky bottom-0 bg-background border-t px-5 py-4 flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="rounded-xl h-11 px-4">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Atrás
              </Button>
            )}
            <Button
              onClick={step === totalSteps ? handleSubmit : handleNext}
              className="flex-1 rounded-xl h-11"
            >
              {step === totalSteps ? "Confirmar Registro" : "Siguiente"}
              {step < totalSteps && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="px-5 pb-5">
            <Button onClick={onClose} className="w-full rounded-xl h-11">
              Cerrar
            </Button>
          </div>
        )}
      </div>
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
