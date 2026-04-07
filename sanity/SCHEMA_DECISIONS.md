/**
 * JUSTIFICACIÓN DE DECISIONES DE DISEÑO ARQUITECTÓNICO
 * 
 * Documento que explica CÓMO y POR QUÉ se hicieron cambios específicos
 * a la estructura de schemas de Sanity
 * 
 * Escrito: Abril 2026
 * Para: Equipo de Desarrollo + Futuros Mantenedores
 */

// ============================================================================
// SECCIÓN 1: AUDITORÍA - Registro de Cambios
// ============================================================================

/**
 * DECISIÓN: Agregar objeto _audit (oculto) a TODOS los documentos
 * 
 * IMPLEMENTACIÓN:
 * - Campo _audit: object readOnly
 * - Campos: createdBy (UID), createdAt, modifiedBy, modifiedAt
 * - Hidden: true (no visible en interfaz normal)
 * 
 * POR QUÉ:
 * 1. RESPONSABILIDAD: En un entorno cerrado sin permisos granulares,
 *    la auditoría es la ÚNICA forma de saber quién cambió qué
 * 2. DETECTAR CULPABLES: Si algo sale mal, revisar _audit revela:
 *    - Quién lo cambió
 *    - Cuándo lo cambió
 *    - Qué campo fue modificado
 * 3. CUMPLIMIENTO: Muchas regulaciones exigen trazabilidad de datos
 * 4. DEBUGGING: Historial invaluable para investigar problemas
 * 
 * NOTA IMPORTANTE:
 * Los valores de _audit deben ser poblados desde el backend/Sanity hooks
 * No son editables por usuarios (readOnly: true)
 * 
 * FUTURA MEJORA:
 * Implementar hooks en sanity.config.ts que auto-llenen estos campos
 * en el momento de creación/actualización
 */

// ============================================================================
// SECCIÓN 2: SOFT DELETE - Eliminación Lógica
// ============================================================================

/**
 * DECISIÓN: Agregar campo deletedAt a documentos clave
 * 
 * IMPLEMENTACIÓN:
 * - Campo deletedAt: datetime (hidden)
 * - Si deletedAt es null → documento activo
 * - Si deletedAt tiene valor → documento "eliminado"
 * 
 * DOCUMENTOS AFECTADOS:
 * - Region, Templo, Pastor, Coro, Directiva, Event
 * - NO: Registration (es transaccional)
 * 
 * POR QUÉ:
 * 1. NUNCA PERDER DATOS: Eliminar un pastor de admin UI no lo borra
 *    Se marca como eliminado, los datos persisten en auditoría
 * 2. INTEGRIDAD REFERENCIAL: Si eliminamos iglesia, sus registros
 *    siguen siendo consultables porque los datos existen
 * 3. CUMPLIMIENTO: Regulaciones exigen retención de datos históricos
 * 4. REVERSIBILIDAD: Errores de eliminación se pueden deshacer
 * 
 * IMPLEMENTACIÓN EN QUERIES:
 * ```sanity
 * // Consultar SOLO documentos activos
 * *[_type == 'pastor' && !deletedAt]
 * 
 * // Incluir histórico completo
 * *[_type == 'pastor']
 * ```
 * 
 * CREAR ÍNDICE PARA PERFORMANCE:
 * Cuando tengas millones de documentos, agregar:
 * indexes: [{ name: 'byActive', keys: [['deletedAt']] }]
 */

// ============================================================================
// SECCIÓN 3: GEOLOCALIZACIÓN - Geopoint en Templo
// ============================================================================

/**
 * DECISIÓN: Agregar campo location (geopoint) a Templo
 * 
 * IMPLEMENTACIÓN:
 * - Campo location: geopoint (opcional pero recomendado)
 * - Formato: { _type: 'geopoint', lat: 25.1234, lng: -77.5678 }
 * 
 * POR QUÉ:
 * 1. MAPAS INTERACTIVOS: Mostrar templos en mapa de Google Maps
 *    - Clustering de templos cercanos
 *    - Cálculo de distancia usuario → templo
 * 2. ANÁLISIS GEOGRÁFICO: Identificar "huecos" sin cobertura
 *    - Visualizar distribución de iglesias
 *    - Detectar oportunidades de nuevos templos
 * 3. FUNCIONALIDADES FUTURAS: 
 *    - "Templo más cercano a mi ubicación"
 *    - Rutas óptimas para recorridos
 *    - Análisis demográfico por zona
 * 4. INTEGRACIÓN MÓVIL: Fundamental para app móvil de búsqueda
 * 
 * NOTA: googleMapsUrl es DIFERENTE
 * - googleMapsUrl: enlace a Google Maps (cadena de texto)
 * - location: coordenadas GPS reales (datos estructurados)
 * Ambos son útiles, no son redundantes
 */

// ============================================================================
// SECCIÓN 4: VALIDACIONES CROSS-SCHEMA - Integridad Referencial
// ============================================================================

/**
 * DECISIÓN: Agregar región como campo heredado (readOnly) en Pastor, Coro, Directiva
 * 
 * IMPLEMENTACIÓN:
 * ```typescript
 * defineField({
 *   name: 'region',
 *   type: 'reference',
 *   readOnly: true,
 *   description: 'Heredada del templo, readOnly'
 * })
 * ```
 * 
 * POR QUÉ:
 * 1. VALIDACIÓN LÓGICA: Un pastor de "Región Centro" debe estar
 *    en un templo de "Región Centro", no de "Región Norte"
 * 2. CONSISTENCY: Si cambias el templo de un pastor, su región
 *    debe cambiar automáticamente
 * 3. QUERIES MÁS RÁPIDAS: Sin necesidad de JOIN:
 *    - *[_type == 'pastor' && region._ref == regionId]
 *    vs
 *    - *[_type == 'pastor' && templo->region._ref == regionId]
 * 
 * VALIDACIÓN AUTOMÁTICA:
 * El campo readOnly impide que alguien cambie región directamente
 * Deben cambiar el templo, y región se actualiza automáticamente
 * 
 * NOTA: Sanity no tiene triggers automáticos
 * SOLUCIÓN: Implementar en frontend/backend:
 * Cuando se asigna un templo, "copiar" su región
 * Ver archivo: validationHooks.ts
 */

// ============================================================================
// SECCIÓN 5: DENORMALIZACIÓN INTELIGENTE - Coro
// ============================================================================

/**
 * DECISIÓN: Agregar temploName y regionName (denormalizados) a Coro
 * 
 * IMPLEMENTACIÓN:
 * ```typescript
 * defineField({
 *   name: 'temploName',
 *   type: 'string',
 *   readOnly: true,
 *   hidden: true,
 *   description: 'Copia de templo.temploName'
 * })
 * ```
 * 
 * POR QUÉ DENORMALIZAR (ROMPER NORMALIZACIÓN):
 * Normalmente NUNCA duplicas datos
 * Pero hay excepciones profesionales:
 * 
 * 1. PERFORMANCE: Queries sin joins
 *    *[_type == 'coro'].[] | order(temploName asc)
 *    es MÁS RÁPIDO que:
 *    *[_type == 'coro'] | order(templo->temploName asc)
 * 
 * 2. ANALYTICS: Si tienes millones de registros
 *    Los joins se vuelven costosos
 * 
 * 3. FÁCIL LECTURA: Vista previa mejor en admin
 *    Muestra "Centro" en lugar de "ref: xyz123"
 * 
 * 4. CACHÉ LOCAL: Los datos están "listos para usar"
 * 
 * COSTO:
 * Cuando cambias el nombre de un templo, DEBEN actualizar
 * todos los coros. Implementar:
 * - Hook/trigger al cambiar templo.temploName
 * - Script de sincronización semanal
 * - O aceptar que estará "ligeramente desincronizado"
 * 
 * RECOMENDACIÓN: Usar si tienes > 100K registros
 * Sino, mantener normalizado (es más simple)
 */

// ============================================================================
// SECCIÓN 6: INDEXACIÓN - Optimización de Queries
// ============================================================================

/**
 * DECISIÓN: Agregar índices explícitos a documentos clave
 * 
 * IMPLEMENTACIÓN:
 * ```typescript
 * indexes: [
 *   { name: 'byRegion', keys: [['region']] },
 *   { name: 'byRegionAndActive', keys: [['region'], ['active']] },
 *   { name: 'byChurchNumber', keys: [['churchNumber']] },
 * ]
 * ```
 * 
 * POR QUÉ:
 * 1. QUERIES SIN ÍNDICE son O(n) - terribles con 100K+ registros
 * 2. ÍNDICE hace queries O(log n) - exponencialmente más rápido
 * 3. CONSULTAS FRECUENTES: 
 *    - "Listar todos los pastores de Región Centro"
 *    - "Listar coros activos de una región"
 * 
 * ÍNDICES CREADOS:
 * 
 * Templo:
 *   - byRegion: para filtrar por región
 *   - byRegionAndActive: para listar activos de región
 *   - byChurchNumber: para búsquedas rápidas por número
 * 
 * Pastor, Coro:
 *   - byTemplo: para listar miembros de un templo
 *   - byRegion: para listar por región
 *   - byRegionAndActive: lista filtrada común
 * 
 * Event:
 *   - byRegion: filtrar eventos por región
 *   - byStatus: filtrar por estado (upcoming, past)
 *   - byDate: ordenar cronológicamente
 * 
 * CUIDADO: Demasiados índices ralentizan escritura
 * Solo crear índices para queries que harás FRECUENTEMENTE
 */

// ============================================================================
// SECCIÓN 7: ENUMS Y VALIDACIÓN - Valores Predefinidos
// ============================================================================

/**
 * DECISIÓN: Usar enums (listas predefinidas) en lugar de strings libres
 * 
 * DOCUMENTACIÓN: ver archivo enums.ts
 * 
 * CAMBIOS:
 * 1. Directiva.role: cambiar de string libre a ENUM
 *    - Antes: role: string (cualquier cosa)
 *    - Ahora: role: enum [...valores específicos...]
 * 
 * POR QUÉ:
 * 1. CONSISTENCIA: No hay typos. "Presudente" vs "Presidente"
 * 2. FILTROS: Queries más seguras
 *    *[directiva.role == 'president_regional'] // OK
 *    vs
 *    *[directiva.role = 'Presudente Regional'] // NO COINCIDE
 * 
 * 3. UI MEJOR: Dropdown en lugar de campo de texto libre
 * 4. API: Documentación clara de valores válidos
 * 5. TRADUCCIÓN: Valor = código, Label = texto localizable
 * 
 * VALORES CON STRUCTURE:
 * En lugar de solo strings, usar objetos con metadata:
 * ```
 * {
 *   value: 'president_regional', // para queries/APIs
 *   label: 'Presidente Regional', // para UI
 *   level: 'regional', // para lógica
 * }
 * ```
 */

// ============================================================================
// SECCIÓN 8: REGISTRATION - Desnormalización Transaccional
// ============================================================================

/**
 * DECISIÓN: Guardar región como STRING, no REFERENCE
 * 
 * DIFERENCIA:
 * - Otros docs: region: reference → { _type: 'reference', _ref: 'id123' }
 * - Registration: region: string → "Región Centro"
 * 
 * POR QUÉ:
 * 1. PERFORMANCE: Registration es transaccional
 *    - Se crea via API en formulario web
 *    - No necesita JOIN al guardar
 *    - Es más rápido guardar string que reference
 * 
 * 2. ANALYTICS: Reportes por región muy comunes
 *    *[_type == 'registration' && region == 'Región Centro']
 *    No necesita deref, es más veloz
 * 
 * 3. TOLERANCIA A BORRADO: Si se borra región por error,
 *    los registros históricos NO se "orfanan"
 *    Puedes seguir viendo "fue en Región Centro"
 * 
 * 4. COMPLIANCE: Para auditoría, guardar snapshot del estado
 *    en ese momento. Si la región cambió nombre después,
 *    el registro sigue diciendo el nombre original
 * 
 * TRADEOFF:
 * - VENTAJA: Más rápido, más seguro para datos transaccionales
 * - DESVENTAJA: Si cambias nombre de región, registros viejos
 *   siguen con nombre anterior (correcto, en realidad)
 */

// ============================================================================
// SECCIÓN 9: PARTICIONAMIENTO - Escalabilidad Temporal
// ============================================================================

/**
 * DECISIÓN: Agregar _partition a Registration (año-mes)
 * 
 * IMPLEMENTACIÓN:
 * ```typescript
 * _partition: string = '2026-04' // YYYY-MM
 * ```
 * 
 * POR QUÉ:
 * 1. SCALABILITY: Si tienes 10M registros, queries se hacen lentas
 *    Con pequeño índice _partition, dividir en chunks:
 *    - Registros 2024-01: en carpeta A
 *    - Registros 2024-02: en carpeta B
 *    etc.
 * 
 * 2. ARCHIVING: Cada mes:
 *    - Exportar registros del mes anterior
 *    - Archivar en cold storage
 *    - Mantener solo últimos 12 meses en BD "caliente"
 * 
 * 3. QUERIES RÁPIDAS:
 *    *[_type == 'registration' && _partition == '2026-04']
 *    vs
 *    *[_type == 'registration' && registeredAt >= ... && registeredAt < ...]
 *    La primera es MUCHO más rápida
 * 
 * 4. BACKUP INCREMENTAL:
 *    - Backup completo: mes 1
 *    - Backup incremental: cada mes posterior
 *    - Rol back completo mes 3 sin restaurar desde 0
 * 
 * NOTA: Se genera automáticamente con initialValue()
 */

// ============================================================================
// SECCIÓN 10: DOCSTRINGS Y DESCRIPTIONS - Documentación Clara
// ============================================================================

/**
 * DECISIÓN: Agregar docprints extensos a TODOS los campos
 * 
 * CAMBIOS:
 * Antes:
 * ```typescript
 * defineField({
 *   name: 'churchNumber',
 *   title: 'Número de Iglesia',
 *   type: 'string',
 * })
 * ```
 * 
 * Después:
 * ```typescript
 * defineField({
 *   name: 'churchNumber',
 *   title: 'Número de Iglesia',
 *   type: 'string',
 *   description: 'ID único DENTRO de la región (ej: 01, 002, 101).
 *                Usado para ordenamiento y referencias históricas.'
 * })
 * ```
 * 
 * POR QUÉ:
 * 1. CLARIDAD: Reducir ambigüedad
 *    ¿Es churchNumber global o por región? DOCUMENTA
 *    ¿Puede ser "iglesia 1" o solo números? ESPECIFICA
 * 
 * 2. FUTURO: En 6 meses, nadie recordará por qué existe un campo
 *    La documentación lo explica
 * 
 * 3. NUEVOS DEVS: Onboarding del equipo más rápido
 *    Lee descripción en lugar de investigar el código
 * 
 * 4. ERRORS: Cuando validaciones fallan, mensajes mejor:
 *    "❌ Número de iglesia duplicado en esta región"
 *    vs
 *    "❌ Error de validación"
 * 
 * CONVENCIÓN: description explica:
 * - Qué es el campo
 * - Restricciones (ej: único por región)
 * - Formato esperado (ej: 10 dígitos)
 * - Ejemplos prácticos (ej: "01, 002, 101")
 */

// ============================================================================
// CONCLUSIÓN Y PRÓXIMOS PASOS
// ============================================================================

/**
 * RESUMEN DE CAMBIOS:
 * ✅ Auditoría en todos los docs (trazabilidad)
 * ✅ Soft delete (integridad histórica)
 * ✅ Geolocalización (mapas + análisis)
 * ✅ Validaciones cross-schema (integridad referencial)
 * ✅ Denormalización inteligente (performance)
 * ✅ Índices explícitos (speed)
 * ✅ Enums (validación + consistency)
 * ✅ Particionamiento (scalability)
 * ✅ Documentación clara (mantenibilidad)
 * 
 * QUÉ IMPLEMENTAR AHORA:
 * 1. Revisar archivo validationHooks.ts
 * 2. Crear hooks en sanity.config.ts para auto-llenar _audit
 * 3. Documentar en tu README.md sobre auditoría
 * 4. Entrenar equipo sobre uso de enums (ver enums.ts)
 * 5. Crear dashboard de integridad para auditorías semanales
 * 
 * QUÉ MONITOREAR:
 * - Si _audit fields se están llenando (verificar hooks)
 * - Si queries con índices son realmente más rápidas
 * - Si deletedAt está siendo usado correctamente
 * - Si enumsno se desincronization con schema
 * 
 * FUTURA EVOLUCIÓN:
 * - Implementar full-text search cuando crezcan datos
 * - Agregar versioning para "historial completo de cambios"
 * - Implementar compresión de datos > 1 año (archivo)
 * - Multi-region si expande a múltiples países
 */

export const CHANGE_SUMMARY = {
  date: '2026-04-07',
  author: 'Database Architecture Review',
  versionBefore: '1.0-basic',
  versionAfter: '2.0-production-ready',
  breaking_changes: false,
  new_features: [
    'Auditoría completa',
    'Soft delete',
    'Geolocalización',
    'Índices de performance',
    'Enums validados',
    'Particionamiento',
  ],
  migration_required: false,
  notes: 'Los campos nuevos son opcionales, compatibles con datos existentes',
}
