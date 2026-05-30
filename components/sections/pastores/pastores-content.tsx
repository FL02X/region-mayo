"use client";

import { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal, flushSync } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Users, MapPin, Church, Phone, ChevronDown } from "lucide-react";
import { useEqualizeCardRowHeads } from "@/hooks/use-equalize-card-row-heads";
import {
  CopyPrintActions,
  CopyToast,
  PrintableInfoSheet,
  waitForImageReady,
  waitForNextPaint,
} from "@/components/shared/copy-print-actions";
import { OfflineImagePlaceholder } from "@/components/shared/offline-image-placeholder";
import { WhatsAppIconButton } from "@/components/shared/whatsapp-button";
import { SearchBar } from "@/components/shared/search-bar-sections";
import { HighlightedText } from "@/components/shared/highlighted-text";
import { ViewModeToggle, type ViewMode } from "@/components/shared/view-mode-toggle";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { searchItems, SEARCH_CONFIGS } from "@/lib/search-utils";
import type { Pastor } from "@/lib/types";

const buildPastorCopyText = (pastor: Pastor) => {
  const sections = [
    [pastor.fullName],
    pastor.temploName ? [pastor.temploName] : [],
    pastor.churchNumber ? [`Iglesia #${pastor.churchNumber}`] : [],
    pastor.address ? [pastor.address] : [],
    pastor.phone ? [formatPhoneForDisplay(pastor.phone)] : [],
    pastor.googleMapsUrl ? [pastor.googleMapsUrl] : [],
  ].filter((section) => section.length > 0);

  return sections.map((section) => section.join("\n")).join("\n\n");
};

function PrintablePastorSheet({ pastor }: { pastor: Pastor }) {
  return (
    <PrintableInfoSheet
      title={pastor.fullName}
      imageUrl={pastor.photo}
      imageAlt={pastor.fullName}
      fallbackIcon={<Users className="h-10 w-10" aria-hidden="true" />}
      sections={[
        ...(pastor.temploName
          ? [{
              id: "templo",
              label: "Iglesia Sede",
              icon: <Church className="rm-print-icon" aria-hidden="true" />,
              content: (
                <p>
                  {pastor.temploName}
                  {pastor.churchNumber ? `\nPastor Local de Iglesia #${pastor.churchNumber}` : ""}
                  {pastor.address ? `\n${pastor.address}` : ""}
                </p>
              ),
            }]
          : []),
        ...(pastor.phone
          ? [{
              id: "phone",
              label: "Número de Teléfono",
              icon: <Phone className="rm-print-icon" aria-hidden="true" />,
              content: <p>{formatPhoneForDisplay(pastor.phone)}</p>,
            }]
          : []),
      ]}
    />
  );
}

function PastorCard({
  pastor,
  searchQuery,
  onCopied,
  onPrint,
  variant = "grid",
}: {
  pastor: Pastor;
  searchQuery: string;
  onCopied: () => void;
  onPrint: (pastor: Pastor) => void;
  variant?: ViewMode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const openGoogleMaps = () => {
    if (pastor.googleMapsUrl) {
      window.open(pastor.googleMapsUrl, "_blank");
    }
  };
  const compactUtilityButtonClass =
    "inline-flex h-8 w-fit items-center gap-1.5 rounded-sm border border-border bg-[var(--surface-pane)] px-2.5 text-sm font-medium text-[var(--brand-ink)] transition-[background-color,border-color] duration-150 hover:border-[var(--brand-ink)] hover:bg-primary/10";

  const hasDetails = true;
  const actionButtons = (
    <CopyPrintActions
      copyText={buildPastorCopyText(pastor)}
      copyLabel={`Copiar información de ${pastor.fullName}`}
      printLabel={`Imprimir información de ${pastor.fullName}`}
      onCopied={onCopied}
      onPrint={() => onPrint(pastor)}
    />
  );

  const detailsContent = (
    <div className="space-y-5">
      {pastor.temploName && (
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Church className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
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
            <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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

      {actionButtons}
    </div>
  );

  if (variant === "compact") {
    return (
      <article
        id={pastor.id}
        className="bg-card border-y border-border/80 scroll-mt-[100px] transition-none target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20 md:border-x md:transition-all md:duration-700"
      >
        <div className="flex gap-3 px-0 py-4 md:gap-5 md:px-4 md:py-5">
          <div className="offline-aware-image offline-aware-image--fixed relative h-[72px] w-[72px] shrink-0 bg-muted md:h-[108px] md:w-[112px]">
            {pastor.photo ? (
              <Image
                src={pastor.photo}
                alt={pastor.fullName}
                fill
                className="offline-image-online object-cover object-center"
                sizes="(min-width: 768px) 112px, 72px"
              />
            ) : (
              <div className="offline-image-online absolute inset-0 flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground/30" aria-hidden="true" />
              </div>
            )}
            <OfflineImagePlaceholder />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-bold leading-snug text-foreground md:text-[21px]">
              <HighlightedText text={pastor.fullName} query={searchQuery} />
            </h3>
            {pastor.temploName && (
              <p className="mt-3 flex min-w-0 items-start gap-2 text-[15px] leading-snug text-foreground/80">
                <Church className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 line-clamp-2">
                  <HighlightedText text={pastor.temploName} query={searchQuery} />
                </span>
              </p>
            )}

            {hasDetails && (
              <div className="mt-3 flex flex-col items-start gap-2 md:mt-5 md:flex-row md:flex-wrap md:items-center">
                <button
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className={compactUtilityButtonClass}
                  aria-expanded={isExpanded}
                  aria-controls={`pastor-details-${pastor.id}`}
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
            )}
          </div>
        </div>

        {hasDetails && isExpanded && (
          <div
            id={`pastor-details-${pastor.id}`}
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
      id={pastor.id} 
      data-eq-card
      className="desktop-card-lift bg-card border border-border overflow-hidden flex flex-col h-full scroll-mt-[100px] transition-all duration-700 target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20"
    >
      {/* Photo */}
      <div className="offline-aware-image relative w-full bg-muted shrink-0">
        {pastor.photo ? (
          <Image
            src={pastor.photo}
            alt={pastor.fullName}
            fill
            className="offline-image-online object-cover object-center"
          />
        ) : (
          <div className="offline-image-online absolute inset-0 flex items-center justify-center">
            <Users
              className="h-8 w-8 text-muted-foreground/30"
              aria-hidden="true"
            />
          </div>
        )}
        <OfflineImagePlaceholder />
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
            {actionButtons}
        </div>
      </div>
    </div>
  );
}

interface DirectorioContentProps {
  pastors: Pastor[];
  initialViewMode?: ViewMode;
}

export function DirectorioContent({ pastors, initialViewMode }: DirectorioContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const resolvedInitialViewMode = initialViewMode ?? "grid";
  const [viewMode, setViewMode] = useState<ViewMode>(() => resolvedInitialViewMode);
  const [isOfflinePwa, setIsOfflinePwa] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [isCopyToastVisible, setIsCopyToastVisible] = useState(false);
  const [printPastor, setPrintPastor] = useState<Pastor | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const lastOnlineViewModeRef = useRef<ViewMode>(resolvedInitialViewMode);
  const copyToastTimerRef = useRef<number | null>(null);
  const copyToastExitTimerRef = useRef<number | null>(null);
  const activePrintPastorRef = useRef<Pastor | null>(null);
  const printCleanupTimerRef = useRef<number | null>(null);
  const printInFlightRef = useRef(false);
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

  const filteredPastors = useMemo(
    () => searchItems(pastors, searchQuery, SEARCH_CONFIGS.pastores),
    [pastors, searchQuery],
  );

  const handleViewModeChange = (next: ViewMode) => {
    if (isOfflinePwa) return;
    lastOnlineViewModeRef.current = next;
    setViewMode(next);
    try {
      document.cookie = `rm-view-mode-pastores=${next}; path=/; max-age=31536000; samesite=lax`;
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

  const handlePrintPastor = async (pastor: Pastor) => {
    if (printInFlightRef.current) return;

    printInFlightRef.current = true;
    if (printCleanupTimerRef.current) {
      window.clearTimeout(printCleanupTimerRef.current);
      printCleanupTimerRef.current = null;
    }
    document.body.classList.add("rm-printing");
    activePrintPastorRef.current = pastor;

    flushSync(() => {
      setPrintPastor(pastor);
    });

    const printRoot = document.querySelector(".rm-print-root");
    printRoot?.getBoundingClientRect();

    try {
      await waitForImageReady(pastor.photo);
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
    const clearPrintPastor = () => {
      if (printCleanupTimerRef.current) {
        window.clearTimeout(printCleanupTimerRef.current);
      }
      const cleanupDelay = window.matchMedia("(hover: none), (pointer: coarse)")
        .matches
        ? 8000
        : 250;

      printCleanupTimerRef.current = window.setTimeout(() => {
        document.body.classList.remove("rm-printing");
        activePrintPastorRef.current = null;
        setPrintPastor(null);
        printCleanupTimerRef.current = null;
      }, cleanupDelay);
    };

    const keepPrintClass = () => {
      if (printInFlightRef.current || activePrintPastorRef.current) {
        document.body.classList.add("rm-printing");
      }
    };

    window.addEventListener("beforeprint", keepPrintClass);
    window.addEventListener("afterprint", clearPrintPastor);
    return () => {
      if (printCleanupTimerRef.current) {
        window.clearTimeout(printCleanupTimerRef.current);
      }
      document.body.classList.remove("rm-printing");
      activePrintPastorRef.current = null;
      window.removeEventListener("beforeprint", keepPrintClass);
      window.removeEventListener("afterprint", clearPrintPastor);
    };
  }, []);

  return (
    <div
      className="w-full relative pb-20 bg-[#f1f1f1]"
      id="main-content"
      data-view-mode={viewMode}
    >
      {showCopyToast && createPortal(
        <CopyToast visible={isCopyToastVisible} />,
        document.body
      )}
      {printPastor && createPortal(
        <div className="rm-print-root">
          <PrintablePastorSheet pastor={printPastor} />
        </div>,
        document.body
      )}
      <div className="desktop-content-pane max-w-[950px] mx-auto px-4 md:px-8 py-8 pt-6 md:pt-8 bg-[#ffffff] md:border-x border-[#dce2e9] dark:border-[#27272a] min-h-screen focus:outline-none">
        {/* Main Content Area */}
        <div className="max-w-4xl mx-auto md:pl-4 md:pr-4 md:pt-1">
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

        <div className="mb-4 flex justify-end">
          <ViewModeToggle
            value={viewMode}
            onChange={handleViewModeChange}
            ariaLabel="Cambiar vista de pastores"
            disableGrid={isOfflinePwa}
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
        ) : viewMode === "compact" ? (
          <div className="mx-0 flex flex-col gap-3 md:gap-3 pb-14">
            {filteredPastors.map((pastor) => (
              <PastorCard
                key={pastor.id}
                pastor={pastor}
                searchQuery={searchQuery}
                onCopied={showCopiedToast}
                onPrint={handlePrintPastor}
                variant="compact"
              />
            ))}
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
                onCopied={showCopiedToast}
                onPrint={handlePrintPastor}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
