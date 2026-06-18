"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Newsreader } from "next/font/google";
import {
  ArrowRight,
  Calendar,
  Camera,
  ChevronDown,
  ExternalLink,
  Info,
  Images,
  Play,
  PlayCircle,
  Youtube,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { OfflineImagePlaceholder } from "@/components/shared/offline-image-placeholder";
import { ImageGalleryModal } from "@/components/shared/image-gallery-modal";
import { sanityImageVariantUrl } from "@/lib/sanity/image";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Album, AlbumGalleryItem, AlbumVideo, EventType } from "@/lib/types";

const CATEGORY_LABELS: Record<EventType, string> = {
  campana: "Campaña",
  convencion: "Convención General",
  recorrido: "Recorrido Regional",
  confraternidadJuvenilRegional: "Confraternidad Juvenil Regional",
  confraternidadJuvenilGeneral: "Confraternidad Juvenil General",
  cultoJuvenil: "Culto Juvenil",
  culto: "Culto",
  visita: "Visita",
  ensayo: "Ensayo",
  actividad: "Actividad",
  estudioBiblico: "Estudio Bíblico",
  biregional: "Biregional",
  congresoBrilla: "Congreso Brilla",
  boda: "Boda",
};

const INITIAL_VISIBLE_PHOTOS = 60;
const PHOTOS_PER_PAGE = 40;
const ALL_FILTER = "todos";
const VIDEO_FILTER = "videos";
const PHOTO_FILTER = "fotos";
const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});
const albumMobileSlideTransition = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
};
const ALBUM_TRANSITION_STORAGE_KEY = "rm-album-transition-next";
type AlbumTileKind = "normal" | "squareLarge" | "tall" | "wide";
type VideoOrientation = "portrait" | "landscape";

interface AlbumTileLayout {
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

function formatAlbumDate(startDate: Date, endDate: Date) {
  const formatter = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  const start = formatter.format(startDate);
  const end = formatter.format(endDate);
  return start === end ? start : `${start} - ${end}`;
}

function formatAlbumPreviewDate(startDate: Date) {
  const formatter = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return formatter.format(startDate);
}

function formatMediaCount(count: number, isVideo: boolean) {
  if (isVideo) {
    return `${count} ${count === 1 ? "video" : "videos"}`;
  }
  return `${count} ${count === 1 ? "foto" : "fotos"}`;
}

function getAlbumMediaItems(album: Album): AlbumGalleryItem[] {
  return album.media?.length > 0 ? album.media : album.images;
}

function formatGalleryMediaCount(album: Album) {
  const mediaItems = getAlbumMediaItems(album);
  const photoCount = mediaItems.filter((item) => item.type === "image").length;
  const videoCount = mediaItems.filter((item) => item.type === "video").length;

  if (videoCount === 0) return formatMediaCount(photoCount, false);
  if (photoCount === 0) return formatMediaCount(videoCount, true);

  return `${photoCount} ${photoCount === 1 ? "foto" : "fotos"} / ${videoCount} ${
    videoCount === 1 ? "video" : "videos"
  }`;
}

function getGalleryItemPreviewUrl(item: AlbumGalleryItem): string | undefined {
  return item.type === "video" ? item.posterUrl : item.url;
}

function getAlbumSectionPath(albumType: Album["albumType"]) {
  return albumType === "youtube" ? "/album/grabaciones" : "/album/galerias";
}

function getAlbumDetailPath(album: Album) {
  return `${getAlbumSectionPath(album.albumType)}/${album.slug}`;
}

function getAlbumTypeLabel(albumType: Album["albumType"]) {
  return albumType === "youtube" ? "Grabacion" : "Galeria";
}

function formatHubRecentContext(album: Album) {
  const isYoutubeAlbum = album.albumType === "youtube";
  const itemLabel = isYoutubeAlbum
    ? formatMediaCount(album.videos.length, true)
    : formatGalleryMediaCount(album);
  return `${getAlbumTypeLabel(album.albumType)} · ${itemLabel}`;
}

function getRecentAlbums(albums: Album[], limit = 5) {
  return [...albums]
    .filter((album) => !album.hidden)
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
    .slice(0, limit);
}

function getAlbumYear(album: Album) {
  return album.startDate.getUTCFullYear().toString();
}

const HUB_TAP_FEEDBACK_CLASS = "bg-white/[0.08]";

function useMobileTapFeedback() {
  const isMobile = useIsMobile();
  const [isFlicking, setIsFlicking] = useState(false);
  const flickTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (flickTimerRef.current) {
        window.clearTimeout(flickTimerRef.current);
      }
    };
  }, []);

  const triggerFlick = () => {
    if (!isMobile) return;

    setIsFlicking(true);

    if (flickTimerRef.current) {
      window.clearTimeout(flickTimerRef.current);
    }

    flickTimerRef.current = window.setTimeout(() => {
      setIsFlicking(false);
      flickTimerRef.current = null;
    }, 180);
  };

  return { isFlicking, triggerFlick, isMobile };
}

function getPhotoHubGridClasses(imageCount: number) {
  if (imageCount <= 1) {
    return "grid grid-cols-1";
  }

  if (imageCount === 2) {
    return "grid grid-cols-2 grid-rows-1";
  }

  if (imageCount === 3) {
    return "grid grid-cols-2 grid-rows-2";
  }

  return "grid grid-cols-2 grid-rows-2";
}

function getPhotoHubTileClasses(imageCount: number, index: number) {
  if (imageCount <= 1) {
    return "relative overflow-hidden";
  }

  if (imageCount === 2) {
    return "relative overflow-hidden";
  }

  if (imageCount === 3) {
    if (index < 2) {
      return "relative overflow-hidden";
    }

    return "relative overflow-hidden col-span-2";
  }

  return "relative overflow-hidden";
}

function getGalleryYearGridClasses(albumCount: number) {
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

function filterAlbumsByChip(albums: Album[], activeFilter: string) {
  if (activeFilter === "all") {
    return albums;
  }

  const [filterType, filterValue] = activeFilter.split(":");

  if (filterType === "year") {
    return albums.filter((album) => getAlbumYear(album) === filterValue);
  }

  if (filterType === "category") {
    return albums.filter((album) => album.category === filterValue);
  }

  return albums;
}

function getVideoDurationLabel(video?: AlbumVideo) {
  if (!video) return undefined;

  const videoWithDuration = video as AlbumVideo & {
    duration?: string;
    durationLabel?: string;
    durationSeconds?: number;
  };

  if (videoWithDuration.durationLabel) {
    return videoWithDuration.durationLabel;
  }

  if (videoWithDuration.duration) {
    return videoWithDuration.duration;
  }

  if (typeof videoWithDuration.durationSeconds === "number") {
    const totalSeconds = Math.max(0, Math.floor(videoWithDuration.durationSeconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return undefined;
}

function AlbumHubEntryCard({
  href,
  title,
  subtitle,
  isYoutubeAlbum,
  previewImages = [],
  previewImage,
}: {
  href: string;
  title: string;
  subtitle: string;
  isYoutubeAlbum: boolean;
  previewImages?: string[];
  previewImage?: string;
}) {
  const router = useRouter();
  const { triggerFlick, isMobile } = useMobileTapFeedback();
  const photoPreviewImages = previewImages.slice(0, 4);

  return (
    <div
      role={isMobile ? "link" : undefined}
      tabIndex={isMobile ? 0 : undefined}
      onClick={() => {
        if (!isMobile) return;
        router.push(href);
      }}
      onKeyDown={(event) => {
        if (!isMobile || event.key !== "Enter") return;
        router.push(href);
      }}
      onPointerDown={triggerFlick}
      className="relative flex min-h-[142px] overflow-hidden border border-black bg-paper p-[7px] text-ink transition-[border-color,box-shadow] md:block md:min-h-0 md:p-2 md:hover:shadow-[0_16px_45px_rgba(0,0,0,0.28)]"
    >
      <Link
        href={href}
        aria-label={`Abrir ${title}`}
        onClick={(event) => event.stopPropagation()}
        className="group/tiles block w-[42%] shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 md:w-full"
      >
        <div
          className={`relative h-full overflow-hidden border border-black transition-[border-color,box-shadow] md:group-hover/tiles:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.22)] ${
            isYoutubeAlbum ? "bg-black" : "bg-[#111]"
          }`}
        >
          {isYoutubeAlbum ? (
            <div className="relative flex h-full min-h-[142px] items-center justify-center overflow-hidden bg-black md:aspect-[4/2.35] md:min-h-0">
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt={title}
                  fill
                  className="object-cover opacity-45 saturate-0"
                  quality={85}
                  sizes="(max-width: 767px) 50vw, 460px"
                />
              ) : null}
              <div className="absolute inset-0 bg-black/45" />
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white text-black">
                <Play className="h-5 w-5 translate-x-[1px]" aria-hidden="true" />
              </div>
            </div>
          ) : (
            <div
              className={`h-full min-h-[142px] gap-px bg-black md:aspect-[4/2.35] md:min-h-0 ${getPhotoHubGridClasses(
                photoPreviewImages.length,
              )}`}
            >
              {photoPreviewImages.map((tile, index) => {
                const tileClasses = getPhotoHubTileClasses(
                  photoPreviewImages.length,
                  index,
                );

                return (
                  <div
                    key={`${title}-${index}`}
                    className={tileClasses}
                  >
                    {tile ? (
                      <Image
                        src={sanityImageVariantUrl(tile, {
                          width: 640,
                          height: 380,
                          quality: 70,
                          format: "webp",
                          fit: "crop",
                        })}
                        alt={title}
                        fill
                        className={`object-cover contrast-[1.03] saturate-[0.82] ${
                          photoPreviewImages.length === 1 ? "rounded-none" : ""
                        }`}
                        quality={85}
                        sizes="(max-width: 767px) 42vw, 460px"
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Link>
      <div className="flex min-w-0 flex-1 items-center px-4 py-4 md:px-3 md:py-4">
        <div className="flex min-w-0 flex-col items-start gap-0">
          <div className="mb-4 flex h-8 w-8 shrink-0 items-center justify-center text-ink">
            {isYoutubeAlbum ? (
              <PlayCircle className="h-7 w-7" aria-hidden="true" />
            ) : (
              <Images className="h-7 w-7" aria-hidden="true" />
            )}
          </div>

          <Link
            href={href}
            aria-label={`Abrir ${title}`}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex max-w-full items-center gap-1 whitespace-normal break-words font-serif text-[24px] font-semibold leading-tight text-ink transition-colors hover:text-ink/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 md:text-[30px]"
          >
            <span>{title}</span>
          </Link>

          <p className="mt-2 text-[12px] uppercase text-ink/90">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function AlbumRecentItem({ album }: { album: Album }) {
  const isYoutubeAlbum = album.albumType === "youtube";
  const { isFlicking, triggerFlick } = useMobileTapFeedback();

  return (
    <div
      className={`relative border-b border-white/10 py-3 transition-colors ${
        isFlicking ? HUB_TAP_FEEDBACK_CLASS : ""
      }`}
    >
      <Link
        href={getAlbumDetailPath(album)}
        aria-label={`Abrir ${album.title}`}
        onPointerDown={triggerFlick}
        className="absolute inset-0 z-20 md:hidden"
      />
      <div className="flex items-center gap-3">
        <Link
          href={getAlbumDetailPath(album)}
          aria-label={`Abrir ${album.title}`}
          onPointerDown={triggerFlick}
          className={`relative h-12 w-12 shrink-0 overflow-hidden border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
            isYoutubeAlbum ? "bg-black" : "bg-[#111]"
          }`}
        >
          {isYoutubeAlbum ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white rounded">
              <Play className="h-4 w-4" aria-hidden="true" />
            </div>
          ) : (
            <Image
              src={album.coverImage}
              alt={album.title}
              fill
              className="object-cover saturate-[0.82]"
              sizes="48px"
            />
          )}
        </Link>

        <div className="min-w-0 flex-1 pr-1">
          <Link
            href={getAlbumDetailPath(album)}
            aria-label={`Abrir ${album.title}`}
            onPointerDown={triggerFlick}
            className="block max-w-full font-serif text-[15px] font-normal leading-tight text-white transition-colors hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <span className="block truncate">{album.title}</span>
          </Link>
          <p className="mt-1 truncate text-[11px] uppercase text-white/42">
            {formatAlbumPreviewDate(album.startDate)} ·{" "}
            {formatHubRecentContext(album)}
          </p>
        </div>

        <Link
          href={getAlbumDetailPath(album)}
          aria-label={`Abrir ${album.title}`}
          onPointerDown={triggerFlick}
          className="inline-flex shrink-0 items-center text-white/50 transition-colors hover:text-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function GalleryFilterChip({
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

function GalleryAlbumTile({
  album,
  groupAlbumCount,
}: {
  album: Album;
  groupAlbumCount: number;
}) {
  const hasGalleryVideos = getAlbumMediaItems(album).some((item) => item.type === "video");
  const itemLabel = formatGalleryMediaCount(album);

  const markAlbumTransition = () => {
    try {
      sessionStorage.setItem(ALBUM_TRANSITION_STORAGE_KEY, "true");
    } catch {
      // The transition is decorative; ignore storage failures.
    }
  };

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

function RecordingAlbumListItem({ album }: { album: Album }) {
  const previewVideo = album.videos[0];
  const thumbnailUrl = previewVideo?.thumbnailUrl || album.coverImage;
  const durationLabel = getVideoDurationLabel(previewVideo);

  const markAlbumTransition = () => {
    try {
      sessionStorage.setItem(ALBUM_TRANSITION_STORAGE_KEY, "true");
    } catch {
      // The transition is decorative; ignore storage failures.
    }
  };

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

export function AlbumHubContent({ albums = [] }: { albums?: Album[] }) {
  const recentAlbums = getRecentAlbums(albums, 5);
  const photoAlbums = albums.filter((album) => album.albumType === "photos");
  const videoAlbums = albums.filter((album) => album.albumType === "youtube");
  const activeRecentAlbums =
    recentAlbums.length > 0 ? recentAlbums : photoAlbums.slice(0, 3);
  const photoHubPreview = photoAlbums
    .slice(0, 4)
    .map((album) => album.coverImage);
  const latestVideoAlbum = [...videoAlbums].sort(
    (a, b) => b.startDate.getTime() - a.startDate.getTime(),
  )[0];
  const latestVideoThumbnail =
    latestVideoAlbum?.videos[0]?.thumbnailUrl || latestVideoAlbum?.coverImage;

  return (
    <div className="w-full overflow-x-clip bg-black" id="main-content">
      <div
        className="desktop-content-pane mx-auto min-h-[100dvh] max-w-[950px] overflow-x-clip bg-[#050505] px-0 pb-0 pt-[85px] focus:outline-none md:min-h-[calc(100dvh-45px)] md:border-x md:border-white/10 md:pb-16 md:pt-[92px]"
        style={{ backgroundColor: "#111111" }}
      >
        <div className="mx-auto w-full md:w-[calc(100%-32px)]">
          <section className="px-4 pb-6 pt-0 md:px-8 md:pb-8">
            {/* <p className="mb-5 text-[12px] font-semibold uppercase text-white/42">
              Archivo
            </p> */}
            <h1 className="max-w-[11ch] font-serif text-[2.85rem] font-normal leading-[0.95] text-white md:text-[4rem]">
              Álbum de Actividades
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/85 md:text-[17px]">
              Revive momentos especiales de nuestros actividades ✨
            </p>
          </section>

          <section className="px-2 pb-5 pt-2 md:px-8 md:pt-1">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              <AlbumHubEntryCard
                href="/album/galerias"
                title="Galería"
                subtitle="Fotos y videos"
                isYoutubeAlbum={false}
                previewImages={photoHubPreview}
              />
              <AlbumHubEntryCard
                href="/album/grabaciones"
                title="Grabaciones"
                subtitle="Directos y cultos"
                isYoutubeAlbum={true}
                previewImage={latestVideoThumbnail}
              />
            </div>
          </section>

          <section className="mt-0 px-4 py-5 md:px-8 md:pt-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold uppercase text-white/60">
                Añadidos recientemente
              </h2>
            </div>
            <div className="mt-1">
              {activeRecentAlbums.length > 0 ? (
                activeRecentAlbums.map((album) => (
                  <AlbumRecentItem key={album.id} album={album} />
                ))
              ) : (
                <div className="border-b border-white/10 py-6 text-sm text-white/45">
                  Aún no hay contenido reciente disponible.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function AlbumSectionContent({
  albums = [],
  section,
}: {
  albums?: Album[];
  section: "galerias" | "grabaciones";
}) {
  const albumType = section === "galerias" ? "photos" : "youtube";
  const sectionAlbums = albums.filter((album) => album.albumType === albumType);
  const [activeGalleryFilter, setActiveGalleryFilter] = useState("all");
  const title = section === "galerias" ? "Galeria" : "Grabaciones";
  const subtitle =
    section === "galerias"
      ? "Fotos y videos publicados por la region."
      : "Directos, cultos y grabaciones disponibles.";
  const galleryYears = useMemo(
    () =>
      Array.from(new Set(sectionAlbums.map((album) => getAlbumYear(album)))).sort(
        (a, b) => Number(b) - Number(a),
      ),
    [sectionAlbums],
  );
  const galleryCategories = useMemo(
    () =>
      Array.from(new Set(sectionAlbums.map((album) => album.category))).sort(
        (a, b) =>
          (CATEGORY_LABELS[a] || a).localeCompare(CATEGORY_LABELS[b] || b, "es"),
      ),
    [sectionAlbums],
  );
  const filteredSectionAlbums = useMemo(
    () => filterAlbumsByChip(sectionAlbums, activeGalleryFilter),
    [activeGalleryFilter, sectionAlbums],
  );
  const galleryAlbumsByYear = useMemo(() => {
    const groups = new Map<string, Album[]>();

    [...filteredSectionAlbums]
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
      .forEach((album) => {
        const year = getAlbumYear(album);
        const yearAlbums = groups.get(year) || [];
        yearAlbums.push(album);
        groups.set(year, yearAlbums);
      });

    return Array.from(groups.entries()).sort(
      ([yearA], [yearB]) => Number(yearB) - Number(yearA),
    );
  }, [filteredSectionAlbums]);
  const sortedRecordingAlbums = useMemo(
    () =>
      [...filteredSectionAlbums].sort(
        (a, b) => b.startDate.getTime() - a.startDate.getTime(),
      ),
    [filteredSectionAlbums],
  );

  return (
    <div className="w-full overflow-x-clip bg-[#f1f1f1]" id="main-content">
      <div className="desktop-content-pane mx-auto min-h-[calc(100dvh-51px)] max-w-[950px] overflow-x-clip bg-paper px-0 pb-14 pt-6 focus:outline-none md:min-h-[calc(100dvh-45px)] md:border-x md:pb-16 md:pt-8">
        <div className="mx-auto w-full md:w-[calc(100%-32px)]">
          <section className="px-4 pb-5 pt-0 md:px-8 md:pb-6">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-primary">
              Álbum de Actividades
            </p>
            <h1 className="text-[1.825rem] font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
              {subtitle}
            </p>
          </section>

          <section className="px-4 pt-0 md:px-8 md:pt-1">
            {sectionAlbums.length > 0 ? (
              <>
                <div className="-mx-4 mb-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
                  <div className="flex w-max gap-2">
                    <GalleryFilterChip
                      label="Todo"
                      isActive={activeGalleryFilter === "all"}
                      onClick={() => setActiveGalleryFilter("all")}
                    />
                    {galleryYears.map((year) => (
                      <GalleryFilterChip
                        key={year}
                        label={year}
                        isActive={activeGalleryFilter === `year:${year}`}
                        onClick={() => setActiveGalleryFilter(`year:${year}`)}
                      />
                    ))}
                    {galleryCategories.map((category) => (
                      <GalleryFilterChip
                        key={category}
                        label={CATEGORY_LABELS[category] || category}
                        isActive={activeGalleryFilter === `category:${category}`}
                        onClick={() =>
                          setActiveGalleryFilter(`category:${category}`)
                        }
                      />
                    ))}
                  </div>
                </div>

                {section === "galerias" && galleryAlbumsByYear.length > 0 ? (
                  <div className="space-y-7">
                    {galleryAlbumsByYear.map(([year, yearAlbums]) => (
                      <div key={year}>
                        <h2 className="mb-4 text-md font-bold text-muted-foreground">
                          {year}
                        </h2>
                        <div
                          className={`${getGalleryYearGridClasses(
                            yearAlbums.length,
                          )} gap-1 md:gap-2`}
                        >
                          {yearAlbums.map((album) => (
                            <GalleryAlbumTile
                              key={album.id}
                              album={album}
                              groupAlbumCount={yearAlbums.length}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : section === "grabaciones" && sortedRecordingAlbums.length > 0 ? (
                  <div>
                    {sortedRecordingAlbums.map((album) => (
                      <RecordingAlbumListItem key={album.id} album={album} />
                    ))}
                  </div>
                ) : (
                  <div className="border border-border bg-card p-8 text-center">
                    <Images
                      className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium text-foreground">
                      {section === "galerias"
                        ? "Sin álbumes para este filtro"
                        : "Sin grabaciones para este filtro"}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="border border-border bg-card p-8 text-center">
                <Images
                  className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-foreground">
                  {section === "galerias"
                    ? "Sin álbumes disponibles"
                    : "Sin grabaciones disponibles"}
                </p>
                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
                  {section === "galerias"
                    ? "Las galerías aparecerán aquí cuando estén publicadas."
                    : "Las grabaciones aparecerán aquí cuando estén disponibles."}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function hashString(input: string) {
  let hash = 5381;

  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(index);
  }

  return hash >>> 0;
}

function getAlbumTileLayout(
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

function AlbumCard({ album }: { album: Album }) {
  const isYoutubeAlbum = album.albumType === "youtube";
  const hasGalleryVideos =
    !isYoutubeAlbum && getAlbumMediaItems(album).some((item) => item.type === "video");
  const itemLabel = isYoutubeAlbum
    ? formatMediaCount(album.videos.length, true)
    : formatGalleryMediaCount(album);

  const markAlbumTransition = () => {
    try {
      sessionStorage.setItem(ALBUM_TRANSITION_STORAGE_KEY, "true");
    } catch {
      // The transition is decorative; ignore storage failures.
    }
  };

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

function YoutubeVideoTile({
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
        className={`relative shrink-0 overflow-hidden bg-muted ${
          isListVariant ? "h-20 w-24" : "aspect-video"
        }`}
      >
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
          onLoadingComplete={(img) => {
            onThumbnailLoad?.(video, img.naturalWidth, img.naturalHeight);
          }}
        />
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

function AlbumMediaTile({
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

interface AlbumContentProps {
  albums?: Album[];
  album?: Album;
}

export function AlbumContent({ albums = [], album }: AlbumContentProps) {
  const isMobile = useIsMobile();
  const [shouldAnimatePage, setShouldAnimatePage] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const [videoOrientations, setVideoOrientations] = useState<
    Record<string, VideoOrientation>
  >({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PHOTOS);
  const [selectedType, setSelectedType] = useState<string>(ALL_FILTER);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isSubmissionNoticeOpen, setIsSubmissionNoticeOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) return;

    try {
      const shouldAnimateNext =
        sessionStorage.getItem(ALBUM_TRANSITION_STORAGE_KEY) === "true";
      sessionStorage.removeItem(ALBUM_TRANSITION_STORAGE_KEY);
      if (shouldAnimateNext) {
        setShouldAnimatePage(true);
      }
    } catch {
      setShouldAnimatePage(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isFilterOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!filterMenuRef.current) return;
      if (!filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFilterOpen]);

  useEffect(() => {
    setIsSubmissionNoticeOpen(false);
  }, [album?.slug]);

  const filteredAlbums = useMemo(() => {
    if (selectedType === VIDEO_FILTER) {
      return albums.filter(
        (item) =>
          item.albumType === "youtube" ||
          getAlbumMediaItems(item).some((mediaItem) => mediaItem.type === "video"),
      );
    }
    if (selectedType === PHOTO_FILTER) {
      return albums.filter((item) => item.albumType !== "youtube");
    }
    return albums;
  }, [albums, selectedType]);

  const shouldAnimate = shouldAnimatePage && isMobile;

  const pageMotionProps = shouldAnimate
    ? {
        initial: { opacity: 0, x: 16 },
        animate: { opacity: 1, x: 0, y: 0 },
        exit: { opacity: 0, x: -16 },
        transition: albumMobileSlideTransition,
        onAnimationComplete: () => setShouldAnimatePage(false),
      }
    : {
        initial: false,
        animate: { opacity: 1 },
        exit: undefined,
        transition: { duration: 0 },
      };

  const albumMobileTileLayouts = useMemo(() => {
    if (!album) {
      return [];
    }

    const visibleMedia = getAlbumMediaItems(album).slice(0, visibleCount);
    return visibleMedia.map((item, index) =>
      getAlbumTileLayout(item, index, visibleMedia.length, album.slug),
    );
  }, [album, visibleCount]);

  const desktopTileLayout: AlbumTileLayout = {
    kind: "normal",
    className: "aspect-square col-span-1",
    imageOptions: {
      width: 420,
      height: 420,
      quality: 58,
      format: "webp",
      fit: "crop",
    },
    sizes: "(max-width: 767px) 33vw, (max-width: 1024px) 20vw, 180px",
  };

  if (album) {
    const isYoutubeAlbum = album.albumType === "youtube";
    const forcePortraitLayout = album.youtubeLayout === "vertical";
    const forceLandscapeLayout = album.youtubeLayout === "horizontal";
    const albumMedia = getAlbumMediaItems(album);
    const visibleMedia = albumMedia.slice(0, visibleCount);
    const visibleVideos = album.videos.slice(0, visibleCount);
    const hasMoreItems = isYoutubeAlbum
      ? visibleVideos.length < album.videos.length
      : visibleMedia.length < albumMedia.length;
    const selectedVideo =
      album.videos.find((video) => video.id === selectedVideoId) ||
      album.videos[0];
    const totalItems = isYoutubeAlbum
      ? album.videos.length
      : albumMedia.length;
    const totalItemLabel = isYoutubeAlbum
      ? formatMediaCount(totalItems, true)
      : formatGalleryMediaCount(album);
    const selectedVideoOrientation = selectedVideo
      ? videoOrientations[selectedVideo.id]
      : undefined;
    const selectedVideoIsPortrait =
      isMobile &&
      (forcePortraitLayout ||
        (!forceLandscapeLayout && selectedVideoOrientation === "portrait"));

    return (
      <div
        className="album-detail-surface w-full overflow-x-clip bg-[#f1f1f1]"
        id="main-content"
      >
        <motion.div
          key={`album-detail-${album.slug}-${shouldAnimate ? "mobile" : "static"}`}
          className="desktop-content-pane mx-auto min-h-[calc(100dvh-95px)] max-w-[950px] overflow-x-clip bg-paper px-0 pb-14 pt-6 focus:outline-none md:min-h-[calc(100dvh-45px)] md:border-x md:pb-16 md:pt-8"
          {...pageMotionProps}
        >
          <div className="mx-auto w-full md:w-[calc(100%-32px)]">
            <section className="mb-0 border-b border-border px-4 pb-2 pt-0 md:px-8 md:pb-6">
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-primary">
                {CATEGORY_LABELS[album.category] || album.category}
              </p>
              <h1
                className={`${editorialFont.className} text-[32px] font-semibold tracking-tight text-foreground`}
              >
                {album.title}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  {formatAlbumDate(album.startDate, album.endDate)}
                </span>
                <span className="inline-flex items-center gap-2">
                  {isYoutubeAlbum ? (
                    <Youtube className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Images className="h-4 w-4" aria-hidden="true" />
                  )}
                  {totalItemLabel}
                </span>
              </div>
              {album.description ? (
                <p className="mt-4 max-w-2xl text-[15px] leading-7">
                  {album.description}
                </p>
              ) : null}
              <div className="mt-4 mb-4 flex flex-wrap gap-2">
                {album.relatedEvent ? (
                  <Link
                    href={`/buscar?q=${encodeURIComponent(album.relatedEvent.title)}`}
                    className="inline-flex items-center justify-center gap-2 rounded-none border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hover:bg-accent md:hover:text-accent-foreground"
                    onClick={(event) => {
                      event.currentTarget.blur();
                    }}
                  >
                    <Info className="h-4 w-4" aria-hidden="true" />
                    Ver informacion del evento
                  </Link>
                ) : null}
                {isYoutubeAlbum && album.youtubeUrl ? (
                  <a
                    href={album.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-none border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hover:bg-accent md:hover:text-accent-foreground"
                  >
                    <Youtube className="h-4 w-4" aria-hidden="true" />
                    Ver en YouTube
                  </a>
                ) : null}
                {!isYoutubeAlbum && album.facebookUrl ? (
                  <a
                    href={album.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-none border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hover:bg-accent md:hover:text-accent-foreground"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Ver en Facebook
                  </a>
                ) : null}
              </div>
              {false && !isYoutubeAlbum && album.canSubmitPhotos ? (
                <div className="mt-4 mb-6 border border bg-paper-highlight p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        ¿Tienes fotos de esta actividad?
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Ayúdanos a completar este álbum compartiendo tus fotos.
                      </p>
                    </div>
                    <Button
                      type="button"
                      className="h-11 bg-brand rounded-none sm:w-auto"
                      onClick={() => setIsSubmissionNoticeOpen((open) => !open)}
                    >
                      <Camera className="h-4 w-4" aria-hidden="true" />
                      Compartir fotos
                    </Button>
                  </div>
                  {isSubmissionNoticeOpen ? (
                    <p className="mt-3 border-t border-[#dbe7f1] pt-3 text-sm leading-6 text-muted-foreground">
                      ¡Usa el código QR compartido por los encargados para subir fotos a este album!
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section>
              {isYoutubeAlbum ? (
                <>
                  <div className="px-0 pt-0 sm:px-4 md:px-8 md:pt-5">
                    {selectedVideo ? (
                      <div className="mb-5 overflow-hidden border border-border bg-black">
                        <div
                          data-youtube-player-shell
                          className={`${
                            selectedVideoIsPortrait
                              ? "mx-auto aspect-[9/16] w-full max-w-[420px] bg-black"
                              : "aspect-video"
                          }`}
                        >
                          <iframe
                            src={`https://www.youtube.com/embed/${selectedVideo.id}`}
                            title={selectedVideo.title}
                            className="youtube-embed-frame h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            loading="lazy"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="border border-border bg-card p-8 text-center">
                        <Youtube
                          className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30"
                          aria-hidden="true"
                        />
                        <p className="text-sm font-medium text-foreground">
                          Sin videos disponibles
                        </p>
                        {album.youtubeError ? (
                          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
                            {album.youtubeError}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="px-4 sm:px-4 md:px-8">
                    <div className="hidden grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:grid">
                      {visibleVideos.map((video, index) => (
                        <YoutubeVideoTile
                          key={video.id}
                          video={video}
                          index={index}
                          isActive={selectedVideo?.id === video.id}
                          onSelect={(nextVideo) =>
                            setSelectedVideoId(nextVideo.id)
                          }
                          onThumbnailLoad={(nextVideo, width, height) => {
                            const orientation: VideoOrientation =
                              height > width ? "portrait" : "landscape";
                            setVideoOrientations((current) =>
                              current[nextVideo.id] === orientation
                                ? current
                                : { ...current, [nextVideo.id]: orientation },
                            );
                          }}
                        />
                      ))}
                    </div>
                    {isMobile && visibleVideos.length > 0 ? (
                      <div className="mt-5 border-t border-border pt-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Seleccionar video
                        </p>
                        <div className="flex flex-col gap-3">
                          {visibleVideos.map((video, index) => (
                            <YoutubeVideoTile
                              key={`mobile-${video.id}`}
                              video={video}
                              index={index}
                              isActive={selectedVideo?.id === video.id}
                              onSelect={(nextVideo) =>
                                setSelectedVideoId(nextVideo.id)
                              }
                              variant="list"
                              onThumbnailLoad={(nextVideo, width, height) => {
                                const orientation: VideoOrientation =
                                  height > width ? "portrait" : "landscape";
                                setVideoOrientations((current) =>
                                  current[nextVideo.id] === orientation
                                    ? current
                                    : {
                                        ...current,
                                        [nextVideo.id]: orientation,
                                      },
                                );
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="px-0 pt-0 sm:px-4 md:px-8 md:pt-5">
                  <div className="columns-2 gap-[3px] md:hidden">
                    {albumMobileTileLayouts.map((layout, index) => (
                      <AlbumMediaTile
                        key={`${getGalleryItemPreviewUrl(visibleMedia[index])}-${index}`}
                        item={visibleMedia[index]}
                        index={index}
                        layout={layout}
                        onOpen={setCurrentIndex}
                      />
                    ))}
                  </div>

                  <div className="hidden grid-cols-5 gap-1.5 md:grid">
                    {visibleMedia.map((item, index) => (
                      <AlbumMediaTile
                        key={`${getGalleryItemPreviewUrl(item)}-${index}`}
                        item={item}
                        index={index}
                        layout={desktopTileLayout}
                        onOpen={setCurrentIndex}
                      />
                    ))}
                  </div>
                </div>
              )}

              {hasMoreItems ? (
                <div className="mt-6 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-none"
                    onClick={() =>
                      setVisibleCount((current) =>
                        Math.min(
                          current + PHOTOS_PER_PAGE,
                          isYoutubeAlbum
                            ? album.videos.length
                            : albumMedia.length,
                        ),
                      )
                    }
                  >
                    {isYoutubeAlbum ? "Cargar mas videos" : "Cargar mas"}
                  </Button>
                </div>
              ) : null}

              {currentIndex !== null ? (
                <ImageGalleryModal
                  items={albumMedia.map((item) =>
                    item.type === "video"
                      ? {
                          type: "video",
                          url: item.url,
                          posterUrl: item.posterUrl
                            ? sanityImageVariantUrl(item.posterUrl, {
                                width: 1200,
                                quality: 70,
                                format: "webp",
                                fit: "max",
                              })
                            : undefined,
                          title: item.title,
                          alt: item.alt,
                          mimeType: item.mimeType,
                        }
                      : {
                          type: "image",
                          url: sanityImageVariantUrl(item.url, {
                            width: 1600,
                            quality: 72,
                            format: "webp",
                            fit: "max",
                          }),
                          alt: item.alt,
                        },
                  )}
                  currentIndex={currentIndex}
                  onClose={() => setCurrentIndex(null)}
                  onNavigate={setCurrentIndex}
                  alt={album.title}
                />
              ) : null}
            </section>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-clip bg-[#f1f1f1]" id="main-content">
      <motion.div
        key={`album-list-${shouldAnimate ? "mobile" : "static"}`}
        className="desktop-content-pane mx-auto min-h-[100dvh] max-w-[950px] overflow-x-clip bg-paper px-4 pb-14 pt-[82px] focus:outline-none md:min-h-[calc(100dvh-45px)] md:border-x md:px-8 md:pb-16 md:pt-[88px]"
        {...pageMotionProps}
      >
        <div className="mx-auto w-full md:w-[calc(100%-32px)] md:px-4 md:pt-1">
          <div className="mb-6 border-b border-border pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-[1.825rem] font-semibold tracking-tight text-foreground">
                  Álbum de Actividades
                </h1>
                <p className="mt-2 text-[15px] text-muted-foreground">
                  Revive los momentos especiales de nuestros eventos.
                </p>
              </div>
            </div>
          </div>

          {albums.length > 0 ? (
            <div className="mb-6 flex justify-start sm:justify-end">
              <div ref={filterMenuRef} className="relative w-full sm:w-[220px]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Filtrar
                </span>
                <span className="sr-only" id="album-type-label">
                  Organizar álbumes por tipo de evento
                </span>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-none border border-border bg-white px-3 py-2 text-sm text-foreground shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-labelledby="album-type-label"
                  aria-haspopup="listbox"
                  aria-expanded={isFilterOpen}
                  onClick={() => setIsFilterOpen((open) => !open)}
                >
                  <span className="truncate">
                    {selectedType === VIDEO_FILTER
                      ? "Videos"
                      : selectedType === PHOTO_FILTER
                        ? "Fotos"
                        : "Mostrar todo"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      isFilterOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isFilterOpen ? (
                  <div
                    className="absolute right-0 top-full z-20 w-full overflow-hidden border border-border bg-white shadow-md sm:w-[220px]"
                    role="listbox"
                    aria-label="Tipo de evento"
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedType === ALL_FILTER}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm text-foreground ${
                        selectedType === ALL_FILTER
                          ? "bg-[#e8effb]"
                          : "hover:bg-[#e8effb]"
                      }`}
                      onClick={() => {
                        setSelectedType(ALL_FILTER);
                        setIsFilterOpen(false);
                      }}
                    >
                      Mostrar todo
                    </button>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedType === PHOTO_FILTER}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm text-foreground ${
                        selectedType === PHOTO_FILTER
                          ? "bg-[#e8effb]"
                          : "hover:bg-[#e8effb]"
                      }`}
                      onClick={() => {
                        setSelectedType(PHOTO_FILTER);
                        setIsFilterOpen(false);
                      }}
                    >
                      Fotos
                    </button>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedType === VIDEO_FILTER}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm text-foreground ${
                        selectedType === VIDEO_FILTER
                          ? "bg-[#e8effb]"
                          : "hover:bg-[#e8effb]"
                      }`}
                      onClick={() => {
                        setSelectedType(VIDEO_FILTER);
                        setIsFilterOpen(false);
                      }}
                    >
                      Videos
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {filteredAlbums.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAlbums.map((item) => (
                <AlbumCard key={item.id} album={item} />
              ))}
            </div>
          ) : (
            <div className="border border-border bg-card p-8 text-center">
              <Images
                className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30"
                aria-hidden="true"
              />
              <p className="mb-1 text-sm font-medium text-foreground">
                {albums.length > 0
                  ? "Sin álbumes para este tipo"
                  : "Sin álbumes disponibles"}
              </p>
              <p className="text-xs text-muted-foreground">
                {albums.length > 0
                  ? "Prueba con otro tipo de evento."
                  : "Los álbumes se publicarán después de los eventos."}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
