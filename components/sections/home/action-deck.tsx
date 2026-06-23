"use client";

// Donde: home, debajo del hero en desktop y dentro del calendario en mobile. Viewports: desktop y mobile. Funcion: muestra tarjetas destacadas de eventos, avisos, redes y oraciones.
import { useMemo, useRef, useEffect, useState, useCallback, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Newsreader } from "next/font/google";
import {
  Calendar,
  MapPin,
  Play,
  Maximize2,
  Megaphone,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { PrayerWallForm } from "@/components/shared/prayer-wall-form";
import { Lightbox } from "@/components/shared/lightbox";
import useLockBodyScroll from "@/hooks/use-lock-scroll";
import { BADGE_META, CTA_LABEL } from "@/components/sections/home/action-deck/action-deck-copy";
import { PrayerMiniCarousel } from "@/components/sections/home/action-deck/prayer-mini-carousel";
import { SocialVideoModal } from "@/components/sections/home/action-deck/social-video-modal";
import type {
  ActionDeckProps,
  DeckItem,
} from "@/components/sections/home/action-deck/action-deck-types";
import {
  MS_HOUR,
  buildActionDeck,
  formatEventDate,
  formatPrayerDate,
} from "@/components/sections/home/action-deck/action-deck-utils";

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

export function ActionDeck({
  events,
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
  const [mobileCanScrollLeft, setMobileCanScrollLeft] = useState(false);
  const [mobileCanScrollRight, setMobileCanScrollRight] = useState(false);

  // Prayer modal open state (used when the deck's prayer card should open the submit modal)
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);

  const deck = useMemo<DeckItem[]>(() => {
    const now = typeof nowProp === "number" ? nowProp : Date.now();

    return buildActionDeck({
      events,
      customHeroCard,
      prayerWall,
      socialPosts,
      now,
    });
  }, [customHeroCard, prayerWall, socialPosts, events, nowProp]);
  // Update desktop scroll state and scrollbar thumb
  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    const track = trackRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < maxScroll - 5);
    if (!track || maxScroll <= 0) {
      setThumbWidth(0);
      setThumbLeft(0);
      return;
    }

    // Calculate thumb size and position
    const trackWidth = track.clientWidth;
    const visibleRatio = clientWidth / scrollWidth;
    const newThumbWidth = Math.max(40, trackWidth * visibleRatio);
    const scrollRatio = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    const newThumbLeft = scrollRatio * (trackWidth - newThumbWidth);

    setThumbWidth(newThumbWidth);
    setThumbLeft(newThumbLeft);
  }, []);

  // Update mobile scroll indicator
  const updateMobileScrollState = useCallback(() => {
    const container = mobileScrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;
    
    setMobileHasOverflow(scrollWidth > clientWidth + 10);
    setMobileCanScrollLeft(scrollLeft > 5);
    setMobileCanScrollRight(scrollLeft < maxScroll - 5);
    setMobileScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
  }, []);

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
  }, [deck, updateMobileScrollState, updateScrollState]);

  

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
    window.setTimeout(updateScrollState, 280);
  };

  const handleMobileArrow = (direction: "left" | "right") => {
    const container = mobileScrollRef.current;
    if (!container) return;
    const cardWidth = 280;
    const amount = cardWidth * 1.5;
    container.scrollTo({ left: container.scrollLeft + (direction === "right" ? amount : -amount), behavior: "smooth" });
    window.setTimeout(updateMobileScrollState, 280);
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
        className="w-full bg-[#fffefa] md:pt-8 pb-8 md:pb-10"
      >
      <div className="flex items-center justify-between px-4 md:px-6 mb-2.5">
        <h2 className="type-system text-[15px] mb-3 mt-3 font-bold uppercase tracking-[0.18em]">
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
                onOpenPrayerModal={
                  item.type === "prayer" && item.phase === "collect"
                    ? () => setIsPrayerModalOpen(true)
                    : undefined
                }
              />
            ))}
          </div>

          {mobileHasOverflow && mobileCanScrollLeft && (
            <button
              onClick={() => handleMobileArrow("left")}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1"
              aria-label="Ver elementos anteriores"
            >
              <ChevronLeft className="h-5 w-5 text-[#425060]" />
            </button>
          )}

          {mobileHasOverflow && mobileCanScrollRight && (
            <button
              onClick={() => handleMobileArrow("right")}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1"
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
              onOpenPrayerModal={
                item.type === "prayer" && item.phase === "collect"
                  ? () => setIsPrayerModalOpen(true)
                  : undefined
              }
            />
          ))}
        </div>

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

        {deck.length > 3 && (
          <div
            ref={trackRef}
            onClick={handleTrackClick}
            className="relative h-1.5 bg-[#f0f2f5] rounded-full mx-6 cursor-pointer"
          >
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

function DeckCard({
  item,
  featured,
  isDesktop = false,
  deckLength = 1,
  onOpenPrayerModal,
}: {
  item: DeckItem;
  featured: boolean;
  isDesktop?: boolean;
  deckLength?: number;
  onOpenPrayerModal?: () => void;
}) {
  const [showFullPrayerModal, setShowFullPrayerModal] = useState(false);
  const [fullPrayerText, setFullPrayerText] = useState("");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isSocialPlayerOpen, setIsSocialPlayerOpen] = useState(false);

  useLockBodyScroll(showFullPrayerModal);

  const cardFrameClass = isDesktop
    ? "w-[260px] h-[270px] shrink-0"
    : deckLength === 1
      ? "w-full min-w-[calc(100vw-32px)] h-[284px] shrink-0"
      : "w-[82vw] h-[284px] shrink-0";

  const imageHeight =
    item.type === "instagram" || item.type === "facebook"
      ? "h-[154px]"
      : isDesktop
        ? "h-[104px]"
        : "h-[96px]";

  const image =
    (item.type === "event" || item.type === "instagram" || item.type === "promo" || item.type === "facebook") &&
    "image" in item
      ? item.image
      : undefined;

  const href = "href" in item ? item.href : undefined;
  const isSocialVideo = (item.type === "instagram" || item.type === "facebook") && item.isVideo;
  const canOpenImage = item.type !== "event" && item.type !== "instagram" && item.type !== "facebook";
  const badge = BADGE_META[item.type];
  const prayerDate =
    item.type === "prayer" && item.phase === "show" && item.prayerObjects?.[0]?.submittedAt
      ? formatPrayerDate(item.prayerObjects[0].submittedAt)
      : null;
  const ctaLabel = isSocialVideo
    ? "Reproducir"
    : item.type === "promo" && item.ctaText
      ? item.ctaText
      : CTA_LABEL[item.type];
  const ctaLinkClass =
    "inline-flex items-center gap-1 w-fit text-[18px] font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 leading-tight transition-colors";
  const ctaStaticClass = `inline-flex items-center gap-1 font-semibold ${
    item.type === "prayer" && item.phase === "collect"
      ? "text-[17px] text-[#2d6a4f]"
      : featured && !isDesktop
        ? "text-[12px] text-[#2f5e93]"
        : "text-[12px] text-[#425060]"
  }`;
  const ctaContent = (
    <>
      {ctaLabel}
      <ArrowRight className="h-3 w-3" aria-hidden="true" />
    </>
  );

  const inner = (
    <article
      className={[
        "snap-center relative overflow-hidden flex flex-col",
        "bg-paper-highlight",
        "border-[0.5px] border-black/20",
        "rounded-[2px]",
        // Paper aesthetic: previous lift shadows removed to keep cards flatter.
        "transition-colors",
        "w-full h-full",
      ].join(" ")}
    >
      {item.type === "promo" && (
        <div className="px-3 pt-3">
          <p className="mb-2.5 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#e36600]">
            <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Aviso</span>
          </p>
        </div>
      )}

      {image ? (
        <div className={`relative w-full ${item.type === "promo" ? "flex-1 min-h-0" : imageHeight} bg-[#f1f1f1] group cursor-pointer`}>
          <Image
            src={image}
            alt={item.title}
            fill
            sizes={isDesktop ? "(min-width: 768px) 33vw, 82vw" : "82vw"}
            className={item.type === "promo" ? "object-contain" : "object-cover"}
          />

          {/* Clickable overlay for entire image - opens lightbox */}
          {isSocialVideo ? (
            <div className="absolute inset-0 z-10 bg-transparent cursor-pointer hover:bg-black/[0.02] transition-colors" aria-hidden="true" />
          ) : !canOpenImage ? (
            <div className="absolute inset-0 z-10 bg-transparent pointer-events-none" aria-hidden="true" />
          ) : (
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
          )}

          {canOpenImage && (
            <div className="absolute bottom-2 right-2 z-20 flex items-center justify-center pointer-events-none">
              <div className="rounded-[6px] border border-white/15 bg-black/45 p-2 text-white shadow-[0_1px_2px_rgba(0,0,0,0.18)] backdrop-blur-[8px] transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100">
                <Maximize2 className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
              </div>
            </div>
          )}

          {isSocialVideo && (
            <div className="absolute top-2 right-2 bg-black/55 rounded-full h-6 w-6 flex items-center justify-center">
              <Play className="h-3 w-3 text-white" fill="white" />
            </div>
          )}

        </div>
      ) : null}

      {!(item.type === "promo" && !href) && (
      <div className={`min-h-0 flex flex-col ${item.type === "promo" ? "p-3" : "flex-1 p-3"}`}>
        {item.type !== "promo" && (
          <>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.12em] ${badge.classes}`}
              >
                {badge.icon}
                {item.type === "instagram" || item.type === "facebook" ? (
                  <span className="sr-only">{badge.label}</span>
                ) : (
                  badge.label
                )}
              </span>
              {prayerDate && item.type !== "prayer" && (
                <span className="rounded-sm bg-[#4a5568] px-2 py-0.5 text-[12px] font-semibold leading-none text-white shadow-sm whitespace-nowrap">
                  {prayerDate}
                </span>
              )}
            </div>

            {item.type !== "instagram" && item.type !== "facebook" && (
              <h3
                className={`${editorialFont.className} type-human-title font-bold leading-snug line-clamp-2 mb-1.5 text-[16px]`}
              >
                {item.title}
              </h3>
            )}
          </>
        )}

        {item.type === "event" && (
          <div className="space-y-0.5 mb-2">
            <p className="type-system text-[15px] flex items-center gap-1.5">
              <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
              {formatEventDate(item.date)}
              {item.time ? ` · ${item.time}` : ""}
            </p>
            {item.location && (
              <p className={`${editorialFont.className} type-human text-[15px] flex items-center gap-1.5 min-w-0`}>
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.location}</span>
              </p>
            )}
          </div>
        )}

        {(item.type === "instagram" || item.type === "facebook") && (
          <p className="text-[12px] text-[#5b6876] mb-1">
            hace{" "}
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
            deckLength={deckLength}
            isDesktop={isDesktop}
            editorialFontClassName={editorialFont.className}
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
        {!(item.type === "prayer" && item.phase === "show") && !(item.type === "promo" && !href) && (
          <div className={`${item.type === "promo" ? "" : "mt-auto pt-1"}`}>
            {href && (item.type === "event" || item.type === "promo") ? (
              href.startsWith("http") ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ctaLinkClass}
                  style={item.type === "promo" && item.accentColor ? { color: item.accentColor } : undefined}
                >
                  {ctaContent}
                </a>
              ) : (
                <Link href={href} className={ctaLinkClass}>
                  {ctaContent}
                </Link>
              )
            ) : (
              <span
                className={ctaStaticClass}
                style={item.type === "promo" && item.accentColor ? { color: item.accentColor } : undefined}
              >
                {ctaContent}
              </span>
            )}
          </div>
        )}
      </div>
      )}
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
          className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93] rounded-[3px] w-full text-left"
          aria-label={`${BADGE_META[item.type].label}: ${item.title || "Peticiones de oracion"}`}
        >
          {inner}
        </button>
      );
    } else {
      wrapper = inner;
    }
  } else if (isSocialVideo) {
    wrapper = (
      <div
        onClick={() => setIsSocialPlayerOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsSocialPlayerOpen(true);
          }
        }}
        role="button"
        tabIndex={0}
        className="block h-full w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93] rounded-[3px]"
        aria-label={`Reproducir video de ${BADGE_META[item.type].label}`}
      >
        {inner}
      </div>
    );
  } else if (item.type === "event" || item.type === "promo") {
    wrapper = inner;
  } else if (href && href.startsWith("http")) {
    // External links as <a> tags
    wrapper = (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93] rounded-[3px]"
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
        className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93] rounded-[3px]"
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
      <div role="listitem" className={`block ${cardFrameClass}`}>
        {wrapper}
      </div>

      {/* Lightbox for card images */}
      {isLightboxOpen && image && (
        <Lightbox src={image} alt={item.title} onClose={() => setIsLightboxOpen(false)} />
      )}

      {isSocialPlayerOpen && (item.type === "instagram" || item.type === "facebook") && (
        <SocialVideoModal item={item} onClose={() => setIsSocialPlayerOpen(false)} />
      )}
      
      {/* Full prayer text modal for long prayers */}
      {showFullPrayerModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Oración completa"
        >
          <div
            className="bg-white max-w-md w-full max-h-[80vh] overflow-hidden border border-black shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between bg-[#757575] pl-5">
              <h3 className="text-[17px] font-bold text-white">Oración completa</h3>
              <button
                onClick={() => setShowFullPrayerModal(false)}
                className="flex h-full w-14 items-center justify-center bg-[#434343] text-white transition-colors hover:bg-[#2f2f2f]"
                aria-label="Cerrar"
              >
                <svg
                  className="w-7 h-7"
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
            <div className="max-h-[calc(80vh-64px)] overflow-y-auto p-6">
              <p className={`${editorialFont.className} type-human text-[16px] italic leading-[1.75]`}>
                "{fullPrayerText}"
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

