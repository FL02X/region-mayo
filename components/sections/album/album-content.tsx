"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
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
import type { Album, AlbumImage, AlbumVideo, EventType } from "@/lib/types";

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
const albumMobileSlideTransition = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
};

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

function formatMediaCount(count: number, isVideo: boolean) {
  if (isVideo) {
    return `${count} ${count === 1 ? "video" : "videos"}`;
  }
  return `${count} ${count === 1 ? "foto" : "fotos"}`;
}

function AlbumCard({ album }: { album: Album }) {
  const isYoutubeAlbum = album.albumType === "youtube";
  const itemCount = isYoutubeAlbum ? album.videos.length : album.images.length;
  const itemLabel = formatMediaCount(itemCount, isYoutubeAlbum);

  return (
    <Link
      href={`/album/${album.slug}`}
      className="group block overflow-hidden border border-border bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`Abrir album ${album.title}`}
    >
      <div className="offline-aware-image offline-aware-image--fixed relative h-48 w-full bg-muted">
        <Image
          src={sanityImageVariantUrl(album.coverImage, {
            width: 840,
            height: 540,
            quality: 74,
            format: "webp",
            fit: "crop",
          })}
          alt={album.title}
          fill
          className="offline-image-online object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 310px"
        />
        <OfflineImagePlaceholder />
        {isYoutubeAlbum ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <Play className="h-9 w-9 text-white drop-shadow" aria-hidden="true" />
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
          <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
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
}: {
  video: AlbumVideo;
  index: number;
  isActive: boolean;
  onSelect: (video: AlbumVideo) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(video)}
      className={`group overflow-hidden border bg-card text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        isActive ? "border-primary" : "border-border hover:border-primary/50"
      }`}
      aria-label={`Reproducir ${video.title}`}
    >
      <div className="relative aspect-video bg-muted">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/15 text-white transition-colors group-hover:bg-black/25">
          <PlayCircle className="h-10 w-10 drop-shadow" aria-hidden="true" />
        </span>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {video.title}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Video {index + 1}</p>
      </div>
    </button>
  );
}

function getAlbumTileClass(index: number): string {
  if (index === 0) {
    return "col-span-2 row-span-2 md:col-span-4 md:row-span-3";
  }

  if (index > 0 && index % 18 === 0) {
    return "col-span-2 row-span-2 md:col-span-4 md:row-span-2";
  }

  const cycle = index % 16;
  if (index >= 10 && cycle === 10) {
    return "col-span-1 row-span-2 md:col-start-1";
  }

  if (index >= 15 && cycle === 15) {
    return "col-span-1 row-span-2 md:col-start-4";
  }

  return "col-span-1 row-span-1";
}

function getAlbumTileImageOptions(index: number) {
  if (index === 0 || index % 18 === 0) {
    return {
      width: 1360,
      height: 760,
      quality: 64,
      format: "webp" as const,
      fit: "crop" as const,
    };
  }

  if ((index >= 10 && index % 16 === 10) || (index >= 15 && index % 16 === 15)) {
    return {
      width: 520,
      height: 860,
      quality: 62,
      format: "webp" as const,
      fit: "crop" as const,
    };
  }

  return {
    width: 460,
    height: 460,
    quality: 60,
    format: "webp" as const,
    fit: "crop" as const,
  };
}

function AlbumImageTile({
  image,
  index,
  onOpen,
}: {
  image: AlbumImage;
  index: number;
  onOpen: (index: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className={`group relative overflow-hidden border border-border bg-muted text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${getAlbumTileClass(index)}`}
      aria-label={`Abrir foto ${index + 1}`}
    >
      <Image
        src={sanityImageVariantUrl(image.url, getAlbumTileImageOptions(index))}
        alt={image.alt}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        sizes={
          index === 0 || index % 18 === 0
            ? "(max-width: 1024px) 100vw, 900px"
            : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
        }
      />
      {image.caption ? (
        <span className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          {image.caption}
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
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PHOTOS);
  const [selectedType, setSelectedType] = useState<string>(ALL_FILTER);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

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

  const filteredAlbums = useMemo(() => {
    if (selectedType === VIDEO_FILTER) {
      return albums.filter((item) => item.albumType === "youtube");
    }
    if (selectedType === PHOTO_FILTER) {
      return albums.filter((item) => item.albumType !== "youtube");
    }
    return albums;
  }, [albums, selectedType]);

  const pageMotionProps = isMobile
    ? {
        initial: { opacity: 0, x: album ? 24 : -24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: album ? -24 : 24 },
        transition: albumMobileSlideTransition,
      }
    : {
        initial: false,
        animate: { opacity: 1, x: 0 },
        exit: undefined,
        transition: { duration: 0 },
      };

  if (album) {
    const isYoutubeAlbum = album.albumType === "youtube";
    const visibleImages = album.images.slice(0, visibleCount);
    const visibleVideos = album.videos.slice(0, visibleCount);
    const imageUrls = visibleImages.map((image) => image.url);
    const hasMoreItems = isYoutubeAlbum
      ? visibleVideos.length < album.videos.length
      : visibleImages.length < album.images.length;
    const selectedVideo =
      album.videos.find((video) => video.id === selectedVideoId) || album.videos[0];
    const totalItems = isYoutubeAlbum ? album.videos.length : album.images.length;

    return (
      <div className="album-detail-surface w-full bg-[#f1f1f1] pb-20" id="main-content">
        <motion.div
          key={`album-detail-${album.slug}`}
          className="desktop-content-pane mx-auto min-h-screen max-w-[950px] bg-white px-4 py-8 pt-6 focus:outline-none md:border-x md:border-[#dce2e9] md:px-8 md:pt-8 dark:border-[#27272a]"
          {...pageMotionProps}
        >
          <div className="mx-auto max-w-4xl md:px-4 md:pt-1">
            <div className="mb-6 border-b border-border pb-5">
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-primary">
                {CATEGORY_LABELS[album.category] || album.category}
              </p>
              <h1 className="text-[1.825rem] font-semibold tracking-tight text-foreground">
                {album.title}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
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
                  {formatMediaCount(totalItems, isYoutubeAlbum)}
                </span>
              </div>
              {album.description ? (
                <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">
                  {album.description}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {album.relatedEvent ? (
                  <Button asChild variant="outline" className="rounded-none">
                    <Link href={`/buscar?q=${encodeURIComponent(album.relatedEvent.title)}`}>
                      <Info className="mr-2 h-4 w-4" aria-hidden="true" />
                      Ver informacion del evento
                    </Link>
                  </Button>
                ) : null}
                {isYoutubeAlbum && album.youtubeUrl ? (
                  <Button asChild variant="outline" className="rounded-none">
                    <a href={album.youtubeUrl} target="_blank" rel="noreferrer">
                      <Youtube className="mr-2 h-4 w-4" aria-hidden="true" />
                      Ver en YouTube
                    </a>
                  </Button>
                ) : null}
                {!isYoutubeAlbum && album.facebookUrl ? (
                  <Button asChild variant="outline" className="rounded-none">
                    <a href={album.facebookUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                      Facebook
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>

            {isYoutubeAlbum ? (
              <>
                {selectedVideo ? (
                  <div className="mb-5 overflow-hidden border border-border bg-black">
                    <div className="aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${selectedVideo.id}`}
                        title={selectedVideo.title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border border-border bg-card p-8 text-center">
                    <Youtube className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" aria-hidden="true" />
                    <p className="text-sm font-medium text-foreground">Sin videos disponibles</p>
                    {album.youtubeError ? (
                      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
                        {album.youtubeError}
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleVideos.map((video, index) => (
                    <YoutubeVideoTile
                      key={video.id}
                      video={video}
                      index={index}
                      isActive={selectedVideo?.id === video.id}
                      onSelect={(nextVideo) => setSelectedVideoId(nextVideo.id)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-flow-dense grid-cols-2 gap-2 [grid-auto-rows:8.5rem] sm:[grid-auto-rows:10rem] md:grid-cols-4 md:[grid-auto-rows:9.5rem]">
                {visibleImages.map((image, index) => (
                  <AlbumImageTile
                    key={`${image.url}-${index}`}
                    image={image}
                    index={index}
                    onOpen={setCurrentIndex}
                  />
                ))}
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
                        isYoutubeAlbum ? album.videos.length : album.images.length,
                      ),
                    )
                  }
                >
                  {isYoutubeAlbum ? "Cargar más videos" : "Cargar más fotos"}
                </Button>
              </div>
            ) : null}

            {currentIndex !== null ? (
              <ImageGalleryModal
                images={imageUrls}
                currentIndex={currentIndex}
                onClose={() => setCurrentIndex(null)}
                onNavigate={setCurrentIndex}
                alt={album.title}
              />
            ) : null}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f1f1f1] pb-20" id="main-content">
      <motion.div
        key="album-list"
        className="desktop-content-pane mx-auto min-h-screen max-w-[950px] bg-white px-4 py-8 pt-[82px] focus:outline-none md:border-x md:border-[#dce2e9] md:px-8 md:pt-[88px] dark:border-[#27272a]"
        {...pageMotionProps}
      >
        <div className="mx-auto max-w-4xl md:px-4 md:pt-1">
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
                        selectedType === ALL_FILTER ? "bg-[#e8effb]" : "hover:bg-[#e8effb]"
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
                        selectedType === PHOTO_FILTER ? "bg-[#e8effb]" : "hover:bg-[#e8effb]"
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
                        selectedType === VIDEO_FILTER ? "bg-[#e8effb]" : "hover:bg-[#e8effb]"
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
            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
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
                {albums.length > 0 ? "Sin álbumes para este tipo" : "Sin álbumes disponibles"}
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
