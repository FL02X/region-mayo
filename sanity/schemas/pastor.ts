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
 * - Si un pastor está en el sistema, se asume que está ACTIVO (no hay campo activo/inactivo)
 * 
 * AUDITORÍA: registra quién creó, cuándo, quién modificó, cuándo
 * SOFT DELETE: deletedAt permite archivar pastores sin perder datos
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pastor',
  title: 'Pastor',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Información Básica', hidden: true },
    { name: 'contact', title: 'Contacto', hidden: true },
    { name: 'metadata', title: 'Metadatos', hidden: true },
  ],
  indexes: [
    { name: 'byTemplo', keys: [['templo']] },
    { name: 'byRegion', keys: [['region']] },
  ],
  fields: [
    defineField({
      name: 'fullName',
      title: 'NOMBRE COMPLETO',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: '',
    }),
    defineField({
      name: 'photo',
      title: 'FOTO DEL PASTOR',
      type: 'image',
      group: 'basic',
      options: {
        hotspot: true,
      },
      description: 'Foto frontal o de perfil del pastor (IMPORTANTE: Asegurarse de que quede bien encuadrado, y fijarse como queda en el sitio web)',
    }),
    defineField({
      name: 'templo',
      title: 'TEMPLO (OBLIGATORIO)',
      type: 'reference',
      to: [{ type: 'templo' }],
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Templo donde ministra este pastor.',
    }),
    defineField({
      name: 'region',
      title: 'REGIÓN',
      type: 'reference',
      to: [{ type: 'region' }],
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Se llena automáticamente al seleccionar el templo de arriba.',
      readOnly: true,
    }),
    defineField({
      name: 'phone',
      title: 'TELÉFONO WHATSAPP (OPCIONAL)',
      type: 'string',
      group: 'basic',
      description: 'Número de 10 dígitos (opcional). Formato: sin espacios ni +52.',
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
    },
    prepare({ title, temploName, regionName, media }) {
      return {
        title: title,
        subtitle: `${temploName || '?'} (${regionName || '?'})`,
        media: media,
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
