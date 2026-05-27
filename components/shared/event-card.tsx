"use client";

import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import {
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
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
import { useConnectivity } from "@/hooks/use-connectivity";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
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

const vestimentaLabels: Record<Vestimenta, string> = {
  uniformeMGR: "Uniforme MGR",
  formalCasual: "Formal/Casual",
  informal: "Informal",
  otro: "Especial",
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
  const [vestimentaTooltipStyle, setVestimentaTooltipStyle] =
    useState<CSSProperties | null>(null);
  const vestimentaHelpRef = useRef<HTMLButtonElement>(null);
  const { isStandalone } = useInstallPrompt();
  const { isOnline } = useConnectivity();
  const shouldShowOfflineNotice = isStandalone && !isOnline;
  const { currentTime } = useTime();

  /* ── date helpers (UTC to avoid hydration drift) ── */
  const formatDate = (date: Date) => {
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
    return `${date.getUTCDate()} ${months[date.getUTCMonth()]}`;
  };

  const formatDateRange = (start: Date, end: Date) => {
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
    const sd = start.getUTCDate();
    const ed = end.getUTCDate();
    const sm = months[start.getUTCMonth()];
    const em = months[end.getUTCMonth()];
    return sm === em ? `${sd} y ${ed} ${sm}` : `${sd} ${sm} hasta el ${ed} ${em}`;
  };

  const openGoogleMaps = (url?: string, address?: string) => {
    if (url) {
      window.open(url, "_blank");
    } else if (address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
        "_blank",
      );
    }
  };

  const openAlbum = () => {
    if (event.googleDriveAlbumUrl)
      window.open(event.googleDriveAlbumUrl, "_blank");
  };

  const openFacebookPost = () => {
    if (event.facebookPostUrl) window.open(event.facebookPostUrl, "_blank");
  };

  const handleToggle = () => {
    setIsExpanded((prev) => {
      if (!prev) {
        setTimeout(() => {
          const el = document.getElementById(`details-${event.id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }, 100);
      }
      return !prev;
    });
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
  const dateLabel = isMultiDay
    ? formatDateRange(event.date, event.endDate!)
    : formatDate(event.date);

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
  const compactHasDetails = hasDetails || hasMobileCompactDetails;
  const showCompactMobileInfoButton = compactHasDetails;
  const showCompactDesktopInfoButton = hasDetails;
  const compactPrimaryAction = isPastEvent ? (
    hasAlbum || hasFacebookPost ? (
      <>
        {hasAlbum && (
          <Button
            onClick={openAlbum}
            size="sm"
            className="h-8 rounded-none bg-primary px-2.5 text-sm text-white hover:bg-primary/90"
          >
            <Images className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Álbum
          </Button>
        )}
        {hasFacebookPost && (
          <Button
            onClick={openFacebookPost}
            size="sm"
            variant={hasAlbum ? "outline" : "default"}
            className="h-8 rounded-none px-2.5 text-sm"
          >
            <Facebook className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Facebook
          </Button>
        )}
      </>
    ) : null
  ) : canRegister ? (
    <Button
      onClick={() => onRegister(event)}
      size="sm"
      className="h-8 rounded-none bg-primary px-3 text-sm font-bold text-white hover:bg-primary/90"
    >
      Registrarse
    </Button>
  ) : null;

  const renderExpandedDetails = (containerClassName = "space-y-2 pb-5 pt-5 px-5") => (
    <div id={`details-${event.id}`} className={containerClassName}>
      {event.vestimenta && (
        <div className="flex items-start gap-2.5">
          <Shirt
            className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <p className="flex items-start gap-1.5 text-sm text-foreground">
              <span className="min-w-0">
                <span className="text-muted-foreground">Vestimenta · </span>
                {vestimentaLabels[event.vestimenta]}
                {event.vestimenta === "otro" && event.vestimentaCustom
                  ? ` · ${event.vestimentaCustom}`
                  : ""}
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
      )}

      {(event.speakers?.pastorMensaje || event.speakers?.jovenPreside) && (
        <div className="space-y-2">
          {event.speakers.pastorMensaje && (
            <div className="flex items-start gap-2.5">
              <Mic
                className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1"
                aria-hidden="true"
              />
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Pastor · </span>
                {event.speakers.pastorMensaje}
              </p>
            </div>
          )}
          {event.speakers.jovenPreside && (
            <div className="flex items-start gap-2.5 mb-7">
              <User
                className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1"
                aria-hidden="true"
              />
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Preside · </span>
                {event.speakers.jovenPreside}
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

  if (variant === "compact") {
    return (
      <>
        <article
          id={event.id}
          className="bg-card border-y border-border/80 scroll-mt-[100px] transition-none target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20 md:border-x md:transition-all md:duration-700"
        >
          <div className="flex gap-3 px-0 py-4 md:gap-5 md:px-4 md:py-5">
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

                <p className="mb-0.5 flex w-fit items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2f5e93] md:text-xs">
                  <EventTypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{eventTypeLabels[eventType]}</span>
                </p>

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
                {compactPrimaryAction}

                {showCompactMobileInfoButton && (
                  <button
                    onClick={handleToggle}
                    className="inline-flex h-8 items-center gap-1.5 border border-border bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
                    aria-expanded={isExpanded}
                    aria-controls={`details-${event.id}`}
                    style={{ minHeight: "unset", minWidth: "unset" }}
                  >
                    <span>{isExpanded ? "Ocultar" : "Más información"}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                )}

                {showCompactDesktopInfoButton && (
                  <button
                    onClick={handleToggle}
                    className="hidden h-8 items-center gap-1.5 border border-border bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
                    aria-expanded={isExpanded}
                    aria-controls={`details-${event.id}`}
                    style={{ minHeight: "unset", minWidth: "unset" }}
                  >
                    <span>{isExpanded ? "Ocultar" : "Más información"}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                )}

                {event.location && (
                  <button
                    onClick={() => openGoogleMaps(event.googleMapsUrl, event.address)}
                    className="hidden h-8 items-center gap-1.5 border border-border bg-background px-2.5 text-sm font-medium text-[#2f5e93] transition-colors hover:bg-muted md:inline-flex"
                    aria-label={`Abrir ${event.location} en Google Maps`}
                    style={{ minHeight: "unset", minWidth: "unset" }}
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    Maps
                  </button>
                )}
              </div>
            </div>
          </div>

          {compactHasDetails && isExpanded && (
            <div className="border-t border-border/80 bg-muted/20">
              {hasMobileCompactDetails && (
                <div className="space-y-4 px-3 py-4 md:hidden">
                  {event.location && (
                    <div className="flex min-w-0 items-start gap-2 text-[15px] leading-snug text-foreground">
                      <Church
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0">{event.location}</span>
                    </div>
                  )}

                  {event.address && (
                    <div className="flex min-w-0 items-start gap-2 text-[15px] leading-snug text-foreground/90">
                      <MapPin
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0">{event.address}</span>
                    </div>
                  )}

                  {event.location && (
                    <button
                      onClick={() => openGoogleMaps(event.googleMapsUrl, event.address)}
                      className="inline-flex h-9 items-center gap-1.5 border border-border bg-background px-3 text-sm font-medium text-[#2f5e93] transition-colors hover:bg-muted"
                      aria-label={`Abrir ${event.location} en Google Maps`}
                      style={{ minHeight: "unset", minWidth: "unset" }}
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      Maps
                    </button>
                  )}

                  {hasDescription && (
                    <p className="text-[15px] leading-relaxed text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                </div>
              )}
              {hasDetails &&
                renderExpandedDetails("space-y-2 px-3 py-4 md:px-5 md:py-5")}
            </div>
          )}
        </article>

        {vestimentaTooltipNode}

        {showMoreInfoImage && event.moreInfo?.imageUrl && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowMoreInfoImage(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Información adicional del evento"
          >
            {shouldShowOfflineNotice ? (
              <div
                className="relative w-full max-w-[360px] border border-border bg-background p-5 text-center shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMoreInfoImage(false)}
                  className="absolute right-2 top-2 h-8 w-8"
                  aria-label="Cerrar información adicional"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Wifi className="mx-auto mb-3 h-7 w-7 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">
                  Imagen no disponible sin conexión
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Conéctate a internet para ver esta información adicional.
                </p>
              </div>
            ) : (
              <div
                className="relative max-h-[90vh] max-w-[90vw]"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMoreInfoImage(false)}
                  className="absolute -right-2 -top-2 z-10 h-9 w-9 rounded-full bg-background text-foreground shadow-lg"
                  aria-label="Cerrar información adicional"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
                <Image
                  src={event.moreInfo.imageUrl}
                  alt={`Más información de ${event.title}`}
                  width={1200}
                  height={1600}
                  className="max-h-[90vh] w-auto object-contain"
                />
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <article 
        id={event.id}
        data-eq-card
        className="desktop-card-lift bg-card border border-border/80 overflow-hidden flex flex-col scroll-mt-[100px] transition-all duration-700 target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20 md:min-h-[520px]"
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

        <div className="flex w-full items-center justify-between gap-3 border-b border-border/80 bg-muted/55 px-4 py-3 text-[20px] md:text-[21px] font-bold leading-tight text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
          <div className="flex min-w-0 items-center gap-1.5">
            <CalendarDays
              className="h-5 w-5 shrink-0 text-foreground"
              aria-hidden="true"
            />
            <span className="truncate">{dateLabel}</span>
          </div>
          <span className="shrink-0 tabular-nums text-foreground">
            {event.time}
          </span>
        </div>

        {/* ── Card body ── */}
        <div className="p-5 flex flex-col flex-1">
          <div data-eq-head>
          {/* Event type — plain uppercase label */}
          <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#2f5e93] mb-2.5">
            <EventTypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{eventTypeLabels[eventType]}</span>
          </p>

          {/* Title — Inter bold, no serif */}
          <h3 className="text-[22px] md:text-[23px] font-bold text-foreground leading-[1.2] mb-7 font-sans tracking-tight">
            {event.title}
          </h3>

          {/* Description — always shown, 3-line clamp */}
          {hasDescription && (
            <p className="text-[15px] leading-relaxed line-clamp-3 mb-8">
              {event.description}
            </p>
          )}

          {/* Location — shown before action buttons */}
          {event.location && (
            <div className="mt-1 mb-4 flex items-start gap-2.5">
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
                className="ml-2 self-start mt-1 flex items-center gap-1.5 text-sm font-medium text-[#2f5e93] border border-[#2f5e93]/35 bg-[#2f5e93]/5 hover:bg-[#2f5e93]/10 rounded-none px-2.5 py-1 transition-colors shrink-0"
                aria-label={`Abrir ${event.location} en Google Maps`}
                style={{ minHeight: "unset", minWidth: "unset" }}
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Maps
              </button>
            </div>
          )}

          </div>
          {/* Spacer pushes actions to bottom */}
          <div className="flex-1" />

          {/* ── Action buttons — ALWAYS VISIBLE ── */}
          {(isPastEvent || canRegister) && (
            <div className="border-t border-border/70 pt-3 mt-1">
              {isPastEvent ? (
              <div className="mt-3.5 gap-2">
                {hasAlbum && (
                  <Button
                    onClick={openAlbum}
                    className="bg-primary hover:bg-primary/90 text-white "
                  >
                    <Images className="h-4 w-4 mr-2" aria-hidden="true" />
                    Ver Álbum
                    <ChevronRight className="h-4 w-4 ml-2" aria-hidden="true" />
                  </Button>
                )}
                {hasFacebookPost && (
                  <Button
                    onClick={openFacebookPost}
                    variant={hasAlbum ? "outline" : "default"}
                    className={`flex-1 text-sm ${
                      !hasAlbum
                        ? "bg-primary hover:bg-primary/90 text-white"
                        : ""
                    }`}
                  >
                    <Facebook className="h-4 w-4 mr-2" aria-hidden="true" />
                    Ver en Facebook
                    <ChevronRight className="h-4 w-4 ml-2" aria-hidden="true" />
                  </Button>
                )}
                {!hasAlbum && !hasFacebookPost && (
                  <Button
                    disabled
                    variant="secondary"
                    className="text-sm"
                  >
                    Evento finalizado
                    <ChevronRight className="h-4 w-4 ml-2" aria-hidden="true" />
                  </Button>
                )}
              </div>
              ) : (
                <Button
                  onClick={() => onRegister(event)}
                  className="mt-3.5 text-sm py-5 font-bold tracking-[0.01em] bg-primary hover:bg-primary/90 text-white"
                >
                  REGISTRARSE
                  <ChevronRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
              )}
            </div>
          )}

          {/* ── "Ver más información" — plain text toggle, NOT a button ── */}
          {hasDetails && (
            <div className="-mx-5 mt-6 border-t border-border">
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
                  {isExpanded ? "Ocultar información" : "Ver más información"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {/* ── Expanded details ── */}
              {isExpanded && (
                <div id={`details-${event.id}`} className="space-y-2 pb-5 pt-5 px-5">
                  {/* Vestimenta */}
                  {event.vestimenta && (
                    <div className="flex items-start gap-2.5">
                      <Shirt
                        className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1"
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="flex items-start gap-1.5 text-sm text-foreground">
                          <span className="min-w-0">
                          <span className="text-muted-foreground">
                            Vestimenta ·{" "}
                          </span>
                          {vestimentaLabels[event.vestimenta]}
                          {event.vestimenta === "otro" && event.vestimentaCustom
                            ? ` · ${event.vestimentaCustom}`
                            : ""}
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
                  )}

                  {/* Speakers */}
                  {(event.speakers?.pastorMensaje ||
                    event.speakers?.jovenPreside) && (
                    <div className="space-y-2">
                      {event.speakers.pastorMensaje && (
                        <div className="flex items-start gap-2.5">
                          <Mic
                            className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1"
                            aria-hidden="true"
                          />
                          <p className="text-sm text-foreground">
                            <span className="text-muted-foreground">
                              Pastor ·{" "}
                            </span>
                            {event.speakers.pastorMensaje}
                          </p>
                        </div>
                      )}
                      {event.speakers.jovenPreside && (
                        <div className="flex items-start gap-2.5 mb-7">
                          <User
                            className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1"
                            aria-hidden="true"
                          />
                          <p className="text-sm text-foreground">
                            <span className="text-muted-foreground">
                              Preside ·{" "}
                            </span>
                            {event.speakers.jovenPreside}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Alimentos */}
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
                            onClick={() =>
                              openGoogleMaps(event.alimentos?.googleMapsUrl)
                            }
                            className="mt-4 mr-5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            aria-label="Ver ubicación de alimentos en Maps"
                            style={{ minHeight: "unset", minWidth: "unset" }}
                          >
                            <MapPin
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Junta Juvenil */}
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
                            onClick={() =>
                              openGoogleMaps(event.juntaJuvenil?.googleMapsUrl)
                            }
                            className="mt-4 mr-5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            aria-label="Ver ubicación de junta juvenil en Maps"
                            style={{ minHeight: "unset", minWidth: "unset" }}
                          >
                            <MapPin
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Más Info image */}
                  {!isPastEvent &&
                    event.moreInfo?.enabled &&
                    event.moreInfo.imageUrl && (
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
              )}
            </div>
          )}
        </div>
      </article>

      {vestimentaTooltipNode}

      {/* ── "Más Info" image modal ── */}
      {showMoreInfoImage && event.moreInfo?.imageUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowMoreInfoImage(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Información adicional del evento"
        >
          {shouldShowOfflineNotice ? (
            <div
              className="relative w-full max-w-[360px] border border-border bg-background p-5 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMoreInfoImage(false)}
                className="absolute right-2 top-2 h-9 w-9 rounded-none"
                aria-label="Cerrar aviso"
              >
                <X className="h-4 w-4" />
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
            <div className="relative max-w-lg w-full max-h-[90vh]">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMoreInfoImage(false)}
                className="absolute -top-12 right-0 text-white hover:bg-white/20 rounded-full"
                aria-label="Cerrar imagen de informacion"
              >
                <X className="h-6 w-6" />
              </Button>
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                <Image
                  src={event.moreInfo.imageUrl}
                  alt="Mas informacion del evento"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export type { Event };
