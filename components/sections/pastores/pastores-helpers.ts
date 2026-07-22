// Donde: no renderiza UI directo. Viewports: afecta /pastores en desktop y mobile. Funcion: centraliza imagenes y texto copiable de pastores.
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { sanityImageVariantUrl } from "@/sanity/lib/image";
import type { Pastor } from "@/lib/types";

const PASTOR_THUMB_IMAGE_OPTIONS = {
  width: 320,
  quality: 72,
  format: "webp",
  fit: "max",
} as const;

const PASTOR_CARD_IMAGE_OPTIONS = {
  width: 960,
  quality: 72,
  format: "webp",
  fit: "max",
} as const;

const PASTOR_PRINT_IMAGE_OPTIONS = {
  width: 1200,
  quality: 78,
  format: "webp",
  fit: "max",
} as const;

export const getPastorImageUrl = (
  photo?: string,
  kind: "thumb" | "card" | "print" = "card",
) => {
  if (!photo) return "";

  if (kind === "thumb") {
    return sanityImageVariantUrl(photo, PASTOR_THUMB_IMAGE_OPTIONS);
  }

  if (kind === "print") {
    return sanityImageVariantUrl(photo, PASTOR_PRINT_IMAGE_OPTIONS);
  }

  return sanityImageVariantUrl(photo, PASTOR_CARD_IMAGE_OPTIONS);
};

export const buildPastorCopyText = (pastor: Pastor) => {
  const sections = [
    [pastor.fullName],
    pastor.temploName ? [pastor.temploName] : [],
    pastor.churchNumber ? [`Iglesia #${pastor.churchNumber}`] : [],
    pastor.address ? [pastor.address] : [],
    pastor.phone ? [formatPhoneForDisplay(pastor.phone)] : [],
    pastor.googleMapsUrl ? [pastor.googleMapsUrl] : [],
  ].filter((section) => section.length > 0);

  return sections.map((section) => section.join("\n")).join("\n\n");
};
