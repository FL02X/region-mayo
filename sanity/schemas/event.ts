/**
 * Event Schema for Sanity CMS
 * Enhanced event management with album support
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'event',
  title: 'Evento',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título del Evento',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Fecha del Evento',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'Fecha de Fin (para eventos multi-día)',
      type: 'datetime',
      description: 'Opcional - solo para eventos de varios días',
    }),
    defineField({
      name: 'time',
      title: 'Hora',
      type: 'string',
      description: 'Ej: 10:00 AM',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Lugar',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'address',
      title: 'Dirección',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'googleMapsUrl',
      title: 'URL de Google Maps',
      type: 'url',
    }),
    defineField({
      name: 'description',
      title: 'Descripción',
      type: 'text',
      description: 'Descripción detallada del evento (sin límite de longitud)',
    }),
    defineField({
      name: 'vestimenta',
      title: 'Vestimenta',
      type: 'string',
      options: {
        list: [
          { title: 'Formal', value: 'formal' },
          { title: 'Informal', value: 'informal' },
          { title: 'Otro', value: 'otro' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'vestimentaCustom',
      title: 'Descripción de Vestimenta Especial',
      type: 'string',
      description: 'Descripción cuando la vestimenta es "Otro"',
      hidden: ({ document }) => document?.vestimenta !== 'otro',
    }),
    defineField({
      name: 'typeColor',
      title: 'Tipo de Evento',
      type: 'string',
      options: {
        list: [
          { title: 'Servicio de Adoración', value: 'worship' },
          { title: 'Gira de Fraternidad', value: 'tour' },
          { title: 'Conferencia', value: 'conference' },
          { title: 'Encuentro Juvenil', value: 'youth' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Imagen del Evento',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'status',
      title: 'Estado',
      type: 'string',
      options: {
        list: [
          { title: 'Próximo', value: 'upcoming' },
          { title: 'En Progreso', value: 'active' },
          { title: 'Finalizado', value: 'past' },
        ],
        layout: 'radio',
      },
      initialValue: 'upcoming',
    }),
    defineField({
      name: 'albumEnabled',
      title: 'Album Habilitado',
      type: 'boolean',
      description: 'Habilitar album de fotos para este evento',
      initialValue: false,
    }),
    defineField({
      name: 'googleDriveAlbumUrl',
      title: 'URL del Album de Google Drive',
      type: 'url',
      description: 'Link al folder de Google Drive con las fotos del evento',
      hidden: ({ document }) => !document?.albumEnabled,
    }),
    defineField({
      name: 'facebookPostUrl',
      title: 'URL del Post de Facebook',
      type: 'url',
      description: 'Link al post de Facebook sobre este evento (opcional)',
    }),
    defineField({
      name: 'registrationEnabled',
      title: 'Registro Habilitado',
      type: 'boolean',
      description: 'Habilitar registro para este evento',
      initialValue: true,
    }),
    defineField({
      name: 'photos',
      title: 'Fotos del Evento',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Fotos para mostrar en el formulario de registro (máximo 3)',
    }),
    defineField({
      name: 'isMultiDayEvent',
      title: 'Evento Multi-día',
      type: 'boolean',
      description: 'Marcar si el evento dura más de un día',
      initialValue: false,
    }),
    defineField({
      name: 'eventGroupId',
      title: 'ID de Grupo de Eventos',
      type: 'string',
      description: 'Para agrupar eventos consecutivos (ej: campamento de 3 días)',
      hidden: ({ document }) => !document?.isMultiDayEvent,
    }),
    defineField({
      name: 'region',
      title: 'Región',
      type: 'reference',
      to: [{ type: 'region' }],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'date',
      media: 'image',
    },
    prepare({ title, date, media }) {
      const eventDate = date ? new Date(date).toLocaleDateString('es-MX') : 'Sin fecha'
      return {
        title,
        subtitle: eventDate,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Fecha del Evento',
      name: 'dateAsc',
      by: [{ field: 'date', direction: 'asc' }],
    },
  ],
})
