import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'productVariant',
  title: 'Variante de producto',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'NOMBRE DE VARIANTE',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'photos',
      title: 'IMAGENES DE LA VARIANTE',
      type: 'array',
      of: [
        {
          name: 'productVariantImage',
          title: 'Imagen',
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Texto alternativo',
              type: 'string',
            }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'photos.0',
    },
    prepare({ title, media }) {
      return {
        title: title || 'Variante sin nombre',
        media,
      }
    },
  },
})
