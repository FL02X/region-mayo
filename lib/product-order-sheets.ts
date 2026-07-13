import { getSanityClient } from "@/lib/sanity/client"

const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets"
const SHEET_HEADERS = {
  orderId: "ID",
  name: "Nombre",
  phone: "Numero",
  orderedAt: "Fecha y hora",
  paymentType: "Tipo",
  variant: "Variante",
  size: "Talla",
  quantity: "Cantidad",
  total: "Total (MXN)",
  pendingBalance: "Saldo pendiente despues de pagar",
  status: "Estado",
} as const

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
    SHEET_HEADERS.quantity,
    SHEET_HEADERS.total,
    SHEET_HEADERS.pendingBalance,
    SHEET_HEADERS.status,
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
  let headers = existingHeaders.length > 0 ? [...existingHeaders] : getProductSheetHeaders(product)

  if (existingHeaders.length === 0) {
    await setSheetHeader(config, accessToken, sheetName, headers)
  } else {
    let headersChanged = false

    if (!headers.includes(SHEET_HEADERS.orderId)) {
      await insertSheetColumn(config, accessToken, sheetId, 0)
      headers.unshift(SHEET_HEADERS.orderId)
      headersChanged = true
    }

    if (!headers.includes(SHEET_HEADERS.pendingBalance)) {
      const totalColumn = headers.indexOf(SHEET_HEADERS.total)
      const pendingBalanceColumn = totalColumn === -1 ? headers.length : totalColumn + 1
      await insertSheetColumn(config, accessToken, sheetId, pendingBalanceColumn)
      headers.splice(pendingBalanceColumn, 0, SHEET_HEADERS.pendingBalance)
      headersChanged = true
    }

    if (headersChanged) await setSheetHeader(config, accessToken, sheetName, headers)
  }

  return { sheetId, sheetName, headers }
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

async function getPaidQuantity(
  config: GoogleSheetsConfig,
  accessToken: string,
  sheetName: string,
  headers: string[],
) {
  const statusIndex = headers.indexOf(SHEET_HEADERS.status)
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
    if (String(row[statusIndex] ?? "").trim().toUpperCase() !== "PAGADO") return total

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
  if (name.length < 2) throw new Error("Escribe tu nombre completo.")
  if (phone.length !== 10) throw new Error("Escribe los 10 digitos de tu celular.")
  if (product.isDisabled) throw new Error("Este producto no esta disponible.")
  if (!Number.isFinite(product.price) || product.price < 0) throw new Error("El precio del producto no es valido.")

  const quantity = Number(input.quantity)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new Error("La cantidad del producto no es valida.")
  }
  if (!product.allowMultipleQuantity && quantity !== 1) {
    throw new Error("Este producto solo permite una unidad por pedido.")
  }

  const paymentType = input.paymentType === "deposit" ? "deposit" : "full"
  if (paymentType === "deposit" && typeof product.deposit !== "number") {
    throw new Error("Este producto no tiene anticipo disponible.")
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
      throw new Error("Selecciona una talla valida.")
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
  if (!product) throw new Error("No se encontro el producto.")
  const order = validateOrderInput(product, input)
  const config = getGoogleSheetsConfig()
  const accessToken = await getGoogleSheetsAccessToken(config)
  const sheet = await ensureProductSheet(config, accessToken, product)
  const paidQuantity = typeof product.stock === "number"
    ? await getPaidQuantity(config, accessToken, sheet.sheetName, sheet.headers)
    : 0
  const remainingStock = typeof product.stock === "number" ? Math.max(0, product.stock - paidQuantity) : undefined

  if (typeof remainingStock === "number" && order.quantity > remainingStock) {
    throw new Error(remainingStock === 0 ? "Este producto esta agotado." : `Solo quedan ${remainingStock} unidades disponibles.`)
  }

  const name = sanitizeName(input.name)
  const phone = sanitizePhone(input.phone)
  const orderId = crypto.randomUUID()
  const pendingBalance = order.paymentType === "deposit"
    ? Math.max(0, (product.price - order.unitPrice) * order.quantity)
    : null
  const rowNumber = await appendOrder(config, accessToken, sheet.sheetName, sheet.headers, {
    [SHEET_HEADERS.orderId]: orderId,
    [SHEET_HEADERS.name]: name,
    [SHEET_HEADERS.phone]: phone,
    [SHEET_HEADERS.orderedAt]: formatOrderDate(new Date()),
    [SHEET_HEADERS.paymentType]: order.paymentType === "deposit" ? "ANTICIPO" : "PAGO COMPLETO",
    [SHEET_HEADERS.variant]: order.variantName ?? "",
    [SHEET_HEADERS.size]: order.size ?? "",
    [SHEET_HEADERS.quantity]: order.quantity,
    [SHEET_HEADERS.total]: (order.unitPrice * order.quantity).toFixed(2),
    [SHEET_HEADERS.pendingBalance]: pendingBalance === null ? "" : pendingBalance.toFixed(2),
    [SHEET_HEADERS.status]: "PENDIENTE",
  })
  await formatPaymentType(config, accessToken, sheet.sheetId, rowNumber, sheet.headers, order.paymentType)

  return { remainingStock, productName: product.name }
}

export async function getProductStockAvailability(productIds: string[]) {
  const ids = Array.from(new Set(productIds.filter(Boolean))).slice(0, 50)
  if (ids.length === 0) return []

  const client = getSanityClient()
  const products = await client.fetch<Array<{ _id: string; name: string; stock?: number }>>(
    `*[_type == "product" && _id in $ids && !isDisabled]{_id, name, stock}`,
    { ids },
  )
  const config = getGoogleSheetsConfig()
  const accessToken = await getGoogleSheetsAccessToken(config)

  return Promise.all((products ?? []).map(async (product) => {
    if (typeof product.stock !== "number") return { id: product._id, remainingStock: null }

    const sheetId = await getSheetId(config, accessToken, product.name)
    if (sheetId === null) return { id: product._id, remainingStock: product.stock }

    const headers = await getSheetHeader(config, accessToken, product.name)
    const paidQuantity = await getPaidQuantity(config, accessToken, product.name, headers)
    return { id: product._id, remainingStock: Math.max(0, product.stock - paidQuantity) }
  }))
}
