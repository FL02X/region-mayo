"use client";

// Donde: rutas /album, /album/galerias, /album/grabaciones y detalles de album.
// Viewports: desktop y mobile. 
// Funcion: coordina las pantallas publicas del album y deja las piezas visuales en archivos internos.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Newsreader } from "next/font/google";
import {
  Calendar,
  Camera,
  ChevronDown,
  ExternalLink,
  Info,
  Images,
  Youtube,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ImageGalleryModal } from "@/components/shared/image-album-modal";
import { NativeYoutubePlayer } from "@/components/shared/native-youtube-player";
import { sanityImageVariantUrl } from "@/lib/sanity/image";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Album } from "@/lib/types";
import {
  ALL_FILTER,
  CATEGORY_LABELS,
  PHOTO_FILTER,
  VIDEO_FILTER,
} from "@/components/sections/album/shared/album-copy";
import {
  filterAlbumsByChip,
  formatAlbumDate,
  formatGalleryMediaCount,
  formatMediaCount,
  getAlbumMediaItems,
  getAlbumYear,
  getGalleryItemPreviewUrl,
  getRecentAlbums,
} from "@/components/sections/album/shared/album-utils";
import { consumeAlbumTransition } from "@/components/sections/album/shared/album-transition";
import {
  AlbumHubEntryCard,
  AlbumRecentItem,
} from "@/components/sections/album/hub/album-hub-pieces";
import {
  GalleryAlbumTile,
  GalleryFilterChip,
  RecordingAlbumListItem,
  getGalleryYearGridClasses,
} from "@/components/sections/album/section-list/album-section-list-pieces";
import {
  AlbumCard,
  AlbumMediaTile,
  YoutubeVideoTile,
} from "@/components/sections/album/detail/album-detail-pieces";
import {
  getAlbumTileLayout,
  type AlbumTileLayout,
} from "@/components/sections/album/detail/album-media-layout";

const INITIAL_VISIBLE_PHOTOS = 60;
const PHOTOS_PER_PAGE = 40;
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
type VideoOrientation = "portrait" | "landscape";

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
        className="desktop-content-pane mx-auto min-h-[100dvh] max-w-[1150px] overflow-x-clip bg-[#050505] px-0 pb-0 pt-[32px] md:pt-[44px] focus:outline-none md:min-h-[calc(100dvh-45px)] md:border-x md:border-white/10 md:pb-16"
        style={{ backgroundColor: "#111111" }}
      >
        <div className="mx-auto w-full md:w-[calc(100%-32px)]">
          <section className="px-4 pb-6 pt-0 md:px-8 md:pb-8">
            {/* <p className="mb-5 text-[12px] font-semibold uppercase text-white/42">
              Archivo
            </p> */}
            <h1 className={`${editorialFont.className} max-w-[11ch] text-[3rem] font-normal leading-[0.95] text-ink-white md:text-[4rem]`}>
              Álbum de Actividades
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-6 text-white/85 md:text-[17px]">
                Archivo de fotos y grabaciones de las actividades regionales y generales de la Iglesia Gentil de Cristo.
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
            <div className="mt-4">
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
    <div className="w-full overflow-x-clip bg-[#f1f1f1] md:overflow-x-visible" id="main-content">
      <div className="desktop-content-pane mx-auto min-h-[calc(100dvh-51px)] max-w-[1150px] overflow-x-clip bg-paper px-0 pb-14 pt-[32px] md:overflow-x-visible md:pt-[44px] focus:outline-none md:min-h-[calc(100dvh-45px)] md:border-x border-border md:pb-16 md:pt-8">
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

    if (consumeAlbumTransition()) {
      setShouldAnimatePage(true);
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
        className="album-detail-surface w-full overflow-x-clip bg-[#f1f1f1] md:overflow-x-visible"
        id="main-content"
      >
        <motion.div
          key={`album-detail-${album.slug}-${shouldAnimate ? "mobile" : "static"}`}
          className="desktop-content-pane mx-auto min-h-[calc(100dvh-95px)] max-w-[1150px] overflow-x-clip bg-paper px-0 pb-14 pt-[32px] md:overflow-x-visible md:pt-[44px] focus:outline-none md:min-h-[calc(100dvh-45px)] md:border-x border-border md:pb-16"
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
                    className="inline-flex items-center justify-center gap-2 rounded-none border border-border bg-background px-3 py-2 text-sm font-medium text-foreground touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hover:bg-brand-hover md:hover:text-accent-foreground"
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
                    className="inline-flex items-center justify-center gap-2 rounded-none border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hover:bg-accent md:hover:text-accent-foreground"
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
              {/* Feature desactivada: se conserva el bloque para reactivar subida directa desde el detalle. */}
              {false && !isYoutubeAlbum && album?.canSubmitPhotos ? (
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
                        <NativeYoutubePlayer
                          videoId={selectedVideo.id}
                          title={selectedVideo.title}
                          thumbnailUrl={selectedVideo.thumbnailUrl}
                          isPortrait={selectedVideoIsPortrait}
                          shareLabel={album.title}
                        />
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
    <div className="w-full overflow-x-clip bg-[#f1f1f1] md:overflow-x-visible" id="main-content">
      <motion.div
        key={`album-list-${shouldAnimate ? "mobile" : "static"}`}
        className="desktop-content-pane mx-auto min-h-[100dvh] max-w-[950px] overflow-x-clip bg-paper px-4 pb-14 pt-[32px] md:overflow-x-visible md:pt-[44px] focus:outline-none md:min-h-[calc(100dvh-45px)] md:border-x md:px-8 md:pb-16"
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
                  Archivo de fotos y grabaciones de las actividades regionales y generales.
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
