import { defineType, defineField } from 'sanity'
import { EventPastorInput } from '../components/inputs/event-pastor-input'

const recorridoActivityFields = [
  defineField({
    name: 'title',
    title: 'NOMBRE DE LA ACTIVIDAD',
    type: 'string',
    validation: (Rule) => Rule.required(),
  }),
  defineField({
    name: 'city',
    title: 'CIUDAD',
    type: 'string',
  }),
  defineField({
    name: 'eventType',
    title: 'TIPO',
    type: 'string',
    validation: (Rule) => Rule.required(),
    description: 'Escribe el tipo de actividad.',
  }),
  defineField({
    name: 'schedule',
    title: 'FECHA Y HORAS',
    type: 'object',
    validation: (Rule) => Rule.required(),
    fields: [
      defineField({
        name: 'date',
        title: 'Fecha',
        type: 'date',
        validation: (Rule) => Rule.required(),
      }),
      defineField({
        name: 'startTime',
        title: 'Hora de inicio',
        type: 'string',
        description: 'Ejemplo: 7:00 PM',
        validation: (Rule) => Rule.required(),
      }),
      defineField({
        name: 'endTime',
        title: 'Hora de fin',
        type: 'string',
        description: 'Ejemplo: 9:00 PM',
        validation: (Rule) => Rule.required(),
      }),
    ],
  }),
  defineField({
    name: 'description',
    title: 'DESCRIPCIÓN (OPCIONAL)',
    type: 'text',
  }),
  defineField({
    name: 'vestimenta',
    title: 'VESTIMENTA (SOLO PARA MIEMBROS MGR)',
    type: 'string',
    options: {
      list: [
        { title: 'Uniforme MGR', value: 'uniformeMGR' },
        { title: 'Vestimenta Formal/Casual', value: 'formalCasual' },
        { title: 'Informal', value: 'informal' },
        { title: 'Otro', value: 'otro' },
      ],
      layout: 'radio',
    },
    description: 'Qué deben usar los jóvenes de la región.',
  }),
  defineField({
    name: 'vestimentaCustom',
    title: 'Vestimenta personalizada',
    type: 'string',
    hidden: ({ parent }) => parent?.vestimenta !== 'otro',
    description: 'Ejemplo: Blanco y negro formal.',
  }),
  defineField({
    name: 'templo',
    title: 'TEMPLO (OPCIONAL, RECOMENDADO)',
    type: 'reference',
    to: [{ type: 'templo' }],
    description:
      'Si eliges un templo, el lugar, la dirección, Google Maps y el pastor se toman automáticamente de ese templo.',
  }),
  defineField({
    name: 'location',
    title: 'Lugar',
    type: 'string',
    hidden: ({ parent }) => !!parent?.templo,
    validation: (Rule) =>
      Rule.custom((value, context) => {
        if (!context.parent?.templo && !value) {
          return 'El nombre del lugar es obligatorio cuando no hay templo asociado.'
        }
        return true
      }),
  }),
  defineField({
    name: 'address',
    title: 'Dirección',
    type: 'string',
    hidden: ({ parent }) => !!parent?.templo,
    validation: (Rule) =>
      Rule.custom((value, context) => {
        if (!context.parent?.templo && !value) {
          return 'La dirección es obligatoria cuando no hay templo asociado.'
        }
        return true
      }),
  }),
  defineField({
    name: 'googleMapsUrl',
    title: 'Google Maps',
    type: 'url',
    hidden: ({ parent }) => !!parent?.templo,
    validation: (Rule) =>
      Rule.custom((value, context) => {
        if (!context.parent?.templo && !value) {
          return 'La URL de Google Maps es obligatoria cuando no hay templo asociado.'
        }
        return true
      }),
  }),
  defineField({
    name: 'pastorMensaje',
    title: 'PASTOR A CARGO DEL EVENTO',
    type: 'reference',
    to: [{ type: 'pastor' }],
    components: {
      input: EventPastorInput,
    },
    description:
      'Si eliges un templo, se sugerirá automáticamente su pastor a cargo.',
  }),
  defineField({
    name: 'pastorMensajeCustom',
    title: 'PASTOR A CARGO - Manual',
    type: 'string',
    validation: (Rule) =>
      Rule.custom((value) => {
        if (typeof value === 'string' && value.trim() === 'Por confirmar') {
          return 'Usa el pastor del templo o deja este campo vacío.'
        }
        return true
      }),
  }),
  defineField({
    name: 'image',
    title: 'IMAGEN PRINCIPAL DE PORTADA',
    type: 'image',
    options: { hotspot: true },
  }),
  defineField({
    name: 'region',
    title: 'REGIÓN',
    type: 'reference',
    to: [{ type: 'region' }],
    validation: (Rule) => Rule.required(),
  }),
]

export default defineType({
  name: 'recorrido',
  title: 'Recorrido',
  type: 'document',
  fields: [
    defineField({
      name: 'year',
      title: 'AÑO',
      type: 'number',
      validation: (Rule) => Rule.required().integer().min(1900).max(2100),
      description: 'Año al que corresponde este recorrido.',
    }),
    defineField({
      name: 'isCurrent',
      title: 'RECORRIDO ACTUAL',
      type: 'boolean',
      initialValue: false,
      description: 'Marca el recorrido que debe aparecer en la carpeta Actual.',
    }),
    defineField({
      name: 'heroAnnouncementEnabled',
      title: 'ACTIVAR ANUNCIO EN EL HERO',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'heroAnnouncementImage',
      title: 'IMAGEN DEL ANUNCIO EN EL HERO',
      type: 'image',
      options: { hotspot: true },
      hidden: ({ document }) => !document?.heroAnnouncementEnabled,
      validation: (Rule) =>
        Rule.custom((value, context) =>
          context.document?.heroAnnouncementEnabled && !value
            ? 'La imagen es obligatoria mientras el anuncio está activo.'
            : true,
        ),
    }),
    defineField({
      name: 'startDate',
      title: 'FECHA DE INICIO',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'FECHA DE FIN',
      type: 'date',
      validation: (Rule) =>
        Rule.required().custom((value, context) => {
          const startDate = context.document?.startDate

          if (
            typeof value === 'string' &&
            typeof startDate === 'string' &&
            value < startDate
          ) {
            return 'La fecha de fin no puede ser anterior a la fecha de inicio.'
          }

          return true
        }),
    }),
    defineField({
      name: 'activities',
      title: 'ACTIVIDADES',
      type: 'array',
      validation: (Rule) => Rule.required().min(1),
      of: [
        {
          name: 'recorridoActivity',
          title: 'Actividad',
          type: 'object',
          fields: recorridoActivityFields,
          preview: {
            select: {
              title: 'title',
              type: 'eventType',
              date: 'schedule.date',
              startTime: 'schedule.startTime',
              temploName: 'templo.temploName',
            },
            prepare({ title, type, date, startTime, temploName }) {
              const schedule = [date, startTime].filter(Boolean).join(' - ')

              return {
                title: title || 'Actividad sin nombre',
                subtitle: [type, schedule, temploName].filter(Boolean).join(' | '),
              }
            },
          },
        },
      ],
      description: 'Estas actividades solo existen dentro del recorrido y no se listan como Eventos.',
    }),
    defineField({
      name: 'productsEnabled',
      title: 'HABILITAR PRODUCTOS',
      type: 'boolean',
      initialValue: false,
      description: 'Activa la sublista de productos para este recorrido.',
    }),
    defineField({
      name: 'products',
      title: 'PRODUCTOS',
      type: 'array',
      hidden: ({ document }) => !document?.productsEnabled,
      of: [
        {
          type: 'reference',
          to: [{ type: 'product' }],
        },
      ],
      description: 'Agrega o crea los productos disponibles para este recorrido.',
    }),
    defineField({
      name: 'audit',
      title: 'Auditoría',
      type: 'object',
      description: 'Información de quién creó o modificó este registro.',
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
          title: 'Fecha de creación',
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
          title: 'Fecha de última modificación',
          type: 'datetime',
          readOnly: true,
        }),
      ],
    }),
    defineField({
      name: 'deletedAt',
      title: 'Eliminado en',
      type: 'datetime',
      hidden: true,
      description: 'Timestamp de eliminación lógica (soft delete).',
    }),
  ],
  preview: {
    select: {
      year: 'year',
      isCurrent: 'isCurrent',
      startDate: 'startDate',
      endDate: 'endDate',
    },
    prepare({ year, isCurrent, startDate, endDate }) {
      const dates = [startDate, endDate].filter(Boolean).join(' - ')

      return {
        title: year ? `Recorrido ${year}` : 'Recorrido',
        subtitle: `${isCurrent ? 'Actual' : 'Anterior'}${dates ? ` - ${dates}` : ''}`,
      }
    },
  },
  orderings: [
    {
      title: 'Actual primero',
      name: 'currentFirst',
      by: [
        { field: 'isCurrent', direction: 'desc' },
        { field: 'year', direction: 'desc' },
      ],
    },
    {
      title: 'Año más reciente primero',
      name: 'yearDesc',
      by: [{ field: 'year', direction: 'desc' }],
    },
  ],
})
