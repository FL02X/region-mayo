/**
 * PRAYER WALL - Configuración del Muro de Oraciones
 *
 * Este documento controla la fase actual del Muro de Oraciones.
 *
 * DOS FASES:
 * 1. FASE "COLLECT" (Recolección):
 *    - Los usuarios ven un botón "Enviar Oración" en el hero
 *    - Pueden escribir su petición anónimamente
 *    - Las oraciones se guardan en la base de datos
 *    - Los admins pueden revisarlas y seleccionar 6 para mostrar
 *
 * 2. FASE "SHOW" (Muestra):
 *    - Los usuarios ven un carrusel con 6 oraciones seleccionadas
 *    - El carrusel aparece en el hero (toma prioridad sobre eventos y contenido custom)
 *    - Los usuarios NO pueden enviar nuevas oraciones (botón desaparece)
 *    - Al terminar este período, vuelve a COLLECT o se pausa
 *
 * PARA ADMINS:
 * 1. Durante RECOLECTANDO: Revisa las oraciones enviadas, marca las que quieras mostrar
 * 2. Cuando estés listo, cambia a MOSTRANDO
 * 3. El sistema automáticamente mostrará las 6 oraciones seleccionadas
 * 4. Cuando ya no quieras que aparezca, cambia a PARADO
 *
 * IMPORTANTE: Solo el "Muro de Oraciones" en fase SHOW puede tomar prioridad
 * sobre Tarjetas Custom (por 24h). Si un Muro está activo en SHOW, SIEMPRE aparece.
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'prayerWall',
  title: 'Muro de Oraciones - Configuración',
  type: 'document',

  fields: [
    // ─────────────────────────────────────────────────────────
    // ESTADO ACTUAL
    // ─────────────────────────────────────────────────────────
    defineField({
      name: 'phase',
      title: 'Fase Actual',
      type: 'string',
      options: {
        list: [
          { title: '🔴 PARADO - No recolectar ni mostrar', value: 'paused' },
          { title: '📝 RECOLECTANDO - Usuarios pueden enviar oraciones', value: 'collect' },
          { title: '✨ MOSTRANDO - Carrusel de 6 oraciones en hero', value: 'show' },
        ],
        layout: 'radio',
      },
      description:
        'La fase determina qué ven los usuarios:\n' +
        '- RECOLECTANDO: Aparece un botón "Enviar Oración"\n' +
        '- MOSTRANDO: Aparece un carrusel con 6 oraciones seleccionadas\n' +
        '- PARADO: El Muro desaparece de la página',
      initialValue: 'collect',
      validation: (Rule) => Rule.required(),
    }),

    // ─────────────────────────────────────────────────────────
    // SELECCIÓN DE ORACIONES
    // ─────────────────────────────────────────────────────────
    defineField({
      name: 'selectedPrayers',
      title: 'Oraciones Seleccionadas (máx 6)',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'prayer' }] }],
      validation: (Rule) => Rule.max(6),
      description:
        'Selecciona hasta 6 oraciones para mostrar en el carrusel. ' +
        'Arrastra para reordenar. Solo se muestran si fase = MOSTRANDO.',
    }),

    // ─────────────────────────────────────────────────────────
    // CONTROL
    // ─────────────────────────────────────────────────────────
    defineField({
      name: 'enabled',
      title: 'Habilitado Globalmente',
      type: 'boolean',
      initialValue: true,
      description:
        'Si desactivas esto, el Muro de Oraciones desaparece completamente de la página. ' +
        '¡No lo toques a menos que sepas qué haces!',
    }),

    defineField({
      name: 'publishedAt',
      title: 'Fecha de Publicación (para prioridad)',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      hidden: true,
      description: 'Sistema interno: cuándo se publicó esta configuración',
    }),

    defineField({
      name: 'notes',
      title: 'Notas (solo para ti)',
      type: 'text',
      description: 'Ej: "Campaña de mayo", "Prueba del sistema", etc. Solo visible para admins.',
    }),
  ],

  preview: {
    select: {
      phase: 'phase',
      selectedCount: 'selectedPrayers',
    },
    prepare(selection) {
      const phaseIcons: Record<string, string> = {
        collect: '📝',
        show: '✨',
        paused: '🔴',
      }
      return {
        title: `Muro de Oraciones - ${phaseIcons[selection.phase] || '❓'} ${selection.phase?.toUpperCase()}`,
        subtitle: `${selection.selectedCount?.length || 0} oraciones seleccionadas`,
      }
    },
  },
})
