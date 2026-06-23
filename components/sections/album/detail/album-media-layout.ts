// Donde: no renderiza UI directo. Viewports: detalle de album en desktop y mobile. Funcion: decide tamaños de tiles del masonry.
import type { AlbumGalleryItem } from "@/lib/types";
import { getGalleryItemPreviewUrl } from "@/components/sections/album/shared/album-utils";

export type AlbumTileKind = "normal" | "squareLarge" | "tall" | "wide";

export interface AlbumTileLayout {
  kind: AlbumTileKind;
  className: string;
  imageOptions: {
    width: number;
    height: number;
    quality: number;
    format: "webp";
    fit: "crop";
  };
  sizes: string;
}

function hashString(input: string) {
  let hash = 5381;

  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(index);
  }

  return hash >>> 0;
}

export function getAlbumTileLayout(
  item: AlbumGalleryItem,
  index: number,
  totalCount: number,
  albumSlug: string,
): AlbumTileLayout {
  const hash = hashString(
    `${albumSlug}:${getGalleryItemPreviewUrl(item) || item.type}:${index}`,
  );
  const allowSpecial = totalCount > 4;
  const canBeSpecial = allowSpecial && hash % 100 < 58;

  let kind: AlbumTileKind = "normal";

  if (canBeSpecial) {
    const roll = (hash + index * 17) % 100;
    kind =
      roll < 34
        ? "tall"
        : roll < 70
          ? "wide"
          : "squareLarge";
  }

  const classNameByKind: Record<AlbumTileKind, string> = {
    normal: "aspect-[4/5]",
    squareLarge: "aspect-square",
    tall: "aspect-[2/3]",
    wide: "aspect-[4/3]",
  };

  const imageOptionsByKind: Record<
    AlbumTileKind,
    {
      width: number;
      height: number;
      quality: number;
      format: "webp";
      fit: "crop";
    }
  > = {
    normal: {
      width: 520,
      height: 650,
      quality: 58,
      format: "webp",
      fit: "crop",
    },
    squareLarge: {
      width: 720,
      height: 720,
      quality: 58,
      format: "webp",
      fit: "crop",
    },
    tall: {
      width: 600,
      height: 900,
      quality: 58,
      format: "webp",
      fit: "crop",
    },
    wide: {
      width: 720,
      height: 540,
      quality: 58,
      format: "webp",
      fit: "crop",
    },
  };

  const sizesByKind: Record<AlbumTileKind, string> = {
    normal: "(max-width: 767px) 50vw, 220px",
    squareLarge: "(max-width: 767px) 50vw, 220px",
    tall: "(max-width: 767px) 50vw, 220px",
    wide: "(max-width: 767px) 50vw, 220px",
  };

  return {
    kind,
    className: classNameByKind[kind],
    imageOptions: imageOptionsByKind[kind],
    sizes: sizesByKind[kind],
  };
}
