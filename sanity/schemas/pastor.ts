/**
 * PASTOR - Líder Espiritual del Templo
 * 
 * JERARQUÍA: Region → Templo → Pastor
 * 
 * RELACIÓN CLAVE:
 * - UNO-A-UNO: un pastor = un templo (un pastor NO puede estar en múltiples templos)
 * - El pastor es el contacto principal del templo
 * - Su teléfono y nombre se heredan a la UI del templo para mostrar contacto
 * 
 * RESTRICCIONES:
 * - templo: obligatorio (un pastor siempre pertenece a un templo)
 * - region: obligatoria, heredada del templo, readOnly (para queries rápidas)
 * - La región del pastor DEBE coincidir con la región del templo
 * 
 * AUDITORÍA: registra quién creó, cuándo, quién modificó, cuándo
 * SOFT DELETE: deletedAt indica si el pastor está activo o no
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pastor',
  title: 'Pastor',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Información Básica' },
    { name: 'contact', title: 'Contacto' },
    { name: 'metadata', title: 'Metadatos' },
  ],
  indexes: [
    { name: 'byTemplo', keys: [['templo']] },
    { name: 'byRegion', keys: [['region']] },
    { name: 'byRegionAndActive', keys: [['region'], ['active']] },
  ],
  fields: [
    defineField({
      name: 'fullName',
      title: 'Nombre Completo',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Nombre oficial y completo del pastor',
    }),
    defineField({
      name: 'templo',
      title: 'Templo',
      type: 'reference',
      to: [{ type: 'templo' }],
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Templo al que pertenece este pastor (OBLIGATORIO). Un pastor está en UN SOLO templo. Su teléfono y nombre se mostrarán en la UI del templo.',
    }),
    defineField({
      name: 'region',
      title: 'Región',
      type: 'reference',
      to: [{ type: 'region' }],
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Región (heredada del templo, readOnly para consultas optimizadas)',
      readOnly: true,
    }),
    defineField({
      name: 'photo',
      title: 'Foto',
      type: 'image',
      group: 'contact',
      options: {
        hotspot: true,
      },
      description: 'Foto frontal o de perfil del pastor',
    }),
    defineField({
      name: 'phone',
      title: 'Teléfono WhatsApp',
      type: 'string',
      group: 'contact',
      description: 'Número de WhatsApp (opcional). Formato: 10 dígitos sin espacios ni +52.',
      validation: (Rule) => Rule.regex(/^(\d{10})?$/, {
        name: 'phone',
        invert: false,
      }).error('Debe ser 10 dígitos o dejarse vacío'),
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
      temploName: 'templo.temploName',
      regionName: 'region.name',
      media: 'photo',
      active: 'active',
    },
    prepare({ title, temploName, regionName, active }) {
      return {
        title: title,
        subtitle: `${temploName || '?'} (${regionName || '?'})${!active ? ' [INACTIVO]' : ''}`,
      }
    },
  },
  orderings: [
    {
      title: 'Nombre',
      name: 'nameAsc',
      by: [{ field: 'fullName', direction: 'asc' }],
    },
  ],
})
