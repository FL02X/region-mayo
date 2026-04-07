/**
 * DICCIONARIO DE ENUMS - Referencia Integral de Valores Válidos
 * 
 * Archivo de referencia para todos los valores enumerados en los schemas
 * IMPORTANTE: Mantener sincronizado con los schemas
 * 
 * Usado para:
 * - Documentación para desarrolladores
 * - Validación en frontend
 * - APIs y queries
 */

// ============================================================================
// EVENT TYPES - Tipos de Eventos y Cultos
// ============================================================================

export const EVENT_TYPES = {
  CAMPANA: { value: 'campana', label: 'Campaña' },
  CONVENCION: { value: 'convencion', label: 'Convención General' },
  RECORRIDO: { value: 'recorrido', label: 'Recorrido Regional' },
  CULTO_JUVENIL: { value: 'cultoJuvenil', label: 'Culto Juvenil' },
  CULTO: { value: 'culto', label: 'Culto' },
  VISITA: { value: 'visita', label: 'Visita' },
  ENSAYO: { value: 'ensayo', label: 'Ensayo' },
  ACTIVIDAD: { value: 'actividad', label: 'Actividad' },
  ESTUDIO_BIBLICO: { value: 'estudioBiblico', label: 'Estudio Bíblico' },
  BIREGIONAL: { value: 'biregional', label: 'Biregional' },
  CONGRESO_BRILLA: { value: 'congresoBrilla', label: 'Congreso Brilla' },
  BODA: { value: 'boda', label: 'Boda' },
} as const

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES]['value']

// ============================================================================
// EVENT STATUS - Estados de Eventos
// ============================================================================

export const EVENT_STATUS = {
  UPCOMING: { value: 'upcoming', label: 'Próximo', emoji: '📅' },
  ACTIVE: { value: 'active', label: 'En Progreso', emoji: '🔴' },
  PAST: { value: 'past', label: 'Finalizado', emoji: '✅' },
} as const

export type EventStatus = typeof EVENT_STATUS[keyof typeof EVENT_STATUS]['value']

// ============================================================================
// DRESS CODE - Códigos de Vestimenta
// ============================================================================

export const DRESS_CODE = {
  UNIFORME_MGR: { value: 'uniformeMGR', label: 'Uniforme MGR' },
  FORMAL_CASUAL: { value: 'formalCasual', label: 'Vestimenta Formal/Casual' },
  INFORMAL: { value: 'informal', label: 'Informal' },
  OTHER: { value: 'otro', label: 'Otro (Personalizado)' },
} as const

export type DressCode = typeof DRESS_CODE[keyof typeof DRESS_CODE]['value']

// ============================================================================
// DIRECTIVA ROLES - Cargos de Directiva
// ============================================================================

export const DIRECTIVA_ROLES = {
  // Cargos Regionales
  PRESIDENT_REGIONAL: {
    value: 'president_regional',
    label: 'Presidente Regional',
    level: 'regional',
  },
  VICE_PRESIDENT_REGIONAL: {
    value: 'vice_president_regional',
    label: 'Vicepresidente Regional',
    level: 'regional',
  },
  SECRETARY_REGIONAL: {
    value: 'secretary_regional',
    label: 'Secretaria Regional',
    level: 'regional',
  },
  TREASURER_REGIONAL: {
    value: 'treasurer_regional',
    label: 'Tesorera Regional',
    level: 'regional',
  },

  // Cargos Locales (de Templo)
  PRESIDENT_LOCAL: {
    value: 'president_local',
    label: 'Presidente Local',
    level: 'local',
  },
  VICE_PRESIDENT_LOCAL: {
    value: 'vice_president_local',
    label: 'Vicepresidente Local',
    level: 'local',
  },
  SECRETARY_LOCAL: {
    value: 'secretary_local',
    label: 'Secretaria Local',
    level: 'local',
  },
  TREASURER_LOCAL: {
    value: 'treasurer_local',
    label: 'Tesorera Local',
    level: 'local',
  },

  // Cargos Especiales
  EVENT_COORDINATOR: {
    value: 'event_coordinator',
    label: 'Coordinador de Eventos',
    level: 'regional',
  },
  WOMENS_MINISTRY: {
    value: 'womens_ministry',
    label: 'Coordinadora de Ministerio Femenino',
    level: 'regional',
  },
  YOUTH_MINISTRY: {
    value: 'youth_ministry',
    label: 'Coordinador de Ministerio Juvenil',
    level: 'regional',
  },

  // Otros
  OTHER: {
    value: 'other',
    label: 'Otro (Personalizado)',
    level: 'unspecified',
  },
} as const

export type DirectivaRole = typeof DIRECTIVA_ROLES[keyof typeof DIRECTIVA_ROLES]['value']

/**
 * Helper: Obtener roles por nivel
 */
export const getDirectivaRolesByLevel = (level: 'regional' | 'local' | 'all') => {
  return Object.values(DIRECTIVA_ROLES).filter(
    (role) => level === 'all' || role.level === level
  )
}

// ============================================================================
// REGISTRATION STATUS - Estados de Asistencia
// ============================================================================

export const ATTENDANCE_TYPE = {
  OYENTE: { value: 'oyente', label: 'Oyente', description: 'No miembro que asiste' },
  MIEMBRO: { value: 'miembro', label: 'Miembro', description: 'Miembro activo de iglesia' },
} as const

export type AttendanceType = typeof ATTENDANCE_TYPE[keyof typeof ATTENDANCE_TYPE]['value']

// ============================================================================
// UTILITY FUNCTIONS - Funciones Auxiliares
// ============================================================================

/**
 * Convertir enum a opciones de Sanity (para uso en defineField)
 * 
 * @example
 * options: {
 *   list: enumToSanityOptions(EVENT_TYPES)
 * }
 */
export const enumToSanityOptions = <T extends Record<string, { value: string; label: string }>>(
  enumObj: T
) => {
  return Object.values(enumObj).map((item) => ({
    title: item.label,
    value: item.value,
  }))
}

/**
 * Obtener label de un valor enum
 * 
 * @example
 * getEnumLabel(EVENT_TYPES, 'campana') // "Campaña"
 */
export const getEnumLabel = <
  T extends Record<string, { value: string; label: string }>
>(
  enumObj: T,
  value: string
): string => {
  const item = Object.values(enumObj).find((item) => item.value === value)
  return item?.label || value
}

/**
 * Validar que un valor existe en enum
 */
export const isValidEnumValue = <T extends Record<string, { value: string }>>(
  enumObj: T,
  value: unknown
): value is T[keyof T]['value'] => {
  return typeof value === 'string' && Object.values(enumObj).some((item) => item.value === value)
}

// ============================================================================
// REFERENCE GUIDE - Guía Rápida de Uso
// ============================================================================

/*
CÓMO USAR ESTOS ENUMS:

1. EN COMPONENTES REACT:
   ```
   import { EVENT_STATUS, getEnumLabel } from '@/sanity/schemas/enums'
   
   <select value={selectedStatus}>
     {Object.values(EVENT_STATUS).map(status => (
       <option key={status.value} value={status.value}>
         {status.label}
       </option>
     ))}
   </select>
   ```

2. EN QUERIES DE SANITY:
   ```
   *[_type == 'event' && status == 'upcoming']
   ```

3. EN VALIDACIONES:
   ```
   if (!isValidEnumValue(EVENT_TYPES, eventType)) {
     throw new Error('Tipo de evento inválido')
   }
   ```

4. EN GENERACIÓN DE OPCIONES DE FORMULARIO:
   ```
   const vestimentOptions = enumToSanityOptions(DRESS_CODE)
   ```

*/
