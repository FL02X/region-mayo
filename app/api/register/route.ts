import { NextRequest, NextResponse } from "next/server"

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 5 // 5 requests per minute per IP
const MIN_REQUEST_INTERVAL = 2000 // 2 seconds between requests
const isTurnstileEnabled = false

// Simple honeypot field name (bots will fill this)
const HONEYPOT_FIELD = "website"
const ATTENDING_AS_VALUES = ["oyente", "varonDorca", "jovenMGR"] as const
const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets"

type RegistrationAttendingAs = (typeof ATTENDING_AS_VALUES)[number]
type TurnstileResponse = {
  success?: boolean
}
type GoogleSheetsConfig = {
  spreadsheetId: string
  sheetName: string
  clientEmail: string
  privateKey: string
}

async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    return process.env.NODE_ENV !== "production" && token === "dev-bypass"
  }

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip && ip !== "unknown") body.set("remoteip", ip)

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

function getRegistrationAttendingAs(
  isBaptized: boolean,
  isCoroMGR: boolean,
): RegistrationAttendingAs {
  if (isCoroMGR) return "jovenMGR"
  if (isBaptized) return "varonDorca"
  return "oyente"
}

const registrationTypeLabels: Record<RegistrationAttendingAs, string> = {
  oyente: "Oyente",
  varonDorca: "Varon / Dorca",
  jovenMGR: "Joven MGR",
}

const registrationTypeCellColors: Record<RegistrationAttendingAs, { red: number; green: number; blue: number }> = {
  jovenMGR: { red: 0.184, green: 0.369, blue: 0.576 },
  varonDorca: { red: 0.294, green: 0.204, blue: 0.149 },
  oyente: { red: 0.31, green: 0.435, blue: 0.271 },
}

function getGoogleSheetsConfig(): GoogleSheetsConfig | null {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim()
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME?.trim() || "Registros"
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.trim()
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!spreadsheetId && !clientEmail && !privateKey) {
    return null
  }

  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new Error("Missing Google Sheets configuration")
  }

  return { spreadsheetId, sheetName, clientEmail, privateKey }
}

function encodeBase64Url(value: string | ArrayBuffer): string {
  return Buffer.from(value instanceof ArrayBuffer ? new Uint8Array(value) : value).toString("base64url")
}

async function importGooglePrivateKey(privateKey: string) {
  const keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "")

  return crypto.subtle.importKey(
    "pkcs8",
    Buffer.from(keyData, "base64"),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  )
}

async function getGoogleSheetsAccessToken(config: GoogleSheetsConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = encodeBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claim = encodeBase64Url(JSON.stringify({
    iss: config.clientEmail,
    scope: GOOGLE_SHEETS_SCOPE,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }))
  const unsignedToken = `${header}.${claim}`
  const privateKey = await importGooglePrivateKey(config.privateKey)
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(unsignedToken),
  )
  const assertion = `${unsignedToken}.${encodeBase64Url(signature)}`
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  })

  if (!response.ok) {
    throw new Error(`Google OAuth failed: ${await response.text()}`)
  }

  const data = (await response.json()) as { access_token?: string }

  if (!data.access_token) {
    throw new Error("Google OAuth did not return an access token")
  }

  return data.access_token
}

function getGoogleSheetRange(sheetName: string, range: string): string {
  return `'${sheetName.replace(/'/g, "''")}'!${range}`
}

async function getGoogleSheetId(config: GoogleSheetsConfig, accessToken: string): Promise<number> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}?fields=sheets.properties(sheetId,title)`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )

  if (!response.ok) {
    throw new Error(`Google Sheets metadata failed: ${await response.text()}`)
  }

  const data = (await response.json()) as {
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>
  }
  const sheet = data.sheets?.find((item) => item.properties?.title === config.sheetName)
  const sheetId = sheet?.properties?.sheetId

  if (typeof sheetId === "number") {
    return sheetId
  }

  const createResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: config.sheetName } } }],
      }),
    },
  )

  if (!createResponse.ok) {
    throw new Error(`Google Sheet tab create failed: ${await createResponse.text()}`)
  }

  const createData = (await createResponse.json()) as {
    replies?: Array<{ addSheet?: { properties?: { sheetId?: number } } }>
  }
  const createdSheetId = createData.replies?.[0]?.addSheet?.properties?.sheetId

  if (typeof createdSheetId !== "number") {
    throw new Error(`Google Sheet tab create did not return a sheetId: ${config.sheetName}`)
  }

  return createdSheetId
}

async function ensureGoogleSheetsHeaders(config: GoogleSheetsConfig, accessToken: string) {
  const headers = [
    "Nombre",
    "Telefono",
    "Tipo",
    "Necesita Transporte",
    "Necesita Hospedaje",
    "Hermano bautizado",
    "Joven MGR",
    "Region",
  ]
  const range = getGoogleSheetRange(config.sheetName, "A1:H1")
  const getResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )

  if (getResponse.ok) {
    const data = (await getResponse.json()) as { values?: string[][] }
    const currentHeaders = data.values?.[0] ?? []
    if (headers.every((header, index) => currentHeaders[index] === header)) return
  }

  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [headers] }),
    },
  )

  if (!updateResponse.ok) {
    throw new Error(`Google Sheets header update failed: ${await updateResponse.text()}`)
  }
}

async function appendRegistrationToGoogleSheets(
  registrationData: {
    name: string
    phone: string
    needsLodging: boolean
    needsTransport: boolean
    attendingAs: RegistrationAttendingAs
    isBaptized: boolean
    isCoroMGR: boolean
    isFromAnotherRegion: boolean
  },
) {
  const config = getGoogleSheetsConfig()

  if (!config) return

  const accessToken = await getGoogleSheetsAccessToken(config)
  const sheetId = await getGoogleSheetId(config, accessToken)

  await ensureGoogleSheetsHeaders(config, accessToken)

  const yesNo = (value: boolean) => (value ? "SÍ" : "NO")
  const range = getGoogleSheetRange(config.sheetName, "A:H")
  const appendResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [[
          registrationData.name,
          registrationData.phone,
          registrationTypeLabels[registrationData.attendingAs],
          yesNo(registrationData.needsTransport),
          yesNo(registrationData.needsLodging),
          yesNo(registrationData.isBaptized),
          yesNo(registrationData.isCoroMGR),
          registrationData.isFromAnotherRegion ? "OTRA REGIÓN" : "MAYO",
        ]],
      }),
    },
  )

  if (!appendResponse.ok) {
    throw new Error(`Google Sheets append failed: ${await appendResponse.text()}`)
  }

  const appendData = (await appendResponse.json()) as { updates?: { updatedRange?: string } }
  const rowNumber = Number(appendData.updates?.updatedRange?.match(/![A-Z]+(\d+):/)?.[1])

  if (!rowNumber) return

  const formatResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: rowNumber - 1,
                endRowIndex: rowNumber,
                startColumnIndex: 2,
                endColumnIndex: 3,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: registrationTypeCellColors[registrationData.attendingAs],
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                  },
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat)",
            },
          },
        ],
      }),
    },
  )

  if (!formatResponse.ok) {
    console.warn(`[register] Google Sheets format failed: ${await formatResponse.text()}`)
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

  if (!data.eventId || typeof data.eventId !== "string") {
    errors.push("Evento es requerido")
  }

  // Validate attendingAs
  if (
    data.attendingAs &&
    !ATTENDING_AS_VALUES.includes(String(data.attendingAs) as RegistrationAttendingAs)
  ) {
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
    const isCoroMGR = Boolean(body.isCoroMGR)
    const isBaptized = Boolean(body.isBaptized) || isCoroMGR
    const isFromAnotherRegion = Boolean(body.isFromAnotherRegion)
    const attendingAs = getRegistrationAttendingAs(isBaptized, isCoroMGR)
    const registrationData = {
      name: sanitizeString(body.name),
      phone: sanitizePhone(body.phone),
      needsLodging: Boolean(body.needsLodging),
      needsTransport: Boolean(body.needsTransport),
      attendingAs,
      isBaptized,
      isCoroMGR,
      isFromAnotherRegion,
      registeredAt: new Date().toISOString(),
      ipAddress: ip,
      userAgent: userAgent.slice(0, 500),
    }

    await appendRegistrationToGoogleSheets(registrationData)

    return NextResponse.json({
      success: true,
      message: "Registro exitoso. El staff ha sido notificado.",
    })

  } catch (error) {
    console.error("[register] Registration error:", error)
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
