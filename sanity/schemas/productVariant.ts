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
      name: 'hasDifferentPrice',
      title: '¿ESTE PRODUCTO TENDRÁ UN PRECIO DIFERENTE?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'price',
      title: 'PRECIO DE LA VARIANTE (MXN)',
      type: 'number',
      description: 'Precio final de esta variante en pesos mexicanos.',
      hidden: ({ document }) => !document?.hasDifferentPrice,
      validation: (Rule) => Rule.custom((value, context) => {
        if (!context.document?.hasDifferentPrice) return true
        if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
          return 'Ingresa un precio valido.'
        }

        return Number.isInteger(value * 100)
          ? true
          : 'El precio solo puede tener hasta dos decimales.'
      }),
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
