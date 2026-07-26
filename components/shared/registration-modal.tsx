"use client"

import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { usePathname } from "next/navigation"
import Script from "next/script"
import { z } from "zod"
import { X, Check, ChevronRight, ChevronLeft, User, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/shared/phone-input"
import { WhatsAppIconButton } from "@/components/shared/whatsapp-button"
import { ImageGalleryModal } from "@/components/shared/image-album-modal"
import useLockBodyScroll from "@/hooks/use-lock-scroll"
import { useModalHistoryClose } from "@/hooks/use-modal-history-close"
import { useConnectivity } from "@/hooks/use-connectivity"
import {
  REGISTRATION_REGIONS,
  type Event,
  type RegionPresident,
  type RegistrationAttendingAs,
  type RegistrationLogisticsPreference,
  type RegistrationRegion,
} from "@/lib/types"

interface RegistrationModalProps {
  event: Event
  isOpen: boolean
  onClose: () => void
  regionPresident: RegionPresident | null
}

interface RegistrationFormState {
  name: string
  phone: string
  needsLodging: RegistrationLogisticsPreference | null
  needsTransport: RegistrationLogisticsPreference | null
  attendingAs: RegistrationAttendingAs
  isBaptized: boolean | null
  isCoroMGR: boolean | null
  isFromAnotherRegion: boolean | null
  region: RegistrationRegion | null
}

type ContactFieldErrors = Partial<Record<"name" | "phone", string>>
const isTurnstileEnabled = false

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      callback: (token: string) => void
      "expired-callback": () => void
      "error-callback": () => void
    },
  ) => string
  reset: (widgetId?: string) => void
  remove: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const registrationCategoryLabels: Record<RegistrationAttendingAs, string> = {
  oyente: "Oyente",
  varonDorca: "Varon / Dorca",
  jovenMGR: "Joven MGR",
}

function getRegistrationAttendingAs({
  isBaptized,
  isCoroMGR,
}: {
  isBaptized: boolean
  isCoroMGR: boolean
}): RegistrationAttendingAs {
  if (isCoroMGR) return "jovenMGR"
  if (isBaptized) return "varonDorca"
  return "oyente"
}

const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ")
const OBVIOUS_PLACEHOLDER_NAMES = new Set(["test", "prueba", "asdf", "qwerty", "nombre", "nombre completo"])
const OBVIOUS_PHONE_NUMBERS = new Set(["0123456789", "1234567890", "9876543210"])

const getLocalMexicanPhoneDigits = (phone: string) => {
  const digits = phone.replace(/\D/g, "")

  if (digits.length === 12 && digits.startsWith("52")) {
    return digits.slice(2)
  }

  if (digits.length === 13 && digits.startsWith("521")) {
    return digits.slice(3)
  }

  return digits
}

const contactSchema = z.object({
  name: z.string().transform(normalizeName).superRefine((name, ctx) => {
    const letterCount = (name.match(/\p{L}/gu) ?? []).length

    if (name.length < 2 || letterCount < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Escribe tu nombre completo.",
      })
      return
    }

    if (name.length > 80) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Usa 80 caracteres o menos.",
      })
      return
    }

    if (name.split(" ").length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Escribe tu nombre y apellido.",
      })
      return
    }

    if (!/^[\p{L}\p{M}\s.'’-]+$/u.test(name)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Usa solo letras y espacios.",
      })
      return
    }

    if (name.toLocaleLowerCase("es-MX").split(" ").some((part) => OBVIOUS_PLACEHOLDER_NAMES.has(part))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Escribe tu nombre completo real.",
      })
    }
  }),
  phone: z.string().transform(getLocalMexicanPhoneDigits).superRefine((phone, ctx) => {
    if (phone.length !== 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Escribe los 10 digitos de tu celular.",
      })
      return
    }

    if (/^(\d)\1{9}$/.test(phone) || OBVIOUS_PHONE_NUMBERS.has(phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ese numero no parece valido.",
      })
    }
  }),
})

const recorridoRegistrationBrandStyle = {
  "--primary": "var(--brand-green)",
  "--primary-foreground": "oklch(1 0 0)",
  "--accent": "var(--brand-green-soft)",
  "--accent-foreground": "var(--brand-green-active)",
  "--border": "var(--brand-green-border)",
  "--ring": "var(--brand-green)",
  "--brand": "var(--brand-green)",
  "--brand-hover": "var(--brand-green-hover)",
  "--brand-active": "var(--brand-green-active)",
  "--brand-soft": "var(--brand-green-soft)",
  "--brand-border": "var(--brand-green-border)",
  "--brand-text": "var(--brand-green-text)",
  "--color-primary": "var(--brand-green)",
  "--color-primary-foreground": "oklch(1 0 0)",
  "--color-accent": "var(--brand-green-soft)",
  "--color-accent-foreground": "var(--brand-green-active)",
  "--color-border": "var(--brand-green-border)",
  "--color-ring": "var(--brand-green)",
  "--color-brand": "var(--brand-green)",
  "--color-brand-hover": "var(--brand-green-hover)",
  "--color-brand-active": "var(--brand-green-active)",
  "--color-brand-soft": "var(--brand-green-soft)",
  "--color-brand-border": "var(--brand-green-border)",
  "--color-brand-text": "var(--brand-green-text)",
} as CSSProperties

export function RegistrationModal({ event, isOpen, onClose, regionPresident }: RegistrationModalProps) {
  const MIN_SUBMIT_LOADING_MS = 250
  const pathname = usePathname()
  const contentScrollRef = useRef<HTMLDivElement>(null)
  const regionSelectRef = useRef<HTMLSelectElement>(null)
  const logisticsQuestionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const turnstileContainerRef = useRef<HTMLDivElement>(null)
  const turnstileWidgetIdRef = useRef<string | null>(null)
  const previousBaptizedRef = useRef<boolean | null>(null)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  const [missingLogisticsFields, setMissingLogisticsFields] = useState<string[]>([])
  const [showLogisticsHighlight, setShowLogisticsHighlight] = useState(false)
  const [formStartTime, setFormStartTime] = useState<number>(0)
  const [honeypot, setHoneypot] = useState("")
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [turnstileToken, setTurnstileToken] = useState("")
  const { isOnline } = useConnectivity()
  const isOffline = !isOnline
  const totalSteps = 3
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""
  const allowDevTurnstileBypass = process.env.NODE_ENV !== "production" && !turnstileSiteKey
  const [formData, setFormData] = useState<RegistrationFormState>({
    name: "",
    phone: "",
    needsLodging: null,
    needsTransport: null,
    attendingAs: "oyente" as RegistrationAttendingAs,
    isBaptized: null,
    isCoroMGR: null,
    isFromAnotherRegion: null,
    region: null,
  })

  useLockBodyScroll(isOpen)
  useModalHistoryClose(isOpen, onClose, () => {
    if (step <= 1 || step > totalSteps) return false
    setStep((current) => current - 1)
    return true
  })

  useEffect(() => {
    if (!isOpen) return

    setFormStartTime(Date.now())
    setStep(1)
    setSubmitError(null)
    setFieldErrors({})
    setMissingLogisticsFields([])
    setShowLogisticsHighlight(false)
    setSelectedPhotoIndex(null)
    setTurnstileToken("")
    previousBaptizedRef.current = null
    setFormData((prev) => ({
      ...prev,
      needsLodging: null,
      needsTransport: null,
      isBaptized: null,
      isCoroMGR: null,
      isFromAnotherRegion: null,
      region: null,
    }))
  }, [isOpen])

  const renderTurnstile = useCallback(() => {
    if (!turnstileSiteKey || !window.turnstile || !turnstileContainerRef.current) return
    if (turnstileWidgetIdRef.current) return

    turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: turnstileSiteKey,
      callback: (token) => {
        setTurnstileToken(token)
        setSubmitError(null)
      },
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    })
  }, [turnstileSiteKey])

  useEffect(() => {
    if (!isTurnstileEnabled || !isOpen || step !== totalSteps || isSubmitting) return

    renderTurnstile()

    return () => {
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current)
        turnstileWidgetIdRef.current = null
      }
      setTurnstileToken("")
    }
  }, [isOpen, isSubmitting, renderTurnstile, step, totalSteps])

  if (!isOpen) return null

  const photos = event.photos || []
  const maxPhotosToShow = 3

  const handleInputChange = (field: string, value: string | boolean) => {
    setMissingLogisticsFields((current) => current.filter(
      (pendingField) => pendingField !== field && (field !== "isFromAnotherRegion" || pendingField !== "region"),
    ))

    if (field === "isFromAnotherRegion") {
      setFormData((prev) => ({
        ...prev,
        isFromAnotherRegion: value === true,
        region: value === true ? (prev.region === "Mayo" ? null : prev.region) : "Mayo",
      }))
      if (value === true) requestAnimationFrame(() => regionSelectRef.current?.focus())
    } else if (field === "isCoroMGR" && value === true) {
      if (formData.isCoroMGR !== true) previousBaptizedRef.current = formData.isBaptized
      setFormData((prev) => ({ ...prev, isCoroMGR: true, isBaptized: true }))
    } else if (field === "isCoroMGR" && value === false) {
      if (formData.isCoroMGR === true) {
        const isBaptized = previousBaptizedRef.current
        previousBaptizedRef.current = null
        setFormData((prev) => ({ ...prev, isCoroMGR: false, isBaptized }))
      } else {
        setFormData((prev) => ({ ...prev, isCoroMGR: false }))
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

    if (field === "name" || field === "phone") {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateContactStep = () => {
    const validation = contactSchema.safeParse({
      name: formData.name,
      phone: formData.phone,
    })

    if (validation.success) {
      setFieldErrors({})
      setFormData((prev) => ({
        ...prev,
        name: validation.data.name,
        phone: validation.data.phone,
      }))
      return validation.data
    }

    const nextErrors: ContactFieldErrors = {}

    validation.error.issues.forEach((issue) => {
      const field = issue.path[0]
      if ((field === "name" || field === "phone") && !nextErrors[field]) {
        nextErrors[field] = issue.message
      }
    })

    setFieldErrors(nextErrors)
    return null
  }

  const hasCompletedLogistics = [
    formData.needsLodging,
    formData.needsTransport,
    formData.isBaptized,
    formData.isCoroMGR,
    formData.isFromAnotherRegion,
  ].every((value) => value !== null) && (!formData.isFromAnotherRegion || formData.region !== null)

  const handleNext = () => {
    if (step === 1 && !validateContactStep()) {
      return
    }

    if (step === 2 && !hasCompletedLogistics) {
      const pendingFields = [
        formData.needsLodging === null && "needsLodging",
        formData.needsTransport === null && "needsTransport",
        formData.isBaptized === null && "isBaptized",
        formData.isCoroMGR === null && "isCoroMGR",
        formData.isFromAnotherRegion === null && "isFromAnotherRegion",
        formData.isFromAnotherRegion === true && formData.region === null && "region",
      ].filter((field): field is string => Boolean(field))
      setMissingLogisticsFields(pendingFields)
      setShowLogisticsHighlight(true)
      window.setTimeout(() => setShowLogisticsHighlight(false), 700)
      requestAnimationFrame(() => {
        const firstPendingField = pendingFields[0]
        if (firstPendingField === "region") {
          regionSelectRef.current?.focus()
        } else if (firstPendingField) {
          logisticsQuestionRefs.current[firstPendingField]?.focus()
        }
      })
      return
    }

    if (step === 2) setMissingLogisticsFields([])

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
    const contactData = validateContactStep()

    if (!contactData) {
      setStep(1)
      return
    }

    if (!hasCompletedLogistics) {
      setStep(2)
      return
    }

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
    if (isTurnstileEnabled && !allowDevTurnstileBypass && !turnstileToken) {
      setSubmitError("Completa la verificacion de seguridad para continuar.")
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
          name: contactData.name,
          phone: contactData.phone,
          eventId: event.id,
          needsLodging: formData.needsLodging === "unknown" ? "unknown" : Boolean(formData.needsLodging),
          needsTransport: formData.needsTransport === "unknown" ? "unknown" : Boolean(formData.needsTransport),
          attendingAs: getRegistrationAttendingAs({
            isBaptized: Boolean(formData.isBaptized),
            isCoroMGR: Boolean(formData.isCoroMGR),
          }),
          isBaptized: Boolean(formData.isBaptized) || Boolean(formData.isCoroMGR),
          isCoroMGR: Boolean(formData.isCoroMGR),
          isFromAnotherRegion: Boolean(formData.isFromAnotherRegion),
          region: formData.region,
          website: honeypot,
          _requestTime: formStartTime,
          turnstileToken: turnstileToken || (allowDevTurnstileBypass ? "dev-bypass" : ""),
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
  const isRecorridoRoute = pathname === "/recorrido-mayo-2026"
  const modalAccentStyle = isRecorridoRoute ? recorridoRegistrationBrandStyle : undefined
  const selectedToggleClassName = isRecorridoRoute
    ? "bg-brand-green text-white hover:bg-brand-green-hover hover:text-white active:bg-brand-green-active"
    : "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
  const unselectedToggleClassName = isRecorridoRoute
    ? "hover:bg-brand-green-soft"
    : "hover:bg-muted"
  const primaryButtonClassName = isRecorridoRoute
    ? "bg-brand-green text-white hover:bg-brand-green-hover active:bg-brand-green-active"
    : "bg-primary hover:bg-primary/90 text-primary-foreground"

  const renderToggleQuestion = ({ label, value, field, allowUnknown = false, disabled = false }: { label: string, value: boolean | "unknown" | null, field: string, allowUnknown?: boolean, disabled?: boolean }) => {
    const isMissing = missingLogisticsFields.includes(field)
    const isHighlighted = showLogisticsHighlight && isMissing

    return (
    <div
      ref={(element) => { logisticsQuestionRefs.current[field] = element }}
      tabIndex={-1}
      className={`flex flex-col items-start gap-5 border-b border-border/50 pb-7 pt-5 outline-none transition-colors duration-150 last:border-0 ${isHighlighted ? "bg-destructive/10" : "bg-transparent"}`}
      aria-invalid={isMissing}
    >
      <span className="text-sm font-medium text-foreground">
        {isMissing && <span className="mr-1 text-destructive">*</span>}
        {label}
      </span>
      <div className={`flex flex-wrap gap-2 ${disabled ? "[&_button:disabled]:opacity-80" : ""}`}>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => handleInputChange(field, true)}
          className={`rounded-none h-10 border border-foreground/25 px-5 text-sm ${value === true ? selectedToggleClassName : unselectedToggleClassName}`}
        >
          Sí
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => handleInputChange(field, false)}
          className={`rounded-none h-10 border border-foreground/25 px-5 text-sm ${value === false ? selectedToggleClassName : unselectedToggleClassName}`}
        >
          No
        </Button>
        {allowUnknown && <>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => handleInputChange(field, "unknown")}
            className={`rounded-none h-10 border border-foreground/25 px-4 text-sm ${value === "unknown" ? selectedToggleClassName : unselectedToggleClassName}`}
          >
            Aún no lo sé
          </Button>
        </>}
      </div>
    </div>
    )
  }

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 overflow-hidden"
        style={modalAccentStyle}
      >
        {isTurnstileEnabled && turnstileSiteKey && (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onLoad={renderTurnstile}
          />
        )}
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
          <div ref={contentScrollRef} className="flex-1 overflow-y-auto px-3 py-5 md:px-6 md:py-4">
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
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? "registration-name-error" : undefined}
                      className={`mt-2 rounded-none h-12 border border-brand-green-border focus-visible:ring-1 ${fieldErrors.name ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20" : ""}`}
                    />
                    {fieldErrors.name && (
                      <p id="registration-name-error" className="mt-2 text-xs font-medium text-destructive">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-bold text-foreground uppercase tracking-wider">Teléfono</Label>
                    <div className="mt-2 [&_input]:rounded-none [&_input]:h-12">
                      <PhoneInput
                        id="phone"
                        value={formData.phone}
                        onChange={(value) => handleInputChange("phone", value)}
                        aria-invalid={Boolean(fieldErrors.phone)}
                        aria-describedby={fieldErrors.phone ? "registration-phone-error" : undefined}
                        className={`border border-brand-green-border focus-visible:ring-1 ${fieldErrors.phone ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20" : ""}`}
                      />
                    </div>
                    {fieldErrors.phone && (
                      <p id="registration-phone-error" className="mt-2 text-xs font-medium text-destructive">
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Logistics */}
            {step === 2 && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground mb-6 mt-1">
                  Ayúdanos a preparar todo para tu llegada respondiendo estas preguntas:
                </p>

                <div className="border border-border/50 bg-paper-highlight px-3">
                  {renderToggleQuestion({ label: "¿Necesitas ayuda con el hospedaje?", value: formData.needsLodging, field: "needsLodging", allowUnknown: true })}
                  {renderToggleQuestion({ label: "¿Necesitas ayuda con el transporte entre actividades?", value: formData.needsTransport, field: "needsTransport", allowUnknown: true })}
                  {renderToggleQuestion({ label: "¿Estas bautizado en nuestra Iglesia Gentil de Cristo?", value: formData.isBaptized, field: "isBaptized", disabled: formData.isCoroMGR === true })}
                  {renderToggleQuestion({ label: "¿Eres joven del coro general? (Mensajeros del Gran Rey)", value: formData.isCoroMGR, field: "isCoroMGR" })}
                  {renderToggleQuestion({ label: "¿Vienes de otra región?", value: formData.isFromAnotherRegion, field: "isFromAnotherRegion" })}
                  {formData.isFromAnotherRegion && (
                    <div className={`pb-7 pt-5 transition-colors duration-150 ${showLogisticsHighlight && missingLogisticsFields.includes("region") ? "bg-destructive/10" : "bg-transparent"}`}>
                      <Label htmlFor="registration-region" className="mb-3 block text-sm font-medium">
                        {missingLogisticsFields.includes("region") && <span className="mr-1 text-destructive">*</span>}
                        ¿De qué región vienes?
                      </Label>
                      <select
                        id="registration-region"
                        ref={regionSelectRef}
                        value={formData.region ?? ""}
                        onChange={(event) => handleInputChange("region", event.target.value)}
                        className="h-11 w-full border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="" disabled>Selecciona tu región</option>
                        {REGISTRATION_REGIONS.slice(1).map((region) => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    </div>
                  )}
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
                  <div className="md:my-2 md:items-start">

                {/* Summary */}
                <div className="space-y-4">
                  <div className="border border-border/50 bg-background p-5">
                    <h4 className="font-bold text-xs md:text-lg text-foreground/90 text-ink mb-4 uppercase tracking-wider border-b border-border/50 pb-3">Confirma tu registro:</h4>
                    <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Nombre completo:</span>
                      <span className="max-w-[60%] text-right text-foreground font-medium">{formData.name || "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Teléfono:</span>
                      <span className="max-w-[60%] text-right text-foreground font-medium">{formData.phone ? `+52 ${formData.phone}` : "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Necesita hospedaje:</span>
                      <span className="font-medium">
                        {formData.needsLodging === "unknown" ? <span>Aún no lo sé</span> : formData.needsLodging ? <Check className="h-6 w-6 text-emerald-600" aria-label="Sí" /> : <span className="text-red-700/60">No</span>}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Necesita transporte:</span>
                      <span className="font-medium">
                        {formData.needsTransport === "unknown" ? <span>Aún no lo sé</span> : formData.needsTransport ? <Check className="h-6 w-6 text-emerald-600" aria-label="Sí" /> : <span className="text-red-700/60">No</span>}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Está bautizado:</span>
                      <span className="font-medium">
                        {formData.isBaptized ? <Check className="h-6 w-6 text-emerald-600" aria-label="Sí" /> : <span className="text-red-700/60">No</span>}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Coro MGR:</span>
                      <span className="font-medium">
                        {formData.isCoroMGR ? <Check className="h-6 w-6 text-emerald-600" aria-label="Sí" /> : <span className="text-red-700/60">No</span>}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Región:</span>
                      <span className="max-w-[60%] text-right text-foreground font-medium">{formData.region ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Asistiré como:</span>
                      <span className="text-foreground font-medium">{registrationCategoryLabels[getRegistrationAttendingAs({
                        isBaptized: Boolean(formData.isBaptized),
                        isCoroMGR: Boolean(formData.isCoroMGR),
                      })]}</span>
                    </div>
                    </div>
                  </div>
                  {isTurnstileEnabled && (allowDevTurnstileBypass ? (
                    <p className="text-xs text-muted-foreground">Verificacion de seguridad no configurada en desarrollo.</p>
                  ) : turnstileSiteKey ? (
                    <div className="min-h-[65px] overflow-x-auto">
                      <div ref={turnstileContainerRef} />
                    </div>
                  ) : (
                    <p className="text-xs text-destructive">Falta configurar Turnstile para registrar asistencias.</p>
                  ))}
                </div>
                  </div>
                )}
              </div>
            )}

            {/* Confirmation Step */}
            {step === 4 && (
              <ConfirmationStep 
                eventTitle={event.title}
                regionPresident={regionPresident}
                isRecorridoAccent={isRecorridoRoute}
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
                  disabled={isSubmitting || (step === totalSteps && (isOffline || (isTurnstileEnabled && !allowDevTurnstileBypass && !turnstileToken)))}
                  className={`min-w-0 flex-1 shrink rounded-none h-14 whitespace-normal px-3 text-center text-sm font-bold uppercase leading-tight tracking-wider ${primaryButtonClassName}`}
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
              <Button onClick={onClose} className={`w-full rounded-none h-14 uppercase tracking-wider font-bold ${primaryButtonClassName}`}>
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
  eventTitle,
  regionPresident,
  isRecorridoAccent,
}: { 
  eventTitle: string
  regionPresident: RegionPresident | null
  isRecorridoAccent: boolean
}) {
  const successIconClassName = isRecorridoAccent
    ? "bg-brand-green text-white"
    : "bg-primary text-primary-foreground"
  const contactIconClassName = isRecorridoAccent
    ? "bg-brand-green-soft text-brand-green"
    : "bg-primary/10 text-primary"

  return (
    <div className="py-6">
      <div className={`w-12 h-12 flex items-center justify-center mx-auto mb-5 rounded-none ${successIconClassName}`}>
        <Check className="h-6 w-6" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-foreground mb-5 uppercase tracking-wide whitespace-nowrap text-center">Gracias por registrarte</h3>
      <p className="text-sm mb-8 text-center">
          Hemos guardado tu asistencia.
      </p>
      <p className="text-sm text-muted-foreground mb-4 text-baseline">
        Si tienes dudas o necesitas ayuda, por favor, contacta a este numero de WhatsApp:
      </p>
      
      <div className="space-y-4">
        {regionPresident ? (
          <div className="text-left border border-border/50 bg-background">
            <div className="p-4 bg-muted/10">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 flex items-center justify-center shrink-0 rounded-none ${contactIconClassName}`}>
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground mb-3">{regionPresident.fullName}</p>
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
