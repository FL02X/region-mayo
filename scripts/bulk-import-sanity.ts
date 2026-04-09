/**
 * SCRIPT DE IMPORTACIÓN A GRANEL - TEMPLOS Y COROS
 * Crea templos primero, luego coros asociados
 * 
 * USO: SANITY_WRITE_TOKEN=xxx pnpm ts-node scripts/bulk-import-sanity.ts
 */

import { createClient } from '@sanity/client'
import * as fs from 'fs'

// Configurar cliente de Sanity CON TOKEN DE ESCRITURA
const projectId = process.env.SANITY_PROJECT_ID || 'iqybd074'
const dataset = process.env.SANITY_DATASET || 'production'

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN, // REQUERIDO para escritura
  useCdn: false,
})

// TIPOS
type TemploInput = {
  temploName: string
  address: string
  googleMapsUrl?: string
  description?: string
  presidenteJovenesName?: string
  presidenteJovenesPhone?: string
}

type CoroInput = {
  coroName: string
  presidentName: string
  presidentPhone?: string
  photoPath?: string
}

type TemploDocument = TemploInput & {
  _type: 'templo'
  region: {
    _type: 'reference'
    _ref: string
  }
}

type CoroDocument = CoroInput & {
  _type: 'coro'
  templo: {
    _type: 'reference'
    _ref: string
  }
}

// DATOS A IMPORTAR
const TEMPLOS_DATA: TemploInput[] = [
  // TEMPLOS CON DIRECCIÓN COMPLETA
  {
    temploName: 'Iglesia Bachantahui',
    address: 'Ejido, Bachantahui, Huatábanpo, Son.',
    googleMapsUrl: 'https://maps.app.goo.gl/CZ8o3hNBASa4qZoPA',
  },
  {
    temploName: 'Iglesia Col. Unión Huatábanpo',
    address: 'C. Sonora entre Manuel Barreras y canal, La Unión, 8599 Huatábanpo, Son.',
    googleMapsUrl: 'https://maps.app.goo.gl/CdxpDjpPYlZaYLh8',
  },
  {
    temploName: '1ra Iglesia en Navojoa',
    address: 'Jito 411, Mocuzarí, 85850 Navojoa, Son.',
    googleMapsUrl: 'https://maps.app.goo.gl/Q7OUV5poETmSrvV89',
    description: 'Ma&Ju = 7:00PM, Dom = 10:00AM',
  },
  {
    temploName: '2da Iglesia Gentil de Cristo Navojoa',
    address: 'Cjon. Sto 1302 Colonia, Nueva Generación, 85890 Navojoa, Son.',
    googleMapsUrl: 'https://maps.app.goo.gl/qxKszuv1Widiftv5',
  },
  {
    temploName: '1ra Iglesia Gentil de Cristo Villa Juárez (Templo: Bethel)',
    address: 'Primero de mayo, Centro, 85290 Villa Juárez, Son.',
    googleMapsUrl: 'https://maps.app.goo.gl/ymIWIChbbmQqLnoX8',
  },
  {
    temploName: '2da Iglesia Gentil de Cristo Villa Juárez (Templo: Jerusalén)',
    address: 'Cuernavaca, Zona Urbana Ejidal Ley Lecheverría, 85290 Villa Juárez, Son.',
    googleMapsUrl: 'https://maps.app.goo.gl/PKqQfbfzaW8WSsw9',
  },
  {
    temploName: 'Iglesia Marte R. Gómez (Templo: Salém)',
    address: 'José G. Aguilera 1105, Marte R. Gómez, 85204 Marte R. Gómez, Son.',
    googleMapsUrl: 'https://maps.app.goo.gl/BqMufnFpwn9Hude',
  },
  {
    temploName: 'Iglesia Gentil de Cristo Buasyaciacobe',
    address: 'Ubicación a confirmar',
    googleMapsUrl: 'https://maps.app.goo.gl/c8GcfStleMXqoEt8',
  },
]

/**
 * NOTA IMPORTANTE: Los coros NO incluyen googleMapsUrl
 * La ubicación se obtiene automáticamente del templo asociado
 * Esto evita duplicación de datos y mantiene una fuente única de verdad
 */
const COROS_DATA: (CoroInput & { temploRef: string })[] = [
  {
    coroName: 'Coro Huestas de Jehová',
    presidentName: 'Pablo Figueroa',
    temploRef: '1ra Iglesia en Navojoa',
  },
  {
    coroName: 'Coro Perfume a sus pies',
    presidentName: 'Joel David Escalante Espinoza',
    temploRef: '2da Iglesia Gentil de Cristo Navojoa',
  },
  {
    coroName: 'Coro Embajadores del Reino',
    presidentName: 'Asenet Ibarra',
    temploRef: 'Iglesia Bachantahui',
  },
  // PENDIENTE: Coro Alfa y Omega → Iglesia en Huirachacha (sin dirección)
  {
    coroName: 'Coro Siloé',
    presidentName: 'Yelzin Valles',
    temploRef: '1ra Iglesia Gentil de Cristo Villa Juárez (Templo: Bethel)',
  },
  {
    coroName: 'Coro Nuevo Amanecer',
    presidentName: 'Yahir Ramos',
    temploRef: '2da Iglesia Gentil de Cristo Villa Juárez (Templo: Jerusalén)',
  },
  {
    coroName: 'Coro Mi alma espera en Jehová',
    presidentName: 'Pedro Leyva',
    temploRef: 'Iglesia Gentil de Cristo Buasyaciacobe',
  },
  {
    coroName: 'Coro Getsemaní',
    presidentName: 'Gerónimo Osorio',
    temploRef: 'Iglesia Marte R. Gómez (Templo: Salém)',
  },
  // PENDIENTE: Coro Ríos de agua viva → Iglesia en Quiriego (sin dirección)
  {
    coroName: 'Coro Lirio de los valles',
    presidentName: 'Maria Magdalena Valenzuela Moroyoqui',
    temploRef: 'Iglesia Col. Unión Huatábanpo',
  },
]

// UTILIDADES
async function getRegionByName(regionName: string) {
  const query = `*[_type == "region" && name == $name][0]`
  const result = await client.fetch(query, { name: regionName })
  return result
}

async function getTemploIdByName(temploName: string): Promise<string | null> {
  const query = `*[_type == "templo" && temploName == $name][0]._id`
  const result = await client.fetch(query, { name: temploName })
  return result || null
}

function validateTemploData(templo: TemploInput): { valid: boolean; error?: string } {
  if (!templo.temploName?.trim()) {
    return { valid: false, error: `Nombre del templo vacío` }
  }
  if (!templo.address?.trim()) {
    return { valid: false, error: `Sin dirección: ${templo.temploName}` }
  }
  return { valid: true }
}

function validateCoroData(coro: CoroInput): { valid: boolean; error?: string } {
  if (!coro.coroName?.trim()) {
    return { valid: false, error: `Nombre del coro vacío` }
  }
  if (!coro.presidentName?.trim()) {
    return { valid: false, error: `Sin presidente: ${coro.coroName}` }
  }
  if (coro.presidentPhone && !/^\d{10}$/.test(coro.presidentPhone)) {
    return { valid: false, error: `Teléfono inválido en ${coro.coroName}: ${coro.presidentPhone}` }
  }
  return { valid: true }
}

// MAIN
async function main() {
  console.log('🚀 Iniciando importación a Sanity...\n')

  // 1. Validar token
  if (!process.env.SANITY_WRITE_TOKEN) {
    console.error('❌ ERROR: Falta SANITY_WRITE_TOKEN')
    console.error('   USO: SANITY_WRITE_TOKEN=xxx pnpm ts-node scripts/bulk-import-sanity.ts')
    process.exit(1)
  }

  // 2. Obtener región "Region Mayó"
  console.log('📍 Buscando región "Region Mayó"...')
  const regionMayo = await getRegionByName('Region Mayó')
  if (!regionMayo) {
    console.error('❌ ABORTO: Región "Region Mayó" no existe en Sanity')
    console.error('   Crea la región primero en Sanity Studio')
    process.exit(1)
  }
  console.log(`✅ Región encontrada: ${regionMayo.name} (ID: ${regionMayo._id})\n`)

  // 3. Validar datos de templos
  console.log('🔍 Validando datos de templos...')
  const temploValidationErrors: string[] = []
  TEMPLOS_DATA.forEach((templo, idx) => {
    const validation = validateTemploData(templo)
    if (!validation.valid) {
      temploValidationErrors.push(`  ${idx + 1}. ${validation.error}`)
    }
  })

  if (temploValidationErrors.length > 0) {
    console.error('❌ ABORTO: Se encontraron errores en datos de templos:')
    temploValidationErrors.forEach(err => console.error(err))
    process.exit(1)
  }
  console.log(`✅ Validación exitosa: ${TEMPLOS_DATA.length} templos listos\n`)

  // 4. Validar datos de coros
  console.log('🔍 Validando datos de coros...')
  const coroValidationErrors: string[] = []
  COROS_DATA.forEach((coro, idx) => {
    const validation = validateCoroData(coro)
    if (!validation.valid) {
      coroValidationErrors.push(`  ${idx + 1}. ${validation.error}`)
    }
  })

  if (coroValidationErrors.length > 0) {
    console.error('❌ ABORTO: Se encontraron errores en datos de coros:')
    coroValidationErrors.forEach(err => console.error(err))
    process.exit(1)
  }
  console.log(`✅ Validación exitosa: ${COROS_DATA.length} coros listos\n`)

  // 5. Crear templos
  console.log('🏗️  Creando templos...')
  const createdTemplos: { [key: string]: string } = {} // nombre -> id

  for (const temploData of TEMPLOS_DATA) {
    try {
      const temploDoc: TemploDocument = {
        ...temploData,
        _type: 'templo',
        region: {
          _type: 'reference',
          _ref: regionMayo._id,
        },
      }

      const created = await client.create(temploDoc)
      createdTemplos[temploData.temploName] = created._id
      console.log(`  ✅ ${temploData.temploName}`)
    } catch (error) {
      console.error(`  ❌ Error creando ${temploData.temploName}:`, error)
      process.exit(1)
    }
  }
  console.log(`✅ ${Object.keys(createdTemplos).length} templos creados\n`)

  // 6. Validar referencias de coros a templos
  console.log('🔗 Validando referencias Coro → Templo...')
  const coroRefsErrors: string[] = []
  COROS_DATA.forEach((coro, idx) => {
    if (!createdTemplos[coro.temploRef]) {
      coroRefsErrors.push(
        `  ${idx + 1}. Coro "${coro.coroName}" intenta referenciar templo no creado: "${coro.temploRef}"`
      )
    }
  })

  if (coroRefsErrors.length > 0) {
    console.error('❌ ABORTO: Errores en referencias:')
    coroRefsErrors.forEach(err => console.error(err))
    console.log('\n📋 Templos creados disponibles:')
    Object.keys(createdTemplos).forEach(name => console.log(`   - ${name}`))
    process.exit(1)
  }
  console.log(`✅ Todas las referencias son válidas\n`)

  // 7. Crear coros
  console.log('🎵 Creando coros...')
  for (const coroData of COROS_DATA) {
    try {
      const temploId = createdTemplos[coroData.temploRef]
      const coroDoc: CoroDocument = {
        coroName: coroData.coroName,
        presidentName: coroData.presidentName,
        presidentPhone: coroData.presidentPhone || undefined,
        _type: 'coro',
        templo: {
          _type: 'reference',
          _ref: temploId,
        },
      } as unknown as CoroDocument

      const created = await client.create(coroDoc)
      console.log(`  ✅ ${coroData.coroName} → ${coroData.temploRef}`)
    } catch (error) {
      console.error(`  ❌ Error creando ${coroData.coroName}:`, error)
      process.exit(1)
    }
  }
  console.log(`✅ ${COROS_DATA.length} coros creados\n`)

  // 8. Resumen final
  console.log('━'.repeat(60))
  console.log('📊 IMPORTACIÓN COMPLETADA CON ÉXITO')
  console.log('━'.repeat(60))
  console.log(`✅ Templos creados: ${Object.keys(createdTemplos).length}`)
  console.log(`✅ Coros creados: ${COROS_DATA.length}`)
  console.log(`✅ Región: Mayo`)
  console.log('━'.repeat(60))
  console.log('\n🎉 Los datos están ahora disponibles en Sanity Studio!')
  console.log('👉 Abre: http://localhost:3000/studio')
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error fatal:', error)
  process.exit(1)
})
