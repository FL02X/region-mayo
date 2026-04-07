/**
 * REGION - Nivel Raíz de la Jerarquía
 * 
 * Documento base que agrupa todas las iglesias, pastores, coros y eventos
 * de una región geográfica específica.
 * 
 * RESTRICCIONES:
 * - name: obligatorio y único
 * - slug: generado automáticamente, obligatorio
 * - Todos los documentos hijos DEBEN referenciarse a región
 * 
 * AUDITORÍA: registra quién creó, cuándo, quién modificó, cuándo
 * SOFT DELETE: deletedAt indica si está o no en operación
 */

import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'region',
  title: 'Región',
  type: 'document',
  indexes: [
    { name: 'byActive', keys: [['active']] },
    { name: 'bySlug', keys: [['slug.current']] },
  ],
  fields: [
    // Basic Info
    defineField({
      name: 'name',
      title: 'Nombre de la Región',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Nombre único de la región (ej: "Región Centro", "Región Norte")',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
      description: 'Identificador URL-safe (generado automáticamente)',
    }),

    // Contact & Social
    defineField({
      name: 'socialLinks',
      title: 'Redes Sociales',
      type: 'object',
      fields: [
        defineField({
          name: 'instagram',
          title: 'Instagram URL',
          type: 'url',
          description: 'URL del perfil de Instagram (ej: https://instagram.com/regioncentro)',
        }),
        defineField({
          name: 'facebook',
          title: 'Facebook URL',
          type: 'url',
          description: 'URL del perfil de Facebook',
        }),
      ],
      description: 'Enlaces a redes sociales de la región',
    }),

    // Branding
    defineField({
      name: 'primaryColor',
      title: 'Color Primario',
      type: 'string',
      description: 'Color en formato hex (ej: #1e3a5f) - usado en UI y branding',
      validation: (Rule) => Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
        name: 'hexColor',
        invert: false,
      }).error('Debe ser un color hex válido (#RGB o #RRGGBB)'),
    }),
    defineField({
      name: 'secondaryColor',
      title: 'Color Secundario',
      type: 'string',
      description: 'Color en formato hex - complemento del color primario',
      validation: (Rule) => Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
        name: 'hexColor',
        invert: false,
      }).error('Debe ser un color hex válido (#RGB o #RRGGBB)'),
    }),

    // Status
    defineField({
      name: 'active',
      title: 'Región Activa',
      type: 'boolean',
      initialValue: true,
      description: 'Marcar como inactiva si la región ya no opera',
    }),

    // Auditoría
    defineField({
      name: '_audit',
      title: 'Auditoría',
      type: 'object',
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
      hidden: true,
      description: 'Timestamp de eliminación lógica (soft delete)',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'slug.current',
      active: 'active',
    },
    prepare({ title, subtitle, active }) {
      return {
        title: title,
        subtitle: `${subtitle}${!active ? ' (INACTIVA)' : ''}`,
      }
    },
  },
})
