/**
 * REGISTRATION - Registros de Asistentes
 * 
 * DOCUMENTO TRANSACCIONAL
 * Se crea cuando un usuario se registra en un evento
 * 
 * CARACTERÍSTICAS:
 * - Datos desnormalizados intencionalmente para performance analytics
 * - ipAddress y userAgent: readOnly, para detectar spam/duplicados
 * 
 * PARTICIONAMIENTO: partition agrupa registros por año-mes
 * - Facilita queries eficientes en datasets grandes
 * - Permite archivar datos históricos anualmente
 * 
 * AUDITORÍA SIMPLIFICADA: solo timestamps readOnly
 * - Los datos no se modifican, solo se crean
 * - El timestamp es inmutable
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'registration',
  title: 'Registro de Evento',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Información Básica', hidden: true },
    { name: 'preferences', title: 'Preferencias', hidden: true },
    { name: 'status', title: 'Estado', hidden: true },
    { name: 'metadata', title: 'Metadatos', hidden: true },
  ],
  indexes: [
    { name: 'byEvent', keys: [['event']] },
    { name: 'byPartition', keys: [['partition']] },
    { name: 'byEventAndPartition', keys: [['event'], ['partition']] },
  ],
  fields: [
    // Basic Info
    defineField({
      name: 'name',
      title: 'Nombre Completo',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Nombre completo del asistente',
    }),
    defineField({
      name: 'phone',
      title: 'Teléfono',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Teléfono de contacto (WhatsApp)',
    }),
    defineField({
      name: 'event',
      title: 'Evento',
      type: 'reference',
      to: [{ type: 'event' }],
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Evento en el que se registra el asistente',
    }),

    // Preferences
    defineField({
      name: 'needsLodging',
      title: 'Necesita hospedaje',
      type: 'boolean',
      group: 'preferences',
      initialValue: false,
      description: 'Si necesita alojamiento durante el evento',
    }),
    defineField({
      name: 'needsTransport',
      title: 'Necesita transporte',
      type: 'boolean',
      group: 'preferences',
      initialValue: false,
      description: 'Si necesita transporte hacia el evento',
    }),

    // Status & Attendance
    defineField({
      name: 'attendingAs',
      title: 'Asistiendo como',
      type: 'string',
      group: 'status',
      options: {
        list: [
          { title: 'Oyente', value: 'oyente' },
          { title: 'Miembro', value: 'miembro' },
        ],
        layout: 'radio',
      },
      initialValue: 'oyente',
      description: 'Clasificación del asistente en el evento',
    }),
    defineField({
      name: 'isBaptized',
      title: 'Es bautizado/a',
      type: 'boolean',
      group: 'status',
      initialValue: false,
    }),
    defineField({
      name: 'isCoroMGR',
      title: 'Es joven del coro MGR',
      type: 'boolean',
      group: 'status',
      initialValue: false,
      description: 'Marca especial para jóvenes del movimiento',
    }),

    // Timestamps & Metadata
    defineField({
      name: 'registeredAt',
      title: 'Fecha de Registro',
      type: 'datetime',
      group: 'metadata',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
      description: 'Cuándo se creó este registro (inmutable)',
    }),
    defineField({
      name: 'partition',
      title: 'Partición (Año-Mes)',
      type: 'string',
      group: 'metadata',
      hidden: true,
      readOnly: true,
      initialValue: () => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      },
      description: 'Partición temporal para queries eficientes (YYYY-MM)',
    }),
    defineField({
      name: 'ipAddress',
      title: 'Dirección IP',
      type: 'string',
      group: 'metadata',
      hidden: true,
      readOnly: true,
      description: 'IP del cliente (para detectar spam duplicado)',
    }),
    defineField({
      name: 'userAgent',
      title: 'User Agent',
      type: 'string',
      group: 'metadata',
      hidden: true,
      readOnly: true,
      description: 'Información del navegador/cliente',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      eventTitle: 'event.title',
      date: 'registeredAt',
      attending: 'attendingAs',
    },
    prepare({ title, eventTitle, date, attending }) {
      const eventDate = date ? new Date(date).toLocaleDateString('es-MX') : 'Sin fecha'
      const attendingLabel = attending === 'miembro' ? '👤 Miembro' : '👁️ Oyente'
      return {
        title: title,
        subtitle: `${attendingLabel} • ${eventTitle || '?'} • ${eventDate}`,
      }
    },
  },
  orderings: [
    {
      title: 'Registros Recientes',
      name: 'recentDesc',
      by: [{ field: 'registeredAt', direction: 'desc' }],
    },
  ],
})
