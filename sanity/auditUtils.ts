/**
 * AUDIT UTILITIES - Funciones auxiliares para llenar audit en API calls
 * 
 * Use estas funciones cuando hagas mutations a Sanity desde tu backend
 * (Next.js API routes, scripts, etc.)
 * 
 * IMPORTANCIA: Los hooks en sanity.config.ts SOLO funcionan en Sanity Studio
 * Si modificas documentos desde API, debes llenar audit manualmente
 */

export interface AuditData {
  createdBy: string
  createdAt: string
  modifiedBy: string
  modifiedAt: string
}

/**
 * Crear un objeto audit para documento nuevo
 * 
 * @param userId - ID del usuario actual o "system"
 * @returns Objeto audit completo
 * 
 * @example
 * const newAudit = createAudit('user123')
 * // {
 * //   createdBy: 'user123',
 * //   createdAt: '2026-04-07T...',
 * //   modifiedBy: 'user123',
 * //   modifiedAt: '2026-04-07T...'
 * // }
 */
export function createAudit(userId: string = 'system'): AuditData {
  const now = new Date().toISOString()
  return {
    createdBy: userId,
    createdAt: now,
    modifiedBy: userId,
    modifiedAt: now,
  }
}

/**
 * Actualizar un objeto audit existente
 * Preserva createdBy y createdAt, actualiza modifiedBy y modifiedAt
 * 
 * @param existingAudit - El audit actual del documento
 * @param userId - ID del usuario que está haciendo el cambio
 * @returns Objeto audit actualizado
 * 
 * @example
 * const updatedAudit = updateAudit(document.audit, 'user456')
 * // {
 * //   createdBy: 'user123', // NO CAMBIA
 * //   createdAt: '2026-04-07T10:00:00Z', // NO CAMBIA
 * //   modifiedBy: 'user456', // ACTUALIZADO
 * //   modifiedAt: '2026-04-07T10:05:00Z' // ACTUALIZADO
 * // }
 */
export function updateAudit(
  existingAudit: Partial<AuditData> | undefined,
  userId: string = 'system'
): AuditData {
  const now = new Date().toISOString()
  return {
    createdBy: existingAudit?.createdBy || userId,
    createdAt: existingAudit?.createdAt || now,
    modifiedBy: userId,
    modifiedAt: now,
  }
}

/**
 * Preparar documento para mutation (CREATE)
 * 
 * @param documentData - Datos del documento (sin _id, _type)
 * @param documentType - Tipo del documento (ej: 'pastor')
 * @param userId - ID del usuario
 * @returns Documento listo para guardar
 * 
 * @example
 * const docToCreate = prepareForCreate({
 *   fullName: 'Pastor Test',
 *   templo: { _ref: 'templo123' }
 * }, 'pastor', 'user123')
 */
export function prepareForCreate(
  documentData: Record<string, any>,
  documentType: string,
  userId: string = 'system'
): Record<string, any> {
  return {
    _type: documentType,
    ...documentData,
    audit: createAudit(userId),
  }
}

/**
 * Preparar documento para mutation (UPDATE/PATCH)
 * 
 * @param documentId - ID del documento
 * @param updateData - Solo los campos a actualizar
 * @param existingAudit - El audit actual del documento
 * @param userId - ID del usuario
 * @returns Objeto para usar en client.mutate()
 * 
 * @example
 * const updateMutation = prepareForUpdate(
 *   'docId123',
 *   { phone: '1234567890' },
 *   existingAudit,
 *   'user456'
 * )
 * // {
 * //   patch: {
 * //     id: 'docId123',
 * //     set: {
 * //       phone: '1234567890',
 * //       audit: { ...updatedAudit }
 * //     }
 * //   }
 * // }
 */
export function prepareForUpdate(
  documentId: string,
  updateData: Record<string, any>,
  existingAudit: Partial<AuditData> | undefined,
  userId: string = 'system'
): { patch: any } {
  return {
    patch: {
      id: documentId,
      set: {
        ...updateData,
        audit: updateAudit(existingAudit, userId),
      },
    },
  }
}

/**
 * Obtener el usuario actual desde Sanity client context
 * (si lo tienes disponible)
 * 
 * @example
 * En Next.js API route:
 * 
 * export default async function handler(req, res) {
 *   const userId = req.headers['x-sanity-user-id'] || 'system'
 *   // usar userId en mutations
 * }
 */

// ============================================================================
// EJEMPLOS DE USO - Registration (Formulario Web)
// ============================================================================

/**
 * CASO: Usuario se registra en evento desde web
 * 
 * 1. Frontend envía POST /api/register con datos
 * 2. Backend crea documento Registration con audit
 */

export async function createRegistrationFromForm(
  client: any,
  formData: {
    name: string
    phone: string
    region: string
    eventId: string
    // ...otros campos
  },
  userId: string = 'system'
) {
  const registrationDoc = prepareForCreate(
    {
      name: formData.name,
      phone: formData.phone,
      region: formData.region,
      event: { _ref: formData.eventId },
      registeredAt: new Date().toISOString(),
      // ... rest de campos
    },
    'registration',
    userId
  )

  const result = await client.create(registrationDoc)
  return result
}

// ============================================================================
// EJEMPLOS DE USO - Batch Updates (Scripts)
// ============================================================================

/**
 * CASO: Script que importa datos masivamente
 * 
 * Actualizar múltiples documentos manteniendo auditoría
 */

export async function batchUpdatePastores(
  client: any,
  updates: Array<{
    id: string
    changes: Record<string, any>
    currentAudit: Partial<AuditData>
  }>,
  userId: string = 'system'
) {
  const mutations = updates.map((update) =>
    prepareForUpdate(update.id, update.changes, update.currentAudit, userId)
  )

  const result = await client.mutate(mutations)
  return result
}

// ============================================================================
// INTEGRACIÓN CON NEXT.JS API ROUTES
// ============================================================================

/**
 * EJEMPLO COMPLETO: API route que crea pastor y llena audit
 * 
 * Archivo: app/api/admin/pastor/create/route.ts
 */

export const EXAMPLE_API_ROUTE = `
import { sanityClient } from '@/lib/sanity/client'
import { createAudit } from '@/sanity/auditUtils'

export async function POST(request: Request) {
  try {
    const { fullName, temploId, phone, userId } = await request.json()

    // Preparar documento con audit
    const newPastor = {
      _type: 'pastor',
      fullName,
      templo: { _ref: temploId },
      phone,
      audit: createAudit(userId || 'system'),
    }

    // Guardar
    const result = await sanityClient.create(newPastor)

    return Response.json({ success: true, data: result })
  } catch (error) {
    console.error('Error creando pastor:', error)
    return Response.json({ error: 'Error' }, { status: 500 })
  }
}
`

// ============================================================================
// INTEGRACIÓN CON SANITY CLIENT
// ============================================================================

/**
 * EJEMPLO: Función auxiliar para usar en lib/sanity/client.ts
 */

export const EXAMPLE_CLIENT_WRAPPER = `
import { SanityClient } from 'sanity'
import { updateAudit } from '@/sanity/auditUtils'

export async function updateDocumentWithAudit(
  client: SanityClient,
  documentId: string,
  updates: Record<string, any>,
  userId: string = 'system'
) {
  // 1. Obtener documento actual
  const doc = await client.fetch('*[_id == $id][0]', { id: documentId })
  
  // 2. Preparar audit actualizado
  const updatedAudit = updateAudit(doc.audit, userId)
  
  // 3. Hacer el cambio
  return client.patch(documentId).set({
    ...updates,
    audit: updatedAudit,
  }).commit()
}
`

// ============================================================================
// TESTING - Verificar audit en API
// ============================================================================

/**
 * PASO 1: Crear documento via API
 * 
 * curl -X POST http://localhost:3000/api/admin/pastor/create \\
 *   -H "Content-Type: application/json" \\
 *   -d '{
 *     "fullName": "Pastor Test API",
 *     "temploId": "templo123",
 *     "userId": "user456"
 *   }'
 * 
 * ESPERADO: Respuesta incluye el documento creado con audit
 * 
 * PASO 2: Verificar en Sanity Studio Vision
 * 
 * *[_type == 'pastor' && fullName == 'Pastor Test API'][0] { audit }
 * 
 * DEBERÍAS VER:
 * {
 *   "audit": {
 *     "createdBy": "user456",
 *     "createdAt": "2026-04-07T...",
 *     "modifiedBy": "user456",
 *     "modifiedAt": "2026-04-07T..."
 *   }
 * }
 */

export const TESTING_API_AUDIT = {
  step1: 'Crear documento via POST /api/admin/[type]/create',
  step2: 'Verificar respuesta tiene audit',
  step3: 'Verificar en Vision Tool que audit aparece en documento',
  step4: 'Actualizar documento via PATCH',
  step5: 'Verificar modifiedBy y modifiedAt se actualizaron',
}
