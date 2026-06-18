import { defineField, defineType } from 'sanity'
import { EVENT_TYPES, enumToSanityOptions } from './enums'
import { AlbumUploadLinkInput } from '../components/inputs/album-upload-link-input'
import { AlbumRelatedEventInput } from '../components/inputs/album-related-event-input'
import { AlbumImagesInput } from '../components/inputs/album-images-input'
import { AlbumApprovedCommunityPhotosInput } from '../components/inputs/album-approved-community-photos-input'

export default defineType({
  name: 'album',
  title: 'Album',
  type: 'document',
  components: {
    input: AlbumRelatedEventInput,
  },
  groups: [
    { name: 'basic', title: 'Datos principales', hidden: true },
    { name: 'media', title: 'Contenido', hidden: true },
    { name: 'submissions', title: 'Subida comunitaria', hidden: true },
    { name: 'settings', title: 'Configuracion', hidden: true },
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
          { title: 'Galeria de fotos/videos', value: 'photos' },
          { title: 'Videos de YouTube', value: 'youtube' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'relatedEvent',
      title: 'Evento relacionado',
      type: 'reference',
      to: [{ type: 'event' }],
      group: 'basic',
      description:
        'Opcional. Al seleccionar un evento, se copian automaticamente la fecha de inicio, fecha final si aplica y categoria.',
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
      title: 'Fecha final',
      type: 'date',
      group: 'basic',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const startDate = context.document?.startDate
          if (startDate && value && String(value) < String(startDate)) {
            return 'La fecha final no puede ser antes de la fecha de inicio'
          }
          return true
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
      name: 'allowSubmissions',
      title: 'Permitir subida comunitaria',
      type: 'boolean',
      group: 'submissions',
      initialValue: false,
      description: 'Permite que personas con el enlace QR suban fotos para revision. El nombre de quien envia es obligatorio.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (value && context.document?.albumType === 'youtube') {
            return 'La subida comunitaria solo esta disponible para albumes de imagenes'
          }
          return true
        }),
    }),
    defineField({
      name: 'uploadTokenHash',
      title: 'Token de subida',
      type: 'string',
      group: 'submissions',
      hidden: ({ document }) =>
        !document?.allowSubmissions || (document?.albumType ?? 'photos') !== 'photos',
      components: {
        input: AlbumUploadLinkInput,
      },
      description:
        'Genera el enlace privado para el QR. Sanity guarda solo el hash; el token real no se almacena.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (
            context.document?.allowSubmissions &&
            (context.document?.albumType ?? 'photos') === 'photos' &&
            !value
          ) {
            return 'Genera un enlace de subida antes de activar las contribuciones'
          }
          return true
        }),
    }),
    defineField({
      name: 'submissionsCloseAt',
      title: 'Cerrar recepcion de fotos',
      type: 'datetime',
      group: 'submissions',
      hidden: ({ document }) =>
        !document?.allowSubmissions || (document?.albumType ?? 'photos') !== 'photos',
      description: 'Despues de esta fecha el enlace ya no permitira subir fotos.',
    }),
    defineField({
      name: 'uploadInstructions',
      title: 'Instrucciones de subida',
      type: 'text',
      group: 'submissions',
      rows: 3,
      hidden: ({ document }) =>
        !document?.allowSubmissions || (document?.albumType ?? 'photos') !== 'photos',
      description: 'Texto opcional que se mostrara en la pantalla de subida.',
      validation: (Rule) => Rule.max(280),
    }),
    defineField({
      name: 'approvedCommunityPhotos',
      title: 'Fotos comunitarias aprobadas',
      type: 'string',
      group: 'submissions',
      hidden: ({ document }) =>
        !document?.allowSubmissions || (document?.albumType ?? 'photos') !== 'photos',
      readOnly: true,
      components: {
        input: AlbumApprovedCommunityPhotosInput,
      },
      description:
        'Estas fotos vienen de la subida comunitaria aprobada. Siempre se muestran despues de las imagenes del sistema.',
    }),
    defineField({
      name: 'coverImage',
      title: 'Portada',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      description:
        'En galerias de fotos/videos es obligatoria. En YouTube es opcional; si la dejas vacia se usara la miniatura del primer video.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if ((context.document?.albumType ?? 'photos') === 'photos' && !value) {
            return 'La portada es obligatoria para galerias de fotos/videos'
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
      title: 'Imagenes/Videos',
      type: 'array',
      group: 'media',
      components: {
        input: AlbumImagesInput,
      },
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
              media: 'asset',
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
        defineField({
          name: 'albumVideo',
          title: 'Video',
          type: 'object',
          fields: [
            defineField({
              name: 'video',
              title: 'Archivo de video',
              type: 'file',
              options: {
                accept: 'video/mp4,video/webm',
              },
              description:
                'Sube un MP4/WebM comprimido para web. Recomendado: 480p o 540p, H.264, bitrate aproximado 800-1400 kbps.',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'poster',
              title: 'Miniatura',
              type: 'image',
              options: { hotspot: true },
              description:
                'Opcional. Si la dejas vacia, la pagina mostrara un recuadro negro con icono de reproduccion.',
            }),
            defineField({
              name: 'title',
              title: 'Titulo',
              type: 'string',
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
          ],
          preview: {
            select: {
              media: 'poster',
              title: 'title',
              caption: 'caption',
            },
            prepare({ media, title, caption }) {
              return {
                title: title || caption || 'Video del album',
                subtitle: 'Video',
                media,
              }
            },
          },
        }),
      ],
      description:
        'La portada ya cuenta como el primer elemento del album. Las imagenes y videos se muestran despues, en el orden en que los arrastres dentro del Studio.',
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
      const typeLabel = albumType === 'youtube' ? 'Videos' : 'Galeria'
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
