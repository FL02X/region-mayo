/**
 * CLEANUP: Remover field 'active' de todos los documentos
 * Ya que no exists en los schemas, causa warnings en Sanity Studio
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
  console.log('🧹 Limpiando campos "active" innecesarios...\n')

  // 1. Remover active de templos
  console.log('📋 Buscando templos con campo "active"...')
  const temploIds = await client.fetch(
    `*[_type == "templo" && defined(active)]._id`
  )
  console.log(`  Encontrados: ${temploIds.length} templos\n`)

  if (temploIds.length > 0) {
    console.log('✏️  Limpiando templos...')
    for (const temploId of temploIds) {
      await client.patch(temploId).unset(['active']).commit()
      const templo = await client.fetch(`*[_id == $id][0].temploName`, { id: temploId })
      console.log(`  ✅ ${templo}`)
    }
  }

  // 2. Remover active de coros
  console.log('\n📋 Buscando coros con campo "active"...')
  const coroIds = await client.fetch(
    `*[_type == "coro" && defined(active)]._id`
  )
  console.log(`  Encontrados: ${coroIds.length} coros\n`)

  if (coroIds.length > 0) {
    console.log('✏️  Limpiando coros...')
    for (const coroId of coroIds) {
      await client.patch(coroId).unset(['active']).commit()
      const coro = await client.fetch(`*[_id == $id][0].coroName`, { id: coroId })
      console.log(`  ✅ ${coro}`)
    }
  }

  console.log('\n' + '━'.repeat(60))
  console.log('✅ LIMPIEZA COMPLETADA')
  console.log('━'.repeat(60))
  console.log(`✅ Campos "active" removidos de templos: ${temploIds.length}`)
  console.log(`✅ Campos "active" removidos de coros: ${coroIds.length}`)
  console.log('\n🎉 Ya no hay warnings en Sanity Studio!')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
