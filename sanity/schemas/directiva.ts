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

export default defineType({
  name: 'directiva',
  title: 'Directiva',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Información Básica' },
    { name: 'contact', title: 'Contacto' },
    { name: 'order', title: 'Ordenamiento' },
    { name: 'metadata', title: 'Metadatos' },
  ],
  indexes: [
    { name: 'byRegion', keys: [['region']] },
    { name: 'byTemplo', keys: [['templo']] },
    { name: 'byRegionAndOrder', keys: [['region'], ['order']] },
    { name: 'byRole', keys: [['role']] },
  ],
  fields: [
    defineField({
      name: 'fullName',
      title: 'Nombre Completo',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Nombre oficial y completo del miembro de directiva',
    }),
    defineField({
      name: 'photo',
      title: 'Foto',
      type: 'image',
      group: 'basic',
      options: {
        hotspot: true,
      },
      description: 'Foto frontal o de perfil',
    }),
    defineField({
      name: 'role',
      title: 'Cargo o Posición',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          { title: 'Presidente Regional', value: 'president_regional' },
          { title: 'Vicepresidente Regional', value: 'vice_president_regional' },
          { title: 'Secretaria Regional', value: 'secretary_regional' },
          { title: 'Tesorera Regional', value: 'treasurer_regional' },
          { title: 'Presidente Local', value: 'president_local' },
          { title: 'Vicepresidente Local', value: 'vice_president_local' },
          { title: 'Secretaria Local', value: 'secretary_local' },
          { title: 'Tesorera Local', value: 'treasurer_local' },
          { title: 'Coordinador de Eventos', value: 'event_coordinator' },
          { title: 'Coordinadora de Ministerio Femenino', value: 'womens_ministry' },
          { title: 'Coordinador de Ministerio Juvenil', value: 'youth_ministry' },
          { title: 'Otro', value: 'other' },
        ],
        layout: 'dropdown',
      },
      description: 'Selecciona el cargo que desempeña',
    }),
    defineField({
      name: 'roleCustom',
      title: 'Especificar Otro Cargo',
      type: 'string',
      group: 'basic',
      hidden: ({ document }) => document?.role !== 'other',
      description: 'Si seleccionaste "Otro", describe el cargo aquí',
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
      title: 'Templo',
      type: 'reference',
      to: [{ type: 'templo' }],
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'El templo al que está asignado este miembro de directiva (obligatorio). Se mostrarán la dirección, pastor y detalles del templo.',
    }),
    defineField({
      name: 'phone',
      title: 'Teléfono WhatsApp',
      type: 'string',
      group: 'contact',
      validation: (Rule) => Rule.regex(/^(\d{10})?$/, {
        name: 'phoneNumber',
        invert: false,
      }).error('Debe ser 10 dígitos o dejarse vacío'),
      description: 'Número de 10 dígitos (opcional). Formato: sin espacios ni +52.',
    }),
    defineField({
      name: 'order',
      title: 'Orden de Aparición',
      type: 'number',
      group: 'order',
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
      description: 'Número para ordenar en la lista (0 = primero)',
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
      roleCustom: 'roleCustom',
      temploName: 'templo.temploName',
      regionName: 'region.name',
      media: 'photo',
    },
    prepare({ title, role, roleCustom, temploName, regionName }) {
      const roleLabel = roleCustom || role
      const location = temploName || regionName || '?'
      return {
        title: title,
        subtitle: `${roleLabel || '?'} • ${location}`,
      }
    },
  },
  orderings: [
    {
      title: 'Orden de Aparición',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }, { field: 'fullName', direction: 'asc' }],
    },
    {
      title: 'Nombre',
      name: 'nameAsc',
      by: [{ field: 'fullName', direction: 'asc' }],
    },
    {
      title: 'Por Cargo',
      name: 'roleAsc',
      by: [{ field: 'role', direction: 'asc' }, { field: 'order', direction: 'asc' }],
    },
  ],
})
