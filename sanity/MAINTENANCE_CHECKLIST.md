/**
 * CHECKLIST DE IMPLEMENTACIÓN Y MANTENIMIENTO
 * 
 * Lista de acciones obligatorias y recomendadas para mantener
 * la integridad y performance de la base de datos Sanity
 * 
 * Actualizar este archivo cuando se completen tareas
 */

// ============================================================================
// FASE 1: IMPLEMENTACIÓN INMEDIATA (Esta semana)
// ============================================================================

export const PHASE_1_IMMEDIATE = [
  {
    task: '[ ] Revisar archivo SCHEMA_DECISIONS.md',
    description: 'Leer y entender decisiones de diseño',
    owner: 'Tech Lead',
    priority: 'CRITICAL',
    estimatedHours: 2,
  },
  {
    task: '[ ] Revisar archivo validationHooks.ts',
    description: 'Entender qué validaciones se necesitan implementar',
    owner: 'Backend Developer',
    priority: 'HIGH',
    estimatedHours: 1,
  },
  {
    task: '[ ] Revisar archivo enums.ts',
    description: 'Familiarizarse con valores enumerados válidos',
    owner: 'All Team',
    priority: 'MEDIUM',
    estimatedHours: 1,
  },
  {
    task: '[ ] Crear hooks en sanity.config.ts para _audit',
    description: `Implementar auto-llenado de createdBy, modifiedBy, timestamps
                  Ver: https://www.sanity.io/docs/webhooks`,
    owner: 'Backend Developer',
    priority: 'CRITICAL',
    estimatedHours: 4,
  },
  {
    task: '[ ] Crear helper function: convertir Sanity user.id a UID',
    description: 'Para guardar createdBy/modifiedBy de usuario actual',
    owner: 'Backend Developer',
    priority: 'HIGH',
    estimatedHours: 2,
  },
  {
    task: '[ ] Validar que indexación está activa en Sanity',
    description: 'Checkear en Sanity Dashboard que índices se crearon',
    owner: 'DevOps',
    priority: 'HIGH',
    estimatedHours: 1,
  },
  {
    task: '[ ] Entrenar equipo en uso de enums',
    description: 'Demo de cómo usar enums en queries y frontend',
    owner: 'Tech Lead',
    priority: 'MEDIUM',
    estimatedHours: 1,
  },
]

// ============================================================================
// FASE 2: VALIDACIÓN Y TESTING (Próximas 2 semanas)
// ============================================================================

export const PHASE_2_VALIDATION = [
  {
    task: '[ ] Verificar _audit fields en documentos nuevos',
    description: `Crear un pastor/evento y chequear que _audit se llena
                  Expected: createdBy !== null, createdAt !== null`,
    owner: 'QA Engineer',
    priority: 'CRITICAL',
    estimatedHours: 2,
  },
  {
    task: '[ ] Probar soft delete en desarrollo',
    description: `Marcar documento como deletedAt = now()
                  Verificar queries excluyen documentos con deletedAt`,
    owner: 'Developer',
    priority: 'HIGH',
    estimatedHours: 2,
  },
  {
    task: '[ ] Ejecutar query de integridad referencial',
    description: `Ver validationHooks.ts
                  Buscar pastores cuyo templo no existe
                  Corregir inconsistencias encontradas`,
    owner: 'Database Admin',
    priority: 'CRITICAL',
    estimatedHours: 3,
  },
  {
    task: '[ ] Crear test unitarios para enums',
    description: `Tests para isValidEnumValue(), enumToSanityOptions()
                  Verificar que frontendvalida contra valores reales`,
    owner: 'Developer',
    priority: 'MEDIUM',
    estimatedHours: 2,
  },
  {
    task: '[ ] Benchmarking de queries con índices',
    description: `Comparar velocidad:
                  - Query sin índice vs con índice
                  - Query simple vs query con join
                  Documentar resultados`,
    owner: 'DevOps',
    priority: 'MEDIUM',
    estimatedHours: 3,
  },
  {
    task: '[ ] Validar geolocalización en Templo',
    description: `Crear templo con location (geopoint)
                  Verificar que Google Maps integration funciona
                  Probar distancia/clustering`,
    owner: 'Frontend Developer',
    priority: 'MEDIUM',
    estimatedHours: 2,
  },
]

// ============================================================================
// FASE 3: MONITOREO Y DOCUMENTACIÓN (Primer mes)
// ============================================================================

export const PHASE_3_MONITORING = [
  {
    task: '[ ] Crear README.md sobre estructura de datos',
    description: 'Documentación para nuevos team members',
    owner: 'Tech Lead',
    priority: 'HIGH',
    estimatedHours: 4,
  },
  {
    task: '[ ] Crear dashboard de auditoría',
    description: `Analytics queries como:
                  - "Quién modificó qué y cuándo"
                  - "Cambios por usuario"
                  - "Documentos más modificados"`,
    owner: 'DevOps',
    priority: 'MEDIUM',
    estimatedHours: 8,
  },
  {
    task: '[ ] Plan de backup para soft-deleted docs',
    description: 'Documentar cómo recuperar deleted documents si es necesario',
    owner: 'DevOps',
    priority: 'HIGH',
    estimatedHours: 2,
  },
  {
    task: '[ ] Crear alerta si _audit field está vacío',
    description: 'Monitoreo: si createdBy === null, alertar',
    owner: 'DevOps',
    priority: 'HIGH',
    estimatedHours: 2,
  },
  {
    task: '[ ] Script de sincronización de denormalización',
    description: `Semanal: sync temploName/regionName en Coro
                  En caso de cambios de referencias`,
    owner: 'Backend Developer',
    priority: 'MEDIUM',
    estimatedHours: 4,
  },
]

// ============================================================================
// FASE 4: ESCALA Y OPTIMIZACIÓN (A largo plazo)
// ============================================================================

export const PHASE_4_LONGTERM = [
  {
    task: '[ ] Implementar archiving de registrations > 1 año',
    description: `Mover registrations viejos a cold storage
                  Mantener solo últimos 12 meses en BD caliente`,
    owner: 'DevOps',
    frequency: 'Quarterly',
    priority: 'MEDIUM',
    estimatedHours: 8,
  },
  {
    task: '[ ] Implementar full-text search',
    description: `Cuando cuenten con 100K+ documentos
                  Índices de texto completo en pastores, eventos`,
    owner: 'Backend Developer',
    priority: 'LOW',
    estimatedHours: 12,
  },
  {
    task: '[ ] Agregar versionamiento completo',
    description: `Historial de TODOS los cambios de datos
                  Ejemplo: "qué pasó con este pastor en los últimos 6 meses"`,
    owner: 'DevOps',
    priority: 'LOW',
    estimatedHours: 16,
  },
  {
    task: '[ ] Implementar permiso granular (futuro)',
    description: `Solo si ya no es "equipo en confianza"
                  Sistema de roles: admin, editor, viewer`,
    owner: 'Security',
    priority: 'LOW',
    estimatedHours: 20,
  },
]

// ============================================================================
// AUDITORÍAS PERIÓDICAS (Recurrentes)
// ============================================================================

export const RECURRING_AUDITS = [
  {
    frequency: 'WEEKLY',
    dayOfWeek: 'Monday',
    time: '9:00 AM',
    tasks: [
      {
        task: 'Ejecutar query de integridad referencial',
        description: 'Ver validationHooks.ts - buscar orfandad',
        owner: 'Database Admin',
        estimatedMinutes: 15,
      },
      {
        task: 'Revisar logs de auditoría (_audit)',
        description: 'Cambios inusuales o sospechosos?',
        owner: 'Tech Lead',
        estimatedMinutes: 30,
      },
    ],
  },
  {
    frequency: 'MONTHLY',
    dayOfMonth: 1,
    time: '10:00 AM',
    tasks: [
      {
        task: 'Sincronizar denormalización (temploName, regionName)',
        description: 'Ejecutar script de sync en Coro',
        owner: 'Backend Developer',
        estimatedMinutes: 10,
      },
      {
        task: 'Review de performance: query speed',
        description: 'Verificar índices están siendo usados',
        owner: 'DevOps',
        estimatedMinutes: 30,
      },
      {
        task: 'Backup verification',
        description: 'Testear que backups se restauran correctamente',
        owner: 'DevOps',
        estimatedMinutes: 45,
      },
    ],
  },
  {
    frequency: 'QUARTERLY',
    tasks: [
      {
        task: 'Análisis de datos: crec deletedAt vs total',
        description: 'Cuántos documentos están "borrados"?',
        owner: 'Analytics',
        estimatedMinutes: 20,
      },
      {
        task: 'Archive old registrations (> 1 año)',
        description: 'Mantener BD limpia y veloz',
        owner: 'DevOps',
        estimatedMinutes: 60,
      },
      {
        task: 'Security review: quién accedió qué',
        description: 'Revisar _audit para accesos no autorizados',
        owner: 'Security',
        estimatedMinutes: 60,
      },
    ],
  },
]

// ============================================================================
// TROUBLESHOOTING - Esquemas Comunes de Problemas
// ============================================================================

export const TROUBLESHOOTING = {
  'fields _audit están vacías': {
    cause: 'Hooks no están poblando los campos',
    solution: `1. Verificar sanity.config.ts tiene hooks configurados
               2. Chequear logs del webhook
               3. Verificar usuario está logado cuando hace cambios`,
    prevention: 'Crear test que verifica _audit es siempre != null',
  },

  'Query lenta en documentos con muchos registros': {
    cause: 'Query sin usar índice, o índice no está en SANITY',
    solution: `1. Verificar en Sanity Dashboard que índice existe
               2. Usar explain() para entender query plan
               3. Agregar índice si falta`,
    prevention: 'Siempre usar índices para queries frecuentes',
  },

  'temploName desincronizado de templo.temploName': {
    cause: 'Cambio en templo.name no se propagó a coros',
    solution: `1. Ejecutar script de sincronización
               2. Ver validationHooks.ts para queries de detección`,
    prevention: 'Sincronización automática semanal',
  },

  'Pastor en región diferente a su templo': {
    cause: 'Campo region editable cuando debería ser readOnly',
    solution: `1. Verificar campo region es readOnly: true
               2. Si no, reportar como bug
               3. Corregir manualmente el documento`,
    prevention: 'Test de integridad semanal',
  },

  'No puedo encontrar documento "borrado"': {
    cause: 'Soft delete: documento no aparece en queries',
    solution: `Query incluye: *[_type == 'pastor' && !deletedAt]
               Para ver TODOS incluida deleted:
               *[_type == 'pastor']
               Busca documentos con deletedAt != null`,
    prevention: 'Documentación clara sobre soft delete',
  },
}

// ============================================================================
// CONTACTOS Y REFERENCIAS
// ============================================================================

export const CONTACTS = {
  tech_lead: 'Tech Lead - Para decisiones arquitectónicas',
  backend_dev: 'Backend Developer - Para hooks y validaciones',
  devops: 'DevOps - Para backups, índices, performance',
  database_admin: 'Database Admin - Para integridad referencial',
}

export const REFERENCES = {
  sanity_docs: 'https://www.sanity.io/docs',
  sanity_webhooks: 'https://www.sanity.io/docs/webhooks',
  validation_hooks: './validationHooks.ts',
  enum_reference: './enums.ts',
  design_decisions: '../SCHEMA_DECISIONS.md',
}

// ============================================================================
// COMPLETADO (Histórico)
// ============================================================================

export const COMPLETED = [
  {
    date: '2026-04-07',
    task: 'Agregar auditoría a todos los schemas',
    completedBy: 'Copilot',
  },
  {
    date: '2026-04-07',
    task: 'Agregar soft delete a documentos clave',
    completedBy: 'Copilot',
  },
  {
    date: '2026-04-07',
    task: 'Agregar geolocalización a Templo',
    completedBy: 'Copilot',
  },
  {
    date: '2026-04-07',
    task: 'Crear archivo de validación hooks',
    completedBy: 'Copilot',
  },
  {
    date: '2026-04-07',
    task: 'Crear diccionario de enums',
    completedBy: 'Copilot',
  },
]
