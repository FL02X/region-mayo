/**
 * EVENT - Eventos y Cultos
 * 
 * JERARQUÍA: Region → Event
 * 
 * Un evento SIEMPRE pertenece a una región específica
 * Los eventos pueden incluir registros de asistencia
 * 
 * ESTATUS:
 * - upcoming: Próximo (no ha empezado)
 * - active: En progreso (actualmente sucediendo)
 * - past: Finalizado (ya pasó)
 * 
 * AUDITORÍA: registra quién creó, cuándo, quién modificó, cuándo
 * SOFT DELETE: deletedAt permite archivar eventos sin perder datos
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
  indexes: [
    { name: 'byRegion', keys: [['region']] },
    { name: 'byStatus', keys: [['status']] },
    { name: 'byDate', keys: [['date']] },
    { name: 'byRegionAndDate', keys: [['region'], ['date']] },
  ],
  fields: [
    // Basic Info
    defineField({
      name: 'title',
      title: 'Título del Evento',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Nombre del evento (ej: "Campaña Regional Centro 2026")',
    }),
    defineField({
      name: 'eventType',
      title: 'Tipo de Culto/Evento',
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
      description: 'Clasificación del evento (afecta diseño y registro)',
    }),
    defineField({
      name: 'date',
      title: 'Fecha de Inicio',
      type: 'datetime',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Fecha y hora de inicio del evento',
    }),
    defineField({
      name: 'endDate',
      title: 'Fecha de Fin',
      type: 'datetime',
      group: 'basic',
      description: 'Para eventos de varios días (opcional)',
    }),
    defineField({
      name: 'time',
      title: 'Hora (Texto Corto)',
      type: 'string',
      group: 'basic',
      description: 'Ej: "10:00 AM" - display corto para listsados',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descripción',
      type: 'text',
      group: 'basic',
      description: 'Descripción larga del evento, propósito, agenda, etc.',
    }),
    defineField({
      name: 'vestimenta',
      title: 'Código de Vestimenta',
      type: 'string',
      group: 'basic',
      options: {
        list: [
          { title: 'Uniforme MGR', value: 'uniformeMGR' },
          { title: 'Vestimenta Formal/Casual', value: 'formalCasual' },
          { title: 'Informal', value: 'informal' },
          { title: 'Otro', value: 'otro' },
        ],
        layout: 'radio',
      },
      description: 'Qué deben portar los asistentes',
    }),
    defineField({
      name: 'vestimentaCustom',
      title: 'Descripción de Vestimenta Personalizada',
      type: 'string',
      group: 'basic',
      hidden: ({ document }) => document?.vestimenta !== 'otro',
      description: 'Si es "Otro", describe aquí (ej: "Blanco y negro formal")',
    }),

    // Location
    defineField({
      name: 'location',
      title: 'Lugar/Nombre del Sitio',
      type: 'string',
      group: 'location',
      validation: (Rule) => Rule.required(),
      description: 'Nombre del lugar (ej: "Templo Centro", "Salón de Convenciones")',
    }),
    defineField({
      name: 'address',
      title: 'Dirección Completa',
      type: 'string',
      group: 'location',
      validation: (Rule) => Rule.required(),
      description: 'Dirección física completa (calle, número, ciudad)',
    }),
    defineField({
      name: 'googleMapsUrl',
      title: 'URL de Google Maps',
      type: 'url',
      group: 'location',
      description: 'Link de Google Maps a la ubicación (copiar desde maps.google.com)',
    }),

    // Extras Opcionales
    defineField({
      name: 'alimentosEnabled',
      title: 'Mostrar sección de Alimentos',
      type: 'boolean',
      group: 'extras',
      initialValue: false,
      description: 'Si la sección de comida/catering es disponible',
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
      description: 'Horarios de servicio, menú, detalles',
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
      description: 'Si el pastor asignado no está en la lista, escríbelo aquí',
    }),
    defineField({
      name: 'jovenPreside',
      title: 'Joven que Preside',
      type: 'string',
      group: 'extras',
      description: 'Nombre del joven encargado de dirigir el evento',
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
      description: 'Imagen destacada para el evento',
    }),
    defineField({
      name: 'photos',
      title: 'Fotos del Evento',
      type: 'array',
      group: 'media',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Fotos (máximo 6) para mostrar en el registro',
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: 'albumEnabled',
      title: 'Álbum de Google Drive Habilitado',
      type: 'boolean',
      group: 'media',
      initialValue: false,
      description: 'Si hay un álbum de fotos compartido en Google Drive',
    }),
    defineField({
      name: 'googleDriveAlbumUrl',
      title: 'URL del Álbum de Google Drive',
      type: 'url',
      group: 'media',
      hidden: ({ document }) => !document?.albumEnabled,
    }),
    defineField({
      name: 'facebookPostUrl',
      title: 'URL del Post de Facebook',
      type: 'url',
      group: 'media',
      description: 'Link de la publicación en Facebook',
    }),

    // Settings
    defineField({
      name: 'region',
      title: 'Región',
      type: 'reference',
      group: 'settings',
      to: [{ type: 'region' }],
      validation: (Rule) => Rule.required(),
      description: 'Región a la que pertenece este evento (OBLIGATORIA)',
    }),
    defineField({
      name: 'status',
      title: 'Estado del Evento',
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
      description: 'Define si el evento está por venir, en curso o finalizado',
    }),
    defineField({
      name: 'registrationEnabled',
      title: 'Registro Habilitado',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: 'Si los asistentes pueden registrarse en este evento',
    }),

    // Auditoría
    defineField({
      name: '_audit',
      title: 'Auditoría',
      type: 'object',
      group: 'settings',
      description: 'Información de quién creó/modificó este registro',
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
          title: 'Fecha de Creación',
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
          title: 'Fecha de Última Modificación',
          type: 'datetime',
          readOnly: true,
        }),
      ],
    }),

    // Soft Delete
    defineField({
      name: 'deletedAt',
      title: 'Eliminado en',
      type: 'datetime',
      group: 'settings',
      hidden: true,
      description: 'Timestamp de eliminación lógica (soft delete)',
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
      regionName: 'region.name',
      status: 'status',
      media: 'image',
    },
    prepare({ title, date, eventType, regionName, status, media }) {
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
      const statusLabels: Record<string, string> = {
        upcoming: '📅 Próximo',
        active: '🔴 En Progreso',
        past: '✅ Finalizado',
      }
      return {
        title,
        subtitle: `${statusLabels[status] || status} • ${typeLabels[eventType] || 'Evento'} • ${eventDate} • ${regionName || '?'}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Próximos Eventos',
      name: 'upcomingAsc',
      by: [{ field: 'date', direction: 'asc' }],
    },
    {
      title: 'Eventos Recientes',
      name: 'recentDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
  ],
})
  orderings: [
    {
      title: 'Fecha del Evento',
      name: 'dateAsc',
      by: [{ field: 'date', direction: 'asc' }],
    },
  ],
})
