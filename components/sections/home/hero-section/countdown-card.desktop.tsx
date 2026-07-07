// Donde: columna izquierda del hero desktop. 
// Viewports: desktop. 
// Funcion: tarjetas visibles para evento, aviso personalizado y post social destacado.
import Image from "next/image";
import {
  Calendar,
  ExternalLink,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Megaphone,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lightbox } from "@/components/shared/lightbox";
import { formatRegionWeekdayDayMonth } from "@/lib/region-date";
import type { Event, HeroCard, SocialPost } from "@/lib/types";
import type { HeroCandidate } from "@/lib/ranker";
import {
  CUSTOM_BANNER_CTA,
  type CountdownDisplay,
  type CountdownOccurrence,
} from "@/components/sections/home/hero-section/desktop-hero-utils";
import { CompactCountdownCell } from "@/components/sections/home/hero-section/desktop-countdown-cell";
import { formatDesktopCountdownDate, formatMobileCountdownDate } from "../countdown-section/countdown-utils";

export function DesktopEventSpotlightCard({
  event,
  schedule,
  accentColor,
  countdownDisplay,
  countdownIsDisabled,
  mapsUrl,
  canShare,
  onOpenMaps,
  onShare,
  onRegister,
}: {
  event: Event;
  schedule: CountdownOccurrence[];
  accentColor: string;
  countdownDisplay: CountdownDisplay | null;
  countdownIsDisabled: boolean;
  mapsUrl: string;
  canShare: boolean;
  onOpenMaps: () => void;
  onShare: () => void;
  onRegister: () => void;
}) {
  const timeUnits = countdownDisplay
    ? [
        { value: countdownDisplay.days, label: "Días" },
        { value: countdownDisplay.hours, label: "Hrs" },
        { value: countdownDisplay.minutes, label: "Min" },
        { value: countdownDisplay.seconds, label: "Seg" },
      ]
    : [];

  return (
    <article className="desktop-next-event-lift w-full bg-paper p-5 backdrop-blur-[1px] md:p-6 rounded-[2px]">
      <p
        className="text-[13px] font-bold uppercase tracking-[0.16em] mb-3"
        style={{ color: accentColor }}
      >
        Nuestro Próximo Evento
      </p>
      <h3
        className="type-human-title mb-6 text-[clamp(30px,3.25vw,36px)] font-bold leading-[1.04] tracking-tight lg:mr-30 lg:text-[36px]"
        style={{ fontFamily: '"Canela", Georgia, serif' }}
      >
        {event.title}
      </h3>
      <div className="type-system space-y-1.5 text-[17px] mb-6">
        <div className="flex items-start gap-2">
          <Calendar className="mt-[2px] h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="space-y-1.5 mb-3">
            {schedule.map((occurrence, index) => (
              <span
                key={`${occurrence.date.toISOString()}-${index}`}
                className="block font-bold text-ink"
              >
                {formatDesktopCountdownDate(occurrence.date)} · {occurrence.time}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-start gap-2 min-w-0 italic">
          <MapPin className="mt-[2px] h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="text-ink">
            {event.address || event.location}
          </span>
        </div>
      </div>

      {/* {countdownDisplay && (
        <div className={`grid grid-cols-4 border border-[#d5dbe3] divide-x divide-[#d5dbe3] bg-white/95 mb-3 ${countdownIsDisabled ? "opacity-60 saturate-0" : ""}`}>
          {timeUnits.map((unit) => (
            <CompactCountdownCell
              key={unit.label}
              value={unit.value}
              label={unit.label}
              disabled={countdownIsDisabled}
            />
          ))}
        </div>
      )} */}

      {mapsUrl ? (
        <button
          type="button"
          onClick={onOpenMaps}
          className="mb-1 inline-flex min-h-17 w-full items-center justify-center gap-2 rounded-sm bg-brand px-4 py-3 text-center text-[18px] font-extrabold leading-tight tracking-[0.02em] text-white transition-colors hover:bg-brand-hover"
          aria-label="Abrir ubicación del evento"
        >
          <MapIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0">VER UBICACIÓN</span>
        </button>
      ) : (
        <button
          type="button"
          disabled
          className="mb-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-brand px-4 py-3 text-center text-[17px] font-extrabold leading-tight tracking-[0.02em] text-white opacity-60"
        >
          <MapIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0">VER UBICACIÓN</span>
        </button>
      )}

      <div className="mx-4 my-3 border-t border-border/50" />

      <button
        type="button"
        onClick={onShare}
        disabled={!canShare}
        className="inline-flex min-h-10 w-full items-center justify-center gap-3 rounded-sm border border-border bg-paper-dark px-4 py-2.5 text-center text-[16px] font-semibold leading-tight tracking-[0.02em] text-foreground/80 transition-colors hover:bg-gray-300 text-ink disabled:opacity-60 [&>span]:min-w-0"
      >
        <Share2 className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
        <span className="min-w-0">COMPARTIR UBICACIÓN</span>
      </button>

      {event.registrationEnabled !== false && (
        <Button
          onClick={onRegister}
          className="w-full h-10 text-[13px] font-extrabold tracking-[0.04em] text-white rounded-[2px]"
          style={{ backgroundColor: accentColor }}
        >
          REGISTRARSE
        </Button>
      )}
    </article>
  );
}

export function DesktopCustomSpotlightCard({
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
  return (
    <article className="desktop-next-event-lift overflow-hidden rounded-[2px] bg-white/93 p-3 backdrop-blur-[1px]">
      <p className="type-system mb-1.5 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em]">
        <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
        <span>AVISO</span>
      </p>
      <button
        type="button"
        onClick={onOpenLightbox}
        aria-haspopup="dialog"
        aria-label="Ver imagen en pantalla completa"
        className="mx-auto block w-full"
      >
        <div
          className={`group relative w-full overflow-hidden border border-[#d5dbe3] bg-[#f5f6f8] flex items-center justify-center p-1.5 ${
            card.media.isVertical ? "h-[334px]" : "h-[220px]"
          }`}
        >
          <img
            src={card.media.url}
            alt={card.media.alt || "Contenido destacado"}
            className="block max-h-full max-w-full w-auto h-auto object-contain"
            decoding="async"
          />

          <div className="hidden md:flex pointer-events-none absolute inset-0 items-center justify-center">
            <div className="rounded-[2px] border-2 border-white/15 bg-black/45 p-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Maximize2 className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
          </div>

          <div className="md:hidden pointer-events-none absolute bottom-2 right-2">
            <div className="bg-white/90 rounded-full p-2 shadow">
              <Maximize2 className="h-4 w-4 text-black" aria-hidden="true" />
            </div>
          </div>
        </div>
      </button>
      {isLightboxOpen && (
        <Lightbox
          src={card.media.url}
          alt={card.media.alt || "Contenido destacado"}
          onClose={onCloseLightbox}
        />
      )}
      {card.url && (
        <Button
          asChild
          className="mt-2.5 w-full h-9 text-[12px] font-extrabold tracking-[0.04em] text-white rounded-[2px]"
          style={{ backgroundColor: CUSTOM_BANNER_CTA }}
        >
          <a href={card.url} target="_blank" rel="noopener noreferrer">
            <span className="inline-flex items-center justify-center gap-1.5 w-full">
              {card.ctaText || "Ver más información"}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </a>
        </Button>
      )}
    </article>
  );
}

export function DesktopSocialSpotlightCard({
  hero,
  post,
  accentColor,
}: {
  hero: Extract<HeroCandidate, { type: "social" }>;
  post: SocialPost | null;
  accentColor: string;
}) {
  return (
    <article className="desktop-next-event-lift bg-white/93 backdrop-blur-[1px] p-4 rounded-[2px]">
      <p
        className="text-[10px] font-bold uppercase tracking-[0.16em] mb-2"
        style={{ color: accentColor }}
      >
        {hero.network === "instagram" ? "Instagram" : "Facebook"}
      </p>
      {post?.media?.url && (
        <div
          className={`relative w-full overflow-hidden border border-[#dce2e9] bg-[#f5f6f8] mb-3 ${
            post.media.isVertical ? "h-[360px]" : "h-[220px]"
          }`}
        >
          <Image
            src={post.media.url}
            alt={post.caption || "Publicación destacada"}
            fill
            sizes="(min-width: 768px) 390px"
            className="object-cover"
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
    </article>
  );
}
