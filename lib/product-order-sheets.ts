import { getSanityClient } from "@/lib/sanity/client"
import { sanityMutate, sanityQueryNoStore } from "@/lib/sanity/write-client"

const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets"
const SHEET_HEADERS = {
  orderId: "ID",
  name: "Nombre",
  phone: "Teléfono",
  orderedAt: "Fecha y hora",
  paymentType: "Modalidad de pago",
  variant: "Variante",
  size: "Talla",
  quantity: "Cantidad",
  fullTotal: "Pago total (MXN)",
  paymentExpected: "Pago esperado (MXN)",
  paymentStatus: "Comprobante de pago",
  balanceDue: "Saldo pendiente (MXN)",
} as const

const PAYMENT_STATUSES = ["PENDIENTE", "ANTICIPO RECIBIDO", "PAGO COMPLETO", "CANCELADO"] as const
const AUTOMATIC_COLUMNS_PROTECTION_DESCRIPTION = "Pedidos: columnas automáticas"

type GoogleSheetsConfig = {
  spreadsheetId: string
  clientEmail: string
  privateKey: string
}

type ProductOrderVariant = {
  id: string
  name: string
  photos: string[]
}

export type ProductOrderProduct = {
  id: string
  name: string
  price: number
  deposit?: number
  stock?: number
  allowSizeSelection: boolean
  variantsEnabled: boolean
  variants: ProductOrderVariant[]
  allowMultipleQuantity: boolean
  isDisabled: boolean
}

export type ProductOrderInput = {
  productId: string
  name: string
  phone: string
  paymentType: "deposit" | "full"
  variantId?: string | null
  size?: string | null
  quantity: number
}

export class ProductOrderUserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProductOrderUserError"
  }
}

type ProductOrderDetails = {
  product: ProductOrderProduct
  variantName?: string
  size?: string
  paymentType: "deposit" | "full"
  unitPrice: number
  quantity: number
}

function getGoogleSheetsConfig(): GoogleSheetsConfig {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim()
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.trim()
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new Error("La configuracion de Google Sheets para pedidos esta incompleta.")
  }

  return { spreadsheetId, clientEmail, privateKey }
}

function encodeBase64Url(value: string | ArrayBuffer): string {
  return Buffer.from(value instanceof ArrayBuffer ? new Uint8Array(value) : value).toString("base64url")
}

async function getGoogleSheetsAccessToken(config: GoogleSheetsConfig): Promise<string> {
  const keyData = config.privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "")
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    Buffer.from(keyData, "base64"),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  )
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
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(unsignedToken),
  )
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsignedToken}.${encodeBase64Url(signature)}`,
    }),
  })

  if (!response.ok) throw new Error(`Google OAuth failed: ${await response.text()}`)

  const data = await response.json() as { access_token?: string }
  if (!data.access_token) throw new Error("Google OAuth no devolvio un token de acceso.")
  return data.access_token
}

function getGoogleSheetRange(sheetName: string, range: string) {
  return `'${sheetName.replace(/'/g, "''")}'!${range}`
}

function getProductSheetHeaders(product: ProductOrderProduct): string[] {
  return [
    SHEET_HEADERS.orderId,
    SHEET_HEADERS.name,
    SHEET_HEADERS.phone,
    SHEET_HEADERS.orderedAt,
    ...(typeof product.deposit === "number" ? [SHEET_HEADERS.paymentType] : []),
    ...(product.variantsEnabled ? [SHEET_HEADERS.variant] : []),
    ...(product.allowSizeSelection ? [SHEET_HEADERS.size] : []),
    ...(product.allowMultipleQuantity ? [SHEET_HEADERS.quantity] : []),
    SHEET_HEADERS.fullTotal,
    SHEET_HEADERS.paymentExpected,
    SHEET_HEADERS.paymentStatus,
    SHEET_HEADERS.balanceDue,
  ]
}

async function getSheetId(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetName: string,
): Promise<number | null> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}?fields=sheets.properties(sheetId,title)`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!response.ok) throw new Error(`Google Sheets metadata failed: ${await response.text()}`)

  const data = await response.json() as {
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>
  }
  const sheet = data.sheets?.find((item) => item.properties?.title === sheetName)
  return typeof sheet?.properties?.sheetId === "number" ? sheet.properties.sheetId : null
}

async function createSheet(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetName: string,
): Promise<number> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      }),
    },
  )
  if (!response.ok) throw new Error(`Google Sheet tab create failed: ${await response.text()}`)

  const data = await response.json() as {
    replies?: Array<{ addSheet?: { properties?: { sheetId?: number } } }>
  }
  const sheetId = data.replies?.[0]?.addSheet?.properties?.sheetId
  if (typeof sheetId !== "number") throw new Error(`No se pudo crear la hoja ${sheetName}.`)
  return sheetId
}

async function getSheetHeader(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetName: string,
): Promise<string[]> {
  const range = getGoogleSheetRange(sheetName, "A1:Z1")
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!response.ok) throw new Error(`Google Sheets header read failed: ${await response.text()}`)

  const data = await response.json() as { values?: string[][] }
  return (data.values?.[0] ?? []).map((value) => String(value))
}

async function setSheetHeader(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetName: string,
  headers: string[],
) {
  const range = getGoogleSheetRange(sheetName, "A1")
  const response = await fetch(
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
  if (!response.ok) throw new Error(`Google Sheets header update failed: ${await response.text()}`)
}

async function insertSheetColumn(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetId: number,
  columnIndex: number,
) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [{
          insertDimension: {
            range: {
              sheetId,
              dimension: "COLUMNS",
              startIndex: columnIndex,
              endIndex: columnIndex + 1,
            },
            inheritFromBefore: columnIndex > 0,
          },
        }],
      }),
    },
  )
  if (!response.ok) throw new Error(`Google Sheets column insert failed: ${await response.text()}`)
}

async function deleteSheetColumn(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetId: number,
  columnIndex: number,
) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: {
              sheetId,
              dimension: "COLUMNS",
              startIndex: columnIndex,
              endIndex: columnIndex + 1,
            },
          },
        }],
      }),
    },
  )
  if (!response.ok) throw new Error(`Google Sheets column delete failed: ${await response.text()}`)
}

function migrateLegacyHeader(header: string) {
  const legacyHeaders: Record<string, string> = {
    Numero: SHEET_HEADERS.phone,
    Número: SHEET_HEADERS.phone,
    Tipo: SHEET_HEADERS.paymentType,
    "Total (MXN)": SHEET_HEADERS.paymentExpected,
    "Precio total (MXN)": SHEET_HEADERS.fullTotal,
    "Pago por confirmar (MXN)": SHEET_HEADERS.paymentExpected,
    "Saldo por cobrar (MXN)": SHEET_HEADERS.balanceDue,
    "Estado del pago": SHEET_HEADERS.paymentStatus,
    "Saldo total pendiente (MXN)": SHEET_HEADERS.balanceDue,
    "Saldo pendiente despues de pagar": SHEET_HEADERS.balanceDue,
    "Saldo pendiente después de pagar": SHEET_HEADERS.balanceDue,
    Estado: SHEET_HEADERS.paymentStatus,
  }

  return legacyHeaders[header] ?? header
}

async function ensureProductSheet(
  config: GoogleSheetsConfig,
  accessToken: string,
  product: ProductOrderProduct,
) {
  const sheetName = product.name.trim()
  if (!sheetName || sheetName.length > 100 || /[\[\]:*?/\\]/.test(sheetName)) {
    throw new Error("El nombre del producto no es valido como titulo de Google Sheets.")
  }

  let sheetId = await getSheetId(config, accessToken, sheetName)
  if (sheetId === null) sheetId = await createSheet(config, accessToken, sheetName)

  const existingHeaders = await getSheetHeader(config, accessToken, sheetName)
  const expectedHeaders = getProductSheetHeaders(product)
  let headers = existingHeaders.length > 0
    ? existingHeaders.map(migrateLegacyHeader)
    : expectedHeaders
  let headersChanged = existingHeaders.some((header, index) => header !== headers[index])

  if (existingHeaders.length === 0) {
    await setSheetHeader(config, accessToken, sheetName, headers)
  } else {
    if (!headers.includes(SHEET_HEADERS.orderId)) {
      await insertSheetColumn(config, accessToken, sheetId, 0)
      headers.unshift(SHEET_HEADERS.orderId)
      headersChanged = true
    }

    if (!headers.includes(SHEET_HEADERS.fullTotal)) {
      const paymentExpectedColumn = headers.indexOf(SHEET_HEADERS.paymentExpected)
      const fullTotalColumn = paymentExpectedColumn === -1 ? headers.length : paymentExpectedColumn
      await insertSheetColumn(config, accessToken, sheetId, fullTotalColumn)
      headers.splice(fullTotalColumn, 0, SHEET_HEADERS.fullTotal)
      headersChanged = true
    }

    if (!headers.includes(SHEET_HEADERS.balanceDue)) {
      const paymentStatusColumn = headers.indexOf(SHEET_HEADERS.paymentStatus)
      const balanceDueColumn = paymentStatusColumn === -1 ? headers.length : paymentStatusColumn + 1
      await insertSheetColumn(config, accessToken, sheetId, balanceDueColumn)
      headers.splice(balanceDueColumn, 0, SHEET_HEADERS.balanceDue)
      headersChanged = true
    }

    const deliveryStatusColumn = headers.indexOf("Estado de entrega")
    if (deliveryStatusColumn >= 0) {
      await deleteSheetColumn(config, accessToken, sheetId, deliveryStatusColumn)
      headers.splice(deliveryStatusColumn, 1)
      headersChanged = true
    }

    const optionalHeaders = [
      SHEET_HEADERS.paymentType,
      SHEET_HEADERS.variant,
      SHEET_HEADERS.size,
      SHEET_HEADERS.quantity,
    ]
    for (const header of optionalHeaders) {
      const columnIndex = headers.indexOf(header)
      if (!expectedHeaders.includes(header) && columnIndex >= 0) {
        await deleteSheetColumn(config, accessToken, sheetId, columnIndex)
        headers.splice(columnIndex, 1)
        headersChanged = true
      }
    }
    for (const header of optionalHeaders) {
      if (!expectedHeaders.includes(header) || headers.includes(header)) continue
      const expectedIndex = expectedHeaders.indexOf(header)
      const nextExistingHeader = expectedHeaders.slice(expectedIndex + 1).find((candidate) => headers.includes(candidate))
      const columnIndex = nextExistingHeader ? headers.indexOf(nextExistingHeader) : headers.length
      await insertSheetColumn(config, accessToken, sheetId, columnIndex)
      headers.splice(columnIndex, 0, header)
      headersChanged = true
    }

    if (headersChanged) await setSheetHeader(config, accessToken, sheetName, headers)
  }

  return { sheetId, sheetName, headers, needsConfiguration: existingHeaders.length === 0 || headersChanged }
}

function getColumnLetter(columnIndex: number) {
  let index = columnIndex + 1
  let letter = ""

  while (index > 0) {
    const remainder = (index - 1) % 26
    letter = String.fromCharCode(65 + remainder) + letter
    index = Math.floor((index - 1) / 26)
  }

  return letter
}

function getPaymentConditionalFormatRequests(
  sheetId: number,
  headers: string[],
): Array<Record<string, unknown>> {
  const paymentStatusColumn = headers.indexOf(SHEET_HEADERS.paymentStatus)
  if (paymentStatusColumn === -1) return []

  const paymentStatusColumnLetter = getColumnLetter(paymentStatusColumn)
  const rowRange = { sheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: headers.length }
  const conditionalFormats = [
    { formula: `=$${paymentStatusColumnLetter}2="PENDIENTE"`, color: { red: 0.98, green: 0.95, blue: 0.82 } },
    { formula: `=$${paymentStatusColumnLetter}2="PAGO COMPLETO"`, color: { red: 0.85, green: 0.94, blue: 0.85 } },
    { formula: `=$${paymentStatusColumnLetter}2="ANTICIPO RECIBIDO"`, color: { red: 0.93, green: 0.90, blue: 0.78 } },
    { formula: `=$${paymentStatusColumnLetter}2="CANCELADO"`, color: { red: 0.90, green: 0.90, blue: 0.90 } },
  ]

  return conditionalFormats.map(({ formula, color }, index) => ({
    addConditionalFormatRule: {
      index,
      rule: {
        ranges: [rowRange],
        booleanRule: {
          condition: { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: formula }] },
          format: { backgroundColor: color },
        },
      },
    },
  }))
}

function getPaymentFilterViewRequests(
  sheetId: number,
  sheetName: string,
  headers: string[],
): Array<Record<string, unknown>> {
  const paymentStatusColumn = headers.indexOf(SHEET_HEADERS.paymentStatus)
  if (paymentStatusColumn === -1) return []

  const filterViews = [
    { title: "Pendientes de verificar", value: "PENDIENTE" },
    { title: "Anticipos recibidos", value: "ANTICIPO RECIBIDO" },
    { title: "Pagos completos", value: "PAGO COMPLETO" },
    { title: "Cancelados", value: "CANCELADO" },
  ]

  return filterViews.map(({ title, value }) => ({
    addFilterView: {
      filter: {
        title: `${sheetName} - ${title}`,
        range: { sheetId, startRowIndex: 0, startColumnIndex: 0, endColumnIndex: headers.length },
        criteria: {
          [paymentStatusColumn]: {
            condition: { type: "TEXT_EQ", values: [{ userEnteredValue: value }] },
          },
        },
      },
    },
  }))
}

async function configureProductSheet(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetId: number,
  headers: string[],
) {
  const moneyColumns = [
    headers.indexOf(SHEET_HEADERS.fullTotal),
    headers.indexOf(SHEET_HEADERS.paymentExpected),
    headers.indexOf(SHEET_HEADERS.balanceDue),
  ].filter((column) => column >= 0)
  const requests: Array<Record<string, unknown>> = [{
    updateSheetProperties: {
      properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
      fields: "gridProperties.frozenRowCount",
    },
  }]

  moneyColumns.forEach((column) => {
    requests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: 1, startColumnIndex: column, endColumnIndex: column + 1 },
        cell: { userEnteredFormat: { numberFormat: { type: "CURRENCY", pattern: "$#,##0" } } },
        fields: "userEnteredFormat.numberFormat",
      },
    })
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
  if (!response.ok) throw new Error(`Google Sheets configuration failed: ${await response.text()}`)
}

function getOrderRowValidationRequests(
  sheetId: number,
  headers: string[],
  rowNumbers: number[],
): Array<Record<string, unknown>> {
  const validationColumns = [
    { column: headers.indexOf(SHEET_HEADERS.paymentStatus), values: PAYMENT_STATUSES },
  ].filter(({ column }) => column >= 0)

  return rowNumbers.flatMap((rowNumber) => validationColumns.map(({ column, values }) => ({
    setDataValidation: {
      range: {
        sheetId,
        startRowIndex: rowNumber - 1,
        endRowIndex: rowNumber,
        startColumnIndex: column,
        endColumnIndex: column + 1,
      },
      rule: {
        condition: {
          type: "ONE_OF_LIST",
          values: values.map((status) => ({ userEnteredValue: status })),
        },
        strict: true,
        showCustomUi: true,
      },
    },
  })))
}

async function refreshProductSheetControls(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetId: number,
  sheetName: string,
  headers: string[],
) {
  const nameColumn = headers.indexOf(SHEET_HEADERS.name)
  const validationColumns = [
    headers.indexOf(SHEET_HEADERS.paymentStatus),
  ].filter((column) => column >= 0)
  const moneyColumns = [
    headers.indexOf(SHEET_HEADERS.fullTotal),
    headers.indexOf(SHEET_HEADERS.paymentExpected),
    headers.indexOf(SHEET_HEADERS.balanceDue),
  ].filter((column) => column >= 0)

  const metadataResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}?fields=sheets(properties(sheetId),protectedRanges(protectedRangeId,description),conditionalFormats(booleanRule(condition(type,values))),filterViews(filterViewId,title))`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!metadataResponse.ok) throw new Error(`Google Sheets controls metadata read failed: ${await metadataResponse.text()}`)

  const metadata = await metadataResponse.json() as {
    sheets?: Array<{
      properties?: { sheetId?: number }
      protectedRanges?: Array<{ protectedRangeId?: number; description?: string }>
      conditionalFormats?: Array<{
        booleanRule?: { condition?: { type?: string; values?: Array<{ userEnteredValue?: string }> } }
      }>
      filterViews?: Array<{ filterViewId?: number; title?: string }>
    }>
  }
  const sheetMetadata = metadata.sheets?.find((sheet) => sheet.properties?.sheetId === sheetId)
  const automaticProtectionIds = sheetMetadata?.protectedRanges
    ?.filter(({ description }) => description?.startsWith(AUTOMATIC_COLUMNS_PROTECTION_DESCRIPTION))
    .map(({ protectedRangeId }) => protectedRangeId)
    .filter((protectedRangeId): protectedRangeId is number => typeof protectedRangeId === "number") ?? []
  const automaticConditionalFormatIndexes = sheetMetadata?.conditionalFormats
    ?.flatMap((rule, index) => {
      const condition = rule.booleanRule?.condition
      const formula = condition?.values?.[0]?.userEnteredValue ?? ""
      const isPaymentRule = condition?.type === "CUSTOM_FORMULA"
        && /^=\$[A-Z]+2="(?:PENDIENTE|ANTICIPO RECIBIDO|PAGO COMPLETO|PAGADO COMPLETO|PAGADO|CANCELADO)"$/.test(formula)
      const isLegacyDeliveryRule = condition?.type === "CUSTOM_FORMULA" && formula.endsWith('="ENTREGADO"')
      return isPaymentRule || isLegacyDeliveryRule ? [index] : []
    })
    .sort((a, b) => b - a) ?? []
  const automaticFilterViewTitles = new Set([
    "Pendientes de verificar",
    "Anticipos recibidos",
    "Pagos completos",
    "Pagados completamente",
    "Pagados",
    "Cancelados",
    "Pendientes de entregar",
    "Entregados",
  ].map((title) => `${sheetName} - ${title}`))
  const automaticFilterViewIds = sheetMetadata?.filterViews
    ?.filter(({ title }) => title && automaticFilterViewTitles.has(title))
    .map(({ filterViewId }) => filterViewId)
    .filter((filterViewId): filterViewId is number => typeof filterViewId === "number") ?? []

  let activeRows: number[] = []
  if (nameColumn >= 0) {
    const nameColumnLetter = getColumnLetter(nameColumn)
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(getGoogleSheetRange(sheetName, `${nameColumnLetter}2:${nameColumnLetter}`))}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    if (!response.ok) throw new Error(`Google Sheets active rows read failed: ${await response.text()}`)

    const rows = ((await response.json()) as { values?: Array<Array<string | number>> }).values ?? []
    activeRows = rows.flatMap((row, index) => String(row[0] ?? "").trim() ? [index + 2] : [])
  }

  const requests: Array<Record<string, unknown>> = [
    ...validationColumns.map((column) => ({
      setDataValidation: {
        range: { sheetId, startRowIndex: 1, startColumnIndex: column, endColumnIndex: column + 1 },
      },
    })),
    ...moneyColumns.map((column) => ({
      repeatCell: {
        range: { sheetId, startRowIndex: 1, startColumnIndex: column, endColumnIndex: column + 1 },
        cell: { userEnteredFormat: { numberFormat: { type: "CURRENCY", pattern: "$#,##0" } } },
        fields: "userEnteredFormat.numberFormat",
      },
    })),
    ...automaticProtectionIds.map((protectedRangeId) => ({ deleteProtectedRange: { protectedRangeId } })),
    ...automaticConditionalFormatIndexes.map((index) => ({ deleteConditionalFormatRule: { sheetId, index } })),
    ...automaticFilterViewIds.map((filterId) => ({ deleteFilterView: { filterId } })),
    ...getPaymentConditionalFormatRequests(sheetId, headers),
    ...getPaymentFilterViewRequests(sheetId, sheetName, headers),
    ...getOrderRowValidationRequests(sheetId, headers, activeRows),
  ]
  if (requests.length === 0) return

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
  if (!response.ok) throw new Error(`Google Sheets controls refresh failed: ${await response.text()}`)
}

async function addOrderRowValidations(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetId: number,
  headers: string[],
  rowNumber: number,
) {
  const requests = getOrderRowValidationRequests(sheetId, headers, [rowNumber])
  if (requests.length === 0) return

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
  if (!response.ok) throw new Error(`Google Sheets row validation failed: ${await response.text()}`)
}

function formatOrderDate(date: Date) {
  const parts = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Chihuahua",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<string, string>
  return `${values.day}/${values.month}/${values.year} ${values.hour}:${values.minute}`
}

function getBalanceFormula(headers: string[], rowNumber: number) {
  const fullTotalColumn = headers.indexOf(SHEET_HEADERS.fullTotal)
  const paymentExpectedColumn = headers.indexOf(SHEET_HEADERS.paymentExpected)
  const paymentStatusColumn = headers.indexOf(SHEET_HEADERS.paymentStatus)
  if (fullTotalColumn === -1 || paymentExpectedColumn === -1 || paymentStatusColumn === -1) return ""

  const fullTotalCell = `$${getColumnLetter(fullTotalColumn)}${rowNumber}`
  const paymentExpectedCell = `$${getColumnLetter(paymentExpectedColumn)}${rowNumber}`
  const paymentStatusCell = `$${getColumnLetter(paymentStatusColumn)}${rowNumber}`
  return `=(${paymentStatusCell}="ANTICIPO RECIBIDO")*(${fullTotalCell}-${paymentExpectedCell})`
}

function normalizePaymentStatus(value: unknown) {
  const status = String(value ?? "").trim().toUpperCase()
  if (status === "PAGADO" || status === "PAGADO COMPLETO") return "PAGO COMPLETO"
  if (status === "PEDIENTE") return "PENDIENTE"
  return PAYMENT_STATUSES.includes(status as (typeof PAYMENT_STATUSES)[number]) ? status : "PENDIENTE"
}

function normalizePaymentType(value: unknown) {
  return String(value ?? "").replace(/[()\"]/g, "").trim().toUpperCase()
}

function formatPaymentTypeValue(value: unknown) {
  const paymentType = normalizePaymentType(value)
  return paymentType === "ANTICIPO" || paymentType === "PAGO COMPLETO" ? `"${paymentType}"` : String(value ?? "")
}

async function updateSheetValues(
  config: GoogleSheetsConfig,
  accessToken: string,
  data: Array<{ range: string; values: Array<Array<string | number>> }>,
) {
  if (data.length === 0) return

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }),
    },
  )
  if (!response.ok) throw new Error(`Google Sheets value update failed: ${await response.text()}`)
}

function parseSheetMoney(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  const normalized = String(value ?? "").replace(/[^\d.-]/g, "")
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

async function migrateProductSheetRows(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetName: string,
  headers: string[],
  product: ProductOrderProduct,
) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(getGoogleSheetRange(sheetName, "A2:Z"))}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!response.ok) throw new Error(`Google Sheets row migration read failed: ${await response.text()}`)

  const rows = ((await response.json()) as { values?: Array<Array<string | number>> }).values ?? []
  const paymentTypeColumn = headers.indexOf(SHEET_HEADERS.paymentType)
  const quantityColumn = headers.indexOf(SHEET_HEADERS.quantity)
  const fullTotalColumn = headers.indexOf(SHEET_HEADERS.fullTotal)
  const paymentExpectedColumn = headers.indexOf(SHEET_HEADERS.paymentExpected)
  const paymentStatusColumn = headers.indexOf(SHEET_HEADERS.paymentStatus)
  const balanceDueColumn = headers.indexOf(SHEET_HEADERS.balanceDue)
  const updates: Array<{ range: string; values: Array<Array<string | number>> }> = []

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const quantity = Number(row[quantityColumn])
    const normalizedQuantity = Number.isInteger(quantity) && quantity > 0 ? quantity : 1
    const existingFullTotal = parseSheetMoney(row[fullTotalColumn])
    const paymentExpected = parseSheetMoney(row[paymentExpectedColumn])
    const previousBalance = parseSheetMoney(row[balanceDueColumn])
    const paymentType = paymentTypeColumn >= 0 ? formatPaymentTypeValue(row[paymentTypeColumn]) : ""
    const isDeposit = normalizePaymentType(paymentType) === "ANTICIPO"
    const historicalFullTotal = existingFullTotal
      ?? (isDeposit && paymentExpected !== null && previousBalance !== null
        ? paymentExpected + previousBalance
        : paymentExpected)
    const fullTotal = historicalFullTotal !== null && historicalFullTotal > 0
      ? historicalFullTotal
      : product.price * normalizedQuantity
    const normalizedPaymentExpected = paymentExpected
      ?? (isDeposit && typeof product.deposit === "number" ? product.deposit * normalizedQuantity : fullTotal)
    const paymentStatus = normalizePaymentStatus(row[paymentStatusColumn])

    updates.push(
      ...(paymentTypeColumn >= 0 ? [{
        range: getGoogleSheetRange(sheetName, `${getColumnLetter(paymentTypeColumn)}${rowNumber}`),
        values: [[paymentType]],
      }] : []),
      {
        range: getGoogleSheetRange(sheetName, `${getColumnLetter(fullTotalColumn)}${rowNumber}`),
        values: [[fullTotal]],
      },
      {
        range: getGoogleSheetRange(sheetName, `${getColumnLetter(paymentExpectedColumn)}${rowNumber}`),
        values: [[normalizedPaymentExpected]],
      },
      {
        range: getGoogleSheetRange(sheetName, `${getColumnLetter(paymentStatusColumn)}${rowNumber}`),
        values: [[paymentStatus]],
      },
      {
        range: getGoogleSheetRange(sheetName, `${getColumnLetter(balanceDueColumn)}${rowNumber}`),
        values: [[getBalanceFormula(headers, rowNumber)]],
      },
    )
  })

  await updateSheetValues(config, accessToken, updates)
}

async function refreshBalanceFormulas(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetName: string,
  headers: string[],
) {
  const nameColumn = headers.indexOf(SHEET_HEADERS.name)
  const paymentTypeColumn = headers.indexOf(SHEET_HEADERS.paymentType)
  const fullTotalColumn = headers.indexOf(SHEET_HEADERS.fullTotal)
  const paymentExpectedColumn = headers.indexOf(SHEET_HEADERS.paymentExpected)
  const paymentStatusColumn = headers.indexOf(SHEET_HEADERS.paymentStatus)
  const balanceDueColumn = headers.indexOf(SHEET_HEADERS.balanceDue)
  if ([nameColumn, fullTotalColumn, paymentExpectedColumn, paymentStatusColumn, balanceDueColumn].some((column) => column === -1)) return

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(getGoogleSheetRange(sheetName, "A2:Z"))}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!response.ok) throw new Error(`Google Sheets balance refresh read failed: ${await response.text()}`)

  const rows = ((await response.json()) as { values?: Array<Array<string | number>> }).values ?? []
  const updates = rows.flatMap((row, index) => {
    if (!String(row[nameColumn] ?? "").trim()) return []
    const rowNumber = index + 2
    const fullTotal = parseSheetMoney(row[fullTotalColumn])
    const paymentExpected = parseSheetMoney(row[paymentExpectedColumn])
    return [
      ...(paymentTypeColumn < 0 ? [] : [{
        range: getGoogleSheetRange(sheetName, `${getColumnLetter(paymentTypeColumn)}${rowNumber}`),
        values: [[formatPaymentTypeValue(row[paymentTypeColumn])]],
      }]),
      ...(fullTotal === null ? [] : [{
        range: getGoogleSheetRange(sheetName, `${getColumnLetter(fullTotalColumn)}${rowNumber}`),
        values: [[fullTotal]],
      }]),
      ...(paymentExpected === null ? [] : [{
        range: getGoogleSheetRange(sheetName, `${getColumnLetter(paymentExpectedColumn)}${rowNumber}`),
        values: [[paymentExpected]],
      }]),
      {
        range: getGoogleSheetRange(sheetName, `${getColumnLetter(paymentStatusColumn)}${rowNumber}`),
        values: [[normalizePaymentStatus(row[paymentStatusColumn])]],
      },
      {
        range: getGoogleSheetRange(sheetName, `${getColumnLetter(balanceDueColumn)}${rowNumber}`),
        values: [[getBalanceFormula(headers, rowNumber)]],
      },
    ]
  })

  await updateSheetValues(config, accessToken, updates)
}

async function getPaidQuantity(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetName: string,
  headers: string[],
) {
  const statusIndex = headers.indexOf(SHEET_HEADERS.paymentStatus)
  if (statusIndex === -1) return 0
  const quantityIndex = headers.indexOf(SHEET_HEADERS.quantity)

  const range = getGoogleSheetRange(sheetName, "A:Z")
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!response.ok) throw new Error(`Google Sheets order read failed: ${await response.text()}`)

  const data = await response.json() as { values?: string[][] }
  return (data.values ?? []).slice(1).reduce((total, row) => {
    const status = String(row[statusIndex] ?? "").trim().toUpperCase()
    if (status !== "ANTICIPO RECIBIDO" && status !== "PAGO COMPLETO" && status !== "PAGADO" && status !== "PAGADO COMPLETO") return total

    const quantity = quantityIndex === -1 ? 1 : Number(row[quantityIndex])
    return total + (Number.isInteger(quantity) && quantity > 0 ? quantity : 1)
  }, 0)
}

async function appendOrder(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetName: string,
  headers: string[],
  data: Record<string, string | number>,
) {
  const values = headers.map((header) => data[header] ?? "")
  const range = getGoogleSheetRange(sheetName, "A:Z")
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [values] }),
    },
  )
  if (!response.ok) throw new Error(`Google Sheets order append failed: ${await response.text()}`)

  const responseData = await response.json() as { updates?: { updatedRange?: string } }
  return Number(responseData.updates?.updatedRange?.match(/![A-Z]+(\d+):/)?.[1])
}

async function formatPaymentType(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetId: number,
  rowNumber: number,
  headers: string[],
  paymentType: "deposit" | "full",
) {
  const typeColumn = headers.indexOf(SHEET_HEADERS.paymentType)
  if (typeColumn === -1 || !rowNumber) return

  const backgroundColor = paymentType === "deposit"
    ? { red: 0.78, green: 0.58, blue: 0.06 }
    : { red: 0.62, green: 0.24, blue: 0.04 }
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [{
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: rowNumber - 1,
              endRowIndex: rowNumber,
              startColumnIndex: typeColumn,
              endColumnIndex: typeColumn + 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor,
                textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true },
              },
            },
            fields: "userEnteredFormat(backgroundColor,textFormat)",
          },
        }],
      }),
    },
  )
  if (!response.ok) {
    console.warn(`[product-order] Google Sheets type format failed: ${await response.text()}`)
  }
}

function sanitizeName(input: unknown) {
  return typeof input === "string"
    ? input.trim().replace(/\s+/g, " ").slice(0, 80).replace(/<[^>]*>/g, "")
    : ""
}

function sanitizePhone(input: unknown) {
  const digits = typeof input === "string" ? input.replace(/\D/g, "") : ""
  return digits.startsWith("52") && digits.length === 12 ? digits.slice(2) : digits.slice(0, 10)
}

export async function getProductOrderProduct(productId: string): Promise<ProductOrderProduct | null> {
  const client = getSanityClient()
  const product = await client.fetch<any>(
    `*[_type == "product" && _id == $productId][0]{
      _id,
      name,
      price,
      deposit,
      stock,
      allowSizeSelection,
      variantsEnabled,
      variants[]->{_id, name, "photos": photos[]{asset->{url}}},
      allowMultipleQuantity,
      isDisabled
    }`,
    { productId },
  )
  if (!product) return null

  return {
    id: product._id,
    name: String(product.name ?? ""),
    price: Number(product.price),
    deposit: typeof product.deposit === "number" ? product.deposit : undefined,
    stock: typeof product.stock === "number" ? product.stock : undefined,
    allowSizeSelection: Boolean(product.allowSizeSelection),
    variantsEnabled: Boolean(product.variantsEnabled),
    variants: (product.variants ?? []).filter(Boolean).map((variant: any) => ({
      id: variant._id,
      name: String(variant.name ?? ""),
      photos: (variant.photos ?? []).map((photo: any) => String(photo?.asset?.url ?? photo?.url ?? "")).filter(Boolean),
    })),
    allowMultipleQuantity: Boolean(product.allowMultipleQuantity),
    isDisabled: Boolean(product.isDisabled),
  }
}

function validateOrderInput(product: ProductOrderProduct, input: ProductOrderInput): ProductOrderDetails {
  const name = sanitizeName(input.name)
  const phone = sanitizePhone(input.phone)
  if (name.length < 2) throw new ProductOrderUserError("Escribe tu nombre completo.")
  if (phone.length !== 10) throw new ProductOrderUserError("Escribe los 10 digitos de tu celular.")
  if (product.isDisabled) throw new ProductOrderUserError("Este producto no esta disponible.")
  if (!Number.isFinite(product.price) || product.price < 0) throw new Error("El precio del producto no es valido.")

  const quantity = Number(input.quantity)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new ProductOrderUserError("La cantidad del producto no es valida.")
  }
  if (!product.allowMultipleQuantity && quantity !== 1) {
    throw new ProductOrderUserError("Este producto solo permite una unidad por pedido.")
  }

  const paymentType = input.paymentType === "deposit" ? "deposit" : "full"
  if (paymentType === "deposit" && typeof product.deposit !== "number") {
    throw new ProductOrderUserError("Este producto no tiene anticipo disponible.")
  }

  let variantName: string | undefined
  if (product.variantsEnabled) {
    const variant = input.variantId ? product.variants.find((item) => item.id === input.variantId) : undefined
    variantName = variant?.name || product.name
  }

  let size: string | undefined
  if (product.allowSizeSelection) {
    const allowedSizes = ["CH", "M", "G", "XG"]
    if (!input.size || !allowedSizes.includes(input.size)) {
      throw new ProductOrderUserError("Selecciona una talla valida.")
    }
    size = input.size
  }

  return {
    product,
    variantName,
    size,
    paymentType,
    unitPrice: paymentType === "deposit" ? product.deposit! : product.price,
    quantity,
  }
}

export async function createProductOrder(input: ProductOrderInput) {
  const product = await getProductOrderProduct(input.productId)
  if (!product) throw new ProductOrderUserError("No se encontro el producto.")
  const order = validateOrderInput(product, input)
  const config = getGoogleSheetsConfig()
  const accessToken = await getGoogleSheetsAccessToken(config)
  const sheet = await ensureProductSheet(config, accessToken, product)
  if (sheet.needsConfiguration) {
    await migrateProductSheetRows(config, accessToken, sheet.sheetName, sheet.headers, product)
    await configureProductSheet(config, accessToken, sheet.sheetId, sheet.headers)
  } else {
    await refreshBalanceFormulas(config, accessToken, sheet.sheetName, sheet.headers)
  }
  await refreshProductSheetControls(config, accessToken, sheet.sheetId, sheet.sheetName, sheet.headers)
  const paidQuantity = typeof product.stock === "number"
    ? await getPaidQuantity(config, accessToken, sheet.sheetName, sheet.headers)
    : 0
  const remainingStock = typeof product.stock === "number" ? Math.max(0, product.stock - paidQuantity) : undefined

  if (typeof remainingStock === "number" && order.quantity > remainingStock) {
    throw new ProductOrderUserError(remainingStock === 0 ? "Este producto esta agotado." : `Solo quedan ${remainingStock} unidades disponibles.`)
  }

  const name = sanitizeName(input.name)
  const phone = sanitizePhone(input.phone)
  const orderId = crypto.randomUUID()
  const fullTotal = product.price * order.quantity
  const rowNumber = await appendOrder(config, accessToken, sheet.sheetName, sheet.headers, {
    [SHEET_HEADERS.orderId]: orderId,
    [SHEET_HEADERS.name]: name,
    [SHEET_HEADERS.phone]: phone,
    [SHEET_HEADERS.orderedAt]: formatOrderDate(new Date()),
    [SHEET_HEADERS.paymentType]: order.paymentType === "deposit" ? '"ANTICIPO"' : '"PAGO COMPLETO"',
    [SHEET_HEADERS.variant]: order.variantName ?? "",
    [SHEET_HEADERS.size]: order.size ?? "",
    [SHEET_HEADERS.quantity]: order.quantity,
    [SHEET_HEADERS.fullTotal]: fullTotal,
    [SHEET_HEADERS.paymentExpected]: order.unitPrice * order.quantity,
    [SHEET_HEADERS.paymentStatus]: "PENDIENTE",
    [SHEET_HEADERS.balanceDue]: 0,
  })
  await updateSheetValues(config, accessToken, [{
    range: getGoogleSheetRange(sheet.sheetName, `${getColumnLetter(sheet.headers.indexOf(SHEET_HEADERS.balanceDue))}${rowNumber}`),
    values: [[getBalanceFormula(sheet.headers, rowNumber)]],
  }])
  await addOrderRowValidations(config, accessToken, sheet.sheetId, sheet.headers, rowNumber)
  await formatPaymentType(config, accessToken, sheet.sheetId, rowNumber, sheet.headers, order.paymentType)

  return { remainingStock, productName: product.name }
}

export async function getProductStockAvailability(productIds: string[]) {
  const ids = Array.from(new Set(productIds.filter(Boolean))).slice(0, 50)
  if (ids.length === 0) return []

  const client = getSanityClient()
  const products = await client.fetch<Array<{ _id: string; stock?: number; remainingStock?: number }>>(
    `*[_type == "product" && _id in $ids && !isDisabled]{_id, stock, remainingStock}`,
    { ids },
  )

  return (products ?? []).map((product) => ({
    id: product._id,
    remainingStock: typeof product.stock === "number"
      ? (typeof product.remainingStock === "number" ? product.remainingStock : product.stock)
      : null,
  }))
}

export async function refreshProductStockAvailabilityCache() {
  const products = await sanityQueryNoStore<Array<{
    _id: string
    name: string
    stock: number
    remainingStock?: number
  }>>(
    `*[_type == "product" && !isDisabled && defined(stock)]{_id, name, stock, remainingStock}`,
  )
  if (!products?.length) return { availability: [], changed: 0 }

  const config = getGoogleSheetsConfig()
  const accessToken = await getGoogleSheetsAccessToken(config)

  const availability = await Promise.all(products.map(async (product) => {
    const sheetId = await getSheetId(config, accessToken, product.name)
    if (sheetId === null) return { id: product._id, remainingStock: product.stock }

    const headers = (await getSheetHeader(config, accessToken, product.name)).map(migrateLegacyHeader)
    const paidQuantity = await getPaidQuantity(config, accessToken, product.name, headers)
    return { id: product._id, remainingStock: Math.max(0, product.stock - paidQuantity) }
  }))

  const mutations = availability.flatMap((item) => {
    const product = products.find((candidate) => candidate._id === item.id)
    if (!product || product.remainingStock === item.remainingStock) return []
    return [{ patch: { id: item.id, set: { remainingStock: item.remainingStock } } }]
  })
  if (mutations.length > 0) await sanityMutate(mutations)

  return { availability, changed: mutations.length }
}
