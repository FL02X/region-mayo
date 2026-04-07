/**
 * CORO - Grupo Local / Coro Juvenil
 * 
 * JERARQUÍA: Region → Templo → Coro
 * 
 * CARACTERÍSTICA CLAVE: NO TODOS LOS TEMPLOS TIENEN CORO
 * - Si un templo NO tiene coro, simplemente no se crea documento
 * - Si un coro existe, DEBE estar asociado a un templo
 * - El coro es un grupo que se reúne bajo el templo
 * 
 * DENORMALIZACIÓN INTELIGENTE:
 * - regionName y temploName se copian de sus referencias
 * - Permite queries SIN joins: "listar coros ordenados por templo"
 * - Se actualizan automáticamente cuando región/templo cambia
 * 
 * AUDITORÍA: registra quién creó, cuándo, quién modificó, cuándo
 * SOFT DELETE: deletedAt indica si el coro está activo o no
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'coro',
  title: 'Coro',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Información Básica' },
    { name: 'leader', title: 'Liderazgo' },
    { name: 'location', title: 'Ubicación' },
    { name: 'metadata', title: 'Metadatos' },
  ],
  indexes: [
    { name: 'byTemplo', keys: [['templo']] },
    { name: 'byRegion', keys: [['region']] },
    { name: 'byRegionAndActive', keys: [['region'], ['active']] },
  ],
  fields: [
    defineField({
      name: 'coroName',
      title: 'Nombre del Coro',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Nombre oficial del coro/grupo (ej: "Coro de Jóvenes Centro", "MGR Región X")',
    }),
    defineField({
      name: 'templo',
      title: 'Templo',
      type: 'reference',
      to: [{ type: 'templo' }],
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Templo al que pertenece este coro (OBLIGATORIO)',
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

    // Denormalización: copias de nombres para queries sin join
    defineField({
      name: 'temploName',
      title: 'Nombre del Templo (Denormalizado)',
      type: 'string',
      group: 'basic',
      readOnly: true,
      hidden: true,
      description: 'Copia de templo.temploName para queries rápidas sin join',
    }),
    defineField({
      name: 'regionName',
      title: 'Nombre de la Región (Denormalizado)',
      type: 'string',
      group: 'basic',
      readOnly: true,
      hidden: true,
      description: 'Copia de region.name para queries rápidas sin join',
    }),

    // Leadership
    defineField({
      name: 'presidentName',
      title: 'Nombre del Presidente/Líder',
      type: 'string',
      group: 'leader',
      validation: (Rule) => Rule.required(),
      description: 'Nombre completo del líder del coro',
    }),
    defineField({
      name: 'presidentPhone',
      title: 'Teléfono del Presidente',
      type: 'string',
      group: 'leader',
      description: 'Número de 10 dígitos (sin +52, se agregará automáticamente)',
      validation: (Rule) => Rule.required().regex(/^\d{10}$/, {
        name: 'phoneNumber',
        invert: false,
      }).error('Ingresa un número de 10 dígitos sin espacios ni guiones'),
    }),

    // Location
    defineField({
      name: 'photo',
      title: 'Foto del Coro',
      type: 'image',
      group: 'location',
      options: {
        hotspot: true,
      },
      description: 'Foto de grupo o reunión del coro',
    }),
    defineField({
      name: 'googleMapsUrl',
      title: 'URL de Google Maps',
      type: 'url',
      group: 'location',
      description: 'URL de la ubicación donde se reúne el coro',
    }),

    // Status
    defineField({
      name: 'active',
      title: 'Coro Activo',
      type: 'boolean',
      group: 'metadata',
      initialValue: true,
      description: 'Marcar como inactivo si el coro ya no está operando',
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
      title: 'coroName',
      temploName: 'templo.temploName',
      regionName: 'region.name',
      subtitle: 'presidentName',
      media: 'photo',
      active: 'active',
    },
    prepare({ title, temploName, regionName, subtitle, active }) {
      return {
        title: title,
        subtitle: `${temploName || '?'} • ${regionName || '?'} • ${subtitle || '?'}${!active ? ' [INACTIVO]' : ''}`,
      }
    },
  },
  orderings: [
    {
      title: 'Nombre del Coro',
      name: 'nameAsc',
      by: [{ field: 'coroName', direction: 'asc' }],
    },
    {
      title: 'Por Templo',
      name: 'temploAsc',
      by: [{ field: 'temploName', direction: 'asc' }, { field: 'coroName', direction: 'asc' }],
    },
  ],
})
