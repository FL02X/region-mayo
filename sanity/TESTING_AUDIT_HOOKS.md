/**
 * GUÍA DE TESTING - Verificar que los Hooks de Auditoría Funcionan
 * 
 * Sigue estos pasos para confirmar que _audit se está llenando correctamente
 */

// ============================================================================
// PASO 1: CREAR UN DOCUMENTO NUEVO EN SANITY STUDIO
// ============================================================================

/**
 * 1. Abre Sanity Studio en tu aplicación
 *    URL: http://localhost:3000/studio (o donde esté tu Studio)
 * 
 * 2. Ve a cualquier tipo de documento (ej: Pastor)
 * 
 * 3. Click en "Create" o "New Document"
 * 
 * 4. Llena los campos obligatorios:
 *    - fullName: "Pastor Prueba"
 *    - templo: selecciona uno de la lista
 *    - region: se llena automáticamente (readOnly)
 *    - ...otros campos...
 * 
 * 5. Click en "Create" o "Publish"
 */

// ============================================================================
// PASO 2: VERIFICAR QUE _audit SE LLENÓ USANDO VISION TOOL
// ============================================================================

/**
 * OPCIÓN A: Usar Vision Tool en Sanity Studio
 * 
 * 1. En Sanity Studio, click en la pestaña "Vision" (icono del ojo)
 * 
 * 2. Ejecuta esta query (copia y pega):
 */
const QUERY_CHECK_AUDIT = `
*[_type == 'pastor'] | order(_createdAt desc)[0] {
  _id,
  fullName,
  _createdAt,
  _updatedAt,
  "_audit": _audit
}
`

/**
 * 3. Presiona "Execute" (Cmd+Enter o Ctrl+Enter)
 * 
 * 4. RESULTADO ESPERADO: Deberías ver algo como:
 * 
 * {
 *   "_id": "documentIdXyz",
 *   "fullName": "Pastor Prueba",
 *   "_createdAt": "2026-04-07T...",
 *   "_updatedAt": "2026-04-07T...",
 *   "_audit": {
 *     "createdBy": "user123abc",
 *     "createdAt": "2026-04-07T10:30:45.123Z",
 *     "modifiedBy": "user123abc",
 *     "modifiedAt": "2026-04-07T10:30:45.123Z"
 *   }
 * }
 * 
 * ✅ Si ves _audit con valores → LOS HOOKS FUNCIONAN
 * ❌ Si _audit es null o no existe → PROBLEMA EN LOS HOOKS
 */

// ============================================================================
// PASO 3: PROBAR QUE modifiedBy Y modifiedAt SE ACTUALIZAN
// ============================================================================

/**
 * 1. Abre el documento que creaste (Pastor Prueba)
 * 
 * 2. Edita un campo (ej: phone)
 * 
 * 3. Guarda el cambio (click en "Publish" o "Save")
 * 
 * 4. Vuelve a ejecutar la query en Vision:
 */
const QUERY_AFTER_EDIT = `
*[_type == 'pastor' && fullName == 'Pastor Prueba'][0] {
  fullName,
  "_audit": _audit
}
`

/**
 * 5. RESULTADO ESPERADO: El timestamp modifiedAt debe ser más reciente
 * 
 * Antes: "modifiedAt": "2026-04-07T10:30:45.123Z"
 * Después: "modifiedAt": "2026-04-07T10:35:20.456Z" (más reciente)
 * 
 * IMPORTANTE: createdBy y createdAt NO deben cambiar
 */

// ============================================================================
// PASO 4: VERIFICAR CON DIFERENTES USUARIOS (BONUS)
// ============================================================================

/**
 * Si tu proyecto tiene múltiples usuarios:
 * 
 * 1. Crea un documento como Usuario A
 *    _audit.createdBy = <userId de A>
 *    _audit.modifiedBy = <userId de A>
 * 
 * 2. Haz logout de Usuario A
 * 
 * 3. Haz login como Usuario B
 * 
 * 4. Edita el documento
 *    _audit.createdBy = <userId de A> (NO CAMBIA)
 *    _audit.modifiedBy = <userId de B> (CAMBIA!)
 *    _audit.modifiedAt = <timestamp nuevo>
 * 
 * 5. Ejecuta query:
 */
const QUERY_MULTI_USER = `
*[_type == 'pastor' && fullName == 'Pastor Prueba'][0] {
  fullName,
  _audit {
    createdBy,
    modifiedBy,
    "fueron_mismas_personas": createdBy == modifiedBy
  }
}
`

/**
 * Si createdBy != modifiedBy, tus hooks están rastreando versiones correctamente!
 */

// ============================================================================
// TROUBLESHOOTING - "Los hooks no están funcionando"
// ============================================================================

/**
 * PROBLEMA 1: _audit es null o no existe
 * 
 * SOLUCIONES:
 * a) Reinicia Sanity Studio
 *    - Mata el servidor (Ctrl+C)
 *    - Corre: npm run dev (o tu script)
 *    - Intenta crear documento de nuevo
 * 
 * b) Revisa la consola del navegador (F12 → Console)
 *    ¿Hay algún error? Cópialo completo
 * 
 * c) Verifica que sanity.config.ts tiene los imports:
 *    import { auditBeforeCreate, auditBeforeCommit } from './sanity/auditHooks'
 *    (Si no, copiar e instalar manualmente)
 * 
 * d) Verifica que los nombres de tipos de documentos coinciden exactamente:
 *    AUDITABLE_DOCUMENT_TYPES debe incluir ['region', 'templo', 'pastor', ...]
 *    Si tu schema es 'iglesia' y aquí es 'templo' → NO MATCHEA
 */

/**
 * PROBLEMA 2: _audit tiene valores pero todos son "system"
 * 
 * CAUSA: Usuario no está autenticado
 * SOLUCIÓN: Asegurate que estás logado en Sanity Studio
 *           El hook usa context.currentUser?.id || 'system'
 */

/**
 * PROBLEMA 3: createdBy y modifiedBy son iguales cada vez
 * 
 * PROBLEMA: Esto puede ser correcto si solo un usuario edita
 * VERIFICA: Los timestamps son diferentes?
 *           ¿El modifiedAt cambió a un tiempo más reciente?
 *           Si sí → Los hooks funcionan bien
 */

// ============================================================================
// PASO 5: IMPLEMENTACIÓN EN BACKEND (IMPORTANTE!)
// ============================================================================

/**
 * ⚠️ NOTA IMPORTANTE ⚠️
 * 
 * Los hooks definidos en sanity.config.ts SOLO se ejecutan en:
 * - Sanity Studio (interfaz web)
 * 
 * Si actualizas documentos VÍA API (desde tu Next.js app), los hooks NO se ejecutan.
 * 
 * SOLUCIÓN: En tu backend, cuando hagas mutations a Sanity, también llenar _audit:
 * 
 * Ejemplo (con @sanity/client):
 * 
 * ```typescript
 * const client = sanityClient.withConfig({ token: writeToken })
 * 
 * const mutation = {
 *   patch: {
 *     id: documentId,
 *     set: {
 *       fullName: 'Nuevo Nombre',
 *       _audit: {
 *         createdBy: existingDoc._audit.createdBy, // Copiar del original
 *         createdAt: existingDoc._audit.createdAt,
 *         modifiedBy: currentUserId, // Tu usuario actual
 *         modifiedAt: new Date().toISOString(),
 *       }
 *     }
 *   }
 * }
 * 
 * await client.mutate([mutation])
 * ```
 * 
 * Esto es especialmente importante para:
 * - Registro de eventos desde formularios web
 * - Cambios batch desde scripts
 * - APIs que modifican documentos
 */

// ============================================================================
// RESUMEN RÁPIDO
// ============================================================================

/**
 * ✅ DEBERÍA VER:
 * - _audit.createdBy: userId o "system"
 * - _audit.createdAt: fecha de creación
 * - _audit.modifiedBy: userId o "system"
 * - _audit.modifiedAt: fecha de última modificación (igual o más reciente que createdAt)
 * 
 * ✅ SI CREO DOCUMENTO:
 * - modifiedBy == createdBy (porque se acaba de crear)
 * - modifiedAt == createdAt (mismos timestamps)
 * 
 * ✅ SI EDITO DOCUMENTO:
 * - modifiedBy posiblemente cambia (si es otro usuario)
 * - modifiedAt se actualiza a hora actual
 * - createdBy y createdAt NO cambian NUNCA
 * 
 * ❓ PREGUNTAS:
 * Si algo no funciona, preguntar en Discord/Slack del equipo,
 * o revisar logs:
 * - Browser console (F12 → Console)
 * - Network tab (F12 → Network)
 * - Sanity logs (Dashboard → Logs si aplica)
 */

export const TESTING_GUIDE = {
  step1: 'Crear documento en Sanity Studio',
  step2: 'Ejecutar query en Vision Tool',
  step3: 'Editar documento y guardar',
  step4: 'Verificar que modifiedAt cambió',
  step5: 'Implementar _audit en API calls de backend',
}
