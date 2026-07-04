// Donde: calendario de home en modo Mes. Viewports: mobile. Funcion: muestra carrusel mensual, eventos del mes y preview del evento activo.
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { Newsreader } from "next/font/google";
import { Calendar, Pointer } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import {
  EventCard,
  getEventCardThumbnailUrl,
} from "@/components/shared/event-card";
import { getRegionCalendarParts, getRegionMonthStart } from "@/lib/region-date";
import type { Event } from "@/lib/types";
import {
  CALENDAR_MONTHS,
  EVENT_TYPE_PLANNER_COLORS,
  INITIAL_FUTURE_MONTHS,
  INITIAL_PAST_MONTHS,
  LOAD_MORE_THRESHOLD,
  MONTHS_TO_APPEND,
  MONTH_PLANNER_MONTH_COMMIT_DELAY_MS,
  MONTH_PLANNER_SNAP_DURATION,
  MONTH_RENDER_RADIUS,
  WEEKDAY_LABELS,
} from "@/components/sections/home/calendar-feed/calendar-copy";
import {
  findMonthIndex,
  getCachedPlannerMonthCells,
  getCalendarMonthByOffset,
  getEarlierMonth,
  getEventDateRangeLabel,
  getEventPlannerDates,
  getLaterMonth,
  getMonthsInRange,
  getMostRelevantEvent,
  getRegionDateKey,
  getRegionMonthKey,
} from "@/components/sections/home/calendar-feed/calendar-utils";
import { MonthContentLoading } from "@/components/sections/home/calendar-feed/month-content-loading";

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const CALENDAR_SWIPE_HINT_STORAGE_KEY = "rm-calendar-swipe-hint-seen";

function isCalendarSwipeHintDebugHost() {
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

function readCalendarSwipeHintSeen() {
  try {
    return (
      window.localStorage.getItem(CALENDAR_SWIPE_HINT_STORAGE_KEY) === "true"
    );
  } catch {
    return false;
  }
}

function saveCalendarSwipeHintSeen() {
  try {
    window.localStorage.setItem(CALENDAR_SWIPE_HINT_STORAGE_KEY, "true");
  } catch {
    // Persistence is best-effort; the hint should still get out of the way.
  }
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
  const todayKey = getRegionDateKey(new Date());

  return (
    <>
      <div className="mb-3 flex items-end justify-between border-b border-border-line pb-2">
        <div>
          <p className="type-system text-[13px] font-semibold uppercase tracking-[0.16em] text-brand-text mb-1">
            {monthParts.year}
          </p>
          <h3
            className={`${editorialFont.className} type-human-title text-[28px] font-semibold leading-none`}
          >
            {CALENDAR_MONTHS[monthParts.month - 1]}
          </h3>
        </div>
        <p className="flex items-center gap-1.5 text-[14px] text-ink-soft">
          Desliza para cambiar
          {/* <ArrowRight className="mt-1 h-4.5 w-4.5" aria-hidden="true" /> */}
        </p>
      </div>

      <div className="grid grid-cols-7 border-b border-border-line pb-1">
        {WEEKDAY_LABELS.map((label, index) => (
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
          const isToday = cell.dateKey === todayKey;
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
              <span
                className={`type-system flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold leading-none ${
                  isToday
                    ? "border-2 border-brand bg-[#fbf8f4] text-brand-text"
                    : ""
                }`}
              >
                {cell.day}
              </span>
              {dayEvents.length > 0 && (
                <span className="mt-2 flex flex-col gap-1">
                  {dayEvents.slice(0, 3).map((event) => {
                    const color = EVENT_TYPE_PLANNER_COLORS[event.eventType];

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

export function MobileMonthPlanner({
  events,
  selectedMonth,
  selectedPlannerEvent,
  onMonthSelect,
  onEventPreview,
  onRegister,
}: MobileMonthPlannerProps) {
  const initialRangeStartRef = useRef<Date | null>(null);
  const touchAreaRef = useRef<HTMLDivElement | null>(null);
  const hasTriggeredSwipeHintRef = useRef(false);

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
  const monthCommitTimerRef = useRef<number | null>(null);

  if (initialMonthIndexRef.current === null) {
    initialMonthIndexRef.current = Math.max(
      0,
      findMonthIndex(calendarMonths, selectedMonth),
    );
  }

  const initialMonthIndex = initialMonthIndexRef.current;
  const [activeMonthIndex, setActiveMonthIndex] = useState(initialMonthIndex);
  const [shouldShowSwipeHint, setShouldShowSwipeHint] = useState(false);
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
      : getMostRelevantEvent(displayedPlannerEvents)?.id;
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
      const nextMonth = calendarMonths[index];

      setActiveMonthIndex(index);
      extendCalendarIfNeeded(index);

      if (!nextMonth) return;
      if (monthCommitTimerRef.current !== null) {
        window.clearTimeout(monthCommitTimerRef.current);
        monthCommitTimerRef.current = null;
      }

      if (getRegionMonthKey(nextMonth) === getRegionMonthKey(selectedMonth)) {
        return;
      }

      monthCommitTimerRef.current = window.setTimeout(() => {
        monthCommitTimerRef.current = null;
        onMonthSelect(nextMonth);
      }, MONTH_PLANNER_MONTH_COMMIT_DELAY_MS);
    },
    [calendarMonths, extendCalendarIfNeeded, onMonthSelect, selectedMonth],
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

    return () => {
      emblaApi.off("select", handleEmblaSelect);
    };
  }, [emblaApi, handleEmblaSelect]);

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

  useEffect(() => {
    const shouldForceSwipeHint = isCalendarSwipeHintDebugHost();
    if (!shouldForceSwipeHint && readCalendarSwipeHintSeen()) return;

    const touchArea = touchAreaRef.current;
    if (!touchArea) return;

    const revealSwipeHint = () => {
      if (hasTriggeredSwipeHintRef.current) return;

      hasTriggeredSwipeHintRef.current = true;
      if (!shouldForceSwipeHint) {
        saveCalendarSwipeHintSeen();
      }
      setShouldShowSwipeHint(true);
    };

    if (!("IntersectionObserver" in window)) {
      const fallbackTimer = window.setTimeout(revealSwipeHint, 500);
      return () => window.clearTimeout(fallbackTimer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.45) return;

        revealSwipeHint();
        observer.disconnect();
      },
      {
        rootMargin: "0px",
        threshold: [0.98, 1],
      },
    );

    observer.observe(touchArea);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (monthCommitTimerRef.current !== null) {
        window.clearTimeout(monthCommitTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="md:hidden">
      <div
        ref={touchAreaRef}
        className="relative -mx-4 mt-4 overflow-hidden border-y border-border-line bg-[#fbf8f4]"
      >
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

        {shouldShowSwipeHint && (
          <div
            className="calendar-swipe-hint pointer-events-auto absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 px-8 text-white"
            role="status"
            aria-live="polite"
            onAnimationEnd={(event) => {
              if (
                event.currentTarget !== event.target ||
                !event.animationName.includes("calendarSwipeHintOverlay")
              ) {
                return;
              }

              setShouldShowSwipeHint(false);
            }}
          >
            <div className="relative h-32 w-full max-w-[300px]" aria-hidden="true">
              <span className="calendar-swipe-hint__trail" />
              <div className="calendar-swipe-hint__frame">
                <span className="calendar-swipe-hint__touch-ring" />
                <Pointer className="h-20 w-20 -rotate-12" strokeWidth={1.7} />
              </div>
            </div>
            <p className="calendar-swipe-hint__label type-system mt-5 text-center text-[22px] font-bold leading-tight text-white">
              Desliza para ver más meses
            </p>

            <style jsx>{`
              .calendar-swipe-hint {
                animation: calendarSwipeHintOverlay 3.2s ease both;
              }

              .calendar-swipe-hint__frame {
                position: absolute;
                top: 50%;
                display: flex;
                height: 104px;
                width: 104px;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                left: 24%;
                opacity: 0;
                transform: translate3d(-50%, -50%, 0) scale(0.92);
                animation: calendarSwipeHintHandMove 1.6s ease-in-out 2 both;
              }

              .calendar-swipe-hint__touch-ring {
                position: absolute;
                inset: 4px;
                border: 2px solid rgba(255, 255, 255, 0.72);
                border-radius: 999px;
                opacity: 0;
                transform: scale(0.62);
              }

              .calendar-swipe-hint__trail {
                position: absolute;
                left: calc(24% - 18px);
                right: calc(24% + 18px);
                top: calc(50% - 32px);
                height: 3px;
                overflow: hidden;
                background: rgba(255, 255, 255, 0.22);
              }

              .calendar-swipe-hint__trail::after {
                content: "";
                position: absolute;
                inset: 0;
                background: linear-gradient(
                  90deg,
                  transparent,
                  rgba(255, 255, 255, 0.95),
                  transparent
                );
                transform: translateX(-100%);
                animation: calendarSwipeHintTrail 1.6s ease-in-out 2 both;
              }

              .calendar-swipe-hint__label {
                max-width: 280px;
                padding: 8px 12px;
                background: rgba(0, 0, 0, 0.52);
                color: #ffffff;
                text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
              }

              .calendar-swipe-hint__touch-ring {
                animation: calendarSwipeHintTouchRing 1.6s ease-in-out 2 both;
              }

              @keyframes calendarSwipeHintOverlay {
                0% {
                  opacity: 0;
                }
                8%,
                88% {
                  opacity: 1;
                }
                100% {
                  opacity: 0;
                }
              }

              @keyframes calendarSwipeHintHandMove {
                0%,
                100% {
                  left: 24%;
                  opacity: 0;
                  transform: translate3d(-50%, -50%, 0) scale(0.92);
                }
                10% {
                  left: 24%;
                  opacity: 1;
                  transform: translate3d(-50%, -50%, 0) scale(1);
                }
                78% {
                  left: 76%;
                  opacity: 1;
                  transform: translate3d(-50%, -50%, 0) scale(1);
                }
                92% {
                  left: 76%;
                  opacity: 0;
                  transform: translate3d(-50%, -50%, 0) scale(0.94);
                }
              }

              @keyframes calendarSwipeHintTouchRing {
                0%,
                12%,
                100% {
                  opacity: 0;
                  transform: scale(0.62);
                }
                22% {
                  opacity: 0.85;
                }
                46% {
                  opacity: 0;
                  transform: scale(1.15);
                }
              }

              @keyframes calendarSwipeHintTrail {
                0%,
                100% {
                  opacity: 0;
                  transform: translateX(-100%);
                }
                10% {
                  opacity: 1;
                  transform: translateX(-100%);
                }
                78% {
                  opacity: 1;
                  transform: translateX(100%);
                }
                92% {
                  opacity: 0;
                  transform: translateX(100%);
                }
              }

              @media (prefers-reduced-motion: reduce) {
                .calendar-swipe-hint {
                  animation-duration: 2.2s;
                }

                .calendar-swipe-hint__frame,
                .calendar-swipe-hint__trail::after,
                .calendar-swipe-hint__touch-ring {
                  animation-duration: 2.2s;
                  animation-iteration-count: 1;
                }
              }
            `}</style>
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-end justify-between gap-3 border-b-2 border-border pb-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Eventos del mes
            </p>
            {!isMonthContentPending && (
              <p className="text-[13px] text-ink-muted">
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
                const color = EVENT_TYPE_PLANNER_COLORS[event.eventType];
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
              <div className="mt-5 border-t border-border-line pt-4 mx-[-7px]">
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
