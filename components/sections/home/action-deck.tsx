"use client";

import { useMemo, useRef, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Headphones,
  HeartHandshake,
  Instagram as InstagramIcon,
  Play,
  Maximize2,
  Megaphone,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import type { Event, HeroCard, PrayerWallConfig, SocialPost } from "@/lib/types";
import type { HeroCandidate } from "@/lib/ranker";
import { pickHeroAndDeck } from "@/lib/ranker";
import { PrayerWallForm } from "@/components/shared/prayer-wall-form";
import { Lightbox } from "@/components/shared/lightbox";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — each candidate slot the deck can show
// ─────────────────────────────────────────────────────────────────────────────

type DeckItem =
  | {
      id: string;
      type: "event";
      title: string;
      date: Date;
      time?: string;
      location?: string;
      image?: string;
      pinned?: boolean;
      href?: string;
    }
  | {
      id: string;
      type: "instagram";
      title: string;
      postedAt: Date;
      image?: string;
      href: string;
      postType?: "reel" | "post";
      pinned?: boolean;
    }
  | {
      id: string;
      type: "facebook";
      title: string;
      postedAt: Date;
      image?: string;
      href: string;
      pinned?: boolean;
    }
  | {
      id: string;
      type: "prayer";
      title: string;
      updatedAt: Date;
      phase: "collect" | "show" | "paused";
      prayers?: string[];
      prayerObjects?: Array<{ text: string; submittedAt: string }>;
      pinned?: boolean;
    }
  | {
      id: string;
      type: "promo";
      title: string;
      image?: string;
      href?: string;
      pinned?: boolean;
      accentColor?: string;
      ctaText?: string;
    }
  | {
      id: string;
      type: "audio";
      title: string;
      audioUrl?: string;
      href?: string;
      pinned?: boolean;
    };

type DeckItemType = DeckItem["type"];

const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;

// ─────────────────────────────────────────────────────────────────────────────
// SCORING — see plan: event <24h +1000, promo +600, prayer <24h +400, IG decays
// ─────────────────────────────────────────────────────────────────────────────

function scoreItem(item: DeckItem, now = Date.now()): number {
  let score = 0;

  switch (item.type) {
    case "event": {
      const diff = item.date.getTime() - now;
      if (diff <= MS_DAY && diff > -2 * MS_HOUR) score += 1000;
      else if (diff <= 7 * MS_DAY && diff > 0) score += 300;
      else if (diff > 0) score += 50;
      break;
    }
    case "promo":
      score += 600;
      break;
    case "prayer": {
      const hoursSince = (now - item.updatedAt.getTime()) / MS_HOUR;
      if (hoursSince <= 24) score += 400;
      else score += 80;
      break;
    }
    case "instagram": {
      const hoursSince = (now - item.postedAt.getTime()) / MS_HOUR;
      score += Math.max(0, 200 - hoursSince);
      break;
    }
    case "facebook": {
      const hoursSince = (now - item.postedAt.getTime()) / MS_HOUR;
      score += Math.max(0, 180 - hoursSince);
      break;
    }
    case "audio":
      score += 60;
      break;
  }

  if (item.pinned) score += 2000;
  return score;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface ActionDeckProps {
  events: Event[];
  instagramUrl?: string;
  facebookUrl?: string;
  customHeroCard?: HeroCard | null;
  prayerWall?: PrayerWallConfig | null;
  socialPosts?: SocialPost[];
  now?: number;
}

function mapCandidateToDeckItem(
  candidate: HeroCandidate,
  prayerWall?: PrayerWallConfig | null,
  socialPosts?: SocialPost[],
): DeckItem | null {
  if (candidate.type === "custom") {
    return {
      id: `custom-${candidate.id}`,
      type: "promo",
      title: candidate.ctaText || "Novedad destacada",
      href: candidate.url,
      pinned: candidate.pinned,
      image: (candidate as any).media?.url,
      accentColor: candidate.accentColor,
      ctaText: candidate.ctaText,
    };
  }

  if (candidate.type === "prayer") {
    const selectedPrayers = prayerWall?.selectedPrayers ?? [];
    const prayerObjects = selectedPrayers
      .filter((prayer) => typeof prayer.text === "string" && prayer.text.length > 0)
      .slice(0, 6)
      .map((prayer) => ({
        text: prayer.text,
        submittedAt: prayer.submittedAt,
      }));

    return {
      id: `prayer-${candidate.id}`,
      type: "prayer",
      // When in 'show' phase we intentionally remove the active label (UI uses only the mini-carousel text),
      // and the ActionDeck will hide the CTA. When collecting, show the invite copy.
      title: candidate.phase === "show" ? "" : "Muro de oraciones · comparte tu petición",
      updatedAt: new Date(candidate.publishedAt),
      phase: candidate.phase,
      prayers: prayerObjects.map((prayer) => prayer.text),
      prayerObjects,
    };
  }

  if (candidate.type === "event") {
    return {
      id: `event-${candidate.id}`,
      type: "event",
      title: candidate.title,
      date: new Date(candidate.date),
      time: candidate.time,
      location: candidate.location,
      pinned: candidate.pinned,
    };
  }

  if (candidate.type === "social") {
    const post = socialPosts?.find((item) => item._id === candidate.id);
    const image = post?.media?.url;
    if (candidate.network === "instagram") {
      return {
        id: `ig-${candidate.id}`,
        type: "instagram",
        title: "Última publicación en Instagram",
        postedAt: new Date(candidate.postedAt),
        href: candidate.url,
        image,
      };
    }
    return {
      id: `fb-${candidate.id}`,
      type: "facebook",
      title: "Última publicación en Facebook",
      postedAt: new Date(candidate.postedAt),
      href: candidate.url,
      image,
    };
  }

  return null;
}

export function ActionDeck({
  events,
  instagramUrl,
  facebookUrl,
  customHeroCard,
  prayerWall,
  socialPosts,
  now: nowProp,
}: ActionDeckProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [thumbWidth, setThumbWidth] = useState(0);
  const [thumbLeft, setThumbLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Mobile scroll indicator state
  const [mobileScrollProgress, setMobileScrollProgress] = useState(0);
  const [mobileHasOverflow, setMobileHasOverflow] = useState(false);

  // Prayer modal open state (used when the deck's prayer card should open the submit modal)
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);

  const deck = useMemo<DeckItem[]>(() => {
    const now = typeof nowProp === "number" ? nowProp : Date.now();

    const rankingCandidates: HeroCandidate[] = [];

    if (customHeroCard?.media?.url) {
      rankingCandidates.push({
        type: "custom",
        id: customHeroCard._id,
        publishedAt: new Date(customHeroCard.publishedAt).getTime(),
        accentColor: customHeroCard.accentColor || "#2f5e93",
        media: {
          isVertical: Boolean(customHeroCard.media.isVertical),
          alt: customHeroCard.media.alt || "Contenido destacado",
          url: customHeroCard.media.url,
        },
        url: customHeroCard.url,
        ctaText: customHeroCard.ctaText,
        pinned: customHeroCard.pinned,
        priorityWeight: customHeroCard.priorityWeight,
      });
    }

    if (prayerWall && prayerWall.enabled && prayerWall.phase !== 'paused') {
      rankingCandidates.push({
        type: "prayer",
        id: prayerWall._id,
        phase: prayerWall.phase,
        publishedAt: new Date(prayerWall.publishedAt).getTime(),
        selectedPrayersCount: prayerWall.selectedPrayers?.length ?? 0,
      });
    }

    events.forEach((event) => {
      const diff = event.date.getTime() - now;
      // Only consider upcoming events within the next 5 days in the deck.
      // The broader event ranking priority still favors the 3-day window.
      if (diff < 0 || diff > 5 * MS_DAY) return;

      rankingCandidates.push({
        type: "event",
        id: event.id,
        date: event.date.getTime(),
        title: event.title,
        time: event.time,
        location: event.address || event.location,
        registrationEnabled: event.registrationEnabled,
        // include image so later mapping can render event thumbnails
        image: event.image,
      });
    });

    (socialPosts ?? []).forEach((post) => {
      rankingCandidates.push({
        type: "social",
        id: post._id,
        network: post.network,
        postedAt: new Date(post.postedAt).getTime(),
        url: post.url,
        caption: post.caption,
        media: post.media
          ? { isVertical: post.media.isVertical }
          : undefined,
      });
    });

    const { deck: rankedDeck } = pickHeroAndDeck(rankingCandidates, now);
    const rankedDeckItems = rankedDeck
      .map((candidate) => {
        const mapped = mapCandidateToDeckItem(candidate, prayerWall, socialPosts);
        // If this is an event, ensure we include the event image from the source events array
        if (mapped && mapped.type === "event") {
          const srcEvent = events.find((e) => e.id === candidate.id);
          if (srcEvent && srcEvent.image) {
            mapped.image = srcEvent.image;
          }
        }
        return mapped;
      })
      .filter((item): item is DeckItem => item !== null)
      .map((item) => {
        if (item.type !== "prayer") return item;
        return {
          ...item,
          prayers: item.prayers ?? [],
          prayerObjects: item.prayerObjects ?? [],
        };
      });

    const candidates = [...rankedDeckItems];

    const deduped = candidates.filter(
      (item, index, array) => array.findIndex((other) => other.id === item.id) === index,
    );

    return deduped
      .map((item) => ({ item, score: scoreItem(item, now) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((s) => s.item);
  }, [customHeroCard, prayerWall, socialPosts, events, nowProp]);

  // Update desktop scroll state and scrollbar thumb
  const updateScrollState = () => {
    const container = scrollContainerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < maxScroll - 5);

    // Calculate thumb size and position
    const trackWidth = track.clientWidth;
    const visibleRatio = clientWidth / scrollWidth;
    const newThumbWidth = Math.max(40, trackWidth * visibleRatio);
    const scrollRatio = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    const newThumbLeft = scrollRatio * (trackWidth - newThumbWidth);

    setThumbWidth(newThumbWidth);
    setThumbLeft(newThumbLeft);
  };

  // Update mobile scroll indicator
  const updateMobileScrollState = () => {
    const container = mobileScrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;
    
    setMobileHasOverflow(scrollWidth > clientWidth + 10);
    setMobileScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    const mobileContainer = mobileScrollRef.current;

    if (container) {
      updateScrollState();
      container.addEventListener("scroll", updateScrollState);
      window.addEventListener("resize", updateScrollState);
    }

    if (mobileContainer) {
      updateMobileScrollState();
      mobileContainer.addEventListener("scroll", updateMobileScrollState);
      window.addEventListener("resize", updateMobileScrollState);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", updateScrollState);
        window.removeEventListener("resize", updateScrollState);
      }
      if (mobileContainer) {
        mobileContainer.removeEventListener("scroll", updateMobileScrollState);
        window.removeEventListener("resize", updateMobileScrollState);
      }
    };
  }, [deck]);

  

  // Smooth scroll by a certain amount (for arrow clicks)
  const scrollBy = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 280; // Approximate card width + gap
    const scrollAmount = cardWidth * 3;

    container.scrollTo({
      left: container.scrollLeft + (direction === "right" ? scrollAmount : -scrollAmount),
      behavior: "smooth",
    });
  };

  const handleMobileArrow = (direction: "left" | "right") => {
    const container = mobileScrollRef.current;
    if (!container) return;
    const cardWidth = 280;
    const amount = cardWidth * 1.5;
    container.scrollTo({ left: container.scrollLeft + (direction === "right" ? amount : -amount), behavior: "smooth" });
  };

  // Handle thumb drag
  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startThumbLeft = thumbLeft;
    const track = trackRef.current;
    const container = scrollContainerRef.current;
    if (!track || !container) return;

    const trackWidth = track.clientWidth;
    const maxScroll = container.scrollWidth - container.clientWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newThumbLeft = Math.max(0, Math.min(trackWidth - thumbWidth, startThumbLeft + deltaX));
      const scrollRatio = newThumbLeft / (trackWidth - thumbWidth);
      container.scrollLeft = scrollRatio * maxScroll;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle track click (jump to position)
  const handleTrackClick = (e: React.MouseEvent) => {
    const track = trackRef.current;
    const container = scrollContainerRef.current;
    if (!track || !container) return;

    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const trackWidth = track.clientWidth;
    const maxScroll = container.scrollWidth - container.clientWidth;

    // Center the thumb on click position
    const targetThumbLeft = Math.max(0, Math.min(trackWidth - thumbWidth, clickX - thumbWidth / 2));
    const scrollRatio = targetThumbLeft / (trackWidth - thumbWidth);
    
    container.scrollTo({
      left: scrollRatio * maxScroll,
      behavior: "smooth",
    });
  };

  if (deck.length === 0) return null;

  return (
    <>
      <section
        aria-label="Acciones destacadas"
        className="w-full bg-gray-50 pt-6 md:pt-8 pb-8 md:pb-10"
      >
      <div className="flex items-center justify-between px-4 md:px-6 mb-2.5">
        <h2 className="text-[15px] mb-3 mt-3 font-bold uppercase tracking-[0.18em] text-[#425060]">
          Destacado para ti
        </h2>
        {/* Mobile only: swipe hint - hide if only one element */}
        {deck.length > 1 && (
          <span className="md:hidden text-[11px] text-[#8a96a4]">
            Desliza para ver más
          </span>
        )}
      </div>

      {/* Mobile: horizontal scroll with progress indicator */}
      <div className="md:hidden">
        <div className="relative">
          <div
            ref={mobileScrollRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-2"
            style={{
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
            role="list"
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {deck.map((item, idx) => (
              <DeckCard
                key={item.id}
                item={item}
                featured={idx === 0}
                deckLength={deck.length}
                prayerWall={prayerWall}
                onOpenPrayerModal={
                  item.type === "prayer" && item.phase === "collect"
                    ? () => setIsPrayerModalOpen(true)
                    : undefined
                }
              />
            ))}
          </div>

          {mobileHasOverflow && (
            <button
              onClick={() => handleMobileArrow("right")}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1 shadow-md"
              aria-label="Ver más elementos"
            >
              <ChevronRight className="h-5 w-5 text-[#425060]" />
            </button>
          )}
        </div>

        {/* Mobile scroll progress indicator */}
        {mobileHasOverflow && deck.length > 1 && (
          <div className="flex justify-center gap-1.5 pt-2 pb-1 px-4">
            {deck.map((item, idx) => (
              <div
                key={item.id}
                className={`h-1 rounded-full transition-all duration-200 ${
                  idx === Math.round(mobileScrollProgress * (deck.length - 1))
                    ? "w-4 bg-[#2f5e93]"
                    : "w-1.5 bg-[#d4dae2]"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: horizontal scroll with arrows and custom scrollbar */}
      <div className="hidden md:block relative">
        {/* Left arrow - inside bounds with full-height gradient fade */}
        {canScrollLeft && (
          <button
            onClick={() => scrollBy("left")}
            className="absolute left-0 top-0 z-10 flex items-center justify-center w-16 bg-gradient-to-r from-white via-white/90 to-transparent"
            style={{ height: "calc(100% - 24px)" }}
            aria-label="Ver elementos anteriores"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/[0.06] hover:bg-black/[0.10] transition-colors">
              <ChevronLeft className="h-5 w-5 text-[#425060]" />
            </div>
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-3 px-6"
          style={{
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
          role="list"
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {deck.map((item, idx) => (
            <DeckCard
              key={item.id}
              item={item}
              featured={idx === 0}
              isDesktop
              deckLength={deck.length}
              prayerWall={prayerWall}
              onOpenPrayerModal={
                item.type === "prayer" && item.phase === "collect"
                  ? () => setIsPrayerModalOpen(true)
                  : undefined
              }
            />
          ))}
        </div>

        {/* Right arrow - inside bounds with full-height gradient fade */}
        {canScrollRight && (
          <button
            onClick={() => scrollBy("right")}
            className="absolute right-0 top-0 z-10 flex items-center justify-center w-16 bg-gradient-to-l from-white via-white/90 to-transparent"
            style={{ height: "calc(100% - 24px)" }}
            aria-label="Ver más elementos"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/[0.06] hover:bg-black/[0.10] transition-colors">
              <ChevronRight className="h-5 w-5 text-[#425060]" />
            </div>
          </button>
        )}

        {/* Custom scrollbar track */}
        {deck.length > 3 && (
          <div
            ref={trackRef}
            onClick={handleTrackClick}
            className="relative h-1.5 bg-[#f0f2f5] rounded-full mx-6 cursor-pointer"
          >
            {/* Scrollbar thumb */}
            <div
              ref={thumbRef}
              onMouseDown={handleThumbMouseDown}
              className={`absolute top-0 h-full rounded-full transition-colors ${
                isDragging ? "bg-[#2f5e93]" : "bg-[#c5cdd6] hover:bg-[#9fb0c5]"
              }`}
              style={{
                width: `${thumbWidth}px`,
                left: `${thumbLeft}px`,
                cursor: isDragging ? "grabbing" : "grab",
              }}
            />
          </div>
        )}
      </div>

      {/* Decorative lines removed — keep the page-level separator below */}
      </section>

      {/* Prayer modal colocated here so deck can open it */}
      {prayerWall && (
        <PrayerWallForm
          isOpen={isPrayerModalOpen}
          onClose={() => setIsPrayerModalOpen(false)}
          isCollecting={prayerWall.phase === "collect"}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_META: Record<
  DeckItemType,
  { label: string; classes: string; icon: ReactNode }
> = {
  event: {
    label: "Evento",
    classes: "bg-[#2f5e93] text-white",
    icon: <Calendar className="h-3 w-3" aria-hidden="true" />,
  },
  instagram: {
    label: "Instagram",
    classes: "bg-[#f4edfa] text-[#6d49a8]",
    icon: <InstagramIcon className="h-3 w-3" aria-hidden="true" />,
  },
  facebook: {
    label: "Facebook",
    classes: "bg-[#e8f1ff] text-[#1b74e4]",
    icon: <Megaphone className="h-3 w-3" aria-hidden="true" />,
  },
  prayer: {
    label: "Oraciones",
    classes: "bg-[#e7f1ea] text-[#2d6a4f]",
    icon: <HeartHandshake className="h-3 w-3" aria-hidden="true" />,
  },
  promo: {
    label: "Novedad",
    classes: "bg-[#fef3c7] text-[#92400e]",
    icon: <Megaphone className="h-3 w-3" aria-hidden="true" />,
  },
  audio: {
    label: "Audio",
    classes: "bg-[#eef2ff] text-[#3730a3]",
    icon: <Headphones className="h-3 w-3" aria-hidden="true" />,
  },
};

const CTA_LABEL: Record<DeckItemType, string> = {
  event: "Ver evento",
  instagram: "Ver publicación",
  facebook: "Ver publicación",
  prayer: "Pedir oración",
  promo: "Ver más",
  audio: "Escuchar",
};

// Accent colors for the top line on each card to visually link sections
const ACCENT_COLORS: Record<DeckItemType, string> = {
  event: "#2f5e93",
  instagram: "#6d49a8",
  facebook: "#1b74e4",
  prayer: "#2d6a4f",
  promo: "#92400e",
  audio: "#3730a3",
};

function PrayerMiniCarousel({
  prayers,
  prayerObjects,
  deckLength = 1,
  isDesktop = false,
  onOpenModal,
}: {
  prayers: string[];
  prayerObjects?: Array<{ text: string; submittedAt: string }>;
  deckLength?: number;
  isDesktop?: boolean;
  onOpenModal?: (text: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [isSliding, setIsSliding] = useState(false);
  const [shouldTransition, setShouldTransition] = useState(false);

  // Truncate on both desktop and mobile when multiple deck items (deckLength > 1)
  const shouldTruncate = deckLength > 1;
  let charLimit = 85;
  if (prayers.length > 1) {
    const longCount = prayers.filter((p) => p.length >= 85).length;
    if (longCount >= 2) charLimit = 84;
  }

  useEffect(() => {
    if (prayers.length <= 1) return;
    const interval = window.setInterval(() => {
      setShouldTransition(true);
      setIsSliding(true);
      setNextIndex((idx) => (idx === null ? (index + 1) % prayers.length : idx));

      const completeTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % prayers.length);
        setNextIndex(null);
        setShouldTransition(false);

        const resetTimer = window.setTimeout(() => setIsSliding(false), 16);
        return () => window.clearTimeout(resetTimer);
      }, 450);

      return () => window.clearTimeout(completeTimer);
    }, 10000);

    return () => window.clearInterval(interval);
  }, [prayers, index]);

  if (prayers.length === 0) {
    return (
      <p className="text-[12px] text-[#5b6876] mb-2">La comunidad está orando · únete</p>
    );
  }

  const currentPrayer = prayers[index];
  const nextPrayer = prayers[(index + 1) % prayers.length];
  const isTruncated = shouldTruncate && currentPrayer.length > charLimit;
  const displayText = isTruncated ? currentPrayer.substring(0, charLimit) + "..." : currentPrayer;
  const nextIsTruncated = shouldTruncate && nextPrayer.length > charLimit;
  const nextDisplayText = nextIsTruncated ? nextPrayer.substring(0, charLimit) + "..." : nextPrayer;

  const textSize = isDesktop && deckLength === 1 ? "text-[16px]" : "text-[18px]";
  const textAlign = isDesktop ? "text-center" : "text-justify";
  const itemsAlign = isDesktop ? "items-center" : "items-start";
  const minHeight = isDesktop && deckLength === 1 ? "min-h-[100px]" : "min-h-[80px]";
  const padding = isDesktop && deckLength === 1 ? "p-4" : "p-3";
  const actionSlotHeight = "h-[26px]";

  const translateAmount = isSliding && nextIndex !== null ? -100 : 0;

  return (
    <div className="mb-3">
      <div className="relative overflow-hidden rounded-[3px] bg-[#f5f9f7] border border-[#d4e8e0]" style={{ minHeight: deckLength > 1 ? minHeight : undefined }}>
        <div className={`${shouldTransition ? "transition-transform duration-450 ease-out" : ""} flex`} style={{ transform: `translateX(${translateAmount}%)` }}>
          <div className={`w-full flex-shrink-0 ${padding} ${minHeight} flex flex-col ${itemsAlign} justify-between`}>
            <p className={`${textSize} text-[#1f2833] italic leading-relaxed ${textAlign}`}>"{displayText}"</p>
            <div className={`${actionSlotHeight} flex items-center justify-center`}>
              {isTruncated && onOpenModal ? (
                <button onClick={() => onOpenModal(currentPrayer)} className="text-[12px] text-[#2d6a4f] hover:text-[#1f4d39] font-semibold underline transition-colors">
                  Ver más
                </button>
              ) : (
                <span className="invisible text-[12px] font-semibold underline">Ver más</span>
              )}
            </div>
          </div>

          {prayers.length > 1 && (
            <div className={`w-full flex-shrink-0 ${padding} ${minHeight} flex flex-col ${itemsAlign} justify-between`}>
              <p className={`${textSize} text-[#1f2833] italic leading-relaxed ${textAlign}`}>"{nextDisplayText}"</p>
              <div className={`${actionSlotHeight} flex items-center justify-center`}>
                <span className="invisible text-[12px] font-semibold underline">Ver más</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {prayers.length > 1 && (
        <div className="flex items-center gap-1 justify-center mt-1.5">
          {prayers.map((_, idx) => (
            <span key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === index ? "w-2 bg-[#2d6a4f]" : "w-1 bg-[#bfd6c7]"}`} aria-label={`Oración ${idx + 1} de ${prayers.length}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function DeckCard({
  item,
  featured,
  isDesktop = false,
  deckLength = 1,
  prayerWall,
  onOpenPrayerModal,
}: {
  item: DeckItem;
  featured: boolean;
  isDesktop?: boolean;
  deckLength?: number;
  prayerWall?: PrayerWallConfig | null;
  onOpenPrayerModal?: () => void;
}) {
  const [showFullPrayerModal, setShowFullPrayerModal] = useState(false);
  const [fullPrayerText, setFullPrayerText] = useState("");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Determine width based on type, deck length, and device
  let widthClass = "";
  if (isDesktop) {
    // Desktop: if only prayer and it's the only element, make it full width
    if (item.type === "prayer" && deckLength === 1) {
      widthClass = "w-full shrink-0"; // Full width for single prayer
    } else {
      widthClass = "w-[260px] shrink-0";
    }
  } else {
    // Mobile: if only one element, full width; otherwise normal
    if (deckLength === 1) {
      widthClass = "w-full min-w-[calc(100vw-32px)] shrink-0"; // Force full width for single element
    } else {
      widthClass = featured
         ? "w-[85vw] shrink-0"
         : "w-[78vw] shrink-0";
    }
  }

  const imageHeight = featured && !isDesktop ? "h-28" : "h-24";

  const image =
    (item.type === "event" || item.type === "instagram" || item.type === "promo" || item.type === "facebook") &&
    "image" in item
      ? item.image
      : undefined;

  const href = "href" in item ? item.href : undefined;
  const badge = BADGE_META[item.type];
  const prayerDate =
    item.type === "prayer" && item.phase === "show" && item.prayerObjects?.[0]?.submittedAt
      ? formatPrayerDate(item.prayerObjects[0].submittedAt)
      : null;

  const inner = (
    <article
      className={[
        "snap-center relative overflow-hidden flex flex-col",
        "bg-white border border-[#dce2e9] rounded-[3px]",
        "hover:border-[#9fb0c5] hover:shadow-[0_2px_10px_rgba(47,94,147,0.08)] transition-all",
        widthClass,
      ].join(" ")}
    >
      {/* Top accent line to match 'Próximo evento' cards */}
      <div
        className="w-full h-1 rounded-t-[3px]"
        style={{ backgroundColor: item.type === "promo" && item.accentColor ? item.accentColor : ACCENT_COLORS[item.type] }}
        aria-hidden="true"
      />
      {image ? (
        <div className={`relative w-full ${item.type === "promo" ? "flex-1 min-h-[160px] md:min-h-[180px]" : imageHeight} bg-[#f1f1f1] group cursor-pointer`}>
          <Image
            src={image}
            alt={item.title}
            fill
            sizes={isDesktop ? "260px" : "(max-width: 768px) 80vw, 360px"}
            className={item.type === "promo" ? "object-contain" : "object-cover"}
          />

          {/* Clickable overlay for entire image - opens lightbox */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            className="absolute inset-0 z-10 bg-transparent cursor-pointer hover:bg-black/[0.02] transition-colors"
            aria-label="Ver imagen en pantalla completa"
          />

          {/* Overlay magnifier / open lightbox - desktop only hover */}
          <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 rounded-full p-2 pointer-events-auto flex items-center justify-center">
              <Maximize2 className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
          </div>

          {item.type === "instagram" && item.postType === "reel" && (
            <div className="absolute top-2 right-2 bg-black/55 rounded-full h-6 w-6 flex items-center justify-center">
              <Play className="h-3 w-3 text-white" fill="white" />
            </div>
          )}

          {/* Promo Expand Badge - mobile only */}
          {item.type === "promo" && (
            <div
              className="md:hidden pointer-events-none absolute bottom-2 right-2 inline-flex items-center justify-center rounded-[6px] border border-white/10 bg-black/45 p-2 text-white shadow-[0_1px_2px_rgba(0,0,0,0.18)] backdrop-blur-[8px]"
              aria-hidden="true"
            >
              <Maximize2 className="h-4 w-4" />
            </div>
          )}
        </div>
      ) : null}

      <div className={`flex flex-col ${item.type === "promo" ? "p-3" : "flex-1 p-3"}`}>
        {item.type !== "promo" && (
          <>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-[0.08em] ${badge.classes}`}
              >
                {badge.icon}
                {badge.label}
              </span>
              {prayerDate && (
                <span className="rounded-sm bg-[#4a5568] px-2 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm whitespace-nowrap">
                  {prayerDate}
                </span>
              )}
            </div>

            <h3
              className={`font-bold text-[#1f2833] leading-snug line-clamp-2 mb-1.5 ${
                featured && !isDesktop ? "text-[15px]" : "text-[13px]"
              }`}
            >
              {item.title}
            </h3>
          </>
        )}

        {item.type === "event" && (
          <div className="space-y-0.5 mb-2">
            <p className="text-[12px] text-[#5b6876] flex items-center gap-1.5">
              <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
              {formatEventDate(item.date)}
              {item.time ? ` · ${item.time}` : ""}
            </p>
            {item.location && (
              <p className="text-[12px] text-[#5b6876] flex items-center gap-1.5 min-w-0">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.location}</span>
              </p>
            )}
          </div>
        )}

        {item.type === "instagram" && (
          <p className="text-[12px] text-[#5b6876] mb-2">
            @mgrregionmayo · hace{" "}
            {Math.max(
              1,
              Math.round((Date.now() - item.postedAt.getTime()) / MS_HOUR),
            )}
            h
          </p>
        )}

        {item.type === "prayer" && item.phase === "show" && (
          <PrayerMiniCarousel
            prayers={item.prayers ?? []}
            prayerObjects={item.prayerObjects ?? []}
            deckLength={deckLength}
            isDesktop={isDesktop}
            onOpenModal={(text) => {
              setFullPrayerText(text);
              setShowFullPrayerModal(true);
            }}
          />
        )}

        {item.type === "audio" && (
          <p className="text-[12px] text-[#5b6876] mb-2">Cápsula de audio</p>
        )}

        {/* Footer / CTA: hide CTA for prayer when in 'show' phase */}
        {!(item.type === "prayer" && item.phase === "show") && (
          <div className={`${item.type === "promo" ? "" : "mt-auto pt-1"}`}>
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                item.type === "prayer" && item.phase === "collect"
                  ? "text-[17px] text-[#2d6a4f]" // Larger text for collect prayer CTA
                  : featured && !isDesktop
                    ? "text-[12px] text-[#2f5e93]"
                    : "text-[12px] text-[#425060]"
              }`}
              style={item.type === "promo" && item.accentColor ? { color: item.accentColor } : undefined}
            >
              {item.type === "promo" && item.ctaText ? item.ctaText : CTA_LABEL[item.type]}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </div>
        )}
      </div>
    </article>
  );

  // Determine wrapper deterministically based on item type and properties
  let wrapper: ReactNode;
  
  if (item.type === "prayer") {
    // Prayer items: button only when collecting with callback, otherwise unwrapped
    if (item.phase === "collect" && onOpenPrayerModal) {
      wrapper = (
        <button
          type="button"
          onClick={onOpenPrayerModal}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93] rounded-[3px] w-full text-left"
          aria-label={`${BADGE_META[item.type].label}: ${item.title || "Oraciones"}`}
        >
          {inner}
        </button>
      );
    } else {
      wrapper = inner;
    }
  } else if (href && href.startsWith("http")) {
    // External links as <a> tags
    wrapper = (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93] rounded-[3px]"
        aria-label={`${BADGE_META[item.type].label}: ${item.title}`}
      >
        {inner}
      </a>
    );
  } else if (href) {
    // Internal links as Next Link
    wrapper = (
      <Link
        href={href}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93] rounded-[3px]"
        aria-label={`${BADGE_META[item.type].label}: ${item.title}`}
      >
        {inner}
      </Link>
    );
  } else {
    // No link: unwrapped article
    wrapper = inner;
  }

  return (
    <>
      <div role="listitem" className="block">
        {wrapper}
      </div>

      {/* Lightbox for card images */}
      {isLightboxOpen && image && (
        <Lightbox src={image} alt={item.title} onClose={() => setIsLightboxOpen(false)} />
      )}
      
      {/* Full prayer text modal for long prayers */}
      {showFullPrayerModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullPrayerModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-6 max-h-[80vh] overflow-y-auto shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#1f2833]">Oración completa</h3>
              <button
                onClick={() => setShowFullPrayerModal(false)}
                className="text-[#8a96a4] hover:text-[#425060] transition-colors"
                aria-label="Cerrar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-[14px] text-[#1f2833] italic leading-relaxed">
              "{fullPrayerText}"
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatEventDate(date: Date) {
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
  return `${days[date.getUTCDay()]}, ${date.getUTCDate()} ${months[date.getUTCMonth()]}`;
}

function formatPrayerDate(submittedAt: string) {
  const date = new Date(submittedAt);
  if (Number.isNaN(date.getTime())) return null;

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return `${date.getUTCDate()} de ${months[date.getUTCMonth()]}`;
}
