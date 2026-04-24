/**
 * EXPORT SANITY DATA TO CSV
 * 
 * Fetches live data from Sanity and generates CSV files for:
 * - Events (with completeness check)
 * - Templos (with required fields audit)
 * - Pastors
 * - Coros
 * - Directiva
 * - Registrations
 * 
 * Output: CSV files in /exports/ folder ready for Excel editing
 * 
 * Usage: npx ts-node scripts/export-sanity-to-csv.ts
 */

import { createClient } from '@sanity/client'
import * as fs from 'fs'
import * as path from 'path'

const projectId = process.env.SANITY_PROJECT_ID || 'iqybd074'
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_READ_TOKEN // Optional - for fetching drafts

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false, // Don't use CDN for export to get latest data
  token, // Use token if available for draft access
})

interface CSVRow {
  [key: string]: string | number | boolean | null
}

const exportDir = path.join(process.cwd(), 'exports')

// Ensure export directory exists
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true })
}

/**
 * Helper: Convert any value to CSV-safe string
 */
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"` // Escape quotes and wrap
  }
  return str
}

/**
 * Helper: Write CSV file
 */
function writeCSV(filename: string, rows: CSVRow[]) {
  if (rows.length === 0) {
    console.log(`  ⚠️ No data for ${filename}`)
    return
  }

  const headers = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row)))
  )
  const csvLines = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) =>
      headers.map((h) => escapeCsvValue(row[h] ?? '')).join(',')
    ),
  ]

  const filepath = path.join(exportDir, filename)
  fs.writeFileSync(filepath, csvLines.join('\n'), 'utf-8')
  console.log(`  ✅ ${filename} (${rows.length} rows)`)
}

/**
 * Completeness check: evaluate how filled a document is
 */
function getCompleteness(
  doc: Record<string, any>,
  requiredFields: string[],
  optionalFields: string[] = []
): { score: number; missing: string[] } {
  const missing = requiredFields.filter(
    (f) => !doc[f] || (typeof doc[f] === 'string' && !doc[f].trim())
  )
  const filled = optionalFields.filter(
    (f) => doc[f] && (typeof doc[f] !== 'string' || doc[f].trim())
  ).length
  const total = requiredFields.length + optionalFields.length
  const score = total > 0 ? Math.round(((total - missing.length + filled) / total) * 100) : 0
  return { score, missing }
}

/**
 * EVENTS EXPORT
 */
async function exportEvents() {
  console.log('\n📤 Exporting Events...')
  const events = await client.fetch(
    `*[_type == 'event' && !defined(deletedAt)] | order(date desc){
      _id,
      title,
      eventType,
      date,
      endDate,
      time,
      location,
      address,
      googleMapsUrl,
      description,
      vestimenta,
      image,
      albumEnabled,
      googleDriveAlbumUrl,
      registrationEnabled,
      alimentosEnabled,
      juntaJuvenilEnabled,
      region->{name}
    }`
  )

  const rows = events.map((event: any) => {
    const required = ['title', 'eventType', 'date', 'time', 'location', 'address']
    const optional = ['googleMapsUrl', 'description', 'image', 'registrationEnabled']
    const { score, missing } = getCompleteness(event, required, optional)

    return {
      ID: event._id,
      Title: event.title,
      Type: event.eventType,
      Date: event.date ? new Date(event.date).toLocaleDateString('es-MX') : '—',
      Time: event.time,
      Location: event.location,
      Address: event.address,
      GoogleMapsUrl: event.googleMapsUrl ? '✓' : '✗',
      Description: event.description ? '✓' : '✗',
      Image: event.image ? '✓' : '✗',
      AlbumEnabled: event.albumEnabled ? '✓' : '—',
      AlbumUrl: event.googleDriveAlbumUrl ? '✓' : '—',
      Registration: event.registrationEnabled ? 'Enabled' : 'Disabled',
      Region: event.region?.name || '—',
      'Missing_Fields': missing.join('; ') || 'Complete ✓',
      'Completeness_%': score,
    }
  })

  writeCSV('01_EVENTS_export.csv', rows)
}

/**
 * TEMPLOS EXPORT
 */
async function exportTemplos() {
  console.log('\n🏛️  Exporting Templos...')
  const templos = await client.fetch(
    `*[_type == 'templo' && !defined(deletedAt)] | order(temploName asc){
      _id,
      temploName,
      churchNumber,
      address,
      googleMapsUrl,
      phone,
      description,
      photo,
      presidenteJovenesName,
      presidenteJovenesPhone,
      "pastoreCount": count(*[_type == 'pastor' && templo._ref == ^._id && !defined(deletedAt)]),
      "corosCount": count(*[_type == 'coro' && templo._ref == ^._id && !defined(deletedAt)]),
      region->{name}
    }`
  )

  const rows = templos.map((templo: any) => {
    const required = ['temploName', 'address']
    const optional = ['churchNumber', 'phone', 'googleMapsUrl', 'description', 'photo']
    const { score, missing } = getCompleteness(templo, required, optional)

    return {
      ID: templo._id,
      TemploName: templo.temploName,
      ChurchNumber: templo.churchNumber || '—',
      Address: templo.address,
      GoogleMapsUrl: templo.googleMapsUrl ? '✓' : '✗',
      Phone: templo.phone || '—',
      Description: templo.description ? '✓' : '✗',
      Photo: templo.photo ? '✓' : '✗',
      PresidenteJovenesName: templo.presidenteJovenesName || '—',
      PresidenteJovenesPhone: templo.presidenteJovenesPhone || '—',
      'Pastores_Count': templo.pastoreCount,
      'Coros_Count': templo.corosCount,
      Region: templo.region?.name || '—',
      'Missing_Fields': missing.join('; ') || 'Complete ✓',
      'Completeness_%': score,
    }
  })

  writeCSV('02_TEMPLOS_export.csv', rows)
}

/**
 * PASTORS EXPORT
 */
async function exportPastors() {
  console.log('\n👨‍✝️  Exporting Pastors...')
  const pastors = await client.fetch(
    `*[_type == 'pastor' && !defined(deletedAt)] | order(fullName asc){
      _id,
      fullName,
      phone,
      photo,
      templo->{temploName},
      region->{name}
    }`
  )

  const rows = pastors.map((pastor: any) => {
    const required = ['fullName']
    const optional = ['phone', 'photo']
    const { score, missing } = getCompleteness(pastor, required, optional)

    return {
      ID: pastor._id,
      FullName: pastor.fullName,
      Phone: pastor.phone || '—',
      Photo: pastor.photo ? '✓' : '✗',
      TemploName: pastor.templo?.temploName || '—',
      Region: pastor.region?.name || '—',
      'Missing_Fields': missing.join('; ') || 'Complete ✓',
      'Completeness_%': score,
    }
  })

  writeCSV('03_PASTORS_export.csv', rows)
}

/**
 * COROS EXPORT
 */
async function exportCoros() {
  console.log('\n🎵 Exporting Coros...')
  const coros = await client.fetch(
    `*[_type == 'coro' && !defined(deletedAt)] | order(coroName asc){
      _id,
      coroName,
      presidentName,
      presidentPhone,
      photo,
      templo->{temploName},
      region->{name}
    }`
  )

  const rows = coros.map((coro: any) => {
    const required = ['coroName', 'presidentName', 'presidentPhone']
    const optional = ['photo']
    const { score, missing } = getCompleteness(coro, required, optional)

    return {
      ID: coro._id,
      CoroName: coro.coroName,
      PresidentName: coro.presidentName,
      PresidentPhone: coro.presidentPhone,
      Photo: coro.photo ? '✓' : '✗',
      TemploName: coro.templo?.temploName || '—',
      Region: coro.region?.name || '—',
      'Missing_Fields': missing.join('; ') || 'Complete ✓',
      'Completeness_%': score,
    }
  })

  writeCSV('04_COROS_export.csv', rows)
}

/**
 * DIRECTIVA EXPORT
 */
async function exportDirectiva() {
  console.log('\n👥 Exporting Directiva...')
  const directiva = await client.fetch(
    `*[_type == 'directiva' && !defined(deletedAt)] | order(order asc, fullName asc){
      _id,
      fullName,
      role,
      roleCustom,
      phone,
      photo,
      templo->{temploName},
      region->{name}
    }`
  )

  const rows = directiva.map((member: any) => {
    const required = ['fullName', 'role', 'phone']
    const optional = ['photo']
    const { score, missing } = getCompleteness(member, required, optional)

    return {
      ID: member._id,
      FullName: member.fullName,
      Role: member.roleCustom || member.role || '—',
      Phone: member.phone,
      Photo: member.photo ? '✓' : '✗',
      TemploName: member.templo?.temploName || '—',
      Region: member.region?.name || '—',
      'Missing_Fields': missing.join('; ') || 'Complete ✓',
      'Completeness_%': score,
    }
  })

  writeCSV('05_DIRECTIVA_export.csv', rows)
}

/**
 * REGISTRATIONS EXPORT
 */
async function exportRegistrations() {
  console.log('\n📝 Exporting Registrations...')
  const registrations = await client.fetch(
    `*[_type == 'registration'] | order(registeredAt desc) | [0...1000]{
      _id,
      name,
      phone,
      event->{title},
      attendingAs,
      needsLodging,
      needsTransport,
      isBaptized,
      isCoroMGR,
      registeredAt
    }`
  )

  const rows = registrations.map((reg: any) => {
    return {
      ID: reg._id,
      Name: reg.name,
      Phone: reg.phone,
      EventTitle: reg.event?.title || '—',
      AttendingAs: reg.attendingAs || '—',
      NeedsLodging: reg.needsLodging ? 'Yes' : 'No',
      NeedsTransport: reg.needsTransport ? 'Yes' : 'No',
      IsBaptized: reg.isBaptized ? 'Yes' : 'No',
      IsCoroMGR: reg.isCoroMGR ? 'Yes' : 'No',
      RegisteredAt: reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString('es-MX') : '—',
    }
  })

  writeCSV('06_REGISTRATIONS_export.csv', rows)
}

/**
 * COMPLETENESS SUMMARY
 */
async function generateSummary() {
  console.log('\n📊 Generating Summary...')

  const counts = await client.fetch(`{
    "events": count(*[_type == 'event' && !defined(deletedAt)]),
    "templos": count(*[_type == 'templo' && !defined(deletedAt)]),
    "pastors": count(*[_type == 'pastor' && !defined(deletedAt)]),
    "coros": count(*[_type == 'coro' && !defined(deletedAt)]),
    "directiva": count(*[_type == 'directiva' && !defined(deletedAt)]),
    "registrations": count(*[_type == 'registration']),
  }`)

  const summary = `
================================================================================
                        SANITY DATA EXPORT SUMMARY
                         Generated: ${new Date().toLocaleString('es-MX')}
================================================================================

📊 DATA COUNTS:
  • Events:         ${counts.events}
  • Templos:        ${counts.templos}
  • Pastors:        ${counts.pastors}
  • Coros:          ${counts.coros}
  • Directiva:      ${counts.directiva}
  • Registrations:  ${counts.registrations}

📁 CSV FILES GENERATED:
  1. 01_EVENTS_export.csv          - All events (status: required fields, Google Maps URL, etc)
  2. 02_TEMPLOS_export.csv         - All temples (status: address, phone, contact info)
  3. 03_PASTORS_export.csv         - All pastors (status: contact phone, temple assignment)
  4. 04_COROS_export.csv           - All choirs (status: president, phone, temple)
  5. 05_DIRECTIVA_export.csv       - All leadership (status: role, phone, temple)
  6. 06_REGISTRATIONS_export.csv   - All registrations (limited to last 1000, read-only)

✅ NEXT STEPS:
  1. Open the CSV files in Excel
  2. Review "Completeness_%" and "Missing_Fields" columns
  3. Add missing data in the CSV (you can add new rows)
  4. IMPORTANT: Do NOT modify the ID column (it links to Sanity docs)
  5. Save as CSV and send to the developer for import

📝 HOW TO USE:
  - Green (✓) = field is filled
  - Red (✗) = field is missing/empty
  - Percentage = data completeness score
  - "Missing_Fields" = list of required fields that are empty

⚠️  CAUTION:
  - Do NOT change the ID column
  - Do NOT reorder rows (they must match Sanity doc IDs)
  - If adding NEW documents, leave the ID column blank
  - For phone numbers, use format: 10 digits, no spaces/symbols (e.g., 6441234567)

================================================================================
`

  console.log(summary)

  fs.writeFileSync(
    path.join(exportDir, '_00_README_EXPORT.txt'),
    summary,
    'utf-8'
  )
}

/**
 * MAIN EXECUTION
 */
async function main() {
  console.log('\n🚀 Starting Sanity Data Export...\n')

  try {
    await exportEvents()
    await exportTemplos()
    await exportPastors()
    await exportCoros()
    await exportDirectiva()
    await exportRegistrations()
    await generateSummary()

    console.log(`\n✅ Export complete! Files saved to: ${exportDir}\n`)
  } catch (error) {
    console.error('\n❌ Export failed:', error)
    process.exit(1)
  }
}

main()
