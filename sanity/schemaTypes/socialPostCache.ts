/**
 * SOCIAL POST CACHE - Cache de Publicaciones Sociales
 *
 * Este documento almacena EN CACHÉ las últimas publicaciones de Instagram y Facebook.
 * Se actualiza automáticamente cada 6 horas (o cuando el admin lo force).
 *
 * ¿POR QUÉ UN CACHE?
 * - La Meta API tiene límites de requests
 * - No queremos hacer requests lentos en cada page load
 * - Sanity nos permite guardar y versionar los datos fácilmente
 *
 * ¿CÓMO FUNCIONA?
 * 1. Un Vercel Cron Job (cada 6h) llama a Meta API
 * 2. Obtiene las últimas publicaciones de IG y Facebook
 * 3. Las convierte a formato WEBP para performance
 * 4. Las guarda aquí en Sanity
 * 5. Si Meta API falla, usamos el último cache (fallback graceful)
 *
 * PARA ADMINS:
 * - Solo lectura. No edites estos documentos.
 * - El sistema los actualiza automáticamente.
 * - Si quieres forzar una actualización, contacta a tu dev.
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'socialPostCache',
  title: 'Social Post Cache',
  type: 'document',

  fields: [
    // ─────────────────────────────────────────────────────────
    // IDENTIFICACIÓN
    // ─────────────────────────────────────────────────────────
    defineField({
      name: 'network',
      title: 'Red Social',
      type: 'string',
      options: {
        list: [
          { title: 'Instagram', value: 'instagram' },
          { title: 'Facebook', value: 'facebook' },
        ],
      },
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'postId',
      title: 'ID del Post (Meta)',
      type: 'string',
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),

    // ─────────────────────────────────────────────────────────
    // CONTENIDO
    // ─────────────────────────────────────────────────────────
    defineField({
      name: 'url',
      title: 'Link a la Publicación Original',
      type: 'url',
      readOnly: true,
      description: 'Link directo a la publicación en IG o FB',
    }),

    defineField({
      name: 'caption',
      title: 'Descripción / Caption',
      type: 'text',
      readOnly: true,
    }),

    defineField({
      name: 'media',
      title: 'Imagen/Video (Formato WEBP)',
      type: 'image',
      readOnly: true,
      description: 'Descargada y convertida a WEBP para mejor performance',
    }),

    defineField({
      name: 'isVertical',
      title: 'Formato Vertical (9:16)',
      type: 'boolean',
      readOnly: true,
      description: 'Detectado automáticamente. True = Reel vertical o similar',
    }),

    // ─────────────────────────────────────────────────────────
    // METADATA
    // ─────────────────────────────────────────────────────────
    defineField({
      name: 'postedAt',
      title: 'Publicado en (Meta)',
      type: 'datetime',
      readOnly: true,
    }),

    defineField({
      name: 'lastUpdated',
      title: 'Última Actualización de Cache',
      type: 'datetime',
      readOnly: true,
      description: 'Cuándo el sistema actualizó este cache por última vez',
    }),

    defineField({
      name: 'errorLog',
      title: 'Log de Errores (si aplica)',
      type: 'text',
      readOnly: true,
      hidden: true,
      description: 'Sistema: errores durante la actualización',
    }),
  ],

  preview: {
    select: {
      network: 'network',
      caption: 'caption',
      postedAt: 'postedAt',
    },
    prepare(selection) {
      const { network } = selection
      const icon = network === 'instagram' ? '📷' : '📘'
      return {
        title: `${icon} ${network?.toUpperCase()} Cache`,
        subtitle: `Publicado: ${selection.postedAt}`,
      }
    },
  },
})
