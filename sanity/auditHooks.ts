/**
 * AUDIT HOOKS - Auto-llenado de Campos de Auditoría
 * 
 * Estos hooks se ejecutan automáticamente cuando se crea o modifica
 * un documento, poblando los campos audit.
 * 
 * INSTALACIÓN: Ver sanity.config.ts
 * 
 * CÓMO FUNCIONA:
 * 1. beforeCreate: Llena createdBy, createdAt cuando se crea documento
 * 2. beforeCommit: Llena modifiedBy, modifiedAt cuando se cambia documento
 * 
 * El usuario actual se obtiene de context.currentUser en Sanity
 */

import { DocumentBeforeCreateHandler, DocumentBeforeCommitHandler } from 'sanity'

/**
 * Hook ejecutado ANTES de crear un documento
 * Llena: createdBy, createdAt
 */
export const auditBeforeCreate: DocumentBeforeCreateHandler = (
  documentBeforeCreate,
  context
) => {
  const { currentUser } = context

  // Obtener el UID del usuario actual
  const userId = currentUser?.id || 'system'

  // Crear documento con campos audit iniciales
  return {
    ...documentBeforeCreate,
    audit: {
      createdBy: userId,
      createdAt: new Date().toISOString(),
      modifiedBy: userId,
      modifiedAt: new Date().toISOString(),
    },
  }
}

/**
 * Hook ejecutado ANTES de guardar cambios a un documento
 * Actualiza: modifiedBy, modifiedAt
 * Preserva: createdBy, createdAt
 * 
 * @param documentBeforeCommit - Documento antes de guardarse
 * @param context - Contexto de Sanity con currentUser
 * @returns Documento actualizado con modifiedBy/modifiedAt
 */
export const auditBeforeCommit: DocumentBeforeCommitHandler = (
  documentBeforeCommit,
  context
) => {
  const { currentUser } = context

  // Compatibilidad: si el documento aún trae el campo legacy _audit, reutilizarlo.
  const legacyAudit = (documentBeforeCommit as Record<string, any>)._audit
  const audit = documentBeforeCommit.audit || legacyAudit || {}

  const userId = currentUser?.id || 'system'

  return {
    ...documentBeforeCommit,
    audit: {
      // Preservar valores de creación
      createdBy: audit.createdBy || userId,
      createdAt: audit.createdAt || new Date().toISOString(),
      // Actualizar modificación
      modifiedBy: userId,
      modifiedAt: new Date().toISOString(),
    },
  }
}

/**
 * TIPOS DE DOCUMENTOS A LOS QUE APLICA:
 * 
 * Los hooks se aplican a documentos específicos en sanity.config.ts:
 * - region
 * - templo
 * - pastor
 * - coro
 * - directiva
 * - event
 * - registration
 * 
 * (NO se aplica a: siteSettings, que son configuraciones globales)
 */

/**
 * DEBUGGING - Cómo verificar que los hooks funcionan:
 * 
 * 1. Crear un nuevo documento desde Sanity Studio
 * 2. Abrirlo con Vision Tool (icono de ojo)
 * 3. Ejecutar query:
 *    *[_type == 'pastor'][0] { audit }
 * 4. Deberías ver:
 *    {
 *      "audit": {
 *        "createdBy": "userId123",
 *        "createdAt": "2026-04-07T10:30:00Z",
 *        "modifiedBy": "userId123",
 *        "modifiedAt": "2026-04-07T10:30:00Z"
 *      }
 *    }
 * 
 * 5. Editar el documento y guardar de nuevo
 * 6. La query debería mostrar:
 *    - createdBy: IGUAL (no cambia)
 *    - createdAt: IGUAL (no cambia)
 *    - modifiedBy: POSIBLEMENTE DIFERENTE (si otro usuario editó)
 *    - modifiedAt: ACTUALIZADO (timestamp nuevo)
 */

/**
 * CASOS DE USO - Queries con auditoría
 * 
 * // 1. Quién creó este documento?
 * *[_id == 'documento-id'] { audit.createdBy, audit.createdAt }
 * 
 * // 2. Documentos creados hoy
 * *[_type == 'pastor' && audit.createdAt > '2026-04-07'] 
 * 
 * // 3. Documentos modificados por usuario X
 * *[_type == 'pastor' && audit.modifiedBy == 'userId123']
 * 
 * // 4. Cambios en las últimas 24 horas
 * *[_type == 'pastor' && audit.modifiedAt > now() - 86400000]
 * 
 * // 5. Documentos nunca modificados (solo creados)
 * *[_type == 'pastor' && audit.createdBy == audit.modifiedBy]
 */

/**
 * LIMITACIONES Y NOTAS:
 * 
 * 1. currentUser.id es el UID interno de Sanity
 *    Puedes obtener más info (nombre, email) si lo necesitas:
 *    context.currentUser?.name, context.currentUser?.email
 * 
 * 2. Los hooks se ejecutan en Sanity Studio
 *    Si cambias documentos vía API directa, estos hooks NO se ejecutan
 *    SOLUCIÓN: En tu backend, también llenar audit manualmente
 * 
 * 3. Cambios en draft vs published
 *    Los hooks se ejecutan para ambos estados
 *    El documento draft y published tienen audit independientes
 * 
 * 4. Usuarios con rol "Viewer" (solo lectura)
 *    No pueden editar, los hooks no se ejecutan (correcto)
 */

export default {
  beforeCreate: auditBeforeCreate,
  beforeCommit: auditBeforeCommit,
}
