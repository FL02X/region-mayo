import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Producto',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'NOMBRE DEL PRODUCTO',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'PRECIO (MXN)',
      type: 'number',
      description: 'Precio en pesos mexicanos. Permite hasta dos decimales.',
      validation: (Rule) =>
        Rule.required()
          .min(0)
          .custom((value) => {
            if (typeof value !== 'number' || Number.isNaN(value)) {
              return 'Ingresa un precio valido.'
            }

            return Number.isInteger(value * 100)
              ? true
              : 'El precio solo puede tener hasta dos decimales.'
          }),
    }),
    defineField({
      name: 'photos',
      title: 'FOTOS DEL PRODUCTO',
      type: 'array',
      of: [
        {
          name: 'productImage',
          title: 'Foto',
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Texto alternativo',
              type: 'string',
            }),
          ],
          preview: {
            select: {
              media: 'asset',
              title: 'alt',
            },
            prepare({ media, title }) {
              return {
                title: title || 'Foto del producto',
                media,
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'photos.0',
      price: 'price',
    },
    prepare({ title, media, price }) {
      return {
        title: title || 'Producto sin nombre',
        subtitle: typeof price === 'number' ? `$${price.toFixed(2)} MXN` : 'Sin precio',
        media,
      }
    },
  },
})
