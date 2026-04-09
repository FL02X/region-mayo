"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Users,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Church,
  Phone,
} from "lucide-react";
import { WhatsAppIconButton } from "@/components/whatsapp-button";
import { SearchBar } from "@/components/search-bar";
import { HighlightedText } from "@/components/highlighted-text";
import { searchItems, SEARCH_CONFIGS } from "@/lib/search-utils";
import type { Pastor } from "@/lib/types";

function PastorCard({ pastor, searchQuery }: { pastor: Pastor; searchQuery: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const openGoogleMaps = () => {
    if (pastor.googleMapsUrl) {
      window.open(pastor.googleMapsUrl, "_blank");
    }
  };

  return (
    <div 
      id={pastor.id} 
      className="bg-card border border-border overflow-hidden flex flex-col h-full scroll-mt-[100px] transition-all duration-700 target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20"
    >
      {/* Photo */}
      <div className="relative h-60 w-full bg-muted shrink-0">
        {pastor.photo ? (
          <Image
            src={pastor.photo}
            alt={pastor.fullName}
            fill
            className="object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Users
              className="h-8 w-8 text-muted-foreground/30"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-lg text-foreground leading-snug mb-4">
          <HighlightedText text={pastor.fullName} query={searchQuery} />
        </h3>

        <div className="space-y-4 pt-4 border-t border-border mt-auto">
          {pastor.temploName && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Church
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Iglesia Sede
                  </p>
                  <p className="text-sm font-medium text-foreground leading-tight mb-1">
                    <HighlightedText text={pastor.temploName} query={searchQuery} />
                  </p>
                  {pastor.churchNumber && (
                    <p className="text-xs text-muted-foreground mb-1.5">
                      Pastor Local de Iglesia #<HighlightedText text={pastor.churchNumber.toString()} query={searchQuery} />
                    </p>
                  )}
                  {pastor.address && (
                    <div className="flex items-start gap-1.5 mb-1.5">
                      <MapPin
                        className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <p className="text-sm text-foreground/80 leading-tight">
                        <HighlightedText text={pastor.address} query={searchQuery} />
                      </p>
                    </div>
                  )}
                  {pastor.googleMapsUrl && (
                    <button
                      onClick={openGoogleMaps}
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                      aria-label={`Ver ubicación de ${pastor.temploName} en Maps`}
                    >
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Ver ubicación</span>
                      <ExternalLink
                        className="h-3 w-3 shrink-0"
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>
              </div>
            )}

            {pastor.phone && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Phone
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Número de Teléfono
                  </p>
                  <p className="text-sm font-medium text-foreground leading-tight">
                    <HighlightedText text={pastor.phone} query={searchQuery} />
                  </p>
                </div>
                <WhatsAppIconButton
                  phone={pastor.phone}
                  message={`Hola ${pastor.fullName}, me comunico del sitio web de Región Mayo.`}
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

interface DirectorioContentProps {
  pastors: Pastor[];
}

export function DirectorioContent({ pastors }: DirectorioContentProps) {
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

  const filteredPastors = useMemo(
    () => searchItems(pastors, searchQuery, SEARCH_CONFIGS.pastores),
    [pastors, searchQuery],
  );

  return (
    <div className="w-full relative pb-16 bg-[#f3f4f6] dark:bg-[#09090b]" id="main-content">
      <div className="max-w-[950px] mx-auto px-4 md:px-8 py-6 pt-[78px] md:pt-[84px] bg-background md:border-x border-[#e5e7eb] dark:border-[#27272a] shadow-[0_0_15px_1px_rgba(0,0,0,0.07)] dark:shadow-none min-h-screen focus:outline-none">
        {/* Main Content Area */}
        <div className="max-w-4xl mx-auto">
          {/* Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">
            Directorio de Pastores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Nuestros siervos en la Región Mayo
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearchChange={setSearchQuery}
            placeholder="Buscar por nombre, templo o teléfono..."
          />
        </div>

        {filteredPastors.length === 0 ? (
          <div className="bg-card border border-border p-8 text-center">
            <Users
              className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground mb-1">
              {pastors.length === 0
                ? "Sin pastores registrados"
                : "No se encontraron resultados"}
            </p>
            <p className="text-xs text-muted-foreground">
              {pastors.length === 0
                ? "El directorio se actualizará pronto."
                : "Intenta con otros términos de búsqueda."}
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-4 ${
              filteredPastors.length === 1
                ? "grid-cols-1 max-w-sm mx-auto"
                : filteredPastors.length === 2
                  ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {filteredPastors.map((pastor) => (
              <PastorCard
                key={pastor.id}
                pastor={pastor}
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
