/**
 * EVENT - Eventos y Cultos
 * 
 * JERARQUÍA: Region → Event
 * 
 * Un evento SIEMPRE pertenece a una región específica
 * Los eventos pueden incluir registros de asistencia
 * 
 * ENLACES REQUERIDOS:
 * - Si habilitас Google Drive, Facebook o Instagram, el enlace es OBLIGATORIO
 * - Para Alimentos y Junta Juvenil, la descripción es OBLIGATORIA si están habilitados
 * - La ubicación de Alimentos y Junta Juvenil son opcionales
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
    { name: 'byDate', keys: [['date']] },
    { name: 'byRegionAndDate', keys: [['region'], ['date']] },
  ],
  fields: [
    // Basic Info
    defineField({
      name: 'title',
      title: 'Nombre del Evento',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Ej: "Campaña Regional Centro 2026" o "Convención General"',
    }),
    defineField({
      name: 'eventType',
      title: 'Tipo de Evento',
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
      description: 'Categoría del evento (esto afecta cómo se ve en la página)',
    }),
    defineField({
      name: 'date',
      title: 'Fecha y Hora de Inicio',
      type: 'datetime',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Cuándo comienza el evento',
    }),
    defineField({
      name: 'endDate',
      title: 'Fecha y Hora de Fin (Opcional)',
      type: 'datetime',
      group: 'basic',
      description: 'Solo si el evento dura más de un día',
    }),
    defineField({
      name: 'time',
      title: 'Hora - Formato Corto (Ej: 10:00 AM)',
      type: 'string',
      group: 'basic',
      description: 'La hora que se muestra en las listas (ej: "10:00 AM")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descripción del Evento',
      type: 'text',
      group: 'basic',
      description: 'Cuéntales a la gente qué es el evento, qué esperamos, detalles importantes, etc.',
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
      description: 'Qué deben usar los asistentes',
    }),
    defineField({
      name: 'vestimentaCustom',
      title: 'Especificar Otro Código de Vestimenta',
      type: 'string',
      group: 'basic',
      hidden: ({ document }) => document?.vestimenta !== 'otro',
      description: 'Ej: "Blanco y negro formal"',
    }),

    // Location
    defineField({
      name: 'location',
      title: 'Nombre del Lugar',
      type: 'string',
      group: 'location',
      validation: (Rule) => Rule.required(),
      description: 'Ej: "Templo Centro", "Salón de Convenciones", "Explanada Municipal"',
    }),
    defineField({
      name: 'address',
      title: 'Dirección Completa',
      type: 'string',
      group: 'location',
      validation: (Rule) => Rule.required(),
      description: 'Calle, número, ciudad donde se realizará el evento',
    }),
    defineField({
      name: 'googleMapsUrl',
      title: 'Enlace de Google Maps',
      type: 'url',
      group: 'location',
      description: 'Copia la URL de Google Maps del sitio (para que la gente vea la ruta)',
    }),

    // Extras Opcionales
    defineField({
      name: 'alimentosEnabled',
      title: 'Sección de Alimentos Habilitada',
      type: 'boolean',
      group: 'extras',
      initialValue: false,
      description: 'Marca esto si hay información sobre comidas o catering en este evento',
    }),
    defineField({
      name: 'alimentosDescription',
      title: 'Descripción de Alimentos (OBLIGATORIA si habilitado)',
      type: 'text',
      group: 'extras',
      description: 'Horarios, menú, detalles de cómo se sirvirá la comida',
      hidden: ({ document }) => !document?.alimentosEnabled,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.document?.alimentosEnabled && !value) {
            return 'Se debe proporcionar una descripción si los alimentos están habilitados';
          }
          return true;
        }),
    }),
    defineField({
      name: 'alimentosLocation',
      title: 'Ubicación de Alimentos (Opcional)',
      type: 'string',
      group: 'extras',
      hidden: ({ document }) => !document?.alimentosEnabled,
      description: 'Lugar donde se servirá la comida (opcional)',
    }),
    defineField({
      name: 'alimentosGoogleMapsUrl',
      title: 'Enlace de Google Maps (Alimentos - Opcional)',
      type: 'url',
      group: 'extras',
      hidden: ({ document }) => !document?.alimentosEnabled,
    }),
    defineField({
      name: 'juntaJuvenilEnabled',
      title: 'Sección de Junta Juvenil Habilitada',
      type: 'boolean',
      group: 'extras',
      initialValue: false,
      description: 'Marca esto si existe una junta o reunión especial para jóvenes',
    }),
    defineField({
      name: 'juntaJuvenilDescription',
      title: 'Descripción de Junta Juvenil (OBLIGATORIA si habilitado)',
      type: 'text',
      group: 'extras',
      hidden: ({ document }) => !document?.juntaJuvenilEnabled,
      description: 'Detalles: tema, duración, qué esperamos de los jóvenes, etc.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.document?.juntaJuvenilEnabled && !value) {
            return 'Se debe proporcionar una descripción si la junta juvenil está habilitada';
          }
          return true;
        }),
    }),
    defineField({
      name: 'juntaJuvenilLocation',
      title: 'Ubicación de Junta Juvenil (Opcional)',
      type: 'string',
      group: 'extras',
      hidden: ({ document }) => !document?.juntaJuvenilEnabled,
      description: 'Lugar donde se realizará la junta (opcional)',
    }),
    defineField({
      name: 'juntaJuvenilGoogleMapsUrl',
      title: 'Enlace de Google Maps (Junta Juvenil - Opcional)',
      type: 'url',
      group: 'extras',
      hidden: ({ document }) => !document?.juntaJuvenilEnabled,
    }),
    defineField({
      name: 'pastorMensaje',
      title: 'Pastor que Dará el Mensaje',
      type: 'reference',
      to: [{ type: 'pastor' }],
      group: 'extras',
      description: 'Selecciona de la lista de pastores registrados',
    }),
    defineField({
      name: 'pastorMensajeCustom',
      title: 'Pastor Invitado (Si no está en la lista)',
      type: 'string',
      group: 'extras',
      description: 'Nombre del pastor si no está registrado en el sistema',
    }),
    defineField({
      name: 'jovenPreside',
      title: 'Joven Encargado de Dirigir',
      type: 'string',
      group: 'extras',
      description: 'Nombre del joven que dirigirá el evento',
    }),
    defineField({
      name: 'moreInfoEnabled',
      title: 'Mostrar Botón "Más Información"',
      type: 'boolean',
      group: 'extras',
      initialValue: false,
      description: 'Marca esto si hay información adicional que mostrar (con imagen)',
    }),
    defineField({
      name: 'moreInfoImage',
      title: 'Imagen de "Más Información"',
      type: 'image',
      group: 'extras',
      options: { hotspot: true },
      hidden: ({ document }) => !document?.moreInfoEnabled,
      description: 'Imagen que se mostrará en la sección de "Más Información"',
    }),

    // Media
    defineField({
      name: 'image',
      title: 'Imagen Principal del Evento',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      description: 'Imagen destacada que se mostrará en la lista de eventos',
    }),
    defineField({
      name: 'photos',
      title: 'Fotos del Evento',
      type: 'array',
      group: 'media',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Hasta 6 fotos del evento. Se mostrarán en la galería.',
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: 'albumEnabled',
      title: 'Álbum en Google Drive Habilitado',
      type: 'boolean',
      group: 'media',
      initialValue: false,
      description: 'Marca esto si hay un álbum de fotos en Google Drive',
    }),
    defineField({
      name: 'googleDriveAlbumUrl',
      title: 'Enlace del Álbum en Google Drive (OBLIGATORIO si habilitado)',
      type: 'url',
      group: 'media',
      hidden: ({ document }) => !document?.albumEnabled,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.document?.albumEnabled && !value) {
            return 'Se debe proporcionar un enlace si el álbum de Google Drive está habilitado';
          }
          return true;
        }),
    }),
    defineField({
      name: 'facebookEnabled',
      title: 'Enlace a Publicación de Facebook Habilitado',
      type: 'boolean',
      group: 'media',
      initialValue: false,
      description: 'Marca esto si la publicación del evento está en Facebook',
    }),
    defineField({
      name: 'facebookPostUrl',
      title: 'Enlace de la Publicación de Facebook (OBLIGATORIO si habilitado)',
      type: 'url',
      group: 'media',
      hidden: ({ document }) => !document?.facebookEnabled,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.document?.facebookEnabled && !value) {
            return 'Se debe proporcionar el enlace de Facebook si está habilitado';
          }
          return true;
        }),
    }),
    defineField({
      name: 'instagramEnabled',
      title: 'Enlace a Publicación de Instagram Habilitado',
      type: 'boolean',
      group: 'media',
      initialValue: false,
      description: 'Marca esto si la publicación del evento está en Instagram',
    }),
    defineField({
      name: 'instagramPostUrl',
      title: 'Enlace de la Publicación de Instagram (OBLIGATORIO si habilitado)',
      type: 'url',
      group: 'media',
      hidden: ({ document }) => !document?.instagramEnabled,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.document?.instagramEnabled && !value) {
            return 'Se debe proporcionar el enlace de Instagram si está habilitado';
          }
          return true;
        }),
    }),

    // Settings
    defineField({
      name: 'region',
      title: 'Región',
      type: 'reference',
      group: 'settings',
      to: [{ type: 'region' }],
      validation: (Rule) => Rule.required(),
      description: 'La región a la que pertenece este evento (obligatorio)',
    }),
    defineField({
      name: 'registrationEnabled',
      title: 'Permitir Registro de Asistentes',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: 'Marca esto para permitir que la gente se registre como asistente al evento',
    }),

    // Auditoría
    defineField({
      name: 'audit',
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
      media: 'image',
    },
    prepare({ title, date, eventType, regionName, media }) {
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
        subtitle: `${typeLabels[eventType] || 'Evento'} • ${eventDate} • ${regionName || '?'}`,
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
