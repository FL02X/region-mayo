"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Newsreader, Playfair_Display } from "next/font/google";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  HeartHandshake,
  MapPin,
  Maximize2,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegistrationModal } from "@/components/shared/registration-modal";
import { PrayerWallForm } from "@/components/shared/prayer-wall-form";
import { HighlightedText } from "@/components/shared/highlighted-text";
import { HeroDebugPanel } from "./hero-debug-panel";
import { Lightbox } from "@/components/shared/lightbox";
import { formatRegionEventDate } from "@/lib/region-date";
import { useTime } from "@/lib/time-context";
import useLockBodyScroll from "@/hooks/use-lock-scroll";
import { calculateCountdown } from "@/lib/countdown-utils";
import type {
  Event,
  HeroImage,
  RegionPresident,
  HeroCard,
  PrayerWallConfig,
  SocialPost,
} from "@/lib/types";
import type { HeroCandidate } from "@/lib/ranker";
import { pickHeroAndDeck, getAccentColor } from "@/lib/ranker";

const CUSTOM_BANNER_ACCENT = "#e36600";
const CUSTOM_BANNER_CTA = "#e98432";
const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});
const heroTitleFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  preload: false,
});

interface HeroSectionProps {
  heroImages?: HeroImage[];
  events: Event[];
  customHeroCard?: HeroCard | null;
  prayerWall?: PrayerWallConfig | null;
  socialPosts?: SocialPost[];
  instagramUrl?: string;
  facebookUrl?: string;
  regionPresident: RegionPresident | null;
}

function CompactCountdownCell({ value, label }: { value: number; label: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value === displayValue) return;

    setIsAnimating(true);
    const swapTimer = window.setTimeout(() => setDisplayValue(value), 120);
    const endTimer = window.setTimeout(() => setIsAnimating(false), 280);

    return () => {
      window.clearTimeout(swapTimer);
      window.clearTimeout(endTimer);
    };
  }, [value, displayValue]);

  return (
    <div className="py-2.5 text-center">
      <div
        className={`text-[24px] font-bold text-[#1f2833] tabular-nums leading-none transition-transform duration-200 ${
          isAnimating ? "-translate-y-[1px] scale-[0.97]" : "translate-y-0 scale-100"
        }`}
      >
        {String(displayValue).padStart(2, "0")}
      </div>
      <p className="text-[9px] text-[#5b6876] uppercase tracking-[0.14em] mt-1 font-semibold">{label}</p>
    </div>
  );
}

type HeroPrayer = NonNullable<PrayerWallConfig["selectedPrayers"]>[number];

function HeroPrayerCard({
  mode,
  prayers = [],
  onCollect,
}: {
  mode: "collect" | "show";
  prayers?: HeroPrayer[];
  onCollect?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showFullPrayerModal, setShowFullPrayerModal] = useState(false);
  const prayerTextRef = useRef<HTMLParagraphElement | null>(null);

  const currentPrayer = prayers[index];
  const canNavigate = prayers.length > 1;
  const prayerText = currentPrayer?.text ?? "";
  const textSize =
    prayerText.length <= 70
      ? "text-[20px]"
      : prayerText.length <= 135
        ? "text-[18px]"
        : "text-[17px]";
  const maxVisibleLines = 5;

  useLockBodyScroll(showFullPrayerModal);

  useLayoutEffect(() => {
    const textEl = prayerTextRef.current;
    if (!textEl || mode !== "show") return;

    const updateOverflow = () => {
      window.requestAnimationFrame(() => {
        const needsMoreSpace = textEl.scrollHeight > textEl.clientHeight + 1;
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
    <article className="desktop-next-event-lift relative flex min-h-[270px] w-full flex-col overflow-hidden rounded-[2px] bg-white/93 p-4 backdrop-blur-[1px]">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.12em] text-[#2d6a4f]">
            <HeartHandshake className="h-3 w-3" aria-hidden="true" />
            Peticiones de oracion
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
            <div className="mt-0 flex min-h-0 flex-1 items-center justify-center">
              {currentPrayer ? (
                <div className="w-full">
                  <p
                    ref={prayerTextRef}
                    className={`${editorialFont.className} type-human ${textSize} text-center font-normal italic leading-[1.62]`}
                    style={{
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: maxVisibleLines,
                      overflow: "hidden",
                    }}
                  >
                    <span className="font-serif text-[1.35em] leading-none text-[#9aa3ad]">“</span>
                    {currentPrayer.text}
                    <span className="font-serif text-[1.35em] leading-none text-[#9aa3ad]">”</span>
                  </p>
                  {isOverflowing && (
                    <button
                      type="button"
                      onClick={() => setShowFullPrayerModal(true)}
                      className="mx-auto ml-2 mt-4 inline-flex w-fit items-center gap-1 text-[15px] font-normal leading-tight text-primary transition-colors hover:text-primary/80 hover:underline underline-offset-2"
                    >
                      Leer completo...
                    </button>
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
    </article>
  );
}

export function HeroSection({
  heroImages,
  events,
  customHeroCard,
  prayerWall,
  socialPosts,
  instagramUrl,
  facebookUrl,
  regionPresident,
}: HeroSectionProps) {
  const SLIDE_INTERVAL_MS = 5000;
  const SLIDE_DURATION_MS = 650;
  const [isDesktop, setIsDesktop] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [isSliding, setIsSliding] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const { currentTime } = useTime();
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

      // Only add social fallback links when Meta integration keys are present.
      // This avoids showing an Instagram/Facebook card when the API isn't configured.
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
  const spotlightEvent = useMemo(() => {
    if (!spotlightHero || spotlightHero.type !== "event") return null;
    return events.find((event) => event.id === spotlightHero.id) ?? null;
  }, [spotlightHero, events]);
  const spotlightSocialPost = useMemo(() => {
    if (!spotlightHero || spotlightHero.type !== "social") return null;
    return (socialPosts ?? []).find((post) => post._id === spotlightHero.id) ?? null;
  }, [spotlightHero, socialPosts]);

  const countdownData = useMemo(() => {
    if (!spotlightEvent) return null;
    return calculateCountdown(spotlightEvent, currentTime);
  }, [spotlightEvent, currentTime]);

  const slides = useMemo(() => {
    const cmsSlides = (heroImages ?? [])
      .map((img) => ({
        url: img?.url,
        alt: img?.alt || "Imagen del hero",
      }))
      .filter((img): img is { url: string; alt: string } => Boolean(img.url));

    if (cmsSlides.length > 0) {
      return cmsSlides;
    }

    return [{ url: "/images/event-conference.jpg", alt: "Evento Región Mayo" }];
  }, [heroImages]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const query = window.matchMedia("(min-width: 768px)");
    setIsDesktop(query.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    query.addEventListener("change", handleChange);
    return () => {
      query.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop || slides.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setIncomingIndex((prevIncoming) => {
        if (prevIncoming !== null) return prevIncoming;

        const next = (currentIndex + 1) % slides.length;
        setIsSliding(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsSliding(true));
        });
        return next;
      });
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [currentIndex, isDesktop, slides.length]);

  useEffect(() => {
    if (incomingIndex === null || !isSliding) return;

    const timeoutId = window.setTimeout(() => {
      setCurrentIndex(incomingIndex);
      setIncomingIndex(null);
      setIsSliding(false);
    }, SLIDE_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [incomingIndex, isSliding]);

  const scrollToContent = () => {
    const header = document.querySelector("header");
    const headerOffset = header instanceof HTMLElement ? header.offsetHeight : 0;

    const countdownSection = document.querySelector("[data-countdown-section]");
    const isCountdownVisible =
      countdownSection instanceof HTMLElement &&
      countdownSection.offsetParent !== null;

    if (isCountdownVisible) {
      const offsetPosition =
        countdownSection.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      return;
    }

    // Prefer scrolling to the calendar title so we can precisely align it below
    // the fixed header. Use scrollIntoView to rely on the DOM's layout, then
    // apply a small smooth offset equal to header height + desired spacing
    // so the title sits visibly below the header (no hard-coded absolute
    // coordinates).
    const calendarTitle = document.getElementById("calendar-title");
    if (calendarTitle) {
      // Increase desired spacing by 5px as requested (was 10px -> now 15px)
      const DESIRED_SPACING = 15; // pixels of space between header and title

      // Compute absolute position and perform a single smooth scroll to the
      // target so the whole interaction is smooth (no instant jumps).
      const absoluteTop = calendarTitle.getBoundingClientRect().top + window.scrollY;
      const target = Math.max(0, absoluteTop - headerOffset - DESIRED_SPACING);
      window.scrollTo({ top: target, behavior: "smooth" });
      return;
    }

    const calendarSection = document.getElementById("calendario");
    if (calendarSection) {
      const EXTRA_OFFSET = 24; // fallback offset to ensure separator is hidden
      const offsetPosition =
        calendarSection.getBoundingClientRect().top + window.scrollY - headerOffset + EXTRA_OFFSET;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const timeUnits = countdownData
    ? [
        { value: countdownData.daysRemaining, label: "Días" },
        { value: countdownData.hoursRemaining, label: "Hrs" },
        { value: countdownData.minutesRemaining, label: "Min" },
        { value: countdownData.secondsRemaining, label: "Seg" },
      ]
    : [];

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

  const showPrayerCollectCard =
    spotlightHero?.type === "prayer" && spotlightHero.phase === "collect";
  const showPrayerDisplayCard =
    spotlightHero?.type === "prayer" &&
    spotlightHero.phase === "show" &&
    (prayerWall?.selectedPrayers?.length ?? 0) > 0;
  const showCustomCard = spotlightHero?.type === "custom";
  const showSocialCard = spotlightHero?.type === "social";

  if (!isDesktop) {
    return null;
  }

  return (
    <div className="w-full relative bg-[#f1f1f1]">
      <div className="desktop-content-pane max-w-[950px] mx-auto bg-[#ffffff] md:border-x border-[#dce2e9] dark:border-[#27272a]">
        <section
          className="relative overflow-hidden h-[min(60vh,480px)] md:h-[420px] min-h-[280px]"
          aria-label="Bienvenida a Región Mayo"
        >
          <div className="absolute inset-0">
            <Image
              key={`hero-current-${currentIndex}`}
              src={slides[currentIndex].url}
              alt={slides[currentIndex].alt}
              fill
              sizes="(min-width: 950px) 950px, 100vw"
              className={`object-cover pointer-events-none select-none transition-transform duration-[650ms] ease-out ${
                incomingIndex !== null && isSliding ? "-translate-x-[8%]" : "translate-x-0"
              }`}
              priority
              loading="eager"
              fetchPriority="high"
              quality={75}
              draggable={false}
            />
          </div>

          {incomingIndex !== null && (
            <div
              className={`absolute inset-0 transition-transform duration-[650ms] ease-out ${
                isSliding ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <Image
                key={`hero-incoming-${incomingIndex}`}
                src={slides[incomingIndex].url}
                alt={slides[incomingIndex].alt}
                fill
                sizes="(min-width: 950px) 950px, 100vw"
                className="object-cover pointer-events-none select-none"
                loading="eager"
                fetchPriority="high"
                quality={75}
                draggable={false}
              />
            </div>
          )}

          <div
            className="absolute inset-0 bg-gray-900/60 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 h-full flex items-center px-5 md:px-6 pt-[52px] md:pt-[46px] pb-3">
            <div className="w-full grid md:grid-cols-[minmax(290px,390px)_1fr] gap-4 md:gap-5 items-center">
              <div className="hidden md:block">
                {spotlightEvent && (
                  <article className="desktop-next-event-lift bg-white/93 backdrop-blur-[1px] p-4 rounded-[2px]">
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.16em] mb-2"
                      style={{ color: spotlightAccent }}
                    >
                      Nuestro Próximo Evento
                    </p>
                    <h3 className={`${editorialFont.className} type-human-title text-[34px] font-bold leading-[1.04] mb-2.5`}>
                      {spotlightEvent.title}
                    </h3>
                    <div className="type-system space-y-1.5 text-[13px] mb-3.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{formatRegionEventDate(spotlightEvent.date)} · {spotlightEvent.time}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {spotlightEvent.googleMapsUrl ? (
                          <button
                            onClick={() => window.open(spotlightEvent.googleMapsUrl!, "_blank")}
                            className="inline-flex items-center gap-1 min-w-0 text-left hover:underline underline-offset-2 transition-colors"
                            style={{ color: spotlightAccent }}
                            aria-label="Abrir ubicación del próximo evento en Google Maps"
                          >
                            <span className="truncate">
                              <HighlightedText text={spotlightEvent.address || spotlightEvent.location} query="" />
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          </button>
                        ) : (
                          <span className="truncate">
                            <HighlightedText text={spotlightEvent.address || spotlightEvent.location} query="" />
                          </span>
                        )}
                      </div>
                    </div>

                    {countdownData && !countdownData.isPostEvent && (
                      <div className="grid grid-cols-4 border border-[#d5dbe3] divide-x divide-[#d5dbe3] bg-white/95 mb-3">
                        {timeUnits.map((unit) => (
                          <CompactCountdownCell
                            key={unit.label}
                            value={unit.value}
                            label={unit.label}
                          />
                        ))}
                      </div>
                    )}

                    {spotlightEvent.registrationEnabled !== false && (
                      <Button
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="w-full h-10 text-[13px] font-extrabold tracking-[0.04em] text-white rounded-[2px]"
                        style={{ backgroundColor: spotlightAccent }}
                      >
                        REGISTRARSE
                      </Button>
                    )}
                  </article>
                )}

                {showCustomCard && customHeroCard && (
                  <article className="desktop-next-event-lift overflow-hidden rounded-[2px] bg-white/93 p-3 backdrop-blur-[1px]">
                    <p className="type-system mb-1.5 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em]">
                      <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>AVISO</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      aria-haspopup="dialog"
                      aria-label="Ver imagen en pantalla completa"
                      className="mx-auto block w-full"
                    >
                      <div
                        className={`group relative w-full overflow-hidden border border-[#d5dbe3] bg-[#f5f6f8] flex items-center justify-center p-1.5 ${
                          customHeroCard.media.isVertical ? "h-[334px]" : "h-[220px]"
                        }`}
                      >
                        <img
                          src={customHeroCard.media.url}
                          alt={customHeroCard.media.alt || "Contenido destacado"}
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
                        src={customHeroCard.media.url}
                        alt={customHeroCard.media.alt || "Contenido destacado"}
                        onClose={() => setIsLightboxOpen(false)}
                      />
                    )}
                    {customHeroCard.url && (
                      <Button
                        asChild
                        className="mt-2.5 w-full h-9 text-[12px] font-extrabold tracking-[0.04em] text-white rounded-[2px]"
                        style={{ backgroundColor: CUSTOM_BANNER_CTA }}
                      >
                        <a href={customHeroCard.url} target="_blank" rel="noopener noreferrer">
                          <span className="inline-flex items-center justify-center gap-1.5 w-full">
                            {customHeroCard.ctaText || "Ver más información"}
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                        </a>
                      </Button>
                    )}
                  </article>
                )}

                {showSocialCard && spotlightHero && spotlightHero.type === "social" && (
                  <article className="desktop-next-event-lift bg-white/93 backdrop-blur-[1px] p-4 rounded-[2px]">
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.16em] mb-2"
                      style={{ color: spotlightAccent }}
                    >
                      {spotlightHero.network === "instagram" ? "Instagram" : "Facebook"}
                    </p>
                    {spotlightSocialPost?.media?.url && (
                      <div
                        className={`relative w-full overflow-hidden border border-[#dce2e9] bg-[#f5f6f8] mb-3 ${
                          spotlightSocialPost.media.isVertical ? "h-[360px]" : "h-[220px]"
                        }`}
                      >
                        <Image
                          src={spotlightSocialPost.media.url}
                          alt={spotlightSocialPost.caption || "Publicación destacada"}
                          fill
                          sizes="(min-width: 768px) 390px"
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
                  </article>
                )}

                {showPrayerCollectCard && (
                  <HeroPrayerCard
                    mode="collect"
                    onCollect={() => setIsPrayerModalOpen(true)}
                  />
                )}

                {showPrayerDisplayCard && prayerWall && (
                  <HeroPrayerCard
                    mode="show"
                    prayers={prayerWall.selectedPrayers}
                  />
                )}
              </div>

              <div className="w-full max-w-[390px] flex flex-col justify-center text-center md:text-left md:justify-self-end">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85 opacity-75">
                  Iglesia Gentil de Cristo
                </p>
                <h1 className={`${heroTitleFont.className} mb-5 text-[2.05rem] font-semibold leading-[1.04] tracking-[0.01em] text-white [text-shadow:0_3px_16px_rgba(0,0,0,0.45)] sm:text-[2.45rem]`}>
                  <span className="block">Calendario</span>
                  <span className="block">Región Mayo</span>
                </h1>
                <button
                  onClick={scrollToContent}
                  className="group flex w-full items-center justify-start gap-2 py-3 text-[15px] font-semibold text-white/90 opacity-75 transition-colors hover:text-white"
                  aria-label="Explorar calendario y desplazarse hacia abajo"
                >
                  Explorar Calendario 2026
                  <ChevronDown className="h-5 w-5 text-white/70 transition-all group-hover:translate-y-1 group-hover:text-white" aria-hidden="true" />
                </button>

                {slides.length > 1 && (
                  <div className="mt-5 flex items-center justify-center gap-2 opacity-75 md:justify-start" aria-label="Indicador de carrusel">
                    {slides.map((_, index) => {
                      const isActive = index === (incomingIndex ?? currentIndex);
                      return (
                        <span
                          key={`hero-dot-${index}`}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            isActive ? "w-5 bg-white" : "w-1.5 bg-white/55"
                          }`}
                          aria-hidden="true"
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dark overlay for text on right side */}
          <div
            className="absolute top-0 right-0 bottom-0 w-[70%] bg-gradient-to-l from-black/60 via-black/30 to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {spotlightEvent && (
            <RegistrationModal
              event={spotlightEvent}
              isOpen={isRegisterModalOpen}
              onClose={() => setIsRegisterModalOpen(false)}
              regionPresident={regionPresident}
            />
          )}

          <PrayerWallForm
            isOpen={isPrayerModalOpen}
            onClose={() => setIsPrayerModalOpen(false)}
            isCollecting={prayerWall?.phase === "collect"}
          />

          <HeroDebugPanel />
        </section>
      </div>
    </div>
  );
}
