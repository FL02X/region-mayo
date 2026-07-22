import { defineType, defineField } from 'sanity'
import { ROLE_LABEL_BY_VALUE, ROLE_OPTIONS } from './directiva'

export default defineType({
  name: 'directivaGeneration',
  title: 'Generacion de Directiva',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'TITULO',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Ejemplo: Directiva 2024-2026 o Segunda generacion',
    }),
    defineField({
      name: 'region',
      title: 'Region',
      type: 'reference',
      to: [{ type: 'region' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startYear',
      title: 'ANO DE INICIO',
      type: 'number',
      validation: (Rule) => Rule.integer().min(1900).max(2100),
    }),
    defineField({
      name: 'endYear',
      title: 'ANO DE CIERRE',
      type: 'number',
      validation: (Rule) => Rule.integer().min(1900).max(2100),
    }),
    defineField({
      name: 'isCurrent',
      title: 'DIRECTIVA ACTUAL',
      type: 'boolean',
      initialValue: false,
      description: 'La directiva actual se abre primero en la pagina.',
    }),
    defineField({
      name: 'members',
      title: 'MIEMBROS',
      type: 'array',
      validation: (Rule) => Rule.required().min(1),
      of: [
        {
          type: 'object',
          name: 'directivaGenerationMember',
          title: 'Miembro',
          fields: [
            defineField({
              name: 'fullName',
              title: 'NOMBRE COMPLETO',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'photo',
              title: 'FOTO',
              type: 'image',
              options: { hotspot: true },
            }),
            defineField({
              name: 'role',
              title: 'CARGO',
              type: 'string',
              validation: (Rule) => Rule.required(),
              options: {
                list: ROLE_OPTIONS,
                layout: 'dropdown',
              },
            }),
            defineField({
              name: 'templo',
              title: 'TEMPLO AL QUE ASISTE',
              type: 'reference',
              to: [{ type: 'templo' }],
            }),
            defineField({
              name: 'phone',
              title: 'TELEFONO WHATSAPP',
              type: 'string',
              validation: (Rule) => Rule.regex(/^(\d{10})?$/, {
                name: 'phoneNumber',
                invert: false,
              }).error('Debe ser 10 digitos o dejarse vacio'),
              description: 'Numero de 10 digitos. Formato: sin espacios ni +52.',
            }),
          ],
          preview: {
            select: {
              title: 'fullName',
              role: 'role',
              temploName: 'templo.temploName',
              media: 'photo',
            },
            prepare({ title, role, temploName, media }) {
              return {
                title,
                subtitle: `${ROLE_LABEL_BY_VALUE[role] || role || 'Cargo sin definir'}${temploName ? ` - ${temploName}` : ''}`,
                media,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'deletedAt',
      title: 'Eliminado en',
      type: 'datetime',
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      isCurrent: 'isCurrent',
      startYear: 'startYear',
      endYear: 'endYear',
    },
    prepare({ title, isCurrent, startYear, endYear }) {
      const years = [startYear, endYear].filter(Boolean).join('-')
      return {
        title,
        subtitle: `${isCurrent ? 'Actual' : 'Historial'}${years ? ` - ${years}` : ''}`,
      }
    },
  },
  orderings: [
    {
      title: 'Actual primero',
      name: 'currentFirst',
      by: [
        { field: 'isCurrent', direction: 'desc' },
        { field: 'startYear', direction: 'desc' },
      ],
    },
  ],
})
