// Donde: calendario de home y planner mensual mobile. Viewports: desktop y mobile. Funcion: centraliza labels, colores y constantes editables.
import type { EventType } from "@/lib/types";

export const CALENDAR_MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const WEEKDAY_LABELS = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

export const CALENDAR_FADE_TRANSITION = { duration: 0.1, ease: "easeOut" as const };

export const PRELOAD_MONTH_OFFSETS = [-1, 0, 1];
export const MAX_PRELOADED_EVENT_THUMBNAILS = 10;
export const THUMBNAIL_PRELOAD_DELAY_MS = 1400;

export const INITIAL_PAST_MONTHS = 12;
export const INITIAL_FUTURE_MONTHS = 18;
export const MONTHS_TO_APPEND = 12;
export const LOAD_MORE_THRESHOLD = 8;
export const MONTH_RENDER_RADIUS = 1;
export const MONTH_PLANNER_SNAP_DURATION = 0;
export const MONTH_PLANNER_MONTH_COMMIT_DELAY_MS = 560;

export const EVENT_TYPE_PLANNER_COLORS: Record<
  EventType,
  { ink: string; paper: string; border: string }
> = {
  campana: { ink: "#2f5e93", paper: "#e6edf6", border: "#b8cbe1" },
  convencion: { ink: "#8c731e", paper: "#fdf6e1", border: "#e7d18a" },
  recorrido: { ink: "#1a737f", paper: "#e1f3f6", border: "#a9d5dc" },
  confraternidadJuvenilRegional: {
    ink: "#a83e3e",
    paper: "#fef2f2",
    border: "#e7b7b7",
  },
  confraternidadJuvenilGeneral: {
    ink: "#a83e3e",
    paper: "#fef2f2",
    border: "#e7b7b7",
  },
  cultoJuvenil: { ink: "#a83e3e", paper: "#fef2f2", border: "#e7b7b7" },
  culto: { ink: "#26733a", paper: "#e6f6eb", border: "#add5b8" },
  visita: { ink: "#1a737f", paper: "#e1f3f6", border: "#a9d5dc" },
  ensayo: { ink: "#26733a", paper: "#e6f6eb", border: "#add5b8" },
  actividad: { ink: "#26733a", paper: "#e6f6eb", border: "#add5b8" },
  estudioBiblico: { ink: "#26733a", paper: "#e6f6eb", border: "#add5b8" },
  biregional: { ink: "#8c731e", paper: "#fdf6e1", border: "#e7d18a" },
  congresoBrilla: { ink: "#6a3f91", paper: "#f1e6f6", border: "#d2b5df" },
  boda: { ink: "#6a3f91", paper: "#f1e6f6", border: "#d2b5df" },
};
