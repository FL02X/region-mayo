/**
 * DIRECTIVA - Líderes Administrativos
 * 
 * FLEXIBILIDAD MULTILEVEL:
 * - Si templo = vacío → DIRECTIVA REGIONAL
 * - Si templo = lleno → DIRECTIVA LOCAL (de ese templo)
 * 
 * Esto permite escalar a múltiples niveles jerárquicos sin cambiar schema
 * 
 * RESTRICCIONES:
 * - region: SIEMPRE obligatoria
 * - templo: OPCIONAL
 *   • Si está vacío: directiva regional que sirve toda la región
 *   • Si está lleno: directiva local del templo
 * - role: ENUM (valores predefinidos para consistencia)
 * 
 * AUDITORÍA: registra quién creó, cuándo, quién modificó, cuándo
 * SOFT DELETE: deletedAt indica si está activa o jubilada
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'directiva',
  title: 'Miembro de Directiva',
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
      name: 'role',
      title: 'Cargo/Posición',
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
      description: 'Selecciona el cargo. IMPORTANTE: esto define si es regional o local',
    }),
    defineField({
      name: 'roleCustom',
      title: 'Descripción Personalizada de Cargo',
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
      description: 'Región (SIEMPRE obligatoria)',
    }),
    defineField({
      name: 'templo',
      title: 'Templo (Opcional)',
      type: 'reference',
      to: [{ type: 'templo' }],
      group: 'basic',
      description: 'Templo (vacío = directiva regional; lleno = directiva local de ese templo)',
    }),
    defineField({
      name: 'photo',
      title: 'Foto',
      type: 'image',
      group: 'contact',
      options: {
        hotspot: true,
      },
      description: 'Foto frontal o de perfil',
    }),
    defineField({
      name: 'phone',
      title: 'Teléfono (WhatsApp)',
      type: 'string',
      group: 'contact',
      validation: (Rule) => Rule.required().regex(/^\d{10}$/, {
        name: 'phoneNumber',
        invert: false,
      }).error('Ingresa un número de 10 dígitos sin espacios ni guiones'),
      description: 'Número de 10 dígitos para contacto por WhatsApp',
    }),
    defineField({
      name: 'order',
      title: 'Orden de Aparición',
      type: 'number',
      group: 'order',
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
      description: 'Número para ordenar la lista (menor = aparece primero). Ej: 1, 2, 3...',
    }),
    defineField({
      name: 'active',
      title: 'Directiva Activa',
      type: 'boolean',
      group: 'metadata',
      initialValue: true,
      description: 'Marcar como inactiva si está jubilada o cambió de posición',
    }),

    // Auditoría
    defineField({
      name: '_audit',
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
      active: 'active',
    },
    prepare({ title, role, roleCustom, temploName, regionName, active }) {
      const roleLabel = roleCustom || role
      const level = temploName ? `Local (${temploName})` : 'Regional'
      return {
        title: title,
        subtitle: `${roleLabel || '?'} • ${level} • ${regionName || '?'}${!active ? ' [INACTIVO]' : ''}`,
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
