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
      title: 'NOMBRE DEL CORO',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: '',
    }),
    defineField({
      name: 'presidentName',
      title: 'NOMBRE DEL PRESIDENTE DEL CORO',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: '',
    }),
    defineField({
      name: 'presidentPhone',
      title: 'TELEFONO DEL PRESIDENTE (OPCIONAL)',
      type: 'string',
      group: 'basic',
      description: 'Número de 10 dígitos. Formato: SIN espacios NI +52.',
      validation: (Rule) => Rule.regex(/^(\d{10})?$/, {
        name: 'phoneNumber',
        invert: false,
      }).error('Debe ser 10 dígitos o dejarse vacío'),
    }),
    defineField({
      name: 'templo',
      title: 'TEMPLO DEL CORO (OBLIGATORIO)',
      type: 'reference',
      to: [{ type: 'templo' }],
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'El templo donde se reúne este coro-',
    }),
    defineField({
      name: 'region',
      title: 'Región',
      type: 'reference',
      to: [{ type: 'region' }],
      group: 'basic',
      description: 'Se llena automáticamente desde el templo',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'photo',
      title: 'FOTO DEL CORO',
      type: 'image',
      group: 'basic',
      options: {
        hotspot: true,
      },
      description: 'Foto de grupo o de una reunión del coro',
    }),
    defineField({
      name: 'temploName',
      title: 'Nombre del Templo (Denormalizado)',
      type: 'string',
      group: 'basic',
      readOnly: true,
      hidden: true,
      description: 'Se actualiza automáticamente',
    }),
    defineField({
      name: 'regionName',
      title: 'Nombre de la Región (Denormalizado)',
      type: 'string',
      group: 'basic',
      readOnly: true,
      hidden: true,
      description: 'Se actualiza automáticamente',
    }),
    // Nota: Los coros se asumen ACTIVOS. Si una congregación no tiene coro, simplemente no se crea documento.

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
      title: 'coroName',
      temploName: 'templo.temploName',
      regionName: 'region.name',
      subtitle: 'presidentName',
      media: 'photo',
    },
    prepare({ title, temploName, regionName, subtitle, media }) {
      return {
        title: title,
        subtitle: `${temploName || '?'} • ${regionName || '?'} • ${subtitle || '?'}`,
        media: media,
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
