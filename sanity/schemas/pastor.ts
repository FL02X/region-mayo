/**
 * Pastor Schema for Sanity CMS
 * Directorio de Pastores
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pastor',
  title: 'Pastor',
  type: 'document',
  fields: [
    defineField({
      name: 'fullName',
      title: 'Nombre Completo',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'churchName',
      title: 'Nombre de la Iglesia',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'churchNumber',
      title: 'Número de Iglesia',
      type: 'string',
      description: 'Número identificador de la iglesia (ej: 01, 02)',
    }),
    defineField({
      name: 'photo',
      title: 'Foto',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'googleMapsUrl',
      title: 'URL de Google Maps',
      type: 'url',
      description: 'Link a la ubicación de la iglesia',
    }),
    defineField({
      name: 'phone',
      title: 'Teléfono WhatsApp',
      type: 'string',
      description: 'Número de WhatsApp (opcional - solo si el pastor desea compartirlo). Formato: 10 dígitos sin espacios.',
    }),
    defineField({
      name: 'region',
      title: 'Región',
      type: 'reference',
      to: [{ type: 'region' }],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'fullName',
      subtitle: 'churchName',
      media: 'photo',
    },
  },
  orderings: [
    {
      title: 'Nombre',
      name: 'nameAsc',
      by: [{ field: 'fullName', direction: 'asc' }],
    },
    {
      title: 'Número de Iglesia',
      name: 'churchNumberAsc',
      by: [{ field: 'churchNumber', direction: 'asc' }],
    },
  ],
})
