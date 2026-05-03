/**
 * EXPORT SANITY DATA TO CSV (CommonJS)
 * 
 * Fetches live data from Sanity and generates CSV files for:
 * - Events, Templos, Pastors, Coros, Directiva, Registrations
 * 
 * Usage: node scripts/export-sanity-to-csv.js
 */

const { createClient } = require('@sanity/client')
const fs = require('fs')
const path = require('path')

const projectId = process.env.SANITY_PROJECT_ID || 'iqybd074'
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_READ_TOKEN

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

const exportDir = path.join(process.cwd(), 'exports')

if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true })
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function writeCSV(filename, rows) {
  if (rows.length === 0) {
    console.log(`  ⚠️ No data for ${filename}`)
    return
  }

  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  const csvLines = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => headers.map((h) => escapeCsvValue(row[h] ?? '')).join(',')),
  ]

  const filepath = path.join(exportDir, filename)
  fs.writeFileSync(filepath, csvLines.join('\n'), 'utf-8')
  console.log(`  ✅ ${filename} (${rows.length} rows)`)
}

function getCompleteness(doc, requiredFields, optionalFields = []) {
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

  const rows = events.map((event) => {
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
      photos,
      presidenteJovenesName,
      presidenteJovenesPhone,
      "pastoreCount": count(*[_type == 'pastor' && templo._ref == ^._id && !defined(deletedAt)]),
      "corosCount": count(*[_type == 'coro' && templo._ref == ^._id && !defined(deletedAt)]),
      region->{name}
    }`
  )

  const rows = templos.map((templo) => {
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
      Photos: templo.photos && templo.photos.length > 0 ? `${templo.photos.length}/6` : '✗',
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

  const rows = pastors.map((pastor) => {
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

  const rows = coros.map((coro) => {
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

  const rows = directiva.map((member) => {
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

async function exportRegistrations() {
  console.log('\n📝 Exporting Registrations...')
  const registrations = await client.fetch(
    `*[_type == 'registration'] | order(registeredAt desc)[0...1000]{
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

  const rows = registrations.map((reg) => {
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

📁 CSV FILES GENERATED (in /exports/ folder):
  1. 01_EVENTS_export.csv          - All events with status
  2. 02_TEMPLOS_export.csv         - All temples with contact info needed
  3. 03_PASTORS_export.csv         - All pastors
  4. 04_COROS_export.csv           - All choirs
  5. 05_DIRECTIVA_export.csv       - All leadership
  6. 06_REGISTRATIONS_export.csv   - All registrations (last 1000, read-only)

✅ NEXT STEPS FOR NON-TECHNICAL USERS:
  1. Open the CSV files in Excel
  2. Look at the "Completeness_%" column (100% = complete, <100% = missing data)
  3. Look at "Missing_Fields" column to see what's needed
  4. Add missing data by editing the cells (do NOT add new rows to existing data)
  5. Save the CSV files
  6. Send back to developer for import

✅ KEY COLUMNS IN EACH FILE:
  • ID                = Document ID (NEVER CHANGE THIS)
  • Completeness_%    = % of fields filled (0-100)
  • Missing_Fields    = List of required fields that are empty
  • ✓                 = Field is filled
  • ✗                 = Field is empty (needs attention)
  • —                 = Optional field

⚠️  IMPORTANT RULES:
  ✓ DO: Edit existing cells to add missing data
  ✓ DO: Save files as CSV (not Excel format)
  ✗ DO NOT: Change the ID column (it links to Sanity)
  ✗ DO NOT: Add or delete rows (except new data in blank rows at bottom)
  ✗ DO NOT: Change column names/headers

================================================================================
`

  console.log(summary)
  fs.writeFileSync(path.join(exportDir, '_00_README_EXPORT.txt'), summary, 'utf-8')
}

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
    console.log(`\n✅ Export complete! Files ready in: ${exportDir}\n`)
  } catch (error) {
    console.error('\n❌ Export failed:', error.message)
    process.exit(1)
  }
}

main()
