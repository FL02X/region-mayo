"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Images,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfflineImagePlaceholder } from "@/components/shared/offline-image-placeholder";
import { ImageGalleryModal } from "@/components/shared/image-gallery-modal";
import { sanityImageVariantUrl } from "@/lib/sanity/image";
import type { Album, AlbumImage, EventType } from "@/lib/types";

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

function AlbumCard({ album }: { album: Album }) {
  return (
    <Link
      href={`/album/${album.slug}`}
      className="desktop-card-lift group block overflow-hidden border border-border bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`Abrir album ${album.title}`}
    >
      <div className="offline-aware-image offline-aware-image--fixed relative h-48 w-full bg-muted">
        <Image
          src={sanityImageVariantUrl(album.coverImage, {
            width: 720,
            height: 460,
            quality: 70,
            format: "webp",
            fit: "crop",
          })}
          alt={album.title}
          fill
          className="offline-image-online object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 310px"
        />
        <OfflineImagePlaceholder />
        <div className="absolute right-3 top-3 bg-white/92 px-2 py-1 text-[12px] font-semibold text-foreground shadow-sm">
          {album.images.length} fotos
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
      </div>
    </Link>
  );
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
      className="group relative aspect-[4/3] overflow-hidden border border-border bg-muted text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`Abrir foto ${index + 1}`}
    >
      <Image
        src={sanityImageVariantUrl(image.url, {
          width: 520,
          height: 390,
          quality: 58,
          format: "webp",
          fit: "crop",
        })}
        alt={image.alt}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
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
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  if (album) {
    const imageUrls = album.images.map((image) => image.url);

    return (
      <div className="w-full bg-[#f1f1f1] pb-20" id="main-content">
        <div className="desktop-content-pane mx-auto min-h-screen max-w-[950px] bg-white px-4 py-8 pt-[82px] focus:outline-none md:border-x md:border-[#dce2e9] md:px-8 md:pt-[88px] dark:border-[#27272a]">
          <div className="mx-auto max-w-4xl md:px-4 md:pt-1">
            <div className="mb-5">
              <Button asChild variant="ghost" className="h-9 rounded-none px-0 text-sm">
                <Link href="/album">
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  Álbumes
                </Link>
              </Button>
            </div>

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
                  <Images className="h-4 w-4" aria-hidden="true" />
                  {album.images.length} fotos
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
                      <LinkIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                      Ver evento relacionado
                    </Link>
                  </Button>
                ) : null}
                {album.facebookUrl ? (
                  <Button asChild variant="outline" className="rounded-none">
                    <a href={album.facebookUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                      Facebook
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mb-5 overflow-hidden border border-border bg-muted">
              <div className="offline-aware-image offline-aware-image--fixed relative aspect-[16/9] w-full">
                <Image
                  src={sanityImageVariantUrl(album.coverImage, {
                    width: 1200,
                    height: 675,
                    quality: 75,
                    format: "webp",
                    fit: "crop",
                  })}
                  alt={album.title}
                  fill
                  priority
                  className="offline-image-online object-cover"
                  sizes="(max-width: 1024px) 100vw, 900px"
                />
                <OfflineImagePlaceholder />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {album.images.map((image, index) => (
                <AlbumImageTile
                  key={`${image.url}-${index}`}
                  image={image}
                  index={index}
                  onOpen={setCurrentIndex}
                />
              ))}
            </div>
          </div>
        </div>

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
    );
  }

  return (
    <div className="w-full bg-[#f1f1f1] pb-20" id="main-content">
      <div className="desktop-content-pane mx-auto min-h-screen max-w-[950px] bg-white px-4 py-8 pt-[82px] focus:outline-none md:border-x md:border-[#dce2e9] md:px-8 md:pt-[88px] dark:border-[#27272a]">
        <div className="mx-auto max-w-4xl md:px-4 md:pt-1">
          <div className="mb-6 border-b border-border pb-4">
            <h1 className="text-[1.825rem] font-semibold tracking-tight text-foreground">
              Álbum de Actividades
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Revive los momentos especiales de nuestros eventos.
            </p>
          </div>

          {albums.length > 0 ? (
            <div
              className={`grid gap-4 ${
                albums.length === 1
                  ? "mx-auto max-w-sm grid-cols-1"
                  : albums.length === 2
                    ? "mx-auto max-w-2xl grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {albums.map((item) => (
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
                Sin álbumes disponibles
              </p>
              <p className="text-xs text-muted-foreground">
                Los álbumes se publicarán después de los eventos.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
