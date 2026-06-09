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
import { EventPastorInput } from '../components/inputs/event-pastor-input'

export default defineType({
  name: 'event',
  title: 'Evento',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Datos principales' },
    { name: 'location', title: 'Ubicación' },
    { name: 'extras', title: 'Opciones extra' },
    { name: 'media', title: 'Archivos' },
    { name: 'settings', title: 'Configuración' },
    { name: 'toggles', title: 'Controles (toggles)' },
  ],
  indexes: [
    { name: 'byRegion', keys: [['region']] },
    { name: 'byDate', keys: [['schedule']] },
    { name: 'byRegionAndDate', keys: [['region'], ['schedule']] },
  ],
  fields: [
    // Basic Info
    defineField({
      name: 'title',
      title: 'NOMBRE DEL EVENTO',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: '',
    }),
    defineField({
      name: 'eventType',
      title: 'TIPO',
      type: 'string',
      group: 'basic',
      options: {
        list: [
          { title: 'Campaña', value: 'campana' },
          { title: 'Convención General', value: 'convencion' },
          { title: 'Recorrido Regional', value: 'recorrido' },
          { title: 'Confraternidad Juvenil Regional', value: 'confraternidadJuvenilRegional' },
          { title: 'Confraternidad Juvenil General', value: 'confraternidadJuvenilGeneral' },
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
      description: '',
    }),
    defineField({
      name: 'schedule',
      title: 'FECHAS Y HORAS',
      type: 'array',
      group: 'basic',
      description: 'Cada dia en especifico debera estar dentro de un elemento diferente. ',
      of: [
        defineField({
          name: 'occurrence',
          title: 'Fecha y hora',
          type: 'object',
          fields: [
            defineField({
              name: 'date',
              title: 'Fecha',
              type: 'date',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'time',
              title: 'Hora',
              type: 'string',
              description: 'Ej: "7:00 PM"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'note',
              title: 'Nota de este día (opcional)',
              type: 'string',
              description: 'Ej: "Servicio especial de jóvenes" o "Llegar 30 minutos antes".',
            }),
          ],
          preview: {
            select: {
              date: 'date',
              time: 'time',
              note: 'note',
            },
            prepare({ date, time, note }) {
              return {
                title: [date, time].filter(Boolean).join(' · ') || 'Fecha sin completar',
                subtitle: note || undefined,
              }
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'date',
      title: 'Fecha de inicio (legacy)',
      type: 'datetime',
      group: 'basic',
      hidden: true,
      readOnly: true,
      description: 'Campo anterior. Ya no se edita; usa "Fechas y horas".',
    }),
    defineField({
      name: 'endDate',
      title: 'Fecha de fin (legacy)',
      type: 'datetime',
      group: 'basic',
      hidden: true,
      readOnly: true,
      description: 'Campo anterior. Ya no se edita; usa "Fechas y horas".',
    }),
    defineField({
      name: 'time',
      title: 'Hora corta (legacy)',
      type: 'string',
      group: 'basic',
      hidden: true,
      readOnly: true,
      description: 'Campo anterior. Ya no se edita; usa "Fechas y horas".',
    }),
    defineField({
      name: 'description',
      title: 'DESCRIPCIÓN (OPCIONAL)',
      type: 'text',
      group: 'basic',
      description: 'Si es necesario dar información de que se trata el evento, aquí ira.',
    }),
    defineField({
      name: 'vestimenta',
      title: 'VESTIMENTA (SOLO PARA MIEMBROS MGR)',
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
      description: 'Qué deben usar los jovenes de la region (NO OYENTES)',
    }),
    defineField({
      name: 'vestimentaCustom',
      title: 'Vestimenta personalizada',
      type: 'string',
      group: 'basic',
      hidden: ({ document }) => document?.vestimenta !== 'otro',
      description: 'Ej: "Blanco y negro formal"',
    }),

    // Location
    defineField({
      name: 'templo',
      title: 'TEMPLO (OPCIONAL, RECOMENDADO)',
      type: 'reference',
      to: [{ type: 'templo' }],
      group: 'location',
      description:
        'OPCIONAL: Si el evento va a ser en una iglesia de nuestra region, seleccionalo desde aqui. El lugar, la dirección, Google Maps y el pastor a cargo se toman automáticamente de ese templo. Si es fuera de una iglesia (EJEMPLO: Otra ciudad, o en una plaza) deja este campo vacío.',
    }),
    defineField({
      name: 'location',
      title: 'Lugar',
      type: 'string',
      group: 'location',
      hidden: ({ document }) => !!document?.templo,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (!context.document?.templo && !value) {
            return 'El nombre del lugar es obligatorio cuando no hay templo asociado';
          }
          return true;
        }),
      description: 'Si hay un `templo` asociado, este valor se obtiene automáticamente. Si no, ingresa el nombre del lugar:',
    }),
    defineField({
      name: 'address',
      title: 'Dirección',
      type: 'string',
      group: 'location',
      hidden: ({ document }) => !!document?.templo,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (!context.document?.templo && !value) {
            return 'La dirección es obligatoria cuando no hay templo asociado';
          }
          return true;
        }),
      description: 'Si hay un `templo` asociado, la dirección se obtiene automáticamente del templo. Si no, ingresa la direccion del lugar:',
    }),
    defineField({
      name: 'googleMapsUrl',
      title: 'Google Maps',
      type: 'url',
      group: 'location',
      hidden: ({ document }) => !!document?.templo,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (!context.document?.templo && !value) {
            return 'La URL de Google Maps es obligatoria cuando no hay templo asociado';
          }
          return true;
        }),
      description: 'Si hay un `templo` asociado, la URL de Maps se obtiene automáticamente del templo. Si no, ingresa la URL del Google Maps del lugar:',
    }),

    // Extras Opcionales
    defineField({
      name: 'alimentosEnabled',
      title: '¿VA A VER ALIMENTOS?',
      type: 'boolean',
      group: 'toggles',
      initialValue: false,
      description: 'Marca esto si hay información sobre alimentos en este evento.',
    }),
    defineField({
      name: 'alimentosDescription',
      title: 'Descripción de alimentos ',
      type: 'text',
      group: 'extras',
      description: 'Horarios, menú, detalles de cómo se servira la comida...',
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
      title: 'Lugar de alimentos (OPCIONAL)',
      type: 'string',
      group: 'extras',
      hidden: ({ document }) => !document?.alimentosEnabled,
      description: 'Lugar donde se servirá la comida',
    }),
    defineField({
      name: 'alimentosGoogleMapsUrl',
      title: 'Google Maps del lugar donde se serviran alimentos (OPCIONAL)',
      type: 'url',
      group: 'extras',
      hidden: ({ document }) => !document?.alimentosEnabled,
    }),
    defineField({
      name: 'juntaJuvenilEnabled',
      title: '¿VA A VER JUNTA JUVENIL?',
      type: 'boolean',
      group: 'toggles',
      initialValue: false,
      description: 'Marca esto si existe una junta o reunión especial para jóvenes',
    }),
    defineField({
      name: 'juntaJuvenilDescription',
      title: 'Descripción de junta juvenil',
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
      title: 'Lugar de junta juvenil',
      type: 'string',
      group: 'extras',
      hidden: ({ document }) => !document?.juntaJuvenilEnabled,
      description: 'Lugar donde se realizará la junta (opcional)',
    }),
    defineField({
      name: 'juntaJuvenilGoogleMapsUrl',
      title: 'Google Maps de junta juvenil',
      type: 'url',
      group: 'extras',
      hidden: ({ document }) => !document?.juntaJuvenilEnabled,
    }),
    defineField({
      name: 'pastorMensaje',
      title: 'PASTOR A CARGO DEL EVENTO',
      type: 'reference',
      to: [{ type: 'pastor' }],
      group: 'extras',
      components: {
        input: EventPastorInput,
      },
      description: '(Pastor del templo donde sera el evento) Si el evento tiene templo asociado, este campo se sugiere automáticamente con su pastor a cargo, pero puedes cambiarlo manualmente! Si no hay templo asociado, selecciona el pastor manualmente.',
    }),
    defineField({
      name: 'pastorMensajeCustom',
      title: 'PASTOR A CARGO - Manual',
      type: 'string',
      group: 'extras',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (typeof value === 'string' && value.trim() === 'Por confirmar') {
            return 'Usa el pastor del templo o deja este campo vacío.'
          }
          return true
        }),
      description: 'Úsalo SOLO si por alguna razon el pastor no está registrado arriba o si necesitas escribirlo manualmente.',
    }),
    defineField({
      name: 'jovenPreside',
      title: 'JOVEN QUE PRECIDE (OPCIONAL)',
      type: 'string',
      group: 'extras',
      description: 'Nombre del joven/hermano que va a precidir (Escribe "Hno. ..." antes del nombre)',
    }),
    defineField({
      name: 'moreInfoEnabled',
      title: 'ACTIVAR "MÁS INFORMACION" ',
      type: 'boolean',
      group: 'toggles',
      initialValue: false,
      description: 'Esto activara un boton al final del cuadro del evento donde al dar click mostrara una imagen que hayas añadido. Sera solo para mostrar cosas como dias de participacion de los coros, o avisos',
    }),
    defineField({
      name: 'moreInfoImage',
      title: 'Imagen de más información',
      type: 'image',
      group: 'extras',
      options: { hotspot: true },
      hidden: ({ document }) => !document?.moreInfoEnabled,
      description: 'Imagen que se mostrará en la sección de "Más Información"',
    }),

    // Media
    defineField({
      name: 'image',
      title: 'IMAGEN PRINCIPAL DE PORTADA',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      description: 'Imagen destacada que se mostrará en la lista de eventos. La imagen se mostrara en 16:9, como rectangulo, si es necesario, es mejor recortarla antes de subirla para que encuadre bien.',
    }),
    defineField({
      name: 'photos',
      title: 'Fotos',
      type: 'array',
      group: 'media',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'ACLARACION: Esto es SOLO si el evento tiene la opcion de REGISTRO activada. Aqui se subiran imagenes que se mostraran mientras el usuario se registra, si NO hay registro no es necesario añadir nada aqui.',
      validation: (Rule) => Rule.max(6),
    }),
    // defineField({
    //   name: 'albumEnabled',
    //   title: 'Activar álbum',
    //   type: 'boolean',
    //   group: 'toggles',
    //   initialValue: false,
    //   description: 'Marca esto si hay un álbum de fotos en Google Drive',
    // }),
    // defineField({
    //   name: 'googleDriveAlbumUrl',
    //   title: 'Álbum en Google Drive',
    //   type: 'url',
    //   group: 'media',
    //   hidden: ({ document }) => !document?.albumEnabled,
    //   validation: (Rule) =>
    //     Rule.custom((value, context) => {
    //       if (context.document?.albumEnabled && !value) {
    //         return 'Se debe proporcionar un enlace si el álbum de Google Drive está habilitado';
    //       }
    //       return true;
    //     }),
    // }),
    defineField({
      name: 'facebookEnabled',
      title: 'Activar Facebook',
      type: 'boolean',
      group: 'toggles',
      initialValue: false,
      description: 'Marca esto si la publicación del evento está en Facebook',
    }),
    defineField({
      name: 'facebookPostUrl',
      title: 'URL del post de Facebook',
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
      title: 'Activar Instagram',
      type: 'boolean',
      group: 'toggles',
      initialValue: false,
      description: 'Marca esto si la publicación del evento está en Instagram',
    }),
    defineField({
      name: 'instagramPostUrl',
      title: 'URL del post de Instagram',
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
      title: 'REGIÓN (OBLIGATORIO)',
      type: 'reference',
      group: 'settings',
      to: [{ type: 'region' }],
      validation: (Rule) => Rule.required(),
      description: 'Selecciona Region Mayo, esto es solo por si en el futuro añadimos mas regiones.',
    }),
    defineField({
      name: 'registrationEnabled',
      title: 'PERMITIR REGISTRARSE',
      type: 'boolean',
      group: 'toggles',
      initialValue: true,
      description: 'Marca esto SOLO si es necesario registrarse como asistente al evento (EJEMPLO: El recorrido regional)',
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
      title: 'Eliminado el',
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
      schedule: 'schedule',
      eventType: 'eventType',
      regionName: 'region.name',
      media: 'image',
    },
    prepare({ title, schedule, eventType, regionName, media }) {
      const firstOccurrence = Array.isArray(schedule) ? schedule[0] : null
      const eventDate = firstOccurrence?.date || 'Sin fecha'
      const eventTime = firstOccurrence?.time ? ` · ${firstOccurrence.time}` : ''
      const typeLabels: Record<string, string> = {
        campana: 'Campaña',
        convencion: 'Convención General',
        recorrido: 'Recorrido Regional',
        confraternidadJuvenilRegional: 'Confraternidad Juvenil Regional',
        confraternidadJuvenilGeneral: 'Confraternidad Juvenil General',
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
        subtitle: `${typeLabels[eventType] || 'Evento'} • ${eventDate}${eventTime} • ${regionName || '?'}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Más antiguos primero',
      name: 'upcomingAsc',
      by: [{ field: 'schedule.0.date', direction: 'asc' }],
    },
    {
      title: 'Más recientes primero',
      name: 'recentDesc',
      by: [{ field: 'schedule.0.date', direction: 'desc' }],
    },
  ],
})
