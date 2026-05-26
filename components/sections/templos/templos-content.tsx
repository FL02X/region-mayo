"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronDown,
  MapPin,
  ExternalLink,
  Church,
  LoaderCircle,
  Users,
  User,
  Clock,
  FileText,
  XCircle,
} from "lucide-react";
import { useEqualizeCardRowHeads } from "@/hooks/use-equalize-card-row-heads";
import { useGeolocationState } from "@/hooks/use-geolocation-state";
import { useNearbyChurchDistances } from "@/hooks/use-nearby-church-distances";
import { WhatsAppIconButton } from "@/components/shared/whatsapp-button";
import { TemploImageGallery } from "./templo-image-gallery";
import { DistanceBadge } from "./distance-badge";
import { SearchBar } from "@/components/shared/search-bar";
import { HighlightedText } from "@/components/shared/highlighted-text";
import { findNearestChurches } from "@/lib/location-service";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { searchItems, SEARCH_CONFIGS } from "@/lib/search-utils";
import {
  formatTempleServiceLine,
  getTempleAvailability,
  getSortedTempleServices,
} from "@/lib/templo-schedule";
import { useTime } from "@/lib/time-context";
import type { Templo } from "@/lib/types";
import type { DistanceResult } from "@/lib/location-service";

const DISTANCE_ORDER_STORAGE_KEY = "region-mayo-templos-distance-order";
const DISTANCE_ORDER_ENABLED_KEY = "region-mayo-templos-distance-order-enabled";
const SHOW_DISTANCE_BADGES_KEY = "region-mayo-templos-show-distance-badges";
const GPS_HIGHLIGHT_KEY = "region-mayo-templos-gps-highlight";
const GPS_HIGHLIGHT_USED_KEY = "region-mayo-templos-gps-highlight-consumed";
const SKIP_ONLINE_TOAST_KEY = "rm-skip-online-toast";

type LocationSearchState = "idle" | "searching" | "warning" | "error";
type DistanceMap = Record<string, DistanceResult>;

const formatPresidentShortName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return name;
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1]}`;
};

function TemploCard({ 
  templo, 
  searchQuery,
  distance,
  showDistance,
}: { 
  templo: Templo; 
  searchQuery: string;
  distance?: any;
  showDistance?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const openGoogleMaps = () => {
    if (templo.googleMapsUrl) window.open(templo.googleMapsUrl, "_blank");
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
    !!templo.googleMapsUrl;

  return (
    <div 
      id={templo.id} 
      data-eq-card
      className="desktop-card-lift bg-card border border-border overflow-hidden flex flex-col h-full scroll-mt-[100px] transition-all duration-700 target:ring-[3px] target:ring-[#d8b400] dark:target:bg-yellow-900/20"
    >
      {/* Photo Gallery */}
      <div className="relative h-60 w-full bg-muted shrink-0">
        {templo.photos && templo.photos.length > 0 ? (
          <TemploImageGallery
            images={templo.photos}
            alt={templo.temploName}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Church
              className="h-8 w-8 text-muted-foreground/30"
              aria-hidden="true"
            />
          </div>
        )}
        <DistanceBadge distance={distance} show={showDistance ?? false} />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div data-eq-head>
          <h3 className="font-semibold text-lg text-foreground leading-snug mb-3">
            <HighlightedText text={templo.temploName} query={searchQuery} />
          </h3>

          {/* Availability badge — focus on anticipation (next service) or live state */}
          {availability && (
            <div className="mb-2 -ml-2">
              <span className={`availability-pill inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-none whitespace-nowrap ${availabilityBadgeClasses}`}>
                <Clock className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
                {(availability.tone === "open" || availability.tone === "opening-soon") ? (
                  <span className="font-semibold text-xs">{availability.title}</span>
                ) : (
                  <>
                    <span className="font-semibold text-xs">Próximo culto</span>
                    <span className="opacity-80">·</span>
                    <span className="text-xs opacity-90">{(() => {
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
            <div className="flex items-start gap-2 mb-1.5">
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
              className="w-full flex items-center justify-between text-sm text-primary font-normal hover:text-primary/80 hover:underline underline-offset-2 transition-colors pt-1 pb-3 px-4 -mx-4"
              aria-label={`Ver ubicación de ${templo.temploName} en Google Maps`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Ver ubicación en Maps</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-col">

          {/* Toggle — only shown if there is expandable content */}
          {hasExpandableContent && (
            <div className="-mx-4 border-t border-border">
              <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between py-3 px-4 text-sm text-foreground font-medium hover:text-foreground/70 transition-colors"
                aria-expanded={isExpanded}
                aria-controls={`templo-details-${templo.id}`}
                style={{ background: "none" }}
              >
                <span>
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
          {hasExpandableContent && isExpanded && (
            <div
              id={`templo-details-${templo.id}`}
              className="space-y-5 pt-5 pb-5 px-4 -mx-4 border-t border-border"
            >
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
              </div>
            )}
          </div>
      </div>
    </div>
  );
}

interface TemploContentProps {
  templos: Templo[];
}

export function TemplosContent({ templos }: TemploContentProps) {
  const geolocation = useGeolocationState();
  const [searchQuery, setSearchQuery] = useState("");
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
  const gridRef = useRef<HTMLDivElement>(null);
  const highlightedHashRef = useRef<string | null>(null);
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

    if (!storedEnabled || (storedOrderIds && storedOrderIds.length > 0)) {
      setIsClientReady(true);
    }
  }, []);

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

  const shouldHideList = hasHydrated && !isClientReady;
  const shouldShowLoader = hasHydrated && !isClientReady;
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

  return (
    <div className="w-full relative pb-20 bg-[#f1f1f1]" id="main-content">
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
      <div className="desktop-content-pane max-w-[950px] mx-auto px-4 md:px-8 py-8 pt-[82px] md:pt-[88px] bg-[#ffffff] md:border-x border-[#dce2e9] dark:border-[#27272a] min-h-screen focus:outline-none">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
        <div className="mb-6 pb-5 border-b border-border/70">
          <h1 className="text-[1.825rem] font-semibold text-foreground tracking-tight">Asista a nuestros templos</h1>
          <p className="text-[15px] text-muted-foreground mt-2">
            Todos son invitamos a nuestros servicios. Busque el templo mas cercano a usted.
          </p>
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
                  className="h-9 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={runNearestTempleSearch}
                  className="h-9 bg-[#2f5e93] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#284f7c]"
                >
                  {locationSearchState === "idle" ? "Permitir" : "Reintentar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredTemplos.length === 0 ? (
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
          <div
            ref={gridRef}
            className={`grid gap-4 ${
              sortedTemplos.length === 1
                ? "grid-cols-1 max-w-sm mx-auto"
                : sortedTemplos.length === 2
                  ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                  : "grid-cols-1 sm:grid-cols-2 templos-grid-3cols"
            } ${shouldHideList ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            aria-hidden={shouldHideList}
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
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
