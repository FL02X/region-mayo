"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Newsreader } from "next/font/google";
import { Calendar } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { MonthNavigator } from "@/components/shared/month-navigator";
import { EventCard } from "@/components/shared/event-card";
import { RegistrationModal } from "@/components/shared/registration-modal";
import { ViewModeToggle, type ViewMode } from "@/components/shared/view-mode-toggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { getRegionCalendarParts, getRegionMonthStart } from "@/lib/region-date";
import { CountdownSection } from "./countdown-section.mobile";
import { ActionDeck } from "./action-deck";
import { FirstVisitInfoMobile } from "./first-visit-info.mobile";
import { HomeInfoCards } from "./home-info-cards";
import type {
  Event,
  RegionPresident,
  HeroCard,
  PrayerWallConfig,
  SocialPost,
} from "@/lib/types";

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

type CalendarViewMode = ViewMode;
const calendarFadeTransition = { duration: 0.18, ease: "easeOut" as const };

function getInitialCalendarMonth(events: Event[], nowMs?: number) {
  const referenceTime = nowMs ?? Date.now();
  const nextEvent = [...events]
    .filter((event) => event.date.getTime() >= referenceTime)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

  return getRegionMonthStart(nextEvent?.date ?? new Date(referenceTime));
}

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
}: EventsFeedProps) {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    getInitialCalendarMonth(events, nowProp),
  );
  const [pendingHashEventId, setPendingHashEventId] = useState<string | null>(null);
  const resolvedInitialViewMode = initialViewMode ?? "grid";
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() => resolvedInitialViewMode);
  const [isOfflinePwa, setIsOfflinePwa] = useState(false);
  const renderedViewMode = viewMode;
  const lastOnlineViewModeRef = useRef<CalendarViewMode>(resolvedInitialViewMode);

  useEffect(() => {
    let isSubscribed = true;

    const syncHashTarget = () => {
      if (!isSubscribed) return;
      if (!window.location.hash) return;

      const id = window.location.hash.substring(1);
      const targetEvent = events.find((event) => event.id === id);
      if (!targetEvent) return;

      setSelectedMonth(getRegionMonthStart(targetEvent.date));
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
  const eventsListRef = useRef<HTMLDivElement>(null);

  const eventDates = useMemo(() => events.map((e) => e.date), [events]);
  const selectedMonthKey = useMemo(
    () =>
      `${getRegionCalendarParts(selectedMonth).year}-${String(getRegionCalendarParts(selectedMonth).month).padStart(2, "0")}`,
    [selectedMonth],
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

  const calendarStateKey = `${selectedMonthKey}-${renderedViewMode}-${
    filteredEvents.length === 0 ? "empty" : filteredEvents.length === 1 ? "single" : "grid"
  }`;

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
        const existingHighlights = document.querySelectorAll(".global-highlight");
        existingHighlights.forEach((el) => el.classList.remove("global-highlight"));

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

  const handleMonthSelect = (
    date: Date,
    options?: { suppressScroll?: boolean },
  ) => {
    setSelectedMonth(date);
    setTimeout(() => {
      if (options?.suppressScroll) return;

      if (eventsListRef.current) {
        // Disable autoscroll on desktop (md and up)
        if (
          typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(min-width: 768px)").matches
        ) {
          return;
        }

        const offsetPosition =
          eventsListRef.current.getBoundingClientRect().top +
          window.scrollY -
          54;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    }, 100);
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
    lastOnlineViewModeRef.current = next;
    setViewMode(next);
    try {
      document.cookie = `rm-view-mode-calendar=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Ignore cookie write failures
    }
  };

  return (
    <div className="w-full relative bg-[#f1f1f1]" /* [#f1f1f1] */ data-events-feed="true">
      <div className="desktop-content-pane max-w-[950px] mx-auto bg-[#ffffff] md:border-x border-[#dce2e9] dark:border-[#27272a]">
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
        <div className="offline-hide-when-offline md:hidden pt-2">
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

        <FirstVisitInfoMobile />

        {/* Info Cards (Services, Bible, Hymnal) - HIDDEN */}
        {/* <HomeInfoCards /> */}

        {/* Calendar section */}
        <section id="calendario" className="mt-5 md:mt-0 px-4 md:px-[32px] pt-6 pb-4 border-t md:border-t-0 border-border/70 bg-muted/20">
        <div className="mt-1 max-w-4xl mx-auto w-full">
          <div className="mb-5">
            <h2
              id="calendar-title"
              className={`${editorialFont.className} type-human-title text-[1.625rem] font-semibold tracking-tight mb-2`}
            >
              Calendario 2026
            </h2>
            <p className="type-system text-[15px] mt-0.5">
              Selecciona un mes para ver los eventos
            </p>
          </div>
          {/* Navigator aligned with left content edge on desktop */}
          <div className="max-w-md w-full">
            <MonthNavigator
              selectedMonth={selectedMonth}
              onMonthSelect={handleMonthSelect}
              eventDates={eventDates}
            />
          </div>
        </div>
      </section>

      {/* Events list */}
      <section
        id="eventos"
        ref={eventsListRef}
        className="bg-muted/20 px-4 md:px-[32px] md:py-[24px] pt-4 pb-14"
      >
        <div className="mt-0 max-w-4xl mx-auto w-full">
          {/* Month label */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className={`${editorialFont.className} type-human-title font-semibold text-[1.425rem] tracking-tight`}>
                {months[getRegionCalendarParts(selectedMonth).month - 1]} {getRegionCalendarParts(selectedMonth).year}
              </h3>
              <p className="type-system text-[15px] mt-1">
                {filteredEvents.length === 0
                  ? "No hay eventos programados"
                  : `${filteredEvents.length} ${
                      filteredEvents.length === 1 ? "evento" : "eventos"
                    } programados`}
              </p>
            </div>

            <ViewModeToggle
              value={renderedViewMode}
              onChange={handleViewModeChange}
              ariaLabel="Cambiar vista del calendario"
              disableGrid={isOfflinePwa}
            />
          </div>

          {/* Cards layout:
              - 0 events  → centered empty state (max-w-md)
              - 1 event   → centered single card (max-w-md)
              - 2+ events → 1 col mobile / 2 col md+
          */}
          <AnimatePresence mode={isMobile ? "wait" : "sync"} initial={false}>
            {filteredEvents.length === 0 ? (
              <motion.div
                key={calendarStateKey}
                initial={isMobile ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={isMobile ? { opacity: 0, y: -4 } : undefined}
                transition={isMobile ? calendarFadeTransition : { duration: 0 }}
                className="bg-card border border-border p-8 text-center max-w-md mx-auto"
              >
                <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Sin eventos este mes
                </p>
                <p className="text-xs text-muted-foreground">
                  Selecciona otro mes en el calendario para ver más actividades.
                </p>
              </motion.div>
            ) : renderedViewMode === "compact" ? (
              <motion.div
                key={calendarStateKey}
                initial={isMobile ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={isMobile ? { opacity: 0, y: -4 } : undefined}
                transition={isMobile ? calendarFadeTransition : { duration: 0 }}
                className="p-0.5 mx-0 flex flex-col gap-5 pb-14 md:gap-6"
              >
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRegister={handleRegister}
                    showAlbumButton={event.status === "past"}
                    variant="compact"
                    tone="editorial"
                  />
                ))}
              </motion.div>
            ) : filteredEvents.length === 1 ? (
              <motion.div
                key={calendarStateKey}
                initial={isMobile ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={isMobile ? { opacity: 0, y: -4 } : undefined}
                transition={isMobile ? calendarFadeTransition : { duration: 0 }}
                className="max-w-md mx-auto"
              >
                <EventCard
                  event={filteredEvents[0]}
                  onRegister={handleRegister}
                  showAlbumButton={filteredEvents[0].status === "past"}
                  tone="editorial"
                />
              </motion.div>
            ) : (
              <motion.div
                key={calendarStateKey}
                initial={isMobile ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={isMobile ? { opacity: 0, y: -4 } : undefined}
                transition={isMobile ? calendarFadeTransition : { duration: 0 }}
                className="grid grid-cols-1 gap-5 md:grid-cols-2"
              >
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRegister={handleRegister}
                    showAlbumButton={event.status === "past"}
                    tone="editorial"
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      </div>

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
