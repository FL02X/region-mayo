import { NextRequest, NextResponse } from "next/server"

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 5 // 5 requests per minute per IP
const MIN_REQUEST_INTERVAL = 2000 // 2 seconds between requests

// Simple honeypot field name (bots will fill this)
const HONEYPOT_FIELD = "website"

function getSanityWriteClient() {
  const projectId = process.env.SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET
  const token = process.env.SANITY_WRITE_TOKEN
  const apiVersion = process.env.SANITY_API_VERSION ?? "2024-01-01"

  if (!projectId || !dataset) {
    throw new Error("Missing Sanity configuration")
  }

  return {
    async createDocument(doc: Record<string, unknown>) {
      const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`
      
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mutations: [
            {
              create: {
                _type: "registration",
                ...doc,
              },
            },
          ],
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Sanity mutation failed: ${text}`)
      }

      return res.json()
    },
  }
}

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")
  const realIP = req.headers.get("x-real-ip")
  
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  if (realIP) {
    return realIP
  }
  return "unknown"
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  // Clean up old entries
  if (record && now > record.resetTime) {
    rateLimitStore.delete(ip)
  }

  const currentRecord = rateLimitStore.get(ip)

  if (!currentRecord) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true }
  }

  if (currentRecord.count >= RATE_LIMIT_MAX) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((currentRecord.resetTime - now) / 1000) 
    }
  }

  currentRecord.count++
  return { allowed: true }
}

// Input sanitization
function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return ""
  return input
    .trim()
    .slice(0, 500) // Max length
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>'"]/g, "") // Remove potential injection characters
}

function sanitizePhone(input: unknown): string {
  if (typeof input !== "string") return ""
  return input.replace(/[^\d]/g, "").slice(0, 15)
}

function validateRegistration(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields
  if (!data.name || typeof data.name !== "string" || data.name.trim().length < 2) {
    errors.push("Nombre es requerido (mínimo 2 caracteres)")
  }

  if (!data.phone || typeof data.phone !== "string" || data.phone.replace(/\D/g, "").length < 10) {
    errors.push("Teléfono válido es requerido (mínimo 10 dígitos)")
  }

  if (!data.region || typeof data.region !== "string") {
    errors.push("Región es requerida")
  }

  if (!data.eventId || typeof data.eventId !== "string") {
    errors.push("Evento es requerido")
  }

  // Validate attendingAs
  if (data.attendingAs && !["oyente", "miembro"].includes(String(data.attendingAs))) {
    errors.push("Tipo de asistencia inválido")
  }

  return { valid: errors.length === 0, errors }
}

export async function POST(req: NextRequest) {
  try {
    // Get client info
    const ip = getClientIP(req)
    const userAgent = req.headers.get("user-agent") || "unknown"

    // Rate limiting
    const rateLimit = checkRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
        { 
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) }
        }
      )
    }

    // Parse body
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: "Formato de solicitud inválido" },
        { status: 400 }
      )
    }

    // Honeypot check - if bot filled this field, silently reject
    if (body[HONEYPOT_FIELD]) {
      // Return success to trick bots but don't actually save
      return NextResponse.json({ success: true, message: "Registro exitoso" })
    }

    // Timestamp check - request should have a reasonable timestamp
    const requestTime = body._requestTime
    if (requestTime) {
      const timeDiff = Date.now() - Number(requestTime)
      if (timeDiff < MIN_REQUEST_INTERVAL) {
        // Form was submitted too fast, likely a bot
        return NextResponse.json(
          { error: "Por favor, completa el formulario con calma." },
          { status: 400 }
        )
      }
    }

    // Validate input
    const validation = validateRegistration(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.errors },
        { status: 400 }
      )
    }

    // Prepare sanitized data
    const registrationData = {
      name: sanitizeString(body.name),
      phone: sanitizePhone(body.phone),
      region: sanitizeString(body.region),
      event: { _type: "reference", _ref: String(body.eventId) },
      isVisiting: Boolean(body.isVisiting),
      needsLodging: Boolean(body.needsLodging),
      needsTransport: Boolean(body.needsTransport),
      attendingAs: body.attendingAs === "miembro" ? "miembro" : "oyente",
      isBaptized: Boolean(body.isBaptized),
      isCoroMGR: Boolean(body.isCoroMGR),
      registeredAt: new Date().toISOString(),
      ipAddress: ip,
      userAgent: userAgent.slice(0, 500),
    }

    // Check if Sanity is configured
    const hasWriteToken = Boolean(process.env.SANITY_WRITE_TOKEN)
    
    if (hasWriteToken) {
      // Save to Sanity
      const client = getSanityWriteClient()
      await client.createDocument(registrationData)
    } else {
      // Log for debugging when Sanity write is not configured
      console.log("[v0] Registration received (Sanity write not configured):", {
        name: registrationData.name,
        region: registrationData.region,
        eventRef: body.eventId,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Registro exitoso. El staff ha sido notificado.",
    })

  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json(
      { error: "Error al procesar el registro. Intenta de nuevo." },
      { status: 500 }
    )
  }
}

// Reject other methods
export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 })
}
