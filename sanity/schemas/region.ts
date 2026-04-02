/**
 * Region Schema for Sanity CMS
 * Supports multi-region configuration for future expansion
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'region',
  title: 'Región',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre de la Región',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'socialLinks',
      title: 'Redes Sociales',
      type: 'object',
      fields: [
        defineField({
          name: 'instagram',
          title: 'Instagram URL',
          type: 'url',
        }),
        defineField({
          name: 'facebook',
          title: 'Facebook URL',
          type: 'url',
        }),
      ],
    }),
    defineField({
      name: 'primaryColor',
      title: 'Color Primario',
      type: 'string',
      description: 'Color en formato hex (ej: #1e3a5f)',
    }),
    defineField({
      name: 'secondaryColor',
      title: 'Color Secundario',
      type: 'string',
      description: 'Color en formato hex',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'slug.current',
    },
  },
})
