/**
 * Event Schema for Sanity CMS
 * Enhanced event management with all features
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'event',
  title: 'Evento',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Información Básica' },
    { name: 'location', title: 'Ubicación' },
    { name: 'extras', title: 'Extras Opcionales' },
    { name: 'media', title: 'Multimedia' },
    { name: 'settings', title: 'Configuración' },
  ],
  fields: [
    // Basic Info
    defineField({
      name: 'title',
      title: 'Título del Evento',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'eventType',
      title: 'Tipo de Culto',
      type: 'string',
      group: 'basic',
      options: {
        list: [
          { title: 'Campaña', value: 'campana' },
          { title: 'Convención General', value: 'convencion' },
          { title: 'Recorrido Regional', value: 'recorrido' },
          { title: 'Culto Juvenil', value: 'cultoJuvenil' },
          { title: 'Culto', value: 'culto' },
          { title: 'Visita', value: 'visita' },
          { title: 'Ensayo', value: 'ensayo' },
          { title: 'Actividad', value: 'actividad' },
          { title: 'Estudio Bíblico', value: 'estudioBiblico' },
          { title: 'Biregional', value: 'biregional' },
          { title: 'Congreso Brilla', value: 'congresoBrilla' },
          { title: 'Boda', value: 'boda' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Fecha de Inicio',
      type: 'datetime',
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'Fecha de Fin',
      type: 'datetime',
      group: 'basic',
      description: 'Solo para eventos de varios días',
    }),
    defineField({
      name: 'time',
      title: 'Hora',
      type: 'string',
      group: 'basic',
      description: 'Ej: 10:00 AM',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descripción',
      type: 'text',
      group: 'basic',
    }),
    defineField({
      name: 'vestimenta',
      title: 'Vestimenta',
      type: 'string',
      group: 'basic',
      options: {
        list: [
          { title: 'Uniforme MGR', value: 'uniformeMGR' },
          { title: 'Vestimenta Formal Casual', value: 'formalCasual' },
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
      group: 'basic',
      hidden: ({ document }) => document?.vestimenta !== 'otro',
    }),

    // Location
    defineField({
      name: 'location',
      title: 'Lugar',
      type: 'string',
      group: 'location',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'address',
      title: 'Dirección',
      type: 'string',
      group: 'location',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'googleMapsUrl',
      title: 'URL de Google Maps',
      type: 'url',
      group: 'location',
    }),

    // Extras Opcionales
    defineField({
      name: 'alimentosEnabled',
      title: 'Mostrar sección de Alimentos',
      type: 'boolean',
      group: 'extras',
      initialValue: false,
    }),
    defineField({
      name: 'alimentosLocation',
      title: 'Ubicación de Alimentos',
      type: 'string',
      group: 'extras',
      hidden: ({ document }) => !document?.alimentosEnabled,
    }),
    defineField({
      name: 'alimentosGoogleMapsUrl',
      title: 'URL de Google Maps (Alimentos)',
      type: 'url',
      group: 'extras',
      hidden: ({ document }) => !document?.alimentosEnabled,
    }),
    defineField({
      name: 'alimentosDescription',
      title: 'Descripción de Alimentos',
      type: 'text',
      group: 'extras',
      description: 'Horarios de servicio, detalles, etc.',
      hidden: ({ document }) => !document?.alimentosEnabled,
    }),
    defineField({
      name: 'juntaJuvenilEnabled',
      title: 'Mostrar sección de Junta Juvenil',
      type: 'boolean',
      group: 'extras',
      initialValue: false,
    }),
    defineField({
      name: 'juntaJuvenilLocation',
      title: 'Ubicación de Junta Juvenil',
      type: 'string',
      group: 'extras',
      hidden: ({ document }) => !document?.juntaJuvenilEnabled,
    }),
    defineField({
      name: 'juntaJuvenilGoogleMapsUrl',
      title: 'URL de Google Maps (Junta Juvenil)',
      type: 'url',
      group: 'extras',
      hidden: ({ document }) => !document?.juntaJuvenilEnabled,
    }),
    defineField({
      name: 'juntaJuvenilDescription',
      title: 'Descripción de Junta Juvenil',
      type: 'text',
      group: 'extras',
      hidden: ({ document }) => !document?.juntaJuvenilEnabled,
    }),
    defineField({
      name: 'pastorMensaje',
      title: 'Pastor del Mensaje',
      type: 'reference',
      to: [{ type: 'pastor' }],
      group: 'extras',
      description: 'Selecciona un pastor de la lista',
    }),
    defineField({
      name: 'pastorMensajeCustom',
      title: 'Pastor Invitado (Personalizado)',
      type: 'string',
      group: 'extras',
      description: 'Si el pastor no está en la lista, escríbelo aquí',
    }),
    defineField({
      name: 'jovenPreside',
      title: 'Joven que Preside',
      type: 'string',
      group: 'extras',
    }),
    defineField({
      name: 'moreInfoEnabled',
      title: 'Mostrar botón "Más Información"',
      type: 'boolean',
      group: 'extras',
      initialValue: false,
    }),
    defineField({
      name: 'moreInfoImage',
      title: 'Imagen de Más Información',
      type: 'image',
      group: 'extras',
      options: { hotspot: true },
      hidden: ({ document }) => !document?.moreInfoEnabled,
    }),

    // Media
    defineField({
      name: 'image',
      title: 'Imagen Principal del Evento',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
    }),
    defineField({
      name: 'photos',
      title: 'Fotos del Evento (para registro)',
      type: 'array',
      group: 'media',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Máximo 6 fotos para mostrar en el registro',
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: 'albumEnabled',
      title: 'Album Habilitado',
      type: 'boolean',
      group: 'media',
      initialValue: false,
    }),
    defineField({
      name: 'googleDriveAlbumUrl',
      title: 'URL del Album de Google Drive',
      type: 'url',
      group: 'media',
      hidden: ({ document }) => !document?.albumEnabled,
    }),
    defineField({
      name: 'facebookPostUrl',
      title: 'URL del Post de Facebook',
      type: 'url',
      group: 'media',
    }),

    // Settings
    defineField({
      name: 'status',
      title: 'Estado',
      type: 'string',
      group: 'settings',
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
      name: 'registrationEnabled',
      title: 'Registro Habilitado',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
    }),
    defineField({
      name: 'region',
      title: 'Región',
      type: 'reference',
      group: 'settings',
      to: [{ type: 'region' }],
      validation: (Rule) => Rule.required(),
    }),

    // Legacy fields for backwards compatibility
    defineField({
      name: 'typeColor',
      title: 'Color de Tipo (Legacy)',
      type: 'string',
      group: 'settings',
      hidden: true,
      options: {
        list: [
          { title: 'Servicio de Adoración', value: 'worship' },
          { title: 'Gira de Fraternidad', value: 'tour' },
          { title: 'Conferencia', value: 'conference' },
          { title: 'Encuentro Juvenil', value: 'youth' },
        ],
      },
    }),
    defineField({
      name: 'isMultiDayEvent',
      title: 'Evento Multi-día (Legacy)',
      type: 'boolean',
      group: 'settings',
      hidden: true,
    }),
    defineField({
      name: 'eventGroupId',
      title: 'ID de Grupo (Legacy)',
      type: 'string',
      group: 'settings',
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'date',
      eventType: 'eventType',
      media: 'image',
    },
    prepare({ title, date, eventType, media }) {
      const eventDate = date ? new Date(date).toLocaleDateString('es-MX') : 'Sin fecha'
      const typeLabels: Record<string, string> = {
        campana: 'Campaña',
        convencion: 'Convención General',
        recorrido: 'Recorrido Regional',
        cultoJuvenil: 'Culto Juvenil',
        culto: 'Culto',
        visita: 'Visita',
        ensayo: 'Ensayo',
        actividad: 'Actividad',
        estudioBiblico: 'Estudio Bíblico',
        biregional: 'Biregional',
        congresoBrilla: 'Congreso Brilla',
        boda: 'Boda',
      }
      return {
        title,
        subtitle: `${typeLabels[eventType] || 'Evento'} - ${eventDate}`,
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
