"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Calendar, MapPin, Images, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrayerCarousel } from "@/components/prayer-carousel";
import { PrayerWallForm } from "@/components/prayer-wall-form";
import { HeroDebugPanel } from "@/components/hero-debug-panel";
import { Lightbox } from "@/components/lightbox";
import { Search } from "lucide-react";
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
        accentColor: customHeroCard.accentColor || "#2f5e93",
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

    if (prayerWall && prayerWall.enabled) {
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

  const formatDate = (date: Date) => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  };

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
      className="bg-background px-4 pt-[15px] pb-0 md:pt-6"
      data-countdown-section
      aria-label="Sección destacada"
    >
      <div className="max-w-md mx-auto w-full space-y-4">
        {/* Spotlight: event */}
        {countdownEvent && countdownData && !countdownData.isPostEvent && (
          <div className="desktop-card-lift bg-card border border-border overflow-hidden mb-3">
            <div className="h-[3px]" style={{ backgroundColor: spotlightAccent }} aria-hidden="true" />

            <div className="p-5">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3"
                style={{ color: spotlightAccent }}
              >
                Próximo Evento
              </p>

              {/* Event title — serif for editorial weight */}
              <h3 className="text-xl font-bold text-foreground leading-snug mb-3">
                {countdownEvent.title}
              </h3>

              {/* Meta: date + location */}
              <div className="space-y-1.5 mb-5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {formatDate(countdownEvent.date)} · {countdownEvent.time}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {countdownEvent.googleMapsUrl ? (
                    <button
                      onClick={() => openGoogleMaps(countdownEvent.googleMapsUrl!)}
                      className="group inline-flex items-center gap-1.5 text-left text-muted-foreground hover:text-foreground transition-colors overflow-hidden"
                      aria-label="Abrir ubicación del evento en Google Maps"
                    >
                      <span className="truncate">
                        {countdownEvent.address || countdownEvent.location}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 shrink-0"
                        style={{ color: spotlightAccent }}
                      >
                        <ExternalLink
                          className="h-3.5 w-3.5 opacity-80 group-hover:opacity-100"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-semibold opacity-90 group-hover:opacity-100">
                          Maps
                        </span>
                      </span>
                    </button>
                  ) : (
                    <span className="truncate text-muted-foreground">
                      {countdownEvent.address || countdownEvent.location}
                    </span>
                  )}
                </div>
              </div>

              {/* Countdown grid — flat dividers, no background fill */}
              <div
                className="grid grid-cols-4 border border-border divide-x divide-border"
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
          <div className="desktop-card-lift bg-card border border-border overflow-hidden mb-3">
            <div className="h-[3px]" style={{ backgroundColor: spotlightAccent }} aria-hidden="true" />
            <div className="p-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => setIsLightboxOpen(true)}
                        aria-haspopup="dialog"
                        aria-label="Ver imagen en pantalla completa"
                        className={customHeroCard.url ? "block" : "pointer-events-none block"}
                      >
                        <div
                          className={`group relative w-full overflow-hidden border border-border bg-[#f5f6f8] ${
                            customHeroCard.media.isVertical ? "h-[420px] md:h-[520px]" : "h-[210px] md:h-[250px]"
                          }`}
                        >
                          <Image
                            src={customHeroCard.media.url}
                            alt={customHeroCard.media.alt || "Contenido destacado"}
                            fill
                            sizes="(max-width: 768px) 92vw, 560px"
                            className="object-contain"
                          />

                          {/* Desktop hover centered magnifier */}
                          <div className="hidden md:flex pointer-events-none absolute inset-0 items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 rounded-full p-3">
                              <Search className="h-6 w-6 text-white" aria-hidden="true" />
                            </div>
                          </div>

                          {/* Mobile: icon bottom-right */}
                          <div className="md:hidden pointer-events-none absolute bottom-2 right-2">
                            <div className="bg-white/90 rounded-full p-2 shadow">
                              <Search className="h-4 w-4 text-black" aria-hidden="true" />
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
                <Button asChild className="mt-3 w-full h-11 bg-[#2f5e93] hover:bg-[#244a72] text-white text-sm font-bold px-4">
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
          <div className="desktop-card-lift bg-card border border-border overflow-hidden mb-3">
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
                  className={`relative w-full overflow-hidden border border-border mb-4 ${
                    spotlightSocialPost.media.isVertical
                      ? "h-[420px] md:h-[520px]"
                      : "h-[210px] md:h-[250px]"
                  }`}
                >
                  <Image
                    src={spotlightSocialPost.media.url}
                    alt={spotlightSocialPost.caption || "Publicación destacada"}
                    fill
                    sizes="(max-width: 768px) 92vw, 560px"
                    className="object-cover"
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
          <div className="desktop-card-lift bg-card border border-border overflow-hidden mb-3">
            <div className="h-[3px]" style={{ backgroundColor: "#2d6a4f" }} aria-hidden="true" />
            <div className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2d6a4f] mb-3">
                Muro de Oraciones
              </p>
              <h3 className="text-lg font-bold text-foreground leading-snug mb-2">
                Comparte tu petición de oración
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tu mensaje es anónimo y será revisado por el equipo antes de mostrarse.
              </p>
              <Button
                onClick={() => setIsPrayerModalOpen(true)}
                className="w-full h-12 text-base font-bold bg-[#2d6a4f] hover:bg-[#24573f] text-white"
              >
                Enviar oración
              </Button>
            </div>
          </div>
        )}

        {/* Spotlight: prayer show */}
        {showPrayerDisplayCard && prayerWall && (
          <div className="desktop-card-lift bg-card border border-border overflow-hidden mb-3">
            <div className="h-[3px]" style={{ backgroundColor: "#2d6a4f" }} aria-hidden="true" />
            <div className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2d6a4f] mb-3">
                Muro de Oraciones
              </p>
              <PrayerCarousel prayers={prayerWall.selectedPrayers} />
            </div>
          </div>
        )}

        {/* ── Album sharing cards (post-event) ── */}
        {albumEvents.map((event) => (
          <div key={event.id} className="desktop-card-lift bg-card border border-border p-4">
            <div className="flex items-start gap-3">
              <Images
                className="h-4 w-4 text-primary shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground mb-0.5 truncate">
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
