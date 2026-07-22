import { defineField, defineType } from 'sanity'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

export default defineType({
  name: 'albumPhotoSubmission',
  title: 'Foto comunitaria',
  type: 'document',
  fields: [
    defineField({
      name: 'photo',
      title: 'Foto',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'album',
      title: 'Album',
      type: 'reference',
      to: [{ type: 'album' }],
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Estado',
      type: 'string',
      initialValue: 'pending',
      options: {
        list: [
          { title: 'Pendiente', value: 'pending' },
          { title: 'Aprobada', value: 'approved' },
          { title: 'Rechazada', value: 'rejected' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'submittedByName',
      title: 'Nombre de quien envio',
      type: 'string',
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'uploadedAt',
      title: 'Fecha de subida',
      type: 'datetime',
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'originalFilename',
      title: 'Nombre original del archivo',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'fileSize',
      title: 'Tamano del archivo',
      type: 'number',
      readOnly: true,
      description: 'Tamano en bytes despues de la optimizacion del navegador.',
    }),
    defineField({
      name: 'contentType',
      title: 'Tipo de archivo',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'submissionSessionId',
      title: 'ID del envio',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'uploadTokenHash',
      title: 'Hash del token de subida',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'ipHash',
      title: 'Hash de IP',
      type: 'string',
      readOnly: true,
      hidden: true,
      description: 'No es la IP real. Se usa solo para limitar abuso.',
    }),
    defineField({
      name: 'userAgent',
      title: 'Navegador',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'adminNotes',
      title: 'Notas del admin',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      media: 'photo',
      status: 'status',
      albumTitle: 'album.title',
      uploadedAt: 'uploadedAt',
      submittedByName: 'submittedByName',
    },
    prepare({ media, status, albumTitle, uploadedAt, submittedByName }) {
      const statusLabel = STATUS_LABELS[status] || 'Pendiente'
      const sender = submittedByName ? submittedByName.toUpperCase() : 'SIN NOMBRE'

      return {
        title: statusLabel,
        subtitle: `${sender} - ${albumTitle || 'Sin album'} - ${uploadedAt || 'Sin fecha'}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Mas recientes primero',
      name: 'uploadedAtDesc',
      by: [{ field: 'uploadedAt', direction: 'desc' }],
    },
    {
      title: 'Mas antiguos primero',
      name: 'uploadedAtAsc',
      by: [{ field: 'uploadedAt', direction: 'asc' }],
    },
  ],
})
