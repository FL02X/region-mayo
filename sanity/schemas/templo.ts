/**
 * TEMPLO - Iglesia / Congregación Local
 * 
 * Documento que representa una iglesia física local dentro de una región.
 * Agrupa pastores, coros/grupos y puede tener directiva local.
 * 
 * JERARQUÍA: Region → Templo → (Pastor, Coro, Directiva Local)
 * 
 * RESTRICCIONES:
 * - region: OBLIGATORIA (todos los templos deben estar en una región)
 * - churchNumber: ÚNICO por región (ej: 01, 02, 101 en región "Centro")
 * - Un templo puede tener:
 *   • N pastores (mínimo 1)
 *   • 0 a N coros (NO es obligatorio)
 *   • 0 a N directiva local
 * 
 * AUDITORÍA: registra quién creó, cuándo, quién modificó, cuándo
 * SOFT DELETE: deletedAt indica si el templo está o no en operación
 * GEOLOCALIZACIÓN: geopoint para análisis de proximidad y mapas
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'templo',
  title: 'Templo',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Información Básica' },
    { name: 'location', title: 'Ubicación' },
    { name: 'contact', title: 'Contacto' },
    { name: 'metadata', title: 'Metadatos' },
  ],
  indexes: [
    { name: 'byRegion', keys: [['region']] },
    { name: 'byRegionAndActive', keys: [['region'], ['active']] },
    { name: 'byChurchNumber', keys: [['churchNumber']] },
  ],
  fields: [
    // Basic Info
    defineField({
      name: 'temploName',
      title: 'Nombre del Templo',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Nombre oficial y completo de la iglesia (ej: "Iglesia el Redentor")',
    }),
    defineField({
      name: 'churchNumber',
      title: 'Número de Iglesia',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Identificador único DENTRO de la región (ej: 01, 002, 101). Usado para ordenamiento y referencias históricas.',
    }),
    defineField({
      name: 'region',
      title: 'Región',
      type: 'reference',
      to: [{ type: 'region' }],
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Región obligatoria a la que pertenece este templo',
    }),

    // Location Info
    defineField({
      name: 'address',
      title: 'Dirección Completa',
      type: 'string',
      group: 'location',
      description: 'Dirección física del templo (calle, número, ciudad, estado)',
    }),
    defineField({
      name: 'location',
      title: 'Geolocalización',
      type: 'geopoint',
      group: 'location',
      description: 'Ubicación GPS para análisis de proximidad y mapas interactivos',
    }),
    defineField({
      name: 'googleMapsUrl',
      title: 'URL de Google Maps',
      type: 'url',
      group: 'location',
      description: 'Link de Google Maps a la ubicación del templo (copiar desde maps.google.com)',
    }),

    // Contact Info
    defineField({
      name: 'phone',
      title: 'Teléfono del Templo',
      type: 'string',
      group: 'contact',
      description: 'Teléfono general del templo (opcional, 10 dígitos sin +52)',
      validation: (Rule) => Rule.regex(/^(\d{10})?$/, {
        name: 'phone',
        invert: false,
      }).error('Debe ser 10 dígitos o dejarse vacío'),
    }),
    defineField({
      name: 'photo',
      title: 'Foto del Templo',
      type: 'image',
      group: 'contact',
      options: {
        hotspot: true,
      },
      description: 'Foto frontal o interior del templo',
    }),

    // Status and Metadata
    defineField({
      name: 'active',
      title: 'Templo Activo',
      type: 'boolean',
      group: 'metadata',
      initialValue: true,
      description: 'Marcar como inactivo si el templo ha sido cerrado o desactivado',
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
      title: 'temploName',
      churchNumber: 'churchNumber',
      regionName: 'region.name',
      media: 'photo',
      active: 'active',
    },
    prepare({ title, churchNumber, regionName, active }) {
      return {
        title: title,
        subtitle: `${regionName || '?'} • Iglesia No. ${churchNumber || '?'}${!active ? ' (INACTIVO)' : ''}`,
      }
    },
  },
  orderings: [
    {
      title: 'Nombre del Templo',
      name: 'nameAsc',
      by: [{ field: 'temploName', direction: 'asc' }],
    },
    {
      title: 'Número de Iglesia',
      name: 'churchNumberAsc',
      by: [{ field: 'churchNumber', direction: 'asc' }],
    },
  ],
})
