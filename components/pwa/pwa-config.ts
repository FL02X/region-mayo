// Donde: no renderiza UI directo. 
// Viewports: afecta desktop y mobile. 
// Funcion: centraliza copy, tiempos y claves PWA editables.

import { Bell, MapPin, type LucideIcon } from "lucide-react";

export const SYNC_INTERVAL_FAST_MS = 6 * 60 * 60 * 1000;
export const SYNC_INTERVAL_SLOW_MS = 12 * 60 * 60 * 1000;
export const ONLINE_TOAST_DURATION_MS = 3000;

export const FONT_SCALE_STORAGE_KEY = "rm-font-scale";
export const SKIP_ONLINE_TOAST_KEY = "rm-skip-online-toast";

export type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

export interface PermissionCardConfig {
  id: "notifications" | "location";
  title: string;
  description: string;
  icon: LucideIcon;
}

export const permissionStatusLabels: Record<PermissionState, string> = {
  granted: "Permitido",
  denied: "Bloqueado",
  prompt: "No solicitado",
  unsupported: "No disponible",
};

// Los textos de permisos viven aqui porque son copy de producto, no logica del navegador.
export const permissionCards: PermissionCardConfig[] = [
  {
    id: "notifications",
    title: "Notificaciones",
    description: "Avisos importantes y recordatorios.",
    icon: Bell,
  },
  {
    id: "location",
    title: "Ubicacion",
    description: "Encontrar templos cercanos cuando lo necesites.",
    icon: MapPin,
  },
];
