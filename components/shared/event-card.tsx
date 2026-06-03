"use client";

import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal, flushSync } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin,
  ExternalLink,
  ChevronDown,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  formatRegionDateRange,
  formatRegionDayMonth,
} from "@/lib/region-date";
import { useTime } from "@/lib/time-context";
import type { Event, Vestimenta, EventType } from "@/lib/types";

interface EventCardProps {
  event: Event;
  onRegister: (event: Event) => void;
  showAlbumButton?: boolean;
  variant?: "grid" | "compact";
}

const eventTypeLabels: Record<EventType, string> = {
  campana: "Campaña",
  convencion: "Convención General",
  recorrido: "Recorrido Regional",
  confraternidadJuvenilRegional: "Confraternidad Juvenil Regional",
  confraternidadJuvenilGeneral: "Confraternidad Juvenil General",
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
  campana: "border-[#2f5e93]/25 bg-[#e6edf6] text-[#2f5e93]",
  convencion: "border-[#8c731e]/25 bg-[#fdf6e1] text-[#8c731e]",
  recorrido: "border-[#1a737f]/25 bg-[#e1f3f6] text-[#1a737f]",
  confraternidadJuvenilRegional:
    "border-[#a83e3e]/25 bg-[#fef2f2] text-[#a83e3e]",
  confraternidadJuvenilGeneral:
    "border-[#a83e3e]/25 bg-[#fef2f2] text-[#a83e3e]",
  cultoJuvenil: "border-[#a83e3e]/25 bg-[#fef2f2] text-[#a83e3e]",
  culto: "border-[#26733a]/25 bg-[#e6f6eb] text-[#26733a]",
  visita: "border-[#1a737f]/25 bg-[#e1f3f6] text-[#1a737f]",
  ensayo: "border-[#26733a]/25 bg-[#e6f6eb] text-[#26733a]",
  actividad: "border-[#26733a]/25 bg-[#e6f6eb] text-[#26733a]",
  estudioBiblico: "border-[#26733a]/25 bg-[#e6f6eb] text-[#26733a]",
  biregional: "border-[#8c731e]/25 bg-[#fdf6e1] text-[#8c731e]",
  congresoBrilla: "border-[#6a3f91]/25 bg-[#f1e6f6] text-[#6a3f91]",
  boda: "border-[#6a3f91]/25 bg-[#f1e6f6] text-[#6a3f91]",
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
  "inline-flex items-center gap-1 w-fit text-sm font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 leading-tight transition-colors";

const MONTHS = [
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

const PASTOR_PENDING_LABEL = "Por confirmar";

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

const buildEventMapsUrl = (event: Event) => {
  if (event.googleMapsUrl) return event.googleMapsUrl;
  if (event.address) return buildGoogleMapsSearchUrl(event.address);
  return "";
};

const openGoogleMaps = (url?: string, address?: string) => {
  const targetUrl = url || (address ? buildGoogleMapsSearchUrl(address) : "");
  if (targetUrl) window.open(targetUrl, "_blank");
};

const expandTransition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function EventCard({
  event,
  onRegister,
  showAlbumButton = false,
  variant = "grid",
}: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
  const { isStandalone } = useInstallPrompt();
  const { isOnline } = useConnectivity();
  const shouldShowOfflineNotice = isStandalone && !isOnline;
  const isMobile = useIsMobile();
  const { currentTime } = useTime();

  const openAlbum = () => {
    if (event.googleDriveAlbumUrl)
      window.open(event.googleDriveAlbumUrl, "_blank");
  };

  const openFacebookPost = () => {
    if (event.facebookPostUrl) window.open(event.facebookPostUrl, "_blank");
  };

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const scrollExpandedDetailsIntoView = () => {
    const el = document.getElementById(`details-${event.id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  /* ── state derivations ── */
  const isPastEvent = event.date.getTime() < currentTime.getTime();
  const hasAlbum = event.albumEnabled && event.googleDriveAlbumUrl;
  const hasFacebookPost = !!event.facebookPostUrl;
  const canRegister = !isPastEvent && event.registrationEnabled !== false;
  const hasDescription = !!event.description && event.description.length > 0;
  const isMultiDay = !!(event.endDate && event.endDate > event.date);
  const eventType = event.eventType || "culto";
  const EventTypeIcon = eventTypeIcons[eventType];
  const eventTypeBadgeClass = eventTypeBadgeClasses[eventType];
  const dateLabel = isMultiDay
    ? formatRegionDateRange(event.date, event.endDate!)
    : formatRegionDayMonth(event.date);
  const eventDateTimeLabel = `${dateLabel} | ${event.time}`;
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

  const buildEventCopyText = () => {
    const sections = [
      [event.title],
      [eventDateTimeLabel],
      [
        [event.location, event.address, eventMapsUrl]
          .filter(Boolean)
          .join("\n"),
      ],
      eventCoordinates ? [eventCoordinates] : [],
      event.alimentos?.enabled
        ? [
            [
              "Alimentos",
              event.alimentos.location,
              event.alimentos.description,
              event.alimentos.googleMapsUrl,
            ]
              .filter(Boolean)
              .join("\n"),
          ]
        : [],
      event.juntaJuvenil?.enabled
        ? [
            [
              "Junta Juvenil",
              event.juntaJuvenil.location,
              event.juntaJuvenil.description,
              event.juntaJuvenil.googleMapsUrl,
            ]
              .filter(Boolean)
              .join("\n"),
          ]
        : [],
      [eventHighlightUrl],
    ].filter((section) => section.length > 0 && section.some(Boolean));

    return sections.map((section) => section.join("\n")).join("\n\n");
  };

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
  const actionMenuLabel = hasDetails ? "Ver más información" : "Opciones";
  const actionMenuExpandedLabel = hasDetails
    ? "Ocultar información"
    : "Ocultar opciones";
  const eventUtilityButtonClass =
    "mt-[-25px] inline-flex h-10 w-fit items-center gap-1.5 rounded-sm border border-border bg-[var(--surface-pane)] px-3 text-sm font-medium text-[var(--brand-ink)] transition-[background-color,border-color] duration-150 hover:border-[var(--brand-ink)] hover:bg-primary/10";
  const eventUtilityButtonSmallClass =
    "inline-flex h-8 w-fit items-center gap-1.5 rounded-sm border border-border bg-[var(--surface-pane)] px-2.5 text-sm font-medium text-[var(--brand-ink)] transition-[background-color,border-color] duration-150 hover:border-[var(--brand-ink)] hover:bg-primary/10";
  const eventPrimaryMapsButtonClass =
    "inline-flex h-10 w-fit items-center gap-1.5 rounded-sm bg-primary px-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#4888b4]";
  const eventPrimaryMapsButtonSmallClass =
    "inline-flex h-8 w-fit items-center gap-1.5 rounded-sm bg-primary px-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#4888b4]";
  const compactDesktopMapsButtonClass =
    "hidden h-8 w-fit items-center gap-1.5 rounded-sm bg-primary px-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#4888b4] md:inline-flex";
  const compactMobileMapsButtonClass = eventPrimaryMapsButtonClass;
  const gridMapsButtonClass = canRegister
    ? `${eventUtilityButtonSmallClass} ml-2 shrink-0 self-center`
    : `${eventPrimaryMapsButtonSmallClass} ml-2 shrink-0 self-center`;
  const speakerBlockClass =
    variant === "grid" ? "space-y-2 mt-[2px]" : "space-y-2 mt-[-4px]";
  const registerActionButton = !isPastEvent && canRegister ? (
    <Button
      onClick={() => onRegister(event)}
      size="sm"
      className="h-8 rounded-none bg-primary px-3 text-sm font-bold text-white hover:bg-primary/90"
    >
      Registrarse
    </Button>
  ) : null;
  const dropdownCtaButtons = hasDropdownCtas ? (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        {hasFacebookPost && (
          <Button
            onClick={openFacebookPost}
            variant="outline"
            className="h-10 w-fit justify-start rounded-none border-border bg-[var(--surface-pane)] px-3 text-sm font-medium text-[var(--brand-ink)] hover:border-[var(--brand-ink)] hover:bg-primary/10"
          >
            <Facebook className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="ml-1.5">Ver en Facebook</span>
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        {hasAlbum && (
          <Button
            onClick={openAlbum}
            variant="outline"
            className="h-10 w-fit justify-start rounded-none border-border bg-[var(--surface-pane)] px-3 text-sm font-medium text-[var(--brand-ink)] hover:border-[var(--brand-ink)] hover:bg-primary/10"
          >
            <Images className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="ml-1.5">Ver Álbum</span>
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
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

  const renderExpandedDetails = (
    containerClassName = "space-y-2 pb-5 pt-5 px-5",
    options: { showDescription?: boolean } = {},
  ) => (
    <div id={`details-${event.id}`} className={containerClassName}>
      {/* En compact desktop la descripcion ya esta visible; aqui solo va cuando haga falta. */}
      {options.showDescription && hasDescription && (
        <div className="space-y-1 mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            DESCRIPCION
          </p>
          <p className="text-[15px] leading-relaxed">{event.description}</p>
        </div>
      )}

      {event.vestimenta && (
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            INFORMACION
          </p>
          <div className="flex items-start gap-2.5">
            <Shirt
              className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1.5"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="flex items-start gap-1.5 text-sm text-foreground">
                <span className="min-w-0">
                  <span className="text-foreground">Vestimenta: </span>
                  <span className="text-muted-foreground">
                    {formatVestimentaValue(event)}
                  </span>
                </span>
                <button
                  ref={vestimentaHelpRef}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowVestimentaHelp((value) => !value);
                  }}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") setShowVestimentaHelp(true);
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === "mouse") setShowVestimentaHelp(false);
                  }}
                  className="inline-flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Informacion sobre la vestimenta"
                  aria-expanded={showVestimentaHelp}
                  style={{ minHeight: "unset", minWidth: "unset" }}
                >
                  <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {(event.speakers?.pastorMensaje || event.speakers?.jovenPreside) && (
        <div className={speakerBlockClass}>
          {event.speakers.pastorMensaje && (
            <div className="flex items-start gap-2.5">
              <User
                className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1"
                aria-hidden="true"
              />
              <p className="text-sm text-foreground">
                <span className="text-foreground">Pastor a cargo: </span>
                <span className="text-muted-foreground">{pastorNameNode}</span>
              </p>
            </div>
          )}
          {event.speakers.jovenPreside && (
            <div className="flex items-start gap-2.5 mb-7 mt-[-4px]">
              <Mic
                className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1"
                aria-hidden="true"
              />
              <p className="text-sm text-foreground">
                <span className="text-foreground">Preside: </span>
                <span className="text-muted-foreground">
                  {event.speakers.jovenPreside}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {event.alimentos?.enabled && (
        <div className="p-3 bg-muted/40 border border-border">
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
                <p className="text-xs text-muted-foreground">
                  {event.alimentos.location}
                </p>
              )}
              {event.alimentos.description && (
                <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">
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
                <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">
                  {event.juntaJuvenil.description}
                </p>
              )}
            </div>
            {event.juntaJuvenil.googleMapsUrl && (
              <button
                onClick={() => openGoogleMaps(event.juntaJuvenil?.googleMapsUrl)}
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
          className="text-sm w-full"
        >
          <Info className="h-4 w-4 mr-1.5" aria-hidden="true" />
          Más información del evento
        </Button>
      )}
    </div>
  );

  const printableSections = [
    {
      id: "datetime",
      label: "Fecha y hora",
      icon: <CalendarDays className="rm-print-icon" aria-hidden="true" />,
      content: <p>{eventDateTimeLabel}</p>,
    },
    ...(event.location || event.address
      ? [{
          id: "location",
          label: "Ubicación",
          icon: <MapPin className="rm-print-icon" aria-hidden="true" />,
          content: (
            <p>
              {event.location}
              {event.address ? `\n${event.address}` : ""}
            </p>
          ),
        }]
      : []),
    ...(eventCoordinates
      ? [{
          id: "coordinates",
          label: "Coordenadas",
          icon: <MapPin className="rm-print-icon" aria-hidden="true" />,
          content: <p>{eventCoordinates}</p>,
        }]
      : []),
    ...(event.alimentos?.enabled
      ? [{
          id: "alimentos",
          label: "Alimentos",
          icon: <Utensils className="rm-print-icon" aria-hidden="true" />,
          content: <p>{eventAlimentosPrintText}</p>,
        }]
      : []),
    ...(event.juntaJuvenil?.enabled
      ? [{
          id: "junta",
          label: "Junta Juvenil",
          icon: <Users className="rm-print-icon" aria-hidden="true" />,
          content: <p>{eventJuntaJuvenilPrintText}</p>,
        }]
      : []),
    ...(event.vestimenta
      ? [{
          id: "vestimenta",
          label: "Vestimenta",
          icon: <Shirt className="rm-print-icon" aria-hidden="true" />,
          content: <p>{formatVestimentaValue(event)}</p>,
        }]
      : []),
    ...(event.speakers?.pastorMensaje
      ? [{
          id: "pastor",
          label: "Pastor a cargo",
          icon: <Mic className="rm-print-icon" aria-hidden="true" />,
          content: <p>{event.speakers.pastorMensaje}</p>,
        }]
      : []),
    ...(event.speakers?.jovenPreside
      ? [{
          id: "preside",
          label: "Preside",
          icon: <User className="rm-print-icon" aria-hidden="true" />,
          content: <p>{event.speakers.jovenPreside}</p>,
        }]
      : []),
    ...(hasDescription
      ? [{
          id: "description",
          label: "Descripción",
          icon: <Info className="rm-print-icon" aria-hidden="true" />,
          content: <p>{event.description}</p>,
        }]
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
            Todos pueden llevar cualquier ropa. Esta vestimenta es solo para jovenes miembros de la iglesia.
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
        createPortal(
          <CopyToast visible={isCopyToastVisible} />,
          document.body,
        )}
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
      {/* En offline evitamos abrir imagenes ampliadas que no siempre estan cacheadas. */}
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
            Requiere conexion a internet
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Para ahorrar datos y almacenamiento, las imagenes ampliadas no se descargan para uso sin conexion.
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
            aria-label="Cerrar imagen de informacion"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </Button>
          <div className="relative aspect-[3/4] w-full overflow-hidden">
            <Image
              src={event.moreInfo.imageUrl}
              alt={`Más información de ${event.title}`}
              fill
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
          id={event.id}
          className=" scroll-mt-[100px] transition-none target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20 md:transition-all md:duration-700"
        >
          <div className="flex gap-3 px-0 py-4 md:gap-5 md:px-0 md:py-0 md:pb-[35px]">
            <div className="offline-hide-when-offline relative h-[72px] w-[72px] shrink-0 bg-muted md:h-[108px] md:w-[112px]">
              {event.image ? (
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="offline-image-online object-cover"
                  sizes="(min-width: 768px) 112px, 72px"
                />
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
              <div className="min-w-0 space-y-3 text-left">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[17px] font-bold leading-snug text-foreground md:text-[19px] mb-3 md:mb-4">
                  <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{dateLabel}</span>
                  <span className="text-muted-foreground/70" aria-hidden="true">
                    |
                  </span>
                  <span className="tabular-nums">{event.time}</span>
                </p>

                <span className={`mb-0.5 inline-flex w-fit items-center gap-1.5 rounded-sm border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] md:text-xs mb-2.5 ${eventTypeBadgeClass}`}>
                  <EventTypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{eventTypeLabels[eventType]}</span>
                </span>

                <h3 className="text-[16px] font-bold leading-snug text-foreground md:text-[21px] mt-1 md:mt-0">
                  {event.title}
                </h3>

                {event.location && (
                  <p className="hidden min-w-0 items-start gap-2 text-[15px] text-muted-foreground leading-snug text-foreground md:flex md:text-[15px] md:mt-4 md:mb-0.5">
                    <Church
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">{event.location}</span>
                  </p>
                )}

                {event.address && (
                  <p className="hidden min-w-0 items-start gap-2 text-[15px] text-muted-foreground leading-snug text-foreground/90 md:flex md:mb-4 md:text-[15px]">
                    <MapPin
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">{event.address}</span>
                  </p>
                )}

                {hasDescription && (
                  <p className="hidden text-[15px] leading-snug md:block md:text-[16px]">
                    {event.description}
                  </p>
                )}

              </div>

              <div className="mt-3 flex flex-col items-start gap-2 md:flex-row md:flex-wrap md:items-center md:mt-6">
                {registerActionButton}

                <button
                  onClick={handleToggle}
                  className="inline-flex h-8 w-fit items-center gap-1.5 rounded-sm border border-border bg-[var(--surface-pane)] px-2.5 text-sm font-medium text-[var(--brand-ink)] transition-[background-color,border-color] duration-150 hover:border-[var(--brand-ink)] hover:bg-primary/10 md:hidden"
                  aria-expanded={isExpanded}
                  aria-controls={`details-${event.id}`}
                  style={{ minHeight: "unset", minWidth: "unset" }}
                >
                  <span>{isExpanded ? actionMenuExpandedLabel : actionMenuLabel}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                <button
                  onClick={handleToggle}
                  className="hidden h-8 w-fit items-center gap-1.5 rounded-sm border border-border bg-[var(--surface-pane)] px-2.5 text-sm font-medium text-[var(--brand-ink)] transition-[background-color,border-color] duration-150 hover:border-[var(--brand-ink)] hover:bg-primary/10 md:inline-flex"
                  aria-expanded={isExpanded}
                  aria-controls={`details-${event.id}`}
                  style={{ minHeight: "unset", minWidth: "unset" }}
                >
                  <span>{isExpanded ? actionMenuExpandedLabel : actionMenuLabel}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {event.location && (
                  <button
                    onClick={() => openGoogleMaps(event.googleMapsUrl, event.address)}
                    className={compactDesktopMapsButtonClass}
                    aria-label={`Abrir ${event.location} en Google Maps`}
                    style={{ minHeight: "unset", minWidth: "unset" }}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Maps
                  </button>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="compact-details"
                initial={isMobile ? { height: 0, opacity: 0 } : false}
                animate={{ height: "auto", opacity: 1 }}
                exit={isMobile ? { height: 0, opacity: 0 } : undefined}
                transition={isMobile ? expandTransition : { duration: 0 }}
                onAnimationComplete={() => {
                  if (isExpanded) scrollExpandedDetailsIntoView();
                }}
                className="overflow-hidden"
              >
                <div className="border-t border-border/80 bg-muted/20">
                  {hasDropdownCtas && (
                    <div className="px-3 pb-0 pt-4 md:px-5 md:pt-5">
                      {dropdownCtaButtons}
                    </div>
                  )}
                  {hasMobileCompactDetails && (
                    <div className={`space-y-4 px-3 py-4 md:hidden ${hasDropdownCtas ? "pt-5" : ""}`}>
                      {(event.location || event.address) && (
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <span>UBICACION</span>
                        </p>
                      )}
                      {event.location && (
                        <div className="flex min-w-0 items-start gap-2 text-[15px] leading-snug text-foreground mt-[-7px]">
                          <Church
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span className="min-w-0">{event.location}</span>
                        </div>
                      )}

                      {event.address && (
                        <div className="flex min-w-0 items-start gap-2 text-[15px] leading-snug mt-[-12px]">
                          <MapPin
                            className="mt-0.5 h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="min-w-0">{event.address}</span>
                        </div>
                      )}

                      {event.location && (
                        <button
                          onClick={() => openGoogleMaps(event.googleMapsUrl, event.address)}
                          className={compactMobileMapsButtonClass}
                          aria-label={`Abrir ${event.location} en Google Maps`}
                          style={{ minHeight: "unset", minWidth: "unset" }}
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          Maps
                        </button>
                      )}

                      {hasDescription && (
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-3">
                            DESCRIPCION
                          </p>
                          <p className="text-[15px] leading-relaxed">
                            {event.description}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {hasDetails &&
                    renderExpandedDetails("space-y-2 px-3 py-4 md:px-5 md:py-5")}
                  <div className={`px-3 pb-4 md:px-5 md:pb-5 ${hasDetails || hasDropdownCtas ? "" : "pt-4 md:pt-5"}`}>
                    <div className="[&>div]:mt-0">
                      {eventActionButtons}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </article>

        {vestimentaTooltipNode}
        {moreInfoModal}
      </>
    );
  }

  return (
    <>
      {eventPortals}
      <article
        id={event.id}
        data-eq-card
        className="desktop-card-lift self-start bg-card border border-border/80 overflow-hidden scroll-mt-[100px] transition-all duration-700 target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20"
      >
        {/* ── Image with date/time strip ── */}
        <div className="offline-hide-when-offline relative h-40 w-full shrink-0 bg-muted">
          {event.image ? (
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="offline-image-online object-cover"
              loading="eager"
              priority
            />
          ) : (
            <div className="offline-image-online absolute inset-0 flex items-center justify-center">
              <Church
                className="h-6 w-6 text-muted-foreground/25"
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        <div className="flex w-full items-center justify-between gap-3 border-b border-border/80 bg-[#ffffff] px-4 py-3 text-[17px] md:text-[17px] font-bold leading-tight text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
          <div className="flex min-w-0 items-center gap-1.5">
            <CalendarDays
              className="h-5 w-5 shrink-0 text-foreground mr-0.5"
              aria-hidden="true"
            />
            <span className="truncate">{dateLabel}</span>
          </div>
          <span className="shrink-0 tabular-nums text-foreground">
            {event.time}
          </span>
        </div>

        {/* ── Card body ── */}
        <div className="p-5">
          <div data-eq-head>
            {/* Event type — plain uppercase label */}
            <span className={`mb-2.5 inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[13px] font-semibold uppercase tracking-[0.12em] ${eventTypeBadgeClass}`}>
              <EventTypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{eventTypeLabels[eventType]}</span>
            </span>

            {/* Title — Playfair Display for stronger editorial weight */}
            <h3 className="text-[22px] md:text-[23px] font-bold text-foreground leading-[1.2] mb-7 tracking-tight">
              {event.title}
            </h3>

            {/* Location — shown before action buttons */}
            {event.location && (
              <div className="mt-1 mb-4 flex items-center gap-2.5">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start gap-2">
                    <Church
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="text-[15px] font-medium text-foreground leading-snug">
                      {event.location}
                    </p>
                  </div>
                  {event.address && (
                    <div className="flex items-start gap-2">
                      <MapPin
                        className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <p className="text-[15px] leading-snug text-foreground/85">
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
                  style={{ minHeight: "unset", minWidth: "unset" }}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Maps
                </button>
              </div>
            )}
          </div>

          {/* ── Action buttons ── */}
          {registerActionButton && (
            <div className="pt-1 mt-1">
              <Button
                onClick={() => onRegister(event)}
                className="mt-3.5 text-sm py-5 font-bold tracking-[0.01em] bg-primary hover:bg-primary/90 text-white"
              >
                REGISTRARSE
                <ChevronRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </Button>
            </div>
          )}

          {/* El menu siempre incluye copiar/imprimir, aunque no haya mas detalles. */}
          <div className="-mx-5 mb-0 mt-6 border-t border-border">
            <button
              onClick={handleToggle}
              className="w-full px-5 flex items-center justify-between py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-expanded={isExpanded}
              aria-controls={`details-${event.id}`}
              style={{
                minHeight: "unset",
                minWidth: "unset",
                background: "none",
                border: "none",
              }}
            >
              <span>
                {isExpanded ? actionMenuExpandedLabel : actionMenuLabel}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {/* El mismo renderer alimenta grid y compact para evitar duplicar detalles. */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="grid-details"
                  initial={isMobile ? { height: 0, opacity: 0 } : false}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={isMobile ? { height: 0, opacity: 0 } : undefined}
                  transition={isMobile ? expandTransition : { duration: 0 }}
                  onAnimationComplete={() => {
                    if (isExpanded) scrollExpandedDetailsIntoView();
                  }}
                  className="overflow-hidden"
                >
                  {hasDropdownCtas && (
                    <div className="px-5 pb-0 pt-2.5 md:pt-2.5 mt-1">
                      {dropdownCtaButtons}
                    </div>
                  )}
                  {(hasDetails || hasDescription) &&
                    renderExpandedDetails(
                      hasDropdownCtas
                        ? "space-y-1 pb-0 pt-5 px-5"
                        : "space-y-1 pb-0 pt-2.5 md:pt-2.5 px-5 mt-1",
                      { showDescription: true },
                    )}
                  <div
                    className={`px-5 pb-5 ${
                      hasDetails || hasDropdownCtas ? "[&>div]:mt-5" : "[&>div]:mt-0"
                    }`}
                  >
                    {eventActionButtons}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </article>

      {vestimentaTooltipNode}
      {moreInfoModal}
    </>
  );
}

export type { Event };
