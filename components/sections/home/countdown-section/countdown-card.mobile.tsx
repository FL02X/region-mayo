"use client";

// Donde: countdown mobile de home. Viewports: mobile. Funcion: tarjetas visibles para evento, aviso, social y albumes post-evento.
import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  ExternalLink,
  Image as ImageIcon,
  Images,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Megaphone,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lightbox } from "@/components/shared/lightbox";
import type { Event, HeroCard, SocialPost } from "@/lib/types";
import type { HeroCandidate } from "@/lib/ranker";
import {
  MOBILE_FLOATING_BORDER_CLASS,
  MOBILE_FLOATING_CARD_CLASS,
  formatMobileCountdownDate,
  getTimeUnits,
  type CountdownDisplay,
  type CountdownOccurrence,
} from "@/components/sections/home/countdown-section/countdown-utils";
import { FlipCountdownCell } from "@/components/sections/home/countdown-section/flip-countdown-cell";

function CountdownScheduleLine({
  occurrence,
}: {
  occurrence: CountdownOccurrence;
}) {
  const lineRef = useRef<HTMLSpanElement>(null);
  const fullProbeRef = useRef<HTMLSpanElement>(null);
  const shortDayProbeRef = useRef<HTMLSpanElement>(null);
  const [dateFormat, setDateFormat] = useState<
    "full" | "short-day" | "short-day-month"
  >("full");

  const fullDateLabel = formatMobileCountdownDate(occurrence.date);
  const shortDayDateLabel = formatMobileCountdownDate(occurrence.date, {
    weekdayFormat: "short",
  });
  const shortDayMonthDateLabel = formatMobileCountdownDate(occurrence.date, {
    weekdayFormat: "short",
    monthFormat: "short",
  });
  const dateLabel =
    dateFormat === "short-day-month"
      ? shortDayMonthDateLabel
      : dateFormat === "short-day"
        ? shortDayDateLabel
        : fullDateLabel;

  useLayoutEffect(() => {
    const line = lineRef.current;
    const fullProbe = fullProbeRef.current;
    const shortDayProbe = shortDayProbeRef.current;
    if (!line || !fullProbe || !shortDayProbe) return;

    const updateDateFormat = () => {
      if (fullProbe.scrollWidth <= line.clientWidth) {
        setDateFormat("full");
        return;
      }

      setDateFormat(
        shortDayProbe.scrollWidth <= line.clientWidth
          ? "short-day"
          : "short-day-month",
      );
    };

    updateDateFormat();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateDateFormat);
      return () => window.removeEventListener("resize", updateDateFormat);
    }

    const observer = new ResizeObserver(updateDateFormat);
    observer.observe(line);
    return () => observer.disconnect();
  }, [fullDateLabel, shortDayDateLabel, occurrence.time]);

  return (
    <span className="relative block max-w-full">
      <span
        ref={lineRef}
        className="flex max-w-full flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[17px] font-bold leading-[1.5] tabular-nums"
      >
        <span>{dateLabel}</span>
        <span className="text-[#2f5e93]" aria-hidden="true">
          &middot;
        </span>
        <span>{occurrence.time}</span>
      </span>

      <span
        ref={fullProbeRef}
        className="pointer-events-none invisible absolute left-0 top-0 flex w-max items-baseline gap-x-2 whitespace-nowrap text-[17px] font-bold leading-[1.5] tabular-nums"
        aria-hidden="true"
      >
        <span>{fullDateLabel}</span>
        <span>&middot;</span>
        <span>{occurrence.time}</span>
      </span>

      <span
        ref={shortDayProbeRef}
        className="pointer-events-none invisible absolute left-0 top-0 flex w-max items-baseline gap-x-2 whitespace-nowrap text-[17px] font-bold leading-[1.5] tabular-nums"
        aria-hidden="true"
      >
        <span>{shortDayDateLabel}</span>
        <span>&middot;</span>
        <span>{occurrence.time}</span>
      </span>
    </span>
  );
}

export function CountdownEventSpotlightCard({
  event,
  schedule,
  countdownDisplay,
  countdownIsDisabled,
  countdownGridClassName,
  mapsUrl,
  placePhotoUrl,
  canRegister,
  canShare,
  accentColor,
  editorialFontClassName,
  onOpenMaps,
  onOpenPlacePhoto,
  onShare,
  onRegister,
}: {
  event: Event;
  schedule: CountdownOccurrence[];
  countdownDisplay: CountdownDisplay;
  countdownIsDisabled: boolean;
  countdownGridClassName: string;
  mapsUrl: string;
  placePhotoUrl: string;
  canRegister: boolean;
  canShare: boolean;
  accentColor: string;
  editorialFontClassName: string;
  onOpenMaps: (url: string) => void;
  onOpenPlacePhoto: () => void;
  onShare: () => void;
  onRegister?: (event: Event) => void;
}) {
  return (
    <div
      className={`desktop-card-lift border bg-paper-highlight border-x border-b border-t-0 overflow-hidden ${MOBILE_FLOATING_CARD_CLASS}`}
    >
      <div className="h-[5px] bg-brand" aria-hidden="true" />

      <div className="p-4 py-7 pb-4">
        <p
          className="text-[12px] text-brand-text font-semibold uppercase tracking-[0.16em] mb-3.5 mt-[-10px]"
          style={{ fontFamily: '"Inter", Arial, sans-serif' }}
        >
          Nuestro Próximo Evento
        </p>

        <h3
          className="type-human-title mb-6 text-[28px] text-4xl font-extrabold leading-[1.125] tracking-tight"
          style={{ fontFamily: '"Canela", Georgia, serif' }}
        >
          {event.title}
        </h3>

        <div className="">
          <div className="flex items-start gap-2 text-foreground mb-3">
            <Calendar
              className="mt-[3px] h-4.5 w-4.5 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0 space-y-1">
              {schedule.map((occurrence, index) => (
                <CountdownScheduleLine
                  key={`${occurrence.date.toISOString()}-${index}`}
                  occurrence={occurrence}
                />
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2 min-w-0 mt-2 mb-5 text-[17px] text-muted-foreground">
            <MapPin
              className="mt-[3px] h-4.5 w-4.5 shrink-0"
              aria-hidden="true"
            />
            <span className="leading-[1.5] text-foreground/80">
              {event.address || event.location}
            </span>
          </div>
        </div>

        <div
          className={`grid grid-cols-4 border divide-x divide-border ${MOBILE_FLOATING_BORDER_CLASS} ${countdownGridClassName}`}
          role="timer"
          aria-label="Tiempo restante para el evento"
          aria-disabled={countdownIsDisabled}
        >
          {getTimeUnits(countdownDisplay).map((unit) => (
            <FlipCountdownCell
              key={unit.label}
              value={unit.value}
              label={unit.label}
              editorialFontClassName={editorialFontClassName}
              disabled={countdownIsDisabled}
            />
          ))}
        </div>

        <div className="mt-5">
          {mapsUrl ? (
            <button
              type="button"
              onClick={() => onOpenMaps(mapsUrl)}
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-sm bg-brand px-4 py-3 text-center text-[18px] font-extrabold leading-tight tracking-[0.02em] text-white transition-colors hover:bg-brand-hover"
              aria-label="Abrir ubicación del evento"
            >
              <MapIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0">VER UBICACION</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-brand px-4 py-3 text-center text-[17px] font-extrabold leading-tight tracking-[0.02em] text-white opacity-60"
            >
              <MapIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0">VER UBICACION</span>
            </button>
          )}

          <div className="mt-2 space-y-2.5">
            <div className="mx-4 my-3 border-t border-border/50" />

            {placePhotoUrl && (
              <button
                type="button"
                onClick={onOpenPlacePhoto}
                className="mb-2.5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-sm border border-border bg-brand-soft px-4 py-3 text-center text-[16px] font-extrabold leading-tight tracking-[0.02em] text-[#2F5E93] transition-colors hover:bg-brand-soft/80"
                aria-haspopup="dialog"
                aria-label="Ver foto del lugar"
              >
                <ImageIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0">VER FOTO DEL LUGAR</span>
              </button>
            )}

            <button
              type="button"
              onClick={onShare}
              disabled={!canShare}
              className="text-foreground/80 inline-flex min-h-10 w-full items-center justify-center gap-3 rounded-sm border border-border bg-paper-dark px-4 py-2.5 text-center text-[16px] font-semibold leading-tight tracking-[0.02em] transition-colors hover:bg-muted/30 disabled:opacity-60 [&>span]:min-w-0"
            >
              <Share2 className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0">COMPARTIR UBICACIÓN</span>
            </button>
          </div>
        </div>

        {canRegister && onRegister && (
          <Button
            onClick={() => onRegister(event)}
            className="w-full mt-5 h-auto min-h-14 whitespace-normal py-3 text-center text-base font-extrabold leading-tight tracking-[0.02em] text-white"
            style={{ backgroundColor: accentColor }}
          >
            REGISTRARSE
          </Button>
        )}
      </div>
    </div>
  );
}

export function CountdownCustomSpotlightCard({
  card,
  isLightboxOpen,
  onOpenLightbox,
  onCloseLightbox,
}: {
  card: HeroCard;
  isLightboxOpen: boolean;
  onOpenLightbox: () => void;
  onCloseLightbox: () => void;
}) {
  const [isPortraitMedia, setIsPortraitMedia] = useState(card.media.isVertical);
  const mediaImageClass = isPortraitMedia
    ? "block h-auto max-h-[min(76svh,720px)] max-w-full object-contain md:max-h-[520px]"
    : "block h-auto max-h-[210px] max-w-full object-contain md:max-h-[250px]";

  return (
    <div
      className={`desktop-card-lift bg-card border border-orange-400 overflow-hidden mb-8 ${MOBILE_FLOATING_CARD_CLASS}`}
    >
      <div className="h-[3px] bg-orange-400" aria-hidden="true" />
      <div className="p-3 pb-4">
        <p className="type-system mt-2 mb-6 ml-1 inline-flex items-center gap-1.5 text-[14px] font-semibold uppercase tracking-[0.12em]">
          <Megaphone className="h-5.5 w-5.5 text-orange-400 mr-1.5" aria-hidden="true" />
          <span>Aviso a la congregación</span>
        </p>
        <div>
          <button
            type="button"
            onClick={onOpenLightbox}
            aria-haspopup="dialog"
            aria-label="Ver imagen en pantalla completa"
            className="mx-auto block w-full"
          >
            <div className="group flex w-full justify-center bg-transparent">
              <span className="relative inline-flex max-w-full">
                <img
                  src={card.media.url}
                  alt={card.media.alt || "Contenido destacado"}
                  className={mediaImageClass}
                  decoding="async"
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    setIsPortraitMedia(image.naturalHeight > image.naturalWidth);
                  }}
                />

                <div className="pointer-events-none absolute bottom-2 right-2 md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
                  <div className="rounded-[2px] border-2 border-[#111827]/20 bg-white/85 p-1.5">
                    <Maximize2
                      className="h-4 w-4 text-[#111827]"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </span>
            </div>
          </button>
          {isLightboxOpen && (
            <Lightbox
              src={card.media.url}
              alt={card.media.alt || "Contenido destacado"}
              onClose={onCloseLightbox}
            />
          )}
        </div>
        {card.url && (
          <Button
            asChild
            className="mt-3 h-auto min-h-11 w-full whitespace-normal bg-[#e98432] px-4 py-2.5 text-center text-sm font-bold leading-tight text-white hover:bg-[#cf7425]"
          >
            <a href={card.url} target="_blank" rel="noopener noreferrer">
              <span className="inline-flex w-full items-center justify-center gap-1.5">
                {card.ctaText || "Ver más información"}
                <ExternalLink
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
              </span>
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

export function CountdownSocialSpotlightCard({
  hero,
  post,
  accentColor,
}: {
  hero: Extract<HeroCandidate, { type: "social" }>;
  post: SocialPost | null;
  accentColor: string;
}) {
  const mediaHeightClass = post?.media?.isVertical
    ? "h-[min(86vh,680px)] md:h-[520px]"
    : "h-[210px] md:h-[250px]";
  const mediaFitClass = post?.media?.isVertical
    ? "object-contain"
    : "object-cover";

  return (
    <div
      className={`desktop-card-lift bg-card border border-border overflow-hidden mb-3 ${MOBILE_FLOATING_CARD_CLASS}`}
    >
      <div
        className="h-[3px]"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />
      <div className="p-5">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3"
          style={{ color: accentColor }}
        >
          {hero.network === "instagram" ? "Instagram" : "Facebook"}
        </p>

        {post?.media?.url && (
          <div
            className={`relative w-full overflow-hidden border border-border bg-[#f5f6f8] mb-4 ${MOBILE_FLOATING_BORDER_CLASS} ${mediaHeightClass}`}
          >
            <Image
              src={post.media.url}
              alt={post.caption || "Publicación destacada"}
              fill
              sizes="(max-width: 768px) 92vw, 560px"
              className={mediaFitClass}
            />
          </div>
        )}

        <a
          href={hero.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-semibold"
          style={{ color: accentColor }}
        >
          Ver publicación
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export function AlbumSharingCard({
  event,
  editorialFontClassName,
}: {
  event: Event;
  editorialFontClassName: string;
}) {
  return (
    <div
      className={`desktop-card-lift bg-card border border-border p-4 ${MOBILE_FLOATING_CARD_CLASS}`}
    >
      <div className="flex items-start gap-3">
        <Images
          className="h-4 w-4 text-primary shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <h4
            className={`${editorialFontClassName} type-human-title text-sm font-semibold mb-0.5 truncate`}
          >
            {event.title}
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            Comparte tus fotos del evento
          </p>
          <Button
            onClick={() => {
              if (event.googleDriveAlbumUrl) {
                window.open(event.googleDriveAlbumUrl, "_blank");
              }
            }}
            disabled={!event.googleDriveAlbumUrl}
            size="sm"
            className="h-auto min-h-8 whitespace-normal bg-primary py-2 text-center text-xs leading-tight text-white hover:bg-primary/90"
          >
            <Images
              className="mr-1.5 h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            {event.googleDriveAlbumUrl ? "Subir Fotos" : "Álbum no disponible"}
          </Button>
        </div>
      </div>
    </div>
  );
}
