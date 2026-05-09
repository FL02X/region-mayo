// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createClient } = require('@sanity/client')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')

function loadEnvFromFiles(filePaths) {
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
        if (!process.env[key]) process.env[key] = value
      }
    } catch {
      // ignore
    }
  }
}

loadEnvFromFiles(['.env', '.env.local', '.env.production', '.env.development'])

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID || 'iqybd074'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!token) {
  console.error('Missing SANITY_WRITE_TOKEN in env')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2025-01-01', token, useCdn: false })

function parseHHMM(time) {
  if (!time) return null
  const m = String(time).trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = parseInt(m[1], 10)
  const mm = parseInt(m[2], 10)
  return { h, mm }
}

function addMinutesToHHMM(time, minutesToAdd) {
  const parsed = parseHHMM(time)
  if (!parsed) return null
  let total = parsed.h * 60 + parsed.mm + minutesToAdd
  total = ((total % (24 * 60)) + (24 * 60)) % (24 * 60)
  const h = Math.floor(total / 60)
  const mm = total % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function removeScheduleLinesFromDescription(text) {
  if (!text) return text
  const lines = String(text).split(/\r?\n/)
  const keep = []
  const dayTokens = ['lunes','martes','miercoles','miércoles','jueves','viernes','sabado','sábado','domingo','dom']
  for (const line of lines) {
    const low = line.toLowerCase()
    // If line starts with a weekday token or contains patterns like "Martes =" or "Domingo:" or "Dom ="
    const startsWithDay = dayTokens.some(dt => low.trim().startsWith(dt))
    const containsAssignment = /\b(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|dom)\b\s*[:=]/i.test(line)
    const containsTimeRange = /\d{1,2}:?\d{0,2}\s*(am|pm)?/i.test(line) && (low.includes('am') || low.includes('pm') || /\d{1,2}:\d{2}/.test(line))

    if (startsWithDay || containsAssignment || (containsTimeRange && dayTokens.some(dt => low.includes(dt)))) {
      // consider schedule line -> remove
      continue
    }
    keep.push(line)
  }
  const result = keep.join('\n').trim()
  return result.length === 0 ? null : result
}

async function main() {
  const commit = process.argv.includes('--commit')
  console.log('Normalize temple schedules - dry run by default')
  const templos = await client.fetch(`*[_type == "templo" && !defined(deletedAt)]{_id, temploName, schedule, description}`)
  console.log(`Found ${templos.length} templos`)

  let updated = 0
  for (const t of templos) {
    const patches = {}

    if (t.schedule && Array.isArray(t.schedule.services)) {
      const services = t.schedule.services.map(s => ({...s}))
      let changed = false
      for (const s of services) {
        if (!s.startTime) continue
        if (!s.endTime) {
          if (s.day === 'tuesday') {
            const added = addMinutesToHHMM(s.startTime, 120)
            if (added) { s.endTime = added; changed = true }
          } else if (s.day === 'sunday') {
            const added = addMinutesToHHMM(s.startTime, 180)
            if (added) { s.endTime = added; changed = true }
          }
        }
      }
      if (changed) {
        patches.schedule = { ...t.schedule, services }
      }
    }

    // Clean description schedule-like lines
    const cleaned = removeScheduleLinesFromDescription(t.description)
    if (cleaned !== (t.description || null)) {
      patches.description = cleaned
    }

    if (Object.keys(patches).length > 0) {
      console.log(`Will update: ${t.temploName} ->`, patches)
      if (commit) {
        await client.patch(t._id).set(patches).commit()
        console.log(`Committed: ${t.temploName}`)
      }
      updated++
    }
  }

  console.log('Done. Updated count:', updated)
  if (!commit) console.log('Run with --commit to apply changes')
}

main().catch(err => { console.error(err); process.exit(1) })
