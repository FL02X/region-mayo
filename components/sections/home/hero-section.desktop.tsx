"use client";

// Donde: home, hero superior desktop. 
// Viewports: desktop. 
// Funcion: muestra carousel, spotlight elegido por ranking y CTA hacia calendario.
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Newsreader, Playfair_Display } from "next/font/google";
import {
  ChevronDown,
} from "lucide-react";
import { RegistrationModal } from "@/components/shared/registration-modal";
import { PrayerWallForm } from "@/components/shared/prayer-wall-form";
import { HeroDebugPanel } from "./hero-debug-panel";
import { buildEventShareText, getEventMapsUrl } from "@/lib/event-share-text";
import { useTime } from "@/lib/time-context";
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
import {
  CUSTOM_BANNER_ACCENT,
  getCountdownDisplay,
  getRegionDateKey,
  getRegionDayEndMs,
  type CountdownDisplay,
  type CountdownOccurrence,
} from "@/components/sections/home/hero-section/desktop-hero-utils";
import { canUseNativeShare } from "@/components/sections/home/countdown-section/countdown-utils";
import { HeroPrayerCard } from "@/components/sections/home/hero-section/desktop-prayer-card";
import {
  DesktopCustomSpotlightCard,
  DesktopEventSpotlightCard,
  DesktopSocialSpotlightCard,
} from "@/components/sections/home/hero-section/countdown-card.desktop";
import { ShareFallbackModal } from "@/components/sections/home/countdown-section/share-fallback-modal";

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
  const [isShareFallbackOpen, setIsShareFallbackOpen] = useState(false);
  const { currentTime } = useTime();
  const spotlightCandidates = useMemo<HeroCandidate[]>(() => {
    const nowMs = currentTime.getTime();
    const currentDayKey = getRegionDateKey(currentTime);
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
      const eventSchedule =
        Array.isArray(event.schedule) && event.schedule.length > 0
          ? event.schedule
          : [{ date: event.date, time: event.time }];

      eventSchedule.forEach((occurrence) => {
        const occurrenceMs = occurrence.date.getTime();
        const candidateDateMs =
          occurrenceMs <= nowMs &&
          getRegionDateKey(occurrence.date) === currentDayKey
            ? getRegionDayEndMs(occurrence.date)
            : occurrenceMs;

        candidates.push({
          type: "event",
          id: event.id,
          title: event.title,
          date: candidateDateMs,
          time: occurrence.time,
          location: event.location,
          address: event.address,
          registrationEnabled: event.registrationEnabled,
        });
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
  const spotlightEventUrl = useMemo(() => {
    if (!isDesktop || !spotlightEvent) return "";
    return "igcmayo.com";
  }, [isDesktop, spotlightEvent]);
  const spotlightEventShareText = useMemo(() => {
    if (!spotlightEvent || !spotlightEventUrl) return "";
    return buildEventShareText(spotlightEvent, spotlightEventUrl);
  }, [spotlightEvent, spotlightEventUrl]);
  const spotlightSocialPost = useMemo(() => {
    if (!spotlightHero || spotlightHero.type !== "social") return null;
    return (socialPosts ?? []).find((post) => post._id === spotlightHero.id) ?? null;
  }, [spotlightHero, socialPosts]);

  const spotlightEventSchedule = useMemo<CountdownOccurrence[]>(() => {
    if (!spotlightEvent) return [];
    const schedule =
      Array.isArray(spotlightEvent.schedule) && spotlightEvent.schedule.length > 0
        ? spotlightEvent.schedule
        : [{ date: spotlightEvent.date, time: spotlightEvent.time }];

    return [...schedule].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [spotlightEvent]);
  const countdownDisplay = useMemo<CountdownDisplay | null>(() => {
    if (!spotlightEvent || spotlightEventSchedule.length === 0) return null;

    const nowMs = currentTime.getTime();
    const firstOccurrence = spotlightEventSchedule[0];
    const currentDayKey = getRegionDateKey(currentTime);
    const todayOccurrences = spotlightEventSchedule.filter(
      (occurrence) => getRegionDateKey(occurrence.date) === currentDayKey,
    );
    const nextTodayOccurrence = todayOccurrences.find(
      (occurrence) => occurrence.date.getTime() > nowMs,
    );

    if (nowMs < firstOccurrence.date.getTime()) {
      return getCountdownDisplay(firstOccurrence.date, currentTime);
    }

    if (nextTodayOccurrence) {
      return getCountdownDisplay(nextTodayOccurrence.date, currentTime);
    }

    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isDisabled: true,
    };
  }, [spotlightEvent, spotlightEventSchedule, currentTime]);

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

  const countdownIsDisabled = countdownDisplay?.isDisabled ?? false;
  const spotlightEventMapsUrl = spotlightEvent ? getEventMapsUrl(spotlightEvent) : "";
  const handleShareSpotlightEvent = async () => {
    if (!spotlightEvent) return;

    const shareData = {
      title: spotlightEvent.title,
      text: spotlightEventShareText,
    };

    if (canUseNativeShare()) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fall through to the fallback modal.
      }
    }

    setIsShareFallbackOpen(true);
  };

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
    <div className="w-full relative bg-[#f1f1f1]"> {/* 950px */}
      <div className="desktop-content-pane max-w-[1150px] mx-auto bg-paper md:border-x border-border">
        <section
          className="relative overflow-hidden h-[min(60vh,480px)] md:h-auto md:min-h-[420px]"
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

          <div className="relative z-10 flex min-h-[min(60vh,480px)] items-center px-5 py-[44px] md:min-h-[420px] md:px-10 lg:px-16">
            <div className="grid w-full items-center gap-8 md:grid-cols-[minmax(350px,1.15fr)_minmax(220px,0.85fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
              <div className="hidden min-w-0 md:block">
                {spotlightEvent && (
                  <DesktopEventSpotlightCard
                    event={spotlightEvent}
                    schedule={spotlightEventSchedule}
                    accentColor={spotlightAccent}
                    countdownDisplay={countdownDisplay}
                    countdownIsDisabled={countdownIsDisabled}
                    mapsUrl={spotlightEventMapsUrl}
                    canShare={Boolean(spotlightEventShareText)}
                    onOpenMaps={() => window.open(spotlightEventMapsUrl, "_blank")}
                    onShare={handleShareSpotlightEvent}
                    onRegister={() => setIsRegisterModalOpen(true)}
                  />
                )}

                {showCustomCard && customHeroCard && (
                  <DesktopCustomSpotlightCard
                    card={customHeroCard}
                    isLightboxOpen={isLightboxOpen}
                    onOpenLightbox={() => setIsLightboxOpen(true)}
                    onCloseLightbox={() => setIsLightboxOpen(false)}
                  />
                )}

                {showSocialCard && spotlightHero && spotlightHero.type === "social" && (
                  <DesktopSocialSpotlightCard
                    hero={spotlightHero}
                    post={spotlightSocialPost}
                    accentColor={spotlightAccent}
                  />
                )}

                {showPrayerCollectCard && (
                  <HeroPrayerCard
                    mode="collect"
                    editorialFontClassName={editorialFont.className}
                    onCollect={() => setIsPrayerModalOpen(true)}
                  />
                )}

                {showPrayerDisplayCard && prayerWall && (
                  <HeroPrayerCard
                    mode="show"
                    prayers={prayerWall.selectedPrayers}
                    editorialFontClassName={editorialFont.className}
                  />
                )}
              </div>

              <div className="flex w-full min-w-0 max-w-[390px] flex-col justify-center text-center md:text-left">
                <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-white/95 lg:text-[11px] lg:tracking-[0.24em]">
                  Iglesia Gentil de Cristo
                </p>
                <h1 className={`${heroTitleFont.className} mb-5 text-[clamp(2.25rem,4.1vw,3rem)] leading-[1.08] tracking-[0.01em] text-white [text-shadow:0_3px_16px_rgba(0,0,0,0.45)] lg:text-[3rem]`}>
                  <span className="block">Sitio oficial de la</span>
                  <span className="font-normal">Región Mayo</span>
                </h1>
                <button
                  onClick={scrollToContent}
                  className="group flex w-fit items-center justify-start gap-2 py-3 text-[16px] font-semibold text-white/90 opacity-75 transition-colors hover:text-white lg:text-[18px] hover:bg-brand-hover"
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

          <ShareFallbackModal
            isOpen={isShareFallbackOpen}
            title={spotlightEvent?.title ?? "Evento"}
            shareText={spotlightEventShareText}
            onClose={() => setIsShareFallbackOpen(false)}
          />

          <HeroDebugPanel />
        </section>
      </div>
    </div>
  );
}
