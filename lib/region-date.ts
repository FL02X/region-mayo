export const REGION_TIME_ZONE = "America/Hermosillo";

const numericDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: REGION_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const labelDateFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: REGION_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const labelDayMonthFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: REGION_TIME_ZONE,
  day: "numeric",
  month: "short",
});

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toPartMap(date: Date, formatter: Intl.DateTimeFormat) {
  return Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  ) as Record<string, string>;
}

export function getRegionCalendarParts(date: Date) {
  const numericParts = toPartMap(date, numericDateFormatter);
  const labelParts = toPartMap(date, labelDateFormatter);
  const dayMonthParts = toPartMap(date, labelDayMonthFormatter);

  return {
    year: Number(numericParts.year),
    month: Number(numericParts.month),
    day: Number(numericParts.day),
    weekday: capitalize(labelParts.weekday ?? ""),
    monthLabel: capitalize(dayMonthParts.month ?? ""),
  };
}

export function formatRegionEventDate(date: Date) {
  const parts = getRegionCalendarParts(date);
  return `${parts.weekday}, ${parts.day} ${parts.monthLabel} · ${parts.year}`;
}

export function formatRegionWeekdayDayMonth(date: Date) {
  const parts = getRegionCalendarParts(date);
  return `${parts.weekday}, ${parts.day} ${parts.monthLabel}`;
}

export function formatRegionDayMonth(date: Date) {
  const parts = getRegionCalendarParts(date);
  return `${parts.day} ${parts.monthLabel}`;
}

export function formatRegionLongDate(date: Date) {
  const formatter = new Intl.DateTimeFormat("es-MX", {
    timeZone: REGION_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return formatter.format(date);
}

export function formatRegionDateRange(start: Date, end: Date) {
  const startParts = getRegionCalendarParts(start);
  const endParts = getRegionCalendarParts(end);

  if (startParts.year === endParts.year && startParts.month === endParts.month) {
    return `${startParts.day} y ${endParts.day} ${startParts.monthLabel}`;
  }

  return `${startParts.day} ${startParts.monthLabel} hasta el ${endParts.day} ${endParts.monthLabel}`;
}

export function getRegionMonthStart(date: Date) {
  const parts = getRegionCalendarParts(date);
  return new Date(Date.UTC(parts.year, parts.month - 1, 1, 12));
}
