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
      name: 'stock',
      title: 'EXISTENCIAS (OPCIONAL)',
      type: 'number',
      validation: (Rule) => Rule.min(0).integer(),
    }),
    defineField({
      name: 'isDisabled',
      title: 'DESACTIVAR PRODUCTO',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'deposit',
      title: 'ANTICIPO (MXN, OPCIONAL)',
      type: 'number',
      description: 'Anticipo en pesos mexicanos. Permite hasta dos decimales.',
      validation: (Rule) =>
        Rule.min(0).custom((value) => {
          if (value === undefined || value === null) return true

          if (typeof value !== 'number' || Number.isNaN(value)) {
            return 'Ingresa un anticipo valido.'
          }

          return Number.isInteger(value * 100)
            ? true
            : 'El anticipo solo puede tener hasta dos decimales.'
        }),
    }),
    defineField({
      name: 'allowSizeSelection',
      title: 'PERMITIR SELECCIONAR TALLAS',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'variantsEnabled',
      title: 'ACTIVAR VARIANTES DEL PRODUCTO',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'variants',
      title: 'VARIANTES DEL PRODUCTO',
      type: 'array',
      hidden: ({ document }) => !document?.variantsEnabled,
      of: [
        {
          type: 'reference',
          to: [{ type: 'productVariant' }],
        },
      ],
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (!context.document?.variantsEnabled) return true

          return Array.isArray(value) && value.length > 0
            ? true
            : 'Agrega al menos una variante del producto.'
        }),
    }),
    defineField({
      name: 'allowMultipleQuantity',
      title: 'PERMITIR COMPRAR MÁS DE UNO',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'clabe',
      title: 'CLABE INTERBANCARIA',
      type: 'string',
      validation: (Rule) =>
        Rule.required().custom((value) => {
          return typeof value === 'string' && /^\d{18}$/.test(value)
            ? true
            : 'La CLABE debe contener exactamente 18 digitos.'
        }),
    }),
    defineField({
      name: 'recipientBank',
      title: 'BANCO DEL DESTINATARIO',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'recipientName',
      title: 'NOMBRE DEL DESTINATARIO',
      type: 'string',
      validation: (Rule) => Rule.required(),
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
