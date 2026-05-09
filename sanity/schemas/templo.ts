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

const WEEKDAY_OPTIONS = [
  { title: "Lunes", value: "monday" },
  { title: "Martes", value: "tuesday" },
  { title: "Miércoles", value: "wednesday" },
  { title: "Jueves", value: "thursday" },
  { title: "Viernes", value: "friday" },
  { title: "Sábado", value: "saturday" },
  { title: "Domingo", value: "sunday" },
];

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

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

    // Schedules (structured, editor-friendly)
    defineField({
      name: "schedule",
      title: "Horarios de Reunión",
      type: "object",
      group: "basic",
      description:
        "Agrega solo los días que sí tienen culto o actividad. " +
        "Ejemplo común: Martes, Jueves y Domingo.",
      fields: [
        defineField({
          name: "timezone",
          title: "Zona horaria",
          type: "string",
          initialValue: "America/Hermosillo",
          hidden: true,
          readOnly: true,
          description:
            "Zona horaria fija para la Región Mayo. Oculto para evitar confusión; no es necesario editar.",
        }),
        defineField({
          name: "services",
          title: "Días con culto / actividad",
          type: "array",
          description:
            "Solo agrega días activos. Si un día no aparece aquí, se considera sin actividades.",
          of: [
            {
              type: "object",
              name: "serviceSlot",
              title: "Horario",
              fields: [
                defineField({
                  name: "day",
                  title: "Día de la semana",
                  type: "string",
                  options: {
                    list: WEEKDAY_OPTIONS,
                    layout: "dropdown",
                  },
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: "startTime",
                  title: "Hora de inicio (24h)",
                  type: "string",
                  placeholder: "18:30",
                  description: "Formato HH:MM. Ejemplo: 18:30 o 10:00",
                  validation: (Rule) =>
                    Rule.required().regex(
                      TIME_24H_REGEX,
                      { name: "time", invert: false }
                    ).error("Usa formato HH:MM (24h). Ejemplo: 18:30"),
                }),
                defineField({
                  name: "endTime",
                  title: "Hora de fin (opcional)",
                  type: "string",
                  placeholder: "20:00",
                  description: "Formato HH:MM. Déjalo vacío si no aplica.",
                  validation: (Rule) =>
                    Rule.regex(TIME_24H_REGEX, {
                      name: "time",
                      invert: false,
                    }).error("Usa formato HH:MM (24h). Ejemplo: 20:00"),
                }),
                defineField({
                  name: "label",
                  title: "Nombre de actividad (opcional)",
                  type: "string",
                  initialValue: "Culto",
                  description:
                    "Ejemplo: Culto general, Estudio bíblico, Reunión de jóvenes.",
                }),
              ],
              preview: {
                select: {
                  day: "day",
                  startTime: "startTime",
                  endTime: "endTime",
                  label: "label",
                },
                prepare({ day, startTime, endTime, label }) {
                  const dayTitle =
                    WEEKDAY_OPTIONS.find((d) => d.value === day)?.title || day || "Día";
                  const range = endTime
                    ? `${startTime || "--:--"} - ${endTime}`
                    : `${startTime || "--:--"}`;
                  return {
                    title: `${dayTitle} · ${range}`,
                    subtitle: label || "Culto",
                  };
                },
              },
            },
          ],
        }),
      ],
    }),

    // Legacy/free text
    defineField({
      name: "description",
      title: "Notas adicionales de horarios y actividades (opcional)",
      type: "text",
      group: "basic",
      rows: 4,
      description:
        "Texto libre opcional para aclaraciones. " +
        "Los horarios principales ahora deben capturarse en 'Horarios de Reunión'.",
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
