import { defineField, defineType } from 'sanity'
import { EVENT_TYPES, enumToSanityOptions } from './enums'

export default defineType({
  name: 'album',
  title: 'Album',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Datos principales' },
    { name: 'media', title: 'Contenido' },
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
      name: 'albumType',
      title: 'Tipo de album',
      type: 'string',
      group: 'basic',
      initialValue: 'photos',
      options: {
        list: [
          { title: 'Imagenes', value: 'photos' },
          { title: 'Videos de YouTube', value: 'youtube' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
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
      description:
        'En albumes de imagenes es obligatoria. En YouTube es opcional; si la dejas vacia se usara la miniatura del primer video.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if ((context.document?.albumType ?? 'photos') === 'photos' && !value) {
            return 'La portada es obligatoria para albumes de imagenes'
          }
          return true
        }),
    }),
    defineField({
      name: 'facebookUrl',
      title: 'Link original de Facebook',
      type: 'url',
      group: 'media',
      hidden: ({ document }) => (document?.albumType ?? 'photos') !== 'photos',
    }),
    defineField({
      name: 'youtubePlaylistId',
      title: 'Playlist ID de YouTube',
      type: 'string',
      group: 'media',
      hidden: ({ document }) => document?.albumType !== 'youtube',
      description: 'Ej: PLxxxxxxxx. No pegues la URL completa aqui; solo el ID de la playlist.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.document?.albumType === 'youtube' && !value) {
            return 'El Playlist ID es obligatorio para albumes de YouTube'
          }
          return true
        }),
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'URL de la playlist en YouTube',
      type: 'url',
      group: 'media',
      hidden: ({ document }) => document?.albumType !== 'youtube',
      description: 'Opcional. Se usa para el boton "Ver playlist en YouTube".',
    }),
    defineField({
      name: 'youtubeLayout',
      title: 'Formato de reproduccion de YouTube',
      type: 'string',
      group: 'media',
      hidden: ({ document }) => document?.albumType !== 'youtube',
      initialValue: 'auto',
      options: {
        list: [
          { title: 'Automatico', value: 'auto' },
          { title: 'Vertical', value: 'vertical' },
          { title: 'Horizontal', value: 'horizontal' },
        ],
        layout: 'radio',
      },
      description:
        'Usa Automatico si quieres que la pagina intente ajustar el reproductor segun la miniatura. Vertical y Horizontal fuerzan el contenedor del video en la pagina.',
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
      title: 'Imagenes adicionales',
      type: 'array',
      group: 'media',
      hidden: ({ document }) => (document?.albumType ?? 'photos') !== 'photos',
      of: [
        defineField({
          name: 'albumImage',
          title: 'Foto',
          type: 'image',
          options: { hotspot: true },
          fields: [
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
      description:
        'La portada ya cuenta como la primera foto del album. Las fotos adicionales se muestran despues, en el orden en que las arrastres dentro del Studio.',
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
      albumType: 'albumType',
      media: 'coverImage',
      eventTitle: 'relatedEvent.title',
    },
    prepare({ title, startDate, endDate, hidden, albumType, media, eventTitle }) {
      const range = startDate && endDate ? `${startDate} - ${endDate}` : startDate || 'Sin fecha'
      const typeLabel = albumType === 'youtube' ? 'Videos' : 'Imagenes'
      return {
        title,
        subtitle: `${typeLabel} • ${hidden ? 'Oculto' : 'Publicado'} • ${range}${eventTitle ? ` • ${eventTitle}` : ''}`,
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
