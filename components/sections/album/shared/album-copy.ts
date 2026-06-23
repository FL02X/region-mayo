// Donde: no renderiza UI directo. Viewports: afecta album en desktop y mobile. Funcion: centraliza labels y filtros editables.
import type { EventType } from "@/lib/types";

export const CATEGORY_LABELS: Record<EventType, string> = {
  campana: "Campaña",
  convencion: "Convención General",
  recorrido: "Recorrido Regional",
  confraternidadJuvenilRegional: "Confraternidad Juvenil Regional",
  confraternidadJuvenilGeneral: "Confraternidad Juvenil General",
  cultoJuvenil: "Culto Juvenil",
  culto: "Culto",
  visita: "Visita",
  ensayo: "Ensayo",
  actividad: "Actividad",
  estudioBiblico: "Estudio Bíblico",
  biregional: "Biregional",
  congresoBrilla: "Congreso Brilla",
  boda: "Boda",
};

export const ALL_FILTER = "todos";
export const VIDEO_FILTER = "videos";
export const PHOTO_FILTER = "fotos";
