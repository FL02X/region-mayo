/**
 * Coro Schema for Sanity CMS
 * Coros Locales
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'coro',
  title: 'Coro',
  type: 'document',
  fields: [
    defineField({
      name: 'coroName',
      title: 'Nombre del Coro',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Foto del Coro',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'googleMapsUrl',
      title: 'URL de Google Maps',
      type: 'url',
      description: 'Link a la ubicación donde se reúne el coro',
    }),
    defineField({
      name: 'presidentName',
      title: 'Nombre del Presidente',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'presidentPhone',
      title: 'Teléfono del Presidente',
      type: 'string',
      description: 'Número de 10 dígitos (sin código de país, se añadirá +52 automáticamente)',
      validation: (Rule) => Rule.required().regex(/^\d{10}$/, {
        name: 'phoneNumber',
        invert: false,
      }).error('Ingresa un número de 10 dígitos sin espacios ni guiones'),
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
      title: 'coroName',
      subtitle: 'presidentName',
      media: 'photo',
    },
  },
  orderings: [
    {
      title: 'Nombre del Coro',
      name: 'nameAsc',
      by: [{ field: 'coroName', direction: 'asc' }],
    },
  ],
})
