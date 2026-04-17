"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
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
import { WhatsAppIconButton } from "@/components/whatsapp-button";
import { SearchBar } from "@/components/search-bar";
import { HighlightedText } from "@/components/highlighted-text";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { searchItems, SEARCH_CONFIGS } from "@/lib/search-utils";
import type { Templo } from "@/lib/types";

function TemploCard({ templo, searchQuery }: { templo: Templo; searchQuery: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

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
    !!templo.description ||
    !!templo.googleMapsUrl;

  return (
    <div 
      id={templo.id} 
      className="bg-card border border-border overflow-hidden flex flex-col h-full scroll-mt-[100px] transition-all duration-700 target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20"
    >
      {/* Photo */}
      <div className="relative h-60 w-full bg-muted shrink-0">
        {templo.photo ? (
          <Image
            src={templo.photo}
            alt={templo.temploName}
            fill
            className="object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Church
              className="h-8 w-8 text-muted-foreground/30"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-lg text-foreground leading-snug mb-3">
          <HighlightedText text={templo.temploName} query={searchQuery} />
        </h3>

        <div className="mt-auto flex flex-col">
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
                <MapPin
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>Ver ubicación en Maps</span>
              </div>
              <ExternalLink
                className="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
            </button>
          )}

          {/* Toggle — only shown if there is expandable content */}
          {(templo.pastores.length > 0 || templo.coros.length > 0 || templo.description) && (
            <div className="-mx-4 border-t border-border mt-auto">
              <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between py-3 px-4 text-sm text-foreground font-medium hover:text-foreground/80 transition-colors"
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
          {(templo.pastores.length > 0 || templo.coros.length > 0 || templo.description) && isExpanded && (
            <div
              id={`templo-details-${templo.id}`}
              className="space-y-4 pt-4 pb-4 px-4 -mx-4 border-t border-border"
            >
                {/* Pastores */}
                {templo.pastores.length > 0 && templo.pastores.map((pastor) => (
                  <div key={pastor.id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                        {templo.pastores.length > 1 ? "Pastores a Cargo" : "Pastor a Cargo"}
                      </p>
                      <p className="text-sm font-medium text-foreground leading-tight">
                        <HighlightedText text={pastor.fullName} query={searchQuery} />
                      </p>
                      {pastor.phone && (
                        <p className="text-sm text-foreground/80 mt-0.5">
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
                  <div key={coro.id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                        {templo.coros.length > 1 ? "Coros Locales" : "Coro Local"}
                      </p>
                      <p className="text-sm font-medium text-foreground leading-tight">
                        <HighlightedText text={coro.coroName} query={searchQuery} />
                      </p>
                      <p className="text-sm text-foreground/80 mt-0.5">
                        Pdte. <HighlightedText text={coro.presidentName} query={searchQuery} />
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

                {/* Description / Schedule */}
                {templo.description && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Horarios y Actividades
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

  return (
    <div className="w-full relative pb-20 bg-[var(--surface-shell)]" id="main-content">
      <div className="max-w-[950px] mx-auto px-4 md:px-8 py-8 pt-[82px] md:pt-[88px] bg-[var(--surface-pane)] md:border-x border-[#dce2e9] dark:border-[#27272a] shadow-[0_0_10px_rgba(0,0,0,0.045)] dark:shadow-none min-h-screen focus:outline-none">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
        <div className="mb-6 pb-5 border-b border-border/70">
          <h1 className="text-[1.825rem] font-semibold text-foreground tracking-tight">Templos</h1>
          <p className="text-[17px] text-muted-foreground mt-1">
            Iglesias de la Región Mayo
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
            className={`grid gap-4 ${
              filteredTemplos.length === 1
                ? "grid-cols-1 max-w-sm mx-auto"
                : filteredTemplos.length === 2
                  ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {filteredTemplos.map((templo) => (
              <TemploCard
                key={templo.id}
                templo={templo}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
