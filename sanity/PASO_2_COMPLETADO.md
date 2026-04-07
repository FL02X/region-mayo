/**
 * ✅ PASO 2 COMPLETADO: Crear hooks en sanity.config.ts para auto-llenar _audit
 * 
 * Fecha: Abril 7, 2026
 * Status: IMPLEMENTADO Y LISTO PARA TESTING
 * 
 * ARCHIVOS CREADOS/ACTUALIZADOS:
 * ✅ sanity/auditHooks.ts - Lógica de los hooks
 * ✅ sanity.config.ts - Integración de hooks
 * ✅ sanity/TESTING_AUDIT_HOOKS.md - Guía de testing
 * ✅ sanity/auditUtils.ts - Funciones para API calls
 */

// ============================================================================
// QUÉ SE HIZO
// ============================================================================

/**
 * 1. ARCHIVO: sanity/auditHooks.ts
 *    - Función auditBeforeCreate(): Llena _audit al crear documento
 *    - Función auditBeforeCommit(): Actualiza _audit al editar documento
 *    - Documentación completa de cómo funcionan
 *    - Ejemplos de debugging
 * 
 * 2. ARCHIVO: sanity.config.ts (ACTUALIZADO)
 *    - Import de auditHooks
 *    - Configuración de document.beforeCreate y document.beforeCommit
 *    - Array AUDITABLE_DOCUMENT_TYPES con tipos que requieren auditoría
 *    - Lógica para aplicar hooks SOLO a documentos auditables
 * 
 * 3. ARCHIVO: sanity/TESTING_AUDIT_HOOKS.md
 *    - Pasos detallados para verificar que hooks funcionan
 *    - Queries Vision Tool para inspeccionar _audit
 *    - Troubleshooting para problemas comunes
 *    - Guía de testing multi-usuario
 * 
 * 4. ARCHIVO: sanity/auditUtils.ts
 *    - createAudit(): Crea _audit para documentos nuevos
 *    - updateAudit(): Actualiza _audit preservando createdBy/createdAt
 *    - prepareForCreate/Update(): Helpers para mutations desde API
 *    - Ejemplos de integración con Next.js
 *    - Guía de batch updates
 */

// ============================================================================
// CÓMO FUNCIONAN LOS HOOKS
// ============================================================================

/**
 * HOOK 1: beforeCreate
 * 
 * Se ejecuta CUANDO: Usuario hace click en "Create" en Sanity Studio
 * ACCIONES:
 *   - Obtiene userId del usuario actual (context.currentUser.id)
 *   - Obtiene timestamp actual
 *   - Llena TODOS los campos de _audit:
 *     • createdBy = userId
 *     • createdAt = timestamp
 *     • modifiedBy = userId (mismo, porque se acaba de crear)
 *     • modifiedAt = timestamp (mismo)
 * 
 * RESULTADO: Documento tiene auditoría desde el inicio
 */

/**
 * HOOK 2: beforeCommit
 * 
 * Se ejecuta CUANDO: Usuario guarda cambios en documento existente
 * ACCIONES:
 *   - Preserva createdBy y createdAt (NO cambian)
 *   - Obtiene userId del usuario actual
 *   - Obtiene timestamp actual
 *   - Actualiza SOLO:
 *     • modifiedBy = userId (puede ser diferente)
 *     • modifiedAt = timestamp (siempre más reciente)
 * 
 * RESULTADO: Puedes rastrear quién hizo el último cambio y cuándo
 */

// ============================================================================
// FLUJO COMPLETO
// ============================================================================

/**
 * ESCENARIO 1: Usuario A crea un Pastor
 * 
 * T1: Usuario A hace click "Create" → beforeCreate se ejecuta
 *     _audit = {
 *       createdBy: "userA",
 *       createdAt: "2026-04-07 10:00:00Z",
 *       modifiedBy: "userA",
 *       modifiedAt: "2026-04-07 10:00:00Z"
 *     }
 * 
 * T2: Usuario A cambia el teléfono → beforeCommit se ejecuta
 *     _audit = {
 *       createdBy: "userA", // ← NO CAMBIA
 *       createdAt: "2026-04-07 10:00:00Z", // ← NO CAMBIA
 *       modifiedBy: "userA",
 *       modifiedAt: "2026-04-07 10:05:00Z" // ← ACTUALIZADO
 *     }
 * 
 * T3: Usuario B hace logout de A, login como B
 * T4: Usuario B edita la región → beforeCommit se ejecuta
 *     _audit = {
 *       createdBy: "userA", // ← SIGUE SIENDO A
 *       createdAt: "2026-04-07 10:00:00Z",
 *       modifiedBy: "userB", // ← CAMBIÓ
 *       modifiedAt: "2026-04-07 10:10:00Z" // ← ACTUALIZADO
 *     }
 * 
 * VENTAJA: Puedo saber exactamente:
 *   ✅ Quién creó el documento (userA)
 *   ✅ Cuándo se creó (10:00)
 *   ✅ Quién lo modificó por última vez (userB)
 *   ✅ Cuándo fue la última modificación (10:10)
 *   ✅ RASTREAR COMPLETO DE CAMBIOS
 */

// ============================================================================
// TIPOS DE DOCUMENTOS CON AUDITORÍA
// ============================================================================

/**
 * Estos tipos de documentos TIENEN hooks de auditoría:
 * 
 * ✅ region - Configuración de región
 * ✅ templo - Iglesias locales
 * ✅ pastor - Pastores
 * ✅ coro - Grupos/coros locales
 * ✅ directiva - Directiva regional/local
 * ✅ event - Eventos y cultos
 * ✅ registration - Registros de asistentes
 * 
 * ❌ NOT AUDITED:
 * ✗ siteSettings - Configuraciones globales (no necesita auditoría)
 */

// ============================================================================
// VERIFICACIÓN PASO A PASO
// ============================================================================

/**
 * ANTES DE EMPEZAR A USAR:
 * 
 * [ ] 1. Reinicia el servidor de desarrollo
 *       npm run dev (o tu comando)
 *       Esto recarga sanity.config.ts
 * 
 * [ ] 2. Abre Sanity Studio
 *       http://localhost:3000/studio (o donde sea)
 * 
 * [ ] 3. Verifica que NO hay errores en consola (F12 → Console)
 *       Si hay errores, ver sección TROUBLESHOOTING
 * 
 * [ ] 4. Crea un documento nuevo (ej: Pastor de prueba)
 *       Llena campos y guarda
 * 
 * [ ] 5. Abre Vision Tool (pestaña "Vision" en Studio)
 * 
 * [ ] 6. Ejecuta esta query:
 *       *[_type == 'pastor'] | order(_createdAt desc)[0] { fullName, _audit }
 * 
 * [ ] 7. RESULTADO:
 *       ✅ SÍ hay _audit con valores → FUNCIONA BIEN
 *       ❌ NO hay _audit o es null → VER TROUBLESHOOTING
 * 
 * [ ] 8. Edita el documento y guarda
 * 
 * [ ] 9. Re-ejecuta la query
 *       ✅ modifiedAt debe ser MÁS RECIENTE
 *       ✅ createdBy NO debe cambiar
 */

// ============================================================================
// QUEHACER AHORA
// ============================================================================

/**
 * PRÓXIMO PASO (Fase 2: Validación):
 * 
 * 1. Sigue la guía en TESTING_AUDIT_HOOKS.md
 * 2. Verifica que _audit se llena correctamente
 * 3. Si hay problemas, revisa troubleshooting
 * 4. Una vez verificado, proseguir a:
 *    - Implementación de auditUtils en API routes
 *    - Testing de Creation/Update via API
 *    - Batch operations
 */

// ============================================================================
// RESUMEN TÉCNICO
// ============================================================================

const TECHNICAL_SUMMARY = {
  implementation: {
    file: 'sanity/auditHooks.ts',
    hooks: ['beforeCreate', 'beforeCommit'],
    applied_to: ['region', 'templo', 'pastor', 'coro', 'directiva', 'event', 'registration'],
  },
  integration: {
    file: 'sanity.config.ts',
    change: 'Added document.beforeCreate and document.beforeCommit handlers',
    configuration: 'AUDITABLE_DOCUMENT_TYPES array',
  },
  utilities: {
    file: 'sanity/auditUtils.ts',
    functions: ['createAudit', 'updateAudit', 'prepareForCreate', 'prepareForUpdate'],
    use_cases: ['API calls', 'batch operations', 'backend mutations'],
  },
  testing: {
    file: 'sanity/TESTING_AUDIT_HOOKS.md',
    methods: ['Vision Tool queries', 'multi-user testing', 'troubleshooting'],
  },
  status: '✅ COMPLETO Y LISTO PARA TESTING',
}

export { TECHNICAL_SUMMARY }
