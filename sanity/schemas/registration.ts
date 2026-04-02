/**
 * Registration Schema for Sanity CMS
 * Stores event registrations
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'registration',
  title: 'Registro de Evento',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre Completo',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'phone',
      title: 'Teléfono',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'region',
      title: 'Región del Asistente',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'event',
      title: 'Evento',
      type: 'reference',
      to: [{ type: 'event' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isVisiting',
      title: 'Viene de otra región',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'needsLodging',
      title: 'Necesita hospedaje',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'needsTransport',
      title: 'Necesita transporte',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'attendingAs',
      title: 'Asistiendo como',
      type: 'string',
      options: {
        list: [
          { title: 'Oyente', value: 'oyente' },
          { title: 'Miembro', value: 'miembro' },
        ],
        layout: 'radio',
      },
      initialValue: 'oyente',
    }),
    defineField({
      name: 'isBaptized',
      title: 'Es bautizado',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'isCoroMGR',
      title: 'Es joven del coro MGR',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'registeredAt',
      title: 'Fecha de Registro',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({
      name: 'ipAddress',
      title: 'Dirección IP',
      type: 'string',
      description: 'Para detectar posible spam',
      readOnly: true,
    }),
    defineField({
      name: 'userAgent',
      title: 'User Agent',
      type: 'string',
      description: 'Información del navegador',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'event.title',
      date: 'registeredAt',
    },
    prepare({ title, subtitle, date }) {
      const formattedDate = date ? new Date(date).toLocaleDateString('es-MX') : ''
      return {
        title: title || 'Sin nombre',
        subtitle: `${subtitle || 'Sin evento'} - ${formattedDate}`,
      }
    },
  },
  orderings: [
    {
      title: 'Fecha de Registro (Reciente)',
      name: 'registeredAtDesc',
      by: [{ field: 'registeredAt', direction: 'desc' }],
    },
  ],
})
