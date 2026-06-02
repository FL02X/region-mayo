/**
 * MIGRACIÓN: limpiar el placeholder "Por confirmar" en eventos
 *
 * Reglas:
 * - Si `pastorMensajeCustom` es "Por confirmar" y el evento tiene templo con pastor,
 *   se reemplaza por el pastor del templo.
 * - Si no hay pastor del templo, se vacía el campo custom para que el frontend
 *   no muestre un enlace sin sentido.
 *
 * USO:
 *   pnpm ts-node scripts/fix-event-pastor-placeholders.ts
 *   pnpm ts-node scripts/fix-event-pastor-placeholders.ts --commit
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createClient } = require('@sanity/client')

const PASTOR_PENDING_LABEL = 'Por confirmar'

function loadEnvFromFiles(filePaths: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs')

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
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }
        if (!process.env[key]) process.env[key] = value
      }
    } catch {
      // ignore local env parsing issues; we'll fail later if the token is missing.
    }
  }
}

loadEnvFromFiles(['.env', '.env.local', '.env.production', '.env.development'])

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  'iqybd074'
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!token) {
  console.error('❌ Missing SANITY_WRITE_TOKEN in env')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
})

type EventRow = {
  _id: string
  title?: string
  pastorMensajeCustom?: string
  pastorMensaje?: {
    _id?: string
    fullName?: string
  }
  templo?: {
    _id?: string
    temploName?: string
    pastores?: Array<{
      _id: string
      fullName?: string
    }>
  }
}

async function main() {
  const commit = process.argv.includes('--commit')
  console.log(
    commit
      ? '🔧 Applying event pastor placeholder cleanup...'
      : '🔎 Dry run: event pastor placeholder cleanup',
  )

  const events = (await client.fetch(
    `*[_type == "event" && defined(pastorMensajeCustom)]{
      _id,
      title,
      pastorMensajeCustom,
      pastorMensaje->{_id, fullName},
      templo->{_id, temploName, "pastores": *[
        _type == "pastor" &&
        templo._ref == ^._id &&
        !defined(deletedAt)
      ]{_id, fullName}}
    }`,
  )) as EventRow[]

  const candidates = events.filter((event: EventRow) => {
    const custom = event.pastorMensajeCustom?.trim()
    return custom === PASTOR_PENDING_LABEL
  })

  console.log(`📋 Found ${candidates.length} event(s) with the placeholder "${PASTOR_PENDING_LABEL}".`)

  let updated = 0
  for (const event of candidates) {
    const temploPastor = event.templo?.pastores?.[0]
    const targetPastorId = temploPastor?._id || event.pastorMensaje?._id
    const patch = client.patch(event._id).unset(['pastorMensajeCustom'])

    if (targetPastorId) {
      patch.set({
        pastorMensaje: {
          _type: 'reference',
          _ref: targetPastorId,
        },
      })
    }

    const label = event.title?.trim() || event._id
    const targetLabel = temploPastor?.fullName || event.pastorMensaje?.fullName || '(sin pastor)'

    console.log(`• ${label} -> ${targetLabel}`)

    if (commit) {
      await patch.commit()
      updated++
    }
  }

  console.log('\n' + '━'.repeat(60))
  console.log(commit ? '✅ CLEANUP COMPLETED' : '✅ DRY RUN COMPLETED')
  console.log('━'.repeat(60))
  console.log(`Eventos encontrados: ${candidates.length}`)
  console.log(`Eventos actualizados: ${commit ? updated : 0}`)
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
