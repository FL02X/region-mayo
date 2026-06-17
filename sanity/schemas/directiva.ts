/**
 * DIRECTIVA - Líderes Administrativos
 * 
 * JERARQUÍA: Region + Templo → Directiva
 * 
 * CARACTERÍSTICAS:
 * - Cada miembro de directiva está asignado a un templo (obligatorio)
 * - Todos los miembros actualmente son de directiva local (no hay directiva regional)
 * - Si un miembro está en el sistema, se asume que está ACTIVO (no hay campo activo/inactivo)
 * - Los datos de dirección, pastor, etc. se heredan del templo asignado
 * 
 * RESTRICCIONES:
 * - region: SIEMPRE obligatoria (heredada del templo)
 * - role: ENUM (valores predefinidos para consistencia)
 * - templo: OBLIGATORIO (cada directiva está asignada a un templo específico)
 * 
 * AUDITORÍA: registra quién creó, cuándo, quién modificó, cuándo
 * SOFT DELETE: deletedAt permite archivar miembros sin perder datos
 */

import { defineType, defineField } from 'sanity'

const ROLE_OPTIONS = [
  { title: 'Presidente Regional', value: '01_presidente_regional' },
  { title: 'Suplente Presidente Regional', value: '02_suplente_presidente_regional' },
  { title: 'Secretario', value: '03_secretario' },
  { title: 'Suplente Secretario', value: '04_suplente_secretario' },
  { title: 'Cronista', value: '05_cronista' },
  { title: 'Suplente de Cronista', value: '06_suplente_cronista' },
  { title: 'Estadística', value: '07_estadistica' },
  { title: 'Suplente de Estadística', value: '08_suplente_estadistica' },
  { title: 'Tesoreria', value: '09_tesorera' },
  { title: 'Suplente de Tesoreria', value: '10_suplente_tesorera' },
  { title: 'Director de Canto', value: '11_director_canto' },
  { title: 'Suplente de Director de Canto', value: '12_suplente_director_canto' },
  { title: 'Director de Música', value: '13_director_musica' },
  { title: 'Suplente de Director de Música', value: '14_suplente_director_musica' },
]

const ROLE_LABEL_BY_VALUE = Object.fromEntries(ROLE_OPTIONS.map(({ title, value }) => [value, title]))

export default defineType({
  name: 'directiva',
  title: 'Directiva',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Información Básica', hidden: true },
    { name: 'contact', title: 'Contacto', hidden: true },
    { name: 'order', title: 'Ordenamiento', hidden: true },
    { name: 'metadata', title: 'Metadatos', hidden: true },
  ],
  indexes: [
    { name: 'byRegion', keys: [['region']] },
    { name: 'byTemplo', keys: [['templo']] },
    { name: 'byRegionAndRole', keys: [['region'], ['role']] },
    { name: 'byRole', keys: [['role']] },
  ],
  fields: [
    defineField({
      name: 'fullName',
      title: 'NOMBRE COMPLETO',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Nombre completo del miembro de directiva',
    }),
    defineField({
      name: 'photo',
      title: 'FOTO',
      type: 'image',
      group: 'basic',
      options: {
        hotspot: true,
      },
      description: 'Foto frontal o de perfil',
    }),
    defineField({
      name: 'role',
      title: 'CARGO',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      options: {
        list: ROLE_OPTIONS,
        layout: 'dropdown',
      },
      description: 'Selecciona el cargo que desempeña',
    }),
    defineField({
      name: 'region',
      title: 'Región',
      type: 'reference',
      to: [{ type: 'region' }],
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'La región a la que pertenece (obligatorio)',
    }),
    defineField({
      name: 'templo',
      title: 'TEMPLO AL QUE ASISTE (OBLIGATORIO)',
      type: 'reference',
      to: [{ type: 'templo' }],
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'El templo al que está asignado este miembro de directiva. Se mostrarán la dirección, pastor y detalles del templo.',
    }),
    defineField({
      name: 'phone',
      title: 'TELÉFONO WHATSAPP (OPCIONAL)',
      type: 'string',
      group: 'contact',
      validation: (Rule) => Rule.regex(/^(\d{10})?$/, {
        name: 'phoneNumber',
        invert: false,
      }).error('Debe ser 10 dígitos o dejarse vacío'),
      description: 'Número de 10 dígitos. Formato: sin espacios ni +52.',
    }),
    defineField({
      name: 'order',
      title: 'Orden de Aparición',
      type: 'number',
      group: 'order',
      hidden: true,
      readOnly: true,
      description: 'Campo heredado: el orden ahora se determina automáticamente por el cargo.',
    }),

    // Auditoría
    defineField({
      name: 'audit',
      title: 'Auditoría',
      type: 'object',
      group: 'metadata',
      description: 'Información de quién creó/modificó este registro',
      hidden: true,
      fields: [
        defineField({
          name: 'createdBy',
          title: 'Creado por (UID)',
          type: 'string',
          readOnly: true,
        }),
        defineField({
          name: 'createdAt',
          title: 'Fecha de Creación',
          type: 'datetime',
          readOnly: true,
        }),
        defineField({
          name: 'modifiedBy',
          title: 'Modificado por (UID)',
          type: 'string',
          readOnly: true,
        }),
        defineField({
          name: 'modifiedAt',
          title: 'Fecha de Última Modificación',
          type: 'datetime',
          readOnly: true,
        }),
      ],
    }),

    // Soft Delete
    defineField({
      name: 'deletedAt',
      title: 'Eliminado en',
      type: 'datetime',
      group: 'metadata',
      hidden: true,
      description: 'Timestamp de eliminación lógica (soft delete)',
    }),
  ],
  preview: {
    select: {
      title: 'fullName',
      role: 'role',
      temploName: 'templo.temploName',
      regionName: 'region.name',
      media: 'photo',
    },
    prepare({ title, role, temploName, regionName, media }) {
      const roleLabel = ROLE_LABEL_BY_VALUE[role] || role
      const roleOrder = role ? Number.parseInt(role.split('_')[0], 10) : NaN
      const location = temploName || regionName || '?'
      return {
        title: title,
        subtitle: `${Number.isFinite(roleOrder) ? `${roleOrder}. ` : ''}${roleLabel || '?'} • ${location}`,
        media: media,
      }
    },
  },
  orderings: [
    {
      title: 'Orden Jerárquico',
      name: 'hierarchyAsc',
      by: [{ field: 'role', direction: 'asc' }, { field: 'fullName', direction: 'asc' }],
    },
    {
      title: 'Nombre',
      name: 'nameAsc',
      by: [{ field: 'fullName', direction: 'asc' }],
    },
    {
      title: 'Por Cargo',
      name: 'roleAsc',
      by: [{ field: 'role', direction: 'asc' }, { field: 'fullName', direction: 'asc' }],
    },
  ],
})
