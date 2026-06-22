"use client";

import { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal, flushSync } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Bricolage_Grotesque, Newsreader } from "next/font/google";
import {
  BarChart3,
  ChevronDown,
  Church,
  FileText,
  MapPin,
  Mic,
  Music,
  PenLine,
  Phone,
  UserCircle,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useEqualizeCardRowHeads } from "@/hooks/use-equalize-card-row-heads";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import {
  CopyPrintActions,
  CopyToast,
  PrintableInfoSheet,
  waitForImageReady,
  waitForNextPaint,
} from "@/components/shared/copy-print-actions";
import { OfflineImagePlaceholder } from "@/components/shared/offline-image-placeholder";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { SearchBar } from "@/components/shared/search-bar-sections";
import { HighlightedText } from "@/components/shared/highlighted-text";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/components/shared/view-mode-toggle";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { sanityImageVariantUrl } from "@/lib/sanity/image";
import { searchItems, SEARCH_CONFIGS } from "@/lib/search-utils";
import type { DirectivaGeneration, DirectivaMember } from "@/lib/types";

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const memberNameFont = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  preload: false,
});

const DIRECTIVA_ROLE_META: Record<string, { label: string; order: number }> = {
  "01_presidente_regional": { label: "Presidente Regional", order: 1 },
  "02_suplente_presidente_regional": {
    label: "Suplente Presidente Regional",
    order: 2,
  },
  "03_secretario": { label: "Secretario", order: 3 },
  "04_suplente_secretario": { label: "Suplente Secretario", order: 4 },
  "05_cronista": { label: "Cronista", order: 5 },
  "06_suplente_cronista": { label: "Suplente de Cronista", order: 6 },
  "07_estadistica": { label: "Estadistica", order: 7 },
  "08_suplente_estadistica": { label: "Suplente de Estadistica", order: 8 },
  "09_tesorera": { label: "Tesoreria", order: 9 },
  "10_suplente_tesorera": { label: "Suplente de Tesoreria", order: 10 },
  "11_director_canto": { label: "Director de Canto", order: 11 },
  "12_suplente_director_canto": {
    label: "Suplente de Director de Canto",
    order: 12,
  },
  "13_director_musica": { label: "Director de Musica", order: 13 },
  "14_suplente_director_musica": {
    label: "Suplente de Director de Musica",
    order: 14,
  },

  // Compatibilidad con valores legacy guardados antes de reordenar tesoreria.
  "09_director_canto": { label: "Director de Canto", order: 11 },
  "10_suplente_director_canto": {
    label: "Suplente de Director de Canto",
    order: 12,
  },
  "11_director_musica": { label: "Director de Musica", order: 13 },
  "12_suplente_director_musica": {
    label: "Suplente de Director de Musica",
    order: 14,
  },
};

const getDirectivaRoleLabel = (role?: string) => {
  if (!role) return "";
  return DIRECTIVA_ROLE_META[role]?.label ?? role;
};

const getDirectivaRoleOrder = (role?: string) => {
  if (!role) return Number.MAX_SAFE_INTEGER;

  const roleOrder = DIRECTIVA_ROLE_META[role]?.order;
  if (typeof roleOrder === "number") {
    return roleOrder;
  }

  const prefixed = Number.parseInt(role.split("_")[0], 10);
  if (Number.isFinite(prefixed)) {
    return prefixed;
  }

  return Number.MAX_SAFE_INTEGER;
};

const DIRECTIVA_ROLE_ICON: Record<string, LucideIcon> = {
  "01_presidente_regional": UserCircle,
  "02_suplente_presidente_regional": UserCircle,
  "03_secretario": FileText,
  "04_suplente_secretario": FileText,
  "05_cronista": PenLine,
  "06_suplente_cronista": PenLine,
  "07_estadistica": BarChart3,
  "08_suplente_estadistica": BarChart3,
  "09_tesorera": Wallet,
  "10_suplente_tesorera": Wallet,
  "11_director_canto": Mic,
  "12_suplente_director_canto": Mic,
  "13_director_musica": Music,
  "14_suplente_director_musica": Music,

  "09_director_canto": Mic,
  "10_suplente_director_canto": Mic,
  "11_director_musica": Music,
  "12_suplente_director_musica": Music,
};

const getDirectivaRoleIcon = (role?: string): LucideIcon =>
  role ? DIRECTIVA_ROLE_ICON[role] ?? UserCircle : UserCircle;

const expandTransition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};

const DIRECTIVA_THUMB_IMAGE_OPTIONS = {
  width: 320,
  quality: 72,
  format: "webp",
  fit: "max",
} as const;

const DIRECTIVA_CARD_IMAGE_OPTIONS = {
  width: 960,
  quality: 72,
  format: "webp",
  fit: "max",
} as const;

const DIRECTIVA_PRINT_IMAGE_OPTIONS = {
  width: 1200,
  quality: 78,
  format: "webp",
  fit: "max",
} as const;

const getDirectivaImageUrl = (
  photo?: string,
  kind: "thumb" | "card" | "print" = "card",
) => {
  if (!photo) return "";

  if (kind === "thumb") {
    return sanityImageVariantUrl(photo, DIRECTIVA_THUMB_IMAGE_OPTIONS);
  }

  if (kind === "print") {
    return sanityImageVariantUrl(photo, DIRECTIVA_PRINT_IMAGE_OPTIONS);
  }

  return sanityImageVariantUrl(photo, DIRECTIVA_CARD_IMAGE_OPTIONS);
};

const buildDirectivaCopyText = (member: DirectivaMember) => {
  const roleLabel = getDirectivaRoleLabel(member.role);
  const sections = [
    [member.fullName],
    roleLabel ? [roleLabel] : [],
    member.temploName ? [member.temploName] : [],
    member.address ? [member.address] : [],
    [formatPhoneForDisplay(member.phone)],
    member.googleMapsUrl ? [member.googleMapsUrl] : [],
  ].filter((section) => section.length > 0);

  return sections.map((section) => section.join("\n")).join("\n\n");
};

function PrintableDirectivaSheet({ member }: { member: DirectivaMember }) {
  const imageUrl = getDirectivaImageUrl(member.photo, "print");
  const roleLabel = getDirectivaRoleLabel(member.role);

  return (
    <PrintableInfoSheet
      title={member.fullName}
      imageUrl={imageUrl}
      imageAlt={member.fullName}
      fallbackIcon={<UserCircle className="h-10 w-10" aria-hidden="true" />}
      sections={[
        ...(roleLabel
          ? [
              {
                id: "role",
                label: "Cargo",
                icon: (
                  <UserCircle className="rm-print-icon" aria-hidden="true" />
                ),
                content: <p>{roleLabel}</p>,
              },
            ]
          : []),
        ...(member.temploName
          ? [
              {
                id: "templo",
                label: "Iglesia Sede",
                icon: <Church className="rm-print-icon" aria-hidden="true" />,
                content: (
                  <p>
                    {member.temploName}
                    {member.address ? `\n${member.address}` : ""}
                  </p>
                ),
              },
            ]
          : []),
        {
          id: "phone",
          label: "Contacto",
          icon: <Phone className="rm-print-icon" aria-hidden="true" />,
          content: <p>{formatPhoneForDisplay(member.phone)}</p>,
        },
      ]}
    />
  );
}

function DirectivaCard({
  member,
  searchQuery,
  onCopied,
  onPrint,
  variant = "grid",
}: {
  member: DirectivaMember;
  searchQuery: string;
  onCopied: () => void;
  onPrint: (member: DirectivaMember) => void;
  variant?: ViewMode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  const roleLabel = getDirectivaRoleLabel(member.role);
  const RoleIcon = getDirectivaRoleIcon(member.role);

  const openGoogleMaps = () => {
    if (member.googleMapsUrl) {
      window.open(member.googleMapsUrl, "_blank");
    }
  };
  const compactUtilityButtonClass =
    "inline-flex h-8 w-fit items-center gap-1.5 rounded-sm bg-surface-pane text-sm font-medium text-brand-ink transition-[background-color,border-color] duration-150 hover:border-brand-ink hover:bg-primary/10";

  const actionButtons = (
    <CopyPrintActions
      copyText={buildDirectivaCopyText(member)}
      copyLabel={`Copiar información de ${member.fullName}`}
      printLabel={`Imprimir información de ${member.fullName}`}
      onCopied={onCopied}
      onPrint={() => onPrint(member)}
    />
  );

  const detailsContent = (
    <div className="space-y-5">
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
                  <HighlightedText
                    text={member.temploName}
                    query={searchQuery}
                  />
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

      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
            Contacto
          </p>
          <p className="text-sm font-medium text-foreground leading-tight">
            <HighlightedText
              text={formatPhoneForDisplay(member.phone)}
              query={searchQuery}
            />
          </p>
        </div>
      </div>

      <WhatsAppButton
        phone={member.phone}
        message={`Hola ${member.fullName}, me comunico del sitio web de Región Mayo.`}
        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
      />

      {actionButtons}
    </div>
  );

  if (variant === "compact") {
    return (
      <article
        id={member.id}
        className="md:bg-card md:border-y md:border-border/80 scroll-mt-[100px] transition-none target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20 md:border-x md:transition-all md:duration-700"
      >
        <div className="flex gap-3 px-0 py-4 md:gap-5 md:px-4 md:py-5">
          <div className="offline-hide-when-offline offline-aware-image offline-aware-image--fixed relative h-[92px] w-[92px] shrink-0 bg-muted md:h-[108px] md:w-[112px]">
            {member.photo ? (
              <Image
                src={getDirectivaImageUrl(member.photo, "thumb")}
                alt={member.fullName}
                fill
                unoptimized
                className="offline-image-online object-contain object-center"
                sizes="(min-width: 768px) 112px, 72px"
                quality={72}
              />
            ) : (
              <div className="offline-image-online absolute inset-0 flex items-center justify-center">
                <UserCircle
                  className="h-6 w-6 text-muted-foreground/30"
                  aria-hidden="true"
                />
              </div>
            )}
            <OfflineImagePlaceholder />
          </div>

          <div className="min-w-0 flex-1">
            {roleLabel && (
              <p className="mb-1.5 flex w-fit items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-[#2f5e93] md:text-xs">
                <RoleIcon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                <span>
                  <HighlightedText text={roleLabel} query={searchQuery} />
                </span>
              </p>
            )}
            <h3 className={`${memberNameFont.className} text-[18px] font-bold leading-snug text-foreground md:text-[21px]`}>
              <HighlightedText text={member.fullName} query={searchQuery} />
            </h3>
            {member.temploName && (
              <p className="mt-3 flex min-w-0 items-start gap-2 text-[15px] leading-snug text-foreground/80">
                <Church
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 line-clamp-2">
                  <HighlightedText
                    text={member.temploName}
                    query={searchQuery}
                  />
                </span>
              </p>
            )}

            <div className="mt-3 flex flex-col items-start gap-2 md:mt-5 md:flex-row md:flex-wrap md:items-center">
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className={compactUtilityButtonClass}
                aria-expanded={isExpanded}
                aria-controls={`directiva-details-${member.id}`}
                style={{ minHeight: "unset", minWidth: "unset" }}
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
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="compact-details"
              id={`directiva-details-${member.id}`}
              initial={isMobile ? { height: 0, opacity: 0 } : false}
              animate={{ height: "auto", opacity: 1 }}
              exit={isMobile ? { height: 0, opacity: 0 } : undefined}
              transition={isMobile ? expandTransition : { duration: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/80 bg-muted/20 px-3 py-4 md:px-5 md:py-5">
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
      id={member.id}
      data-eq-card
      className="desktop-card-lift bg-card border border-border overflow-hidden flex flex-col h-full scroll-mt-[100px] transition-all duration-700 target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20"
    >
      {/* Photo */}
      <div className="offline-hide-when-offline offline-aware-image relative w-full bg-muted shrink-0">
        {member.photo ? (
          <Image
            src={getDirectivaImageUrl(member.photo)}
            alt={member.fullName}
            fill
            unoptimized
            className="offline-image-online object-contain object-center"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={72}
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
        {roleLabel && (
          <div className="absolute top-3 left-3">
            <Badge className="gap-1.5 bg-foreground/85 text-background text-xs font-medium">
              <RoleIcon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              <HighlightedText text={roleLabel} query={searchQuery} />
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div data-eq-head>
          <h3 className={`${memberNameFont.className} font-semibold text-lg text-foreground leading-snug mb-4`}>
            <HighlightedText text={member.fullName} query={searchQuery} />
          </h3>
        </div>

        <div className="flex flex-col">
          <div className="-mx-4 border-t border-border">
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between py-3 px-4 text-sm text-foreground font-medium hover:text-foreground/80 transition-colors"
              aria-expanded={isExpanded}
              aria-controls={`directiva-details-${member.id}`}
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

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="grid-details"
                id={`directiva-details-${member.id}`}
                initial={isMobile ? { height: 0, opacity: 0 } : false}
                animate={{ height: "auto", opacity: 1 }}
                exit={isMobile ? { height: 0, opacity: 0 } : undefined}
                transition={isMobile ? expandTransition : { duration: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-5 pt-5 pb-5 px-4 -mx-4 border-t border-border">
                  {detailsContent}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

interface DirectivaContentProps {
  generations?: DirectivaGeneration[];
  members?: DirectivaMember[];
  initialViewMode?: ViewMode;
}

export function DirectivaContent({
  generations,
  members = [],
  initialViewMode,
}: DirectivaContentProps) {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const resolvedInitialViewMode = initialViewMode ?? "grid";
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => resolvedInitialViewMode,
  );
  const [openGenerations, setOpenGenerations] = useState<
    Record<string, boolean>
  >({});
  const [isOfflinePwa, setIsOfflinePwa] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [isCopyToastVisible, setIsCopyToastVisible] = useState(false);
  const [printMember, setPrintMember] = useState<DirectivaMember | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const lastOnlineViewModeRef = useRef<ViewMode>(resolvedInitialViewMode);
  const copyToastTimerRef = useRef<number | null>(null);
  const copyToastExitTimerRef = useRef<number | null>(null);
  const activePrintMemberRef = useRef<DirectivaMember | null>(null);
  const printCleanupTimerRef = useRef<number | null>(null);
  const printInFlightRef = useRef(false);
  useEqualizeCardRowHeads(gridRef);

  const directivaGenerations = useMemo<DirectivaGeneration[]>(() => {
    if (generations && generations.length > 0) return generations;

    return [
      {
        id: "legacy-directiva-actual",
        title: "Directiva actual",
        isCurrent: true,
        members,
      },
    ];
  }, [generations, members]);

  const allMembers = useMemo(
    () => directivaGenerations.flatMap((generation) => generation.members),
    [directivaGenerations],
  );
  const initialOpenGenerationId =
    directivaGenerations.find((generation) => generation.isCurrent)?.id ??
    directivaGenerations[0]?.id;

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

  const filteredGenerations = useMemo(() => {
    return directivaGenerations.map((generation) => {
      const membersWithRoleLabels = generation.members.map((member) => ({
        ...member,
        role: getDirectivaRoleLabel(member.role),
      }));

      const filtered = searchItems(
        membersWithRoleLabels,
        searchQuery,
        SEARCH_CONFIGS.directiva,
      );
      const filteredIds = new Set(filtered.map((member) => member.id));

      return {
        ...generation,
        members: generation.members
          .filter((member) => filteredIds.has(member.id))
          .sort((a, b) => {
            const roleOrderDiff =
              getDirectivaRoleOrder(a.role) - getDirectivaRoleOrder(b.role);
            if (roleOrderDiff !== 0) return roleOrderDiff;
            return a.fullName.localeCompare(b.fullName, "es", {
              sensitivity: "base",
            });
          }),
      };
    });
  }, [directivaGenerations, searchQuery]);

  const hasFilteredMembers = filteredGenerations.some(
    (generation) => generation.members.length > 0,
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

  const handlePrintMember = async (member: DirectivaMember) => {
    if (printInFlightRef.current) return;

    printInFlightRef.current = true;
    if (printCleanupTimerRef.current) {
      window.clearTimeout(printCleanupTimerRef.current);
      printCleanupTimerRef.current = null;
    }
    document.body.classList.add("rm-printing");
    activePrintMemberRef.current = member;

    flushSync(() => {
      setPrintMember(member);
    });

    const printRoot = document.querySelector(".rm-print-root");
    printRoot?.getBoundingClientRect();

    try {
      await waitForImageReady(getDirectivaImageUrl(member.photo, "print"));
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

  const renderMembers = (
    generationMembers: DirectivaMember[],
    attachGridRef: boolean,
  ) => (
    <AnimatePresence mode={isMobile ? "wait" : "sync"} initial={false}>
      {viewMode === "compact" ? (
        <motion.div
          key="directiva-compact"
          initial={isMobile ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={isMobile ? { opacity: 0, y: -4 } : undefined}
          transition={
            isMobile ? { duration: 0.18, ease: "easeOut" } : { duration: 0 }
          }
          className="mx-0 flex flex-col gap-3 md:gap-3"
        >
          {generationMembers.map((member) => (
            <DirectivaCard
              key={member.id}
              member={member}
              searchQuery={searchQuery}
              onCopied={showCopiedToast}
              onPrint={handlePrintMember}
              variant="compact"
            />
          ))}
        </motion.div>
      ) : (
        <motion.div
          key="directiva-grid"
          ref={attachGridRef ? gridRef : undefined}
          initial={isMobile ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={isMobile ? { opacity: 0, y: -4 } : undefined}
          transition={
            isMobile ? { duration: 0.18, ease: "easeOut" } : { duration: 0 }
          }
          className={`grid gap-4 ${
            generationMembers.length === 1
              ? "grid-cols-1 max-w-sm mx-auto"
              : generationMembers.length === 2
                ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {generationMembers.map((member) => (
            <div key={member.id} className="h-full">
              <DirectivaCard
                member={member}
                searchQuery={searchQuery}
                onCopied={showCopiedToast}
                onPrint={handlePrintMember}
              />
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  useEffect(
    () => () => {
      if (copyToastTimerRef.current) {
        window.clearTimeout(copyToastTimerRef.current);
      }
      if (copyToastExitTimerRef.current) {
        window.clearTimeout(copyToastExitTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const clearPrintMember = () => {
      if (printCleanupTimerRef.current) {
        window.clearTimeout(printCleanupTimerRef.current);
      }
      const cleanupDelay = window.matchMedia("(hover: none), (pointer: coarse)")
        .matches
        ? 8000
        : 250;

      printCleanupTimerRef.current = window.setTimeout(() => {
        document.body.classList.remove("rm-printing");
        activePrintMemberRef.current = null;
        setPrintMember(null);
        printCleanupTimerRef.current = null;
      }, cleanupDelay);
    };

    const keepPrintClass = () => {
      if (printInFlightRef.current || activePrintMemberRef.current) {
        document.body.classList.add("rm-printing");
      }
    };

    window.addEventListener("beforeprint", keepPrintClass);
    window.addEventListener("afterprint", clearPrintMember);
    return () => {
      if (printCleanupTimerRef.current) {
        window.clearTimeout(printCleanupTimerRef.current);
      }
      document.body.classList.remove("rm-printing");
      activePrintMemberRef.current = null;
      window.removeEventListener("beforeprint", keepPrintClass);
      window.removeEventListener("afterprint", clearPrintMember);
    };
  }, []);

  return (
    <div
      className="w-full relative bg-[#f1f1f1]"
      id="main-content"
      data-view-mode={viewMode}
    >
      {showCopyToast &&
        createPortal(<CopyToast visible={isCopyToastVisible} />, document.body)}
      {printMember &&
        createPortal(
          <div className="rm-print-root">
            <PrintableDirectivaSheet member={printMember} />
          </div>,
          document.body,
        )}
      <div className="desktop-content-pane min-h-screen max-w-[950px] mx-auto px-4 md:px-8 py-6 pt-[78px] md:pt-[88px] bg-paper md:border-x focus:outline-none">
        <div className="max-w-4xl mx-auto md:pl-4 md:pr-4 md:pt-1">
          {/* Header */}
          <div className="mb-6 pb-5 border-b border-border/70">
            <h1 className="text-[1.825rem] font-semibold text-brand tracking-tight">
              Directiva de jovenes
            </h1>
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
              disableGrid={isOfflinePwa}
            />
          </div>

          {/*
          <div className="border border-border bg-muted/30 p-4 mb-6 text-sm text-muted-foreground">
            Contacta a cualquier miembro de la directiva directamente por
            WhatsApp. Estamos aquí para servirte.
          </div> */}

          {allMembers.length === 0 || !hasFilteredMembers ? (
            <div className="bg-card border border-border p-8 text-center">
              <UserCircle
                className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-foreground mb-1">
                {allMembers.length === 0
                  ? "Sin miembros de directiva registrados"
                  : "No se encontraron resultados"}
              </p>
              <p className="text-xs text-muted-foreground">
                {allMembers.length === 0
                  ? "La información se actualizará pronto."
                  : "Intenta con otros términos de búsqueda."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-14">
              {filteredGenerations.map((generation, index) => {
                const hasSearch = searchQuery.trim().length > 0;
                if (hasSearch && generation.members.length === 0) return null;

                const isOpen = hasSearch
                  ? true
                  : (openGenerations[generation.id] ??
                    generation.id === initialOpenGenerationId);

                return (
                  <section key={generation.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenGenerations((current) => ({
                          ...current,
                          [generation.id]: !isOpen,
                        }));
                      }}
                      className="flex w-full items-center justify-between gap-4 border-b border-border/70 py-3 text-left"
                      aria-expanded={isOpen}
                      aria-controls={`directiva-generation-${generation.id}`}
                    >
                      <span>
                        <span className={`${editorialFont.className} block text-lg font-bold leading-tight text-ink`}>
                          {generation.title}
                        </span>
                      </span>
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#757575]"
                        aria-hidden="true"
                      >
                        <ChevronDown
                          className={`h-4 w-4 text-white transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`directiva-generation-${generation.id}`}
                          initial={isMobile ? { height: 0, opacity: 0 } : false}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={
                            isMobile ? { height: 0, opacity: 0 } : undefined
                          }
                          transition={
                            isMobile ? expandTransition : { duration: 0 }
                          }
                          className="overflow-hidden"
                        >
                          <div className="pt-4">
                            {generation.members.length > 0 ? (
                              renderMembers(
                                generation.members,
                                generation.id === initialOpenGenerationId,
                              )
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Sin miembros registrados en esta generacion.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
