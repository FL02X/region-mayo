// Donde: ruta /album. 
// Viewports: desktop y mobile. 
// Funcion: muestra accesos a galerias/grabaciones y la lista reciente del hub.
import { useEffect, useRef, useState } from "react";
import { Newsreader } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Images, Play, PlayCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { sanityImageVariantUrl } from "@/sanity/lib/image";
import type { Album } from "@/lib/types";
import {
  formatAlbumPreviewDate,
  formatHubRecentContext,
  getAlbumDetailPath,
} from "@/components/sections/album/shared/album-utils";

const HUB_TAP_FEEDBACK_CLASS = "bg-white/[0.08]";

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

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

export function AlbumHubEntryCard({
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
      className="relative flex min-h-[142px] overflow-hidden border border-black bg-ink-white p-[7px] text-ink transition-[border-color,box-shadow] md:block md:min-h-0 md:p-2 md:hover:shadow-[0_16px_45px_rgba(0,0,0,0.28)]"
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
                  <div key={`${title}-${index}`} className={tileClasses}>
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
                        unoptimized
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

export function AlbumRecentItem({ album }: { album: Album }) {
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
            className={`${editorialFont.className} block max-w-full text-[18px] font-normal leading-tight text-white transition-colors hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
          >
            <span className="block truncate">{album.title}</span>
          </Link>
          <p className="mt-1 truncate text-[11px] uppercase text-white/62">
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
