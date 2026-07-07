// Donde: countdown mobile de home. Viewports: mobile. Funcion: helpers de fecha, countdown, share y constantes visuales.
import {
  REGION_TIME_ZONE,
  formatRegionDateInput,
  getRegionCalendarParts,
  getRegionDateTime,
} from "@/lib/region-date";

export const CUSTOM_BANNER_ACCENT = "#e36600";
export const MOBILE_FLOATING_CARD_CLASS = "rounded-[2px]";
export const MOBILE_FLOATING_BORDER_CLASS = "rounded-[2px]";

export type CountdownOccurrence = {
  date: Date;
  time: string;
  note?: string;
};

export type CountdownDisplay = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isDisabled: boolean;
};

export type TimeUnit = {
  value: number;
  label: string;
};

const longDateFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: REGION_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

const shortWeekdayDateFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: REGION_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "long",
});

const shortMonthDateFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: REGION_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "short",
});

const shortWeekdayAndMonthDateFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: REGION_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});

const longDateFormatterLargeWeekdayName = new Intl.DateTimeFormat("es-MX", {
  timeZone: REGION_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

function capitalizeDateLabel(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatMobileCountdownDate(
  date: Date,
  {
    weekdayFormat = "long",
    monthFormat = "long",
  }: {
    weekdayFormat?: "long" | "short";
    monthFormat?: "long" | "short";
  } = {},
) {
  const formatter =
    weekdayFormat === "short" && monthFormat === "short"
      ? shortWeekdayAndMonthDateFormatter
      : weekdayFormat === "short"
        ? shortWeekdayDateFormatter
        : monthFormat === "short"
          ? shortMonthDateFormatter
          : longDateFormatter;
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  const weekday = capitalizeDateLabel(parts.weekday ?? "");
  const month = capitalizeDateLabel(parts.month ?? "");

  return `${weekday}, ${parts.day} ${month}`;
}

export function formatDesktopCountdownDate(date: Date) {
  const parts = Object.fromEntries(
    longDateFormatterLargeWeekdayName.formatToParts(date).map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  const weekday = capitalizeDateLabel(parts.weekday ?? "");
  const month = capitalizeDateLabel(parts.month ?? "");

  return `${weekday}, ${parts.day} ${month}`;
}

export function getRegionDateKey(date: Date) {
  const parts = getRegionCalendarParts(date);
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");

  return `${parts.year}-${month}-${day}`;
}

export function getRegionDayEndMs(date: Date) {
  const endOfDay = getRegionDateTime(formatRegionDateInput(date), "23:59");
  return endOfDay ? endOfDay.getTime() + 59_999 : date.getTime();
}

export function getCountdownDisplay(target: Date, now: Date): CountdownDisplay {
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const msPerSecond = 1000;
  const msPerMinute = msPerSecond * 60;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;

  return {
    days: Math.floor(diffMs / msPerDay),
    hours: Math.floor((diffMs % msPerDay) / msPerHour),
    minutes: Math.floor((diffMs % msPerHour) / msPerMinute),
    seconds: Math.floor((diffMs % msPerMinute) / msPerSecond),
    isDisabled: false,
  };
}

export function getTimeUnits(
  countdownDisplay: CountdownDisplay | null,
): TimeUnit[] {
  if (!countdownDisplay) return [];

  return [
    { value: countdownDisplay.days, label: "Días" },
    { value: countdownDisplay.hours, label: "Hrs" },
    { value: countdownDisplay.minutes, label: "Min" },
    { value: countdownDisplay.seconds, label: "Seg" },
  ];
}

export function canUseNativeShare() {
  if (typeof navigator === "undefined" || !("share" in navigator)) return false;

  const userAgentData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform =
    userAgentData.userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent;

  return /Android|iPhone|iPad|iPod/i.test(platform);
}
