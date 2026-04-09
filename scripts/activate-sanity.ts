/**
 * FIX: Activar todos los templos y coros recientemente creados
 */
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'iqybd074',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

async function main() {
  console.log('🔧 Activando templos y coros...\n')

  // 1. Obtener todos los templos sin active definido
  console.log('📋 Buscando templos inactivos...')
  const inactiveTemplos = await client.fetch(
    `*[_type == "templo" && active != true && !defined(deletedAt)]._id`
  )
  console.log(`  Encontrados: ${inactiveTemplos.length} templos\n`)

  // 2. Activar templos
  if (inactiveTemplos.length > 0) {
    console.log('✏️  Activando templos...')
    for (const temploId of inactiveTemplos) {
      await client.patch(temploId).set({ active: true }).commit()
      const templo = await client.fetch(`*[_id == $id][0].temploName`, { id: temploId })
      console.log(`  ✅ ${templo}`)
    }
  }

  // 3. Obtener todos los coros sin active definido
  console.log('\n📋 Buscando coros inactivos...')
  const inactiveCoros = await client.fetch(
    `*[_type == "coro" && active != true && !defined(deletedAt)]._id`
  )
  console.log(`  Encontrados: ${inactiveCoros.length} coros\n`)

  // 4. Activar coros
  if (inactiveCoros.length > 0) {
    console.log('✏️  Activando coros...')
    for (const coroId of inactiveCoros) {
      await client.patch(coroId).set({ active: true }).commit()
      const coro = await client.fetch(`*[_id == $id][0].coroName`, { id: coroId })
      console.log(`  ✅ ${coro}`)
    }
  }

  console.log('\n' + '━'.repeat(60))
  console.log('✅ ACTIVACIÓN COMPLETADA')
  console.log('━'.repeat(60))
  console.log(`✅ Templos activados: ${inactiveTemplos.length}`)
  console.log(`✅ Coros activados: ${inactiveCoros.length}`)
  console.log('\n🚀 Ahora actualiza el navegador para ver los cambios!')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
