"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  UserCircle,
  MapPin,
  ChevronDown,
  Church,
  Phone,
} from "lucide-react";
import { useEqualizeCardRowHeads } from "@/hooks/use-equalize-card-row-heads";
import { Badge } from "@/components/ui/badge";
import { OfflineImagePlaceholder } from "@/components/shared/offline-image-placeholder";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { SearchBar } from "@/components/shared/search-bar-sections";
import { HighlightedText } from "@/components/shared/highlighted-text";
import { ViewModeToggle, type ViewMode } from "@/components/shared/view-mode-toggle";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { searchItems, SEARCH_CONFIGS } from "@/lib/search-utils";
import type { DirectivaMember } from "@/lib/types";

function DirectivaCard({
  member,
  searchQuery,
  variant = "grid",
}: {
  member: DirectivaMember;
  searchQuery: string;
  variant?: ViewMode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const openGoogleMaps = () => {
    if (member.googleMapsUrl) {
      window.open(member.googleMapsUrl, "_blank");
    }
  };

  const detailsContent = (
    <div className="space-y-5">
      {member.temploName && (
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Church className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-[5px]">
              Iglesia Sede
            </p>
            {member.temploId ? (
              <Link
                href={`/templos#${member.temploId}`}
                className="inline-flex items-center gap-1 w-fit text-sm font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 leading-tight mb-2 transition-colors"
                aria-label={`Ver información de ${member.temploName}`}
              >
                <span className="inline-block">
                  <HighlightedText text={member.temploName} query={searchQuery} />
                </span>
              </Link>
            ) : (
              <p className="text-sm font-medium text-foreground leading-[1.15] mb-2">
                <HighlightedText text={member.temploName} query={searchQuery} />
              </p>
            )}
            {member.address && (
              <div className="flex items-start gap-1.5 mb-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-foreground/70 leading-tight">
                  <HighlightedText text={member.address} query={searchQuery} />
                </p>
              </div>
            )}
            {member.googleMapsUrl && (
              <button
                onClick={openGoogleMaps}
                className="text-sm font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors flex items-center gap-1.5"
                aria-label={`Ver ubicación de ${member.temploName} en Google Maps`}
              >
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Ver ubicación</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
            Contacto
          </p>
          <p className="text-sm font-medium text-foreground leading-tight">
            <HighlightedText text={formatPhoneForDisplay(member.phone)} query={searchQuery} />
          </p>
        </div>
      </div>

      <WhatsAppButton
        phone={member.phone}
        message={`Hola ${member.fullName}, me comunico del sitio web de Región Mayo.`}
        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
      />
    </div>
  );

  if (variant === "compact") {
    return (
      <article
        id={member.id}
        className="bg-card border-y border-border/80 scroll-mt-[100px] transition-none target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20 md:border-x md:transition-all md:duration-700"
      >
        <div className="flex gap-3 px-0 py-4 md:gap-5 md:px-4 md:py-5">
          <div className="offline-aware-image offline-aware-image--fixed relative h-[72px] w-[72px] shrink-0 bg-muted md:h-[108px] md:w-[112px]">
            {member.photo ? (
              <Image
                src={member.photo}
                alt={member.fullName}
                fill
                className="offline-image-online object-cover object-center"
                sizes="(min-width: 768px) 112px, 72px"
              />
            ) : (
              <div className="offline-image-online absolute inset-0 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-muted-foreground/30" aria-hidden="true" />
              </div>
            )}
            <OfflineImagePlaceholder />
          </div>

          <div className="min-w-0 flex-1">
            {member.role && (
              <p className="mb-1.5 flex w-fit items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2f5e93] md:text-xs">
                <UserCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span><HighlightedText text={member.role} query={searchQuery} /></span>
              </p>
            )}
            <h3 className="text-[16px] font-bold leading-snug text-foreground md:text-[21px]">
              <HighlightedText text={member.fullName} query={searchQuery} />
            </h3>
            {member.temploName && (
              <p className="mt-3 flex min-w-0 items-start gap-2 text-[15px] leading-snug text-foreground/80">
                <Church className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 line-clamp-2">
                  <HighlightedText text={member.temploName} query={searchQuery} />
                </span>
              </p>
            )}

            <div className="mt-3 flex flex-col items-start gap-2 md:mt-5 md:flex-row md:flex-wrap md:items-center">
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="inline-flex h-8 items-center gap-1.5 border border-border bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-expanded={isExpanded}
                aria-controls={`directiva-details-${member.id}`}
                style={{ minHeight: "unset", minWidth: "unset" }}
              >
                <span>{isExpanded ? "Ocultar información" : "Ver información"}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div
            id={`directiva-details-${member.id}`}
            className="border-t border-border/80 bg-muted/20 px-3 py-4 md:px-5 md:py-5"
          >
            {detailsContent}
          </div>
        )}
      </article>
    );
  }

  return (
    <div 
      id={member.id} 
      data-eq-card
      className="desktop-card-lift bg-card border border-border overflow-hidden flex flex-col h-full scroll-mt-[100px] transition-all duration-700 target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20"
    >
      {/* Photo */}
      <div className="offline-aware-image relative w-full bg-muted shrink-0">
        {member.photo ? (
          <Image
            src={member.photo}
            alt={member.fullName}
            fill
            className="offline-image-online object-cover object-center"
          />
        ) : (
          <div className="offline-image-online absolute inset-0 flex items-center justify-center">
            <UserCircle
              className="h-10 w-10 text-muted-foreground/30"
              aria-hidden="true"
            />
          </div>
        )}
        <OfflineImagePlaceholder />
        {member.role && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-foreground/85 text-background text-xs font-medium">
              <HighlightedText text={member.role} query={searchQuery} />
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div data-eq-head>
          <h3 className="font-semibold text-lg text-foreground leading-snug mb-4">
            <HighlightedText text={member.fullName} query={searchQuery} />
          </h3>
        </div>

        <div className="space-y-5 pt-5 pb-5 border-t border-border">
          {/* Temple Information */}
          {member.temploName && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Church
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-[5px]">
                    Iglesia Sede
                  </p>
                  {member.temploId ? (
                    <Link
                      href={`/templos#${member.temploId}`}
                      className="inline-flex items-center gap-1 w-fit text-sm font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 leading-tight mb-2 transition-colors"
                      aria-label={`Ver información de ${member.temploName}`}
                    >
                      <span className="inline-block">
                        <HighlightedText text={member.temploName} query={searchQuery} />
                      </span>
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-foreground leading-[1.15] mb-2">
                      <HighlightedText text={member.temploName} query={searchQuery} />
                    </p>
                  )}
                  {member.address && (
                    <div className="flex items-start gap-1.5 mb-1.5">
                      <MapPin
                        className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <p className="text-sm text-foreground/70 leading-tight">
                        <HighlightedText text={member.address} query={searchQuery} />
                      </p>
                    </div>
                  )}
                  {member.googleMapsUrl && (
                    <button
                      onClick={openGoogleMaps}
                      className="text-sm font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors flex items-center gap-1.5"
                      aria-label={`Ver ubicación de ${member.temploName} en Google Maps`}
                    >
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Ver ubicación</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Phone display with icon */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Phone
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Contacto
                </p>
                <p className="text-sm font-medium text-foreground leading-tight">
                  <HighlightedText text={formatPhoneForDisplay(member.phone)} query={searchQuery} />
                </p>
              </div>
            </div>

            {/* WhatsApp Button - Green */}
            <WhatsAppButton
              phone={member.phone}
              message={`Hola ${member.fullName}, me comunico del sitio web de Región Mayo.`}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
            />
        </div>
      </div>
    </div>
  );
}

interface DirectivaContentProps {
  members: DirectivaMember[];
  initialViewMode?: ViewMode;
}

export function DirectivaContent({ members, initialViewMode }: DirectivaContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const resolvedInitialViewMode = initialViewMode ?? "grid";
  const [viewMode, setViewMode] = useState<ViewMode>(() => resolvedInitialViewMode);
  const [isOfflinePwa, setIsOfflinePwa] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const lastOnlineViewModeRef = useRef<ViewMode>(resolvedInitialViewMode);
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

  useEffect(() => {
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

  const filteredMembers = useMemo(
    () => searchItems(members, searchQuery, SEARCH_CONFIGS.directiva),
    [members, searchQuery],
  );

  const handleViewModeChange = (next: ViewMode) => {
    if (isOfflinePwa) return;
    lastOnlineViewModeRef.current = next;
    setViewMode(next);
    try {
      document.cookie = `rm-view-mode-directiva=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Ignore cookie write failures
    }
  };

  return (
    <div className="w-full relative pb-16 bg-[#f1f1f1]" id="main-content">
      <div className="desktop-content-pane max-w-[950px] mx-auto px-4 md:px-8 py-6 pt-[78px] md:pt-[84px] bg-[#ffffff] md:border-x border-[#e5e7eb] dark:border-[#27272a] min-h-screen focus:outline-none">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-[1.825rem] font-semibold text-foreground tracking-tight">Directiva de jovenes</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Miembros de la directiva regional
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearchChange={setSearchQuery}
            placeholder="Buscar por nombre, cargo, templo o teléfono..."
          />
        </div>

        <div className="mb-4 flex justify-end">
          <ViewModeToggle
            value={viewMode}
            onChange={handleViewModeChange}
            ariaLabel="Cambiar vista de directiva"
          />
        </div>

        {/* Info notice — plain, no icon circle */}
        <div className="border border-border bg-muted/30 p-4 mb-6 text-sm text-muted-foreground">
          Contacta a cualquier miembro de la directiva directamente por
          WhatsApp. Estamos aquí para servirte.
        </div>

        {filteredMembers.length === 0 ? (
          <div className="bg-card border border-border p-8 text-center">
            <UserCircle
              className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground mb-1">
              {members.length === 0
                ? "Sin miembros de directiva registrados"
                : "No se encontraron resultados"}
            </p>
            <p className="text-xs text-muted-foreground">
              {members.length === 0
                ? "La información se actualizará pronto."
                : "Intenta con otros términos de búsqueda."}
            </p>
          </div>
        ) : viewMode === "compact" ? (
          <div className="mx-0 flex flex-col gap-3 md:gap-3 pb-14">
            {filteredMembers.map((member) => (
              <DirectivaCard
                key={member.id}
                member={member}
                searchQuery={searchQuery}
                variant="compact"
              />
            ))}
          </div>
        ) : (
          <div
            ref={gridRef}
            className={`grid gap-4 ${
              filteredMembers.length === 1
                ? "grid-cols-1 max-w-sm mx-auto"
                : filteredMembers.length === 2
                  ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {filteredMembers.map((member) => (
              <DirectivaCard
                key={member.id}
                member={member}
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
