/**
 * CSV → Sanity Importer (idempotent)
 *
 * Goals:
 * - Fuzzy-match templo names (orthography differences) and re-use existing documents.
 * - Only fill missing fields (never overwrite existing non-empty data).
 * - Create missing docs when we can match confidently; otherwise report.
 * - Import events with rationalized titles and optional event.templo reference.
 *
 * Usage (dry-run):
 *   pnpm ts-node scripts/import-csv-to-sanity.ts \
 *     --templos /home/hidde/Downloads/Templos.csv \
 *     --coros /home/hidde/Downloads/Coros.csv \
 *     --pastores /home/hidde/Downloads/Pastores.csv \
 *     --directiva /home/hidde/Downloads/Directiva.csv \
 *     --eventos /home/hidde/Downloads/Eventos.csv
 *
 * Usage (commit):
 *   SANITY_WRITE_TOKEN=xxx pnpm ts-node scripts/import-csv-to-sanity.ts --commit [same args]
 */

// NOTE: This script is intentionally CommonJS-friendly so it can run with the repo's current ts-node setup.
// (The workspace tsconfig uses module=esnext; ts-node in CJS mode will not transform ESM `import`.)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createClient } = require('@sanity/client') as typeof import('@sanity/client')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs') as typeof import('fs')

type CsvRow = Record<string, string>

type RegionDoc = {
  _id: string
  name: string
  slug?: { current?: string }
}

type TemploDoc = {
  _id: string
  temploName: string
  address?: string
  googleMapsUrl?: string
  description?: string
  region?: { _id: string; name?: string; slug?: { current?: string } }
}

type CoroDoc = {
  _id: string
  coroName: string
  presidentName?: string
  presidentPhone?: string
  templo?: { _id: string; temploName?: string }
}

type PastorDoc = {
  _id: string
  fullName: string
  phone?: string
  templo?: { _id: string; temploName?: string; region?: { _id: string } }
  region?: { _id: string }
}

type DirectivaDoc = {
  _id: string
  fullName: string
  role?: string
  roleCustom?: string
  phone?: string
  templo?: { _id: string; temploName?: string; region?: { _id: string } }
  region?: { _id: string }
}

type EventDoc = {
  _id: string
  title: string
  eventType: string
  date: string
  endDate?: string
  time: string
  schedule?: Array<{ date?: string; time?: string }>
  location: string
  address: string
  googleMapsUrl?: string
  templo?: { _id: string }
}

type ImportOptions = {
  commit: boolean
  templosPath?: string
  corosPath?: string
  pastoresPath?: string
  directivaPath?: string
  eventosPath?: string
  regionSlug: string
}

function loadEnvFromFiles(filePaths: string[]) {
  for (const filePath of filePaths) {
    try {
      if (!fs.existsSync(filePath)) continue
      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split(/\r?\n/)
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const idx = trimmed.indexOf('=')
        if (idx <= 0) continue
        const key = trimmed.slice(0, idx).trim()
        let value = trimmed.slice(idx + 1).trim()
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    } catch {
      // Ignore env file errors; explicit env vars take precedence.
    }
  }
}

function parseArgs(argv: string[]): ImportOptions {
  const options: ImportOptions = {
    commit: argv.includes('--commit'),
    regionSlug: 'mayo',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const next = argv[i + 1]

    if (arg === '--templos') options.templosPath = next
    if (arg === '--coros') options.corosPath = next
    if (arg === '--pastores') options.pastoresPath = next
    if (arg === '--directiva') options.directivaPath = next
    if (arg === '--eventos') options.eventosPath = next
    if (arg === '--region') options.regionSlug = next
  }

  return options
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

function parseCsv(text: string): string[][] {
  // Robust-enough CSV parser for: commas, quoted fields, escaped quotes.
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const input = stripBom(text)
  for (let i = 0; i < input.length; i++) {
    const char = input[i]

    if (inQuotes) {
      if (char === '"') {
        const next = input[i + 1]
        if (next === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }

    if (char === ',') {
      row.push(field)
      field = ''
      continue
    }

    if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }

    if (char === '\r') {
      // Ignore \r, handle \r\n via the \n case.
      continue
    }

    field += char
  }

  // trailing field
  row.push(field)
  rows.push(row)

  // Drop fully empty trailing rows
  while (rows.length > 0 && rows[rows.length - 1].every((v) => !String(v ?? '').trim())) {
    rows.pop()
  }

  return rows
}

function csvToObjects(rows: string[][]): CsvRow[] {
  if (rows.length === 0) return []
  const headers = rows[0].map((h) => h.trim())

  const objects: CsvRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const values = rows[i]
    const obj: CsvRow = {}
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j]
      obj[header] = (values[j] ?? '').trim()
    }
    objects.push(obj)
  }
  return objects
}

function readCsvFile(filePath: string): CsvRow[] {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const rows = parseCsv(raw)
  return csvToObjects(rows)
}

function normalizeText(input: string): string {
  const normalized = (input ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Common known typos/variants in source CSVs.
  return normalized
    .replace(/\bbuasyacobe\b/g, 'buasyaciacobe')
    .replace(/\bbuaysiacobe\b/g, 'buasyaciacobe')
    .replace(/\bbacompampo\b/g, 'bacobampo')
    .replace(/\bhuatabanpo\b/g, 'huatabampo')
}

function tokens(input: string): string[] {
  const norm = normalizeText(input)
  if (!norm) return []

  const stopwords = new Set([
    'iglesia',
    'gentil',
    'cristo',
    'templo',
    'campo',
    'evangelismo',
    'evangelizmo',
    'col',
    'cd',
    'de',
    'del',
    'la',
    'las',
    'el',
    'los',
    'en',
    'y',
  ])

  return norm
    .split(' ')
    .filter(Boolean)
    .filter((t) => !stopwords.has(t))
}

function levenshteinDistance(a: string, b: string): number {
  const s = a ?? ''
  const t = b ?? ''
  if (s === t) return 0
  if (!s) return t.length
  if (!t) return s.length

  const v0 = new Array(t.length + 1).fill(0)
  const v1 = new Array(t.length + 1).fill(0)

  for (let i = 0; i <= t.length; i++) v0[i] = i

  for (let i = 0; i < s.length; i++) {
    v1[0] = i + 1
    for (let j = 0; j < t.length; j++) {
      const cost = s[i] === t[j] ? 0 : 1
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost)
    }
    for (let j = 0; j <= t.length; j++) v0[j] = v1[j]
  }

  return v0[t.length]
}

function normalizedLevenshteinSimilarity(a: string, b: string): number {
  const x = normalizeText(a)
  const y = normalizeText(b)
  if (!x || !y) return 0
  const dist = levenshteinDistance(x, y)
  const denom = Math.max(x.length, y.length)
  return denom === 0 ? 0 : 1 - dist / denom
}

function jaccardSimilarity(aTokens: string[], bTokens: string[]): number {
  const a = new Set(aTokens)
  const b = new Set(bTokens)
  if (a.size === 0 || b.size === 0) return 0

  let intersection = 0
  for (const t of a) {
    if (b.has(t)) intersection++
  }
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

function tokenSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 1
  const dist = levenshteinDistance(a, b)
  const denom = Math.max(a.length, b.length)
  return denom === 0 ? 0 : 1 - dist / denom
}

function softJaccardSimilarity(aTokens: string[], bTokens: string[]): number {
  if (aTokens.length === 0 || bTokens.length === 0) return 0

  const used = new Set<number>()
  let matches = 0

  for (const a of aTokens) {
    let bestIdx = -1
    let best = 0
    for (let j = 0; j < bTokens.length; j++) {
      if (used.has(j)) continue
      const s = tokenSimilarity(a, bTokens[j])
      if (s > best) {
        best = s
        bestIdx = j
      }
    }
    if (bestIdx >= 0 && best >= 0.84) {
      used.add(bestIdx)
      matches++
    }
  }

  const union = aTokens.length + bTokens.length - matches
  return union === 0 ? 0 : matches / union
}

function normalizePhone(input: string): string | undefined {
  const digits = String(input ?? '').replace(/\D/g, '')
  if (!digits) return undefined
  if (digits.length === 10) return digits
  if (digits.length === 11 && digits.startsWith('52')) return digits.slice(1)
  if (digits.length === 12 && digits.startsWith('52')) return digits.slice(2)
  return undefined
}

function toTitleCaseName(input: string): string {
  const raw = String(input ?? '').trim()
  if (!raw) return ''

  const lowerWords = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e'])
  const parts = raw
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, idx) => {
      if (idx !== 0 && lowerWords.has(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })

  return parts.join(' ')
}

function normalizeHorarios(input: string): string | undefined {
  const raw = String(input ?? '').trim()
  if (!raw) return undefined

  // Common patterns like: "Ma&Ju = 6:30PM, Dom = 10:00AM"
  let text = raw

  // unify separators
  text = text.replace(/\s*,\s*/g, ', ')

  const match = text.match(/Ma\s*&\s*Ju\s*=\s*([^,]+)(?:,\s*Dom\s*=\s*(.+))?/i)
  if (match) {
    const tueThu = match[1]?.trim()
    const sunday = match[2]?.trim()
    const lines: string[] = []
    if (tueThu) {
      const hh = normalizeHumanTime(tueThu) ?? tueThu
      lines.push(`Martes = ${hh}`)
      lines.push(`Jueves = ${hh}`)
    }
    if (sunday) {
      const hh = normalizeHumanTime(sunday) ?? sunday
      lines.push(`Domingo = ${hh}`)
    }
    return lines.join('\n')
  }

  return raw
}

function normalizeHumanTime(input: string): string | undefined {
  const raw = String(input ?? '').trim()
  if (!raw) return undefined

  // Examples: 7PM, 8AM, 6:30PM, 10:00AM, 6:30
  const m = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i)
  if (!m) return undefined

  const hour = Number(m[1])
  const minutes = m[2] ? Number(m[2]) : 0
  const ampm = m[3]?.toUpperCase()

  if (Number.isNaN(hour) || hour < 0 || hour > 23) return undefined
  if (Number.isNaN(minutes) || minutes < 0 || minutes > 59) return undefined

  // If AM/PM is missing, keep as 24h-ish display but with minutes.
  if (!ampm) {
    return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  const displayHour = hour === 0 ? 12 : hour
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`
}

function parseMxDateDmy(input: string): { year: number; month: number; day: number } | null {
  const raw = String(input ?? '').trim()
  if (!raw) return null

  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null

  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  return { year, month, day }
}

function buildIsoWithOffset(
  dmy: { year: number; month: number; day: number },
  time24: { hour: number; minute: number },
  offset: string,
): string {
  const yyyy = String(dmy.year).padStart(4, '0')
  const mm = String(dmy.month).padStart(2, '0')
  const dd = String(dmy.day).padStart(2, '0')
  const hh = String(time24.hour).padStart(2, '0')
  const min = String(time24.minute).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00${offset}`
}

function formatDateInput(dmy: { year: number; month: number; day: number }): string {
  return [
    String(dmy.year).padStart(4, '0'),
    String(dmy.month).padStart(2, '0'),
    String(dmy.day).padStart(2, '0'),
  ].join('-')
}

function addDateInputDays(dateInput: string, days: number): string {
  const [year, month, day] = dateInput.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days, 12))
  return [
    String(date.getUTCFullYear()).padStart(4, '0'),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

function buildEventSchedule(startDate: string, endDate: string | undefined, time: string) {
  const lastDate = endDate && endDate >= startDate ? endDate : startDate
  const schedule = []

  for (let index = 0, currentDate = startDate; currentDate <= lastDate; index += 1, currentDate = addDateInputDays(currentDate, 1)) {
    schedule.push({
      _key: `${currentDate.replace(/-/g, '')}-${index}`,
      _type: 'occurrence',
      date: currentDate,
      time,
    })
  }

  return schedule
}

function parseHoraToTime24(input: string): { hour: number; minute: number } | null {
  const raw = String(input ?? '').trim()
  if (!raw) return null

  // Accept: 7PM, 8AM, 7:30PM, 19:00
  const m1 = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i)
  if (m1) {
    let hour = Number(m1[1])
    const minute = m1[2] ? Number(m1[2]) : 0
    const ampm = String(m1[3]).toUpperCase()

    if (ampm === 'AM') {
      if (hour === 12) hour = 0
    } else {
      if (hour !== 12) hour += 12
    }
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
    return { hour, minute }
  }

  const m2 = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (m2) {
    const hour = Number(m2[1])
    const minute = Number(m2[2])
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
    return { hour, minute }
  }

  return null
}

function isProbablyHeaderLikeTemploName(input: string): boolean {
  const norm = normalizeText(input)
  return (
    !norm ||
    norm === 'campos de evangelismo' ||
    norm === 'campos de evangelizmo'
  )
}

function findBestTemploMatch(
  temploInput: string,
  candidates: TemploDoc[],
): { templo: TemploDoc | null; score: number } {
  const inputNorm = normalizeText(temploInput)
  if (!inputNorm) return { templo: null, score: 0 }

  const inputTokens = tokens(temploInput)

  // Shortcut: substring match on normalized string for short inputs.
  let best: { templo: TemploDoc | null; score: number } = { templo: null, score: 0 }

  for (const templo of candidates) {
    const candNorm = normalizeText(templo.temploName)

    let score = 0
    if (candNorm === inputNorm) {
      score = 1
    } else if (candNorm.includes(inputNorm) || inputNorm.includes(candNorm)) {
      score = 0.92
    } else {
      const candTokens = tokens(templo.temploName)
      const tokenScore = Math.max(
        jaccardSimilarity(inputTokens, candTokens),
        softJaccardSimilarity(inputTokens, candTokens),
      )
      const editScore = normalizedLevenshteinSimilarity(inputNorm, candNorm)
      // Favor token overlap; only rely heavily on edit distance when token overlap is non-trivial.
      // This avoids false positives like "Campo ... Sirebampo" matching "Campo ... Bacobampo".
      const gatedEditScore = tokenScore >= 0.25 ? editScore * 0.88 : editScore * 0.4
      score = Math.max(tokenScore, gatedEditScore)
    }

    if (score > best.score) {
      best = { templo, score }
    }
  }

  return best
}

function titleCasePlace(input: string): string {
  const raw = String(input ?? '').trim()
  if (!raw) return ''

  // Preserve common abbreviations.
  const text = raw
    .replace(/\bCD\.?\b/gi, 'Cd.')
    .replace(/\bOBREGON\b/gi, 'Obregón')
    .replace(/\bHUATABAMPO\b/gi, 'Huatábampo')

  return toTitleCaseName(text)
}

function buildEventTitle(tipoRaw: string, placeRaw: string): string {
  const tipo = String(tipoRaw ?? '').trim()
  const place = String(placeRaw ?? '').trim()

  const tipoNorm = normalizeText(tipo)
  let label = titleCasePlace(tipo)

  if (tipoNorm.includes('campana') && tipoNorm.includes('regional')) {
    label = 'Campaña Regional'
  } else if (tipoNorm.includes('campana') && tipoNorm.includes('general')) {
    label = 'Campaña General'
  } else if (tipoNorm.includes('campana')) {
    label = 'Campaña'
  } else if (tipoNorm.includes('biregional')) {
    label = titleCasePlace(tipo)
  } else if (tipoNorm.includes('congreso') && tipoNorm.includes('brilla')) {
    label = 'Congreso Brilla'
  } else if (tipoNorm.includes('conv')) {
    // Covers CONV. and CONVENCION
    label = tipoNorm.includes('general') ? 'Convención General' : 'Convención'
  } else if (tipoNorm.includes('visita') && tipoNorm.includes('mgr')) {
    label = 'Recorrido Regional'
  } else if (tipoNorm.includes('visita')) {
    label = 'Visita Regional'
  } else if (tipoNorm.includes('confraternidad') && tipoNorm.includes('general')) {
    label = 'Confraternidad Juvenil General'
  } else if (tipoNorm.includes('confraternidad')) {
    label = 'Confraternidad Juvenil Regional'
  }

  const placeLabel = place ? titleCasePlace(place) : 'Por Confirmar'
  return `${label} en ${placeLabel}`
}

function mapCsvTipoToEventType(tipoRaw: string): string {
  const tipoNorm = normalizeText(tipoRaw)

  if (tipoNorm.includes('confraternidad') && tipoNorm.includes('general')) {
    return 'confraternidadJuvenilGeneral'
  }
  if (tipoNorm.includes('confraternidad')) {
    return 'confraternidadJuvenilRegional'
  }
  if (tipoNorm.includes('campana')) return 'campana'
  if (tipoNorm.includes('congreso') && tipoNorm.includes('brilla')) return 'congresoBrilla'
  if (tipoNorm.includes('biregional')) return 'biregional'
  if (tipoNorm.includes('visita') && tipoNorm.includes('mgr')) return 'recorrido'
  if (tipoNorm.includes('visita')) return 'visita'
  if (tipoNorm.includes('conv')) return 'convencion'

  throw new Error(`Unmapped event Tipo: ${String(tipoRaw)}`)
}

function mapDirectivaRole(cargoRaw: string): { role: string; roleCustom?: string } {
  const cargo = String(cargoRaw ?? '').trim()
  const norm = normalizeText(cargo)

  const exactMap: Array<{ includes: string; role: string }> = [
    { includes: 'presidente regional', role: 'president_regional' },
    { includes: 'vicepresidente regional', role: 'vice_president_regional' },
    { includes: 'secretaria regional', role: 'secretary_regional' },
    { includes: 'tesorera regional', role: 'treasurer_regional' },
    { includes: 'presidente local', role: 'president_local' },
    { includes: 'vicepresidente local', role: 'vice_president_local' },
    { includes: 'secretaria local', role: 'secretary_local' },
    { includes: 'tesorera local', role: 'treasurer_local' },
    { includes: 'coordinador de eventos', role: 'event_coordinator' },
    { includes: 'ministerio femenino', role: 'womens_ministry' },
    { includes: 'ministerio juvenil', role: 'youth_ministry' },
  ]

  const hit = exactMap.find((m) => norm.includes(m.includes))
  if (hit && !norm.includes('suplente')) {
    return { role: hit.role }
  }

  // Preserve nuance like "Suplente Secretario", "Cronista", etc.
  return { role: 'other', roleCustom: cargo }
}

async function resolveRegion(client: ReturnType<typeof createClient>, regionSlug: string): Promise<RegionDoc> {
  const regions: RegionDoc[] = await client.fetch(`*[_type == 'region']{_id,name,slug}`)
  const target = normalizeText(regionSlug)

  const bySlug = regions.find((r) => normalizeText(r.slug?.current ?? '') === target)
  if (bySlug) return bySlug

  const byName = regions.find((r) => normalizeText(r.name) === target || normalizeText(r.name).includes(target))
  if (byName) return byName

  throw new Error(`Region not found for slug/name: ${regionSlug}`)
}

function buildSanityClient(commit: boolean) {
  const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'iqybd074'
  const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_WRITE_TOKEN

  if (commit && !token) {
    throw new Error('Missing SANITY_WRITE_TOKEN (required for --commit)')
  }

  // NOTE: If your dataset is private, you may still need a token for reads.
  return createClient({
    projectId,
    dataset,
    apiVersion: process.env.SANITY_API_VERSION || '2025-01-01',
    token: token,
    useCdn: false,
  })
}

async function upsertTemplos(
  client: ReturnType<typeof createClient>,
  region: RegionDoc,
  rows: CsvRow[],
  commit: boolean,
): Promise<TemploDoc[]> {
  const existing: TemploDoc[] = await client.fetch(
    `*[_type == 'templo' && region._ref == $regionId && !defined(deletedAt)]{
      _id,
      temploName,
      address,
      googleMapsUrl,
      description,
      region->{_id,name,slug}
    }`,
    { regionId: region._id },
  )

  const templos = [...existing]

  let created = 0
  let patched = 0
  let skipped = 0

  for (const row of rows) {
    const nombre = row['Nombre']?.trim()
    if (!nombre || isProbablyHeaderLikeTemploName(nombre)) continue

    const address = row['Direccion']?.trim()
    const googleMapsUrl = row['LINK A GOOGLE MAPS']?.trim() || row['LINK A GOOGLE MAPS']?.trim()
    const horarios = normalizeHorarios(row['Horarios'])

    const match = findBestTemploMatch(nombre, templos)

    if (process.env.DEBUG_IMPORT === '1' && normalizeText(nombre).includes('sirebampo')) {
      console.log(`\n[Debug] processing templo row: "${nombre}"`) 
      console.log(`[Debug] best match: ${match.templo?.temploName || '(none)'} (score=${match.score.toFixed(2)})`) 
    }

    if (match.templo && match.score >= 0.72) {
      const templo = match.templo
      const patch: Record<string, unknown> = {}

      if (!templo.address?.trim() && address) patch.address = address
      if (!templo.googleMapsUrl?.trim() && googleMapsUrl && googleMapsUrl.toLowerCase() !== 'falta') {
        patch.googleMapsUrl = googleMapsUrl
      }
      if (!templo.description?.trim() && horarios) patch.description = horarios

      if (Object.keys(patch).length === 0) {
        if (process.env.DEBUG_IMPORT === '1' && normalizeText(nombre).includes('sirebampo')) {
          console.log('[Debug] sirebampo row matched existing but had nothing to patch; skipping')
        }
        skipped++
        continue
      }

      patched++
      if (commit) {
        await client.patch(templo._id).set(patch).commit()
      }

      // Update local cache
      Object.assign(templo, patch)
      continue
    }

    // Create new templo doc (only when we have a reasonable name)
    const newDoc = {
      _type: 'templo',
      temploName: nombre,
      region: { _type: 'reference', _ref: region._id },
      ...(address ? { address } : {}),
      ...(googleMapsUrl && googleMapsUrl.toLowerCase() !== 'falta' ? { googleMapsUrl } : {}),
      ...(horarios ? { description: horarios } : {}),
    }

    created++
    if (process.env.DEBUG_IMPORT === '1' && normalizeText(nombre).includes('sirebampo')) {
      console.log('[Debug] sirebampo row would CREATE new templo')
    }
    if (commit) {
      const createdDoc = await client.create(newDoc as any)
      templos.push({
        _id: createdDoc._id,
        temploName: nombre,
        address: address || undefined,
        googleMapsUrl: googleMapsUrl || undefined,
        description: horarios || undefined,
        region: { _id: region._id, name: region.name, slug: region.slug },
      })
    } else {
      // Dry-run: fake id for subsequent matching
      templos.push({
        _id: `dryrun-templo-${normalizeText(nombre)}`,
        temploName: nombre,
        address: address || undefined,
        googleMapsUrl: googleMapsUrl || undefined,
        description: horarios || undefined,
        region: { _id: region._id, name: region.name, slug: region.slug },
      })
    }
  }

  console.log(`\n[Templos] created=${created} patched=${patched} skipped=${skipped} (commit=${commit})`)
  return templos
}

async function upsertCoros(
  client: ReturnType<typeof createClient>,
  region: RegionDoc,
  templos: TemploDoc[],
  rows: CsvRow[],
  commit: boolean,
) {
  const existing: CoroDoc[] = await client.fetch(
    `*[_type == 'coro' && region._ref == $regionId && !defined(deletedAt)]{
      _id,
      coroName,
      presidentName,
      presidentPhone,
      templo->{_id, temploName}
    }`,
    { regionId: region._id },
  )

  let created = 0
  let patched = 0
  let skipped = 0
  const unresolved: Array<{ coro: string; templo: string }> = []

  for (const row of rows) {
    const coroName = row['Nombre_Coro']?.trim()
    const presidentName = row['Presidente_Nombre']?.trim()
    const presidentPhone = normalizePhone(row['Presidente_Telefono'])
    const temploRaw = row['Templo_Asociado']?.trim()

    if (!coroName) continue

    const temploMatch = findBestTemploMatch(temploRaw, templos)
    if (!temploMatch.templo || temploMatch.score < 0.6) {
      unresolved.push({ coro: coroName, templo: temploRaw })
      continue
    }

    const temploId = temploMatch.templo._id

    const existingCoro = existing.find((c) =>
      normalizeText(c.coroName) === normalizeText(coroName) && (c.templo?._id === temploId || !c.templo?._id),
    )

    if (existingCoro) {
      const patch: Record<string, unknown> = {}
      if (!existingCoro.presidentName?.trim() && presidentName) patch.presidentName = presidentName
      if (!existingCoro.presidentPhone?.trim() && presidentPhone) patch.presidentPhone = presidentPhone
      if (!existingCoro.templo?._id) patch.templo = { _type: 'reference', _ref: temploId }

      if (Object.keys(patch).length === 0) {
        skipped++
        continue
      }

      patched++
      if (commit) {
        await client.patch(existingCoro._id).set(patch).commit()
      }
      continue
    }

    created++
    const newDoc = {
      _type: 'coro',
      coroName,
      presidentName: presidentName || 'Por confirmar',
      ...(presidentPhone ? { presidentPhone } : {}),
      templo: { _type: 'reference', _ref: temploId },
      region: { _type: 'reference', _ref: region._id },
    }

    if (commit) {
      await client.create(newDoc as any)
    }
  }

  console.log(`\n[Coros] created=${created} patched=${patched} skipped=${skipped} unresolvedTemplos=${unresolved.length} (commit=${commit})`)
  if (unresolved.length > 0) {
    console.log('[Coros] Unresolved templo matches (review):')
    for (const item of unresolved.slice(0, 20)) {
      console.log(`  - ${item.coro} → "${item.templo}"`)
    }
    if (unresolved.length > 20) console.log(`  ...and ${unresolved.length - 20} more`) 
  }
}

async function upsertPastores(
  client: ReturnType<typeof createClient>,
  region: RegionDoc,
  templos: TemploDoc[],
  rows: CsvRow[],
  commit: boolean,
) {
  const existing: PastorDoc[] = await client.fetch(
    `*[_type == 'pastor' && region._ref == $regionId && !defined(deletedAt)]{
      _id,
      fullName,
      phone,
      templo->{_id, temploName, region->{_id}},
      region->{_id}
    }`,
    { regionId: region._id },
  )

  let created = 0
  let patched = 0
  let skipped = 0
  const unresolved: Array<{ pastor: string; templo: string; best?: string; score?: number }> = []

  for (const row of rows) {
    const fullNameRaw = row['Nombre_Completo']?.trim()
    const temploRaw = row['Templo']?.trim()
    const phone = normalizePhone(row['Telefono'])

    if (!fullNameRaw || isProbablyHeaderLikeTemploName(fullNameRaw)) continue

    const fullName = toTitleCaseName(fullNameRaw)

    const temploMatch = findBestTemploMatch(temploRaw, templos)
    if (!temploMatch.templo || temploMatch.score < 0.6) {
      unresolved.push({
        pastor: fullName,
        templo: temploRaw,
        best: temploMatch.templo?.temploName,
        score: temploMatch.score,
      })
      continue
    }

    const temploId = temploMatch.templo._id

    const existingPastor = existing.find((p) =>
      normalizeText(p.fullName) === normalizeText(fullName) && (p.templo?._id === temploId || !p.templo?._id),
    )

    if (existingPastor) {
      const patch: Record<string, unknown> = {}
      if (!existingPastor.phone?.trim() && phone) patch.phone = phone
      if (!existingPastor.templo?._id) patch.templo = { _type: 'reference', _ref: temploId }
      if (!existingPastor.region?._id) patch.region = { _type: 'reference', _ref: region._id }

      if (Object.keys(patch).length === 0) {
        skipped++
        continue
      }

      patched++
      if (commit) {
        await client.patch(existingPastor._id).set(patch).commit()
      }
      continue
    }

    created++
    const newDoc = {
      _type: 'pastor',
      fullName,
      templo: { _type: 'reference', _ref: temploId },
      region: { _type: 'reference', _ref: region._id },
      ...(phone ? { phone } : {}),
    }

    if (commit) {
      await client.create(newDoc as any)
    }
  }

  console.log(`\n[Pastores] created=${created} patched=${patched} skipped=${skipped} unresolvedTemplos=${unresolved.length} (commit=${commit})`)
  if (unresolved.length > 0) {
    console.log('[Pastores] Unresolved templo matches (review):')
    for (const item of unresolved.slice(0, 20)) {
      const best = item.best ? ` (best="${item.best}", score=${(item.score ?? 0).toFixed(2)})` : ''
      console.log(`  - ${item.pastor} → "${item.templo}"${best}`)
    }
    if (unresolved.length > 20) console.log(`  ...and ${unresolved.length - 20} more`)
  }
}

async function upsertDirectiva(
  client: ReturnType<typeof createClient>,
  region: RegionDoc,
  templos: TemploDoc[],
  rows: CsvRow[],
  commit: boolean,
) {
  const existing: DirectivaDoc[] = await client.fetch(
    `*[_type == 'directiva' && region._ref == $regionId && !defined(deletedAt)]{
      _id,
      fullName,
      role,
      roleCustom,
      phone,
      templo->{_id, temploName, region->{_id}},
      region->{_id}
    }`,
    { regionId: region._id },
  )

  let created = 0
  let patched = 0
  let skipped = 0
  const unresolved: Array<{ member: string; templo: string }> = []

  for (const row of rows) {
    const fullNameRaw = row['Nombre_Completo']?.trim()
    const cargoRaw = row['Cargo']?.trim()
    const temploRaw = row['Templo_Origen']?.trim()
    const phone = normalizePhone(row['Telefono'])

    if (!fullNameRaw) continue

    const fullName = toTitleCaseName(fullNameRaw)
    const roleInfo = mapDirectivaRole(cargoRaw)

    const temploMatch = findBestTemploMatch(temploRaw, templos)
    if (!temploMatch.templo || temploMatch.score < 0.6) {
      unresolved.push({ member: fullName, templo: temploRaw })
      continue
    }

    const temploId = temploMatch.templo._id

    const existingMember = existing.find((m) =>
      normalizeText(m.fullName) === normalizeText(fullName) && (m.templo?._id === temploId || !m.templo?._id),
    )

    if (existingMember) {
      const patch: Record<string, unknown> = {}
      if (!existingMember.phone?.trim() && phone) patch.phone = phone
      if (!existingMember.role?.trim()) patch.role = roleInfo.role
      if (existingMember.role === 'other' && !existingMember.roleCustom?.trim() && roleInfo.roleCustom) {
        patch.roleCustom = roleInfo.roleCustom
      }
      if (!existingMember.templo?._id) patch.templo = { _type: 'reference', _ref: temploId }
      if (!existingMember.region?._id) patch.region = { _type: 'reference', _ref: region._id }

      if (Object.keys(patch).length === 0) {
        skipped++
        continue
      }

      patched++
      if (commit) {
        await client.patch(existingMember._id).set(patch).commit()
      }
      continue
    }

    created++
    const newDoc = {
      _type: 'directiva',
      fullName,
      role: roleInfo.role,
      ...(roleInfo.role === 'other' && roleInfo.roleCustom ? { roleCustom: roleInfo.roleCustom } : {}),
      templo: { _type: 'reference', _ref: temploId },
      region: { _type: 'reference', _ref: region._id },
      ...(phone ? { phone } : {}),
      order: 0,
    }

    if (commit) {
      await client.create(newDoc as any)
    }
  }

  console.log(`\n[Directiva] created=${created} patched=${patched} skipped=${skipped} unresolvedTemplos=${unresolved.length} (commit=${commit})`)
  if (unresolved.length > 0) {
    console.log('[Directiva] Unresolved templo matches (review):')
    for (const item of unresolved.slice(0, 20)) {
      console.log(`  - ${item.member} → "${item.templo}"`)
    }
    if (unresolved.length > 20) console.log(`  ...and ${unresolved.length - 20} more`)
  }
}

async function upsertEventos(
  client: ReturnType<typeof createClient>,
  region: RegionDoc,
  templos: TemploDoc[],
  rows: CsvRow[],
  commit: boolean,
) {
  const existing: EventDoc[] = await client.fetch(
    `*[_type == 'event' && region._ref == $regionId && !defined(deletedAt)]{
      _id,
      title,
      eventType,
      date,
      endDate,
      time,
      schedule[]{date,time},
      location,
      address,
      googleMapsUrl,
      templo->{_id}
    }`,
    { regionId: region._id },
  )

  let created = 0
  let patched = 0
  let skipped = 0
  const unresolvedTemplos: Array<{ title: string; temploInput: string; score: number }> = []

  for (const row of rows) {
    const tipoRaw = row['Tipo']?.trim()
    const fechaRaw = row['Fecha']?.trim()
    const finalizaRaw = row['FINALIZA']?.trim()
    const horaRaw = row['Hora']?.trim()
    const lugarRaw = row['Lugar']?.trim()
    const direccionRaw = row['Direccion']?.trim()
    const mapsRaw = row['Direccion Google Maps']?.trim()
    const tituloRaw = row['Titulo']?.trim()

    if (!tipoRaw || !fechaRaw) continue

    const eventType = mapCsvTipoToEventType(tipoRaw)

    const startDmy = parseMxDateDmy(fechaRaw)
    if (!startDmy) throw new Error(`Invalid Fecha: ${fechaRaw}`)

    const time24 = parseHoraToTime24(horaRaw) ?? { hour: 12, minute: 0 }
    const timeShort = normalizeHumanTime(horaRaw) ?? 'Por confirmar'

    // Sonora (MST) offset. If you need a different timezone, adjust here.
    const tzOffset = '-07:00'
    const dateIso = buildIsoWithOffset(startDmy, time24, tzOffset)
    const scheduleDate = formatDateInput(startDmy)

    const endDmy = parseMxDateDmy(finalizaRaw)
    const endScheduleDate = endDmy ? formatDateInput(endDmy) : undefined
    const schedule = buildEventSchedule(scheduleDate, endScheduleDate, timeShort)

    const placeGuess = tituloRaw || lugarRaw || ''
    const temploMatch = placeGuess ? findBestTemploMatch(placeGuess, templos) : { templo: null, score: 0 }

    const temploRef = temploMatch.templo && temploMatch.score >= 0.72 ? temploMatch.templo : null
    if (!temploRef && placeGuess) {
      if (temploMatch.templo && temploMatch.score >= 0.5) {
        unresolvedTemplos.push({ title: placeGuess, temploInput: placeGuess, score: temploMatch.score })
      }
    }

    const location = temploRef?.temploName || titleCasePlace(lugarRaw || placeGuess) || 'Por confirmar'

    const addressCandidate =
      direccionRaw && normalizeText(direccionRaw) !== 'falta' ? direccionRaw : undefined

    const address = temploRef?.address || addressCandidate || 'Por confirmar'

    const googleMapsUrl =
      temploRef?.googleMapsUrl ||
      (mapsRaw && normalizeText(mapsRaw) !== 'falta' ? mapsRaw : undefined)

    const title = buildEventTitle(tipoRaw, temploRef ? temploRef.temploName : placeGuess || lugarRaw)

    // Try to find an existing matching event (same day+type+location)
    const existingEvent = existing.find((e) => {
      const sameType = normalizeText(e.eventType) === normalizeText(eventType)
      const sameLocation = normalizeText(e.location) === normalizeText(location)
      const sameStart =
        normalizeText(e.schedule?.[0]?.date ?? '') === normalizeText(scheduleDate) ||
        normalizeText(e.date) === normalizeText(dateIso)
      return sameType && sameLocation && sameStart
    })

    if (existingEvent) {
      const patch: Record<string, unknown> = {}
      if (!existingEvent.title?.trim()) patch.title = title
      if (!existingEvent.schedule || existingEvent.schedule.length === 0) patch.schedule = schedule
      if (!existingEvent.address?.trim() && address) patch.address = address
      if (!existingEvent.googleMapsUrl?.trim() && googleMapsUrl) patch.googleMapsUrl = googleMapsUrl
      if (!existingEvent.location?.trim() && location) patch.location = location
      if (!existingEvent.templo?._id && temploRef) patch.templo = { _type: 'reference', _ref: temploRef._id }

      if (Object.keys(patch).length === 0) {
        skipped++
        continue
      }

      patched++
      if (commit) {
        await client.patch(existingEvent._id).set(patch).commit()
      }
      continue
    }

    created++
    const newDoc = {
      _type: 'event',
      title,
      eventType,
      schedule,
      location,
      address,
      ...(googleMapsUrl ? { googleMapsUrl } : {}),
      ...(temploRef ? { templo: { _type: 'reference', _ref: temploRef._id } } : {}),
      region: { _type: 'reference', _ref: region._id },
      registrationEnabled: true,
    }

    if (commit) {
      await client.create(newDoc as any)
    }
  }

  console.log(`\n[Eventos] created=${created} patched=${patched} skipped=${skipped} uncertainTemploLinks=${unresolvedTemplos.length} (commit=${commit})`)
  if (unresolvedTemplos.length > 0) {
    console.log('[Eventos] Temples with low-confidence matches (FYI):')
    for (const item of unresolvedTemplos.slice(0, 15)) {
      console.log(`  - "${item.temploInput}" (score=${item.score.toFixed(2)})`)
    }
    if (unresolvedTemplos.length > 15) console.log(`  ...and ${unresolvedTemplos.length - 15} more`)
  }
}

async function main() {
  // Allow local, gitignored env files (e.g. .env.local) to provide SANITY_WRITE_TOKEN without
  // requiring the token to be passed on the command line.
  loadEnvFromFiles(['.env.local', '.env'])

  const opts = parseArgs(process.argv.slice(2))
  const client = buildSanityClient(opts.commit)

  console.log(`\nSanity Import (commit=${opts.commit})`) 

  const region = await resolveRegion(client, opts.regionSlug)
  console.log(`Using region: ${region.name} (${region._id})`) 

  let templos: TemploDoc[] = []

  if (opts.templosPath) {
    const temploRows = readCsvFile(opts.templosPath)
    templos = await upsertTemplos(client, region, temploRows, opts.commit)
  } else {
    templos = await client.fetch(
      `*[_type == 'templo' && region._ref == $regionId && !defined(deletedAt)]{_id,temploName,address,googleMapsUrl,description,region->{_id,name,slug}}`,
      { regionId: region._id },
    )
  }

  if (process.env.DEBUG_IMPORT === '1') {
    const sire = templos.filter((t) => normalizeText(t.temploName).includes('sirebampo'))
    const baco = templos.filter((t) => normalizeText(t.temploName).includes('bacobampo'))
    const campos = templos.filter((t) => normalizeText(t.temploName).includes('campo'))
    console.log(`\n[Debug] templos containing "sirebampo": ${sire.map((t) => t.temploName).join(' | ') || '(none)'}`)
    console.log(`[Debug] templos containing "bacobampo": ${baco.map((t) => t.temploName).join(' | ') || '(none)'}`)
    console.log(`[Debug] templos containing "campo": ${campos.map((t) => t.temploName).join(' | ') || '(none)'}`)
  }

  if (opts.corosPath) {
    const rows = readCsvFile(opts.corosPath)
    await upsertCoros(client, region, templos, rows, opts.commit)
  }

  if (opts.pastoresPath) {
    const rows = readCsvFile(opts.pastoresPath)
    await upsertPastores(client, region, templos, rows, opts.commit)
  }

  if (opts.directivaPath) {
    const rows = readCsvFile(opts.directivaPath)
    await upsertDirectiva(client, region, templos, rows, opts.commit)
  }

  if (opts.eventosPath) {
    const rows = readCsvFile(opts.eventosPath)
    await upsertEventos(client, region, templos, rows, opts.commit)
  }

  console.log('\n✅ Done.')
}

main().catch((err) => {
  console.error('\n❌ Import failed:', err?.message || err)
  process.exit(1)
})
