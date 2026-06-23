// Donde: hero desktop de home. Viewports: desktop. Funcion: helpers de fechas, countdown y colores del spotlight.
import {
  formatRegionDateInput,
  getRegionCalendarParts,
  getRegionDateTime,
} from "@/lib/region-date";

export const CUSTOM_BANNER_ACCENT = "#e36600";
export const CUSTOM_BANNER_CTA = "#e98432";

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

export function getRegionDateKey(date: Date) {
  const parts = getRegionCalendarParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
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
