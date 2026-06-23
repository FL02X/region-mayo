// Donde: no renderiza UI directo. Viewports: afecta /coros en desktop y mobile. Funcion: centraliza imagenes, orden y texto copiable de coros.
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { sanityImageVariantUrl } from "@/lib/sanity/image";
import type { Coro } from "@/lib/types";

const CORO_THUMB_IMAGE_OPTIONS = {
  width: 320,
  quality: 72,
  format: "webp",
  fit: "max",
} as const;

const CORO_CARD_IMAGE_OPTIONS = {
  width: 960,
  quality: 72,
  format: "webp",
  fit: "max",
} as const;

const CORO_PRINT_IMAGE_OPTIONS = {
  width: 1200,
  quality: 78,
  format: "webp",
  fit: "max",
} as const;

export const getCoroImageUrl = (
  photo?: string,
  kind: "thumb" | "card" | "print" = "card",
) => {
  if (!photo) return "";

  if (kind === "thumb") {
    return sanityImageVariantUrl(photo, CORO_THUMB_IMAGE_OPTIONS);
  }

  if (kind === "print") {
    return sanityImageVariantUrl(photo, CORO_PRINT_IMAGE_OPTIONS);
  }

  return sanityImageVariantUrl(photo, CORO_CARD_IMAGE_OPTIONS);
};

export const sortCorosForDisplay = (coros: Coro[]) => {
  return [...coros].sort((a, b) => {
    const aCount = typeof a.memberCount === "number" ? a.memberCount : -1;
    const bCount = typeof b.memberCount === "number" ? b.memberCount : -1;
    const aHasImage = Boolean(a.photo && a.photo !== "/placeholder.svg");
    const bHasImage = Boolean(b.photo && b.photo !== "/placeholder.svg");

    if (aCount !== bCount) {
      return bCount - aCount;
    }

    if (aHasImage !== bHasImage) {
      return aHasImage ? -1 : 1;
    }

    return (a.coroName ?? "").localeCompare(b.coroName ?? "", "es", {
      sensitivity: "base",
    });
  });
};

export const buildCoroCopyText = (coro: Coro) => {
  const sections = [
    [coro.coroName],
    coro.temploName ? [coro.temploName] : [],
    coro.address ? [coro.address] : [],
    [
      coro.presidentPhone
        ? `${coro.presidentName}\n${formatPhoneForDisplay(coro.presidentPhone)}`
        : coro.presidentName,
    ],
    coro.googleMapsUrl ? [coro.googleMapsUrl] : [],
  ].filter((section) => section.length > 0);

  return sections.map((section) => section.join("\n")).join("\n\n");
};
