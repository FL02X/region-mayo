"use client";

import {
  type CSSProperties,
  type MouseEvent,
  type WheelEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { Newsreader } from "next/font/google";
import { createPortal, flushSync } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  Images,
  Facebook,
  Shirt,
  Utensils,
  Users,
  User,
  Mic,
  Info,
  X,
  Wifi,
  CalendarDays,
  Church,
  ChevronRight,
  HelpCircle,
  Megaphone,
  Landmark,
  Route,
  HeartHandshake,
  Flame,
  BookOpen,
  PartyPopper,
  Sparkles,
  Music,
  GraduationCap,
  Gem,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lightbox } from "@/components/shared/lightbox";
import {
  CopyPrintActions,
  CopyToast,
  PrintableInfoSheet,
  waitForImageReady,
  waitForNextPaint,
} from "@/components/shared/copy-print-actions";
import { useConnectivity } from "@/hooks/use-connectivity";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useIsMobile } from "@/hooks/use-mobile";
import { useModalHistoryClose } from "@/hooks/use-modal-history-close";
import { formatRegionDayMonth } from "@/lib/region-date";
import { buildEventShareText, getEventMapsUrl } from "@/lib/event-share-text";
import { sanityImageVariantUrl } from "@/lib/sanity/image";
import type { Event, Vestimenta, EventType } from "@/lib/types";

interface EventCardProps {
  event: Event;
  onRegister: (event: Event) => void;
  showAlbumButton?: boolean;
  variant?: "grid" | "compact";
  tone?: "default" | "editorial";
  idPrefix?: string;
  mutedPast?: boolean;
}

const eventTypeLabels: Record<EventType, string> = {
  campana: "Campaña",
  convencion: "Convención General",
  recorrido: "Recorrido Regional",
  confraternidadJuvenilRegional: "Confra. Juvenil Regional",
  confraternidadJuvenilGeneral: "Confra. Juvenil General",
  cultoJuvenil: "Culto Juvenil",
  culto: "Culto",
  visita: "Visita",
  ensayo: "Ensayo",
  actividad: "Actividad",
  estudioBiblico: "Estudio Bíblico",
  biregional: "Biregional",
  congresoBrilla: "Congreso Brilla",
  boda: "Boda",
};

const eventTypeIcons: Record<EventType, typeof Church> = {
  campana: Megaphone,
  convencion: Landmark,
  recorrido: Route,
  confraternidadJuvenilRegional: HeartHandshake,
  confraternidadJuvenilGeneral: HeartHandshake,
  cultoJuvenil: Flame,
  culto: Church,
  visita: Users,
  ensayo: Music,
  actividad: PartyPopper,
  estudioBiblico: BookOpen,
  biregional: Sparkles,
  congresoBrilla: GraduationCap,
  boda: Gem,
};

const eventTypeBadgeClasses: Record<EventType, string> = {
  campana: "border-[#2f5e93]/25  text-[#2f5e93]",
  convencion: "border-[#8c731e]/25  text-[#8c731e]",
  recorrido: "border-[#1a737f]/25  text-[#1a737f]",
  confraternidadJuvenilRegional: "border-[#a83e3e]/25  text-[#a83e3e]",
  confraternidadJuvenilGeneral: "border-[#a83e3e]/25  text-[#a83e3e]",
  cultoJuvenil: "border-[#a83e3e]/25  text-[#a83e3e]",
  culto: "border-[#26733a]/25 text-[#26733a]",
  visita: "border-[#1a737f]/25  text-[#1a737f]",
  ensayo: "border-[#26733a]/25 text-[#26733a]",
  actividad: "border-[#26733a]/25 text-[#26733a]",
  estudioBiblico: "border-[#26733a]/25  text-[#26733a]",
  biregional: "border-[#8c731e]/25  text-[#8c731e]",
  congresoBrilla: "border-[#6a3f91]/25  text-[#6a3f91]",
  boda: "border-[#6a3f91]/25  text-[#6a3f91]",
};

const vestimentaLabels: Record<Vestimenta, string> = {
  uniformeMGR: "Uniforme MGR",
  formalCasual: "Formal/Casual",
  informal: "Informal",
  otro: "Especial",
};

const formatVestimentaValue = (event: Event) => {
  if (!event.vestimenta) return "";

  const vestimentaLabel = vestimentaLabels[event.vestimenta];
  if (event.vestimenta === "otro" && event.vestimentaCustom) {
    return `${vestimentaLabel} (${event.vestimentaCustom})`;
  }

  return vestimentaLabel;
};

const pastorLinkClassName =
  "inline-flex items-center gap-1 w-fit text-[20px] font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 leading-tight transition-colors";

const locationLinkClassName =
  "inline-flex items-center gap-1 w-fit text-[16px] font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 leading-tight transition-colors";

const PASTOR_PENDING_LABEL = "Por confirmar";
const EVENT_COMPACT_THUMBNAIL_WIDTH = 272;
const EVENT_GRID_THUMBNAIL_WIDTH = 640;

export function getEventCardThumbnailUrl(
  image: string,
  variant: "compact" | "grid" = "compact",
) {
  if (!image || image === "/placeholder.svg") return image;

  if (variant === "grid") {
    return sanityImageVariantUrl(image, {
      width: EVENT_GRID_THUMBNAIL_WIDTH,
      quality: 35,
      format: "webp",
      fit: "crop",
    });
  }

  return sanityImageVariantUrl(image, {
    width: EVENT_COMPACT_THUMBNAIL_WIDTH,
    height: EVENT_COMPACT_THUMBNAIL_WIDTH,
    quality: 30,
    format: "webp",
    fit: "crop",
  });
}

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

type EventWithCoordinates = Event & {
  latitude?: number;
  longitude?: number;
  coordinates?: {
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
  };
};

const getEventCoordinates = (event: Event) => {
  const eventWithCoordinates = event as EventWithCoordinates;
  const latitude =
    eventWithCoordinates.latitude ??
    eventWithCoordinates.coordinates?.lat ??
    eventWithCoordinates.coordinates?.latitude;
  const longitude =
    eventWithCoordinates.longitude ??
    eventWithCoordinates.coordinates?.lng ??
    eventWithCoordinates.coordinates?.longitude;

  if (typeof latitude !== "number" || typeof longitude !== "number") return "";
  return `${latitude}, ${longitude}`;
};

const buildGoogleMapsSearchUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

const buildEventMapsUrl = getEventMapsUrl;

const openGoogleMaps = (url?: string, address?: string) => {
  const targetUrl = url || (address ? buildGoogleMapsSearchUrl(address) : "");
  if (targetUrl) window.open(targetUrl, "_blank");
};

const expandTransition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};
const DETAILS_TOGGLE_TOP_MARGIN = 96;
const DETAILS_PREVIEW_BOTTOM_MARGIN = 180;

export function EventCard({
  event,
  onRegister,
  showAlbumButton = false,
  variant = "grid",
  tone = "default",
  idPrefix,
  mutedPast = false,
}: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEventImage, setShowEventImage] = useState(false);
  const [showMoreInfoImage, setShowMoreInfoImage] = useState(false);
  const [showVestimentaHelp, setShowVestimentaHelp] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [isCopyToastVisible, setIsCopyToastVisible] = useState(false);
  const [printEvent, setPrintEvent] = useState<Event | null>(null);
  const [vestimentaTooltipStyle, setVestimentaTooltipStyle] =
    useState<CSSProperties | null>(null);
  const vestimentaHelpRef = useRef<HTMLButtonElement>(null);
  const copyToastTimerRef = useRef<number | null>(null);
  const copyToastExitTimerRef = useRef<number | null>(null);
  const activePrintEventRef = useRef<Event | null>(null);
  const printCleanupTimerRef = useRef<number | null>(null);
  const printInFlightRef = useRef(false);
  const detailsToggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const scheduleScrollerRef = useRef<HTMLDivElement | null>(null);
  const scheduleTouchScrollStartedRef = useRef(false);
  const suppressScheduleRightHintRef = useRef(false);
  const [canScrollScheduleLeft, setCanScrollScheduleLeft] = useState(false);
  const [canScrollScheduleRight, setCanScrollScheduleRight] = useState(false);
  useModalHistoryClose(showMoreInfoImage, () => setShowMoreInfoImage(false));
  const { isStandalone } = useInstallPrompt();
  const { isOnline } = useConnectivity();
  const shouldShowOfflineNotice = isStandalone && !isOnline;
  const isMobile = useIsMobile();
  const articleId = idPrefix ? `${idPrefix}-${event.id}` : event.id;
  const detailsId = idPrefix
    ? `${idPrefix}-details-${event.id}`
    : `details-${event.id}`;
  const isEditorialTone = tone === "editorial";
  const editorialTitleClass = isEditorialTone
    ? `${editorialFont.className} type-human-title ${mutedPast ? "text-stone-600" : ""}`
    : "text-foreground";
  const editorialTextClass = isEditorialTone
    ? `${editorialFont.className} type-human ${mutedPast ? "text-stone-600" : ""}`
    : "text-foreground ";
  const openAlbum = () => {
    if (event.googleDriveAlbumUrl)
      window.open(event.googleDriveAlbumUrl, "_blank");
  };

  const openFacebookPost = () => {
    if (event.facebookPostUrl) window.open(event.facebookPostUrl, "_blank");
  };

  const handleToggle = (toggleEvent: MouseEvent<HTMLButtonElement>) => {
    detailsToggleButtonRef.current = toggleEvent.currentTarget;
    setIsExpanded((prev) => !prev);
  };

  const scrollExpandedDetailsIntoView = () => {
    const button = detailsToggleButtonRef.current;
    const details = document.getElementById(detailsId);
    if (!button || !details) return;
    if (button.getAttribute("aria-expanded") !== "true") return;

    const buttonRect = button.getBoundingClientRect();
    const detailsRect = details.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const currentScrollY = window.scrollY;

    if (buttonRect.top < DETAILS_TOGGLE_TOP_MARGIN) {
      window.scrollTo({
        top: Math.max(
          0,
          currentScrollY + buttonRect.top - DETAILS_TOGGLE_TOP_MARGIN,
        ),
        behavior: "smooth",
      });
      return;
    }

    const detailsPreviewTop = viewportHeight - DETAILS_PREVIEW_BOTTOM_MARGIN;
    const scrollDownForDetails = Math.max(
      0,
      detailsRect.top - detailsPreviewTop,
    );
    const scrollDownWhileKeepingButtonVisible = Math.max(
      0,
      buttonRect.top - DETAILS_TOGGLE_TOP_MARGIN,
    );
    const scrollDown = Math.min(
      scrollDownForDetails,
      scrollDownWhileKeepingButtonVisible,
    );

    if (scrollDown > 0) {
      window.scrollTo({
        top: currentScrollY + scrollDown,
        behavior: "smooth",
      });
    }
  };

  /* ── state derivations ── */
  const eventSchedule =
    Array.isArray(event.schedule) && event.schedule.length > 0
      ? event.schedule
      : [{ date: event.date, time: event.time }];
  const isPastEvent = event.status === "past";
  const hasAlbum = event.albumEnabled && event.googleDriveAlbumUrl;
  const hasFacebookPost = !!event.facebookPostUrl;
  const canRegister = !isPastEvent && event.registrationEnabled !== false;
  const hasDescription = !!event.description && event.description.length > 0;
  const eventType = event.eventType || "culto";
  const EventTypeIcon = eventTypeIcons[eventType];
  const eventTypeBadgeClass = eventTypeBadgeClasses[eventType];
  const mutedPastCardClass = mutedPast
    ? "border-stone-300 bg-stone-100 text-stone-600 grayscale-[0.15]"
    : "";
  const mutedPastPanelClass = mutedPast
    ? "border-stone-300 bg-stone-100"
    : "border-border/70 bg-paper-highlight";
  const mutedPastImageClass = mutedPast
    ? "grayscale opacity-80 contrast-90"
    : "";
  const mutedPastBadgeClass = mutedPast
    ? "border-stone-300 text-stone-500"
    : eventTypeBadgeClass;
  const eventDateTimeLines = eventSchedule.map((occurrence) => {
    const label = `${formatRegionDayMonth(occurrence.date)} | ${occurrence.time}`;
    return occurrence.note ? `${label} - ${occurrence.note}` : label;
  });
  const getCompactDesktopDateParts = (date: Date) => {
    const [day = "", month = ""] = formatRegionDayMonth(date).split(" ");

    return {
      day,
      month: month.slice(0, 3).toUpperCase(),
    };
  };
  const eventDateTimeLabel = eventDateTimeLines.join("\n");
  const visibleScheduleSlots = !isMobile && variant === "compact" ? 4 : 2;
  const shouldScrollSchedule = isMobile
    ? eventSchedule.length > 3
    : eventSchedule.length > visibleScheduleSlots;
  const scheduleItemBasis =
    100 /
    Math.min(
      eventSchedule.length,
      shouldScrollSchedule ? visibleScheduleSlots : eventSchedule.length,
    );
  const eventCoordinates = getEventCoordinates(event);
  const eventMapsUrl = buildEventMapsUrl(event);
  const eventHighlightUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/#${encodeURIComponent(event.id)}`
      : `/#${event.id}`;
  const eventAlimentosPrintText = [
    event.alimentos?.location,
    event.alimentos?.description,
  ]
    .filter(Boolean)
    .join("\n");
  const eventJuntaJuvenilPrintText = [
    event.juntaJuvenil?.location,
    event.juntaJuvenil?.description,
  ]
    .filter(Boolean)
    .join("\n");

  const updateScheduleScrollIndicators = () => {
    const scroller = scheduleScrollerRef.current;
    if (!scroller || !shouldScrollSchedule) {
      setCanScrollScheduleLeft(false);
      setCanScrollScheduleRight(false);
      scheduleTouchScrollStartedRef.current = false;
      suppressScheduleRightHintRef.current = false;
      return;
    }

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    if (maxScrollLeft <= 2) {
      setCanScrollScheduleLeft(false);
      setCanScrollScheduleRight(false);
      scheduleTouchScrollStartedRef.current = false;
      suppressScheduleRightHintRef.current = false;
      return;
    }

    const canScrollLeft = scroller.scrollLeft > 2;
    const canScrollRight = scroller.scrollLeft < maxScrollLeft - 2;

    if (!canScrollLeft) {
      scheduleTouchScrollStartedRef.current = false;
      suppressScheduleRightHintRef.current = false;
    } else if (scheduleTouchScrollStartedRef.current) {
      suppressScheduleRightHintRef.current = true;
    }

    setCanScrollScheduleLeft(canScrollLeft);
    setCanScrollScheduleRight(
      canScrollRight && !suppressScheduleRightHintRef.current,
    );
  };

  const handleScheduleTouchStart = () => {
    scheduleTouchScrollStartedRef.current = true;
  };

  const scrollEventSchedule = (direction: "left" | "right") => {
    const scroller = scheduleScrollerRef.current;
    if (!scroller || !shouldScrollSchedule) return;
    const itemWidth = scroller.scrollWidth / eventSchedule.length;
    const scrollStep =
      visibleScheduleSlots === 2 ? itemWidth : scroller.clientWidth;
    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    const targetScrollLeft =
      direction === "right"
        ? Math.min(scroller.scrollLeft + scrollStep, maxScrollLeft)
        : Math.max(scroller.scrollLeft - scrollStep, 0);

    scroller.scrollTo({
      left: targetScrollLeft,
      behavior: "smooth",
    });
  };

  const handleScheduleWheel = (wheelEvent: WheelEvent<HTMLDivElement>) => {
    const scroller = scheduleScrollerRef.current;
    if (
      !scroller ||
      !shouldScrollSchedule ||
      scroller.scrollWidth <= scroller.clientWidth
    ) {
      return;
    }
    if (Math.abs(wheelEvent.deltaY) <= Math.abs(wheelEvent.deltaX)) return;

    wheelEvent.preventDefault();
    scroller.scrollLeft += wheelEvent.deltaY;
    updateScheduleScrollIndicators();
  };

  const buildEventCopyText = () =>
    buildEventShareText(event, eventHighlightUrl);

  /* Does the card have any expandable details? */
  const hasDetails =
    !!event.vestimenta ||
    !!event.speakers?.pastorMensaje ||
    !!event.speakers?.jovenPreside ||
    event.alimentos?.enabled ||
    event.juntaJuvenil?.enabled ||
    (event.moreInfo?.enabled && !!event.moreInfo.imageUrl);
  const hasMobileCompactDetails =
    hasDescription || !!event.location || !!event.address;
  const hasDropdownCtas = hasAlbum || hasFacebookPost;
  const compactHasDetails = variant === "compact" && hasMobileCompactDetails;
  const gridHasDetails = variant === "grid" && hasDescription;
  const shouldRenderGridDetailsInline = isMobile && variant === "grid";
  const actionMenuLabel =
    hasDetails || compactHasDetails || gridHasDetails
      ? "Ver detalles"
      : "Opciones";
  const actionMenuExpandedLabel =
    hasDetails || compactHasDetails || gridHasDetails
      ? "Ocultar detalles"
      : "Ocultar opciones";
  const eventUtilityButtonClass =
    "mt-[-25px] inline-flex min-h-10 w-fit max-w-full items-center gap-1.5 rounded-sm border border-border bg-surface-pane px-3 py-2 text-sm font-medium leading-tight whitespace-normal text-brand-ink transition-[background-color,border-color] duration-150 hover:border-brand-ink hover:bg-primary/10";
  const eventUtilityButtonSmallClass =
    "inline-flex ml-4.5 min-h-8 w-fit max-w-full items-center gap-1.5 rounded-sm border border-border bg-surface-pane px-2.5 py-1.5 text-sm font-medium leading-tight whitespace-normal text-brand-ink transition-[background-color,border-color] duration-150 hover:border-brand-ink hover:bg-primary/10";
  const eventPrimaryMapsButtonClass =
    "inline-flex ml-4.5 mt-3 min-h-10 w-fit max-w-full items-center gap-1.5 rounded-sm bg-brand px-3 py-2 text-sm font-normal leading-tight whitespace-normal text-white transition-colors duration-150 hover:bg-brand-hover";
  const eventPrimaryMapsButtonSmallClass =
    "inline-flex ml-4.5 min-h-11 w-fit max-w-full items-center gap-1.5 rounded-sm bg-brand px-2.5 py-2 text-sm font-normal leading-tight whitespace-normal text-white transition-colors duration-150 hover:bg-[#4888b4]";
  const compactMobileMapsButtonClass = eventPrimaryMapsButtonClass;
  const gridMapsButtonClass = canRegister
    ? eventUtilityButtonSmallClass
    : eventPrimaryMapsButtonSmallClass;
  const compactThumbnailUrl = getEventCardThumbnailUrl(event.image, "compact");
  const gridThumbnailUrl = getEventCardThumbnailUrl(event.image, "grid");
  const moreInfoImageUrl = event.moreInfo?.imageUrl
    ? sanityImageVariantUrl(event.moreInfo.imageUrl, {
        width: 1200,
        quality: 72,
        format: "webp",
        fit: "max",
      })
    : "";
  const registerActionButton =
    !isPastEvent && canRegister ? (
      <button
        type="button"
        onClick={() => onRegister(event)}
        className={eventPrimaryMapsButtonClass}
        style={{ minWidth: "unset" }}
      >
        REGISTRARSE
        <ChevronRight className="h-5 w-5 ml-2 shrink-0" aria-hidden="true" />
      </button>
    ) : null;
  const dropdownCtaButtons = hasDropdownCtas ? (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        {hasFacebookPost && (
          <Button
            onClick={openFacebookPost}
            variant="outline"
            className="h-auto min-h-10 w-fit max-w-full justify-start whitespace-normal rounded-none border-border bg-surface-pane px-3 py-2 text-sm font-medium leading-tight text-brand-ink hover:border-brand-ink hover:bg-primary/10"
          >
            <Facebook className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="ml-1.5 min-w-0">Ver en Facebook</span>
            <ChevronRight
              className="ml-1 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
          </Button>
        )}
        {hasAlbum && (
          <Button
            onClick={openAlbum}
            variant="outline"
            className="h-auto min-h-10 w-fit max-w-full justify-start whitespace-normal rounded-none border-border bg-surface-pane px-3 py-2 text-sm font-medium leading-tight text-brand-ink hover:border-brand-ink hover:bg-primary/10"
          >
            <Images className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="ml-1.5 min-w-0">Ver Álbum</span>
            <ChevronRight
              className="ml-1 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
          </Button>
        )}
      </div>
    </div>
  ) : null;
  const pastorNameNode =
    event.speakers?.pastorMensaje &&
    event.speakers?.pastorMensajeId &&
    event.speakers.pastorMensaje.trim() !== PASTOR_PENDING_LABEL ? (
      <Link
        href={`/pastores#${event.speakers.pastorMensajeId}`}
        className={pastorLinkClassName}
        aria-label={`Ver información de ${event.speakers.pastorMensaje}`}
      >
        <span className="inline-block">{event.speakers.pastorMensaje}</span>
      </Link>
    ) : (
      <span>{event.speakers?.pastorMensaje}</span>
    );
  const temploNameNode =
    event.location && event.temploId ? (
      <Link
        href={`/templos#${event.temploId}`}
        className={locationLinkClassName}
        aria-label={`Ver información de ${event.location}`}
      >
        <span className="inline-block">{event.location}</span>
      </Link>
    ) : (
      <span className="min-w-0">{event.location}</span>
    );

  const renderExpandedDetails = (
    containerClassName = "space-y-2 pb-5 pt-5 px-5",
    options: { showDescription?: boolean } = {},
  ) => (
    <div className={containerClassName}>
      {/* En compact desktop la descripcion ya esta visible; aqui solo va cuando haga falta. */}
      {options.showDescription && hasDescription && (
        <section className="space-y-3">
          <p className={`text-[17px] font-bold`}>Más información</p>
          <p
            className={`text-[18px] leading-relaxed text-ink mb-7 ${editorialTextClass}`}
          >
            {event.description}
          </p>
        </section>
      )}

      {(event.vestimenta ||
        event.speakers?.pastorMensaje ||
        event.speakers?.jovenPreside) && (
        <section className="space-y-4">
          <p className={`mb-6 text-[17px] font-bold`}>Información general</p>
          <div className="space-y-3 border-l-2 border-[#2f5e93]/20 py-0.5 pl-3 mb-0">
            {event.vestimenta && (
              <div className="flex items-start gap-2.5">
                <Shirt
                  className="mt-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">Vestimenta</p>
                  <div
                    className={`mt-1 mb-2 flex items-start gap-1.5 text-[18px] leading-snug ${editorialTextClass}`}
                  >
                    <span className="min-w-0">
                      {formatVestimentaValue(event)}
                    </span>
                    <button
                      ref={vestimentaHelpRef}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setShowVestimentaHelp((value) => !value);
                      }}
                      onPointerEnter={(event) => {
                        if (event.pointerType === "mouse")
                          setShowVestimentaHelp(true);
                      }}
                      onPointerLeave={(event) => {
                        if (event.pointerType === "mouse")
                          setShowVestimentaHelp(false);
                      }}
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label="Información sobre la vestimenta"
                      aria-expanded={showVestimentaHelp}
                      style={{ minHeight: "unset", minWidth: "unset" }}
                    >
                      <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            {event.speakers?.pastorMensaje && (
              <div className="flex items-start gap-2.5">
                <User
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">Pastor a cargo</p>
                  <div
                    className={`mt-1 text-[15px] leading-snug ${editorialTextClass}`}
                  >
                    {pastorNameNode}
                  </div>
                </div>
              </div>
            )}
            {event.speakers?.jovenPreside && (
              <div className="flex items-start gap-2.5">
                <Mic
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">Preside</p>
                  <p
                    className={`mt-1 text-[18px] leading-snug ${editorialTextClass}`}
                  >
                    {event.speakers.jovenPreside}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {event.alimentos?.enabled && (
        <div className="p-3 bg-muted/40 border border-border mt-8">
          <div className="flex items-start gap-2.5">
            <Utensils
              className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-0.5">
                Alimentos
              </p>
              {event.alimentos.location && (
                <p className="text-xs">{event.alimentos.location}</p>
              )}
              {event.alimentos.description && (
                <p className="text-xs mt-0.5 whitespace-pre-line">
                  {event.alimentos.description}
                </p>
              )}
            </div>
            {event.alimentos.googleMapsUrl && (
              <button
                onClick={() => openGoogleMaps(event.alimentos?.googleMapsUrl)}
                className="mt-4 mr-5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Ver ubicación de alimentos en Maps"
                style={{ minHeight: "unset", minWidth: "unset" }}
              >
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}

      {event.juntaJuvenil?.enabled && (
        <div className="p-3 bg-muted/40 border border-border mt-3">
          <div className="flex items-start gap-2.5">
            <Users
              className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-0.5">
                Junta Juvenil
              </p>
              {event.juntaJuvenil.location && (
                <p className="text-xs text-muted-foreground">
                  {event.juntaJuvenil.location}
                </p>
              )}
              {event.juntaJuvenil.description && (
                <p className="text-xs mt-0.5 whitespace-pre-line">
                  {event.juntaJuvenil.description}
                </p>
              )}
            </div>
            {event.juntaJuvenil.googleMapsUrl && (
              <button
                onClick={() =>
                  openGoogleMaps(event.juntaJuvenil?.googleMapsUrl)
                }
                className="mt-4 mr-5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Ver ubicación de junta juvenil en Maps"
                style={{ minHeight: "unset", minWidth: "unset" }}
              >
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}

      {!isPastEvent && event.moreInfo?.enabled && event.moreInfo.imageUrl && (
        <Button
          variant="outline"
          onClick={() => setShowMoreInfoImage(true)}
          className="mt-8 mb-3 h-auto min-h-9 w-full whitespace-normal py-2.5 text-center text-sm leading-tight"
        >
          <Info className="h-4 w-4 mr-1.5 shrink-0" aria-hidden="true" />
          VER FOTO DEL LUGAR
        </Button>
      )}
    </div>
  );

  const renderEventScheduleGrid = (mode: "compact" | "grid") => {
    const isCompactSchedule = mode === "compact";

    return (
      <div
        className={
          isCompactSchedule ? "relative bg-paper-dark border" : "relative bg-paper-highlight"
        }
      >
        <div
        ref={scheduleScrollerRef}
        onScroll={updateScheduleScrollIndicators}
        onTouchStart={
          shouldScrollSchedule ? handleScheduleTouchStart : undefined
        }
        onWheel={shouldScrollSchedule ? handleScheduleWheel : undefined}
        className={[
          "flex w-full",
          shouldScrollSchedule
            ? "touch-auto overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "overflow-hidden",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {eventSchedule.map((occurrence, index) => (
          <div
            key={`${occurrence.date.toISOString()}-${occurrence.time}-${index}`}
            className={[
              "flex min-w-0 shrink-0 items-start gap-2 px-3 mt-[-3px] mb-[-3px]",
              isCompactSchedule
                ? "py-3 border-r last:border-r-0"
                : "py-3.5 border-l border",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ flexBasis: `${scheduleItemBasis}%` }}
          >
            <CalendarDays
              className="mt-0.5 h-4 w-4 shrink-0 text-[#2f5e93]"
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span
                className={[
                  "block truncate text-[18px] leading-tight text-foreground",
                  isCompactSchedule ? "font-semibold" : "font-extrabold",
                ].join(" ")}
              >
                {formatRegionDayMonth(occurrence.date)}
              </span>
              <span
                className={[
                  "mt-0.5 block text-[14px] font-medium leading-tight text-ink-soft tabular-nums",
                  isCompactSchedule ? "line-clamp-none" : "truncate",
                ].join(" ")}
              >
                {occurrence.time}
              </span>
              {occurrence.note ? (
                <span className="mt-1 block truncate text-xs font-medium leading-snug text-muted-foreground">
                  {occurrence.note}
                </span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
      {shouldScrollSchedule && canScrollScheduleLeft ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-14 items-center justify-start bg-gradient-to-r from-brand-soft via-brand-soft/80 to-transparent pl-1.5">
          <button
            type="button"
            onClick={() => scrollEventSchedule("left")}
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-sm transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            aria-label="Ver fechas anteriores"
            style={{ minHeight: "unset", minWidth: "unset" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      {shouldScrollSchedule && canScrollScheduleRight ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-14 items-center justify-end bg-gradient-to-l from-brand-soft via-brand-soft/80 to-transparent pr-1.5">
          <button
            type="button"
            onClick={() => scrollEventSchedule("right")}
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-sm transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            aria-label="Ver más fechas"
            style={{ minHeight: "unset", minWidth: "unset" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
    );
  };

  //Tiles de fechas del viewport Desktop
  const compactDesktopScheduleRail = (
    <div className="hidden shrink-0 md:flex">
      {eventSchedule.map((occurrence, index) => {
        const dateParts = getCompactDesktopDateParts(occurrence.date);

        return (
          <div
            key={`${occurrence.date.toISOString()}-${occurrence.time}-${index}`}
            className="flex min-h-[112px] w-[66px] shrink-0 flex-col items-center justify-center border-y border-r first:border-l bg-paper-dark px-2 py-3 text-center text-ink"
          >
            <span className="text-[15px] font-semibold uppercase leading-none tracking-[0.04em] text-ink">
              {dateParts.month}
            </span>
            <span className="mt-1 text-[34px] font-light leading-none tabular-nums">
              {dateParts.day}
            </span>
            <span className="mt-2 text-[11px] font-medium leading-tight text-ink tabular-nums">
              {occurrence.time}
            </span>
          </div>
        );
      })}
    </div>
  );

  const printableSections = [
    {
      id: "datetime",
      label: "Fecha y hora",
      icon: <CalendarDays className="rm-print-icon" aria-hidden="true" />,
      content: (
        <div className="space-y-1">
          {eventDateTimeLines.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
      ),
    },
    ...(event.location || event.address
      ? [
          {
            id: "location",
            label: "Ubicación",
            icon: <MapPin className="rm-print-icon" aria-hidden="true" />,
            content: (
              <p>
                {event.location}
                {event.address ? `\n${event.address}` : ""}
              </p>
            ),
          },
        ]
      : []),
    ...(eventCoordinates
      ? [
          {
            id: "coordinates",
            label: "Coordenadas",
            icon: <MapPin className="rm-print-icon" aria-hidden="true" />,
            content: <p>{eventCoordinates}</p>,
          },
        ]
      : []),
    ...(event.alimentos?.enabled
      ? [
          {
            id: "alimentos",
            label: "Alimentos",
            icon: <Utensils className="rm-print-icon" aria-hidden="true" />,
            content: <p>{eventAlimentosPrintText}</p>,
          },
        ]
      : []),
    ...(event.juntaJuvenil?.enabled
      ? [
          {
            id: "junta",
            label: "Junta Juvenil",
            icon: <Users className="rm-print-icon" aria-hidden="true" />,
            content: <p>{eventJuntaJuvenilPrintText}</p>,
          },
        ]
      : []),
    ...(event.vestimenta
      ? [
          {
            id: "vestimenta",
            label: "Vestimenta",
            icon: <Shirt className="rm-print-icon" aria-hidden="true" />,
            content: <p>{formatVestimentaValue(event)}</p>,
          },
        ]
      : []),
    ...(event.speakers?.pastorMensaje
      ? [
          {
            id: "pastor",
            label: "Pastor a cargo",
            icon: <Mic className="rm-print-icon" aria-hidden="true" />,
            content: <p>{event.speakers.pastorMensaje}</p>,
          },
        ]
      : []),
    ...(event.speakers?.jovenPreside
      ? [
          {
            id: "preside",
            label: "Preside",
            icon: <User className="rm-print-icon" aria-hidden="true" />,
            content: <p>{event.speakers.jovenPreside}</p>,
          },
        ]
      : []),
    ...(hasDescription
      ? [
          {
            id: "description",
            label: "Descripción",
            icon: <Info className="rm-print-icon" aria-hidden="true" />,
            content: <p>{event.description}</p>,
          },
        ]
      : []),
  ];

  const showCopiedToast = () => {
    setShowCopyToast(true);
    window.requestAnimationFrame(() => setIsCopyToastVisible(true));

    if (copyToastTimerRef.current) {
      window.clearTimeout(copyToastTimerRef.current);
    }
    if (copyToastExitTimerRef.current) {
      window.clearTimeout(copyToastExitTimerRef.current);
    }

    copyToastTimerRef.current = window.setTimeout(() => {
      setIsCopyToastVisible(false);
      copyToastExitTimerRef.current = window.setTimeout(() => {
        setShowCopyToast(false);
      }, 240);
    }, 1600);
  };

  const handlePrintEvent = async () => {
    if (printInFlightRef.current) return;

    printInFlightRef.current = true;
    if (printCleanupTimerRef.current) {
      window.clearTimeout(printCleanupTimerRef.current);
      printCleanupTimerRef.current = null;
    }
    document.body.classList.add("rm-printing");
    activePrintEventRef.current = event;

    flushSync(() => {
      setPrintEvent(event);
    });

    const printRoot = document.querySelector(".rm-event-print-root");
    printRoot?.getBoundingClientRect();

    try {
      await waitForImageReady(event.image);
      await waitForNextPaint();

      const portalImage = printRoot?.querySelector("img");
      if (portalImage instanceof HTMLImageElement) {
        await waitForImageReady(portalImage.currentSrc || portalImage.src);
        try {
          if (portalImage.decode) {
            await portalImage.decode();
          }
        } catch {
          // A loaded image is enough for print; decode can fail in mobile browsers.
        }
      }

      await waitForNextPaint();
      window.print();
    } finally {
      printInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (!showVestimentaHelp) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        vestimentaHelpRef.current &&
        event.target instanceof Node &&
        vestimentaHelpRef.current.contains(event.target)
      ) {
        return;
      }
      setShowVestimentaHelp(false);
    };

    const handleScroll = () => setShowVestimentaHelp(false);

    document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showVestimentaHelp]);

  useEffect(
    () => () => {
      if (copyToastTimerRef.current) {
        window.clearTimeout(copyToastTimerRef.current);
      }
      if (copyToastExitTimerRef.current) {
        window.clearTimeout(copyToastExitTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const clearPrintEvent = () => {
      if (printCleanupTimerRef.current) {
        window.clearTimeout(printCleanupTimerRef.current);
      }
      const cleanupDelay = window.matchMedia("(hover: none), (pointer: coarse)")
        .matches
        ? 8000
        : 250;

      printCleanupTimerRef.current = window.setTimeout(() => {
        document.body.classList.remove("rm-printing");
        activePrintEventRef.current = null;
        setPrintEvent(null);
        printCleanupTimerRef.current = null;
      }, cleanupDelay);
    };

    const keepPrintClass = () => {
      if (printInFlightRef.current || activePrintEventRef.current) {
        document.body.classList.add("rm-printing");
      }
    };

    window.addEventListener("beforeprint", keepPrintClass);
    window.addEventListener("afterprint", clearPrintEvent);
    return () => {
      if (printCleanupTimerRef.current) {
        window.clearTimeout(printCleanupTimerRef.current);
      }
      document.body.classList.remove("rm-printing");
      activePrintEventRef.current = null;
      window.removeEventListener("beforeprint", keepPrintClass);
      window.removeEventListener("afterprint", clearPrintEvent);
    };
  }, []);

  useLayoutEffect(() => {
    if (!showVestimentaHelp) {
      setVestimentaTooltipStyle(null);
      return;
    }

    const updatePosition = () => {
      const trigger = vestimentaHelpRef.current;
      if (!trigger) return;

      const rootStyles = window.getComputedStyle(document.documentElement);
      const pageZoom =
        Number.parseFloat(rootStyles.zoom) ||
        Number.parseFloat(rootStyles.getPropertyValue("--app-zoom")) ||
        1;
      const rect = trigger.getBoundingClientRect();
      const cssViewportWidth = window.innerWidth / pageZoom;
      const cssViewportHeight = window.innerHeight / pageZoom;
      const cssRect = {
        top: rect.top / pageZoom,
        left: rect.left / pageZoom,
        right: rect.right / pageZoom,
        height: rect.height / pageZoom,
      };
      const viewportPadding = 8 / pageZoom;
      const preferredWidth = (window.innerWidth < 480 ? 230 : 260) / pageZoom;
      const tooltipWidth = Math.min(
        preferredWidth,
        cssViewportWidth - viewportPadding * 2,
      );

      const horizontalGap = 6 / pageZoom;
      const canOpenRight =
        cssRect.right + horizontalGap + tooltipWidth <=
        cssViewportWidth - viewportPadding;
      const canOpenLeft =
        cssRect.left - horizontalGap - tooltipWidth >= viewportPadding;
      const left = canOpenRight
        ? cssRect.right + horizontalGap
        : canOpenLeft
          ? cssRect.left - horizontalGap - tooltipWidth
          : Math.max(
              viewportPadding,
              Math.min(
                cssRect.right + horizontalGap,
                cssViewportWidth - tooltipWidth - viewportPadding,
              ),
            );

      const estimatedTooltipHeight = 86 / pageZoom;
      const top = Math.max(
        viewportPadding,
        Math.min(
          cssRect.top + cssRect.height / 2 - estimatedTooltipHeight / 2,
          cssViewportHeight - estimatedTooltipHeight - viewportPadding,
        ),
      );

      setVestimentaTooltipStyle({
        position: "fixed",
        top,
        left,
        width: tooltipWidth,
        maxWidth: `calc(100vw - ${viewportPadding * 2}px)`,
        zIndex: 80,
        pointerEvents: "none",
        textAlign: "left",
      });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showVestimentaHelp]);

  useLayoutEffect(() => {
    updateScheduleScrollIndicators();
    window.addEventListener("resize", updateScheduleScrollIndicators);
    return () => {
      window.removeEventListener("resize", updateScheduleScrollIndicators);
    };
  }, [eventSchedule.length, shouldScrollSchedule, visibleScheduleSlots]);

  const vestimentaTooltipNode =
    typeof document !== "undefined" &&
    showVestimentaHelp &&
    vestimentaTooltipStyle
      ? createPortal(
          <div
            role="tooltip"
            className="border border-border bg-background px-3 py-2 text-left text-xs leading-relaxed text-muted-foreground shadow-lg"
            style={vestimentaTooltipStyle}
          >
            Todos pueden llevar cualquier ropa. Esta vestimenta es solo para
            jóvenes miembros de la iglesia.
          </div>,
          document.body,
        )
      : null;

  const eventActionButtons = (
    <CopyPrintActions
      copyText={buildEventCopyText()}
      copyLabel={`Copiar información de ${event.title}`}
      printLabel={`Imprimir información de ${event.title}`}
      onCopied={showCopiedToast}
      onPrint={handlePrintEvent}
    />
  );

  const eventPortals = (
    <>
      {showCopyToast &&
        createPortal(<CopyToast visible={isCopyToastVisible} />, document.body)}
      {printEvent &&
        createPortal(
          <div className="rm-print-root rm-event-print-root">
            <PrintableInfoSheet
              title={printEvent.title}
              imageUrl={printEvent.image}
              imageAlt={printEvent.title}
              fallbackIcon={<Church className="h-10 w-10" aria-hidden="true" />}
              sections={printableSections}
            />
          </div>,
          document.body,
        )}
    </>
  );

  const moreInfoModal = showMoreInfoImage && event.moreInfo?.imageUrl && (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={() => setShowMoreInfoImage(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Información adicional del evento"
    >
      {/* En offline evitamos abrir imágenes ampliadas que no siempre están cacheadas. */}
      {shouldShowOfflineNotice ? (
        <div
          className="relative w-full max-w-[360px] border border-border bg-background p-5 text-center shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMoreInfoImage(false)}
            className="absolute right-2 top-2 h-9 w-9 rounded-none"
            aria-label="Cerrar aviso"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-primary/10">
            <Wifi className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold uppercase tracking-wide text-foreground">
            Requiere conexión a internet
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Para ahorrar datos y almacenamiento, las imágenes ampliadas no se
            descargan para uso sin conexión.
          </p>
        </div>
      ) : (
        <div
          className="relative max-w-lg w-full max-h-[90vh]"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMoreInfoImage(false)}
            className="absolute -top-12 right-0 text-white hover:bg-white/20 rounded-full"
            aria-label="Cerrar imagen de información"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </Button>
          <div className="relative aspect-[3/4] w-full overflow-hidden">
            <Image
              src={moreInfoImageUrl}
              alt={`Más información de ${event.title}`}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );

  if (variant === "compact") {
    return (
      <>
        {eventPortals}
        <article
          id={articleId}
          className={`overflow-hidden last:mb-3 scroll-mt-[100px] transition-none target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20 md:w-fit md:transition-all md:duration-700 ${mutedPastCardClass}`}
        >
          <div className={`md:hidden ${mutedPast ? "border-stone-300" : ""}`}>
            {renderEventScheduleGrid("compact")}
          </div>

          <div className="flex gap-4 py-5 px-4 md:px-0 mt-4 md:bg-paper-highlight md:px-5 md:border">
            {compactDesktopScheduleRail}

            <div className="offline-hide-when-offline relative h-[112px] w-[112px] shrink-0 overflow-hidden rounded-sm bg-muted">
              {event.image ? (
                <>
                  <Image
                    src={compactThumbnailUrl}
                    alt={event.title}
                    fill
                    className={`offline-image-online object-cover cursor-pointer ${mutedPastImageClass}`}
                    onClick={() => setShowEventImage(true)}
                    sizes="112px"
                    unoptimized
                  />
                  {event.image !== "/placeholder.svg" ? (
                    <button
                      type="button"
                      onClick={() => setShowEventImage(true)}
                      className="absolute bottom-1.5 left-1.5 inline-flex h-6 w-6 items-center justify-center rounded-[2px] border border-white/40 bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-haspopup="dialog"
                      aria-label={`Ampliar imagen de ${event.title}`}
                      style={{ minHeight: "unset", minWidth: "unset" }}
                    >
                      <Maximize2 className="h-3 w-3" aria-hidden="true" />
                    </button>
                  ) : null}
                </>
              ) : (
                <div className="offline-image-online absolute inset-0 flex items-center justify-center">
                  <Church
                    className="h-5 w-5 text-muted-foreground/25"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="min-w-0 space-y-2.5 text-left">
                <span
                  className={`mb-1 inline-flex w-fit items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${mutedPastBadgeClass}`}
                >
                  <EventTypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{eventTypeLabels[eventType]}</span>
                </span>

                <div className="mt-1">
                  <h3
                    className={`text-[24px] md:text-[30px] font-semibold leading-[1.35] ${editorialTitleClass}`}
                  >
                    {event.title}
                  </h3>
                  {registerActionButton && (
                    <div className="mt-4">{registerActionButton}</div>
                  )}
                  <button
                    onClick={handleToggle}
                    className="mt-4 inline-flex max-w-full items-center gap-2 text-[18px] font-semibold leading-tight text-brand-ink transition-colors hover:text-brand-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                  >
                    <span>
                      {isExpanded ? actionMenuExpandedLabel : actionMenuLabel}
                    </span>
                    <ChevronDown
                      className={`h-6 w-6 shrink-0 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </div>

              </div>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="compact-details"
                id={detailsId}
                initial={isMobile ? { height: 0, opacity: 0 } : false}
                animate={{ height: "auto", opacity: 1 }}
                exit={isMobile ? { height: 0, opacity: 0 } : undefined}
                transition={isMobile ? expandTransition : { duration: 0 }}
                onAnimationComplete={() => {
                  if (isExpanded) scrollExpandedDetailsIntoView();
                }}
                className="overflow-hidden bg-paper-highlight border-x border-t md:border-t-0"
              >
                <div className="bg-gradient-to-b from-transparent via-muted/10 to-muted/20 px-5 pb-1 pt-3 bg-paper-highlight border-b">
                  {hasDropdownCtas && (
                    <div className="pb-0 pt-4 md:pt-5">
                      {dropdownCtaButtons}
                    </div>
                  )}
                  {hasMobileCompactDetails && (
                    <div
                      className={`py-2 pb-[-4px] ${hasDropdownCtas ? "pt-5" : ""}`}
                    >
                      {(event.location || event.address) && (
                        <section className="space-y-3">
                          <p className={`text-[17px] font-bold`}>Ubicación</p>
                          {event.location && (
                            <div
                              className={`flex min-w-0 items-start gap-2 text-[15px] leading-snug`}
                            >
                              <Church
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                              />
                              {temploNameNode}
                            </div>
                          )}

                          {event.address && (
                            <div className="flex min-w-0 items-start gap-2 text-[15px] leading-snug mt-[-6px] mb-2">
                              <MapPin
                                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="min-w-0">{event.address}</span>
                            </div>
                          )}

                          {event.location && (
                            <button
                              onClick={() =>
                                openGoogleMaps(
                                  event.googleMapsUrl,
                                  event.address,
                                )
                              }
                              className={compactMobileMapsButtonClass}
                              aria-label={`Abrir ${event.location} en Google Maps`}
                              style={{ minWidth: "unset" }}
                            >
                              <ExternalLink
                                className="h-4 w-4 shrink-0"
                                aria-hidden="true"
                              />
                              Abrir en Google Maps
                            </button>
                          )}
                        </section>
                      )}

                      {hasDescription && (
                        <section
                          className={`${event.location || event.address ? "mt-3 pt-5" : ""} space-y-3`}
                        >
                          <p className={`text-[17px] font-bold`}>Descripción</p>
                          <p
                            className={`text-[18px] leading-relaxed ${editorialTextClass}`}
                          >
                            {event.description}
                          </p>
                        </section>
                      )}
                    </div>
                  )}
                  {hasDetails &&
                    renderExpandedDetails(
                      `${hasMobileCompactDetails ? "pt-5" : "pt-4"} space-y-5 pb-4 md:py-5`,
                    )}
                  <div
                    className={`pb-4 md:pb-5 ${hasDetails || hasDropdownCtas ? "" : "pt-4 md:pt-5"}`}
                  >
                    <div className="[&>div]:mt-3">{eventActionButtons}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </article>

        {vestimentaTooltipNode}
        {moreInfoModal}
        {showEventImage && event.image && event.image !== "/placeholder.svg" ? (
          <Lightbox
            src={event.image}
            alt={event.title}
            onClose={() => setShowEventImage(false)}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      {eventPortals}
      <article
        id={articleId}
        data-eq-card
        className={`self-start overflow-hidden border bg-transparent scroll-mt-[100px] md:mb-15 transition-all duration-700 target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20 ${mutedPastCardClass}`}
      >
        {/* ── Image with date/time strip ── */}
        <div className="offline-hide-when-offline relative h-40 w-full shrink-0 bg-muted">
          {event.image ? (
            <>
              <Image
                src={gridThumbnailUrl}
                alt={event.title}
                fill
                className={`offline-image-online object-cover ${mutedPastImageClass}`}
                onClick={() => setShowEventImage(true)}
                loading="eager"
                sizes="(min-width: 768px) 456px, calc(100vw - 32px)"
                unoptimized
              />
              {event.image !== "/placeholder.svg" ? (
                <button
                  type="button"
                  onClick={() => setShowEventImage(true)}
                  className="group absolute inset-0 z-10 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  aria-haspopup="dialog"
                  aria-label={`Ampliar imagen de ${event.title}`}
                  style={{ minHeight: "unset", minWidth: "unset" }}
                >
                  <span className="absolute bottom-2 left-2 inline-flex h-8 w-8 items-center justify-center rounded-[2px] border border-white/50 bg-black/55 text-white shadow-sm backdrop-blur-sm transition-colors group-hover:bg-black/75">
                    <Maximize2 className="h-4 w-4" aria-hidden="true" />
                  </span>
                </button>
              ) : null}
            </>
          ) : (
            <div className="offline-image-online absolute inset-0 flex items-center justify-center">
              <Church
                className="h-6 w-6 text-muted-foreground/25"
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        <div className={`border-b ${mutedPastPanelClass}`}>
          {renderEventScheduleGrid("grid")}
        </div>

        {/* ── Card body ── */}
        <div className={`p-5 pb-7 ${mutedPast ? "bg-stone-100" : "bg-paper-highlight"}`}>
          <div data-eq-head>
            {/* Event type — plain uppercase label */}
            <span
              className={`mb-3 inline-flex items-center gap-3 rounded-sm border px-2 py-2 text-[13px] font-medium uppercase tracking-[0.12em] ${mutedPastBadgeClass}`}
            >
              <EventTypeIcon
                className="h-6 w-6"
                strokeWidth={1.25}
                aria-hidden="true"
              />
              <span>{eventTypeLabels[eventType]}</span>
            </span>

            {/* Title — editorial type only when this card is opted into Home's bulletin tone. */}
            <h3
              className={`${event.location ? "mb-4" : "mb-0"} text-[28px] font-extrabold leading-[1.25] tracking-tight md:text-[22px] ${editorialTitleClass}`}
            >
              {event.title}
            </h3>

            {/* Location — shown before action buttons */}
            {event.location && (
              <div className="mt-1 space-y-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-start gap-2">
                    <Church
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className={`text-[16px] font-medium leading-snug`}>
                      {temploNameNode}
                    </p>
                  </div>
                  {event.address && (
                    <div className="flex items-start gap-2">
                      <MapPin
                        className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <p
                        className={`text-[16px] leading-snug ${isEditorialTone ? "type-system" : "text-foreground/85"}`}
                      >
                        {event.address}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() =>
                    openGoogleMaps(event.googleMapsUrl, event.address)
                  }
                  className={gridMapsButtonClass}
                  aria-label={`Abrir ${event.location} en Google Maps`}
                  style={{ minWidth: "unset" }}
                >
                  <ExternalLink
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  Abrir en Google Maps
                </button>
              </div>
            )}
          </div>

          {/* ── Action buttons ── */}
          {registerActionButton && (
            <div className="pt-1 mt-1">
              <Button
                onClick={() => onRegister(event)}
                className="mt-3.5 h-auto min-h-10 whitespace-normal py-3 text-center text-sm font-bold leading-tight tracking-[0.01em] bg-brand hover:bg-brand-hover text-white"
              >
                REGISTRARSE
                <ChevronRight
                  className="h-4 w-4 ml-2 shrink-0"
                  aria-hidden="true"
                />
              </Button>
            </div>
          )}

          {!shouldRenderGridDetailsInline && (
            <button
              onClick={handleToggle}
              className="mt-8 inline-flex max-w-full items-center gap-1 text-[18px] font-semibold leading-tight text-brand-ink transition-colors hover:text-brand-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-expanded={isExpanded}
              aria-controls={detailsId}
            >
              <span>
                {isExpanded ? actionMenuExpandedLabel : actionMenuLabel}
              </span>
              <ChevronDown
                className={`h-6 w-6 shrink-0 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
          )}

          {/* El mismo renderer alimenta grid y compact para evitar duplicar detalles. */}
          {shouldRenderGridDetailsInline ? (
            <div
              id={detailsId}
              className="-mx-5 mt-2 md:mt-5 bg-gradient-to-b from-transparent via-muted/10 to-muted/20 pt-2"
            >
              {hasDropdownCtas && (
                <div className="px-5 pb-0 pt-4">{dropdownCtaButtons}</div>
              )}
              {(hasDetails || hasDescription) &&
                renderExpandedDetails(
                  hasDropdownCtas
                    ? "space-y-1 pb-0 pt-5 px-5"
                    : "space-y-1 pb-0 pt-4 px-5",
                  { showDescription: true },
                )}
              <div
                className={`px-5 pb-5 ${
                  hasDetails || hasDropdownCtas
                    ? "[&>div]:mt-5"
                    : "[&>div]:mt-4"
                }`}
              >
                {eventActionButtons}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="grid-details"
                  id={detailsId}
                  initial={isMobile ? { height: 0, opacity: 0 } : false}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={isMobile ? { height: 0, opacity: 0 } : undefined}
                  transition={isMobile ? expandTransition : { duration: 0 }}
                  onAnimationComplete={() => {
                    if (isExpanded) scrollExpandedDetailsIntoView();
                  }}
                  className="-mx-5 mt-1 overflow-hidden bg-gradient-to-b from-transparent via-muted/10 to-muted/20 pt-2"
                >
                  {hasDropdownCtas && (
                    <div className="px-5 pb-0 pt-4">{dropdownCtaButtons}</div>
                  )}
                  {(hasDetails || hasDescription) &&
                    renderExpandedDetails(
                      hasDropdownCtas
                        ? "space-y-1 pb-0 pt-5 px-5"
                        : "space-y-1 pb-0 pt-4 px-5",
                      { showDescription: true },
                    )}
                  <div
                    className={`px-5 pb-5 ${
                      hasDetails || hasDropdownCtas
                        ? "[&>div]:mt-5"
                        : "[&>div]:mt-4"
                    }`}
                  >
                    {eventActionButtons}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </article>

      {vestimentaTooltipNode}
      {moreInfoModal}
      {showEventImage && event.image && event.image !== "/placeholder.svg" ? (
        <Lightbox
          src={event.image}
          alt={event.title}
          onClose={() => setShowEventImage(false)}
        />
      ) : null}
    </>
  );
}

export type { Event };
