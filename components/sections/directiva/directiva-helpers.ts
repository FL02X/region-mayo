// Donde: no renderiza UI directo. 
// Viewports: afecta /directiva en desktop y mobile. 
// Funcion: centraliza cargos, iconos, imagenes y texto copiable de directiva.
import {
  BarChart3,
  FileText,
  Mic,
  Music,
  PenLine,
  UserCircle,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { sanityImageVariantUrl } from "@/lib/sanity/image";
import type { DirectivaMember } from "@/lib/types";

export const DIRECTIVA_ROLE_META: Record<string, { label: string; order: number }> = {
  "01_presidente_regional": { label: "Presidente Regional", order: 1 },
  "02_suplente_presidente_regional": {
    label: "Suplente Presidente Regional",
    order: 2,
  },
  "03_secretario": { label: "Secretario", order: 3 },
  "04_suplente_secretario": { label: "Suplente Secretario", order: 4 },
  "05_cronista": { label: "Cronista", order: 5 },
  "06_suplente_cronista": { label: "Suplente de Cronista", order: 6 },
  "07_estadistica": { label: "Estadistica", order: 7 },
  "08_suplente_estadistica": { label: "Suplente de Estadistica", order: 8 },
  "09_tesorera": { label: "Tesoreria", order: 9 },
  "10_suplente_tesorera": { label: "Suplente de Tesoreria", order: 10 },
  "11_director_canto": { label: "Director de Canto", order: 11 },
  "12_suplente_director_canto": {
    label: "Suplente de Director de Canto",
    order: 12,
  },
  "13_director_musica": { label: "Director de Musica", order: 13 },
  "14_suplente_director_musica": {
    label: "Suplente de Director de Musica",
    order: 14,
  },

  // Compatibilidad con valores legacy guardados antes de reordenar tesoreria.
  "09_director_canto": { label: "Director de Canto", order: 11 },
  "10_suplente_director_canto": {
    label: "Suplente de Director de Canto",
    order: 12,
  },
  "11_director_musica": { label: "Director de Musica", order: 13 },
  "12_suplente_director_musica": {
    label: "Suplente de Director de Musica",
    order: 14,
  },
};

const DIRECTIVA_ROLE_ICON: Record<string, LucideIcon> = {
  "01_presidente_regional": UserCircle,
  "02_suplente_presidente_regional": UserCircle,
  "03_secretario": FileText,
  "04_suplente_secretario": FileText,
  "05_cronista": PenLine,
  "06_suplente_cronista": PenLine,
  "07_estadistica": BarChart3,
  "08_suplente_estadistica": BarChart3,
  "09_tesorera": Wallet,
  "10_suplente_tesorera": Wallet,
  "11_director_canto": Mic,
  "12_suplente_director_canto": Mic,
  "13_director_musica": Music,
  "14_suplente_director_musica": Music,

  "09_director_canto": Mic,
  "10_suplente_director_canto": Mic,
  "11_director_musica": Music,
  "12_suplente_director_musica": Music,
};

const DIRECTIVA_THUMB_IMAGE_OPTIONS = {
  width: 320,
  quality: 72,
  format: "webp",
  fit: "max",
} as const;

const DIRECTIVA_CARD_IMAGE_OPTIONS = {
  width: 960,
  quality: 72,
  format: "webp",
  fit: "max",
} as const;

const DIRECTIVA_PRINT_IMAGE_OPTIONS = {
  width: 1200,
  quality: 78,
  format: "webp",
  fit: "max",
} as const;

export const getDirectivaRoleLabel = (role?: string) => {
  if (!role) return "";
  return DIRECTIVA_ROLE_META[role]?.label ?? role;
};

export const getDirectivaRoleOrder = (role?: string) => {
  if (!role) return Number.MAX_SAFE_INTEGER;

  const roleOrder = DIRECTIVA_ROLE_META[role]?.order;
  if (typeof roleOrder === "number") {
    return roleOrder;
  }

  const prefixed = Number.parseInt(role.split("_")[0], 10);
  if (Number.isFinite(prefixed)) {
    return prefixed;
  }

  return Number.MAX_SAFE_INTEGER;
};

export const getDirectivaRoleIcon = (role?: string): LucideIcon =>
  role ? DIRECTIVA_ROLE_ICON[role] ?? UserCircle : UserCircle;

export const getDirectivaImageUrl = (
  photo?: string,
  kind: "thumb" | "card" | "print" = "card",
) => {
  if (!photo) return "";

  if (kind === "thumb") {
    return sanityImageVariantUrl(photo, DIRECTIVA_THUMB_IMAGE_OPTIONS);
  }

  if (kind === "print") {
    return sanityImageVariantUrl(photo, DIRECTIVA_PRINT_IMAGE_OPTIONS);
  }

  return sanityImageVariantUrl(photo, DIRECTIVA_CARD_IMAGE_OPTIONS);
};

export const buildDirectivaCopyText = (member: DirectivaMember) => {
  const roleLabel = getDirectivaRoleLabel(member.role);
  const sections = [
    [member.fullName],
    roleLabel ? [roleLabel] : [],
    member.temploName ? [member.temploName] : [],
    member.address ? [member.address] : [],
    [formatPhoneForDisplay(member.phone)],
    member.googleMapsUrl ? [member.googleMapsUrl] : [],
  ].filter((section) => section.length > 0);

  return sections.map((section) => section.join("\n")).join("\n\n");
};
