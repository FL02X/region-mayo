"use client";

import { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal, flushSync } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Bricolage_Grotesque } from "next/font/google";
import {
  AlertTriangle,
  ChevronDown,
  Check,
  MapPin,
  ExternalLink,
  Church,
  LoaderCircle,
  Users,
  User,
  Clock,
  FileText,
  XCircle,
  Maximize2,
} from "lucide-react";
import { useEqualizeCardRowHeads } from "@/hooks/use-equalize-card-row-heads";
import { useGeolocationState } from "@/hooks/use-geolocation-state";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNearbyChurchDistances } from "@/hooks/use-nearby-church-distances";
import { WhatsAppIconButton } from "@/components/shared/whatsapp-button";
import { OfflineImagePlaceholder } from "@/components/shared/offline-image-placeholder";
import { CopyPrintActions } from "@/components/shared/copy-print-actions";
import { ViewModeToggle, type ViewMode } from "@/components/shared/view-mode-toggle";
import { TemploImageGallery } from "./templo-image-gallery";
import { DistanceBadge } from "./distance-badge";
import { SearchBar } from "@/components/shared/search-bar-sections";
import { HighlightedText } from "@/components/shared/highlighted-text";
import { findNearestChurches } from "@/lib/location-service";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { sanityImageVariantUrl } from "@/lib/sanity/image";
import { searchItems, SEARCH_CONFIGS } from "@/lib/search-utils";
import {
  formatTempleServiceLine,
  getTempleAvailability,
  getSortedTempleServices,
} from "@/lib/templo-schedule";
import { useTime } from "@/lib/time-context";
import type { Templo } from "@/lib/types";
import type { DistanceResult } from "@/lib/location-service";

const cardTitleFont = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  preload: false,
});

const DISTANCE_ORDER_STORAGE_KEY = "region-mayo-templos-distance-order";
const DISTANCE_ORDER_ENABLED_KEY = "region-mayo-templos-distance-order-enabled";
const SHOW_DISTANCE_BADGES_KEY = "region-mayo-templos-show-distance-badges";
const GPS_HIGHLIGHT_KEY = "region-mayo-templos-gps-highlight";
const GPS_HIGHLIGHT_USED_KEY = "region-mayo-templos-gps-highlight-consumed";
const SKIP_ONLINE_TOAST_KEY = "rm-skip-online-toast";
const expandTransition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};

type LocationSearchState = "idle" | "searching" | "warning" | "error";
type DistanceMap = Record<string, DistanceResult>;

const formatPresidentShortName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return name;
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1]}`;
};

const buildGoogleMapsLink = (templo: Templo) => {
  if (templo.googleMapsUrl) return templo.googleMapsUrl;
  if (
    typeof templo.latitude === "number" &&
    typeof templo.longitude === "number"
  ) {
    return `https://www.google.com/maps?q=${templo.latitude},${templo.longitude}`;
  }
  return "";
};

const buildTempleCopyText = (templo: Templo, scheduleLines: string[]) => {
  const templePhone = templo.phone ? formatPhoneForDisplay(templo.phone) : "";
  const pastorPhone = templo.pastores[0]?.phone
    ? formatPhoneForDisplay(templo.pastores[0].phone)
    : "";
  const googleMapsLink = buildGoogleMapsLink(templo);
  const sections = [
    [templo.temploName],
    scheduleLines,
    templo.address ? [templo.address] : [],
    templePhone || pastorPhone ? [templePhone || pastorPhone] : [],
    typeof templo.latitude === "number" && typeof templo.longitude === "number"
      ? [`${templo.latitude}, ${templo.longitude}`]
      : [],
    googleMapsLink ? [googleMapsLink] : [],
  ].filter((section) => section.length > 0);

  return sections.map((section) => section.join("\n")).join("\n\n");
};

const getPrintableTemplePhotoUrl = (templo: Templo) => {
  const firstPhoto = templo.photos?.[0];
  if (!firstPhoto) return "";

  return sanityImageVariantUrl(firstPhoto, {
    width: 1200,
    quality: 78,
    format: "webp",
    fit: "max",
  });
};

const waitForImageReady = (src: string) => {
  if (!src) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const image = new Image();
    const timeout = window.setTimeout(resolve, 2500);
    const finish = () => {
      window.clearTimeout(timeout);
      resolve();
    };

    image.onload = async () => {
      try {
        if (image.decode) {
          await image.decode();
        }
      } catch {
        // Loading is enough for print; decode can fail on some browsers.
      }
      finish();
    };
    image.onerror = finish;
    image.src = src;

    if (image.complete) {
      finish();
    }
  });
};

const waitForNextPaint = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });

function PrintableTemploSheet({ templo }: { templo: Templo }) {
  const scheduleServices = getSortedTempleServices(templo.schedule);
  const firstPhotoUrl = getPrintableTemplePhotoUrl(templo);

  return (
    <div className="templo-print-sheet">
      <style>{`
        @media screen {
          .templo-print-root {
            position: fixed;
            inset: 0;
            width: 0;
            height: 0;
            overflow: hidden;
            opacity: 0;
            pointer-events: none;
          }
        }

        @media print {
          @page {
            size: landscape;
            margin: 12mm;
          }

          body > *:not(.templo-print-root) {
            display: none !important;
          }

          .templo-print-root {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            color: #1f2933;
            background: white;
          }

          .templo-print-sheet {
            width: 100%;
            font-family: var(--font-sans);
          }

          .templo-print-card {
            display: grid;
            grid-template-columns: minmax(220px, 32%) 1fr;
            gap: 22px;
            border: 1px solid var(--border);
            padding: 20px;
            break-inside: avoid;
          }

          .templo-print-photo {
            width: 100%;
            aspect-ratio: 4 / 3;
            object-fit: cover;
            background: var(--muted);
          }

          .templo-print-placeholder {
            width: 100%;
            aspect-ratio: 4 / 3;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--muted);
            color: var(--muted-foreground);
          }

          .templo-print-title {
            margin: 0 0 10px;
            font-size: 24px;
            line-height: 1.2;
            font-weight: 700;
          }

          .templo-print-sections {
            display: grid;
            gap: 14px;
          }

          .templo-print-section {
            display: grid;
            grid-template-columns: 24px 1fr;
            gap: 10px;
            align-items: start;
          }

          .templo-print-label {
            margin: 0 0 2px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--muted-foreground);
          }

          .templo-print-text {
            margin: 0;
            font-size: 15px;
            line-height: 1.45;
            white-space: pre-line;
          }

          .templo-print-list {
            margin: 0;
            padding: 0;
            list-style: none;
            display: grid;
            gap: 3px;
          }

          .templo-print-icon {
            width: 18px;
            height: 18px;
            color: var(--muted-foreground);
            margin-top: 2px;
          }
        }
      `}</style>
      <article className="templo-print-card">
        <div>
          {firstPhotoUrl ? (
            <img
              className="templo-print-photo"
              src={firstPhotoUrl}
              alt={templo.temploName}
            />
          ) : (
            <div className="templo-print-placeholder">
              <Church className="h-10 w-10" aria-hidden="true" />
            </div>
          )}
        </div>

        <div>
          <h1 className="templo-print-title">{templo.temploName}</h1>
          <div className="templo-print-sections">
            {scheduleServices.length > 0 && (
              <section className="templo-print-section">
                <Clock className="templo-print-icon" aria-hidden="true" />
                <div>
                  <p className="templo-print-label">Horarios de Reunión</p>
                  <ul className="templo-print-list">
                    {scheduleServices.map((service, idx) => (
                      <li
                        key={`${service.day}-${service.startTime}-${idx}`}
                        className="templo-print-text"
                      >
                        {formatTempleServiceLine(service)}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {templo.address && (
              <section className="templo-print-section">
                <MapPin className="templo-print-icon" aria-hidden="true" />
                <div>
                  <p className="templo-print-label">Dirección</p>
                  <p className="templo-print-text">{templo.address}</p>
                </div>
              </section>
            )}

            {templo.pastores.length > 0 && templo.pastores.map((pastor) => (
              <section key={pastor.id} className="templo-print-section">
                <User className="templo-print-icon" aria-hidden="true" />
                <div>
                  <p className="templo-print-label">
                    {templo.pastores.length > 1 ? "Pastores a Cargo" : "Pastor a Cargo"}
                  </p>
                  <p className="templo-print-text">
                    {pastor.fullName}
                    {pastor.phone ? `\n${formatPhoneForDisplay(pastor.phone)}` : ""}
                  </p>
                </div>
              </section>
            ))}

            {templo.coros.length > 0 && templo.coros.map((coro) => (
              <section key={coro.id} className="templo-print-section">
                <Users className="templo-print-icon" aria-hidden="true" />
                <div>
                  <p className="templo-print-label">
                    {templo.coros.length > 1 ? "Coros Locales" : "Coro Local"}
                  </p>
                  <p className="templo-print-text">
                    {coro.coroName}
                    {`\nPresidente: ${formatPresidentShortName(coro.presidentName)}`}
                    {coro.presidentPhone ? ` · ${formatPhoneForDisplay(coro.presidentPhone)}` : ""}
                  </p>
                </div>
              </section>
            ))}

            {typeof templo.latitude === "number" && typeof templo.longitude === "number" && (
              <section className="templo-print-section">
                <MapPin className="templo-print-icon" aria-hidden="true" />
                <div>
                  <p className="templo-print-label">Coordenadas GPS</p>
                  <p className="templo-print-text">
                    {templo.latitude}, {templo.longitude}
                  </p>
                </div>
              </section>
            )}

            {templo.description && (
              <section className="templo-print-section">
                <FileText className="templo-print-icon" aria-hidden="true" />
                <div>
                  <p className="templo-print-label">Notas adicionales</p>
                  <p className="templo-print-text">{templo.description}</p>
                </div>
              </section>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

function TemploCard({ 
  templo, 
  searchQuery,
  distance,
  showDistance,
  onCopied,
  onPrint,
  variant = "grid",
}: { 
  templo: Templo; 
  searchQuery: string;
  distance?: any;
  showDistance?: boolean;
  onCopied: () => void;
  onPrint: (templo: Templo) => void;
  variant?: ViewMode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = useState(false);
  const { currentTime } = useTime();
  const scheduleServices = useMemo(
    () => getSortedTempleServices(templo.schedule),
    [templo.schedule]
  );
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const availability = useMemo(
    () => (isMounted ? getTempleAvailability(templo.schedule, currentTime) : null),
    [templo.schedule, currentTime, isMounted]
  );

  const availabilityBadgeClasses = useMemo(() => {
    if (!availability) {
      return "bg-white border border-border text-slate-700";
    }

    const title = availability.title.toLowerCase();

    if (availability.tone === "open") {
      return "bg-emerald-50 border border-emerald-200 text-emerald-800";
    }

    if (title.includes("minutos")) {
      return "bg-amber-50 border border-amber-200 text-amber-800";
    }

    return "bg-white border border-border text-slate-700";
  }, [availability]);

  const copyText = useMemo(
    () => buildTempleCopyText(templo, scheduleServices.map((service) => formatTempleServiceLine(service))),
    [scheduleServices, templo]
  );

  const openGoogleMaps = () => {
    const url = buildGoogleMapsLink(templo);
    if (url) window.open(url, "_blank");
  };

  const handleToggle = () => {
    setIsExpanded((prev) => {
      if (!prev) {
        setTimeout(() => {
          const el = document.getElementById(`templo-details-${templo.id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }, 100);
      }
      return !prev;
    });
  };

  const hasExpandableContent =
    templo.pastores.length > 0 ||
    templo.coros.length > 0 ||
    scheduleServices.length > 0 ||
    !!templo.description ||
    !!templo.googleMapsUrl ||
    !!templo.phone ||
    typeof templo.latitude === "number" ||
    typeof templo.longitude === "number";
  const compactUtilityButtonClass =
    "mt-2 inline-flex min-h-8 w-fit max-w-full items-center gap-1.5 rounded-sm bg-surface-pane py-1.5 text-sm font-medium leading-tight text-brand-ink transition-[background-color,border-color] duration-150 hover:border-brand-ink hover:bg-primary/10 [&>span]:min-w-0";
  const compactMapsButtonClass =
    "inline-flex min-h-10 w-fit max-w-full items-center justify-center gap-1.5 border bg-brand px-2.5 py-1.5 text-center text-sm font-medium leading-tight text-white transition-[background-color,border-color] duration-0 hover:bg-brand-hover hover:text-white";

  const actionButtons = (
    <CopyPrintActions
      copyText={copyText}
      copyLabel={`Copiar información de ${templo.temploName}`}
      printLabel={`Imprimir información de ${templo.temploName}`}
      onCopied={onCopied}
      onPrint={() => onPrint(templo)}
    />
  );

  const detailsContent = (
    <>
      {templo.pastores.length > 0 && templo.pastores.map((pastor) => (
        <div key={pastor.id} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-[0px]">
              {templo.pastores.length > 1 ? "Pastores a Cargo" : "Pastor a Cargo"}
            </p>
            <Link
              href={`/pastores#${pastor.id}`}
              className="inline-flex items-center gap-1 w-fit text-sm font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 leading-tight mb-2 transition-colors"
              aria-label={`Ver información de ${pastor.fullName}`}
            >
              <span className="inline-block">
                <HighlightedText text={pastor.fullName} query={searchQuery} />
              </span>
            </Link>
            {pastor.phone && (
              <p className="text-sm text-foreground/60 -mt-[1px]">
                {formatPhoneForDisplay(pastor.phone)}
              </p>
            )}
          </div>
          {pastor.phone && (
            <WhatsAppIconButton
              phone={pastor.phone}
              message={`Hola ${pastor.fullName}, me comunico del sitio web de Region Mayo.`}
            />
          )}
        </div>
      ))}

      {templo.coros.length > 0 && templo.coros.map((coro) => (
        <div key={coro.id} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-[0px]">
              {templo.coros.length > 1 ? "Coros Locales" : "Coro Local"}
            </p>
            <Link
              href={`/coros#${coro.id}`}
              className="inline-flex items-center gap-1 w-fit text-sm font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 leading-tight mb-0 transition-colors"
              aria-label={`Ver información de ${coro.coroName}`}
            >
              <span className="block">
                <HighlightedText text={coro.coroName} query={searchQuery} />
              </span>
            </Link>
            <p className="text-sm text-foreground/70 mt-0.5">
              Presidente: <HighlightedText text={formatPresidentShortName(coro.presidentName)} query={searchQuery} />
              {coro.presidentPhone ? ` · ${formatPhoneForDisplay(coro.presidentPhone)}` : ""}
            </p>
          </div>
          {coro.presidentPhone && (
            <WhatsAppIconButton
              phone={coro.presidentPhone}
              message={`Hola, me comunico del sitio web de Region Mayo respecto al ${coro.coroName}`}
            />
          )}
        </div>
      ))}

      {scheduleServices.length > 0 && (
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
              Horarios de Reunión
            </p>
            <ul className="space-y-1">
              {scheduleServices.map((service, idx) => (
                <li
                  key={`${service.day}-${service.startTime}-${idx}`}
                  className="text-sm text-foreground leading-relaxed"
                >
                  {formatTempleServiceLine(service)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {templo.description && (
        <div className="flex items-start gap-3 mt-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
              Notas adicionales
            </p>
            <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
              {templo.description}
            </p>
          </div>
        </div>
      )}

      {actionButtons}
    </>
  );

  if (variant === "compact") {
    return (
      <article
        id={templo.id}
        className="md:bg-card md:border-border/80 scroll-mt-[100px] transition-none target:ring-[3px] target:ring-[#d8b400] dark:target:bg-yellow-900/20 md:transition-all md:duration-700"
      >
        <div className="flex gap-3 px-0 py-4 md:gap-5 md:border md:border-brand md:px-4 md:py-5">
          <div className="flex shrink-0 flex-col mt-0.5">
            <div className="offline-hide-when-offline offline-aware-image offline-aware-image--fixed relative h-[82px] w-[82px] bg-muted md:h-[108px] md:w-[112px]">
              {templo.photos && templo.photos.length > 0 ? (
                <>
                  <TemploImageGallery images={templo.photos} alt={templo.temploName} hideCountBadge />
                  <span className="pointer-events-none absolute left-2 bottom-2 inline-flex h-6 w-6 items-center justify-center border border-white/15 bg-black/45 text-white shadow-sm backdrop-blur-[8px]">
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </>
              ) : (
                <div className="offline-image-online absolute inset-0 flex items-center justify-center">
                  <Church
                    className="h-5 w-5 text-muted-foreground/30"
                    aria-hidden="true"
                  />
                </div>
              )}
              <OfflineImagePlaceholder />
              <div className="hidden md:block">
                <DistanceBadge distance={distance} show={showDistance ?? false} />
              </div>
            </div>
            <div className="relative mt-0 h-[36px] md:hidden">
              <DistanceBadge distance={distance} show={showDistance ?? false} />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="min-w-0 text-left">
              <h3 className={`${cardTitleFont.className} text-[17px] pr-10 font-bold leading-snug text-foreground md:text-[21px]`}>
                <HighlightedText text={templo.temploName} query={searchQuery} />
              </h3>

              {availability && (
                <div className="mt-1 mb-4">
                  <span className={`availability-pill inline-flex max-w-full items-start gap-1.5 rounded-none px-1.5 py-1 text-[clamp(10px,2.8vw,12px)] leading-tight ${availabilityBadgeClasses}`}>
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80 max-[385px]:hidden" aria-hidden="true" />
                    {(availability.tone === "open" || availability.tone === "opening-soon") ? (
                      <span className="min-w-0 break-words text-xs font-semibold">{availability.title}</span>
                    ) : (
                      <span className="flex min-w-0 flex-wrap gap-x-1.5 gap-y-0.5">
                        <span className="text-xs font-semibold">Próximo culto:</span>
                        <span className="min-w-0 break-words text-xs opacity-90">{(() => {
                          const sub = availability.subtitle || availability.title || "";
                          let cleaned = String(sub)
                            .replace(/^\s*Abre\s+/i, "")
                            .replace(/\ba las\s*/i, "")
                            .replace(/^\s*(el|la)\s+/i, "")
                            .trim();
                          if (!cleaned) cleaned = availability.title;
                          cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
                          return cleaned;
                        })()}</span>
                      </span>
                    )}
                  </span>
                </div>
              )}

              {templo.address && (
                <p className="mt-3 pr-6 flex min-w-0 items-start gap-2 text-[15px] leading-snug text-foreground/80">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 line-clamp-3">
                    <HighlightedText text={templo.address} query={searchQuery} />
                  </span>
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-col items-start gap-2 md:mt-5">
              {templo.googleMapsUrl && (
                <button
                  onClick={openGoogleMaps}
                  className={compactMapsButtonClass}
                  aria-label={`Ver ubicación de ${templo.temploName} en Google Maps`}
                  style={{ minWidth: "unset" }}
                >
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 whitespace-normal break-words">
                    Ver en Google Maps
                  </span>
                </button>
              )}

              {hasExpandableContent && (
                <button
                  onClick={handleToggle}
                  className={compactUtilityButtonClass}
                  aria-expanded={isExpanded}
                  aria-controls={`templo-details-${templo.id}`}
                  style={{ minWidth: "unset" }}
                >
                  <span>{isExpanded ? "Ocultar información" : "Ver información"}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {hasExpandableContent && isExpanded && (
            <motion.div
              key="compact-details"
              id={`templo-details-${templo.id}`}
              initial={isMobile ? { height: 0, opacity: 0 } : false}
              animate={{ height: "auto", opacity: 1 }}
              exit={isMobile ? { height: 0, opacity: 0 } : undefined}
              transition={isMobile ? expandTransition : { duration: 0 }}
              className="overflow-hidden md:border-x md:border-b md:border-brand"
            >
              <div className="border-t border-border/80 bg-muted/20 w-full space-y-5 px-3 py-4 md:px-5 md:py-5">
                {detailsContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    );
  }

  return (
    <div
      id={templo.id} 
      data-eq-card
      className="desktop-card-lift bg-card border border-border overflow-hidden flex flex-col h-full scroll-mt-[100px] transition-all duration-700 target:ring-[3px] target:ring-[#d8b400] dark:target:bg-yellow-900/20"
    >
      {/* Photo Gallery */}
      <div className="offline-hide-when-offline offline-aware-image relative w-full bg-muted shrink-0">
        {templo.photos && templo.photos.length > 0 ? (
          <TemploImageGallery
            images={templo.photos}
            alt={templo.temploName}
          />
        ) : (
          <div className="offline-image-online absolute inset-0 flex items-center justify-center">
            <Church
              className="h-8 w-8 text-muted-foreground/30"
              aria-hidden="true"
            />
          </div>
        )}
        <OfflineImagePlaceholder />
        <DistanceBadge distance={distance} show={showDistance ?? false} />
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 pb-0 flex flex-col flex-1">
        <div data-eq-head>
          <h3 className={`${cardTitleFont.className} font-semibold text-lg text-foreground leading-snug mb-3`}>
            <HighlightedText text={templo.temploName} query={searchQuery} />
          </h3>

          {/* Availability badge — focus on anticipation (next service) or live state */}
          {availability && (
            <div className="mb-2">
              <span className={`availability-pill inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-none whitespace-nowrap ${availabilityBadgeClasses}`}>
                <Clock className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
                {(availability.tone === "open" || availability.tone === "opening-soon") ? (
                  <span className="font-semibold text-xs">{availability.title}</span>
                ) : (
                  <>
                    <span className="font-semibold text-xs md:text-[12px]">Próximo culto</span>
                    <span className="opacity-80">·</span>
                    <span className="text-xs md:text-[12px] opacity-90">{(() => {
                      const sub = availability.subtitle || availability.title || "";
                      let cleaned = String(sub)
                        .replace(/^\s*Abre\s+/i, "")
                        .replace(/\ba las\s*/i, "")
                        .replace(/^\s*(el|la)\s+/i, "")
                        .trim();
                      if (!cleaned) cleaned = availability.title;
                      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
                      return cleaned;
                    })()}</span>
                  </>
                )}
              </span>
            </div>
          )}

          {/* Address preview (always visible if present) */}
          {templo.address && (
            <div className="flex items-start gap-2 mb-1 mt-4">
              <MapPin
                className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-sm text-foreground/80 line-clamp-2">
                <HighlightedText text={templo.address} query={searchQuery} />
              </p>
            </div>
          )}

          {/* Maps link - always shown first if available */}
          {templo.googleMapsUrl && (
            <button
              onClick={openGoogleMaps}
              className="w-full mb-2.5 md:mb-5 flex min-h-10 items-start justify-start gap-2 text-left text-sm text-primary font-normal leading-tight hover:text-primary/80 hover:underline underline-offset-2 transition-colors pt-1 pb-3 px-4 -mx-4"
              aria-label={`Ver ubicación de ${templo.temploName} en Google Maps`}
            >
              <div className="flex min-w-0 items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0">Ver ubicación</span>
              </div>
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-col">

          {/* Toggle — only shown if there is expandable content */}
          {hasExpandableContent && (
            <div className="-mx-4 mb-2 border-t border-border">
              <button
                onClick={handleToggle}
                className="w-full flex min-h-10 items-center justify-between gap-2 py-3 px-4 text-sm text-foreground font-medium leading-tight hover:text-foreground/70 transition-colors "
                aria-expanded={isExpanded}
                aria-controls={`templo-details-${templo.id}`}
                style={{ background: "none" }}
              >
                <span className="min-w-0">
                  {isExpanded ? "Ocultar información" : "Ver información"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>
          )}

          {/* Expanded details */}
          <AnimatePresence initial={false}>
            {hasExpandableContent && isExpanded && (
              <motion.div
                key="grid-details"
                id={`templo-details-${templo.id}`}
                initial={isMobile ? { height: 0, opacity: 0 } : false}
                animate={{ height: "auto", opacity: 1 }}
                exit={isMobile ? { height: 0, opacity: 0 } : undefined}
                transition={isMobile ? expandTransition : { duration: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-5 pt-5 pb-5 px-4 -mx-4 border-t border-border">
                {/* Pastores */}
                {templo.pastores.length > 0 && templo.pastores.map((pastor) => (
                  <div key={pastor.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-[0px]">
                        {templo.pastores.length > 1 ? "Pastores a Cargo" : "Pastor a Cargo"}
                      </p>
                      <Link
                        href={`/pastores#${pastor.id}`}
                        className="inline-flex items-center gap-1 w-fit text-[16px] font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 leading-tight mb-2 transition-colors"
                        aria-label={`Ver información de ${pastor.fullName}`}
                      >
                        <span className="inline-block">
                          <HighlightedText text={pastor.fullName} query={searchQuery} />
                        </span>
                      </Link>
                      {pastor.phone && (
                        <p className="text-sm text-foreground/60 -mt-[1px]">
                          {formatPhoneForDisplay(pastor.phone)}
                        </p>
                      )}
                    </div>
                    {pastor.phone && (
                      <WhatsAppIconButton
                        phone={pastor.phone}
                        message={`Hola ${pastor.fullName}, me comunico del sitio web de Region Mayo.`}
                      />
                    )}
                  </div>
                ))}

                {/* Coros */}
                {templo.coros.length > 0 && templo.coros.map((coro) => (
                  <div key={coro.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-[0px]">
                        {templo.coros.length > 1 ? "Coros Locales" : "Coro Local"}
                      </p>
                      <Link
                        href={`/coros#${coro.id}`}
                        className="inline-flex items-center gap-1 w-fit text-sm font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 leading-tight mb-0 transition-colors"
                        aria-label={`Ver información de ${coro.coroName}`}
                      >
                        <span className="block">
                          <HighlightedText text={coro.coroName} query={searchQuery} />
                        </span>
                      </Link>
                      <p className="text-sm text-foreground/70 mt-0.5">
                        Presidente: <HighlightedText text={formatPresidentShortName(coro.presidentName)} query={searchQuery} />
                        {coro.presidentPhone ? ` · ${formatPhoneForDisplay(coro.presidentPhone)}` : ""}
                      </p>
                    </div>
                    {coro.presidentPhone && (
                      <WhatsAppIconButton
                        phone={coro.presidentPhone}
                        message={`Hola, me comunico del sitio web de Region Mayo respecto al ${coro.coroName}`}
                      />
                    )}
                  </div>
                ))}

                {/* Structured Schedule */}
                {scheduleServices.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                        Horarios de Reunión
                      </p>
                      <ul className="space-y-1">
                        {scheduleServices.map((service, idx) => (
                          <li
                            key={`${service.day}-${service.startTime}-${idx}`}
                            className="text-sm text-foreground leading-relaxed"
                          >
                            {formatTempleServiceLine(service)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Legacy free text notes */}
                {templo.description && (
                  <div className="flex items-start gap-3 mt-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Notas adicionales
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                        {templo.description}
                      </p>
                    </div>
                  </div>
                )}

                {actionButtons}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

interface TemploContentProps {
  templos: Templo[];
  initialViewMode?: ViewMode;
}

export function TemplosContent({ templos, initialViewMode }: TemploContentProps) {
  const geolocation = useGeolocationState();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const resolvedInitialViewMode = initialViewMode ?? "grid";
  const [viewMode, setViewMode] = useState<ViewMode>(() => resolvedInitialViewMode);
  const [isOfflinePwa, setIsOfflinePwa] = useState(false);
  const [distanceOrderIds, setDistanceOrderIds] = useState<string[] | null>(
    null,
  );
  const [distanceOrderEnabled, setDistanceOrderEnabled] = useState(false);
  const [showDistanceBadges, setShowDistanceBadges] = useState(false);
  const [locationSearchState, setLocationSearchState] =
    useState<LocationSearchState>("idle");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationIssueMessage, setLocationIssueMessage] = useState("");
  const [locationSearchDistances, setLocationSearchDistances] =
    useState<DistanceMap>({});
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [isCopyToastVisible, setIsCopyToastVisible] = useState(false);
  const [printTemplo, setPrintTemplo] = useState<Templo | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const highlightedHashRef = useRef<string | null>(null);
  const lastOnlineViewModeRef = useRef<ViewMode>(resolvedInitialViewMode);
  const copyToastTimerRef = useRef<number | null>(null);
  const copyToastExitTimerRef = useRef<number | null>(null);
  const activePrintTemploRef = useRef<Templo | null>(null);
  const printCleanupTimerRef = useRef<number | null>(null);
  const printInFlightRef = useRef(false);
  useEqualizeCardRowHeads(gridRef);
  
  // Calculate distances to nearby churches if user has granted permission
  const { distances, hasPermission, loading } = useNearbyChurchDistances(
    templos,
  );
  const visibleDistances = useMemo(
    () => ({ ...distances, ...locationSearchDistances }),
    [distances, locationSearchDistances],
  );

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useLayoutEffect(() => {
    const isStandalone = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;

    const syncOfflineMode = () => {
      const shouldForceCompact = !navigator.onLine && isStandalone();
      setIsOfflinePwa(shouldForceCompact);

      if (shouldForceCompact) {
        setViewMode("compact");
        return;
      }

      setViewMode(lastOnlineViewModeRef.current);
    };

    syncOfflineMode();
    window.addEventListener("online", syncOfflineMode);
    window.addEventListener("offline", syncOfflineMode);

    return () => {
      window.removeEventListener("online", syncOfflineMode);
      window.removeEventListener("offline", syncOfflineMode);
    };
  }, []);

  useEffect(() => {
    const clearDistanceBadgeFlag = () => {
      try {
        sessionStorage.removeItem(SHOW_DISTANCE_BADGES_KEY);
      } catch {
        // Ignore storage failures (private mode, quota)
      }
    };

    window.addEventListener("pagehide", clearDistanceBadgeFlag);
    window.addEventListener("beforeunload", clearDistanceBadgeFlag);

    return () => {
      window.removeEventListener("pagehide", clearDistanceBadgeFlag);
      window.removeEventListener("beforeunload", clearDistanceBadgeFlag);
    };
  }, []);

  useEffect(() => {
    if (!geolocation.permissionDenied) return;

    setLocationSearchState("warning");
    setLocationIssueMessage(
      geolocation.error ||
        "No tenemos permiso para acceder a tu ubicacion. Puedes reintentarlo y permitir el acceso desde el navegador.",
    );
  }, [geolocation.permissionDenied, geolocation.error]);

  const runNearestTempleSearch = async () => {
    setLocationModalOpen(false);
    setLocationSearchState("searching");
    setLocationIssueMessage("");

    try {
      const location = await geolocation.requestGeolocation();

      try {
        sessionStorage.setItem(SKIP_ONLINE_TOAST_KEY, "true");
      } catch {
        // Ignore storage failures (private mode, quota)
      }

      const nearestChurches = await findNearestChurches(
        location.lat,
        location.lng,
        templos,
        templos.length,
      );

      if (nearestChurches.length === 0) {
        setLocationSearchState("error");
        setLocationIssueMessage(
          "No encontramos templos con coordenadas configuradas para calcular el mas cercano.",
        );
        return;
      }

      const orderedIds = nearestChurches.map(({ church }) => church.id);
      const distanceMap: DistanceMap = {};
      nearestChurches.forEach(({ church, distance }) => {
        distanceMap[church.id] = distance;
      });
      const nearest = nearestChurches[0];

      try {
        localStorage.setItem(DISTANCE_ORDER_ENABLED_KEY, "true");
        localStorage.setItem(
          DISTANCE_ORDER_STORAGE_KEY,
          JSON.stringify(orderedIds),
        );
        sessionStorage.setItem(SHOW_DISTANCE_BADGES_KEY, "true");
        sessionStorage.setItem(GPS_HIGHLIGHT_KEY, nearest.church.id);
        sessionStorage.removeItem(GPS_HIGHLIGHT_USED_KEY);
      } catch {
        // Ignore storage failures (private mode, quota)
      }

      setSearchQuery("");
      setLocationSearchDistances(distanceMap);
      setDistanceOrderEnabled(true);
      setDistanceOrderIds(orderedIds);
      setShowDistanceBadges(true);
      setIsClientReady(true);

      window.setTimeout(() => {
        const id = nearest.church.id;
        const el = document.getElementById(id);
        if (!el) {
          setLocationSearchState("idle");
          return;
        }

        history.replaceState(null, "", `${window.location.pathname}#${id}`);
        highlightedHashRef.current = id;
        el.classList.add("global-highlight");
        el.scrollIntoView({ behavior: "smooth", block: "center" });

        try {
          sessionStorage.setItem(GPS_HIGHLIGHT_USED_KEY, "true");
        } catch {
          // Ignore storage failures (private mode, quota)
        }

        window.setTimeout(() => {
          setLocationSearchState("idle");
        }, 500);
      }, 150);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible determinar tu ubicacion actual. Revisa si tu GPS esta encendido.";

      setLocationSearchState("warning");
      setLocationIssueMessage(message);
    }
  };

  const handleLocationButtonClick = () => {
    if (locationSearchState === "searching") return;
    setLocationModalOpen(true);
  };

  useEffect(() => {
    let storedOrderIds: string[] | null = null;
    let storedEnabled = false;
    let shouldShowBadges = false;

    try {
      storedEnabled =
        localStorage.getItem(DISTANCE_ORDER_ENABLED_KEY) === "true";
    } catch {
      storedEnabled = false;
    }

    try {
      const stored = localStorage.getItem(DISTANCE_ORDER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        storedOrderIds = Array.isArray(parsed) ? parsed : null;
      }
    } catch {
      storedOrderIds = null;
    }

    try {
      shouldShowBadges =
        sessionStorage.getItem(SHOW_DISTANCE_BADGES_KEY) === "true";
      if (shouldShowBadges) {
        sessionStorage.removeItem(SHOW_DISTANCE_BADGES_KEY);
      }
    } catch {
      shouldShowBadges = false;
    }

    setDistanceOrderEnabled(storedEnabled);
    if (storedOrderIds && storedOrderIds.length > 0) {
      setDistanceOrderIds(storedOrderIds);
    }
    setShowDistanceBadges(shouldShowBadges);

    if (!storedEnabled) {
      setIsClientReady(true);
      return;
    }

    if (!storedOrderIds || storedOrderIds.length === 0 || templos.length === 0) {
      setIsClientReady(true);
      return;
    }

    const initialOrderIds = templos.map((templo) => templo.id);
    const isSameInitialOrder =
      initialOrderIds.length === storedOrderIds.length &&
      initialOrderIds.every((id, index) => id === storedOrderIds[index]);

    if (isSameInitialOrder) {
      setIsClientReady(true);
      return;
    }

    const readyTimer = window.setTimeout(() => {
      setIsClientReady(true);
    }, 180);

    return () => window.clearTimeout(readyTimer);
  }, [templos]);

  useEffect(() => {
    if (!distanceOrderEnabled || !hasPermission) return;
    if (!templos.length || Object.keys(visibleDistances).length === 0) return;

    const orderedByDistance = [...templos].sort((a, b) => {
      const distanceA = visibleDistances[a.id];
      const distanceB = visibleDistances[b.id];

      if (distanceA && distanceB) return distanceA.km - distanceB.km;
      if (distanceA) return -1;
      if (distanceB) return 1;
      return 0;
    });

    const orderedIds = orderedByDistance.map((templo) => templo.id);
    const isSameOrder =
      distanceOrderIds &&
      distanceOrderIds.length === orderedIds.length &&
      distanceOrderIds.every((id, index) => id === orderedIds[index]);

    if (isSameOrder) return;

    try {
      localStorage.setItem(
        DISTANCE_ORDER_STORAGE_KEY,
        JSON.stringify(orderedIds),
      );
    } catch {
      // Ignore storage failures (private mode, quota)
    }

    setDistanceOrderIds(orderedIds);
    setIsClientReady(true);
  }, [distanceOrderEnabled, hasPermission, visibleDistances, templos, distanceOrderIds]);

  useEffect(() => {
    if (!distanceOrderEnabled) return;
    if (distanceOrderIds && distanceOrderIds.length > 0) return;
    if (loading) return;
    if (!hasPermission) {
      setDistanceOrderEnabled(false);
      setIsClientReady(true);
    }
  }, [distanceOrderEnabled, distanceOrderIds, hasPermission, loading]);

  const filteredTemplos = useMemo(
    () => searchItems(templos, searchQuery, SEARCH_CONFIGS.templos),
    [templos, searchQuery],
  );

  const sortedTemplos = useMemo(() => {
    const base = [...filteredTemplos];

    if (distanceOrderIds && distanceOrderIds.length > 0) {
      const orderMap = new Map(
        distanceOrderIds.map((id, index) => [id, index]),
      );

      return base.sort((a, b) => {
        const indexA = orderMap.get(a.id);
        const indexB = orderMap.get(b.id);

        if (indexA == null && indexB == null) return 0;
        if (indexA == null) return 1;
        if (indexB == null) return -1;
        return indexA - indexB;
      });
    }

    if (!distanceOrderEnabled || !hasPermission) return base;

    return base.sort((a, b) => {
      const distanceA = visibleDistances[a.id];
      const distanceB = visibleDistances[b.id];

      if (distanceA && distanceB) return distanceA.km - distanceB.km;
      if (distanceA) return -1;
      if (distanceB) return 1;
      return 0;
    });
  }, [filteredTemplos, visibleDistances, hasPermission, distanceOrderIds, distanceOrderEnabled]);

  useEffect(() => {
    if (!isClientReady) return;
    if (!window.location.hash) return;

    const id = decodeURIComponent(window.location.hash.substring(1));
    if (!id || highlightedHashRef.current === id) return;

    const gpsId = sessionStorage.getItem(GPS_HIGHLIGHT_KEY);
    const gpsConsumed = sessionStorage.getItem(GPS_HIGHLIGHT_USED_KEY) === "true";

    if (gpsId && gpsId === id && gpsConsumed) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
      return;
    }

    let cancelled = false;
    const attemptHighlight = () => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (!el) return;
      highlightedHashRef.current = id;
      el.classList.add("global-highlight");
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      if (gpsId && gpsId === id) {
        sessionStorage.setItem(GPS_HIGHLIGHT_USED_KEY, "true");
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };

    const timer = window.setTimeout(attemptHighlight, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isClientReady, sortedTemplos.map((t) => t.id).join(",")]);

  const shouldShowLoader = !isClientReady;
  const locationModalTitle =
    locationSearchState === "error"
      ? "No se pudo encontrar el templo cercano"
      : locationSearchState === "warning"
        ? "Revisar acceso a ubicacion"
        : "Usar tu ubicacion";
  const locationModalMessage =
    locationSearchState === "error" || locationSearchState === "warning"
      ? locationIssueMessage
      : "Permite el acceso a tu ubicacion para ordenar los templos por cercania y abrir automaticamente el templo mas cercano.";
  const locationButtonLabel =
    locationSearchState === "searching"
      ? "Buscando templo cercano"
      : "Buscar templo cercano a mi ubicacion";

  const handleViewModeChange = (next: ViewMode) => {
    if (isOfflinePwa) return;
    lastOnlineViewModeRef.current = next;
    setViewMode(next);
    try {
      document.cookie = `rm-view-mode-templos=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Ignore cookie write failures
    }
  };

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

  const handlePrintTemplo = async (templo: Templo) => {
    if (printInFlightRef.current) return;

    printInFlightRef.current = true;
    if (printCleanupTimerRef.current) {
      window.clearTimeout(printCleanupTimerRef.current);
      printCleanupTimerRef.current = null;
    }
    document.body.classList.add("rm-printing");
    activePrintTemploRef.current = templo;

    flushSync(() => {
      setPrintTemplo(templo);
    });

    const printRoot = document.querySelector(".templo-print-root");
    printRoot?.getBoundingClientRect();

    try {
      await waitForImageReady(getPrintableTemplePhotoUrl(templo));
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

  useEffect(
    () => () => {
      if (copyToastTimerRef.current) {
        window.clearTimeout(copyToastTimerRef.current);
      }
      if (copyToastExitTimerRef.current) {
        window.clearTimeout(copyToastExitTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const clearPrintTemplo = () => {
      if (printCleanupTimerRef.current) {
        window.clearTimeout(printCleanupTimerRef.current);
      }
      const cleanupDelay = window.matchMedia("(hover: none), (pointer: coarse)")
        .matches
        ? 8000
        : 250;

      printCleanupTimerRef.current = window.setTimeout(() => {
        document.body.classList.remove("rm-printing");
        activePrintTemploRef.current = null;
        setPrintTemplo(null);
        printCleanupTimerRef.current = null;
      }, cleanupDelay);
    };

    const keepPrintClass = () => {
      if (printInFlightRef.current || activePrintTemploRef.current) {
        document.body.classList.add("rm-printing");
      }
    };

    window.addEventListener("beforeprint", keepPrintClass);
    window.addEventListener("afterprint", clearPrintTemplo);
    return () => {
      if (printCleanupTimerRef.current) {
        window.clearTimeout(printCleanupTimerRef.current);
      }
      document.body.classList.remove("rm-printing");
      activePrintTemploRef.current = null;
      window.removeEventListener("beforeprint", keepPrintClass);
      window.removeEventListener("afterprint", clearPrintTemplo);
    };
  }, []);

  return (
    <div
      className="relative w-full max-w-full overflow-x-hidden overscroll-x-none bg-[#f1f1f1] md:overflow-x-visible"
      id="main-content"
      data-view-mode={viewMode}
    >
      {hasHydrated && showCopyToast && createPortal(
        <div className="fixed bottom-4 left-1/2 z-[9999] pointer-events-none -translate-x-1/2 sm:bottom-6">
          <div
            className={`inline-flex min-w-[168px] items-center gap-2 rounded-sm bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition-all duration-200 ease-out ${
              isCopyToastVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0"
            }`}
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
              <Check className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>Copiado</span>
          </div>
        </div>,
        document.body
      )}
      {hasHydrated && printTemplo && createPortal(
        <div className="templo-print-root">
          <PrintableTemploSheet templo={printTemplo} />
        </div>,
        document.body
      )}
      {shouldShowLoader && (
        <div className="fixed inset-0 z-[60] bg-white/90 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3" role="status" aria-label="Cargando templos">
            <span
              className="h-11 w-11 rounded-full border-[3px] border-[#2f5e93]/25 border-t-[#2f5e93] animate-spin"
              aria-hidden="true"
            />
          </div>
        </div>
      )}
      <div className={`desktop-content-pane ${shouldShowLoader ? "invisible" : "visible"} mx-auto w-full max-w-[1150px] overflow-x-hidden bg-paper px-4 md:px-0 py-8 pt-[32px] md:pt-[44px] focus:outline-none md:overflow-x-visible md:border-x border-border`}>
        <div className="max-w mx-auto md:px-16 md:pt-1">
          {/* Header */}
        <div className="mb-6 pb-5 border-b border-border/70">
          <div className="grid grid-cols-1 gap-4 items-center md:grid-cols-[auto_minmax(0,1fr)]">
            <div
              className="hidden h-20 w-20 bg-contain bg-center bg-no-repeat md:block md:bg-[url('/images/iglesias2.png')]"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h1 className="text-[1.825rem] font-semibold text-brand tracking-tight">Asista a nuestras iglesias</h1>
              <p className="text-[16px] text-muted-foreground mt-2">
                Todos son invitamos a nuestros servicios. Busque el templo mas cercano a usted.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-7">
          <SearchBar
            onSearchChange={setSearchQuery}
            placeholder="Buscar por nombre, dirección, pastor o coro..."
            rightAction={
              <button
                type="button"
                onClick={handleLocationButtonClick}
                disabled={locationSearchState === "searching"}
                className="relative inline-flex h-full w-[42px] items-center justify-center rounded-r-[2px] border border-[#244b76] bg-[#2f5e93] text-white shadow-sm transition-colors hover:bg-[#284f7c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93] focus-visible:ring-offset-1 disabled:cursor-wait disabled:bg-[#2f5e93]"
                aria-label={locationButtonLabel}
                title={locationButtonLabel}
              >
                {locationSearchState === "searching" ? (
                  <LoaderCircle className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />
                ) : (
                  <MapPin className="h-[18px] w-[18px]" aria-hidden="true" />
                )}
                {locationSearchState === "warning" && (
                  <AlertTriangle
                    className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 fill-amber-400 text-amber-700"
                    aria-hidden="true"
                  />
                )}
                {locationSearchState === "error" && (
                  <XCircle
                    className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 fill-red-50 text-red-600"
                    aria-hidden="true"
                  />
                )}
              </button>
            }
          />
        </div>

        <div className="mb-4 flex justify-end">
          <ViewModeToggle
            value={viewMode}
            onChange={handleViewModeChange}
            ariaLabel="Cambiar vista de templos"
            disableGrid={isOfflinePwa}
          />
        </div>

        {locationModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4" role="presentation">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="location-search-title"
              className="w-full max-w-[360px] border border-border bg-background shadow-xl"
            >
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2f5e93]/10 text-[#2f5e93]">
                  <MapPin className="h-[18px] w-[18px]" aria-hidden="true" />
                  {locationSearchState === "warning" && (
                    <AlertTriangle
                      className="absolute -right-1 -top-1 h-3.5 w-3.5 fill-amber-400 text-amber-700"
                      aria-hidden="true"
                    />
                  )}
                  {locationSearchState === "error" && (
                    <XCircle
                      className="absolute -right-1 -top-1 h-3.5 w-3.5 fill-red-50 text-red-600"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <h2 id="location-search-title" className="text-sm font-semibold text-foreground">
                  {locationModalTitle}
                </h2>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {locationModalMessage}
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(false)}
                  className="min-h-9 px-3 py-2 text-sm font-medium leading-tight text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={runNearestTempleSearch}
                  className="min-h-9 bg-[#2f5e93] px-4 py-2 text-sm font-semibold leading-tight text-white transition-colors hover:bg-[#284f7c]"
                >
                  {locationSearchState === "idle" ? "Permitir" : "Reintentar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {locationSearchState === "searching" ? (
          <div className={viewMode === "compact" ? "flex flex-col gap-0 md:gap-4 pb-8" : "grid gap-4 grid-cols-1 sm:grid-cols-2 templos-grid-3cols pb-8"}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`bg-card animate-pulse border-y border-border/80 border-x ${viewMode === "compact" ? "flex gap-3 px-3 py-4 md:gap-5 md:px-4 md:py-5" : "flex flex-col h-[380px]"}`}>
                <div className={`bg-muted shrink-0 ${viewMode === "compact" ? "h-[72px] w-[72px] md:h-[108px] md:w-[112px]" : "h-[200px] w-full"}`} />
                <div className={`flex flex-col flex-1 ${viewMode === "compact" ? "py-1 pr-4 md:py-2 md:pr-0" : "p-4"} space-y-3`}>
                  <div className="h-5 w-3/4 bg-muted rounded mt-2" />
                  <div className="h-4 w-1/2 bg-muted/60 rounded mt-1" />
                  {viewMode !== "compact" && (
                    <div className="mt-4 space-y-2 pt-4">
                       <div className="h-4 w-full bg-muted/40 rounded" />
                       <div className="h-4 w-5/6 bg-muted/40 rounded" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : filteredTemplos.length === 0 ? (
          <div className="bg-card border border-border p-8 text-center">
            <Church
              className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground mb-1">
              {templos.length === 0
                ? "Sin templos registrados"
                : "No se encontraron resultados"}
            </p>
            <p className="text-xs text-muted-foreground">
              {templos.length === 0
                ? "Los templos de la región se mostrarán aquí cuando estén disponibles."
                : "Intenta con otros términos de búsqueda."}
            </p>
          </div>
        ) : (
          <AnimatePresence mode={isMobile ? "wait" : "sync"} initial={false}>
            {viewMode === "compact" ? (
              <motion.div
                key="templos-compact"
                initial={isMobile ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={isMobile ? { opacity: 0, y: -4 } : undefined}
                transition={isMobile ? { duration: 0.18, ease: "easeOut" } : { duration: 0 }}
                className={`mx-0 flex flex-col gap-3 md:gap-3 pb-14 ${
                  shouldShowLoader ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
                aria-hidden={shouldShowLoader}
              >
                {sortedTemplos.map((templo) => (
                  <TemploCard
                    key={templo.id}
                    templo={templo}
                    searchQuery={searchQuery}
                    distance={visibleDistances[templo.id]}
                    showDistance={
                      showDistanceBadges && !!visibleDistances[templo.id]
                    }
                    onCopied={showCopiedToast}
                    onPrint={handlePrintTemplo}
                    variant="compact"
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="templos-grid"
                ref={gridRef}
                initial={isMobile ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={isMobile ? { opacity: 0, y: -4 } : undefined}
                transition={isMobile ? { duration: 0.18, ease: "easeOut" } : { duration: 0 }}
                className={`grid gap-4 ${
                  sortedTemplos.length === 1
                    ? "grid-cols-1 max-w-sm mx-auto"
                    : sortedTemplos.length === 2
                      ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                      : "grid-cols-1 sm:grid-cols-2 templos-grid-3cols"
                } ${shouldShowLoader ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                aria-hidden={shouldShowLoader}
              >
                {sortedTemplos.map((templo) => (
                  <div key={templo.id} className="h-full">
                    <TemploCard
                      templo={templo}
                      searchQuery={searchQuery}
                      distance={visibleDistances[templo.id]}
                      showDistance={
                        showDistanceBadges && !!visibleDistances[templo.id]
                      }
                      onCopied={showCopiedToast}
                      onPrint={handlePrintTemplo}
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      </div>
    </div>
  );
}
