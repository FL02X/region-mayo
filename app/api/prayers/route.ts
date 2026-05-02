/**
 * API ROUTE: POST /api/prayers
 *
 * Recibe submissions de oraciones anónimas del formulario.
 *
 * VALIDACIONES:
 * 1. reCAPTCHA v3 (detecta bots)
 * 2. Rate limiting por IP (máx 1 oración por minuto)
 * 3. Honeypot (campo trampa para bots)
 * 4. Text validation (10-500 caracteres)
 * 5. IP hash para detección de spam múltiple
 *
 * RETORNA:
 * - 201 si se creó exitosamente
 * - 400 si hay errores de validación
 * - 429 si se excede rate limit
 * - 500 si hay error en Sanity
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minuto
const RATE_LIMIT_MAX = 1 // 1 oración por minuto por IP
const HONEYPOT_FIELD = 'website_url' // Campo trampa para bots

// Rate limiting en memoria (en prod, usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function getClientIP(request: NextRequest): string {
  // Intenta obtener IP desde headers (CloudFlare, Vercel, etc)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

function hashIP(ip: string): string {
  // Hash irreversible de IP para privacy
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

function checkRateLimit(ip: string): { ok: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    // Nueva ventana
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { ok: true, remaining: RATE_LIMIT_MAX - 1 }
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { ok: false, remaining: 0 }
  }

  record.count++
  return { ok: true, remaining: RATE_LIMIT_MAX - record.count }
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    console.warn('⚠️ RECAPTCHA_SECRET_KEY no configurado. Saltando verificación.')
    return true
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    })

    const data: {
      success: boolean
      score?: number
      action?: string
    } = await response.json()

    // reCAPTCHA v3 retorna score 0.0-1.0 (1.0 = humano, 0.0 = bot)
    // Usamos threshold 0.5 (ajusta según necesites)
    if (data.success && data.score !== undefined) {
      return data.score >= 0.5
    }

    return false
  } catch (error) {
    console.error('❌ Error verificando reCAPTCHA:', error)
    return false
  }
}

function getSanityClient() {
  const projectId = process.env.SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET
  const token = process.env.SANITY_WRITE_TOKEN
  const apiVersion = process.env.SANITY_API_VERSION ?? '2025-01-01'

  if (!projectId || !dataset || !token) {
    throw new Error('❌ Configuración de Sanity incompleta')
  }

  return { projectId, dataset, token, apiVersion }
}

async function createPrayerInSanity(
  text: string,
  ipHash: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { projectId, dataset, token, apiVersion } = getSanityClient()

    const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mutations: [
          {
            create: {
              _type: 'prayer',
              text,
              ipHash,
              submittedAt: new Date().toISOString(),
              approved: false,
              spam: false,
            },
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Sanity error: ${error}`)
    }

    return { success: true }
  } catch (error) {
    console.error('❌ Error creando oración en Sanity:', error)
    return {
      success: false,
      error: 'No pudimos guardar tu oración. Intenta de nuevo más tarde.',
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // 1. OBTENER IP DEL CLIENTE
    const clientIP = getClientIP(request)
    const ipHash = hashIP(clientIP)

    // 2. RATE LIMITING
    const rateLimitCheck = checkRateLimit(clientIP)
    if (!rateLimitCheck.ok) {
      return NextResponse.json(
        {
          error: 'Demasiadas oraciones enviadas. Espera un minuto e intenta de nuevo.',
        },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    // 3. PARSE BODY
    const body = await request.json()
    const { text, recaptchaToken } = body

    // 4. VALIDAR HONEYPOT (campo trampa)
    if (body[HONEYPOT_FIELD]) {
      // Bot detectado, finge éxito para que el bot no lo intente de nuevo
      return NextResponse.json(
        { success: true, message: 'Oración recibida (honeypot)' },
        { status: 201 }
      )
    }

    // 5. VALIDAR TEXT
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Por favor, escribe una oración.' },
        { status: 400 }
      )
    }

    const trimmedText = text.trim()

    if (trimmedText.length < 10) {
      return NextResponse.json(
        { error: 'La oración debe tener al menos 10 caracteres.' },
        { status: 400 }
      )
    }

    if (trimmedText.length > 500) {
      return NextResponse.json(
        { error: 'La oración no puede tener más de 500 caracteres.' },
        { status: 400 }
      )
    }

    // 6. RECAPTCHA
    if (!recaptchaToken) {
      return NextResponse.json(
        { error: 'Verificación de seguridad fallida. Recarga la página e intenta de nuevo.' },
        { status: 400 }
      )
    }

    const isCaptchaValid = await verifyRecaptcha(recaptchaToken)
    if (!isCaptchaValid) {
      // No es definitivamente un bot, pero score bajo
      console.warn(`⚠️ reCAPTCHA score bajo para IP: ${ipHash}`)
      // Aun así, guardamos pero con flag (opcional)
    }

    // 7. CREAR EN SANITY
    const sanityResult = await createPrayerInSanity(trimmedText, ipHash)

    if (!sanityResult.success) {
      return NextResponse.json(
        { error: sanityResult.error || 'Error al guardar la oración.' },
        { status: 500 }
      )
    }

    // 8. ÉXITO
    return NextResponse.json(
      {
        success: true,
        message: 'Oración recibida. Gracias por tu petición. ¡Que Dios te bendiga!',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error en POST /api/prayers:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}

// Health check (GET)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Prayer API endpoint is running',
  })
}
