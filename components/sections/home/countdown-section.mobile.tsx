"use client";

import { useMemo, useState, useEffect, useRef, useLayoutEffect } from "react";
import Image from "next/image";
import { Newsreader } from "next/font/google";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  MapPin,
  Images,
  ExternalLink,
  Maximize2,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrayerWallForm } from "@/components/shared/prayer-wall-form";
import { HeroDebugPanel } from "./hero-debug-panel";
import { Lightbox } from "@/components/shared/lightbox";
import { formatRegionWeekdayDayMonth } from "@/lib/region-date";
import useLockBodyScroll from "@/hooks/use-lock-scroll";
import type { Event, HeroCard, PrayerWallConfig, SocialPost } from "@/lib/types";
import type { HeroCandidate } from "@/lib/ranker";
import { pickHeroAndDeck, getAccentColor } from "@/lib/ranker";
import { useTime } from "@/lib/time-context";
import {
  getAlbumSharingEvents,
  calculateCountdown,
} from "@/lib/countdown-utils";

interface CountdownSectionProps {
  events: Event[];
  onRegister?: (event: Event) => void;
  customHeroCard?: HeroCard | null;
  prayerWall?: PrayerWallConfig | null;
  socialPosts?: SocialPost[];
  instagramUrl?: string;
  facebookUrl?: string;
}

interface TimeUnit {
  value: number;
  label: string;
}

const CUSTOM_BANNER_ACCENT = "#e36600";
const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});
// Paper aesthetic: shadows were removed from the shared mobile card helpers.
const MOBILE_FLOATING_CARD_CLASS =
  "rounded-[2px]";
const MOBILE_FLOATING_BORDER_CLASS =
  "rounded-[2px]";

function FlipCountdownCell({ value, label }: TimeUnit) {
  const [displayValue, setDisplayValue] = useState(value);
  const [reduceMotion, setReduceMotion] = useState(false);
  const cellRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const swapTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReduceMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    return () => {
      if (swapTimeoutRef.current !== null) {
        window.clearTimeout(swapTimeoutRef.current);
      }
      animationRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    if (value === displayValue) return;

    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }

    const cell = cellRef.current;
    if (cell) {
      animationRef.current?.cancel();
      if (swapTimeoutRef.current !== null) {
        window.clearTimeout(swapTimeoutRef.current);
      }

      animationRef.current = cell.animate(
        [
          {
            transform: "perspective(800px) rotateX(0deg)",
            opacity: 1,
            backgroundColor: "rgba(74, 112, 165, 0)",
            boxShadow: "inset 0 0 0 0 rgba(74, 112, 165, 0)",
          },
          {
            transform: "perspective(900px) rotateX(-86deg) scale(0.97)",
            opacity: 0.88,
            backgroundColor: "rgba(74, 112, 165, 0.16)",
            boxShadow: "inset 0 0 0 1px rgba(74, 112, 165, 0.35)",
          },
          {
            transform: "perspective(900px) rotateX(0deg) scale(1)",
            opacity: 1,
            backgroundColor: "rgba(74, 112, 165, 0)",
            boxShadow: "inset 0 0 0 0 rgba(74, 112, 165, 0)",
          },
        ],
        {
          duration: 320,
          easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
          fill: "none",
        },
      );

      swapTimeoutRef.current = window.setTimeout(() => {
        setDisplayValue(value);
        swapTimeoutRef.current = null;
      }, 210);
    } else {
      setDisplayValue(value);
    }
  }, [value, displayValue, reduceMotion]);

  const displayText = String(displayValue).padStart(2, "0");

  return (
    <div
      ref={cellRef}
      className="py-3 text-center"
      style={{
        willChange: "transform, opacity, background-color, box-shadow",
        transformOrigin: "50% 50%",
      }}
      aria-live="off"
    >
      <div className="relative mx-auto h-10 w-full max-w-[70px]">
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground tabular-nums leading-none">
          {displayText}
        </span>
      </div>

      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1.5 font-medium">
        {label}
      </p>
    </div>
  );
}

type MobilePrayer = NonNullable<PrayerWallConfig["selectedPrayers"]>[number];

function MobilePrayerSpotlightCard({
  mode,
  prayers = [],
  onCollect,
}: {
  mode: "collect" | "show";
  prayers?: MobilePrayer[];
  onCollect?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showFullPrayerModal, setShowFullPrayerModal] = useState(false);
  const prayerTextRef = useRef<HTMLParagraphElement | null>(null);

  const currentPrayer = prayers[index];
  const prayerText = currentPrayer?.text ?? "";
  const canNavigate = prayers.length > 1;
  const textSize =
    prayerText.length <= 70
      ? "text-[20px]"
      : prayerText.length <= 135
        ? "text-[18px]"
        : "text-[17px]";

  useLockBodyScroll(showFullPrayerModal);

  useLayoutEffect(() => {
    const textEl = prayerTextRef.current;
    if (!textEl || mode !== "show") return;

    const updateOverflow = () => {
      window.requestAnimationFrame(() => {
        const clone = textEl.cloneNode(true) as HTMLParagraphElement;
        const parent = textEl.parentElement;

        if (!parent) return;

        clone.style.position = "absolute";
        clone.style.visibility = "hidden";
        clone.style.pointerEvents = "none";
        clone.style.display = "block";
        clone.style.WebkitLineClamp = "unset";
        clone.style.webkitLineClamp = "unset";
        clone.style.overflow = "visible";
        clone.style.maxHeight = "none";
        clone.style.height = "auto";
        clone.style.width = `${textEl.clientWidth}px`;
        clone.style.left = "0";
        clone.style.top = "0";

        parent.appendChild(clone);
        const needsMoreSpace =
          clone.getBoundingClientRect().height > textEl.getBoundingClientRect().height + 1;
        clone.remove();
        setIsOverflowing(needsMoreSpace);
      });
    };

    updateOverflow();
    window.addEventListener("resize", updateOverflow);
    return () => window.removeEventListener("resize", updateOverflow);
  }, [mode, prayerText, textSize]);

  const goToPrayer = (direction: "previous" | "next") => {
    setIndex((current) => {
      if (direction === "previous") return (current - 1 + prayers.length) % prayers.length;
      return (current + 1) % prayers.length;
    });
  };

  return (
    <div className={`desktop-card-lift bg-card border border-border overflow-hidden mb-3 ${MOBILE_FLOATING_CARD_CLASS}`}>
      <div className="h-[3px] bg-[#2d6a4f]" aria-hidden="true" />
      <div className="flex min-h-[270px] flex-col p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.12em] text-[#2d6a4f]">
            <HeartHandshake className="h-3 w-3" aria-hidden="true" />
            Oraciones
          </span>
        </div>

        {mode === "collect" ? (
          <>
            <h3 className={`${editorialFont.className} type-human-title mb-2 text-[22px] font-bold leading-snug`}>
              Muro de oraciones · comparte tu petición
            </h3>
            <p className="type-system mb-5 text-[15px] leading-relaxed">
              Tu mensaje es anónimo y será revisado por el equipo.
            </p>
            <button
              type="button"
              onClick={onCollect}
              className="mt-auto inline-flex w-fit items-center gap-1 text-[17px] font-semibold leading-tight text-[#2d6a4f] transition-colors hover:text-[#24573f] hover:underline underline-offset-2"
            >
              Pedir oración
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 items-center justify-center">
              {currentPrayer ? (
                <div className="w-full mt-3.5 px-[3px] ml-[-15px]">
                  <p
                    ref={prayerTextRef}
                    className={`${editorialFont.className} type-human ${textSize} text-justify font-normal italic leading-[1.62] px-[2px]`}
                    style={{
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 7,
                      overflow: "hidden",
                    }}
                  >
                    <span
                      className="block"
                      style={{
                        paddingLeft: "0.75em",
                        textIndent: "-0.75em",
                      }}
                    >
                      <span className="font-serif text-[1.35em] leading-none text-[#9aa3ad]">“</span>
                      <span>{currentPrayer.text}</span>
                      <span className="ml-0.5 font-serif text-[1.35em] leading-none text-[#9aa3ad]">”</span>
                    </span>
                  </p>
                  {isOverflowing && (
                    <div className="pl-[0.75em]">
                      <button
                        type="button"
                        onClick={() => setShowFullPrayerModal(true)}
                        className="mt-4 inline-flex w-fit items-center gap-1 text-[15px] font-normal leading-tight text-primary transition-colors hover:text-primary/80 hover:underline underline-offset-2"
                      >
                        Leer más
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className={`${editorialFont.className} type-human text-center text-[18px] leading-relaxed`}>
                  La comunidad está orando · únete
                </p>
              )}
            </div>

            {canNavigate && (
              <div className="mt-3 flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => goToPrayer("previous")}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#eef2f5] hover:text-[#2d6a4f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93]"
                  aria-label="Ver oración anterior"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>

                <div className="flex items-center justify-center gap-1.5" aria-label={`Oración ${index + 1} de ${prayers.length}`}>
                  {prayers.map((prayer, idx) => (
                    <span
                      key={prayer._id ?? `${prayer.submittedAt}-${idx}`}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === index ? "w-7 bg-[#2d6a4f]" : "w-2 bg-[#c9d2d8]"
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => goToPrayer("next")}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#eef2f5] hover:text-[#2d6a4f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93]"
                  aria-label="Ver siguiente oración"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showFullPrayerModal && currentPrayer
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Oración completa"
            >
              <button
                type="button"
                className="absolute inset-0"
                aria-label="Cerrar oración completa"
                onClick={() => setShowFullPrayerModal(false)}
              />
              <div
                className="relative max-h-[80vh] w-full max-w-md overflow-hidden border border-black bg-white shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex h-16 items-center justify-between bg-[#757575] pl-5">
                  <h3 className="text-[17px] font-bold text-white">Oración completa</h3>
                  <button
                    type="button"
                    onClick={() => setShowFullPrayerModal(false)}
                    className="flex h-full w-14 items-center justify-center bg-[#434343] text-white transition-colors hover:bg-[#2f2f2f]"
                    aria-label="Cerrar"
                  >
                    <span className="text-3xl leading-none">×</span>
                  </button>
                </div>
                <div className="max-h-[calc(80vh-64px)] overflow-y-auto p-6">
                  <p className={`${editorialFont.className} type-human text-[16px] italic leading-relaxed`}>
                    “{currentPrayer.text}”
                  </p>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function CountdownSection({
  events,
  onRegister,
  customHeroCard,
  prayerWall,
  socialPosts,
  instagramUrl,
  facebookUrl,
}: CountdownSectionProps) {
  const { currentTime } = useTime();
  const [isMounted, setIsMounted] = useState(false);
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const spotlightCandidates = useMemo<HeroCandidate[]>(() => {
    const nowMs = currentTime.getTime();
    const candidates: HeroCandidate[] = [];

    if (customHeroCard?.media?.url) {
      candidates.push({
        type: "custom",
        id: customHeroCard._id,
        publishedAt: new Date(customHeroCard.publishedAt).getTime(),
        accentColor: CUSTOM_BANNER_ACCENT,
        media: {
          isVertical: Boolean(customHeroCard.media.isVertical),
          alt: customHeroCard.media.alt || "Contenido destacado",
        },
        url: customHeroCard.url,
        ctaText: customHeroCard.ctaText,
        pinned: customHeroCard.pinned,
        priorityWeight: customHeroCard.priorityWeight,
      });
    }

    if (prayerWall && prayerWall.enabled && prayerWall.phase !== 'paused') {
      candidates.push({
        type: "prayer",
        id: prayerWall._id,
        phase: prayerWall.phase,
        publishedAt: new Date(prayerWall.publishedAt).getTime(),
        selectedPrayersCount: prayerWall.selectedPrayers?.length ?? 0,
      });
    }

    events.forEach((event) => {
      candidates.push({
        type: "event",
        id: event.id,
        title: event.title,
        date: event.date.getTime(),
        time: event.time,
        location: event.location,
        address: event.address,
        registrationEnabled: event.registrationEnabled,
      });
    });

    (socialPosts ?? []).forEach((post) => {
      candidates.push({
        type: "social",
        id: post._id,
        network: post.network,
        postedAt: new Date(post.postedAt).getTime(),
        url: post.url,
        caption: post.caption,
        media: post.media
          ? {
              isVertical: post.media.isVertical,
            }
          : undefined,
      });
    });

    if ((socialPosts?.length ?? 0) === 0) {
      const hasMetaKeys = Boolean(
        process.env.META_PAGE_ACCESS_TOKEN ||
          process.env.META_INSTAGRAM_ACCOUNT_ID ||
          process.env.META_FACEBOOK_PAGE_ID,
      )

      if (hasMetaKeys) {
        if (instagramUrl) {
          candidates.push({
            type: "social",
            id: "ig-fallback",
            network: "instagram",
            postedAt: nowMs - 18 * 60 * 60 * 1000,
            url: instagramUrl,
          });
        }
        if (facebookUrl) {
          candidates.push({
            type: "social",
            id: "fb-fallback",
            network: "facebook",
            postedAt: nowMs - 36 * 60 * 60 * 1000,
            url: facebookUrl,
          });
        }
      }
    }

    return candidates;
  }, [
    currentTime,
    customHeroCard,
    prayerWall,
    events,
    socialPosts,
    instagramUrl,
    facebookUrl,
  ]);

  const spotlight = useMemo(
    () => pickHeroAndDeck(spotlightCandidates, currentTime.getTime(), true),
    [spotlightCandidates, currentTime],
  );

  const spotlightHero = spotlight.hero;
  const spotlightAccent = spotlightHero ? getAccentColor(spotlightHero) : "#2f5e93";

  const countdownEvent = useMemo(() => {
    if (!spotlightHero || spotlightHero.type !== "event") return null;
    return events.find((event) => event.id === spotlightHero.id) ?? null;
  }, [spotlightHero, events]);
  const spotlightSocialPost = useMemo(() => {
    if (!spotlightHero || spotlightHero.type !== "social") return null;
    return (socialPosts ?? []).find((post) => post._id === spotlightHero.id) ?? null;
  }, [spotlightHero, socialPosts]);
  const albumEvents = useMemo(
    () => getAlbumSharingEvents(events, currentTime),
    [events, currentTime],
  );
  const countdownData = useMemo(() => {
    if (!countdownEvent) return null;
    return calculateCountdown(countdownEvent, currentTime);
  }, [countdownEvent, currentTime]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!isLocal || !spotlight.debug) return;

    window.dispatchEvent(
      new CustomEvent("hero-ranking-debug", {
        detail: spotlight.debug,
      }),
    );
  }, [spotlight]);

  if (!isMounted || (!spotlightHero && albumEvents.length === 0)) {
    return null;
  }

  const getTimeUnits = (): TimeUnit[] => {
    if (!countdownData) return [];
    return [
      { value: countdownData.daysRemaining, label: "Días" },
      { value: countdownData.hoursRemaining, label: "Hrs" },
      { value: countdownData.minutesRemaining, label: "Min" },
      { value: countdownData.secondsRemaining, label: "Seg" },
    ];
  };

  const openGoogleMaps = (url: string) => {
    window.open(url, "_blank");
  };

  const canRegisterCountdownEvent =
    !!countdownEvent && countdownEvent.registrationEnabled !== false;

  const showPrayerCollectCard =
    spotlightHero?.type === "prayer" && spotlightHero.phase === "collect";
  const showPrayerDisplayCard =
    spotlightHero?.type === "prayer" &&
    spotlightHero.phase === "show" &&
    (prayerWall?.selectedPrayers?.length ?? 0) > 0;
  const showCustomCard = spotlightHero?.type === "custom";
  const showSocialCard = spotlightHero?.type === "social";

  return (
    <section
      className="pt-[38px] bg-paper px-4 pb-0 mb-0"
      data-countdown-section
      aria-label="Sección destacada"
    >
      <div className="max-w-md mx-auto w-full space-y-4">
        {/* Spotlight: event */}
        {countdownEvent && countdownData && !countdownData.isPostEvent && (
          <div className={`desktop-card-lift border bg-paper-highlight border-border overflow-hidden mb-6 ${MOBILE_FLOATING_CARD_CLASS}`}>
            <div className="h-[3px]" style={{ backgroundColor: "#2f5e93" }} aria-hidden="true" />

            <div className="p-5">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3.5 ml-[-2px] mt-[-2px]"
                style={{ color: "#2f5e93" }}
              >
                Nuestro Próximo Evento
              </p>

              {/* Event title — serif for editorial weight */}
              <h3
                className={`${editorialFont.className} type-human-title mb-5 text-[29px] text-4xl font-extrabold leading-[1.125] tracking-tight`}
              >
                {countdownEvent.title}
              </h3>

              {/* Meta: date + location */}
              <div className="space-y-1.5 mb-5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="inline-flex items-baseline gap-2 text-[19px] font-bold leading-none tabular-nums">
                    <span>{formatRegionWeekdayDayMonth(countdownEvent.date)}</span>
                    <span className="text-[#2f5e93]" aria-hidden="true">
                      ·
                    </span>
                    <span>{countdownEvent.time}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-0 mt-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate text-foreground/80">
                    {countdownEvent.address || countdownEvent.location}
                  </span>
                  {countdownEvent.googleMapsUrl ? (
                    <button
                      onClick={() => openGoogleMaps(countdownEvent.googleMapsUrl!)}
                      className="inline-flex shrink-0 items-center gap-1 text-[16px] font-semibold text-primary transition-colors hover:text-primary/80 hover:underline underline-offset-2 leading-tight"
                      aria-label="Abrir ubicación del evento en Google Maps"
                    >
                      <ExternalLink className="h-3.5 w-3.5 stroke-3 shrink-0" aria-hidden="true" />
                      <span>Maps</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Countdown grid — flat dividers, no background fill */}
              <div
                className={`grid grid-cols-4 border border-border divide-x divide-border ${MOBILE_FLOATING_BORDER_CLASS}`}
                role="timer"
                aria-label="Tiempo restante para el evento"
              >
                {getTimeUnits().map((unit) => (
                  <FlipCountdownCell
                    key={unit.label}
                    value={unit.value}
                    label={unit.label}
                  />
                ))}
              </div>

              {canRegisterCountdownEvent && onRegister && (
                <Button
                  onClick={() => onRegister(countdownEvent)}
                  className="w-full mt-5 h-14 text-base font-extrabold tracking-[0.02em] text-white"
                  style={{ backgroundColor: spotlightAccent }}
                >
                  REGISTRARSE
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Spotlight: custom media */}
        {showCustomCard && customHeroCard && (
          <div className={`desktop-card-lift bg-card border border-border overflow-hidden mb-3 ${MOBILE_FLOATING_CARD_CLASS}`}>
            <div className="h-[3px]" style={{ backgroundColor: spotlightAccent }} aria-hidden="true" />
            <div className="p-3">
              <p className="type-system mb-2.5 inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.12em]">
                <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Aviso a la congregacion</span>
              </p>
                    <div>
                      <button
                        type="button"
                        onClick={() => setIsLightboxOpen(true)}
                        aria-haspopup="dialog"
                        aria-label="Ver imagen en pantalla completa"
                        className="mx-auto block w-full"
                      >
                        <div
                          className={`group relative w-full overflow-hidden flex items-center justify-center bg-transparent ${
                            customHeroCard.media.isVertical ? "h-[min(86vh,680px)] md:h-[520px]" : "h-[210px] md:h-[250px]"
                          }`}
                        >
                          <img
                            src={customHeroCard.media.url}
                            alt={customHeroCard.media.alt || "Contenido destacado"}
                            className="block mx-auto max-h-full max-w-full w-auto h-auto object-contain"
                            decoding="async"
                          />

                          {/* Desktop hover centered magnifier */}
                          <div className="hidden md:flex pointer-events-none absolute inset-0 items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 rounded-full p-3">
                              <Maximize2 className="h-6 w-6 text-white" aria-hidden="true" />
                            </div>
                          </div>

                          {/* Mobile: icon bottom-right */}
                          <div className="md:hidden pointer-events-none absolute bottom-2 right-2">
                            <div className="rounded-[2px] border-2 border-[#111827]/20 bg-white p-1.5">
                              <Maximize2 className="h-4 w-4 text-[#111827]" aria-hidden="true" />
                            </div>
                          </div>
                        </div>
                      </button>
                      {isLightboxOpen && (
                        <Lightbox
                          src={customHeroCard.media.url}
                          alt={customHeroCard.media.alt || "Contenido destacado"}
                          onClose={() => setIsLightboxOpen(false)}
                        />
                      )}
                    </div>
              {customHeroCard.url && (
                <Button asChild className="mt-3 w-full h-11 bg-[#e98432] hover:bg-[#cf7425] text-white text-sm font-bold px-4">
                  <a href={customHeroCard.url} target="_blank" rel="noopener noreferrer">
                    <span className="inline-flex items-center justify-center gap-1.5 w-full">
                      {customHeroCard.ctaText || "Ver más información"}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Spotlight: social */}
        {showSocialCard && spotlightHero && spotlightHero.type === "social" && (
          <div className={`desktop-card-lift bg-card border border-border overflow-hidden mb-3 ${MOBILE_FLOATING_CARD_CLASS}`}>
            <div className="h-[3px]" style={{ backgroundColor: spotlightAccent }} aria-hidden="true" />
            <div className="p-5">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3"
                style={{ color: spotlightAccent }}
              >
                {spotlightHero.network === "instagram" ? "Instagram" : "Facebook"}
              </p>

              {spotlightSocialPost?.media?.url && (
                <div
                  className={`relative w-full overflow-hidden border border-border bg-[#f5f6f8] mb-4 ${MOBILE_FLOATING_BORDER_CLASS} ${
                    spotlightSocialPost.media.isVertical
                      ? "h-[min(86vh,680px)] md:h-[520px]"
                      : "h-[210px] md:h-[250px]"
                  }`}
                >
                  <Image
                    src={spotlightSocialPost.media.url}
                    alt={spotlightSocialPost.caption || "Publicación destacada"}
                    fill
                    sizes="(max-width: 768px) 92vw, 560px"
                    className={spotlightSocialPost.media.isVertical ? "object-contain" : "object-cover"}
                  />
                </div>
              )}

              <a
                href={spotlightHero.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: spotlightAccent }}
              >
                Ver publicación
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        )}

        {/* Spotlight: prayer collect */}
        {showPrayerCollectCard && (
          <MobilePrayerSpotlightCard
            mode="collect"
            onCollect={() => setIsPrayerModalOpen(true)}
          />
        )}

        {/* Spotlight: prayer show */}
        {showPrayerDisplayCard && prayerWall && (
          <MobilePrayerSpotlightCard
            mode="show"
            prayers={prayerWall.selectedPrayers}
          />
        )}

        {/* ── Album sharing cards (post-event) ── */}
        {albumEvents.map((event) => (
          <div key={event.id} className={`desktop-card-lift bg-card border border-border p-4 ${MOBILE_FLOATING_CARD_CLASS}`}>
            <div className="flex items-start gap-3">
              <Images
                className="h-4 w-4 text-primary shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <h4 className={`${editorialFont.className} type-human-title text-sm font-semibold mb-0.5 truncate`}>
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
                  className="bg-primary hover:bg-primary/90 text-white text-xs"
                >
                  <Images className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  {event.googleDriveAlbumUrl
                    ? "Subir Fotos"
                    : "Álbum no disponible"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PrayerWallForm
        isOpen={isPrayerModalOpen}
        onClose={() => setIsPrayerModalOpen(false)}
        isCollecting={prayerWall?.phase === "collect"}
      />

      <HeroDebugPanel />
    </section>
  );
}
