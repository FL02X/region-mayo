/**
 * TEMPLO - Iglesia / Congregación Local
 *
 * Documento que representa una iglesia física local dentro de una región.
 * Agrupa pastores, coros/grupos y puede tener directiva local.
 *
 * JERARQUÍA: Region → Templo → (Pastor, Coro, Directiva Local)
 *
 * RESTRICCIONES:
 * - region: OBLIGATORIA (todos los templos deben estar en una región)
 * - Un templo puede tener:
 *   • N pastores (mínimo 1)
 *   • 0 a N coros (NO es obligatorio)
 *   • 0 a N directiva local
 *
 * AUDITORÍA: registra quién creó, cuándo, quién modificó, cuándo
 * SOFT DELETE: deletedAt indica si el templo está o no en operación
 * GEOLOCALIZACIÓN: geopoint para análisis de proximidad y mapas
 */

import { defineType, defineField } from "sanity";

export default defineType({
  name: "templo",
  title: "Templo",
  type: "document",
  groups: [
    { name: "basic", title: "Información Básica" },
    { name: "location", title: "Ubicación" },
    { name: "contact", title: "Contacto" },
    { name: "metadata", title: "Metadatos" },
  ],
  indexes: [
    { name: "byRegion", keys: [["region"]] },
    { name: "byRegionAndActive", keys: [["region"], ["active"]] },
  ],
  fields: [
    // Basic Info
    defineField({
      name: "temploName",
      title: "Nombre del Templo",
      type: "string",
      group: "basic",
      validation: (Rule) => Rule.required(),
      description:
        'Nombre oficial y completo de la iglesia (ej: "1ra Iglesia de Navojoa", "Iglesia el Redentor"). Si la iglesia tiene un número, inclúyelo en el nombre.',
    }),
    defineField({
      name: "region",
      title: "Región",
      type: "reference",
      to: [{ type: "region" }],
      group: "basic",
      validation: (Rule) => Rule.required(),
      description: "La región a la que pertenece este templo (obligatorio)",
    }),
    defineField({
      name: "photos",
      title: "Fotos del Templo",
      type: "array",
      group: "basic",
      of: [
        {
          type: "image",
          options: {
            hotspot: true,
          },
        },
      ],
      validation: (Rule) => Rule.max(6),
      description:
        "📸 Añade fotos del templo (máximo 6 fotos). Puedes subir fotos del frente, interior, altar, entrada, etc. " +
        "Las fotos ayudan a los visitantes a reconocer el lugar. " +
        "Arrastra y suelta para reordenar las fotos. Las fotos se mostrarán en el sitio web en el orden que las coloques.",
    }),

    // Location Info
    defineField({
      name: "address",
      title: "Dirección Completa",
      type: "string",
      group: "location",
      description:
        "Calle, número, ciudad y estado donde se encuentra el templo",
    }),
    defineField({
      name: "location",
      title: "Ubicación en Mapa (GPS)",
      type: "geopoint",
      group: "location",
      description:
        "Marca el templo en el mapa. Esto se usa para mostrar la ubicación a los visitantes.",
    }),
    defineField({
      name: "googleMapsUrl",
      title: "Enlace de Google Maps",
      type: "url",
      group: "location",
      description:
        "Copia el enlace de Google Maps del templo. Esto permite a la gente ver la ruta.",
    }),

    // Description
    defineField({
      name: "description",
      title: "Horarios y Actividades",
      type: "text",
      group: "basic",
      rows: 4,
      description:
        "Escribe aquí los horarios de los cultos y otras actividades (ej: Cultos: Domingo 10 AM y 6 PM, Estudio Bíblico: Miércoles 7 PM). " +
        "Mantenlo actualizado siempre.",
    }),

    // Auditoría
    defineField({
      name: "audit",
      title: "Auditoría",
      type: "object",
      group: "metadata",
      description: "Información de quién creó/modificó este registro",
      hidden: true,
      fields: [
        defineField({
          name: "createdBy",
          title: "Creado por (UID)",
          type: "string",
          readOnly: true,
        }),
        defineField({
          name: "createdAt",
          title: "Fecha de Creación",
          type: "datetime",
          readOnly: true,
        }),
        defineField({
          name: "modifiedBy",
          title: "Modificado por (UID)",
          type: "string",
          readOnly: true,
        }),
        defineField({
          name: "modifiedAt",
          title: "Fecha de Última Modificación",
          type: "datetime",
          readOnly: true,
        }),
      ],
    }),

    // Soft Delete
    defineField({
      name: "deletedAt",
      title: "Eliminado en",
      type: "datetime",
      group: "metadata",
      hidden: true,
      description: "Timestamp de eliminación lógica (soft delete)",
    }),
  ],
  preview: {
    select: {
      title: "temploName",
      regionName: "region.name",
      photos: "photos",
    },
    prepare({ title, regionName, photos }) {
      return {
        title: title,
        subtitle: `${regionName || "?"}`,
        media: photos && photos.length > 0 ? photos[0] : undefined,
      };
    },
  },
  orderings: [
    {
      title: "Nombre del Templo",
      name: "nameAsc",
      by: [{ field: "temploName", direction: "asc" }],
    },
  ],
});
