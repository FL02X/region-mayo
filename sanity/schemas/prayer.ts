/**
 * PRAYER - Submission de Oraciones Anónimas
 *
 * Los usuarios envían sus peticiones anónimamente a través del formulario.
 * Los admins revisan y seleccionan las 6 mejores para mostrar en el carrusel.
 *
 * CÓMO FUNCIONA:
 * 1. Usuario ve el formulario "Enviar Oración" (solo si prayerWall fase = COLLECT)
 * 2. Escribe su petición (máx 500 caracteres)
 * 3. Pasa reCAPTCHA v3 (invisible, detecta bots)
 * 4. Se guarda anónimamente en Sanity
 * 5. Admin revisa, marca como aprobada (o spam)
 * 6. Admin la selecciona en "selectedPrayers" de prayerWall
 * 7. Aparece en el carrusel cuando prayerWall.phase = SHOW
 *
 * NOTA: El hash de IP se guarda SOLO para detección de spam.
 * El texto es 100% anónimo, sin datos personales.
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'prayer',
  title: 'Oración (Submission)',
  type: 'document',

  fields: [
    // ─────────────────────────────────────────────────────────
    // CONTENIDO
    // ─────────────────────────────────────────────────────────
    defineField({
      name: 'text',
      title: 'Texto de la Oración',
      type: 'text',
      validation: (Rule) => Rule.required().min(10).max(500),
      description:
        'La petición u oración del usuario. ' +
        'Máximo 500 caracteres. (Esto es automático, no puedes editarlo aquí)',
    }),

    // ─────────────────────────────────────────────────────────
    // METADATA (Solo lectura, el sistema las rellena)
    // ─────────────────────────────────────────────────────────
    defineField({
      name: 'submittedAt',
      title: 'Enviado en',
      type: 'datetime',
      readOnly: true,
      description: 'Cuándo el usuario envió esta oración',
    }),

    defineField({
      name: 'ipHash',
      title: 'Hash de IP (para detectar spam)',
      type: 'string',
      readOnly: true,
      hidden: true,
      description: 'No es la IP real. Solo un hash para detectar múltiples envíos del mismo usuario.',
    }),

    // ─────────────────────────────────────────────────────────
    // MODERACIÓN
    // ─────────────────────────────────────────────────────────
    defineField({
      name: 'approved',
      title: '✅ Aprobada',
      type: 'boolean',
      initialValue: false,
      description:
        'Marca como APROBADA si quieres que PUEDA aparecer en el carrusel. ' +
        'Solo las aprobadas pueden seleccionarse en "selectedPrayers".',
    }),

    defineField({
      name: 'spam',
      title: '🚫 Spam / Inapropiada',
      type: 'boolean',
      initialValue: false,
      description:
        'Marca como SPAM si: ' +
        '- Contiene publicidad ' +
        '- Lenguaje inapropiado ' +
        '- No es una petición de oración real',
    }),

    defineField({
      name: 'adminNotes',
      title: 'Notas del Admin',
      type: 'text',
      description:
        'Solo para ti. ' +
        'Ej: "Demasiado larga", "Spam detectado", "Buena, seleccionar"',
    }),
  ],

  preview: {
    select: {
      text: 'text',
      approved: 'approved',
      spam: 'spam',
      submittedAt: 'submittedAt',
    },
    prepare(selection) {
      const { text, approved, spam } = selection
      let icon = '⚪'
      if (spam) icon = '🚫'
      else if (approved) icon = '✅'

      return {
        title: `${icon} ${text?.slice(0, 50)}...` || 'Oración',
        subtitle: `Enviado: ${selection.submittedAt}`,
      }
    },
  },
})
