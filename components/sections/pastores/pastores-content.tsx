"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users, MapPin, Church, Phone, ExternalLink } from "lucide-react";
import { useEqualizeCardRowHeads } from "@/hooks/use-equalize-card-row-heads";
import { useConnectivity } from "@/hooks/use-connectivity";
import { OfflineImagePlaceholder } from "@/components/shared/offline-image-placeholder";
import { WhatsAppIconButton } from "@/components/shared/whatsapp-button";
import { SearchBar } from "@/components/shared/search-bar";
import { HighlightedText } from "@/components/shared/highlighted-text";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { searchItems, SEARCH_CONFIGS } from "@/lib/search-utils";
import type { Pastor } from "@/lib/types";

function PastorCard({
  pastor,
  searchQuery,
  isOnline,
}: {
  pastor: Pastor;
  searchQuery: string;
  isOnline: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const openGoogleMaps = () => {
    if (pastor.googleMapsUrl) {
      window.open(pastor.googleMapsUrl, "_blank");
    }
  };

  return (
    <div 
      id={pastor.id} 
      data-eq-card
      className="desktop-card-lift bg-card border border-border overflow-hidden flex flex-col h-full scroll-mt-[100px] transition-all duration-700 target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20"
    >
      {/* Photo */}
      <div className={`relative w-full bg-muted shrink-0 ${!isOnline && pastor.photo ? "h-[7.5rem]" : "h-60"}`}>
        {!isOnline && pastor.photo ? (
          <OfflineImagePlaceholder />
        ) : pastor.photo ? (
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
        <div data-eq-head>
          <h3 className="font-semibold text-lg text-foreground leading-snug mb-4">
            <HighlightedText text={pastor.fullName} query={searchQuery} />
          </h3>
        </div>

        <div className="space-y-5 pt-5 pb-5 border-t border-border">
          {pastor.temploName && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Church
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-[0px]">
                    Iglesia Sede
                  </p>
                  {pastor.temploId ? (
                    <Link
                      href={`/templos#${pastor.temploId}`}
                      className="inline-flex items-center gap-1 w-fit text-sm font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 leading-tight mb-2 transition-colors"
                      aria-label={`Ver información de ${pastor.temploName}`}
                    >
                      <span className="inline-block">
                        <HighlightedText text={pastor.temploName} query={searchQuery} />
                      </span>
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-foreground leading-[1.15] mb-2">
                      <HighlightedText text={pastor.temploName} query={searchQuery} />
                    </p>
                  )}
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
                      className="text-sm font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors flex items-center gap-1.5"
                      aria-label={`Ver ubicación de ${pastor.temploName} en Maps`}
                    >
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Ver ubicación</span>
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
  const gridRef = useRef<HTMLDivElement>(null);
  const { isOnline } = useConnectivity();
  useEqualizeCardRowHeads(gridRef);

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
    <div className="w-full relative pb-20 bg-[#f1f1f1]" id="main-content">
      <div className="desktop-content-pane max-w-[950px] mx-auto px-4 md:px-8 py-8 pt-[82px] md:pt-[88px] bg-[#ffffff] md:border-x border-[#dce2e9] dark:border-[#27272a] min-h-screen focus:outline-none">
        {/* Main Content Area */}
        <div className="max-w-4xl mx-auto">
          {/* Header */}
        <div className="mb-6 pb-5 border-b border-border/70">
          <h1 className="text-[1.825rem] font-semibold text-foreground tracking-tight">
            Directorio de pastores
          </h1>
          <p className="text-[15px] text-muted-foreground mt-1">
            Nuestros siervos en la Región Mayo. Estamos para servirle.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-7">
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
            ref={gridRef}
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
                isOnline={isOnline}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
