"use client";

// Donde: home, seccion Calendario. 
// Viewports: desktop y mobile. 
// Funcion: coordina selector de mes, lista/mes, eventos y modal de registro.

import {
  useState,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { Newsreader } from "next/font/google";
import { Calendar, CalendarDays, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  EventCard,
  getEventCardThumbnailUrl,
} from "@/components/shared/event-card";
import { RegistrationModal } from "@/components/shared/registration-modal";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/components/shared/view-mode-toggle";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getRegionCalendarParts,
  getRegionMonthStart,
} from "@/lib/region-date";
import { CountdownSection } from "./countdown-section.mobile";
import { ActionDeck } from "./action-deck";
import { FirstVisitInfoMobile } from "./first-visit-info.mobile";
import { RecentVideosFeed } from "./recent-videos-feed";
import { HomeInfoCards } from "./home-info-cards";
import type {
  Event,
  RegionPresident,
  HeroCard,
  PrayerWallConfig,
  SocialPost,
  Album,
} from "@/lib/types";
import {
  CALENDAR_FADE_TRANSITION,
  CALENDAR_MONTHS,
  MAX_PRELOADED_EVENT_THUMBNAILS,
  PRELOAD_MONTH_OFFSETS,
  THUMBNAIL_PRELOAD_DELAY_MS,
} from "@/components/sections/home/calendar-feed/calendar-copy";
import {
  canPreloadEventThumbnails,
  getCalendarMonthByOffset,
  getInitialCalendarMonth,
  getMostRelevantEvent,
  getRegionMonthKey,
  getRelevantEventEndTime,
} from "@/components/sections/home/calendar-feed/calendar-utils";
import { MobileMonthPlanner } from "@/components/sections/home/calendar-feed/mobile-month-planner";

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const LIST_MONTH_BATCH_SIZE = 3;

type CalendarViewMode = ViewMode;
type CalendarLayoutMode = "list" | "month";
type CalendarChangeReason = "month" | "view" | null;
type CalendarEventFlow = "upcoming" | "past";

interface EventsFeedProps {
  events: Event[];
  regionPresident: RegionPresident | null;
  instagramUrl?: string;
  facebookUrl?: string;
  customHeroCard?: HeroCard | null;
  prayerWall?: PrayerWallConfig | null;
  socialPosts?: SocialPost[];
  now?: number;
  initialViewMode?: CalendarViewMode;
  initialCalendarLayoutMode?: CalendarLayoutMode;
  albums?: Album[];
}

export function EventsFeed({
  events,
  regionPresident,
  instagramUrl,
  facebookUrl,
  customHeroCard,
  prayerWall,
  socialPosts,
  now: nowProp,
  initialViewMode,
  initialCalendarLayoutMode,
  albums,
}: EventsFeedProps) {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    getInitialCalendarMonth(events, nowProp),
  );
  const [pendingHashEventId, setPendingHashEventId] = useState<string | null>(
    null,
  );
  const resolvedInitialViewMode = initialViewMode ?? "grid";
  const [viewMode, setViewMode] = useState<CalendarViewMode>(
    () => resolvedInitialViewMode,
  );
  const [calendarChangeReason, setCalendarChangeReason] =
    useState<CalendarChangeReason>(null);
  const [isOfflinePwa, setIsOfflinePwa] = useState(false);
  const renderedViewMode = viewMode;
  const lastOnlineViewModeRef = useRef<CalendarViewMode>(
    resolvedInitialViewMode,
  );
  const resolvedInitialCalendarLayoutMode =
    initialCalendarLayoutMode ?? "list";
  const [isMonthPlannerEnabled, setIsMonthPlannerEnabled] = useState(
    () => resolvedInitialCalendarLayoutMode === "month",
  );
  const [selectedPlannerEvent, setSelectedPlannerEvent] =
    useState<Event | null>(null);
  const [thumbnailPreloadMonth, setThumbnailPreloadMonth] =
    useState(selectedMonth);
  const [calendarEventFlow, setCalendarEventFlow] =
    useState<CalendarEventFlow>("upcoming");
  const [visibleListMonthCount, setVisibleListMonthCount] =
    useState(LIST_MONTH_BATCH_SIZE);
  const [showListMonthFab, setShowListMonthFab] = useState(false);
  const [pendingJumpMonthKey, setPendingJumpMonthKey] = useState<string | null>(
    null,
  );
  const calendarReferenceMsRef = useRef(nowProp ?? Date.now());

  useEffect(() => {
    let isSubscribed = true;

    const syncHashTarget = () => {
      if (!isSubscribed) return;
      if (!window.location.hash) return;

      const id = window.location.hash.substring(1);
      const targetEvent = events.find((event) => event.id === id);
      if (!targetEvent) return;

      setCalendarChangeReason("month");
      setSelectedMonth(getRegionMonthStart(targetEvent.date));
      setSelectedPlannerEvent(targetEvent);
      setPendingHashEventId(id);
    };

    // Run on initial mount
    syncHashTarget();

    // Listen to native hash changes (useful if user clicks multiple links sequentially)
    window.addEventListener("hashchange", syncHashTarget, { passive: true });

    return () => {
      isSubscribed = false;
      window.removeEventListener("hashchange", syncHashTarget);
    };
  }, [events]);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const isMobile = useIsMobile();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const calendarReferenceMs = calendarReferenceMsRef.current;
  const calendarReferenceDate = useMemo(
    () => new Date(calendarReferenceMs),
    [calendarReferenceMs],
  );
  const filteredEvents = useMemo(() => {
    const selectedParts = getRegionCalendarParts(selectedMonth);
    return events
      .filter(
        (event) =>
          getRegionCalendarParts(event.date).month === selectedParts.month &&
          getRegionCalendarParts(event.date).year === selectedParts.year,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, selectedMonth]);

  const shouldAnimateCalendarChange =
    isMobile && calendarChangeReason === "view";
  const compactMobileResultsFloorClass =
    renderedViewMode === "compact" ? "min-h-[560px] md:min-h-0" : "";
  const shouldRenderLegacyCalendar = !isMobile || !isMonthPlannerEnabled;
  const shouldRenderMobileMonthPlanner = isMobile && isMonthPlannerEnabled;
  const [hasFirstVisitDivider, setHasFirstVisitDivider] = useState(false);

  const listMonthGroups = useMemo(() => {
    const groupedEvents = new Map<
      string,
      { month: Date; events: Event[] }
    >();

    events.forEach((event) => {
      const eventEndTime = getRelevantEventEndTime(event, calendarReferenceDate);
      const belongsToFlow =
        calendarEventFlow === "upcoming"
          ? eventEndTime >= calendarReferenceMs
          : eventEndTime < calendarReferenceMs;

      if (!belongsToFlow) return;

      const month = getRegionMonthStart(event.date);
      const monthKey = getRegionMonthKey(month);
      const currentGroup = groupedEvents.get(monthKey);

      if (currentGroup) {
        currentGroup.events.push(event);
        return;
      }

      groupedEvents.set(monthKey, { month, events: [event] });
    });

    return Array.from(groupedEvents.values())
      .map((group) => ({
        ...group,
        events: [...group.events].sort((a, b) =>
          calendarEventFlow === "upcoming"
            ? a.date.getTime() - b.date.getTime()
            : b.date.getTime() - a.date.getTime(),
        ),
      }))
      .sort((a, b) =>
        calendarEventFlow === "upcoming"
          ? a.month.getTime() - b.month.getTime()
          : b.month.getTime() - a.month.getTime(),
      );
  }, [calendarEventFlow, calendarReferenceDate, calendarReferenceMs, events]);

  const visibleListMonthGroups = useMemo(
    () => listMonthGroups.slice(0, visibleListMonthCount),
    [listMonthGroups, visibleListMonthCount],
  );

  const listMonthPickerYears = useMemo(() => {
    if (events.length === 0) return [];

    const monthAccess = new Map<
      string,
      { month: Date; upcoming: boolean; past: boolean }
    >();

    events.forEach((event) => {
      const month = getRegionMonthStart(event.date);
      const monthKey = getRegionMonthKey(month);
      const eventEndTime = getRelevantEventEndTime(event, calendarReferenceDate);
      const currentAccess =
        monthAccess.get(monthKey) ?? {
          month,
          upcoming: false,
          past: false,
        };

      if (eventEndTime >= calendarReferenceMs) {
        currentAccess.upcoming = true;
      } else {
        currentAccess.past = true;
      }

      monthAccess.set(monthKey, currentAccess);
    });

    const sortedEventMonths = Array.from(monthAccess.values()).sort(
      (a, b) => a.month.getTime() - b.month.getTime(),
    );
    const firstMonth = sortedEventMonths[0]?.month;
    const lastMonth = sortedEventMonths[sortedEventMonths.length - 1]?.month;

    if (!firstMonth || !lastMonth) return [];

    const years = new Map<
      number,
      Array<{
        month: Date;
        monthKey: string;
        upcoming: boolean;
        past: boolean;
      }>
    >();

    let cursor = firstMonth;

    while (cursor.getTime() <= lastMonth.getTime()) {
      const monthKey = getRegionMonthKey(cursor);
      const access = monthAccess.get(monthKey);
      const year = getRegionCalendarParts(cursor).year;

      years.set(year, [
        ...(years.get(year) ?? []),
        {
          month: cursor,
          monthKey,
          upcoming: access?.upcoming ?? false,
          past: access?.past ?? false,
        },
      ]);

      cursor = getCalendarMonthByOffset(cursor, 1);
    }

    return Array.from(years.entries());
  }, [calendarReferenceDate, calendarReferenceMs, events]);

  const listMonthPickerAccessibleCount = useMemo(
    () =>
      listMonthPickerYears
        .flatMap(([, months]) => months)
        .filter((month) => month.upcoming || month.past).length,
    [listMonthPickerYears],
  );

  const hasMoreListMonths =
    visibleListMonthCount < listMonthGroups.length && shouldRenderLegacyCalendar;

  useEffect(() => {
    if (!isMonthPlannerEnabled) {
      setThumbnailPreloadMonth(selectedMonth);
      return;
    }

    const timer = window.setTimeout(() => {
      setThumbnailPreloadMonth(selectedMonth);
    }, THUMBNAIL_PRELOAD_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isMonthPlannerEnabled, selectedMonth]);

  useEffect(() => {
    if (!isMobile || !canPreloadEventThumbnails()) return;

    const targetMonthKeys = new Set(
      PRELOAD_MONTH_OFFSETS.map((offset) => {
        const targetMonth = getCalendarMonthByOffset(
          thumbnailPreloadMonth,
          offset,
        );
        const parts = getRegionCalendarParts(targetMonth);
        return `${parts.year}-${parts.month}`;
      }),
    );

    const thumbnailUrls = Array.from(
      new Set(
        events
          .filter((event) => {
            const parts = getRegionCalendarParts(event.date);
            return targetMonthKeys.has(`${parts.year}-${parts.month}`);
          })
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((event) => getEventCardThumbnailUrl(event.image, "compact"))
          .filter((url) => url && url !== "/placeholder.svg"),
      ),
    ).slice(0, MAX_PRELOADED_EVENT_THUMBNAILS);

    if (thumbnailUrls.length === 0) return;

    const preloaders = thumbnailUrls.map((url) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = url;
      return image;
    });

    return () => {
      preloaders.forEach((image) => {
        image.src = "";
      });
    };
  }, [events, isMobile, thumbnailPreloadMonth]);

  useEffect(() => {
    if (!pendingHashEventId) return;

    const isTargetMonthRendered = filteredEvents.some(
      (event) => event.id === pendingHashEventId,
    );
    if (!isTargetMonthRendered) return;

    let isSubscribed = true;
    let attempts = 0;

    const attemptScrollAndHighlight = () => {
      if (!isSubscribed) return;

      const targetEl = document.getElementById(pendingHashEventId);
      if (targetEl) {
        const existingHighlights =
          document.querySelectorAll(".global-highlight");
        existingHighlights.forEach((el) =>
          el.classList.remove("global-highlight"),
        );

        document.body.removeAttribute("data-user-interacted");
        targetEl.classList.add("global-highlight");
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        window.dispatchEvent(new Event("rm-highlight-applied"));
        setPendingHashEventId(null);
        return;
      }

      if (attempts < 24) {
        attempts += 1;
        setTimeout(attemptScrollAndHighlight, 60);
      }
    };

    attemptScrollAndHighlight();

    return () => {
      isSubscribed = false;
    };
  }, [filteredEvents, pendingHashEventId]);

  useEffect(() => {
    if (!isMonthPlannerEnabled) return;

    setSelectedPlannerEvent((currentEvent) => {
      if (
        currentEvent &&
        filteredEvents.some((event) => event.id === currentEvent.id)
      ) {
        return currentEvent;
      }

      return getMostRelevantEvent(filteredEvents);
    });
  }, [filteredEvents, isMonthPlannerEnabled]);

  const handleMonthSelect = (date: Date) => {
    setCalendarChangeReason("month");
    setSelectedMonth(date);
  };

  const handlePlannerEventPreview = (event: Event) => {
    setSelectedPlannerEvent(event);
  };

  const handleRegister = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

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

  const handleViewModeChange = (next: CalendarViewMode) => {
    if (isOfflinePwa) return;
    setCalendarChangeReason("view");
    lastOnlineViewModeRef.current = next;
    setViewMode(next);
    try {
      document.cookie = `rm-view-mode-calendar=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Ignore cookie write failures
    }
  };

  const handleCalendarLayoutToggle = () => {
    setIsMonthPlannerEnabled((value) => {
      const next = !value;
      try {
        document.cookie = `rm-calendar-layout=${
          next ? "month" : "list"
        }; path=/; max-age=31536000; samesite=lax`;
      } catch {
        // Ignore cookie write failures
      }

      return next;
    });
  };

  const handleCalendarEventFlowChange = (nextFlow: CalendarEventFlow) => {
    setCalendarEventFlow(nextFlow);
    setVisibleListMonthCount(LIST_MONTH_BATCH_SIZE);
  };

  const getListMonthIndexForFlow = (
    targetMonthKey: string,
    targetFlow: CalendarEventFlow,
  ) => {
    const monthKeys = Array.from(
      new Set(
        events
          .filter((event) => {
            const eventEndTime = getRelevantEventEndTime(
              event,
              calendarReferenceDate,
            );

            return targetFlow === "upcoming"
              ? eventEndTime >= calendarReferenceMs
              : eventEndTime < calendarReferenceMs;
          })
          .map((event) => getRegionMonthKey(getRegionMonthStart(event.date))),
      ),
    ).sort((a, b) => {
      const [yearA, monthA] = a.split("-").map(Number);
      const [yearB, monthB] = b.split("-").map(Number);
      const valueA = yearA * 12 + monthA;
      const valueB = yearB * 12 + monthB;

      return targetFlow === "upcoming" ? valueA - valueB : valueB - valueA;
    });

    return monthKeys.findIndex((monthKey) => monthKey === targetMonthKey);
  };

  const handleJumpToListMonth = (
    month: Date,
    targetFlow: CalendarEventFlow = calendarEventFlow,
  ) => {
    const targetKey = getRegionMonthKey(month);
    const targetIndex = getListMonthIndexForFlow(targetKey, targetFlow);

    if (targetIndex >= 0) {
      setVisibleListMonthCount(Math.max(LIST_MONTH_BATCH_SIZE, targetIndex + 1));
    }

    setCalendarEventFlow(targetFlow);
    setCalendarChangeReason("month");
    setSelectedMonth(month);
    setPendingJumpMonthKey(targetKey);
  };

  const handleMonthJumpSelect = (value: string) => {
    if (!value) return;

    const [targetFlow, targetKey] = value.split(":") as [
      CalendarEventFlow,
      string,
    ];
    const targetMonth = listMonthPickerYears
      .flatMap(([, months]) => months)
      .find((month) => month.monthKey === targetKey)?.month;

    if (!targetMonth) return;

    handleJumpToListMonth(targetMonth, targetFlow);
  };

  useEffect(() => {
    if (!shouldRenderLegacyCalendar || !hasMoreListMonths) return;

    const handleScrollLoad = () => {
      const documentHeight = document.documentElement.scrollHeight;
      const viewportBottom = window.scrollY + window.innerHeight;

      if (viewportBottom < documentHeight - 720) return;

      setVisibleListMonthCount((currentCount) =>
        Math.min(currentCount + LIST_MONTH_BATCH_SIZE, listMonthGroups.length),
      );
    };

    handleScrollLoad();
    window.addEventListener("scroll", handleScrollLoad, { passive: true });
    window.addEventListener("resize", handleScrollLoad);

    return () => {
      window.removeEventListener("scroll", handleScrollLoad);
      window.removeEventListener("resize", handleScrollLoad);
    };
  }, [hasMoreListMonths, listMonthGroups.length, shouldRenderLegacyCalendar]);

  useEffect(() => {
    if (!isMobile || !shouldRenderLegacyCalendar) {
      setShowListMonthFab(false);
      return;
    }

    const updateFabVisibility = () => {
      const eventsSection = document.getElementById("eventos");
      if (!eventsSection) {
        setShowListMonthFab(false);
        return;
      }

      const sectionTop = eventsSection.getBoundingClientRect().top;
      setShowListMonthFab(
        sectionTop < -160 && listMonthPickerAccessibleCount > 1,
      );
    };

    updateFabVisibility();
    window.addEventListener("scroll", updateFabVisibility, { passive: true });
    window.addEventListener("resize", updateFabVisibility);

    return () => {
      window.removeEventListener("scroll", updateFabVisibility);
      window.removeEventListener("resize", updateFabVisibility);
    };
  }, [isMobile, listMonthPickerAccessibleCount, shouldRenderLegacyCalendar]);

  useEffect(() => {
    if (!pendingJumpMonthKey) return;

    const targetElement = document.getElementById(
      `calendar-list-month-${pendingJumpMonthKey}`,
    );
    if (!targetElement) return;

    targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    setPendingJumpMonthKey(null);
  }, [pendingJumpMonthKey, visibleListMonthGroups]);

  return (
    <div
      className="w-full relative bg-[#f1f1f1]"
      /* [#f1f1f1] */ data-events-feed="true"
    >
      <div className="desktop-content-pane max-w-[1150px] mx-auto bg-[#ffffff] md:border-x border-border">
        {/* Priority spotlight section (mobile only) */}
        <div className="offline-hide-when-offline md:hidden">
          <CountdownSection
            events={events}
            onRegister={handleRegister}
            customHeroCard={customHeroCard}
            prayerWall={prayerWall}
            socialPosts={socialPosts}
            instagramUrl={instagramUrl}
            facebookUrl={facebookUrl}
          />
        </div>

        {/* ActionDeck (mobile only; desktop renders in page.tsx) */}
        <div className="offline-hide-when-offline md:hidden">
          <ActionDeck
            events={events}
            instagramUrl={instagramUrl}
            facebookUrl={facebookUrl}
            customHeroCard={customHeroCard}
            prayerWall={prayerWall}
            socialPosts={socialPosts}
            now={nowProp}
          />
        </div>

        <FirstVisitInfoMobile
          onDividerVisibilityChange={setHasFirstVisitDivider}
        />

        <RecentVideosFeed album={albums} />

        {/* Info Cards (Services, Bible, Hymnal) - HIDDEN */}
        {/* <HomeInfoCards /> */}

        {/* Calendar section */}
        <section
          id="calendario"
          className={`mt-0 px-4 md:px-16 pt-6 md:pt-8 pb-4 md:pb-0 border-border/70 bg-muted/20 ${
            hasFirstVisitDivider ? "" : "border-t md:border-t-0"
          }`}
        >
          <div className="mt-4 max-w mx-auto w-full">

            <div className="mb-9">
              <h2
                id="calendar-title"
                className={`${editorialFont.className} flex flex-row gap-3 items-center type-human-title text-[2.025rem] md:text-[1.925rem] font-semibold tracking-normal mb-1.5`}
              >
                <span className="mt-3">
                  Calendario 2026
                </span>
              </h2>
              <p className="text-ink text-[16px] md:text-[17px] mt-0.5">
                Selecciona un mes para ver los eventos
              </p>
            </div>
            {/* {Boton para cambiar entre Lista y Mes} */}
            <div className="md:hidden mb-2 flex justify-center">
              <button
                type="button"
                onClick={handleCalendarLayoutToggle}
                className="relative grid h-9 w-full grid-cols-2 overflow-hidden mb-3 border border-border-line bg-paper-highlight p-0.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]"
                aria-pressed={isMonthPlannerEnabled}
                aria-label="Alternar vista mensual del calendario"
              >
                <span className="pointer-events-none absolute left-1/2 top-1 z-20 h-7 w-px -translate-x-1/2 bg-border-line" />
                <span
                  className={`pointer-events-none absolute left-0.5 top-0.5 z-0 h-[calc(100%-4px)] w-[calc(50%-2px)] bg-brand transition-transform duration-200 ${
                    isMonthPlannerEnabled
                      ? "translate-x-full"
                      : "translate-x-0"
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`relative z-30 flex items-center justify-center text-[11px] font-semibold uppercase ${
                    isMonthPlannerEnabled
                      ? "text-ink-muted"
                      : "text-primary-foreground"
                  }`}
                >
                  Lista
                </span>
                <span
                  className={`relative z-30 flex items-center justify-center text-[11px] font-semibold uppercase ${
                    isMonthPlannerEnabled
                      ? "text-primary-foreground"
                      : "text-ink-muted"
                  }`}
                >
                  Mes
                </span>
              </button>
            </div>
            {shouldRenderMobileMonthPlanner && (
              <MobileMonthPlanner
                events={events}
                selectedMonth={selectedMonth}
                selectedPlannerEvent={selectedPlannerEvent}
                onMonthSelect={handleMonthSelect}
                onEventPreview={handlePlannerEventPreview}
                onRegister={handleRegister}
              />
            )}
          </div>
        </section>

        {/* Events list */}
        {shouldRenderLegacyCalendar && (
          <section
            id="eventos"
            className="bg-muted/20 px-4 md:px-16 md:pt-[0px] pt-4 pb-14 md:pb-30"
          >
          <div className="mt-0 max-w mx-auto w-full">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative inline-flex w-fit items-center">
                <select
                  value={calendarEventFlow}
                  onChange={(event) =>
                    handleCalendarEventFlowChange(
                      event.currentTarget.value as CalendarEventFlow,
                    )
                  }
                  className={`${editorialFont.className} appearance-none cursor-pointer bg-transparent pr-8 text-[1.7rem] md:text-[2.3rem] font-semibold leading-none tracking-tight text-brand-ink outline-none transition-colors hover:text-primary/80 hover:underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-primary/60 md:text-[1.8rem]`}
                  aria-label="Seleccionar tipo de eventos"
                >
                  <option className="text-base" value="upcoming">
                    Eventos proximos
                  </option>
                  <option className="text-base" value="past">
                    Eventos pasados
                  </option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/70"
                  aria-hidden="true"
                />
              </div>

              <div className="hidden md:block">
                <ViewModeToggle
                  value={renderedViewMode}
                  onChange={handleViewModeChange}
                  ariaLabel="Cambiar vista del calendario"
                  disableGrid={isOfflinePwa}
                />
              </div>
            </div>

            {/* Cards layout:
              - 0 events  → centered empty state (max-w-md)
              - 1 event   → centered single card (max-w-md)
              - 2+ events → 1 col mobile / 2 col md+
          */}
            <div className={compactMobileResultsFloorClass}>
              <AnimatePresence
                mode={shouldAnimateCalendarChange ? "wait" : "sync"}
                initial={false}
              >
                {visibleListMonthGroups.length === 0 ? (
                  <motion.div
                    key={`${calendarEventFlow}-empty`}
                    initial={
                      shouldAnimateCalendarChange ? { opacity: 0, y: 6 } : false
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      shouldAnimateCalendarChange
                        ? { opacity: 0, y: -4 }
                        : undefined
                    }
                    transition={
                      shouldAnimateCalendarChange
                        ? CALENDAR_FADE_TRANSITION
                        : { duration: 0 }
                    }
                    className="bg-paper-highlight border border-border p-8 text-center max-w-md mx-auto"
                  >
                    <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">
                      Sin eventos para mostrar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Selecciona otro mes en el calendario para ver más
                      actividades.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`${calendarEventFlow}-${renderedViewMode}`}
                    initial={
                      shouldAnimateCalendarChange ? { opacity: 0, y: 6 } : false
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      shouldAnimateCalendarChange
                        ? { opacity: 0, y: -4 }
                        : undefined
                    }
                    transition={
                      shouldAnimateCalendarChange
                        ? CALENDAR_FADE_TRANSITION
                        : { duration: 0 }
                    }
                    className="space-y-7 md:space-y-15 md:mb-15"
                  >
                    {visibleListMonthGroups.map((group) => {
                      const monthParts = getRegionCalendarParts(group.month);
                      const monthKey = getRegionMonthKey(group.month);
                      const isPastFlow = calendarEventFlow === "past";

                      return (
                        <section
                          key={monthKey}
                          id={`calendar-list-month-${monthKey}`}
                          className="scroll-mt-28 border-b-4 border-border mt-11 first:mt-3 last:border-b-0"
                        >
                          <div className="mb-6 min-w-0 md:mb-0">
                            <h3
                              className={`${editorialFont.className} type-human-title font-semibold text-[1.725rem] md:text-[1.7rem] tracking-tight ${
                                isPastFlow ? "text-stone-600" : ""
                              }`}
                            >
                              {CALENDAR_MONTHS[monthParts.month - 1]}{" "}
                              {monthParts.year}
                            </h3>
                            <p
                              className={`type-system text-[15px] md:text-[16px] mt-1 md:pb-6 ${
                                isPastFlow ? "text-stone-500" : ""
                              }`}
                            >
                              {`${group.events.length} ${
                                group.events.length === 1
                                  ? "evento"
                                  : "eventos"
                              } ${
                                isPastFlow ? "pasados" : "programados"
                              }`}
                            </p>
                          </div>

                          {renderedViewMode === "compact" ? (
                            <div className="-mx-2.5 md:-mx-0 p-0.5 flex flex-col gap-5 md:gap-6 mt-10 md:mt-0 md:mb-12">
                              {group.events.map((event) => (
                                <EventCard
                                  key={event.id}
                                  event={event}
                                  onRegister={handleRegister}
                                  showAlbumButton={event.status === "past"}
                                  variant="compact"
                                  tone="editorial"
                                  mutedPast={isPastFlow}
                                />
                              ))}
                            </div>
                          ) : group.events.length === 1 ? (
                            <div className="max-w-md mx-auto">
                              <EventCard
                                event={group.events[0]}
                                onRegister={handleRegister}
                                showAlbumButton={
                                  group.events[0].status === "past"
                                }
                                tone="editorial"
                                mutedPast={isPastFlow}
                              />
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                              {group.events.map((event) => (
                                <EventCard
                                  key={event.id}
                                  event={event}
                                  onRegister={handleRegister}
                                  showAlbumButton={event.status === "past"}
                                  tone="editorial"
                                  mutedPast={isPastFlow}
                                />
                              ))}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          </section>
        )}
      </div>

      {shouldRenderLegacyCalendar && (
        <div
          className={`fixed right-4 top-20 z-40 h-12 w-12 overflow-hidden bg-[#21252b] text-white shadow-lg transition-all md:hidden ${
            showListMonthFab
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0"
          }`}
        >
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="relative inline-flex h-6 w-6 items-center justify-center">
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
              <ChevronDown
                className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-[#21252b]"
                aria-hidden="true"
              />
            </span>
          </span>
          <select
            value=""
            onChange={(event) => handleMonthJumpSelect(event.currentTarget.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Seleccionar mes"
          >
            <option value="" disabled>
              Seleccionar mes
            </option>
            {listMonthPickerYears.map(([year, months]) => (
              <optgroup key={year} label={`${year}`}>
                {months.map((month) => {
                  const monthParts = getRegionCalendarParts(month.month);
                  const isAccessible = month.upcoming || month.past;
                  const targetFlow = month.upcoming ? "upcoming" : "past";

                  return (
                    <option
                      key={month.monthKey}
                      value={`${targetFlow}:${month.monthKey}`}
                      disabled={!isAccessible}
                    >
                      {CALENDAR_MONTHS[monthParts.month - 1]} {year}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
        </div>
      )}

      {/* Registration modal */}
      {selectedEvent && (
        <RegistrationModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          regionPresident={regionPresident}
        />
      )}
    </div>
  );
}
