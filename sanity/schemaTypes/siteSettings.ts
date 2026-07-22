/**
 * Site Settings Schema for Sanity CMS
 * Manages global site configuration including hero images
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Cambiar imágenes principales',
  type: 'document',
  fields: [
    defineField({
      name: 'heroImages',
      title: 'Imágenes del Hero (Página Principal)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'image',
              title: 'Imagen',
              type: 'image',
              options: {
                hotspot: true,
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'alt',
              title: 'Texto Alternativo',
              type: 'string',
              description: 'Descripción de la imagen para accesibilidad',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              media: 'image',
              title: 'alt',
            },
          },
        },
      ],
      description: 'Agrega hasta 5 imágenes que rotarán en el fondo del hero. Recomendado: imágenes de 1920x1080 o similares.',
      validation: (Rule) => Rule.max(5),
    }),
    defineField({
      name: 'mobileHeroImage',
      title: 'Imagen única para Hero Móvil',
      type: 'object',
      description:
        'Imagen independiente para la versión móvil (debajo del header). No afecta el carrusel de escritorio.',
      fields: [
        defineField({
          name: 'image',
          title: 'Imagen',
          type: 'image',
          options: {
            hotspot: true,
          },
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'alt',
          title: 'Texto Alternativo',
          type: 'string',
          description: 'Descripción de la imagen para accesibilidad',
          validation: (Rule) => Rule.required(),
        }),
      ],
      preview: {
        select: {
          media: 'image',
          title: 'alt',
        },
      },
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
      title: 'siteName',
      region: 'region.name',
    },
    prepare({ title, region }) {
      return {
        title: title || 'Configuración del Sitio',
        subtitle: region ? `Región: ${region}` : 'Sin región asignada',
      }
    },
  },
})
