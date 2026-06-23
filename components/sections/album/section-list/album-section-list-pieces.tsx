// Donde: rutas /album/galerias y /album/grabaciones. Viewports: desktop y mobile. Funcion: muestra filtros, tiles de galerias y filas de grabaciones.
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { OfflineImagePlaceholder } from "@/components/shared/offline-image-placeholder";
import { sanityImageVariantUrl } from "@/lib/sanity/image";
import type { Album } from "@/lib/types";
import { CATEGORY_LABELS } from "@/components/sections/album/shared/album-copy";
import { markAlbumTransition } from "@/components/sections/album/shared/album-transition";
import {
  formatAlbumPreviewDate,
  formatGalleryMediaCount,
  getAlbumDetailPath,
  getAlbumMediaItems,
  getVideoDurationLabel,
} from "@/components/sections/album/shared/album-utils";

export function getGalleryYearGridClasses(albumCount: number) {
  if (albumCount <= 1) {
    return "grid grid-cols-1 md:grid-cols-4";
  }

  if (albumCount === 2) {
    return "grid grid-cols-2 md:grid-cols-4";
  }

  return "grid grid-cols-2 md:grid-cols-4";
}

function getGalleryTileTitleClasses(albumCount: number) {
  if (albumCount <= 1) {
    return "text-[38px] md:text-xs";
  }

  if (albumCount === 2) {
    return "text-[22px] md:text-xs";
  }

  return "text-[15px] md:text-xs";
}

function getGalleryTileMetaClasses(albumCount: number) {
  if (albumCount <= 1) {
    return "text-[12px] md:text-[10px]";
  }

  if (albumCount === 2) {
    return "text-[11px] md:text-[10px]";
  }

  return "text-[11px] md:text-[10px]";
}

export function GalleryFilterChip({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        isActive
          ? "border-[#111827] bg-[#111827] text-white"
          : "border-border bg-paper-highlight text-foreground hover:border-primary/40 hover:bg-[#eef4fb]"
      }`}
    >
      {label}
    </button>
  );
}

export function GalleryAlbumTile({
  album,
  groupAlbumCount,
}: {
  album: Album;
  groupAlbumCount: number;
}) {
  const hasGalleryVideos = getAlbumMediaItems(album).some((item) => item.type === "video");
  const itemLabel = formatGalleryMediaCount(album);

  return (
    <Link
      href={getAlbumDetailPath(album)}
      aria-label={`Abrir album ${album.title}`}
      onClick={markAlbumTransition}
      className="group offline-aware-image offline-aware-image--fixed relative block aspect-square overflow-hidden rounded-[3px] bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Image
        src={sanityImageVariantUrl(album.coverImage, {
          width: 560,
          height: 560,
          quality: 70,
          format: "webp",
          fit: "crop",
        })}
        alt={album.title}
        fill
        unoptimized
        className="offline-image-online object-cover transition-transform duration-300 md:group-hover:scale-[1.03]"
        sizes="(max-width: 767px) 100vw, 180px"
      />
      <OfflineImagePlaceholder />
      <div className="absolute inset-0 bg-gradient-to-t from-black/100 via-black/50 to-transparent" />
      {hasGalleryVideos ? (
        <div className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white shadow-sm md:right-2 md:top-2">
          <Play className="h-3.5 w-3.5 translate-x-[1px]" aria-hidden="true" />
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 p-1.5 text-white md:p-2">
        <h2
          className={`line-clamp-2 font-bold leading-[1.1] drop-shadow ${getGalleryTileTitleClasses(
            groupAlbumCount,
          )}`}
        >
          {album.title}
        </h2>
        <p
          className={`mt-0.5 font-normal leading-none text-white/85 ${getGalleryTileMetaClasses(
            groupAlbumCount,
          )}`}
        >
          {itemLabel}
        </p>
      </div>
    </Link>
  );
}

export function RecordingAlbumListItem({ album }: { album: Album }) {
  const previewVideo = album.videos[0];
  const thumbnailUrl = previewVideo?.thumbnailUrl || album.coverImage;
  const durationLabel = getVideoDurationLabel(previewVideo);

  return (
    <Link
      href={getAlbumDetailPath(album)}
      aria-label={`Abrir grabacion ${album.title}`}
      onClick={markAlbumTransition}
      className="group flex gap-3 border-b border-border py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:gap-4"
    >
      <div className="relative h-[72px] w-[128px] shrink-0 overflow-hidden rounded-[4px] bg-[#111827] md:h-[92px] md:w-[164px]">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={album.title}
            fill
            className="object-cover transition-transform duration-300 md:group-hover:scale-[1.03]"
            sizes="(max-width: 767px) 128px, 164px"
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white transition-colors md:group-hover:bg-black/30">
          <Play className="h-5 w-5 translate-x-[1px]" aria-hidden="true" />
        </div>
        {durationLabel ? (
          <span className="absolute bottom-1 right-1 rounded-[2px] bg-black/85 px-1 py-0.5 text-[10px] font-bold leading-none text-white">
            {durationLabel}
          </span>
        ) : null}
      </div>

      <div className="-mt-2.5 min-w-0 flex-1 md:mt-0 md:pt-0.5">
        <span className="mb-1 inline-flex max-w-full items-center rounded-[3px] bg-[#efeee8] px-2 py-1 text-[10px] font-bold uppercase leading-none tracking-wide text-[#56514a]">
          <span className="truncate">{CATEGORY_LABELS[album.category] || album.category}</span>
        </span>
        <h2 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors md:text-[15px] md:group-hover:text-primary">
          {album.title}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatAlbumPreviewDate(album.startDate)}
        </p>
      </div>
    </Link>
  );
}
