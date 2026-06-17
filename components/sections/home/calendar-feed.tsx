"use client";

import {
  memo,
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import Image from "next/image";
import { Newsreader } from "next/font/google";
import { ArrowRight, Calendar } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { MonthNavigator } from "@/components/shared/month-navigator";
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
  formatRegionDateRange,
  formatRegionDayMonth,
  getRegionCalendarParts,
  getRegionMonthStart,
} from "@/lib/region-date";
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
  EventType,
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
type CalendarLayoutMode = "list" | "month";
type CalendarChangeReason = "month" | "view" | null;
const calendarFadeTransition = { duration: 0.1, ease: "easeOut" as const };
const PRELOAD_MONTH_OFFSETS = [-1, 0, 1];
const MAX_PRELOADED_EVENT_THUMBNAILS = 10;
const THUMBNAIL_PRELOAD_DELAY_MS = 1400;
const INITIAL_PAST_MONTHS = 12;
const INITIAL_FUTURE_MONTHS = 18;
const MONTHS_TO_APPEND = 12;
const LOAD_MORE_THRESHOLD = 8;
const MONTH_RENDER_RADIUS = 1;
const MONTH_PLANNER_SNAP_DURATION = 0;
const weekDayLabels = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

const eventTypePlannerColors: Record<
  EventType,
  { ink: string; paper: string; border: string }
> = {
  campana: { ink: "#2f5e93", paper: "#e6edf6", border: "#b8cbe1" },
  convencion: { ink: "#8c731e", paper: "#fdf6e1", border: "#e7d18a" },
  recorrido: { ink: "#1a737f", paper: "#e1f3f6", border: "#a9d5dc" },
  confraternidadJuvenilRegional: {
    ink: "#a83e3e",
    paper: "#fef2f2",
    border: "#e7b7b7",
  },
  confraternidadJuvenilGeneral: {
    ink: "#a83e3e",
    paper: "#fef2f2",
    border: "#e7b7b7",
  },
  cultoJuvenil: { ink: "#a83e3e", paper: "#fef2f2", border: "#e7b7b7" },
  culto: { ink: "#26733a", paper: "#e6f6eb", border: "#add5b8" },
  visita: { ink: "#1a737f", paper: "#e1f3f6", border: "#a9d5dc" },
  ensayo: { ink: "#26733a", paper: "#e6f6eb", border: "#add5b8" },
  actividad: { ink: "#26733a", paper: "#e6f6eb", border: "#add5b8" },
  estudioBiblico: { ink: "#26733a", paper: "#e6f6eb", border: "#add5b8" },
  biregional: { ink: "#8c731e", paper: "#fdf6e1", border: "#e7d18a" },
  congresoBrilla: { ink: "#6a3f91", paper: "#f1e6f6", border: "#d2b5df" },
  boda: { ink: "#6a3f91", paper: "#f1e6f6", border: "#d2b5df" },
};

function getInitialCalendarMonth(events: Event[], nowMs?: number) {
  const referenceTime = nowMs ?? Date.now();
  const nextEvent = [...events]
    .filter((event) => event.date.getTime() >= referenceTime)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

  return getRegionMonthStart(nextEvent?.date ?? new Date(referenceTime));
}

function getCalendarMonthByOffset(month: Date, offset: number) {
  const parts = getRegionCalendarParts(month);
  return getRegionMonthStart(
    new Date(Date.UTC(parts.year, parts.month - 1 + offset, 1, 12)),
  );
}

function getMonthNumber(date: Date) {
  const parts = getRegionCalendarParts(date);
  return parts.year * 12 + (parts.month - 1);
}

function getEarlierMonth(first: Date, second: Date) {
  return getMonthNumber(first) <= getMonthNumber(second) ? first : second;
}

function getLaterMonth(first: Date, second: Date) {
  return getMonthNumber(first) >= getMonthNumber(second) ? first : second;
}

function getMonthsInRange(startMonth: Date, endMonth: Date) {
  const count = getMonthNumber(endMonth) - getMonthNumber(startMonth) + 1;

  return Array.from({ length: Math.max(1, count) }, (_, index) =>
    getCalendarMonthByOffset(startMonth, index),
  );
}

function findMonthIndex(months: Date[], targetMonth: Date) {
  const targetKey = getRegionMonthKey(targetMonth);
  return months.findIndex((month) => getRegionMonthKey(month) === targetKey);
}

function getRegionDateKey(date: Date) {
  const parts = getRegionCalendarParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function getRegionMonthKey(date: Date) {
  const parts = getRegionCalendarParts(date);
  return `${parts.year}-${parts.month}`;
}

function getEventDateRangeLabel(event: Event) {
  const scheduleEndDate =
    Array.isArray(event.schedule) && event.schedule.length > 0
      ? event.schedule[event.schedule.length - 1]?.date
      : undefined;
  const endDate = event.endDate ?? scheduleEndDate ?? event.date;

  if (getRegionDateKey(event.date) === getRegionDateKey(endDate)) {
    return formatRegionDayMonth(event.date);
  }

  return formatRegionDateRange(event.date, endDate);
}

function getPlannerMonthCells(month: Date) {
  const monthParts = getRegionCalendarParts(month);
  const firstDay = getRegionMonthStart(month);
  const firstDayOffset = firstDay.getUTCDay();
  const startDate = new Date(firstDay);
  startDate.setUTCDate(firstDay.getUTCDate() - firstDayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + index);
    const parts = getRegionCalendarParts(date);

    return {
      date,
      dateKey: getRegionDateKey(date),
      day: parts.day,
      isCurrentMonth:
        parts.year === monthParts.year && parts.month === monthParts.month,
    };
  });
}

const plannerCellsCache = new Map<
  string,
  ReturnType<typeof getPlannerMonthCells>
>();

function getCachedPlannerMonthCells(month: Date) {
  const key = getRegionMonthKey(month);
  const cached = plannerCellsCache.get(key);

  if (cached) return cached;

  const cells = getPlannerMonthCells(month);
  plannerCellsCache.set(key, cells);
  return cells;
}

function getEventPlannerDates(event: Event) {
  if (Array.isArray(event.schedule) && event.schedule.length > 0) {
    return Array.from(
      new Set(
        event.schedule.map((occurrence) => getRegionDateKey(occurrence.date)),
      ),
    );
  }

  const startDate = event.date;
  const endDate = event.endDate ?? event.date;
  const startParts = getRegionCalendarParts(startDate);
  const endParts = getRegionCalendarParts(endDate);
  const dates: string[] = [];
  const cursor = new Date(
    Date.UTC(startParts.year, startParts.month - 1, startParts.day, 12),
  );
  const end = new Date(
    Date.UTC(endParts.year, endParts.month - 1, endParts.day, 12),
  );

  while (cursor.getTime() <= end.getTime()) {
    dates.push(getRegionDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function canPreloadEventThumbnails() {
  if (typeof navigator === "undefined") return false;

  const connection = (
    navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        effectiveType?: string;
      };
    }
  ).connection;

  if (connection?.saveData) return false;
  if (
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g"
  ) {
    return false;
  }

  return true;
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
  initialCalendarLayoutMode?: CalendarLayoutMode;
}

interface MonthContentLoadingProps {
  month: Date;
}

function MonthContentLoading({ month }: MonthContentLoadingProps) {
  const parts = getRegionCalendarParts(month);
  const monthName = months[parts.month - 1];

  return (
    <div
      className="min-h-[360px] border border-border-line bg-paper-highlight px-4 py-4"
      role="status"
      aria-live="polite"
      aria-label={`Cargando eventos de ${monthName} ${parts.year}`}
    >
      <div className="space-y-3" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 border border-border-line bg-paper p-2"
          >
            <div className="h-14 w-1 shrink-0 animate-pulse rounded-[2px] bg-brand/35" />
            <div className="h-14 w-14 shrink-0 animate-pulse bg-paper-dark" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-20 animate-pulse bg-brand/25" />
              <div className="h-4 w-full max-w-[220px] animate-pulse bg-ink-muted-light/25" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 border-t border-border-line pt-4" aria-hidden="true">
        <div className="space-y-3 bg-paper p-4">
          <div className="h-44 animate-pulse bg-paper-dark" />
          <div className="h-4 w-24 animate-pulse bg-brand/25" />
          <div className="h-5 w-4/5 animate-pulse bg-ink-muted-light/25" />
          <div className="h-3 w-full animate-pulse bg-ink-muted-light/20" />
          <div className="h-3 w-2/3 animate-pulse bg-ink-muted-light/20" />
        </div>
      </div>
    </div>
  );
}

interface MonthCalendarGridProps {
  month: Date;
  monthParts: ReturnType<typeof getRegionCalendarParts>;
  eventsByDay: Map<string, Event[]>;
  activePlannerDateKeys: Set<string>;
  onEventPreview: (event: Event) => void;
}

const MonthCalendarGrid = memo(function MonthCalendarGrid({
  month,
  monthParts,
  eventsByDay,
  activePlannerDateKeys,
  onEventPreview,
}: MonthCalendarGridProps) {
  const monthKey = getRegionMonthKey(month);
  const monthCells = useMemo(
    () => getCachedPlannerMonthCells(month),
    [month, monthKey],
  );

  return (
    <>
      <div className="mb-3 flex items-end justify-between border-b border-border-line pb-2">
        <div>
          <p className="type-system text-[14px] font-semibold uppercase tracking-[0.16em] text-brand-text">
            {monthParts.year}
          </p>
          <h3
            className={`${editorialFont.className} type-human-title text-[32px] font-semibold leading-none`}
          >
            {months[monthParts.month - 1]}
          </h3>
        </div>
        <p className="type-system flex items-center gap-1.5 text-[14px] text-ink-muted">
          Desliza para cambiar
          {/* <ArrowRight className="mt-1 h-4.5 w-4.5" aria-hidden="true" /> */}
        </p>
      </div>

      <div className="grid grid-cols-7 border-b border-border-line pb-1">
        {weekDayLabels.map((label, index) => (
          <div
            key={label}
            className={`type-system text-center text-[10px] font-semibold ${
              index === 0 ? "text-[#a83e3e]" : "text-ink-muted"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border-line border-x border-b border-border-line">
        {monthCells.map((cell) => {
          const dayEvents = eventsByDay.get(cell.dateKey) ?? [];
          const isSelectedEventDay = activePlannerDateKeys.has(cell.dateKey);
          const dayLabel =
            dayEvents.length > 0
              ? `${cell.day}, ${dayEvents.length} evento${
                  dayEvents.length === 1 ? "" : "s"
                }`
              : String(cell.day);

          return (
            <button
              key={cell.dateKey}
              type="button"
              disabled={dayEvents.length === 0}
              onClick={() => {
                if (dayEvents[0]) onEventPreview(dayEvents[0]);
              }}
              className={`min-h-[58px] bg-[#fbf8f4] px-1.5 py-1.5 text-left ${
                cell.isCurrentMonth
                  ? "text-ink"
                  : "text-ink-muted-light opacity-55"
              } ${
                isSelectedEventDay
                  ? "outline outline-1 outline-offset-[-2px] outline-brand"
                  : ""
              } ${
                dayEvents.length > 0 ? "active:bg-brand-soft" : "cursor-default"
              }`}
              aria-label={dayLabel}
            >
              <span className="type-system block text-[13px] font-semibold leading-none">
                {cell.day}
              </span>
              {dayEvents.length > 0 && (
                <span className="mt-2 flex flex-col gap-1">
                  {dayEvents.slice(0, 3).map((event) => {
                    const color = eventTypePlannerColors[event.eventType];

                    return (
                      <span
                        key={event.id}
                        className="block h-1.5 rounded-[2px]"
                        style={{ backgroundColor: color.ink }}
                      />
                    );
                  })}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
});

interface MobileMonthPlannerProps {
  events: Event[];
  selectedMonth: Date;
  selectedPlannerEvent: Event | null;
  onMonthSelect: (date: Date) => void;
  onEventPreview: (event: Event) => void;
  onRegister: (event: Event) => void;
}

function MobileMonthPlanner({
  events,
  selectedMonth,
  selectedPlannerEvent,
  onMonthSelect,
  onEventPreview,
  onRegister,
}: MobileMonthPlannerProps) {
  const initialRangeStartRef = useRef<Date | null>(null);

  if (!initialRangeStartRef.current) {
    const fallbackStart = getCalendarMonthByOffset(
      selectedMonth,
      -INITIAL_PAST_MONTHS,
    );

    initialRangeStartRef.current = events.reduce(
      (earliestMonth, event) =>
        getEarlierMonth(earliestMonth, getRegionMonthStart(event.date)),
      fallbackStart,
    );
  }

  const initialRangeStart = initialRangeStartRef.current;
  const [rangeEndMonth, setRangeEndMonth] = useState(() => {
    const fallbackEnd = getCalendarMonthByOffset(
      selectedMonth,
      INITIAL_FUTURE_MONTHS,
    );

    return events.reduce(
      (latestMonth, event) =>
        getLaterMonth(latestMonth, getRegionMonthStart(event.date)),
      fallbackEnd,
    );
  });
  const calendarMonths = useMemo(
    () => getMonthsInRange(initialRangeStart, rangeEndMonth),
    [initialRangeStart, rangeEndMonth],
  );
  const selectedMonthKey = getRegionMonthKey(selectedMonth);
  const lastSyncedSelectedMonthKeyRef = useRef(selectedMonthKey);
  const initialMonthIndexRef = useRef<number | null>(null);

  if (initialMonthIndexRef.current === null) {
    initialMonthIndexRef.current = Math.max(
      0,
      findMonthIndex(calendarMonths, selectedMonth),
    );
  }

  const initialMonthIndex = initialMonthIndexRef.current;
  const [activeMonthIndex, setActiveMonthIndex] = useState(initialMonthIndex);
  const emblaOptions = useMemo(
    () => ({
      align: "start" as const,
      loop: false,
      dragFree: false,
      skipSnaps: false,
      slidesToScroll: 1,
      containScroll: "trimSnaps" as const,
      startIndex: initialMonthIndex,
      duration: MONTH_PLANNER_SNAP_DURATION,
      watchSlides: true,
    }),
    [initialMonthIndex],
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions);

  const plannerMonthData = useMemo(
    () =>
      calendarMonths.map((month) => {
        const monthParts = getRegionCalendarParts(month);

        return {
          month,
          monthParts,
          monthKey: getRegionMonthKey(month),
        };
      }),
    [calendarMonths],
  );

  const displayedPlannerEvents = useMemo(() => {
    const selectedParts = getRegionCalendarParts(selectedMonth);

    return events
      .filter((event) => {
        const parts = getRegionCalendarParts(event.date);
        return (
          parts.month === selectedParts.month && parts.year === selectedParts.year
        );
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, selectedMonth]);

  const selectedPlannerEventId =
    selectedPlannerEvent &&
    displayedPlannerEvents.some((event) => event.id === selectedPlannerEvent.id)
      ? selectedPlannerEvent.id
      : (displayedPlannerEvents[0]?.id ?? null);
  const activePlannerEvent =
    displayedPlannerEvents.find((event) => event.id === selectedPlannerEventId) ??
    null;
  const activePlannerDateKeys = useMemo(
    () =>
      new Set(
        activePlannerEvent ? getEventPlannerDates(activePlannerEvent) : [],
      ),
    [activePlannerEvent],
  );

  const eventsByDay = useMemo(() => {
    const dayMap = new Map<string, Event[]>();

    events.forEach((event) => {
      getEventPlannerDates(event).forEach((dateKey) => {
        const dayEvents = dayMap.get(dateKey) ?? [];
        dayEvents.push(event);
        dayMap.set(dateKey, dayEvents);
      });
    });

    dayMap.forEach((dayEvents) => {
      dayEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    return dayMap;
  }, [events]);

  const extendCalendarIfNeeded = useCallback(
    (selectedIndex: number) => {
      if (selectedIndex < calendarMonths.length - LOAD_MORE_THRESHOLD) return;

      setRangeEndMonth((currentEnd) =>
        getCalendarMonthByOffset(currentEnd, MONTHS_TO_APPEND),
      );
    },
    [calendarMonths.length],
  );

  const handleEmblaSelect = useCallback(
    (api: NonNullable<typeof emblaApi>) => {
      const index = api.selectedScrollSnap();

      setActiveMonthIndex(index);
      extendCalendarIfNeeded(index);
    },
    [extendCalendarIfNeeded],
  );

  const handleEmblaSettle = useCallback(
    (api: NonNullable<typeof emblaApi>) => {
      const selectedIndex = api.selectedScrollSnap();
      const nextMonth = calendarMonths[selectedIndex];

      if (!nextMonth) return;
      if (getRegionMonthKey(nextMonth) === getRegionMonthKey(selectedMonth)) {
        return;
      }

      onMonthSelect(nextMonth);
    },
    [calendarMonths, onMonthSelect, selectedMonth],
  );

  const activeCarouselMonth = calendarMonths[activeMonthIndex] ?? selectedMonth;
  const activeCarouselMonthKey = getRegionMonthKey(activeCarouselMonth);
  const isMonthContentPending =
    activeCarouselMonthKey !== selectedMonthKey;

  useEffect(() => {
    if (events.length === 0) return;

    const latestEventMonth = events.reduce(
      (latestMonth, event) =>
        getLaterMonth(latestMonth, getRegionMonthStart(event.date)),
      getRegionMonthStart(events[0].date),
    );

    setRangeEndMonth((currentEnd) =>
      getLaterMonth(currentEnd, latestEventMonth),
    );
  }, [events]);

  useEffect(() => {
    setRangeEndMonth((currentEnd) => getLaterMonth(currentEnd, selectedMonth));
  }, [selectedMonth]);

  useEffect(() => {
    if (!emblaApi) return;

    handleEmblaSelect(emblaApi);
    emblaApi.on("select", handleEmblaSelect);
    emblaApi.on("settle", handleEmblaSettle);

    return () => {
      emblaApi.off("select", handleEmblaSelect);
      emblaApi.off("settle", handleEmblaSettle);
    };
  }, [emblaApi, handleEmblaSelect, handleEmblaSettle]);

  useEffect(() => {
    if (!emblaApi) return;

    const targetIndex = findMonthIndex(calendarMonths, selectedMonth);
    const didSelectedMonthChange =
      lastSyncedSelectedMonthKeyRef.current !== selectedMonthKey;

    if (targetIndex < 0) return;

    if (
      !didSelectedMonthChange &&
      emblaApi.selectedScrollSnap() !== targetIndex
    ) {
      return;
    }

    lastSyncedSelectedMonthKeyRef.current = selectedMonthKey;
    setActiveMonthIndex(targetIndex);
    extendCalendarIfNeeded(targetIndex);

    if (emblaApi.selectedScrollSnap() !== targetIndex) {
      emblaApi.scrollTo(targetIndex, true);
    }
  }, [
    calendarMonths,
    emblaApi,
    extendCalendarIfNeeded,
    selectedMonth,
    selectedMonthKey,
  ]);

  return (
    <div className="md:hidden">
      <div className="relative -mx-4 mt-4 overflow-hidden border-y border-border-line bg-[#fbf8f4]">
        <div
          ref={emblaRef}
          className="overflow-hidden touch-pan-y"
          aria-label="Calendario mensual deslizable"
        >
          <div className="flex transform-gpu will-change-transform [backface-visibility:hidden]">
            {plannerMonthData.map(({ month, monthParts, monthKey }, index) => (
              <div
                key={monthKey}
                className="min-w-0 flex-[0_0_100%] bg-[#fbf8f4] px-4 pb-4 pt-3 [contain:layout_paint]"
              >
                {Math.abs(index - activeMonthIndex) <= MONTH_RENDER_RADIUS ? (
                  <MonthCalendarGrid
                    month={month}
                    monthParts={monthParts}
                    eventsByDay={eventsByDay}
                    activePlannerDateKeys={activePlannerDateKeys}
                    onEventPreview={onEventPreview}
                  />
                ) : (
                  <div className="h-[430px]" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-end justify-between gap-3 border-b pb-2">
          <div>
            <p className="type-system text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text">
              Eventos del mes
            </p>
            {!isMonthContentPending && (
              <p className="type-system text-[13px] text-ink-muted">
                {displayedPlannerEvents.length === 0
                  ? "No hay eventos programados"
                  : `${displayedPlannerEvents.length} ${
                      displayedPlannerEvents.length === 1 ? "evento" : "eventos"
                    }`}
              </p>
            )}
          </div>
        </div>

        {isMonthContentPending ? (
          <MonthContentLoading month={activeCarouselMonth} />
        ) : displayedPlannerEvents.length === 0 ? (
          <div className="border border-border-line bg-paper-highlight px-5 py-7 text-center">
            <Calendar className="mx-auto mb-3 h-8 w-8 text-ink-muted-light/50" />
            <p className="type-system text-sm font-semibold text-ink">
              Sin eventos este mes
            </p>
            <p className="type-system mt-1 text-xs text-ink-muted">
              Desliza el calendario para buscar otro mes.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {displayedPlannerEvents.map((event) => {
                const thumbnailUrl = getEventCardThumbnailUrl(
                  event.image,
                  "compact",
                );
                const color = eventTypePlannerColors[event.eventType];
                const isSelected = event.id === selectedPlannerEventId;

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onEventPreview(event)}
                    className={`flex w-full items-center gap-3 border bg-paper-highlight p-2 text-left transition-colors active:bg-brand-soft ${
                      isSelected ? "" : "border-border-line"
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: color.paper,
                            borderColor: color.border,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="h-14 w-1 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: color.ink }}
                      aria-hidden="true"
                    />
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden border border-border-line bg-paper-dark">
                      {thumbnailUrl && thumbnailUrl !== "/placeholder.svg" ? (
                        <Image
                          src={thumbnailUrl}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <Calendar className="h-5 w-5 text-ink-muted-light" />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="type-system block text-[12px] font-semibold text-brand-text">
                        {getEventDateRangeLabel(event)}
                      </span>
                      <span className="type-system block truncate text-[15px] font-semibold leading-tight text-ink">
                        {event.title}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {activePlannerEvent && (
              <div className="mt-5 border-t border-border-line pt-4">
                <EventCard
                  event={activePlannerEvent}
                  onRegister={onRegister}
                  showAlbumButton={activePlannerEvent.status === "past"}
                  tone="editorial"
                  idPrefix="month-planner"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
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
    filteredEvents.length === 0
      ? "empty"
      : filteredEvents.length === 1
        ? "single"
        : "grid"
  }`;
  const shouldAnimateCalendarChange =
    isMobile && calendarChangeReason === "view";
  const compactMobileResultsFloorClass =
    renderedViewMode === "compact" ? "min-h-[560px] md:min-h-0" : "";
  const shouldRenderLegacyCalendar = !isMobile || !isMonthPlannerEnabled;
  const shouldRenderMobileMonthPlanner = isMobile && isMonthPlannerEnabled;

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

      return filteredEvents[0] ?? null;
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

  return (
    <div
      className="w-full relative bg-[#f1f1f1]"
      /* [#f1f1f1] */ data-events-feed="true"
    >
      <div className="desktop-content-pane max-w-[950px] mx-auto bg-[#ffffff] md:border-x">
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

        <FirstVisitInfoMobile />

        {/* Info Cards (Services, Bible, Hymnal) - HIDDEN */}
        {/* <HomeInfoCards /> */}

        {/* Calendar section */}
        <section
          id="calendario"
          className="mt-0 md:mt-0 px-4 md:px-[32px] pt-6 pb-4 border-border/70 bg-muted/20"
        >
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
            {/* Navigator aligned with left content edge on desktop */}
            {shouldRenderLegacyCalendar && (
              <div className="max-w-md w-full">
                <MonthNavigator
                  selectedMonth={selectedMonth}
                  onMonthSelect={handleMonthSelect}
                  eventDates={eventDates}
                />
              </div>
            )}
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
            className="bg-muted/20 px-4 md:px-[32px] md:py-[24px] pt-4 pb-14"
          >
          <div className="mt-0 max-w-4xl mx-auto w-full">
            {/* Month label */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3
                  className={`${editorialFont.className} type-human-title font-semibold text-[1.425rem] tracking-tight`}
                >
                  {months[getRegionCalendarParts(selectedMonth).month - 1]}{" "}
                  {getRegionCalendarParts(selectedMonth).year}
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
            <div className={compactMobileResultsFloorClass}>
              <AnimatePresence
                mode={shouldAnimateCalendarChange ? "wait" : "sync"}
                initial={false}
              >
                {filteredEvents.length === 0 ? (
                  <motion.div
                    key={calendarStateKey}
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
                        ? calendarFadeTransition
                        : { duration: 0 }
                    }
                    className="bg-paper-highlight border border-border p-8 text-center max-w-md mx-auto"
                  >
                    <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">
                      Sin eventos este mes
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Selecciona otro mes en el calendario para ver más
                      actividades.
                    </p>
                  </motion.div>
                ) : renderedViewMode === "compact" ? (
                  <motion.div
                    key={calendarStateKey}
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
                        ? calendarFadeTransition
                        : { duration: 0 }
                    }
                    className="-mx-2.5 p-0.5 flex flex-col gap-5 pb-14 md:gap-6"
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
                        ? calendarFadeTransition
                        : { duration: 0 }
                    }
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
                        ? calendarFadeTransition
                        : { duration: 0 }
                    }
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
          </div>
          </section>
        )}
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
