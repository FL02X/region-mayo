// Donde: detalle de album y lista general. 
// Viewports: desktop y mobile. 
// Funcion: tarjetas, videos y tiles de media del album.
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Play, PlayCircle } from "lucide-react";
import { OfflineImagePlaceholder } from "@/components/shared/offline-image-placeholder";
import { sanityImageVariantUrl } from "@/sanity/lib/image";
import { CATEGORY_LABELS } from "@/components/sections/album/shared/album-copy";
import { markAlbumTransition } from "@/components/sections/album/shared/album-transition";
import {
  formatAlbumDate,
  formatAlbumPreviewDate,
  formatGalleryMediaCount,
  formatMediaCount,
  getAlbumDetailPath,
  getAlbumMediaItems,
  getGalleryItemPreviewUrl,
} from "@/components/sections/album/shared/album-utils";
import type { Album, AlbumGalleryItem, AlbumVideo } from "@/lib/types";
import type { AlbumTileLayout } from "@/components/sections/album/detail/album-media-layout";

export function AlbumCard({ album }: { album: Album }) {
  const isYoutubeAlbum = album.albumType === "youtube";
  const hasGalleryVideos =
    !isYoutubeAlbum && getAlbumMediaItems(album).some((item) => item.type === "video");
  const itemLabel = isYoutubeAlbum
    ? formatMediaCount(album.videos.length, true)
    : formatGalleryMediaCount(album);

  return (
    <Link
      href={getAlbumDetailPath(album)}
      className="group block overflow-hidden border border-border bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`Abrir album ${album.title}`}
      onClick={markAlbumTransition}
    >
      <div className="offline-aware-image offline-aware-image--fixed relative h-48 w-full bg-muted">
        <Image
          src={sanityImageVariantUrl(album.coverImage, {
            width: 640,
            height: 410,
            quality: 70,
            format: "webp",
            fit: "crop",
          })}
          alt={album.title}
          fill
          unoptimized
          className="offline-image-online object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 310px"
        />
        <OfflineImagePlaceholder />
        {isYoutubeAlbum || hasGalleryVideos ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <Play
              className="h-9 w-9 text-white drop-shadow"
              aria-hidden="true"
            />
          </div>
        ) : null}
        <div className="absolute right-3 top-3 bg-white/92 px-2 py-1 text-[12px] font-semibold text-foreground shadow-sm">
          {itemLabel}
        </div>
      </div>

      <div className="p-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-primary">
          {CATEGORY_LABELS[album.category] || album.category}
        </p>
        <h2 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
          {album.title}
        </h2>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{formatAlbumDate(album.startDate, album.endDate)}</span>
        </div>
        <div className="mt-4 inline-flex items-center text-sm font-semibold text-primary">
          {isYoutubeAlbum ? "Ver video" : "Ver galería"}
          <ArrowRight
            className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  );
}

export function YoutubeVideoTile({
  video,
  index,
  isActive,
  onSelect,
  onThumbnailLoad,
  variant = "grid",
}: {
  video: AlbumVideo;
  index: number;
  isActive: boolean;
  onSelect: (video: AlbumVideo) => void;
  onThumbnailLoad?: (video: AlbumVideo, width: number, height: number) => void;
  variant?: "grid" | "list";
}) {
  const isListVariant = variant === "list";
  const [failedThumbnailUrl, setFailedThumbnailUrl] = useState<string | null>(null);
  const showThumbnail =
    Boolean(video.thumbnailUrl) && failedThumbnailUrl !== video.thumbnailUrl;

  return (
    <button
      type="button"
      onClick={() => onSelect(video)}
      onPointerUp={(event) => {
        event.currentTarget.blur();
      }}
      onTouchEnd={(event) => {
        event.currentTarget.blur();
      }}
      className={`group overflow-hidden border bg-card text-left transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        isListVariant
          ? `flex w-full items-stretch gap-3 p-2 ${
              isActive
                ? "border-primary bg-card"
                : "border-border md:hover:border-primary/50 md:hover:bg-primary md:hover:text-white"
            }`
          : `block ${
              isActive
                ? "border-primary bg-card md:hover:bg-primary md:hover:text-white"
                : "border-border md:hover:border-primary/50 md:hover:bg-primary md:hover:text-white"
            }`
      }`}
      aria-label={`Reproducir ${video.title}`}
    >
      <div
        className={`relative shrink-0 overflow-hidden ${
          showThumbnail ? "bg-muted" : "bg-transparent"
        } ${
          isListVariant ? "h-20 w-24" : "aspect-video"
        }`}
      >
        {showThumbnail ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="absolute inset-0 h-full w-full object-cover"
            onLoad={(event) => {
              const img = event.currentTarget;
              onThumbnailLoad?.(video, img.naturalWidth, img.naturalHeight);
            }}
            onError={() => {
              setFailedThumbnailUrl(video.thumbnailUrl);
            }}
          />
        ) : (
          <span className="absolute inset-0 bg-transparent" aria-hidden="true" />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/15 text-white transition-colors md:group-hover:bg-black/25">
          <PlayCircle
            className={`${isListVariant ? "h-8 w-8" : "h-10 w-10"} drop-shadow`}
            aria-hidden="true"
          />
        </span>
      </div>
      <div className={isListVariant ? "min-w-0 flex-1 py-1 pr-1" : "p-3"}>
        <p
          className={`line-clamp-2 font-semibold leading-snug transition-colors ${
            isListVariant
              ? "text-[15px] text-foreground md:group-hover:text-white"
              : "text-sm text-foreground md:group-hover:text-white"
          }`}
        >
          {video.title}
        </p>
        <p
          className={`mt-1 text-xs ${isListVariant ? "text-muted-foreground md:group-hover:text-white/85" : "text-muted-foreground md:group-hover:text-white/85"}`}
        >
          Video {index + 1}
        </p>
      </div>
    </button>
  );
}

export function AlbumMediaTile({
  item,
  index,
  layout,
  onOpen,
}: {
  item: AlbumGalleryItem;
  index: number;
  layout: AlbumTileLayout;
  onOpen: (index: number) => void;
}) {
  const isVideo = item.type === "video";
  const previewUrl = getGalleryItemPreviewUrl(item);
  const alt = item.type === "video" ? item.alt : item.alt;
  const caption = item.type === "video" ? item.caption || item.title : item.caption;

  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className={`group relative mb-[3px] block w-full break-inside-avoid overflow-hidden border border-border bg-muted text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:mb-0 ${layout.className}`}
      aria-label={`Abrir ${isVideo ? "video" : "foto"} ${index + 1}`}
    >
      {previewUrl ? (
        <Image
          src={sanityImageVariantUrl(previewUrl, layout.imageOptions)}
          alt={alt}
          fill
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes={layout.sizes}
        />
      ) : (
        <span className="absolute inset-0 bg-black" aria-hidden="true" />
      )}
      {isVideo ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white transition-colors group-hover:bg-black/30">
          <PlayCircle className="h-10 w-10 drop-shadow" aria-hidden="true" />
        </span>
      ) : null}
      {caption ? (
        <span className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          {caption}
        </span>
      ) : null}
    </button>
  );
}
