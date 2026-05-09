import type { TemploSchedule, TemploServiceSchedule, TemploWeekday } from "@/lib/types";

const DAY_LABELS: Record<TemploWeekday, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

const DAY_ORDER: Record<TemploWeekday, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

const DAY_LABELS_SHORT: Record<TemploWeekday, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mié",
  thursday: "Jue",
  friday: "Vie",
  saturday: "Sáb",
  sunday: "Dom",
};

export type TempleAvailabilityTone = "open" | "closing-soon" | "closed" | "opening-soon";

export interface TempleAvailabilityResult {
  tone: TempleAvailabilityTone;
  title: string;
  subtitle?: string;
  iconLabel?: string;
}

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;

function normalizeTimeInput(time: string): string {
  const raw = String(time || "").trim();
  if (!raw) return "";

  // Accept already normalized HH:MM
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(raw)) {
    return raw;
  }

  // Accept "6:30 PM", "7PM", "10:00AM"
  const m = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!m) return raw;

  let hour = Number(m[1]);
  const minutes = Number(m[2] || "0");
  const ampm = m[3]?.toUpperCase();

  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  if (Number.isNaN(hour) || Number.isNaN(minutes)) return raw;
  if (hour < 0 || hour > 23 || minutes < 0 || minutes > 59) return raw;

  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getLocalTimeParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const weekday = get("weekday").toLowerCase();
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));

  const weekdayToIndex: Record<string, TemploWeekday> = {
    monday: "monday",
    tuesday: "tuesday",
    wednesday: "wednesday",
    thursday: "thursday",
    friday: "friday",
    saturday: "saturday",
    sunday: "sunday",
  };

  return {
    weekday: weekdayToIndex[weekday] || "sunday",
    minutesOfDay: hour * 60 + minute,
  };
}

function timeToMinutes(time: string): number | null {
  const normalized = normalizeTimeInput(time);
  const m = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function formatOpeningPhrase(day: TemploWeekday, startTime: string, referenceDay: TemploWeekday) {
  const dayDiff = (DAY_ORDER[day] - DAY_ORDER[referenceDay] + 7) % 7;
  const formattedTime = formatScheduleTimeForUi(startTime);

  if (dayDiff === 0) return `hoy a las ${formattedTime}`;
  if (dayDiff === 1) return `mañana a las ${formattedTime}`;
  return `el ${DAY_LABELS[day].toLowerCase()} a las ${formattedTime}`;
}

function formatRemainingHours(minutesUntil: number): string {
  const hours = Math.floor(minutesUntil / 60);
  const minutes = minutesUntil % 60;

  if (minutes === 0) {
    return `Faltan ${hours} ${hours === 1 ? "hora" : "horas"}`;
  }

  return `Faltan ${hours} ${hours === 1 ? "hora" : "horas"} ${minutes} min`;
}

export function getTempleAvailability(
  schedule?: TemploSchedule,
  now: Date = new Date(),
): TempleAvailabilityResult | null {
  if (!schedule || !Array.isArray(schedule.services) || schedule.services.length === 0) {
    return null;
  }

  const timeZone = schedule.timezone || "America/Hermosillo";
  const local = getLocalTimeParts(now, timeZone);
  const services = getSortedTempleServices(schedule);

  const currentWeekMinutes = (DAY_ORDER[local.weekday] - 1) * MINUTES_PER_DAY + local.minutesOfDay;

  let inProgress: { service: TemploServiceSchedule; endMinutes: number } | null = null;
  let nextService:
    | { service: TemploServiceSchedule; deltaMinutes: number }
    | null = null;

  for (const service of services) {
    const start = timeToMinutes(service.startTime);
    const end = service.endTime ? timeToMinutes(service.endTime) : null;
    if (start == null || end == null) continue;

    const serviceDay = DAY_ORDER[service.day] - 1;
    const baseStart = serviceDay * MINUTES_PER_DAY + start;
    const baseEnd = serviceDay * MINUTES_PER_DAY + end;

    // Evaluate previous/current/next week windows so we can handle weekly wrap-around.
    for (const weekOffset of [-MINUTES_PER_WEEK, 0, MINUTES_PER_WEEK]) {
      const shiftedStart = baseStart + weekOffset;
      const shiftedEnd = baseEnd + weekOffset;

      if (currentWeekMinutes >= shiftedStart && currentWeekMinutes < shiftedEnd) {
        const endMinutes = shiftedEnd - currentWeekMinutes;
        inProgress = { service, endMinutes };
      }

      if (shiftedStart >= currentWeekMinutes) {
        const deltaMinutes = shiftedStart - currentWeekMinutes;
        if (!nextService || deltaMinutes < nextService.deltaMinutes) {
          nextService = { service, deltaMinutes };
        }
      }
    }
  }

  if (inProgress) {
    return {
      tone: "open",
      title: "Culto en progreso",
      subtitle: `Termina a las ${formatScheduleTimeForUi(inProgress.service.endTime || "")}`,
    };
  }

  if (nextService) {
    if (nextService.deltaMinutes < 60) {
      return {
        tone: "opening-soon",
        title: `Faltan ${nextService.deltaMinutes} minutos`,
        subtitle: `A las ${formatScheduleTimeForUi(nextService.service.startTime)}`,
      };
    }

    if (nextService.deltaMinutes < 12 * 60) {
      return {
        tone: "opening-soon",
        title: formatRemainingHours(nextService.deltaMinutes),
        subtitle: `A las ${formatScheduleTimeForUi(nextService.service.startTime)}`,
      };
    }

    return {
      tone: "closed",
      title: "Cerrado",
      subtitle: `Abre ${formatOpeningPhrase(nextService.service.day, nextService.service.startTime, local.weekday)}`,
    };
  }

  return null;
}

export function formatScheduleTimeForUi(time: string): string {
  const normalized = normalizeTimeInput(time);
  const m = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return time;

  const hour24 = Number(m[1]);
  const minute = m[2];
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${hour12}:${minute} ${suffix}`;
}

export function getSortedTempleServices(schedule?: TemploSchedule): TemploServiceSchedule[] {
  const services = Array.isArray(schedule?.services) ? schedule.services : [];

  return [...services].sort((a, b) => {
    const dayA = DAY_ORDER[a.day] || 99;
    const dayB = DAY_ORDER[b.day] || 99;

    if (dayA !== dayB) return dayA - dayB;

    const timeA = normalizeTimeInput(a.startTime);
    const timeB = normalizeTimeInput(b.startTime);

    return timeA.localeCompare(timeB);
  });
}

export function formatTempleServiceLine(service: TemploServiceSchedule): string {
  const dayLabel = DAY_LABELS[service.day] || service.day;
  const start = formatScheduleTimeForUi(service.startTime);
  const end = service.endTime ? formatScheduleTimeForUi(service.endTime) : undefined;

  if (end) return `${dayLabel}: ${start} - ${end}`;
  return `${dayLabel}: ${start}`;
}

// Wiring placeholder for future "Abierto/Cerrado" feature.
// This intentionally does not decide availability yet.
export function getTempleAvailabilityWireData(schedule?: TemploSchedule) {
  if (!schedule || !Array.isArray(schedule.services) || schedule.services.length === 0) {
    return null;
  }

  return {
    timezone: schedule.timezone || "America/Hermosillo",
    services: getSortedTempleServices(schedule),
  };
}
