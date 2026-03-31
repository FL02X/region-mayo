/**
 * Directiva Schema for Sanity CMS
 * Miembros de la Directiva Regional
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'directiva',
  title: 'Miembro de Directiva',
  type: 'document',
  fields: [
    defineField({
      name: 'fullName',
      title: 'Nombre Completo',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Cargo',
      type: 'string',
      description: 'Ej: Presidente Regional, Vicepresidente, Secretaria, Tesorero',
    }),
    defineField({
      name: 'churchName',
      title: 'Iglesia',
      type: 'string',
      validation: (Rule) => Rule.required(),
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
      title: 'Teléfono (WhatsApp)',
      type: 'string',
      description: 'Número de 10 dígitos para contacto por WhatsApp',
      validation: (Rule) => Rule.required().regex(/^\d{10}$/, {
        name: 'phoneNumber',
        invert: false,
      }).error('Ingresa un número de 10 dígitos sin espacios ni guiones'),
    }),
    defineField({
      name: 'order',
      title: 'Orden de Aparición',
      type: 'number',
      description: 'Número para ordenar la lista de directiva (menor número aparece primero)',
      initialValue: 0,
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
      subtitle: 'role',
      media: 'photo',
    },
  },
  orderings: [
    {
      title: 'Orden de Aparición',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
    {
      title: 'Nombre',
      name: 'nameAsc',
      by: [{ field: 'fullName', direction: 'asc' }],
    },
  ],
})
