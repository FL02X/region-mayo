/**
 * CLEANUP: Remover campo googleMapsUrl innecesario de coros
 * 
 * El campo googleMapsUrl no está definido en el schema de coro,
 * por lo que causa "Unknown field found" warning en Sanity Studio.
 * 
 * La ubicación debe venir del templo asociado, no del coro.
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
  console.log('🧹 Limpiando campo googleMapsUrl de coros...\n')

  // 1. Buscar coros que tienen googleMapsUrl definido
  console.log('📋 Buscando coros con googleMapsUrl...')
  const coroIds = await client.fetch(
    `*[_type == "coro" && defined(googleMapsUrl)]._id`
  )
  console.log(`  Encontrados: ${coroIds.length} coros\n`)

  if (coroIds.length === 0) {
    console.log('  ✅ No hay coros con googleMapsUrl para limpiar')
    return
  }

  // 2. Remover el campo googleMapsUrl de cada coro
  console.log('✏️  Removiendo googleMapsUrl de coros...')
  for (const coroId of coroIds) {
    await client.patch(coroId).unset(['googleMapsUrl']).commit()
    const coro = await client.fetch(`*[_id == $id][0].coroName`, { id: coroId })
    console.log(`  ✅ ${coro}`)
  }

  console.log('\n' + '━'.repeat(60))
  console.log('✅ LIMPIEZA COMPLETADA')
  console.log('━'.repeat(60))
  console.log(`✅ Coros limpiados: ${coroIds.length}`)
  console.log('\n💡 Ahora la ubicación se obtiene del templo asociado')
  console.log('🎉 Se eliminó el warning de campo desconocido en Sanity Studio!')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
