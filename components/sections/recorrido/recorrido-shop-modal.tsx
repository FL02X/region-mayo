"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { Newsreader } from "next/font/google"
import { usePathname } from "next/navigation"
import Script from "next/script"
import { Check, ChevronLeft, ChevronRight, Copy, Loader2, MessageCircle, Minus, Plus, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/shared/phone-input"
import { useConnectivity } from "@/hooks/use-connectivity"
import useLockBodyScroll from "@/hooks/use-lock-scroll"
import { useModalHistoryClose } from "@/hooks/use-modal-history-close"
import { formatPhoneForDisplay, getWhatsAppLink } from "@/lib/phone-utils"
import type { StoredProductOrder } from "@/lib/recorrido-orders"
import { sanityImageVariantUrl } from "@/lib/sanity/image"
import type { Product, ProductVariant, RegionPresident } from "@/lib/types"

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
})

const priceFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 0,
})

const SIZE_OPTIONS = ["CH", "M", "G", "XG"] as const
const isTurnstileEnabled = false
const OBVIOUS_PLACEHOLDER_NAMES = new Set(["test", "prueba", "asdf", "qwerty", "nombre", "nombre completo"])
const OBVIOUS_PHONE_NUMBERS = new Set(["0123456789", "1234567890", "9876543210"])

const recorridoShopBrandStyle = {
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

type ModalStage = "payment" | "contact" | "options" | "confirm"
type ContactFieldErrors = Partial<Record<"name" | "phone", string>>

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

interface ShopModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  regionTreasurer: RegionPresident | null
  onOrderSuccess?: (order: StoredProductOrder, remainingStock: number | null) => void
}

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ")

function getLocalMexicanPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits.length === 12 && digits.startsWith("52")) return digits.slice(2)
  if (digits.length === 13 && digits.startsWith("521")) return digits.slice(3)
  return digits
}

function formatPrice(value: number) {
  return priceFormatter.format(value)
}

function PriceAmount({ value }: { value: number }) {
  return <><span className="mr-0.5 align-super font-sans text-[0.52em] font-semibold leading-none">$</span>{formatPrice(value)} MXN</>
}

export function PaymentReceiptButton({
  phone,
  customerName,
  productName,
  variantName,
  size,
  quantity,
  compact = false,
}: {
  phone: string
  customerName: string
  productName: string
  variantName?: string
  size?: string
  quantity?: number
  compact?: boolean
}) {
  const details = [
    variantName && `Variante: *${variantName}*`,
    size && `Talla: *${size}*`,
    quantity && `Cantidad: *${quantity}*`,
  ].filter(Boolean).join("\n")
  const message = `Paz de Cristo, comprobante de pago de: *${customerName}*, para: *${productName}*${details ? `\n${details}` : ""}`

  return (
    <a
      href={getWhatsAppLink(phone, message)}
      target="_blank"
      rel="noreferrer"
      className={compact
        ? "mt-4 flex min-h-10 w-full items-center justify-center gap-2 bg-[#21b758] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#20ba5d]"
        : "mb-4 mt-6 flex h-auto min-h-18 items-center justify-center gap-4 bg-[#21b758] px-4 py-3 text-center text-[16px] font-bold uppercase leading-tight tracking-wide text-white transition-colors hover:bg-[#20ba5d]"}
    >
      <MessageCircle className={compact ? "h-4 w-4 shrink-0" : "h-9 w-9 shrink-0"} aria-hidden="true" />
      <span className="whitespace-normal break-words">{compact ? "Enviar comprobante" : "Enviar comprobante de pago"}</span>
    </a>
  )
}

function QuantityFlip({ value, children }: { value: number; children: ReactNode }) {
  const valueRef = useRef<HTMLSpanElement>(null)
  const previousValueRef = useRef(value)

  useEffect(() => {
    if (previousValueRef.current === value) return
    previousValueRef.current = value

    const element = valueRef.current
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const animation = element.animate(
      [
        { transform: "perspective(400px) rotateX(0deg)", opacity: 1 },
        { transform: "perspective(400px) rotateX(-82deg)", opacity: 0.55 },
        { transform: "perspective(400px) rotateX(0deg)", opacity: 1 },
      ],
      { duration: 180, easing: "ease-out" },
    )

    return () => animation.cancel()
  }, [value])

  return (
    <span
      ref={valueRef}
      className="inline-block"
      style={{ transformOrigin: "50% 50%" }}
    >
      {children}
    </span>
  )
}

export function ShopModal({
  product,
  isOpen,
  onClose,
  regionTreasurer,
  onOrderSuccess,
}: ShopModalProps) {
  const pathname = usePathname()
  const hasDeposit = typeof product.deposit === "number"
  const hasOptions = Boolean(product.variantsEnabled || product.allowSizeSelection)
  const stages = useMemo<ModalStage[]>(
    () => [
      ...(hasOptions ? ["options" as const] : []),
      "contact" as const,
      ...(hasDeposit ? ["payment" as const] : []),
      "confirm" as const,
    ],
    [hasDeposit, hasOptions],
  )
  const contentScrollRef = useRef<HTMLDivElement>(null)
  const turnstileContainerRef = useRef<HTMLDivElement>(null)
  const turnstileWidgetIdRef = useRef<string | null>(null)
  const { isOnline } = useConnectivity()
  const [stepIndex, setStepIndex] = useState(0)
  const [paymentType, setPaymentType] = useState<"deposit" | "full">(hasDeposit ? "deposit" : "full")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [formStartTime, setFormStartTime] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<(typeof SIZE_OPTIONS)[number]>("CH")
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [copied, setCopied] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState("")
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""
  const allowDevTurnstileBypass = process.env.NODE_ENV !== "production" && !turnstileSiteKey

  useLockBodyScroll(isOpen)
  useModalHistoryClose(isOpen, onClose, () => {
    if (stepIndex === 0 || isComplete) return false
    setSubmitError(null)
    setStepIndex((current) => Math.max(current - 1, 0))
    contentScrollRef.current?.scrollTo({ top: 0 })
    return true
  })

  useEffect(() => {
    if (!isOpen) return

    setStepIndex(0)
    setPaymentType(hasDeposit ? "deposit" : "full")
    setName("")
    setPhone("")
    setHoneypot("")
    setFormStartTime(Date.now())
    setFieldErrors({})
    setSelectedVariantId(null)
    setSelectedSize("CH")
    setQuantity(1)
    setIsSubmitting(false)
    setSubmitError(null)
    setIsComplete(false)
    setCopied(false)
    setTurnstileToken("")
  }, [hasDeposit, isOpen, product.id])

  const stage = stages[stepIndex]
  const selectedVariant: ProductVariant | undefined = selectedVariantId
    ? product.variants?.find((variant) => variant.id === selectedVariantId)
    : undefined
  const selectedImage = selectedVariant?.photos[0] || product.photos[0] || "/placeholder.svg"
  const unitPrice = paymentType === "deposit" && hasDeposit ? product.deposit! : product.price
  const totalPrice = unitPrice * quantity
  const pendingBalance = paymentType === "deposit" ? Math.max(0, product.price * quantity - totalPrice) : 0
  const selectedVariantName = product.variantsEnabled
    ? selectedVariant?.name || product.name
    : undefined
  const canProvidePaymentDetails = Boolean(product.clabe && product.recipientBank && product.recipientName)
  const canSubmitOrder = !isTurnstileEnabled || allowDevTurnstileBypass || Boolean(turnstileToken)

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
    if (!isTurnstileEnabled || !isOpen || stage !== "confirm" || isComplete || isSubmitting) return

    renderTurnstile()

    return () => {
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current)
        turnstileWidgetIdRef.current = null
      }
      setTurnstileToken("")
    }
  }, [isComplete, isOpen, isSubmitting, renderTurnstile, stage])

  const validateContact = () => {
    const normalizedName = normalizeName(name)
    const normalizedPhone = getLocalMexicanPhoneDigits(phone)
    const nextErrors: ContactFieldErrors = {}

    if (normalizedName.length < 2 || (normalizedName.match(/\p{L}/gu) ?? []).length < 2) {
      nextErrors.name = "Escribe tu nombre completo."
    } else if (normalizedName.split(" ").length < 2) {
      nextErrors.name = "Escribe tu nombre y apellido."
    } else if (normalizedName.length > 80 || !/^[\p{L}\p{M}\s.'’-]+$/u.test(normalizedName)) {
      nextErrors.name = "Usa solo letras y espacios."
    } else if (normalizedName.toLocaleLowerCase("es-MX").split(" ").some((part) => OBVIOUS_PLACEHOLDER_NAMES.has(part))) {
      nextErrors.name = "Escribe tu nombre completo real."
    }

    if (normalizedPhone.length !== 10 || /^(\d)\1{9}$/.test(normalizedPhone) || OBVIOUS_PHONE_NUMBERS.has(normalizedPhone)) {
      nextErrors.phone = "Escribe los 10 digitos de tu celular."
    }

    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return null

    setName(normalizedName)
    setPhone(normalizedPhone)
    return { name: normalizedName, phone: normalizedPhone }
  }

  const handleNext = () => {
    setSubmitError(null)
    if (stage === "contact" && !validateContact()) return
    setStepIndex((current) => Math.min(current + 1, stages.length - 1))
    contentScrollRef.current?.scrollTo({ top: 0 })
  }

  const handleBack = () => {
    setSubmitError(null)
    setStepIndex((current) => Math.max(current - 1, 0))
    contentScrollRef.current?.scrollTo({ top: 0 })
  }

  const handleSubmit = async () => {
    const contact = validateContact()
    if (!contact) {
      setStepIndex(stages.indexOf("contact"))
      return
    }
    if (!canProvidePaymentDetails) {
      setSubmitError("Este producto aun no tiene la informacion de pago configurada.")
      return
    }
    if (!isOnline) {
      setSubmitError("Sin conexion. Conectate a internet para registrar tu pedido.")
      return
    }
    if (!canSubmitOrder) {
      setSubmitError("Completa la verificacion de seguridad para continuar.")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const response = await fetch("/api/product-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          name: contact.name,
          phone: contact.phone,
          paymentType,
          variantId: selectedVariantId,
          size: product.allowSizeSelection ? selectedSize : null,
          quantity,
          website: honeypot,
          _requestTime: formStartTime,
          turnstileToken: turnstileToken || (allowDevTurnstileBypass ? "dev-bypass" : ""),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "No se pudo registrar el pedido.")

      if (typeof data.orderId !== "string" || !data.orderId) {
        throw new Error("El pedido se registro, pero no recibimos su identificador.")
      }
      onOrderSuccess?.({
        id: data.orderId,
        productId: product.id,
        customerName: contact.name,
        variantId: selectedVariantId ?? undefined,
        variantName: selectedVariantName,
        size: product.allowSizeSelection ? selectedSize : undefined,
        paymentType,
        paymentAmount: totalPrice,
        quantity,
        createdAt: new Date().toISOString(),
      }, typeof data.remainingStock === "number" ? data.remainingStock : null)
      setIsComplete(true)
      contentScrollRef.current?.scrollTo({ top: 0 })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo registrar el pedido.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyClabe = async () => {
    if (!product.clabe) return
    try {
      await navigator.clipboard.writeText(product.clabe)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setSubmitError("No se pudo copiar la CLABE. Puedes copiarla manualmente.")
    }
  }

  if (!isOpen || typeof document === "undefined") return null

  const stepLabels: Record<ModalStage, string> = {
    payment: "Forma de pago",
    contact: "Contacto",
    options: "Personalizar",
    confirm: "Confirmar pedido",
  }
  const modalAccentStyle = pathname === "/recorrido-mayo-2026" ? recorridoShopBrandStyle : undefined

  const modal = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden sm:p-4" style={modalAccentStyle}>
      {isTurnstileEnabled && turnstileSiteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={renderTurnstile}
        />
      )}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(event) => setHoneypot(event.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <section
        className="absolute inset-0 flex w-full flex-col bg-background shadow-2xl animate-in fade-in sm:relative sm:inset-auto sm:max-h-[88vh] sm:max-w-2xl sm:zoom-in-95"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-modal-title"
      >
        <header className="z-10 flex shrink-0 items-center justify-between border-b bg-background px-5 py-4">
          <div className="min-w-0 pr-3">
            <h2 id="shop-modal-title" className="text-lg font-bold uppercase tracking-wide text-foreground">Pedido</h2>
            <p className="truncate text-sm text-muted-foreground">{product.name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar pedido" className="h-10 w-10 shrink-0 rounded-none">
            <X className="h-5 w-5" />
          </Button>
        </header>

        {!isComplete && (
          <div className="shrink-0 border-b bg-muted/20 px-5 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-brand">
              Paso {stepIndex + 1} de {stages.length} <span className="mx-1 font-normal text-muted-foreground">|</span> {stepLabels[stage]}
            </p>
          </div>
        )}

        <div ref={contentScrollRef} className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {!isComplete && !isOnline && (
            <div className="mb-5 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Sin conexion. Necesitas internet para registrar el pedido.
            </div>
          )}

          {!isComplete && stage === "payment" && hasDeposit && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-foreground">Elige cuánto pagar ahora</p>
                <p className="mt-1 text-sm text-muted-foreground">Selecciona lo que deseas cubrir hoy.</p>
              </div>
              {[
                {
                  value: "deposit" as const,
                  title: "Anticipo",
                  description: "Aparta tu producto con un pago inicial.",
                  amount: product.deposit!,
                  pendingAmount: Math.max(0, product.price - product.deposit!),
                },
                {
                  value: "full" as const,
                  title: "Pago completo",
                  description: "Cubre el total del producto ahora.",
                  amount: product.price,
                },
              ].map((option) => {
                const selected = paymentType === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPaymentType(option.value)}
                    className={`flex min-h-28 w-full items-center gap-4 border p-5 text-left transition-colors ${
                      selected ? "border-brand bg-brand-soft/40" : "border-border bg-background hover:border-brand/50"
                    }`}
                    aria-pressed={selected}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-brand" : "border-border"}`}>
                      {selected && <span className="h-3 w-3 rounded-full bg-brand" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold text-foreground">{option.title}</span>
                      {/* <span className="mt-1 block text-sm text-muted-foreground">{option.description}</span> */}
                      <span className={`mt-1.5 block text-2xl font-semibold tracking-tight text-ink ${editorialFont.className}`}>
                        <PriceAmount value={option.amount} />
                      </span>
                      {typeof option.pendingAmount === "number" && (
                        <span className="mt-1 block text-sm font-medium text-muted-foreground">
                          Pago pendiente: <PriceAmount value={option.pendingAmount} />
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {!isComplete && stage === "contact" && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="shop-name" className="text-sm font-bold uppercase tracking-wider">Nombre completo</Label>
                <Input
                  id="shop-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setFieldErrors((current) => ({ ...current, name: undefined }))
                  }}
                  placeholder="Escribe tu nombre"
                  aria-invalid={Boolean(fieldErrors.name)}
                  className="mt-2 h-12 rounded-none border-brand-green-border"
                />
                {fieldErrors.name && <p className="mt-2 text-xs font-medium text-destructive">{fieldErrors.name}</p>}
              </div>
              <div>
                <Label htmlFor="shop-phone" className="text-sm font-bold uppercase tracking-wider">Telefono</Label>
                <div className="mt-2 [&_input]:h-12 [&_input]:rounded-none">
                  <PhoneInput
                    id="shop-phone"
                    value={phone}
                    onChange={(value) => {
                      setPhone(value)
                      setFieldErrors((current) => ({ ...current, phone: undefined }))
                    }}
                    aria-invalid={Boolean(fieldErrors.phone)}
                    className="border-brand-green-border"
                  />
                </div>
                {fieldErrors.phone && <p className="mt-2 text-xs font-medium text-destructive">{fieldErrors.phone}</p>}
              </div>
            </div>
          )}

          {!isComplete && stage === "options" && (
            <div className="space-y-7">
              {product.variantsEnabled && (
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-foreground">Elige una variante</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[{ id: null, name: product.name, photos: product.photos }, ...(product.variants ?? [])].map((variant) => {
                      const isSelected = selectedVariantId === variant.id
                      const image = variant.photos[0] || "/placeholder.svg"
                      return (
                        <button
                          key={variant.id ?? "original"}
                          type="button"
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={`overflow-hidden border text-left transition-colors ${isSelected ? "border-brand ring-1 ring-brand" : "border-border hover:border-brand/50"}`}
                          aria-pressed={isSelected}
                        >
                          <span className="relative block aspect-square bg-muted/30">
                            <Image src={sanityImageVariantUrl(image, { width: 440, quality: 72, format: "webp", fit: "max" })} alt={variant.name} fill unoptimized className="object-contain" />
                          </span>
                          <span className="block border-t px-3 py-2 text-sm font-medium text-foreground">{variant.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {product.allowSizeSelection && (
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-foreground">Selecciona una talla</p>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {SIZE_OPTIONS.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`min-h-12 border text-sm font-bold ${selectedSize === size ? "border-brand bg-brand text-white" : "border-border bg-background text-foreground hover:border-brand"}`}
                        aria-pressed={selectedSize === size}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isComplete && stage === "confirm" && (
            <div className="space-y-5">
              {isSubmitting ? (
                <div className="flex min-h-72 flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-brand" />
                  <p className="mt-4 text-sm text-muted-foreground">Registrando tu pedido...</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-4 border border-border p-4">
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-muted/30">
                      <Image src={sanityImageVariantUrl(selectedImage, { width: 360, quality: 75, format: "webp", fit: "max" })} alt={product.name} fill unoptimized className="object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{product.name}</p>
                      {selectedVariantName && <p className="mt-1 text-sm text-muted-foreground">Variante: {selectedVariantName}</p>}
                      {product.allowSizeSelection && <p className="mt-1 text-sm text-muted-foreground">Talla: {selectedSize}</p>}
                      <p className={`mt-2 text-md font-semibold tracking-tight text-ink ${editorialFont.className}`}><PriceAmount value={unitPrice} /></p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-brand">{paymentType === "deposit" ? "Anticipo" : "Pago completo"}</p>
                    </div>
                  </div>

                  {product.allowMultipleQuantity && (
                    <div className="flex items-center justify-between border border-border p-4">
                      <span className="text-sm font-semibold uppercase tracking-wide text-foreground">Cantidad</span>
                      <div className="flex items-center border border-border">
                        <Button variant="ghost" size="icon" onClick={() => setQuantity((current) => Math.max(1, current - 1))} disabled={quantity === 1} aria-label="Reducir cantidad" className="h-10 w-10 rounded-none">
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="flex h-10 min-w-10 items-center justify-center border-x px-3 text-sm font-bold">
                          <QuantityFlip value={quantity}>{quantity}</QuantityFlip>
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => setQuantity((current) => Math.min(99, current + 1))} aria-label="Aumentar cantidad" className="h-10 w-10 rounded-none">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="border border-brand bg-brand-soft/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-brand">{paymentType === "deposit" ? "Pagas ahora" : "Total a pagar"}</p>
                      <p className={`mt-1 text-2xl font-semibold tracking-tight text-ink ${editorialFont.className}`}>
                        <QuantityFlip value={quantity}>
                          <PriceAmount value={totalPrice} />
                        </QuantityFlip>
                      </p>
                    </div>
                    {paymentType === "deposit" && (
                      <div className="border border-brand/30 bg-brand-soft/30 px-4 py-3 opacity-75">
                        <p className="text-xs font-bold uppercase tracking-wider text-brand">Saldo pendiente</p>
                        <p className={`mt-1 text-2xl font-semibold tracking-tight text-ink ${editorialFont.className}`}>
                          <QuantityFlip value={quantity}>
                            <PriceAmount value={pendingBalance} />
                          </QuantityFlip>
                        </p>
                      </div>
                    )}
                  </div>
                  {product.allowSizeSelection && (
                    <p className="ml-2 text-xs leading-relaxed text-muted-foreground">
                      <span className="font-bold">NOTA:</span>
                      <br />
                      - Los productos seran entregados durante el transcurso de la actividad.
                    </p>
                  )}
                  {isTurnstileEnabled && (allowDevTurnstileBypass ? (
                    <p className="text-xs text-muted-foreground">Verificacion de seguridad no configurada en desarrollo.</p>
                  ) : turnstileSiteKey ? (
                    <div className="min-h-[65px] overflow-x-auto">
                      <div ref={turnstileContainerRef} />
                    </div>
                  ) : (
                    <p className="text-xs text-destructive">Falta configurar Turnstile para registrar pedidos.</p>
                  ))}
                </>
              )}
            </div>
          )}

          {isComplete && (
            <div className="space-y-6">
              <div className="border border-brand bg-brand-soft/30 p-4">
                <p className="text-sm font-bold uppercase tracking-wide text-brand">Solicitud registrada</p>
                <p className="mt-1 text-sm text-foreground">Realiza la transferencia y envía tu comprobante para confirmar el pedido.</p>
              </div>

              <div className="space-y-7">
                <section>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-background text-sm font-bold text-brand">1</span>
                    <p className="text-sm font-bold uppercase tracking-wider text-foreground">Haz tu transferencia</p>
                  </div>
                  <div className="mt-3 space-y-3 border border-border p-4 text-sm">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">CLABE</p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <span className="font-medium tracking-wide text-foreground">{product.clabe}</span>
                        <Button variant="ghost" size="sm" onClick={handleCopyClabe} className="h-8 rounded-none px-2 text-brand">
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copied ? "Copiado" : "Copiar"}
                        </Button>
                      </div>
                    </div>
                    <div><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Banco</p><p className="mt-1 font-medium text-foreground">{product.recipientBank}</p></div>
                    <div><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Destinatario</p><p className="mt-1 font-medium text-[16px] text-foreground">{product.recipientName}</p></div>
                    <div><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Asunto</p><p className="mt-1 italic text-muted-foreground mb-6">Tu nombre completo</p></div>
                    <div className="flex items-end justify-between gap-3 border-t border-border/50 pt-5 pb-3"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Monto</p><p className={`mb-[-8px] text-lg font-semibold tracking-tight text-ink ${editorialFont.className}`}><PriceAmount value={totalPrice} /></p></div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-background text-sm font-bold text-brand">2</span>
                    <p className="text-sm font-bold uppercase tracking-wider text-foreground">Envia captura de pantalla de tu comprobante</p>
                  </div>
                  {regionTreasurer && (
                    <div className="mt-4.5 border border-border/50 bg-background p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-brand-soft text-brand">
                          <User className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-foreground">{regionTreasurer.fullName}</p>
                          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tesorero/a regional</p>
                          <p className="mt-2 text-sm text-muted-foreground">{formatPhoneForDisplay(regionTreasurer.phone)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {regionTreasurer?.phone ? (
                    <PaymentReceiptButton
                      phone={regionTreasurer.phone}
                      customerName={name}
                      productName={product.name}
                      variantName={product.variantsEnabled ? selectedVariantName : undefined}
                      size={product.allowSizeSelection ? selectedSize : undefined}
                      quantity={product.allowMultipleQuantity ? quantity : undefined}
                    />
                  ) : (
                    <p className="mt-3 border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">Aun no hay un tesorero con telefono configurado en la directiva actual.</p>
                  )}
                </section>
              </div>
            </div>
          )}
        </div>

        {!isComplete && (
          <footer className="shrink-0 border-t bg-background px-5 py-4">
            {submitError && <p className="mb-3 border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{submitError}</p>}
            <div className="flex gap-3">
              {stepIndex > 0 && (
                <Button variant="outline" onClick={handleBack} disabled={isSubmitting} className="min-h-12 rounded-none px-5 font-bold uppercase tracking-wide">
                  <ChevronLeft className="h-4 w-4" /> Atras
                </Button>
              )}
              <Button
                onClick={stage === "confirm" ? handleSubmit : handleNext}
                disabled={isSubmitting || (stage === "confirm" && !canSubmitOrder)}
                className="h-auto min-h-12 min-w-0 flex-1 shrink whitespace-normal break-words rounded-none bg-brand px-3 py-2 text-center font-bold uppercase leading-tight tracking-wide text-white hover:bg-brand-hover"
              >
                {stage === "confirm" ? (
                  <>Confirmar pedido <ChevronRight className="h-4 w-4" /></>
                ) : (
                  <>Continuar <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </footer>
        )}
        {isComplete && (
          <footer className="shrink-0 border-t bg-background px-5 py-4">
            <Button onClick={onClose} className="min-h-12 w-full rounded-none bg-brand font-bold uppercase tracking-wide text-white hover:bg-brand-hover">
              Cerrar
            </Button>
          </footer>
        )}
      </section>
    </div>
  )

  return createPortal(modal, document.body)
}
