// Donde: imagen del hero mobile de home. Viewports: mobile. Funcion: normaliza URLs de Sanity y conserva fallback local.
import {
  MOBILE_HERO_FALLBACK_SRC,
  MOBILE_HERO_IMAGE_WIDTH,
} from "@/components/sections/home/hero-section/mobile-hero-config";

export function getMobileHeroImageSrc(value: string | undefined) {
  const source = value?.trim() ? value : MOBILE_HERO_FALLBACK_SRC;
  if (source.startsWith("/")) return source;

  try {
    const url = new URL(source);
    if (url.hostname !== "cdn.sanity.io") return source;

    url.searchParams.set("w", String(MOBILE_HERO_IMAGE_WIDTH));
    url.searchParams.set("q", "58");
    url.searchParams.set("fit", "max");
    url.searchParams.set("auto", "format");
    return url.toString();
  } catch {
    return source;
  }
}
