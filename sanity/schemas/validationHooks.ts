/**
 * VALIDATION HOOKS - Validaciones de Integridad de Datos
 * 
 * Estos hooks se ejecutan en Sanity para asegurar integridad referencial
 * Ayudan a prevenir inconsistencias en la base de datos
 * 
 * INSTALACIÓN EN sanity.config.ts:
 * ```
 * import {documentValidationHooks} from './sanity/schemas/validationHooks'
 * 
 * export default defineConfig({
 *   ...
 *   document: {
 *     // Hook para validar cambios ANTES de guardar
 *     // (ver documentación de Sanity para implementación)
 *   }
 * })
 * ```
 * 
 * NOTA: Los hooks reales se configuran en el nivel de documento config
 */

/**
 * VALIDACIÓN 1: Pastor debe coincidir con región del Templo
 * 
 * Valida: pastor.region === pastor.templo.region
 * Razón: Integridad - un pastor no puede estar en región diferente a su templo
 */
export const validatePastorRegion = {
  documentType: 'pastor',
  validation: `
    Asegura que:
    - pastor.region IS NOT NULL
    - pastor.templo IS NOT NULL  
    - pastor.region == pastor.templo.region
  `,
  errorMessage: 'La región del pastor debe coincidir con la región de su templo',
  severity: 'error',
}

/**
 * VALIDACIÓN 2: Coro debe coincidir con región del Templo
 * 
 * Valida: coro.region === coro.templo.region
 * Razón: Integridad - un coro no puede estar en región diferente a su templo
 */
export const validateCoroRegion = {
  documentType: 'coro',
  validation: `
    Asegura que:
    - coro.region IS NOT NULL
    - coro.templo IS NOT NULL
    - coro.region == coro.templo.region
  `,
  errorMessage: 'La región del coro debe coincidir con la región de su templo',
  severity: 'error',
}

/**
 * VALIDACIÓN 3: Directiva LOCAL debe coincidir con región del Templo
 * 
 * Valida: 
 *   - Si directiva.templo != NULL → directiva.region == directiva.templo.region
 *   - Si directiva.templo == NULL → OK (es directiva regional)
 */
export const validateDirectivaRegion = {
  documentType: 'directiva',
  validation: `
    Asegura que:
    - directiva.region IS NOT NULL (SIEMPRE)
    - Si directiva.templo != NULL:
        directiva.region == directiva.templo.region
  `,
  errorMessage: 'La región de la directiva debe coincidir con la región de su templo (si tiene)',
  severity: 'error',
}

/**
 * VALIDACIÓN 4: Event debe tener región válida
 * 
 * Valida: event.region IS NOT NULL
 * Razón: Todo evento DEBE pertenecer a una región
 */
export const validateEventRegion = {
  documentType: 'event',
  validation: `
    Asegura que:
    - event.region IS NOT NULL
    - event.date IS NOT NULL
    - event.endDate >= event.date (si endDate existe)
  `,
  errorMessage: 'El evento debe tener una región y fechas válidas',
  severity: 'error',
}

/**
 * VALIDACIÓN 5: Templo debe tener región
 * 
 * Valida: templo.region IS NOT NULL
 * Razón: Todo templo DEBE pertenecer a una región
 */
export const validateTemploRegion = {
  documentType: 'templo',
  validation: `
    Asegura que:
    - templo.region IS NOT NULL
    - templo.churchNumber IS NOT NULL y ÚNICO (dentro de región)
    - templo.temploName IS NOT NULL
  `,
  errorMessage: 'El templo debe tener región y nombre',
  severity: 'error',
}

/**
 * VALIDACIÓN 6: Evitar orfandad de referencias
 * 
 * Valida: No hay documentos referenciando IDs que no existen
 * Razón: Integridad referencial
 * 
 * NOTA: Esto se hace mejor con una query periódica de auditoría
 */
export const orphanedReferencesWarning = {
  description: `
    Para validar integridad referencial, ejecutar periodicamente:
    
    // Buscar pastores cuyo templo no existe
    *[_type == 'pastor' && !(_id in path('templo._ref'))]
    
    // Buscar coros cuyo templo no existe
    *[_type == 'coro' && !(_id in path('templo._ref'))]
    
    // Buscar directiva cuyo templo NO EXISTE (pero templo NO nulo)
    *[_type == 'directiva' && templo != null && !(_id in path('templo._ref'))]
  `,
  frequency: 'Weekly',
  severity: 'warning',
}

/**
 * IMPLEMENTACIÓN MANUAL DE VALIDACIONES
 * 
 * Si Sanity no soporta hooks pre-save, ejecutar:
 * 1. Cron job semanal que valide integridad
 * 2. Dashboard de "Errores de Integridad" que muestre inconsistencias
 * 3. Script de "reparación automática" que corrija region heredada si templox cambió
 */
