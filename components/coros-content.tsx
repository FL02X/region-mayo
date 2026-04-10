"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Music,
  MapPin,
  ExternalLink,
  ChevronDown,
  User,
  Church,
} from "lucide-react";
import { WhatsAppIconButton } from "@/components/whatsapp-button";
import { SearchBar } from "@/components/search-bar";
import { HighlightedText } from "@/components/highlighted-text";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { searchItems, SEARCH_CONFIGS } from "@/lib/search-utils";
import type { Coro } from "@/lib/types";

function CoroCard({ coro, searchQuery }: { coro: Coro; searchQuery: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const openGoogleMaps = () => {
    if (coro.googleMapsUrl) {
      window.open(coro.googleMapsUrl, "_blank");
    }
  };

  const handleToggle = () => {
    setIsExpanded((prev) => {
      if (!prev) {
        setTimeout(() => {
          const el = document.getElementById(`coro-details-${coro.id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }, 100);
      }
      return !prev;
    });
  };

  return (
    <div 
      id={coro.id} 
      className="bg-card border border-border overflow-hidden flex flex-col h-full scroll-mt-[100px] transition-all duration-700 target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20"
    >
      {/* Photo */}
      <div className="relative h-60 w-full bg-muted shrink-0">
        {coro.photo ? (
          <Image
            src={coro.photo}
            alt={coro.coroName}
            fill
            className="object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Music
              className="h-8 w-8 text-muted-foreground/30"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-lg text-foreground leading-snug mb-4">
          <HighlightedText text={coro.coroName} query={searchQuery} />
        </h3>

        <div className="mt-auto flex flex-col">
          <div className="-mx-4 border-t border-border mt-auto">
            <button
              onClick={handleToggle}
              className="w-full flex items-center justify-between py-3 px-4 text-sm text-foreground font-medium hover:text-foreground/80 transition-colors"
              aria-expanded={isExpanded}
              aria-controls={`coro-details-${coro.id}`}
              style={{ background: "none" }}
            >
              <span>
                {isExpanded ? "Ocultar información" : "Ver información de contacto"}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
          </div>

          {isExpanded && (
            <div id={`coro-details-${coro.id}`} className="space-y-4 pt-4 pb-4 px-4 -mx-4 border-t border-border">
                {/* Temple Information */}
                {coro.temploName && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Church className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Iglesia Sede
                      </p>
                      <p className="text-sm font-medium text-foreground leading-tight mb-1">
                        <HighlightedText text={coro.temploName} query={searchQuery} />
                      </p>
                      {coro.address && (
                        <div className="flex items-start gap-1.5 mb-1.5">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                          <p className="text-sm text-foreground/80 leading-tight">
                            <HighlightedText text={coro.address} query={searchQuery} />
                          </p>
                        </div>
                      )}
                      {coro.googleMapsUrl && (
                        <button
                          onClick={openGoogleMaps}
                          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                          aria-label={`Ver ubicación de ${coro.temploName} en Maps`}
                        >
                          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>Ver ubicación</span>
                          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* President row */}
                {coro.presidentPhone && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Presidente de Coro
                      </p>
                      <p className="text-sm font-medium text-foreground leading-tight">
                        <HighlightedText text={coro.presidentName} query={searchQuery} />
                      </p>
                      <p className="text-sm text-foreground/80 mt-0.5">
                        <HighlightedText text={formatPhoneForDisplay(coro.presidentPhone)} query={searchQuery} />
                      </p>
                    </div>
                    <WhatsAppIconButton
                      phone={coro.presidentPhone}
                      message={`Hola, me comunico del sitio web de Region Mayo respecto al ${coro.coroName}`}
                    />
                  </div>
                )}

                {/* President sans phone */}
                {!coro.presidentPhone && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Presidente de Coro
                      </p>
                      <p className="text-sm font-medium text-foreground leading-tight">
                        <HighlightedText text={coro.presidentName} query={searchQuery} />
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

interface CorosContentProps {
  coros: Coro[];
}

export function CorosContent({ coros }: CorosContentProps) {
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

  const filteredCoros = useMemo(
    () => searchItems(coros, searchQuery, SEARCH_CONFIGS.coros),
    [coros, searchQuery],
  );

  return (
    <div className="w-full relative pb-16 bg-[#f1f1f1]" id="main-content">
      <div className="max-w-[950px] mx-auto px-4 md:px-8 py-6 pt-[78px] md:pt-[84px] bg-background md:border-x border-[#e5e7eb] dark:border-[#27272a] shadow-[0_0_15px_1px_rgba(0,0,0,0.07)] dark:shadow-none min-h-screen focus:outline-none">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">Coros Locales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Nuestros coros de la región
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearchChange={setSearchQuery}
            placeholder="Buscar por nombre, presidente o teléfono..."
          />
        </div>

        {filteredCoros.length === 0 ? (
          <div className="border border-border bg-card p-8 text-center">
            <Music
              className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground mb-1">
              Sin resultados
            </p>
            <p className="text-xs text-muted-foreground">
              No se encontraron coros que coincidan con tu búsqueda.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-4 ${
              filteredCoros.length === 1
                ? "grid-cols-1 max-w-sm mx-auto"
                : filteredCoros.length === 2
                  ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {filteredCoros.map((coro) => (
              <CoroCard key={coro.id} coro={coro} searchQuery={searchQuery} />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
