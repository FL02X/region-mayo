/**
 * HERO CARD - Custom Content for Hero Section
 *
 * Los admins pueden crear tarjetas personalizadas que aparecerán en la
 * sección hero (donde normalmente está el "Próximo Evento").
 *
 * CÓMO FUNCIONA:
 * - Al publicar una tarjeta custom, toma PRIORIDAD MÁXIMA durante 24 horas
 * - Después de 24h, pierde prioridad gradualmente a favor de otros contenidos
 * - Si hay un "Muro de Oraciones" en fase SHOW, el muro SIEMPRE gana
 * - Puedes opcionalmente "fixar" (pin) la tarjeta para mantenerla en hero
 *
 * PARA ADMINS: Solo sube la imagen/video, nada más. El sistema automáticamente
 * detectará si es vertical o horizontal. Si quieres un link, añádelo abajo.
 *
 * NOTA: Este contenido será reemplazado si hay eventos muy próximos (< 3 días)
 * o si hay un "Muro de Oraciones" recientemente publicado en fase SHOW.
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'heroCard',
  title: 'Tarjeta Personalizada (Hero)',
  type: 'document',

  fields: [
    // ─────────────────────────────────────────────────────────
    // MEDIA (OBLIGATORIO)
    // ─────────────────────────────────────────────────────────
    defineField({
      name: 'media',
      title: 'Imagen o Video',
      type: 'object',
      validation: (Rule) => Rule.required(),
      description:
        'Sube tu contenido aquí. Puede ser JPG, PNG (imagen) o MP4 (video). ' +
        'El sistema detectará automáticamente si es vertical u horizontal.',
      fields: [
        defineField({
          name: 'file',
          title: 'Archivo de Media',
          type: 'image',
          validation: (Rule) => Rule.required(),
          options: {
            accept: 'image/*,video/*',
          },
        }),
        defineField({
          name: 'isVertical',
          title: '¿Es formato vertical? (Auto-detectado)',
          type: 'boolean',
          description:
            'Si es un video vertical (como un Reel o TikTok), marca esto. ' +
            'El sistema lo adaptará automáticamente.',
          initialValue: false,
          readOnly: true, // Los admins no necesitan tocarlo
          hidden: true, // Oculto, se detecta automáticamente
        }),
        defineField({
          name: 'alt',
          title: 'Descripción para accesibilidad (para usuarios con lectores de pantalla)',
          type: 'string',
          validation: (Rule) => Rule.required(),
          description:
            'Describe brevemente la imagen/video. Ej: "Campaña de semana santa 2026" ' +
            'Esto ayuda a usuarios con discapacidades visuales.',
        }),
      ],
    }),

    // ─────────────────────────────────────────────────────────
    // LINK DESTINO (OPCIONAL)
    // ─────────────────────────────────────────────────────────
    defineField({
      name: 'url',
      title: 'Link (Opcional)',
      type: 'url',
      description:
        'Si quieres que al hacer click en la imagen se abra un link externo. ' +
        'Ej: https://ejemplo.com/mi-campaña',
    }),

    defineField({
      name: 'ctaText',
      title: 'Texto del Botón (si hay link)',
      type: 'string',
      initialValue: 'Ver más información',
      description: 'Texto que aparecerá en el botón si hay un link',
      hidden: ({ document }) => !document?.url,
    }),

    defineField({
      name: 'pinned',
      title: '🔧 Fijar en Hero (ignora prioridad automática)',
      type: 'boolean',
      initialValue: false,
      description:
        'Si activas esto, esta tarjeta SIEMPRE aparecerá en el hero, ' +
        'sin importar si hay eventos próximos o muro de oraciones. ' +
        '⚠️ Úsalo solo si realmente quieres que se vea esto ahora mismo.',
    }),

    defineField({
      name: 'priorityWeight',
      title: '🔧 Peso de Prioridad Adicional (0-1000)',
      type: 'number',
      initialValue: 0,
      description:
        'Para admins avanzados: suma puntos adicionales al scoring interno. ' +
        'Deja en 0 si no sabes qué es esto.',
      hidden: true, // Oculto por defecto, solo para power users
    }),

    // ─────────────────────────────────────────────────────────
    // METADATA
    // ─────────────────────────────────────────────────────────
    defineField({
      name: 'createdBy',
      title: 'Creado por',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
  ],

  preview: {
    select: {
      media: 'media.file',
      title: 'title',
      pinned: 'pinned',
    },
    prepare(selection) {
      const { pinned } = selection
      return {
        title: `${pinned ? '📌 ' : ''}Hero Card`,
        media: selection.media,
      }
    },
  },
})
