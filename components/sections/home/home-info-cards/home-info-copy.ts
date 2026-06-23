// Donde: tarjetas informativas de home. Viewports: desktop y mobile. Funcion: centraliza textos, links y mensajes editables.
import type { LucideIcon } from "lucide-react";
import { BookOpen, Heart, Music } from "lucide-react";

export type HomeInfoCardItem = {
  id: "free-services" | "bible" | "hymnal";
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href?: string;
  actionLabel?: string;
};

export const HOME_INFO_CARDS: HomeInfoCardItem[] = [
  {
    id: "free-services",
    eyebrow: "Bienvenido",
    icon: Heart,
    title: "Servicios gratuitos",
    subtitle: "Todos somos bienvenidos. Nuestros servicios son completamente gratuitos.",
  },
  {
    id: "bible",
    eyebrow: "Nuestra Biblia",
    icon: BookOpen,
    title: "Biblia Reina-Valera 1909",
    subtitle: "La traducción que usamos y recomendamos. Accede a ella aquí.",
    href: "https://www.mercadolibre.com.mx/biblia-rv1909-mediana-negro-indice-vr055ti-de-reina-valera-1909-editorial-sociedades-biblicas-tapa-blanda-en-espanol/p/MLM45695178",
    actionLabel: "Ver ejemplo de biblia",
  },
  {
    id: "hymnal",
    eyebrow: "Canta Con Nosotros",
    icon: Music,
    title: "Himnario Mensajeros del Gran Rey",
    subtitle: "Descarga nuestro himnario para cantar con nosotros.",
    actionLabel: "Descargar Himnario",
  },
];

export const HYMNAL_DOWNLOAD_URL = "/api/download-himnario";
export const HYMNAL_FILE_NAME = "HIMNARIO MENSAJEROS DEL GRAN REY.pdf";

export const HOME_INFO_DOWNLOAD_COPY = {
  offlineAlert: "Sin conexion. Conectate a internet para descargar el archivo.",
  rateLimitAlert: "Has alcanzado el límite de descargas. Intenta nuevamente en 24 horas.",
  errorAlert: "Hubo un error al descargar el archivo. Intenta nuevamente.",
  downloadingSuffix: " (Descargando...)",
  offlineSuffix: " (Sin conexion)",
};
