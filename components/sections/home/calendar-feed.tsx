"use client";

import { useState, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import Image from "next/image";
import { Newsreader } from "next/font/google";
import { Calendar } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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
const PLANNER_MONTH_OFFSETS = [-1, 0, 1];
const PLANNER_EVENT_CACHE_OFFSETS = [-1, 0, 1];
const PLANNER_CENTER_INDEX = 1;
const PLANNER_COMMIT_DELAY_MS = 200;
const PLANNER_CACHE_SETTLE_DELAY_MS = 1400;
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
  const plannerScrollerRef = useRef<HTMLDivElement | null>(null);
  const plannerSettleTimerRef = useRef<number | null>(null);
  const plannerCommitTimerRef = useRef<number | null>(null);
  const isRecenteringPlannerRef = useRef(false);
  const isPlannerTouchingRef = useRef(false);
  const isPlannerAnimatingRef = useRef(false);
  const plannerTouchStartXRef = useRef<number | null>(null);
  const plannerTouchDeltaXRef = useRef(0);
  const didCommitCurrentTouchRef = useRef(false);
  const selectedMonthRef = useRef(selectedMonth);
  const plannerPendingOffsetRef = useRef<number | null>(null);
  const plannerMonthCellsCacheRef = useRef(
    new Map<string, ReturnType<typeof getPlannerMonthCells>>(),
  );
  const [settledPlannerMonth, setSettledPlannerMonth] =
    useState(selectedMonth);
  const isPlannerMonthSettling =
    getRegionMonthKey(settledPlannerMonth) !== getRegionMonthKey(selectedMonth);

  useEffect(() => {
    selectedMonthRef.current = selectedMonth;
  }, [selectedMonth]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSettledPlannerMonth(selectedMonth);
    }, PLANNER_CACHE_SETTLE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [selectedMonth]);

  const plannerMonths = useMemo(
    () =>
      PLANNER_MONTH_OFFSETS.map((offset) =>
        getCalendarMonthByOffset(selectedMonth, offset),
      ),
    [selectedMonth],
  );
  const plannerMonthData = useMemo(
    () =>
      plannerMonths.map((month) => {
        const monthParts = getRegionCalendarParts(month);
        const monthKey = `${monthParts.year}-${monthParts.month}`;
        let monthCells = plannerMonthCellsCacheRef.current.get(monthKey);

        if (!monthCells) {
          monthCells = getPlannerMonthCells(month);
          plannerMonthCellsCacheRef.current.set(monthKey, monthCells);
        }

        return {
          monthParts,
          monthCells,
          monthKey,
        };
      }),
    [plannerMonths],
  );
  const displayedPlannerEvents = useMemo(() => {
    const settledParts = getRegionCalendarParts(settledPlannerMonth);

    return events
      .filter((event) => {
        const parts = getRegionCalendarParts(event.date);
        return (
          parts.month === settledParts.month && parts.year === settledParts.year
        );
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, settledPlannerMonth]);
  const currentPlannerEvents = useMemo(() => {
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
  const selectedCalendarEventId =
    selectedPlannerEvent &&
    currentPlannerEvents.some((event) => event.id === selectedPlannerEvent.id)
      ? selectedPlannerEvent.id
      : (currentPlannerEvents[0]?.id ?? null);
  const activePlannerEvent =
    displayedPlannerEvents.find((event) => event.id === selectedPlannerEventId) ??
    null;
  const activeCalendarEvent =
    currentPlannerEvents.find((event) => event.id === selectedCalendarEventId) ??
    null;
  const cachedPlannerEvents = useMemo(() => {
    const targetMonthKeys = new Set(
      PLANNER_EVENT_CACHE_OFFSETS.map((offset) =>
        getRegionMonthKey(
          getCalendarMonthByOffset(settledPlannerMonth, offset),
        ),
      ),
    );

    return events
      .filter((event) => targetMonthKeys.has(getRegionMonthKey(event.date)))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, settledPlannerMonth]);
  const activeCachedPlannerEvent = activePlannerEvent
    ? cachedPlannerEvents.find((event) => event.id === activePlannerEvent.id)
    : null;
  const activePlannerDateKeys = useMemo(
    () =>
      new Set(
        activeCalendarEvent ? getEventPlannerDates(activeCalendarEvent) : [],
      ),
    [activeCalendarEvent],
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

  useLayoutEffect(() => {
    const scroller = plannerScrollerRef.current;
    if (!scroller) return;

    isRecenteringPlannerRef.current = true;

    const centerPlanner = () => {
      const monthWidth = scroller.clientWidth;

      if (monthWidth === 0) {
        window.requestAnimationFrame(centerPlanner);
        return;
      }

      if (plannerSettleTimerRef.current) {
        window.clearTimeout(plannerSettleTimerRef.current);
        plannerSettleTimerRef.current = null;
      }

      const previousScrollBehavior = scroller.style.scrollBehavior;

      scroller.style.scrollBehavior = "auto";
      scroller.scrollLeft = monthWidth * PLANNER_CENTER_INDEX;

      window.requestAnimationFrame(() => {
        scroller.style.scrollBehavior = previousScrollBehavior;
        isRecenteringPlannerRef.current = false;
        isPlannerAnimatingRef.current = false;
        plannerPendingOffsetRef.current = null;
        didCommitCurrentTouchRef.current = false;
      });
    };

    centerPlanner();
  }, [selectedMonth]);

  useEffect(() => {
    return () => {
      if (plannerSettleTimerRef.current) {
        window.clearTimeout(plannerSettleTimerRef.current);
      }

      if (plannerCommitTimerRef.current) {
        window.clearTimeout(plannerCommitTimerRef.current);
      }
    };
  }, []);

  const commitPlannerPosition = (
    touchDeltaX = 0,
    source: "scroll" | "touch" = "scroll",
  ) => {
    if (source === "scroll" && didCommitCurrentTouchRef.current) {
      return;
    }

    if (
      isRecenteringPlannerRef.current ||
      isPlannerAnimatingRef.current ||
      plannerPendingOffsetRef.current !== null
    ) {
      return;
    }

    if (plannerSettleTimerRef.current) {
      window.clearTimeout(plannerSettleTimerRef.current);
      plannerSettleTimerRef.current = null;
    }

    const scroller = plannerScrollerRef.current;
    if (!scroller || scroller.clientWidth === 0) return;

    const monthWidth = scroller.clientWidth;
    const centerLeft = monthWidth * PLANNER_CENTER_INDEX;
    const displacement = scroller.scrollLeft - centerLeft;

    const positionThreshold = monthWidth * 0.28;
    const flickThreshold = 42;
    const minimumVisibleThreshold = monthWidth * 0.12;

    let nextOffset = 0;

    if (Math.abs(displacement) >= positionThreshold) {
      nextOffset = displacement > 0 ? 1 : -1;
    } else if (
      Math.abs(touchDeltaX) >= flickThreshold &&
      Math.abs(displacement) >= minimumVisibleThreshold
    ) {
      nextOffset = touchDeltaX < 0 ? 1 : -1;
    }

    if (source === "touch" && nextOffset === 0) {
      return;
    }

    const targetLeft = centerLeft + nextOffset * monthWidth;

    if (source === "touch" && nextOffset !== 0) {
      didCommitCurrentTouchRef.current = true;
    }

    isPlannerAnimatingRef.current = true;
    plannerPendingOffsetRef.current = nextOffset;

    scroller.scrollTo({
      left: targetLeft,
      behavior: "smooth",
    });

    if (plannerCommitTimerRef.current) {
      window.clearTimeout(plannerCommitTimerRef.current);
    }

    plannerCommitTimerRef.current = window.setTimeout(() => {
      plannerCommitTimerRef.current = null;

      if (nextOffset === 0) {
        isPlannerAnimatingRef.current = false;
        plannerPendingOffsetRef.current = null;
        return;
      }

      onMonthSelect(
        getCalendarMonthByOffset(selectedMonthRef.current, nextOffset),
      );

      window.setTimeout(() => {
        if (plannerPendingOffsetRef.current === nextOffset) {
          isPlannerAnimatingRef.current = false;
          plannerPendingOffsetRef.current = null;
        }
      }, PLANNER_COMMIT_DELAY_MS + 180);
    }, PLANNER_COMMIT_DELAY_MS);
  };

  const schedulePlannerSettle = () => {
    if (
      isRecenteringPlannerRef.current ||
      isPlannerTouchingRef.current ||
      isPlannerAnimatingRef.current ||
      plannerPendingOffsetRef.current !== null
    ) {
      return;
    }

    if (plannerSettleTimerRef.current) {
      window.clearTimeout(plannerSettleTimerRef.current);
    }

    plannerSettleTimerRef.current = window.setTimeout(() => {
      commitPlannerPosition();
    }, 120);
  };

  const handlePlannerTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    isPlannerTouchingRef.current = true;
    didCommitCurrentTouchRef.current = false;
    plannerTouchStartXRef.current = event.touches[0]?.clientX ?? null;
    plannerTouchDeltaXRef.current = 0;
  };

  const handlePlannerTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (plannerTouchStartXRef.current === null) return;

    const currentX = event.touches[0]?.clientX;
    if (typeof currentX !== "number") return;

    plannerTouchDeltaXRef.current = currentX - plannerTouchStartXRef.current;
  };

  const handlePlannerTouchEnd = () => {
    const touchDeltaX = plannerTouchDeltaXRef.current;

    isPlannerTouchingRef.current = false;
    plannerTouchStartXRef.current = null;
    plannerTouchDeltaXRef.current = 0;

    commitPlannerPosition(touchDeltaX, "touch");
  };

  const handlePlannerTouchCancel = () => {
    isPlannerTouchingRef.current = false;
    plannerTouchStartXRef.current = null;
    plannerTouchDeltaXRef.current = 0;

    commitPlannerPosition(0, "touch");
  };

  return (
    <div className="md:hidden">
      <div className="relative -mx-4 mt-4 overflow-hidden border-y border-border-line bg-paper-highlight">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-paper-highlight to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-paper-highlight to-transparent" />
        <div
          ref={plannerScrollerRef}
          onScroll={schedulePlannerSettle}
          onTouchStart={handlePlannerTouchStart}
          onTouchMove={handlePlannerTouchMove}
          onTouchEnd={handlePlannerTouchEnd}
          onTouchCancel={handlePlannerTouchCancel}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Calendario mensual deslizable"
        >
          {plannerMonthData.map(({ monthParts, monthCells, monthKey }) => {
            return (
              <div
                key={monthKey}
                className="w-full shrink-0 snap-center bg-paper-highlight px-4 pb-4 pt-3"
              >
                <div className="mb-3 flex items-end justify-between border-b border-border-line pb-2">
                  <div>
                    <p className="type-system text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text">
                      {monthParts.year}
                    </p>
                    <h3
                      className={`${editorialFont.className} type-human-title text-[1.6rem] font-semibold leading-none`}
                    >
                      {months[monthParts.month - 1]}
                    </h3>
                  </div>
                  <p className="type-system text-[12px] text-ink-muted">
                    Desliza para cambiar
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

                <div className="grid grid-cols-7 gap-px bg-border-line/80 border-x border-b border-border-line">
                  {monthCells.map((cell) => {
                    const dayEvents = eventsByDay.get(cell.dateKey) ?? [];
                    const isSelectedEventDay = activePlannerDateKeys.has(
                      cell.dateKey,
                    );
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
                        className={`min-h-[58px] bg-paper px-1.5 py-1.5 text-left transition-colors ${
                          cell.isCurrentMonth
                            ? "text-ink"
                            : "text-ink-muted-light opacity-55"
                        } ${
                          isSelectedEventDay
                            ? "outline outline-1 outline-offset-[-2px] outline-brand"
                            : ""
                        } ${
                          dayEvents.length > 0
                            ? "active:bg-brand-soft"
                            : "cursor-default"
                        }`}
                        aria-label={dayLabel}
                      >
                        <span className="type-system block text-[13px] font-semibold leading-none">
                          {cell.day}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="mt-2 flex flex-col gap-1">
                            {dayEvents.slice(0, 3).map((event) => {
                              const color =
                                eventTypePlannerColors[event.eventType];

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
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-end justify-between gap-3 border-b pb-2">
          <div>
            <p className="type-system text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text">
              Eventos del mes
            </p>
            <p className="type-system text-[13px] text-ink-muted">
              {isPlannerMonthSettling
                ? "Cargando eventos"
                : displayedPlannerEvents.length === 0
                ? "No hay eventos programados"
                : `${displayedPlannerEvents.length} ${
                    displayedPlannerEvents.length === 1 ? "evento" : "eventos"
                  }`}
            </p>
          </div>
        </div>

        {isPlannerMonthSettling ? (
          <div
            className="border border-border-line bg-paper-highlight px-5 py-12 text-center"
            role="status"
            aria-live="polite"
          >
            <div
              className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#b8cbe1] border-t-[#2f5e93]"
              aria-hidden="true"
            />
            <p className="type-system mt-4 text-sm font-semibold text-ink">
              Cargando eventos...
            </p>
          </div>
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
        )}

        {!isPlannerMonthSettling && activeCachedPlannerEvent && (
          <div className="mt-5 border-t border-border-line pt-4">
            <div className="relative">
              {cachedPlannerEvents.map((event) => {
                const isActive = event.id === activeCachedPlannerEvent.id;

                return (
                  <div
                    key={event.id}
                    aria-hidden={!isActive}
                    className={
                      isActive
                        ? "relative"
                        : "invisible pointer-events-none absolute inset-x-0 top-0"
                    }
                  >
                    <EventCard
                      event={event}
                      onRegister={onRegister}
                      showAlbumButton={event.status === "past"}
                      tone="editorial"
                      idPrefix="month-planner"
                    />
                  </div>
                );
              })}
            </div>
          </div>
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
  const legacyCalendarVisibilityClass = isMonthPlannerEnabled
    ? "hidden md:block"
    : "";

  useEffect(() => {
    if (!isMonthPlannerEnabled) {
      setThumbnailPreloadMonth(selectedMonth);
      return;
    }

    const timer = window.setTimeout(() => {
      setThumbnailPreloadMonth(selectedMonth);
    }, PLANNER_CACHE_SETTLE_DELAY_MS);

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
            <div className={`max-w-md w-full ${legacyCalendarVisibilityClass}`}>
              <MonthNavigator
                selectedMonth={selectedMonth}
                onMonthSelect={handleMonthSelect}
                eventDates={eventDates}
              />
            </div>
            {isMonthPlannerEnabled && (
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
        <section
          id="eventos"
          className={`bg-muted/20 px-4 md:px-[32px] md:py-[24px] pt-4 pb-14 ${legacyCalendarVisibilityClass}`}
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
