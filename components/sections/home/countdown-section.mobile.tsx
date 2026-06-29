"use client";

// Donde: home mobile, bloque destacado antes del calendario. Viewports: mobile. Funcion: muestra evento/aviso/oracion/social destacado y acciones principales.
import { useMemo, useState, useEffect } from "react";
import { Newsreader } from "next/font/google";
import { PrayerWallForm } from "@/components/shared/prayer-wall-form";
import { HeroDebugPanel } from "./hero-debug-panel";
import { Lightbox } from "@/components/shared/lightbox";
import { buildEventShareText, getEventMapsUrl } from "@/lib/event-share-text";
import type {
  Event,
  HeroCard,
  PrayerWallConfig,
  SocialPost,
} from "@/lib/types";
import type { HeroCandidate } from "@/lib/ranker";
import { pickHeroAndDeck, getAccentColor } from "@/lib/ranker";
import { useTime } from "@/lib/time-context";
import { getAlbumSharingEvents } from "@/lib/countdown-utils";
import { MobilePrayerSpotlightCard } from "@/components/sections/home/countdown-section/mobile-prayer-spotlight-card";
import { ShareFallbackModal } from "@/components/sections/home/countdown-section/share-fallback-modal";
import {
  AlbumSharingCard,
  CountdownCustomSpotlightCard,
  CountdownEventSpotlightCard,
  CountdownSocialSpotlightCard,
} from "@/components/sections/home/countdown-section/countdown-spotlight-cards";
import {
  CUSTOM_BANNER_ACCENT,
  canUseNativeShare,
  getCountdownDisplay,
  getRegionDateKey,
  getRegionDayEndMs,
  type CountdownDisplay,
  type CountdownOccurrence,
} from "@/components/sections/home/countdown-section/countdown-utils";

interface CountdownSectionProps {
  events: Event[];
  onRegister?: (event: Event) => void;
  customHeroCard?: HeroCard | null;
  prayerWall?: PrayerWallConfig | null;
  socialPosts?: SocialPost[];
  instagramUrl?: string;
  facebookUrl?: string;
}

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

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
  const [isPlacePhotoOpen, setIsPlacePhotoOpen] = useState(false);
  const [isShareFallbackOpen, setIsShareFallbackOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

    if (prayerWall && prayerWall.enabled && prayerWall.phase !== "paused") {
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
      );

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
  const spotlightAccent = spotlightHero
    ? getAccentColor(spotlightHero)
    : "#2f5e93";

  const countdownEvent = useMemo(() => {
    if (!spotlightHero || spotlightHero.type !== "event") return null;
    return events.find((event) => event.id === spotlightHero.id) ?? null;
  }, [spotlightHero, events]);
  const eventHighlightUrl = useMemo(() => {
    if (!isMounted || !countdownEvent) return "";
    return "igcmayo.com";
  }, [countdownEvent, isMounted]);
  const countdownShareText = useMemo(() => {
    if (!countdownEvent || !eventHighlightUrl) return "";
    return buildEventShareText(countdownEvent, eventHighlightUrl);
  }, [countdownEvent, eventHighlightUrl]);
  const countdownSchedule = useMemo<CountdownOccurrence[]>(() => {
    if (!countdownEvent) return [];
    const schedule =
      Array.isArray(countdownEvent.schedule) &&
      countdownEvent.schedule.length > 0
        ? countdownEvent.schedule
        : [{ date: countdownEvent.date, time: countdownEvent.time }];

    return [...schedule].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [countdownEvent]);
  const countdownDisplay = useMemo<CountdownDisplay | null>(() => {
    if (!countdownEvent || countdownSchedule.length === 0) return null;

    const nowMs = currentTime.getTime();
    const firstOccurrence = countdownSchedule[0];
    const currentDayKey = getRegionDateKey(currentTime);
    const todayOccurrences = countdownSchedule.filter(
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
  }, [countdownEvent, countdownSchedule, currentTime]);
  const spotlightSocialPost = useMemo(() => {
    if (!spotlightHero || spotlightHero.type !== "social") return null;
    return (
      (socialPosts ?? []).find((post) => post._id === spotlightHero.id) ?? null
    );
  }, [spotlightHero, socialPosts]);
  const albumEvents = useMemo(
    () => getAlbumSharingEvents(events, currentTime),
    [events, currentTime],
  );

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

  const openGoogleMaps = (url: string) => {
    window.open(url, "_blank");
  };

  const handleShare = async () => {
    if (!countdownEvent) return;

    const shareData = {
      title: countdownEvent.title,
      text: countdownShareText,
    };

    if (canUseNativeShare()) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fall through to the gray fallback modal.
      }
    }

    setIsShareFallbackOpen(true);
  };

  const countdownIsDisabled = countdownDisplay?.isDisabled ?? false;
  const countdownGridClassName = countdownIsDisabled
    ? "opacity-60 saturate-0"
    : "";
  const countdownMapsUrl = countdownEvent
    ? getEventMapsUrl(countdownEvent)
    : "";
  const countdownPlacePhotoUrl =
    countdownEvent?.moreInfo?.enabled && countdownEvent.moreInfo.imageUrl
      ? countdownEvent.moreInfo.imageUrl
      : "";

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
      className="pt-10 pb-8.5 bg-paper px-2 pb-0 mb-0"
      data-countdown-section
      aria-label="Sección destacada"
    >
      <div className="max-w mx-auto w-full space-y-4">
        {/* Spotlight: event */}
        {countdownEvent && countdownDisplay && (
          <CountdownEventSpotlightCard
            event={countdownEvent}
            schedule={countdownSchedule}
            countdownDisplay={countdownDisplay}
            countdownIsDisabled={countdownIsDisabled}
            countdownGridClassName={countdownGridClassName}
            mapsUrl={countdownMapsUrl}
            placePhotoUrl={countdownPlacePhotoUrl}
            canRegister={canRegisterCountdownEvent}
            canShare={Boolean(countdownShareText)}
            accentColor={spotlightAccent}
            editorialFontClassName={editorialFont.className}
            onOpenMaps={openGoogleMaps}
            onOpenPlacePhoto={() => setIsPlacePhotoOpen(true)}
            onShare={handleShare}
            onRegister={onRegister}
          />
        )}

        {/* Spotlight: custom media */}
        {showCustomCard && customHeroCard && (
          <CountdownCustomSpotlightCard
            card={customHeroCard}
            isLightboxOpen={isLightboxOpen}
            onOpenLightbox={() => setIsLightboxOpen(true)}
            onCloseLightbox={() => setIsLightboxOpen(false)}
          />
        )}

        {/* Spotlight: social */}
        {showSocialCard && spotlightHero && spotlightHero.type === "social" && (
          <CountdownSocialSpotlightCard
            hero={spotlightHero}
            post={spotlightSocialPost}
            accentColor={spotlightAccent}
          />
        )}

        {/* Spotlight: prayer collect */}
        {showPrayerCollectCard && (
          <MobilePrayerSpotlightCard
            mode="collect"
            editorialFontClassName={editorialFont.className}
            onCollect={() => setIsPrayerModalOpen(true)}
          />
        )}

        {/* Spotlight: prayer show */}
        {showPrayerDisplayCard && prayerWall && (
          <MobilePrayerSpotlightCard
            mode="show"
            prayers={prayerWall.selectedPrayers}
            editorialFontClassName={editorialFont.className}
          />
        )}

        {/* ── Album sharing cards (post-event) ── */}
        {albumEvents.map((event) => (
          <AlbumSharingCard
            key={event.id}
            event={event}
            editorialFontClassName={editorialFont.className}
          />
        ))}
      </div>

      <ShareFallbackModal
        isOpen={isShareFallbackOpen}
        title={countdownEvent?.title ?? "Evento"}
        shareText={countdownShareText}
        onClose={() => setIsShareFallbackOpen(false)}
      />

      {isPlacePhotoOpen && countdownPlacePhotoUrl && (
        <Lightbox
          src={countdownPlacePhotoUrl}
          alt={`Foto del lugar de ${countdownEvent?.title ?? "evento"}`}
          onClose={() => setIsPlacePhotoOpen(false)}
        />
      )}

      <PrayerWallForm
        isOpen={isPrayerModalOpen}
        onClose={() => setIsPrayerModalOpen(false)}
        isCollecting={prayerWall?.phase === "collect"}
      />

      <HeroDebugPanel />
    </section>
  );
}
