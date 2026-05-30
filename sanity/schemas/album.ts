import { defineField, defineType } from 'sanity'
import { EVENT_TYPES, enumToSanityOptions } from './enums'

export default defineType({
  name: 'album',
  title: 'Album',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Datos principales' },
    { name: 'media', title: 'Fotos' },
    { name: 'settings', title: 'Configuracion' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Titulo',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'basic',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
      description: 'Se genera automaticamente desde el titulo y crea la URL /album/slug.',
    }),
    defineField({
      name: 'startDate',
      title: 'Fecha de inicio',
      type: 'date',
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'Fecha de final',
      type: 'date',
      group: 'basic',
      validation: (Rule) =>
        Rule.required().custom((value, context) => {
          const startDate = context.document?.startDate
          if (startDate && value && String(value) < String(startDate)) {
            return 'La fecha final no puede ser antes de la fecha de inicio'
          }
          return true
        }),
    }),
    defineField({
      name: 'relatedEvent',
      title: 'Evento relacionado',
      type: 'reference',
      to: [{ type: 'event' }],
      group: 'basic',
      description: 'Opcional. Si seleccionas un evento, la categoria se toma automaticamente del evento.',
      validation: (Rule) =>
        Rule.custom(async (value, context) => {
          if (!value?._ref) return true

          const client = context.getClient({ apiVersion: '2025-01-01' })
          const currentId = context.document?._id?.replace(/^drafts\./, '')
          const existing = await client.fetch(
            `*[
              _type == "album" &&
              relatedEvent._ref == $eventId &&
              !(_id in [$currentId, "drafts." + $currentId])
            ][0]._id`,
            { eventId: value._ref, currentId },
          )

          return existing ? 'Este evento ya tiene un album relacionado' : true
        }),
    }),
    defineField({
      name: 'category',
      title: 'Categoria',
      type: 'string',
      group: 'basic',
      options: {
        list: enumToSanityOptions(EVENT_TYPES),
        layout: 'dropdown',
      },
      hidden: ({ document }) => Boolean(document?.relatedEvent),
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (!context.document?.relatedEvent && !value) {
            return 'La categoria es obligatoria cuando no hay evento relacionado'
          }
          return true
        }),
    }),
    defineField({
      name: 'description',
      title: 'Descripcion',
      type: 'text',
      group: 'basic',
    }),
    defineField({
      name: 'coverImage',
      title: 'Portada',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'facebookUrl',
      title: 'Link original de Facebook',
      type: 'url',
      group: 'media',
    }),
    defineField({
      name: 'hidden',
      title: 'Oculto',
      type: 'boolean',
      group: 'settings',
      initialValue: false,
      description: 'Activalo para guardar el album sin mostrarlo en la pagina publica.',
    }),
    defineField({
      name: 'images',
      title: 'Imagenes',
      type: 'array',
      group: 'media',
      of: [
        defineField({
          name: 'albumImage',
          title: 'Foto',
          type: 'object',
          fields: [
            defineField({
              name: 'image',
              title: 'Imagen',
              type: 'image',
              options: { hotspot: true },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              description: 'Opcional. Si lo dejas vacio, la pagina generara uno basico.',
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
          ],
          preview: {
            select: {
              media: 'image',
              title: 'caption',
              alt: 'alt',
            },
            prepare({ media, title, alt }) {
              return {
                title: title || alt || 'Foto del album',
                media,
              }
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
      description: 'La primera foto sale primero. Para cambiar el orden, arrastra las fotos dentro del Studio.',
    }),
    defineField({
      name: 'audit',
      title: 'Auditoria',
      type: 'object',
      group: 'settings',
      hidden: true,
      fields: [
        defineField({
          name: 'createdBy',
          title: 'Creado por (UID)',
          type: 'string',
          readOnly: true,
        }),
        defineField({
          name: 'createdAt',
          title: 'Fecha de Creacion',
          type: 'datetime',
          readOnly: true,
        }),
        defineField({
          name: 'modifiedBy',
          title: 'Modificado por (UID)',
          type: 'string',
          readOnly: true,
        }),
        defineField({
          name: 'modifiedAt',
          title: 'Fecha de Ultima Modificacion',
          type: 'datetime',
          readOnly: true,
        }),
      ],
    }),
    defineField({
      name: 'deletedAt',
      title: 'Eliminado el',
      type: 'datetime',
      group: 'settings',
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      startDate: 'startDate',
      endDate: 'endDate',
      hidden: 'hidden',
      media: 'coverImage',
      eventTitle: 'relatedEvent.title',
    },
    prepare({ title, startDate, endDate, hidden, media, eventTitle }) {
      const range = startDate && endDate ? `${startDate} - ${endDate}` : startDate || 'Sin fecha'
      return {
        title,
        subtitle: `${hidden ? 'Oculto' : 'Publicado'} • ${range}${eventTitle ? ` • ${eventTitle}` : ''}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Mas recientes primero',
      name: 'dateDesc',
      by: [{ field: 'startDate', direction: 'desc' }],
    },
    {
      title: 'Mas antiguos primero',
      name: 'dateAsc',
      by: [{ field: 'startDate', direction: 'asc' }],
    },
  ],
})
