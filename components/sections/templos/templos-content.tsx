"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  MapPin,
  ExternalLink,
  Phone,
  Church,
  Mic,
  Music,
  Users,
  User,
  Clock,
  FileText,
} from "lucide-react";
import { useEqualizeCardRowHeads } from "@/hooks/use-equalize-card-row-heads";
import { useNearbyChurchDistances } from "@/hooks/use-nearby-church-distances";
import { WhatsAppIconButton } from "@/components/shared/whatsapp-button";
import { TemploImageGallery } from "./templo-image-gallery";
import { DistanceBadge } from "./distance-badge";
import { SearchBar } from "@/components/shared/search-bar";
import { HighlightedText } from "@/components/shared/highlighted-text";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { searchItems, SEARCH_CONFIGS } from "@/lib/search-utils";
import {
  formatTempleServiceLine,
  getTempleAvailability,
  getSortedTempleServices,
} from "@/lib/templo-schedule";
import { useTime } from "@/lib/time-context";
import type { Templo } from "@/lib/types";

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
  const { currentTime } = useTime();
  const scheduleServices = useMemo(
    () => getSortedTempleServices(templo.schedule),
    [templo.schedule]
  );
  const availability = useMemo(
    () => getTempleAvailability(templo.schedule, currentTime),
    [templo.schedule, currentTime]
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
      className="desktop-card-lift bg-card border border-border overflow-hidden flex flex-col h-full scroll-mt-[100px] transition-all duration-700 target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20"
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
              <span className={`inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-none whitespace-nowrap ${availabilityBadgeClasses}`}>
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
              className="w-full flex items-center justify-between text-sm text-primary font-medium hover:text-primary/80 transition-colors pt-1 pb-3 px-4 -mx-4"
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
                        href={`/directorio#${pastor.id}`}
                        className="inline-flex items-center gap-1 w-fit text-sm font-medium text-foreground underline underline-offset-2 md:hover:text-primary leading-tight mb-2 transition-colors"
                        aria-label={`Ver información de ${pastor.fullName}`}
                      >
                        <span className="inline-block">
                          <HighlightedText text={pastor.fullName} query={searchQuery} />
                        </span>
                        <span className="flex-shrink-0">
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
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
                        className="inline-flex items-center gap-1 w-fit text-sm font-medium text-foreground underline underline-offset-2 md:hover:text-primary leading-tight mb-0 transition-colors"
                        aria-label={`Ver información de ${coro.coroName}`}
                      >
                        <span className="block">
                          <HighlightedText text={coro.coroName} query={searchQuery} />
                        </span>
                        <span className="flex-shrink-0">
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
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
  const [searchQuery, setSearchQuery] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);
  useEqualizeCardRowHeads(gridRef);
  
  // Calculate distances to nearby churches if user has granted permission
  const { distances, hasPermission } = useNearbyChurchDistances(templos);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.add("global-highlight");
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }
  }, []);

  const filteredTemplos = useMemo(
    () => searchItems(templos, searchQuery, SEARCH_CONFIGS.templos),
    [templos, searchQuery],
  );

  const sortedTemplos = useMemo(() => {
    if (!hasPermission) return filteredTemplos;

    return [...filteredTemplos].sort((a, b) => {
      const distanceA = distances[a.id];
      const distanceB = distances[b.id];

      if (distanceA && distanceB) return distanceA.km - distanceB.km;
      if (distanceA) return -1;
      if (distanceB) return 1;
      return 0;
    });
  }, [filteredTemplos, distances, hasPermission]);

  return (
    <div className="w-full relative pb-20 bg-[#f1f1f1]" id="main-content">
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
          />
        </div>

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
            }`}
          >
            {sortedTemplos.map((templo) => (
              <TemploCard
                key={templo.id}
                templo={templo}
                searchQuery={searchQuery}
                distance={distances[templo.id]}
                showDistance={hasPermission && !!distances[templo.id]}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
