// Donde: badges y CTAs visibles en action deck. 
// Viewports: desktop y mobile. 
// Funcion: centraliza textos, colores e iconos editables de cada tarjeta.
import type { ReactNode } from "react";
import {
  Calendar,
  Headphones,
  HeartHandshake,
  Instagram as InstagramIcon,
  Megaphone,
} from "lucide-react";
import type { DeckItemType } from "@/components/sections/home/action-deck/action-deck-types";

export const BADGE_META: Record<
  DeckItemType,
  { label: string; classes: string; icon: ReactNode }
> = {
  event: {
    label: "Próximo evento",
    classes: "text-[#2f5e93]",
    icon: <Calendar className="h-3 w-3" aria-hidden="true" />,
  },
  instagram: {
    label: "Instagram",
    classes: "text-[#e4405f]",
    icon: <InstagramIcon className="h-3 w-3" aria-hidden="true" />,
  },
  facebook: {
    label: "Facebook",
    classes: "text-[#1877f2]",
    icon: <span className="text-[14px] font-black leading-none" aria-hidden="true">f</span>,
  },
  prayer: {
    label: "Peticiones de oracion",
    classes: "text-[#2d6a4f]",
    icon: <HeartHandshake className="h-3 w-3" aria-hidden="true" />,
  },
  promo: {
    label: "Aviso",
    classes: "text-[#e36600]",
    icon: <Megaphone className="h-3 w-3" aria-hidden="true" />,
  },
  audio: {
    label: "Audio",
    classes: "text-[#3730a3]",
    icon: <Headphones className="h-3 w-3" aria-hidden="true" />,
  },
};

export const CTA_LABEL: Record<DeckItemType, string> = {
  event: "Ver evento",
  instagram: "Ver publicación",
  facebook: "Ver publicación",
  prayer: "Pedir oración",
  promo: "Ver más",
  audio: "Escuchar",
};
