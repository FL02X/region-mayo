import { NextRequest, NextResponse } from "next/server"
import { createProductOrder } from "@/lib/product-order-sheets"

const isTurnstileEnabled = false

type TurnstileResponse = {
  success?: boolean
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0].trim()
  return request.headers.get("x-real-ip") || ""
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
    const body = await request.json()
    if (isTurnstileEnabled) {
      const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken.trim() : ""
      const turnstileOk = await verifyTurnstile(turnstileToken, getClientIp(request))
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
    const message = error instanceof Error ? error.message : "No se pudo registrar el pedido."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
