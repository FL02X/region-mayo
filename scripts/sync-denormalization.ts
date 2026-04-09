/**
 * SYNC: Rellenar campos denormalizados (region, temploName, regionName) en coros existentes
 * Basándose en las referencias de templo
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
  console.log('🔄 Sincronizando campos denormalizados en coros...\n')

  // 1. Fetch todos los coros con sus referencias de templo
  console.log('📋 Buscando coros...')
  const coros = await client.fetch(
    `*[_type == "coro"] { _id, coroName, templo->{_id, region->{_id, name}, temploName} }`
  )
  console.log(`  Encontrados: ${coros.length} coros\n`)

  if (coros.length === 0) {
    console.log('  ✅ No hay coros para sincronizar')
    return
  }

  // 2. Para cada coro, actualizar los campos denormalizados
  console.log('✏️  Actualizando coros con datos denormalizados...')
  let updated = 0

  for (const coro of coros) {
    if (!coro.templo) {
      console.log(`  ⚠️  ${coro.coroName} - Sin templo asignado`)
      continue
    }

    const patch = {
      region: coro.templo.region ? { _type: 'reference', _ref: coro.templo.region._id } : null,
      temploName: coro.templo.temploName,
      regionName: coro.templo.region?.name,
    }

    await client.patch(coro._id).set(patch).commit()
    console.log(`  ✅ ${coro.coroName}`)
    updated++
  }

  console.log('\n' + '━'.repeat(60))
  console.log('✅ SINCRONIZACIÓN COMPLETADA')
  console.log('━'.repeat(60))
  console.log(`✅ Coros actualizados: ${updated}/${coros.length}`)
  console.log('\n🎉 Los campos denormalizados están sincronizados!')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
