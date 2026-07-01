// Donde: hero mobile de home. 
// Viewports: mobile. 
// Funcion: centraliza textos, storage keys y ajustes visuales del hero.
export const MOBILE_HERO_FALLBACK_SRC = "/images/event-conference.jpg";

export const DISTANCE_ORDER_ENABLED_KEY = "region-mayo-templos-distance-order-enabled";
export const SHOW_DISTANCE_BADGES_KEY = "region-mayo-templos-show-distance-badges";
export const GPS_HIGHLIGHT_KEY = "region-mayo-templos-gps-highlight";
export const GPS_HIGHLIGHT_USED_KEY = "region-mayo-templos-gps-highlight-consumed";
export const SKIP_ONLINE_TOAST_KEY = "rm-skip-online-toast";

export const HERO_WATERMARK_LEFT = "84%";
export const HERO_WATERMARK_TOP = "73%";
export const HERO_WATERMARK_LAYER_HEIGHT = "170px";
export const HERO_WATERMARK_OPACITY = 1;

export const MOBILE_HERO_IMAGE_WIDTH = 1242;
export const MOBILE_HERO_IMAGE_OFFSET_X = "0px";
export const MOBILE_HERO_IMAGE_OFFSET_Y = "0px";
export const MOBILE_HERO_IMAGE_ZOOM = 1;

export const MOBILE_HERO_COPY = {
  sectionLabel: "Imagen principal móvil",
  fallbackAlt: "Imagen principal móvil",
  eyebrow: "Iglesia Gentil de Cristo A.R.",
  titlePrefix: "Sitio oficial de la",
  titleRegion: "Región Mayo",
  description: "Eventos e información de nuestras iglesias de la Región Mayo.",
  nearestChurchLabel: "Iglesia más cercana",
  gpsIdleLabel: "Ubicar la iglesia más cercana",
  gpsLoadingLabel: "Buscando...",
  gpsButtonAria: "Buscar iglesia más cercana por GPS",
};

export type LocationErrorKind =
  | "permission_denied"
  | "gps_off"
  | "timeout"
  | "unsupported"
  | "unknown";

export function getLocationErrorMessage(kind: LocationErrorKind, fallbackMessage: string) {
  switch (kind) {
    case "permission_denied":
      return "No aceptaste el permiso de ubicación. Actívalo en los ajustes del navegador para continuar.";
    case "gps_off":
      return "Tu GPS parece estar desactivado. Actívalo e inténtalo de nuevo.";
    case "timeout":
      return "No pudimos obtener tu ubicación a tiempo. Revisa el GPS e inténtalo otra vez.";
    case "unsupported":
      return "Tu navegador o dispositivo no cuenta con tecnología de GPS o ubicación.";
    default:
      return fallbackMessage;
  }
}
