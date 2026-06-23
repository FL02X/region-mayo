// Donde: calendario de home y planner mensual mobile. Viewports: desktop y mobile. Funcion: helpers de meses, fechas regionales, relevancia y precarga.
import {
  formatRegionDateInput,
  formatRegionDateRange,
  formatRegionDayMonth,
  getRegionCalendarParts,
  getRegionDateTime,
  getRegionMonthStart,
} from "@/lib/region-date";
import type { Event } from "@/lib/types";

export function getInitialCalendarMonth(events: Event[], nowMs?: number) {
  const referenceTime = nowMs ?? Date.now();
  const referenceDate = new Date(referenceTime);
  const nextEvent = [...events]
    .filter(
      (event) => getRelevantEventEndTime(event, referenceDate) >= referenceTime,
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

  return getRegionMonthStart(nextEvent?.date ?? new Date(referenceTime));
}

export function getCalendarMonthByOffset(month: Date, offset: number) {
  const parts = getRegionCalendarParts(month);
  return getRegionMonthStart(
    new Date(Date.UTC(parts.year, parts.month - 1 + offset, 1, 12)),
  );
}

export function getMonthNumber(date: Date) {
  const parts = getRegionCalendarParts(date);
  return parts.year * 12 + (parts.month - 1);
}

export function getEarlierMonth(first: Date, second: Date) {
  return getMonthNumber(first) <= getMonthNumber(second) ? first : second;
}

export function getLaterMonth(first: Date, second: Date) {
  return getMonthNumber(first) >= getMonthNumber(second) ? first : second;
}

export function getMonthsInRange(startMonth: Date, endMonth: Date) {
  const count = getMonthNumber(endMonth) - getMonthNumber(startMonth) + 1;

  return Array.from({ length: Math.max(1, count) }, (_, index) =>
    getCalendarMonthByOffset(startMonth, index),
  );
}

export function findMonthIndex(months: Date[], targetMonth: Date) {
  const targetKey = getRegionMonthKey(targetMonth);
  return months.findIndex((month) => getRegionMonthKey(month) === targetKey);
}

export function getRegionDateKey(date: Date) {
  const parts = getRegionCalendarParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function getRegionMonthKey(date: Date) {
  const parts = getRegionCalendarParts(date);
  return `${parts.year}-${parts.month}`;
}

export function getEventEndDate(event: Event) {
  const scheduleEndDate =
    Array.isArray(event.schedule) && event.schedule.length > 0
      ? event.schedule[event.schedule.length - 1]?.date
      : undefined;

  return event.endDate ?? scheduleEndDate ?? event.date;
}

export function getRegionDayEndMs(date: Date) {
  const endOfDay = getRegionDateTime(formatRegionDateInput(date), "23:59");
  return endOfDay ? endOfDay.getTime() + 59_999 : date.getTime();
}

export function getRelevantEventEndTime(event: Event, referenceDate = new Date()) {
  const endDate = getEventEndDate(event);

  if (getRegionDateKey(endDate) === getRegionDateKey(referenceDate)) {
    return getRegionDayEndMs(endDate);
  }

  return endDate.getTime();
}

export function getMostRelevantEvent(events: Event[]) {
  const now = new Date();
  const nowMs = now.getTime();

  return (
    events.find((event) => getRelevantEventEndTime(event, now) >= nowMs) ??
    events[0] ??
    null
  );
}

export function getEventDateRangeLabel(event: Event) {
  const endDate = getEventEndDate(event);

  if (getRegionDateKey(event.date) === getRegionDateKey(endDate)) {
    return formatRegionDayMonth(event.date);
  }

  return formatRegionDateRange(event.date, endDate);
}

export function getPlannerMonthCells(month: Date) {
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

export function getCachedPlannerMonthCells(month: Date) {
  const key = getRegionMonthKey(month);
  const cached = plannerCellsCache.get(key);

  if (cached) return cached;

  const cells = getPlannerMonthCells(month);
  plannerCellsCache.set(key, cells);
  return cells;
}

export function getEventPlannerDates(event: Event) {
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

export function canPreloadEventThumbnails() {
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
