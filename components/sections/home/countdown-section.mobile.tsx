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
  Image as ImageIcon,
  Images,
  MapPin,
  ExternalLink,
  Maximize2,
  Megaphone,
  Copy,
  Share2,
  Map as MapIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrayerWallForm } from "@/components/shared/prayer-wall-form";
import { HeroDebugPanel } from "./hero-debug-panel";
import { Lightbox } from "@/components/shared/lightbox";
import {
  formatRegionDateInput,
  formatRegionWeekdayDayMonth,
  getRegionCalendarParts,
  getRegionDateTime,
} from "@/lib/region-date";
import { buildEventShareText, getEventMapsUrl } from "@/lib/event-share-text";
import useLockBodyScroll from "@/hooks/use-lock-scroll";
import { useModalHistoryClose } from "@/hooks/use-modal-history-close";
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
const MOBILE_FLOATING_CARD_CLASS = "rounded-[2px]";
const MOBILE_FLOATING_BORDER_CLASS = "rounded-[2px]";

type CountdownOccurrence = {
  date: Date;
  time: string;
  note?: string;
};

type CountdownDisplay = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isDisabled: boolean;
};

const getRegionDateKey = (date: Date) => {
  const parts = getRegionCalendarParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
};

const getRegionDayEndMs = (date: Date) => {
  const endOfDay = getRegionDateTime(formatRegionDateInput(date), "23:59");
  return endOfDay ? endOfDay.getTime() + 59_999 : date.getTime();
};

const getCountdownDisplay = (target: Date, now: Date): CountdownDisplay => {
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const msPerSecond = 1000;
  const msPerMinute = msPerSecond * 60;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;

  return {
    days: Math.floor(diffMs / msPerDay),
    hours: Math.floor((diffMs % msPerDay) / msPerHour),
    minutes: Math.floor((diffMs % msPerHour) / msPerMinute),
    seconds: Math.floor((diffMs % msPerMinute) / msPerSecond),
    isDisabled: false,
  };
};

const canUseNativeShare = () => {
  if (typeof navigator === "undefined" || !("share" in navigator)) return false;

  const userAgentData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform =
    userAgentData.userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent;

  return /Android|iPhone|iPad|iPod/i.test(platform);
};

const WhatsAppLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
    fill="currentColor"
  >
    <path d="M20.5 3.5A11.4 11.4 0 0 0 12.04 0C5.71 0 .56 5.14.56 11.47c0 2.02.53 4 1.55 5.76L0 24l6.98-2.06a11.45 11.45 0 0 0 5.04 1.17h.01c6.33 0 11.47-5.15 11.47-11.47 0-3.06-1.19-5.93-3.34-8.14Zm-8.46 17.67h-.01c-1.69 0-3.35-.46-4.79-1.34l-.34-.2-4.14 1.22 1.24-4.03-.22-.36a9.34 9.34 0 0 1-1.43-4.99c0-5.16 4.2-9.36 9.37-9.36 2.5 0 4.86.98 6.64 2.74a9.32 9.32 0 0 1 2.74 6.64c0 5.17-4.2 9.36-9.06 9.68Zm5.34-6.6c-.29-.15-1.72-.85-1.98-.95-.27-.1-.46-.15-.66.15-.2.29-.76.95-.93 1.14-.17.2-.34.22-.63.07-.29-.15-1.23-.45-2.34-1.43-.86-.77-1.45-1.72-1.62-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.52-.07-.15-.66-1.58-.9-2.16-.24-.57-.48-.49-.66-.5h-.56c-.2 0-.52.07-.79.37-.27.29-1.03 1-.99 2.44.05 1.45 1.06 2.85 1.21 3.04.15.2 2.08 3.18 5.04 4.46.71.31 1.27.5 1.71.64.72.23 1.38.2 1.9.12.58-.09 1.72-.7 1.96-1.37.24-.66.24-1.23.17-1.37-.07-.15-.27-.22-.56-.37Z" />
  </svg>
);

function ShareFallbackModal({
  isOpen,
  title,
  shareText,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  shareText: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  useLockBodyScroll(isOpen);
  useModalHistoryClose(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const copyShareText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Compartir evento"
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Cerrar compartir"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md overflow-hidden border border-black bg-white shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-14 items-center justify-between bg-[#757575] pl-5">
          <h3 className="text-[17px] font-bold text-white">Compartir</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-full w-14 items-center justify-center bg-[#434343] text-white transition-colors hover:bg-[#2f2f2f]"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-5 max-h-44 overflow-y-auto border border-border bg-[#f7f7f7] p-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {shareText}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={copyShareText}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-2 hover:underline"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copied ? "Texto copiado" : "Copiar texto"}
            </button>

            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit flex-col items-center gap-2 rounded-sm border border-border bg-white px-5 py-4 text-foreground transition-colors hover:bg-muted/40"
              aria-label={`Compartir ${title} por WhatsApp`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white">
                <WhatsAppLogo className="h-6 w-6" />
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink">
                WhatsApp
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FlipCountdownCell({
  value,
  label,
  className = "",
  labelClassName = "",
  disabled = false,
}: TimeUnit & {
  className?: string;
  labelClassName?: string;
  disabled?: boolean;
}) {
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
    return () =>
      mediaQuery.removeEventListener("change", updateMotionPreference);
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
      className={`py-3 text-center ${className}`}
      style={{
        willChange: "transform, opacity, background-color, box-shadow",
        transformOrigin: "50% 50%",
      }}
      aria-live="off"
    >
      <div className="relative mx-auto h-6 w-full max-w-[70px]">
        <span
          className={`${editorialFont.className} mt-1.5 absolute inset-0 flex items-center justify-center text-[30px] font-normal tabular-nums leading-none ${disabled ? "text-muted-foreground" : "text-foreground"}`}
        >
          {displayText}
        </span>
      </div>

      <p
        className={`mt-1.5 text-[11px] uppercase tracking-widest font-medium ${disabled ? "text-muted-foreground/90" : "text-muted-foreground"} ${labelClassName}`}
      >
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
          clone.getBoundingClientRect().height >
          textEl.getBoundingClientRect().height + 1;
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
      if (direction === "previous")
        return (current - 1 + prayers.length) % prayers.length;
      return (current + 1) % prayers.length;
    });
  };

  return (
    <div
      className={`desktop-card-lift bg-card border border-border overflow-hidden mb-3 ${MOBILE_FLOATING_CARD_CLASS}`}
    >
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
            <h3
              className={`${editorialFont.className} type-human-title mb-2 text-[22px] font-bold leading-snug`}
            >
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
                      <span className="font-serif text-[1.35em] leading-none text-[#9aa3ad]">
                        “
                      </span>
                      <span>{currentPrayer.text}</span>
                      <span className="ml-0.5 font-serif text-[1.35em] leading-none text-[#9aa3ad]">
                        ”
                      </span>
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
                <p
                  className={`${editorialFont.className} type-human text-center text-[18px] leading-relaxed`}
                >
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

                <div
                  className="flex items-center justify-center gap-1.5"
                  aria-label={`Oración ${index + 1} de ${prayers.length}`}
                >
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
                  <h3 className="text-[17px] font-bold text-white">
                    Oración completa
                  </h3>
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
                  <p
                    className={`${editorialFont.className} type-human text-[16px] italic leading-relaxed`}
                  >
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

  const getTimeUnits = (): TimeUnit[] => {
    if (!countdownDisplay) return [];
    return [
      { value: countdownDisplay.days, label: "Días" },
      { value: countdownDisplay.hours, label: "Hrs" },
      { value: countdownDisplay.minutes, label: "Min" },
      { value: countdownDisplay.seconds, label: "Seg" },
    ];
  };

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
      className="pt-[38px] bg-paper px-2 pb-0 mb-0"
      data-countdown-section
      aria-label="Sección destacada"
    >
      <div className="max-w-md mx-auto w-full space-y-4">
        {/* Spotlight: event */}
        {countdownEvent && countdownDisplay && (
          <div
            className={`desktop-card-lift border bg-paper-highlight border-x border-b border-t-0 overflow-hidden mb-6 ${MOBILE_FLOATING_CARD_CLASS}`}
          >
            <div className="h-[5px] bg-brand" aria-hidden="true" />

            <div className="p-4 py-7 pb-4">
              <p
                className="text-[12px] text-brand-text font-semibold uppercase tracking-[0.16em] mb-3.5 mt-[-10px]"
                style={{ fontFamily: '"Inter", Arial, sans-serif' }}
              >
                Nuestro Próximo Evento
              </p>

              {/* Event title — serif for editorial weight */}
              <h3
                className="type-human-title mb-5 text-[32px] text-4xl font-extrabold leading-[1.125] tracking-tight"
                style={{ fontFamily: '"Canela", Georgia, serif' }}
              >
                {countdownEvent.title}
              </h3>

              {/* Meta: date + location */}
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-start gap-2 text-foreground">
                  <Calendar
                    className="mt-[3px] h-4.5 w-4.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    {countdownSchedule.map((occurrence, index) => (
                      <span
                        key={`${occurrence.date.toISOString()}-${index}`}
                        className="flex items-baseline gap-2 text-[18px] font-bold leading-tight tabular-nums"
                      >
                        <span>
                          {formatRegionWeekdayDayMonth(occurrence.date)}
                        </span>
                        <span className="text-[#2f5e93]" aria-hidden="true">
                          ·
                        </span>
                        <span>{occurrence.time}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-2 min-w-0 mt-2 mb-5 text-[18px] text-muted-foreground">
                  <MapPin
                    className="mt-[3px] h-4.5 w-4.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="line-clamp-2 leading-tight text-foreground/80">
                    {countdownEvent.address || countdownEvent.location}
                  </span>
                </div>
              </div>

              {/* Countdown grid — flat dividers, no background fill */}
              <div
                className={`grid grid-cols-4 border divide-x divide-border ${MOBILE_FLOATING_BORDER_CLASS} ${countdownGridClassName}`}
                role="timer"
                aria-label="Tiempo restante para el evento"
                aria-disabled={countdownIsDisabled}
              >
                {getTimeUnits().map((unit) => (
                  <FlipCountdownCell
                    key={unit.label}
                    value={unit.value}
                    label={unit.label}
                    disabled={countdownIsDisabled}
                  />
                ))}
              </div>

              <div className="mt-5">
                {countdownMapsUrl ? (
                  <button
                    type="button"
                    onClick={() => openGoogleMaps(countdownMapsUrl)}
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
                  {countdownPlacePhotoUrl && (
                    <>
                      <div className="mx-4 my-3 border-t border-border/50" />
                      <button
                        type="button"
                        onClick={() => setIsPlacePhotoOpen(true)}
                        className="mb-2.5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-sm border border-border bg-brand-soft px-4 py-3 text-center text-[16px] font-extrabold leading-tight tracking-[0.02em] text-[#2F5E93] transition-colors hover:bg-brand-soft/80"
                        aria-haspopup="dialog"
                        aria-label="Ver foto del lugar"
                      >
                        <ImageIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span className="min-w-0">VER FOTO DEL LUGAR</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={!countdownEvent || !countdownShareText}
                    className="text-foreground/80 inline-flex min-h-10 w-full items-center justify-center gap-3 rounded-sm border border-border bg-paper-dark px-4 py-2.5 text-center text-[16px] font-semibold leading-tight tracking-[0.02em] transition-colors hover:bg-muted/30 disabled:opacity-60 [&>span]:min-w-0"
                  >
                    <Share2 className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">COMPARTIR UBICACIÓN</span>
                  </button>
                </div>
              </div>

              {canRegisterCountdownEvent && onRegister && (
                <Button
                  onClick={() => onRegister(countdownEvent)}
                  className="w-full mt-5 h-auto min-h-14 whitespace-normal py-3 text-center text-base font-extrabold leading-tight tracking-[0.02em] text-white"
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
          <div
            className={`desktop-card-lift bg-card border border-border overflow-hidden mb-3 ${MOBILE_FLOATING_CARD_CLASS}`}
          >
            <div className="h-[3px] bg-brand" aria-hidden="true" />
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
                      customHeroCard.media.isVertical
                        ? "h-[min(86vh,680px)] md:h-[520px]"
                        : "h-[210px] md:h-[250px]"
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
                        <Maximize2
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    {/* Mobile: icon bottom-right */}
                    <div className="md:hidden pointer-events-none absolute bottom-2 right-2">
                      <div className="rounded-[2px] border-2 border-[#111827]/20 bg-white p-1.5">
                        <Maximize2
                          className="h-4 w-4 text-[#111827]"
                          aria-hidden="true"
                        />
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
                <Button
                  asChild
                  className="mt-3 h-auto min-h-11 w-full whitespace-normal bg-[#e98432] px-4 py-2.5 text-center text-sm font-bold leading-tight text-white hover:bg-[#cf7425]"
                >
                  <a
                    href={customHeroCard.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="inline-flex w-full items-center justify-center gap-1.5">
                      {customHeroCard.ctaText || "Ver más información"}
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
        )}

        {/* Spotlight: social */}
        {showSocialCard && spotlightHero && spotlightHero.type === "social" && (
          <div
            className={`desktop-card-lift bg-card border border-border overflow-hidden mb-3 ${MOBILE_FLOATING_CARD_CLASS}`}
          >
            <div
              className="h-[3px]"
              style={{ backgroundColor: spotlightAccent }}
              aria-hidden="true"
            />
            <div className="p-5">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3"
                style={{ color: spotlightAccent }}
              >
                {spotlightHero.network === "instagram"
                  ? "Instagram"
                  : "Facebook"}
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
                    className={
                      spotlightSocialPost.media.isVertical
                        ? "object-contain"
                        : "object-cover"
                    }
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
          <div
            key={event.id}
            className={`desktop-card-lift bg-card border border-border p-4 ${MOBILE_FLOATING_CARD_CLASS}`}
          >
            <div className="flex items-start gap-3">
              <Images
                className="h-4 w-4 text-primary shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <h4
                  className={`${editorialFont.className} type-human-title text-sm font-semibold mb-0.5 truncate`}
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
                  <Images className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {event.googleDriveAlbumUrl
                    ? "Subir Fotos"
                    : "Álbum no disponible"}
                </Button>
              </div>
            </div>
          </div>
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
