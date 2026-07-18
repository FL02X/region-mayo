import { NextRequest, NextResponse } from "next/server"
import { cancelProductOrder, createProductOrder, ProductOrderUserError } from "@/lib/product-order-sheets"

const isTurnstileEnabled = false
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 2 * 60 * 1000
const RATE_LIMIT_MAX = 5
const MIN_REQUEST_INTERVAL = 5 * 1000
const HONEYPOT_FIELD = "website"

type TurnstileResponse = {
  success?: boolean
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0].trim()
  return request.headers.get("x-real-ip") || ""
}

function checkRateLimit(ip: string) {
  const now = Date.now()
  const current = rateLimitStore.get(ip)
  if (!current || now > current.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true }
  }
  if (current.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((current.resetTime - now) / 1000) }
  }

  current.count++
  return { allowed: true }
}

async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    return process.env.NODE_ENV !== "production" && token === "dev-bypass"
  }

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip) body.set("remoteip", ip)

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })
    if (!response.ok) return false

    const result = (await response.json()) as TurnstileResponse
    return Boolean(result.success)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request) || "unknown"
    const rateLimit = checkRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Demasiados pedidos. Intenta de nuevo en unos minutos." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
      )
    }

    const body = await request.json()
    if (body[HONEYPOT_FIELD]) return NextResponse.json({ success: true })

    const requestTime = Number(body._requestTime)
    if (!Number.isFinite(requestTime) || Date.now() - requestTime < MIN_REQUEST_INTERVAL) {
      return NextResponse.json(
        { error: "Por favor, completa el pedido con calma." },
        { status: 400 },
      )
    }

    if (isTurnstileEnabled) {
      const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken.trim() : ""
      const turnstileOk = await verifyTurnstile(turnstileToken, ip)
      if (!turnstileOk) {
        return NextResponse.json(
          { error: "No pudimos verificar que eres una persona. Intenta de nuevo." },
          { status: 400 },
        )
      }
    }

    const result = await createProductOrder({
      productId: String(body.productId ?? ""),
      name: body.name,
      phone: body.phone,
      paymentType: body.paymentType,
      variantId: typeof body.variantId === "string" ? body.variantId : null,
      size: typeof body.size === "string" ? body.size : null,
      quantity: Number(body.quantity),
    })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[product-order]", error)
    if (error instanceof ProductOrderUserError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: "No se pudo registrar el pedido. Intenta de nuevo." },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const productId = typeof body.productId === "string" ? body.productId.trim() : ""
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : ""
    await cancelProductOrder(productId, orderId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[product-order-cancel]", error)
    if (error instanceof ProductOrderUserError) {
      if (error.code === "ORDER_ALREADY_PAID") {
        return NextResponse.json({ code: error.code, error: error.message }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: "No se pudo cancelar el pedido. Intenta de nuevo." },
      { status: 500 },
    )
  }
}
