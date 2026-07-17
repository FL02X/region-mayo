import { NextRequest, NextResponse } from "next/server"
import {
  REGISTRATION_FOLLOW_UP_VALUES,
  formatRegistrationDate,
  getInternationalPhone,
  getRegistrationFollowUp,
  getWhatsappUrl,
  normalizeMexicanPhone,
} from "@/lib/registration-sheet"
import { REGISTRATION_REGIONS, type RegistrationRegion } from "@/lib/types"

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

const SHEET_HEADERS = [
  "ID",
  "Nombre",
  "Teléfono",
  "Fecha y hora",
  "Tipo",
  "Región",
  "Hospedaje",
  "Transporte",
  "Seguimiento",
  "Nota",
] as const
const PREVIOUS_SHEET_HEADERS = [
  "ID",
  "Nombre",
  "Teléfono",
  "Fecha y hora",
  "Tipo",
  "Región",
  "Hospedaje",
  "Transporte",
  "Bautizado",
  "Seguimiento",
  "Nota",
] as const
const LEGACY_SHEET_HEADERS = [
  "Nombre",
  "Telefono",
  "Tipo",
  "Necesita Transporte",
  "Necesita Hospedaje",
  "Hermano bautizado",
  "Joven MGR",
  "Region",
] as const
const TABLE_HEADER_ROW_NUMBER = 3
const TABLE_DATA_ROW_NUMBER = TABLE_HEADER_ROW_NUMBER + 1

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

const headersMatch = (current: string[], expected: readonly string[]) =>
  current.length === expected.length && expected.every((header, index) => current[index] === header)

const yesNo = (value: boolean | "unknown") => value === "unknown" ? "AÚN NO LO SÉ" : value ? "SÍ" : "NO"

const normalizeSheetPreference = (value: unknown) => {
  const normalized = String(value ?? "").trim().toLocaleUpperCase("es-MX")
  if (normalized === "SÍ" || normalized === "SI") return "SÍ"
  if (normalized === "NO") return "NO"
  return "AÚN NO LO SÉ"
}

async function ensureGoogleSheetsHeaders(config: GoogleSheetsConfig, accessToken: string) {
  const range = getGoogleSheetRange(config.sheetName, "A:K")
  const getResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}?valueRenderOption=FORMULA`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )

  if (!getResponse.ok) {
    throw new Error(`Google Sheets values read failed: ${await getResponse.text()}`)
  }

  const rows = ((await getResponse.json()) as { values?: string[][] }).values ?? []
  const tableHeaders = rows[TABLE_HEADER_ROW_NUMBER - 1] ?? []
  if (headersMatch(tableHeaders, SHEET_HEADERS)) {
    return { rows: rows.slice(TABLE_DATA_ROW_NUMBER - 1), needsSheetSetup: false }
  }

  const dashboardHeaders = rows[3] ?? []
  const isDashboardSheet = headersMatch(dashboardHeaders, SHEET_HEADERS)
  const currentHeaders = rows[0] ?? []
  const isCurrentSheet = headersMatch(currentHeaders, SHEET_HEADERS)
  const isPreviousSheet = headersMatch(currentHeaders, PREVIOUS_SHEET_HEADERS)
  const isLegacySheet = headersMatch(currentHeaders, LEGACY_SHEET_HEADERS)
  if (!isDashboardSheet && currentHeaders.length && !isCurrentSheet && !isPreviousSheet && !isLegacySheet) {
    throw new Error("Google Sheets headers do not match the registration table")
  }

  const sourceRows = isDashboardSheet ? rows.slice(4) : currentHeaders.length ? rows.slice(1) : []
  const migratedRows = sourceRows
    .filter((row) => row.some((value) => String(value ?? "").trim()))
    .map((row) => {
    if (isDashboardSheet || isCurrentSheet) {
      const lodging = normalizeSheetPreference(row[6])
      const transport = normalizeSheetPreference(row[7])
      const followUp = String(row[8] ?? "").trim()
      return [
        row[0] || crypto.randomUUID(),
        row[1] ?? "",
        getInternationalPhone(row[2]),
        row[3] ?? "",
        row[4] ?? "",
        row[5] ?? "",
        lodging,
        transport,
        followUp === "RESUELTO" ? "CONTACTADO" : followUp || getRegistrationFollowUp(lodging, transport),
        row[9] ?? "",
      ]
    }

    if (isPreviousSheet) {
      const lodging = normalizeSheetPreference(row[6])
      const transport = normalizeSheetPreference(row[7])
      const followUp = String(row[9] ?? "").trim()
      return [
        row[0] || crypto.randomUUID(),
        row[1] ?? "",
        getInternationalPhone(row[2]),
        row[3] ?? "",
        row[4] ?? "",
        row[5] ?? "",
        lodging,
        transport,
        followUp === "RESUELTO" ? "CONTACTADO" : followUp || getRegistrationFollowUp(lodging, transport),
        row[10] ?? "",
      ]
    }

    const lodging = normalizeSheetPreference(row[4])
    const transport = normalizeSheetPreference(row[3])
    const legacyRegion = String(row[7] ?? "").trim()
    return [
      crypto.randomUUID(),
      row[0] ?? "",
      getInternationalPhone(row[1]),
      "",
      row[2] ?? "",
      legacyRegion.toLocaleUpperCase("es-MX") === "MAYO" ? "Mayo" : legacyRegion || "Otra región (sin especificar)",
      lodging,
      transport,
      getRegistrationFollowUp(lodging, transport),
      "",
    ]
  })
  const sheetValues = [
    ["", "Total de registrados", "", "Pendientes por contactar", "", "Contactados", ""],
    ["", "Necesitan hospedaje", "", "Necesitan transporte", ""],
    [...SHEET_HEADERS],
    ...migratedRows,
  ]
  const updateRange = getGoogleSheetRange(config.sheetName, `A1:J${migratedRows.length + TABLE_HEADER_ROW_NUMBER}`)
  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(updateRange)}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: sheetValues }),
    },
  )

  if (!updateResponse.ok) {
    throw new Error(`Google Sheets migration failed: ${await updateResponse.text()}`)
  }

  if (isPreviousSheet) {
    const staleColumnRange = getGoogleSheetRange(config.sheetName, "K:K")
    const clearResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(staleColumnRange)}:clear`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      },
    )
    if (!clearResponse.ok) console.warn(`[register] Google Sheets stale column clear failed: ${await clearResponse.text()}`)
  }

  if (isDashboardSheet) {
    const staleRowRange = getGoogleSheetRange(config.sheetName, `A${migratedRows.length + 4}:J${migratedRows.length + 4}`)
    const clearResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(staleRowRange)}:clear`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      },
    )
    if (!clearResponse.ok) console.warn(`[register] Google Sheets stale row clear failed: ${await clearResponse.text()}`)
  }

  return { rows: migratedRows, needsSheetSetup: true }
}

async function getRegistrationSheetMetadata(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetId: number,
) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}?fields=sheets(properties(sheetId),conditionalFormats,filterViews(filterViewId,title),protectedRanges(protectedRangeId,description))`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!response.ok) {
    console.warn(`[register] Google Sheets metadata read failed: ${await response.text()}`)
    return { conditionalFormatCount: 0, filterViewIds: [], protectedRangeIds: [] }
  }

  const data = (await response.json()) as {
    sheets?: Array<{
      properties?: { sheetId?: number }
      conditionalFormats?: unknown[]
      filterViews?: Array<{ filterViewId?: number; title?: string }>
      protectedRanges?: Array<{ protectedRangeId?: number; description?: string }>
    }>
  }
  const sheet = data.sheets?.find((item) => item.properties?.sheetId === sheetId)
  const oldFilterTitles = new Set([
    "REGISTROS INVALIDOS",
    "CANCELADOS / REGISTROS INVALIDOS",
    "POR CONTACTAR",
    "NECESITAN HOSPEDAJE",
    "NECESITAN TRANSPORTE",
  ])
  return {
    conditionalFormatCount: sheet?.conditionalFormats?.length ?? 0,
    filterViewIds: sheet?.filterViews
      ?.filter((view) => view.filterViewId !== undefined && oldFilterTitles.has(view.title ?? ""))
      .map((view) => view.filterViewId as number) ?? [],
    protectedRangeIds: sheet?.protectedRanges
      ?.filter((range) => range.protectedRangeId !== undefined && range.description === "REGISTRATION_LOCKED_COLUMNS")
      .map((range) => range.protectedRangeId as number) ?? [],
  }
}

async function formatRegistrationSheet(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetId: number,
  rows: Array<{ rowNumber: number; values: string[] }>,
  needsSheetSetup: boolean,
) {
  const lastRowNumber = Math.max(TABLE_DATA_ROW_NUMBER, ...rows.map((row) => row.rowNumber))
  const columnWidths = [34, 190, 150, 150, 120, 205, 120, 120, 190, 260]
  const orange = { red: 0.96, green: 0.78, blue: 0.62 }
  const yellow = { red: 1, green: 0.93, blue: 0.58 }
  const blue = { red: 0.78, green: 0.88, blue: 0.97 }
  const white = { red: 1, green: 1, blue: 1 }
  const darkText = { red: 0.12, green: 0.12, blue: 0.12 }
  const darkGreen = { red: 0.12, green: 0.36, blue: 0.2 }
  const subtleGreen = { red: 0.87, green: 0.95, blue: 0.87 }
  const subtleYellow = { red: 1, green: 0.96, blue: 0.76 }
  const subtleRed = { red: 0.96, green: 0.87, blue: 0.87 }
  const metadata = needsSheetSetup
    ? await getRegistrationSheetMetadata(config, accessToken, sheetId)
    : { conditionalFormatCount: 0, filterViewIds: [], protectedRangeIds: [] }
  const requests: Array<Record<string, unknown>> = [
    ...Array.from({ length: metadata.conditionalFormatCount }, (_, index) => ({
      deleteConditionalFormatRule: { sheetId, index: metadata.conditionalFormatCount - index - 1 },
    })),
    ...metadata.filterViewIds.map((filterId) => ({ deleteFilterView: { filterId } })),
    ...metadata.protectedRangeIds.map((protectedRangeId) => ({ deleteProtectedRange: { protectedRangeId } })),
    { clearBasicFilter: { sheetId } },
    {
      updateCells: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 2, startColumnIndex: 1, endColumnIndex: 7 },
        rows: [
          { values: [
            { userEnteredValue: { stringValue: "Total de registrados" } },
            { userEnteredValue: { formulaValue: '=COUNTA($B$4:$B)-COUNTIF($I$4:$I;"CANCELADO / REGISTRO INVALIDO")' } },
            { userEnteredValue: { stringValue: "Pendientes por contactar" } },
            { userEnteredValue: { formulaValue: '=COUNTIF($I$4:$I;"POR CONTACTAR")' } },
            { userEnteredValue: { stringValue: "Contactados" } },
            { userEnteredValue: { formulaValue: '=COUNTIF($I$4:$I;"CONTACTADO")' } },
          ] },
          { values: [
            { userEnteredValue: { stringValue: "Necesitan hospedaje" } },
            { userEnteredValue: { formulaValue: '=COUNTIFS($G$4:$G;"SÍ";$I$4:$I;"<>CANCELADO / REGISTRO INVALIDO")' } },
            { userEnteredValue: { stringValue: "Necesitan transporte" } },
            { userEnteredValue: { formulaValue: '=COUNTIFS($H$4:$H;"SÍ";$I$4:$I;"<>CANCELADO / REGISTRO INVALIDO")' } },
            { userEnteredValue: { stringValue: "" } },
            { userEnteredValue: { stringValue: "" } },
          ] },
        ],
        fields: "userEnteredValue",
      },
    },
    {
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { frozenRowCount: TABLE_HEADER_ROW_NUMBER } },
        fields: "gridProperties.frozenRowCount",
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 2, startColumnIndex: 1, endColumnIndex: 7 },
        cell: {
          userEnteredFormat: {
            backgroundColor: white,
            verticalAlignment: "MIDDLE",
            wrapStrategy: "WRAP",
            textFormat: { foregroundColor: darkText, fontFamily: "Arial", fontSize: 10 },
          },
        },
        fields: "userEnteredFormat",
      },
    },
    ...[[0, 1], [0, 3], [0, 5], [1, 1], [1, 3]].map(([row, column]) => ({
      repeatCell: {
        range: { sheetId, startRowIndex: row, endRowIndex: row + 1, startColumnIndex: column, endColumnIndex: column + 1 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.9, green: 0.91, blue: 0.92 },
            horizontalAlignment: "LEFT",
            textFormat: { foregroundColor: darkText, fontFamily: "Arial", fontSize: 9, bold: true },
          },
        },
        fields: "userEnteredFormat",
      },
    })),
    ...[[0, 2], [0, 4], [0, 6], [1, 2], [1, 4]].map(([row, column]) => ({
      repeatCell: {
        range: { sheetId, startRowIndex: row, endRowIndex: row + 1, startColumnIndex: column, endColumnIndex: column + 1 },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: "CENTER",
            textFormat: { foregroundColor: darkText, fontFamily: "Arial", fontSize: 14, bold: true },
          },
        },
        fields: "userEnteredFormat",
      },
    })),
    ...[
      { row: 0, column: 4, backgroundColor: subtleYellow },
      { row: 0, column: 6, backgroundColor: subtleGreen },
      { row: 1, column: 2, backgroundColor: orange },
      { row: 1, column: 4, backgroundColor: orange },
    ].map(({ row, column, backgroundColor }) => ({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: row,
          endRowIndex: row + 1,
          startColumnIndex: column,
          endColumnIndex: column + 1,
        },
        cell: { userEnteredFormat: { backgroundColor } },
        fields: "userEnteredFormat.backgroundColor",
      },
    })),
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: TABLE_HEADER_ROW_NUMBER - 1,
          endRowIndex: TABLE_HEADER_ROW_NUMBER,
          startColumnIndex: 0,
          endColumnIndex: SHEET_HEADERS.length,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.22, green: 0.22, blue: 0.22 },
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
            wrapStrategy: "WRAP",
            textFormat: { foregroundColor: white, fontFamily: "Arial", fontSize: 10, bold: true },
          },
        },
        fields: "userEnteredFormat",
      },
    },
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: TABLE_DATA_ROW_NUMBER - 1,
          endRowIndex: lastRowNumber,
          startColumnIndex: 0,
          endColumnIndex: SHEET_HEADERS.length,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: white,
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
            wrapStrategy: "WRAP",
            textFormat: { foregroundColor: darkText, fontFamily: "Arial", fontSize: 10, bold: false },
          },
        },
        fields: "userEnteredFormat",
      },
    },
    {
      setDataValidation: {
        range: { sheetId, startRowIndex: TABLE_DATA_ROW_NUMBER - 1, startColumnIndex: 9, endColumnIndex: 10 },
        filteredRowsIncluded: true,
      },
    },
    {
      setDataValidation: {
        range: { sheetId, startRowIndex: TABLE_DATA_ROW_NUMBER - 1, startColumnIndex: 8, endColumnIndex: 9 },
        filteredRowsIncluded: true,
        rule: {
          condition: {
            type: "ONE_OF_LIST",
            values: REGISTRATION_FOLLOW_UP_VALUES.map((value) => ({ userEnteredValue: value })),
          },
          strict: true,
          showCustomUi: true,
        },
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: "ROWS", startIndex: 0, endIndex: 2 },
        properties: { pixelSize: 30 },
        fields: "pixelSize",
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: "ROWS", startIndex: 2, endIndex: 3 },
        properties: { pixelSize: 38 },
        fields: "pixelSize",
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: "ROWS", startIndex: 3, endIndex: lastRowNumber },
        properties: { pixelSize: 34 },
        fields: "pixelSize",
      },
    },
    ...columnWidths.map((pixelSize, column) => ({
      updateDimensionProperties: {
        range: { sheetId, dimension: "COLUMNS", startIndex: column, endIndex: column + 1 },
        properties: { pixelSize },
        fields: "pixelSize",
      },
    })),
    ...[1, 9].map((column) => ({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: TABLE_DATA_ROW_NUMBER - 1,
          endRowIndex: lastRowNumber,
          startColumnIndex: column,
          endColumnIndex: column + 1,
        },
        cell: { userEnteredFormat: { horizontalAlignment: "LEFT" } },
        fields: "userEnteredFormat.horizontalAlignment",
      },
    })),
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: TABLE_DATA_ROW_NUMBER - 1,
          endRowIndex: lastRowNumber,
          startColumnIndex: 0,
          endColumnIndex: 1,
        },
        cell: { userEnteredFormat: { wrapStrategy: "CLIP" } },
        fields: "userEnteredFormat.wrapStrategy",
      },
    },
  ]

  if (needsSheetSetup) {
    const cellRule = (
      column: number,
      condition: Record<string, unknown>,
      format: Record<string, unknown>,
    ) => ({
      ranges: [{ sheetId, startRowIndex: TABLE_DATA_ROW_NUMBER - 1, startColumnIndex: column, endColumnIndex: column + 1 }],
      booleanRule: { condition, format },
    })
    const conditionalRules = [
      cellRule(4, { type: "TEXT_EQ", values: [{ userEnteredValue: "Oyente" }] }, {
        backgroundColor: darkGreen,
        textFormat: { foregroundColor: white, bold: true },
      }),
      cellRule(5, { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: '=($F4<>"")*($F4<>"Mayo")' }] }, { backgroundColor: blue }),
      cellRule(6, { type: "TEXT_EQ", values: [{ userEnteredValue: "SÍ" }] }, { backgroundColor: orange }),
      cellRule(6, { type: "TEXT_EQ", values: [{ userEnteredValue: "AÚN NO LO SÉ" }] }, { backgroundColor: yellow }),
      cellRule(7, { type: "TEXT_EQ", values: [{ userEnteredValue: "SÍ" }] }, { backgroundColor: orange }),
      cellRule(7, { type: "TEXT_EQ", values: [{ userEnteredValue: "AÚN NO LO SÉ" }] }, { backgroundColor: yellow }),
      cellRule(8, { type: "TEXT_EQ", values: [{ userEnteredValue: "NO REQUIERE" }] }, { backgroundColor: subtleGreen }),
      cellRule(8, { type: "TEXT_EQ", values: [{ userEnteredValue: "CONTACTADO" }] }, { backgroundColor: subtleGreen }),
      cellRule(8, { type: "TEXT_EQ", values: [{ userEnteredValue: "POR CONTACTAR" }] }, { backgroundColor: subtleYellow }),
      cellRule(8, { type: "TEXT_EQ", values: [{ userEnteredValue: "CANCELADO / REGISTRO INVALIDO" }] }, { backgroundColor: subtleRed }),
    ]
    const filterRange = {
      sheetId,
      startRowIndex: TABLE_HEADER_ROW_NUMBER - 1,
      startColumnIndex: 8,
      endColumnIndex: 9,
    }

    requests.push(
      ...conditionalRules.map((rule, index) => ({ addConditionalFormatRule: { rule, index } })),
      {
        addProtectedRange: {
          protectedRange: {
            range: { sheetId },
            description: "REGISTRATION_LOCKED_COLUMNS",
            warningOnly: false,
            unprotectedRanges: [{
              sheetId,
              startRowIndex: TABLE_DATA_ROW_NUMBER - 1,
              startColumnIndex: 8,
              endColumnIndex: 10,
            }],
          },
        },
      },
      {
        addFilterView: {
          filter: {
            title: "CANCELADOS / REGISTROS INVALIDOS",
            range: filterRange,
            filterSpecs: [{
              columnIndex: 8,
              filterCriteria: {
                condition: {
                  type: "TEXT_CONTAINS",
                  values: [{ userEnteredValue: "CANCELADO / REGISTRO INVALIDO" }],
                },
              },
            }],
          },
        },
      },
    )
  }

  rows.forEach(({ rowNumber, values }) => {
    const whatsappUrl = getWhatsappUrl(values[2])
    if (whatsappUrl) {
      requests.push({
        updateCells: {
          range: { sheetId, startRowIndex: rowNumber - 1, endRowIndex: rowNumber, startColumnIndex: 2, endColumnIndex: 3 },
          rows: [{ values: [{
            userEnteredValue: { stringValue: getInternationalPhone(values[2]) },
            userEnteredFormat: { textFormat: { link: { uri: whatsappUrl } } },
          }] }],
          fields: "userEnteredValue,userEnteredFormat.textFormat.link",
        },
      })
    }
  })

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    },
  )
  if (!response.ok) console.warn(`[register] Google Sheets format failed: ${await response.text()}`)
}

async function appendRegistrationToGoogleSheets(
  registrationData: {
    name: string
    phone: string
    needsLodging: boolean | "unknown"
    needsTransport: boolean | "unknown"
    attendingAs: RegistrationAttendingAs
    isBaptized: boolean
    region: RegistrationRegion
    registeredAt: string
  },
) {
  const config = getGoogleSheetsConfig()
  if (!config) return

  const accessToken = await getGoogleSheetsAccessToken(config)
  const sheetId = await getGoogleSheetId(config, accessToken)
  const { rows: existingRows, needsSheetSetup } = await ensureGoogleSheetsHeaders(config, accessToken)
  const lodging = yesNo(registrationData.needsLodging)
  const transport = yesNo(registrationData.needsTransport)
  const row = [
    crypto.randomUUID(),
    registrationData.name,
    getInternationalPhone(registrationData.phone),
    formatRegistrationDate(new Date(registrationData.registeredAt)),
    registrationTypeLabels[registrationData.attendingAs],
    registrationData.region,
    lodging,
    transport,
    getRegistrationFollowUp(lodging, transport),
    "",
  ]
  const range = getGoogleSheetRange(config.sheetName, `A${TABLE_HEADER_ROW_NUMBER}:J`)
  const appendResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [row] }),
    },
  )

  if (!appendResponse.ok) throw new Error(`Google Sheets append failed: ${await appendResponse.text()}`)

  const appendData = (await appendResponse.json()) as { updates?: { updatedRange?: string } }
  const rowNumber = Number(appendData.updates?.updatedRange?.match(/![A-Z]+(\d+):/)?.[1])
  if (!rowNumber) return

  await formatRegistrationSheet(config, accessToken, sheetId, [
    ...existingRows.map((values, index) => ({ rowNumber: index + TABLE_DATA_ROW_NUMBER, values })),
    { rowNumber, values: row },
  ], needsSheetSetup)
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
  return normalizeMexicanPhone(input)
}

function normalizeLogisticsPreference(input: unknown): boolean | "unknown" {
  return input === "unknown" ? "unknown" : Boolean(input)
}

function validateRegistration(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields
  if (!data.name || typeof data.name !== "string" || data.name.trim().length < 2) {
    errors.push("Nombre es requerido (mínimo 2 caracteres)")
  }

  if (normalizeMexicanPhone(data.phone).length !== 10) {
    errors.push("Teléfono válido es requerido (10 dígitos)")
  }

  if (!data.eventId || typeof data.eventId !== "string") {
    errors.push("Evento es requerido")
  }

  if (![true, false, "unknown"].includes(data.needsLodging as boolean | string)) {
    errors.push("Hospedaje inválido")
  }

  if (![true, false, "unknown"].includes(data.needsTransport as boolean | string)) {
    errors.push("Transporte inválido")
  }

  if (typeof data.isBaptized !== "boolean" || typeof data.isCoroMGR !== "boolean") {
    errors.push("Datos de asistencia inválidos")
  }

  if (!REGISTRATION_REGIONS.includes(String(data.region) as RegistrationRegion)) {
    errors.push("Región inválida")
  }

  if (
    typeof data.isFromAnotherRegion !== "boolean" ||
    (data.isFromAnotherRegion ? data.region === "Mayo" : data.region !== "Mayo")
  ) {
    errors.push("La región no coincide con la selección")
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
    const isBaptized = isCoroMGR ? true : Boolean(body.isBaptized)
    const attendingAs = getRegistrationAttendingAs(isBaptized, isCoroMGR)
    const registrationData = {
      name: sanitizeString(body.name),
      phone: sanitizePhone(body.phone),
      needsLodging: normalizeLogisticsPreference(body.needsLodging),
      needsTransport: normalizeLogisticsPreference(body.needsTransport),
      attendingAs,
      isBaptized,
      region: String(body.region) as RegistrationRegion,
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
