"use client";

import { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal, flushSync } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Music,
  MapPin,
  ChevronDown,
  User,
  Church,
} from "lucide-react";
import { useEqualizeCardRowHeads } from "@/hooks/use-equalize-card-row-heads";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobilePageTransition } from "@/components/shared/mobile-page-transition";
import {
  CopyPrintActions,
  CopyToast,
  PrintableInfoSheet,
  waitForImageReady,
  waitForNextPaint,
} from "@/components/shared/copy-print-actions";
import { WhatsAppIconButton } from "@/components/shared/whatsapp-button";
import { OfflineImagePlaceholder } from "@/components/shared/offline-image-placeholder";
import { SearchBar } from "@/components/shared/search-bar-sections";
import { HighlightedText } from "@/components/shared/highlighted-text";
import { ViewModeToggle, type ViewMode } from "@/components/shared/view-mode-toggle";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { sanityImageVariantUrl } from "@/lib/sanity/image";
import { searchItems, SEARCH_CONFIGS } from "@/lib/search-utils";
import type { Coro } from "@/lib/types";

const expandTransition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};

const CORO_THUMB_IMAGE_OPTIONS = {
  width: 320,
  quality: 72,
  format: "webp",
  fit: "max",
} as const;

const CORO_CARD_IMAGE_OPTIONS = {
  width: 960,
  quality: 72,
  format: "webp",
  fit: "max",
} as const;

const CORO_PRINT_IMAGE_OPTIONS = {
  width: 1200,
  quality: 78,
  format: "webp",
  fit: "max",
} as const;

const getCoroImageUrl = (photo?: string, kind: "thumb" | "card" | "print" = "card") => {
  if (!photo) return "";

  if (kind === "thumb") {
    return sanityImageVariantUrl(photo, CORO_THUMB_IMAGE_OPTIONS);
  }

  if (kind === "print") {
    return sanityImageVariantUrl(photo, CORO_PRINT_IMAGE_OPTIONS);
  }

  return sanityImageVariantUrl(photo, CORO_CARD_IMAGE_OPTIONS);
};

const buildCoroCopyText = (coro: Coro) => {
  const sections = [
    [coro.coroName],
    coro.temploName ? [coro.temploName] : [],
    coro.address ? [coro.address] : [],
    [
      coro.presidentPhone
        ? `${coro.presidentName}\n${formatPhoneForDisplay(coro.presidentPhone)}`
        : coro.presidentName,
    ],
    coro.googleMapsUrl ? [coro.googleMapsUrl] : [],
  ].filter((section) => section.length > 0);

  return sections.map((section) => section.join("\n")).join("\n\n");
};

function PrintableCoroSheet({ coro }: { coro: Coro }) {
  const imageUrl = getCoroImageUrl(coro.photo, "print");

  return (
    <PrintableInfoSheet
      title={coro.coroName}
      imageUrl={imageUrl}
      imageAlt={coro.coroName}
      fallbackIcon={<Music className="h-10 w-10" aria-hidden="true" />}
      sections={[
        ...(coro.temploName
          ? [{
              id: "templo",
              label: "Iglesia Sede",
              icon: <Church className="rm-print-icon" aria-hidden="true" />,
              content: (
                <p>
                  {coro.temploName}
                  {coro.address ? `\n${coro.address}` : ""}
                </p>
              ),
            }]
          : []),
        {
          id: "president",
          label: "Presidente de Coro",
          icon: <User className="rm-print-icon" aria-hidden="true" />,
          content: (
            <p>
              {coro.presidentName}
              {coro.presidentPhone ? `\n${formatPhoneForDisplay(coro.presidentPhone)}` : ""}
            </p>
          ),
        },
      ]}
    />
  );
}

function CoroCard({
  coro,
  searchQuery,
  onCopied,
  onPrint,
  variant = "grid",
}: {
  coro: Coro;
  searchQuery: string;
  onCopied: () => void;
  onPrint: (coro: Coro) => void;
  variant?: ViewMode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();

  const openGoogleMaps = () => {
    if (coro.googleMapsUrl) {
      window.open(coro.googleMapsUrl, "_blank");
    }
  };
  const compactUtilityButtonClass =
    "inline-flex h-8 w-fit items-center gap-1.5 rounded-sm border border-border bg-[var(--surface-pane)] px-2.5 text-sm font-medium text-[var(--brand-ink)] transition-[background-color,border-color] duration-150 hover:border-[var(--brand-ink)] hover:bg-primary/10";

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

  const actionButtons = (
    <CopyPrintActions
      copyText={buildCoroCopyText(coro)}
      copyLabel={`Copiar información de ${coro.coroName}`}
      printLabel={`Imprimir información de ${coro.coroName}`}
      onCopied={onCopied}
      onPrint={() => onPrint(coro)}
    />
  );

  const detailsContent = (
    <>
      {coro.temploName && (
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Church className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-[0px]">
              Iglesia Sede
            </p>
            {coro.temploId ? (
              <Link
                href={`/templos#${coro.temploId}`}
                className="inline-flex items-center gap-1 w-fit text-sm font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 leading-tight mb-2 transition-colors"
                aria-label={`Ver información de ${coro.temploName}`}
              >
                <span className="inline-block">
                  <HighlightedText text={coro.temploName} query={searchQuery} />
                </span>
              </Link>
            ) : (
              <p className="text-sm font-medium text-foreground leading-[1.15] mb-2">
                <HighlightedText text={coro.temploName} query={searchQuery} />
              </p>
            )}
            {coro.address && (
              <div className="flex items-start gap-1.5 mb-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-foreground/80">
                  <HighlightedText text={coro.address} query={searchQuery} />
                </p>
              </div>
            )}
            {coro.googleMapsUrl && (
              <button
                onClick={openGoogleMaps}
                className="text-sm font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors flex items-center gap-1.5"
                aria-label={`Ver ubicación de ${coro.temploName} en Maps`}
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
          <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
            Presidente de Coro
          </p>
          <p className="text-sm font-medium text-foreground leading-tight">
            <HighlightedText text={coro.presidentName} query={searchQuery} />
          </p>
          {coro.presidentPhone && (
            <p className="text-sm text-foreground/60 mt-0.5">
              <HighlightedText text={formatPhoneForDisplay(coro.presidentPhone)} query={searchQuery} />
            </p>
          )}
        </div>
        {coro.presidentPhone && (
          <WhatsAppIconButton
            phone={coro.presidentPhone}
            message={`Hola, me comunico del sitio web de Region Mayo respecto al ${coro.coroName}`}
          />
        )}
      </div>

      {actionButtons}
    </>
  );

  if (variant === "compact") {
    return (
      <article
        id={coro.id}
        className="bg-card border-y border-border/80 scroll-mt-[100px] transition-none target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20 md:border-x md:transition-all md:duration-700"
      >
        <div className="flex gap-3 px-0 py-4 md:gap-5 md:px-4 md:py-5">
          <div className="offline-aware-image offline-aware-image--fixed relative h-[72px] w-[72px] shrink-0 bg-muted md:h-[108px] md:w-[112px]">
            {coro.photo ? (
              <Image
                src={getCoroImageUrl(coro.photo, "thumb")}
                alt={coro.coroName}
                fill
                className="offline-image-online object-cover object-center"
                sizes="(min-width: 768px) 112px, 72px"
                quality={72}
              />
            ) : (
              <div className="offline-image-online absolute inset-0 flex items-center justify-center">
                <Music className="h-5 w-5 text-muted-foreground/30" aria-hidden="true" />
              </div>
            )}
            <OfflineImagePlaceholder />
          </div>

          <div className="min-w-0 flex-1">
            <p className="mb-1.5 flex w-fit items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2f5e93] md:text-xs">
              <Music className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Coro local</span>
            </p>
            <h3 className="text-[16px] font-bold leading-snug text-foreground md:text-[21px]">
              <HighlightedText text={coro.coroName} query={searchQuery} />
            </h3>
            {coro.presidentName && (
              <p className="mt-3 flex min-w-0 items-start gap-2 text-[15px] leading-snug text-foreground/80">
                <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 line-clamp-2">
                  Presidente: <HighlightedText text={coro.presidentName} query={searchQuery} />
                </span>
              </p>
            )}

            <div className="mt-3 flex flex-col items-start gap-2 md:mt-5 md:flex-row md:flex-wrap md:items-center">
              <button
                onClick={handleToggle}
                className={compactUtilityButtonClass}
                aria-expanded={isExpanded}
                aria-controls={`coro-details-${coro.id}`}
                style={{ minHeight: "unset", minWidth: "unset" }}
              >
                  {isExpanded ? (
                    <span>Ocultar información</span>
                  ) : (
                    <>
                      <span className="md:hidden">Ver información</span>
                      <span className="hidden md:inline">Ver información de contacto</span>
                    </>
                  )}
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

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="compact-details"
              id={`coro-details-${coro.id}`}
              initial={isMobile ? { height: 0, opacity: 0 } : false}
              animate={{ height: "auto", opacity: 1 }}
              exit={isMobile ? { height: 0, opacity: 0 } : undefined}
              transition={isMobile ? expandTransition : { duration: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-5 border-t border-border/80 bg-muted/20 px-3 py-4 md:px-5 md:py-5">
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
      id={coro.id} 
      data-eq-card
      className="desktop-card-lift bg-card border border-border overflow-hidden flex flex-col h-full scroll-mt-[100px] transition-all duration-700 target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20"
    >
      {/* Photo */}
      <div className="offline-aware-image relative w-full bg-muted shrink-0">
        {coro.photo ? (
          <Image
            src={getCoroImageUrl(coro.photo)}
            alt={coro.coroName}
            fill
            className="offline-image-online object-cover object-center"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={72}
          />
        ) : (
          <div className="offline-image-online absolute inset-0 flex items-center justify-center">
            <Music
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
            <HighlightedText text={coro.coroName} query={searchQuery} />
          </h3>
        </div>

        <div className="flex flex-col">
          <div className="-mx-4 border-t border-border">
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

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="grid-details"
                id={`coro-details-${coro.id}`}
                initial={isMobile ? { height: 0, opacity: 0 } : false}
                animate={{ height: "auto", opacity: 1 }}
                exit={isMobile ? { height: 0, opacity: 0 } : undefined}
                transition={isMobile ? expandTransition : { duration: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-5 pt-5 pb-5 px-4 -mx-4 border-t border-border">
                {/* Temple Information */}
                {coro.temploName && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Church className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-[0px]">
                        Iglesia Sede
                      </p>
                      {coro.temploId ? (
                        <Link
                          href={`/templos#${coro.temploId}`}
                          className="inline-flex items-center gap-1 w-fit text-sm font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 leading-tight mb-2 transition-colors"
                          aria-label={`Ver información de ${coro.temploName}`}
                        >
                          <span className="inline-block">
                            <HighlightedText text={coro.temploName} query={searchQuery} />
                          </span>
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-foreground leading-[1.15] mb-2">
                          <HighlightedText text={coro.temploName} query={searchQuery} />
                        </p>
                      )}
                      {coro.address && (
                        <div className="flex items-start gap-1.5 mb-1.5">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                          <p className="text-sm text-foreground/80">
                            <HighlightedText text={coro.address} query={searchQuery} />
                          </p>
                        </div>
                      )}
                      {coro.googleMapsUrl && (
                        <button
                          onClick={openGoogleMaps}
                          className="text-sm font-normal text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors flex items-center gap-1.5"
                          aria-label={`Ver ubicación de ${coro.temploName} en Maps`}
                        >
                          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>Ver ubicación</span>
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
                      <p className="text-sm text-foreground/60 mt-0.5">
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

interface CorosContentProps {
  coros: Coro[];
  initialViewMode?: ViewMode;
}

export function CorosContent({ coros, initialViewMode }: CorosContentProps) {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const resolvedInitialViewMode = initialViewMode ?? "grid";
  const [viewMode, setViewMode] = useState<ViewMode>(() => resolvedInitialViewMode);
  const [isOfflinePwa, setIsOfflinePwa] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [isCopyToastVisible, setIsCopyToastVisible] = useState(false);
  const [printCoro, setPrintCoro] = useState<Coro | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const lastOnlineViewModeRef = useRef<ViewMode>(resolvedInitialViewMode);
  const copyToastTimerRef = useRef<number | null>(null);
  const copyToastExitTimerRef = useRef<number | null>(null);
  const activePrintCoroRef = useRef<Coro | null>(null);
  const printCleanupTimerRef = useRef<number | null>(null);
  const printInFlightRef = useRef(false);
  useEqualizeCardRowHeads(gridRef);

  useEffect(() => {
    let isSubscribed = true;
    const timers: number[] = [];

    const applyHighlightById = (id: string) => {
      let attempts = 0;

      const attempt = () => {
        if (!isSubscribed) return;

        const el = document.getElementById(id);
        if (el) {
          const existing = document.querySelectorAll(".global-highlight");
          existing.forEach((node) => node.classList.remove("global-highlight"));

          el.classList.add("global-highlight");
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }

        if (attempts < 24) {
          attempts += 1;
          timers.push(window.setTimeout(attempt, 60));
        }
      };

      attempt();
    };

    const syncFromHash = () => {
      if (!isSubscribed) return;
      const rawHash = window.location.hash;
      if (!rawHash) return;

      const id = decodeURIComponent(rawHash.substring(1));
      if (!id) return;

      applyHighlightById(id);
    };

    syncFromHash();

    // In client navigation, hash can appear slightly after mount.
    [80, 180, 320, 520, 900].forEach((delay) => {
      timers.push(window.setTimeout(syncFromHash, delay));
    });

    window.addEventListener("hashchange", syncFromHash, { passive: true });

    return () => {
      isSubscribed = false;
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("hashchange", syncFromHash);
    };
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

  const filteredCoros = useMemo(
    () => searchItems(coros, searchQuery, SEARCH_CONFIGS.coros),
    [coros, searchQuery],
  );

  const handleViewModeChange = (next: ViewMode) => {
    if (isOfflinePwa) return;
    lastOnlineViewModeRef.current = next;
    setViewMode(next);
    try {
      document.cookie = `rm-view-mode-coros=${next}; path=/; max-age=31536000; samesite=lax`;
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

  const handlePrintCoro = async (coro: Coro) => {
    if (printInFlightRef.current) return;

    printInFlightRef.current = true;
    if (printCleanupTimerRef.current) {
      window.clearTimeout(printCleanupTimerRef.current);
      printCleanupTimerRef.current = null;
    }
    document.body.classList.add("rm-printing");
    activePrintCoroRef.current = coro;

    flushSync(() => {
      setPrintCoro(coro);
    });

    const printRoot = document.querySelector(".rm-print-root");
    printRoot?.getBoundingClientRect();

    try {
      await waitForImageReady(getCoroImageUrl(coro.photo, "print"));
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
    const clearPrintCoro = () => {
      if (printCleanupTimerRef.current) {
        window.clearTimeout(printCleanupTimerRef.current);
      }
      const cleanupDelay = window.matchMedia("(hover: none), (pointer: coarse)")
        .matches
        ? 8000
        : 250;

      printCleanupTimerRef.current = window.setTimeout(() => {
        document.body.classList.remove("rm-printing");
        activePrintCoroRef.current = null;
        setPrintCoro(null);
        printCleanupTimerRef.current = null;
      }, cleanupDelay);
    };

    const keepPrintClass = () => {
      if (printInFlightRef.current || activePrintCoroRef.current) {
        document.body.classList.add("rm-printing");
      }
    };

    window.addEventListener("beforeprint", keepPrintClass);
    window.addEventListener("afterprint", clearPrintCoro);
    return () => {
      if (printCleanupTimerRef.current) {
        window.clearTimeout(printCleanupTimerRef.current);
      }
      document.body.classList.remove("rm-printing");
      activePrintCoroRef.current = null;
      window.removeEventListener("beforeprint", keepPrintClass);
      window.removeEventListener("afterprint", clearPrintCoro);
    };
  }, []);

  return (
    <MobilePageTransition
      axis="x"
      className="w-full relative pb-20 bg-[#f1f1f1]"
      id="main-content"
      data-view-mode={viewMode}
    >
      {showCopyToast && createPortal(
        <CopyToast visible={isCopyToastVisible} />,
        document.body
      )}
      {printCoro && createPortal(
        <div className="rm-print-root">
          <PrintableCoroSheet coro={printCoro} />
        </div>,
        document.body
      )}
      <div className="desktop-content-pane max-w-[950px] mx-auto px-4 md:px-8 py-8 pt-[82px] md:pt-[88px] bg-[#ffffff] md:border-x border-[#dce2e9] dark:border-[#27272a] min-h-screen focus:outline-none">
        <div className="max-w-4xl mx-auto md:pl-4 md:pr-4 md:pt-1">
          {/* Header */}
        <div className="mb-6 pb-5 border-b border-border/70">
          <h1 className="text-[1.825rem] font-semibold text-foreground tracking-tight">Coros juveniles</h1>
          <p className="text-[17px] text-muted-foreground mt-1">
            Nuestros coros de la región
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-7">
          <SearchBar
            onSearchChange={setSearchQuery}
            placeholder="Buscar por nombre, presidente o teléfono..."
          />
        </div>

        <div className="mb-4 flex justify-end">
          <ViewModeToggle
            value={viewMode}
            onChange={handleViewModeChange}
            ariaLabel="Cambiar vista de coros"
            disableGrid={isOfflinePwa}
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
          <AnimatePresence mode={isMobile ? "wait" : "sync"} initial={false}>
            {viewMode === "compact" ? (
              <motion.div
                key="coros-compact"
                initial={isMobile ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={isMobile ? { opacity: 0, y: -4 } : undefined}
                transition={isMobile ? { duration: 0.18, ease: "easeOut" } : { duration: 0 }}
                className="mx-0 flex flex-col gap-3 md:gap-3 pb-14"
              >
                {filteredCoros.map((coro) => (
                  <CoroCard
                    key={coro.id}
                    coro={coro}
                    searchQuery={searchQuery}
                    onCopied={showCopiedToast}
                    onPrint={handlePrintCoro}
                    variant="compact"
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="coros-grid"
                ref={gridRef}
                initial={isMobile ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={isMobile ? { opacity: 0, y: -4 } : undefined}
                transition={isMobile ? { duration: 0.18, ease: "easeOut" } : { duration: 0 }}
                className={`grid gap-4 ${
                  filteredCoros.length === 1
                    ? "grid-cols-1 max-w-sm mx-auto"
                    : filteredCoros.length === 2
                      ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {filteredCoros.map((coro) => (
                  <div key={coro.id} className="h-full">
                    <CoroCard
                      coro={coro}
                      searchQuery={searchQuery}
                      onCopied={showCopiedToast}
                      onPrint={handlePrintCoro}
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      </div>
    </MobilePageTransition>
  );
}
