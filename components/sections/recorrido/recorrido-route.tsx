"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Newsreader } from "next/font/google";
import { MapPin } from "lucide-react";
import type { Event } from "@/lib/types";
import { getEventMapsUrl } from "@/lib/event-share-text";
import { REGION_TIME_ZONE, getRegionDateTime } from "@/lib/region-date";
import { useTime } from "@/lib/time-context";
import { getRegionDateKey } from "@/components/sections/home/countdown-section/countdown-utils";

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const recorridoWeekdayFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: REGION_TIME_ZONE,
  weekday: "long",
});

const recorridoDateFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: REGION_TIME_ZONE,
  day: "numeric",
  month: "long",
});

type RecorridoDay = {
  key: string;
  date: Date;
  events: Event[];
};

type RecorridoEventStatus = "finished" | "active" | "upcoming";
type TruckMode = "active" | "moving" | "sleeping";

const DISABLED_ROOT_COLOR = "#c8c3ba";
const DISABLED_BUD_COLOR = "#aaa49b";

// AJUSTE: reduce estos valores para acortar las ramas y acercar el texto al árbol; auméntalos para separarlo.
const MOBILE_BRANCH_LENGTH = "75px";
const DESKTOP_BRANCH_LENGTH = "72px";
// AJUSTE: aumenta este valor para pegar más el texto al árbol; redúcelo para devolverle espacio.
const TEXT_TREE_NUDGE = "4px";
const recorridoRouteStyle = {
  "--recorrido-mobile-branch-length": MOBILE_BRANCH_LENGTH,
  "--recorrido-desktop-branch-length": DESKTOP_BRANCH_LENGTH,
  "--recorrido-text-tree-nudge": TEXT_TREE_NUDGE,
} as CSSProperties;

const recorridoRootPalettes = [
  { root: "#9c7b57", bud: "#b98a3e" },
  { root: "#7c5c3e", bud: "#a15a3a" },
  { root: "#5b3f29", bud: "#3f7a4e" },
  { root: "#3b2a1c", bud: "#b98a3e" },
];

function formatRecorridoWeekday(date: Date) {
  return `${recorridoWeekdayFormatter.format(date)} | ${recorridoDateFormatter.format(date)}`.toUpperCase();
}

function formatRecorridoTime(time: string) {
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return time;

  let hour = Number(match[1]);
  const minutes = match[2] || "00";
  const period = match[3]?.toUpperCase();

  if (hour > (period ? 12 : 23) || Number(minutes) > 59) return time;

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return `${String(hour).padStart(2, "0")}:${minutes}`;
}

function formatRecorridoTimeRange(event: Event) {
  const schedule = Array.isArray(event.schedule) && event.schedule.length > 0
    ? [...event.schedule].sort((a, b) => a.date.getTime() - b.date.getTime())
    : [{ date: event.date, time: event.time }];
  const firstOccurrence = schedule[0];

  if (!firstOccurrence) return event.time;
  return firstOccurrence.endTime
    ? `${formatRecorridoTime(firstOccurrence.time)} - ${formatRecorridoTime(firstOccurrence.endTime)}`
    : formatRecorridoTime(firstOccurrence.time);
}

function getRecorridoEventTiming(event: Event) {
  const schedule = Array.isArray(event.schedule) && event.schedule.length > 0
    ? [...event.schedule].sort((a, b) => a.date.getTime() - b.date.getTime())
    : [{ date: event.date, time: event.time }];
  const occurrence = schedule[0];
  const start = occurrence?.date ?? event.date;
  const parsedEnd = occurrence?.endTime
    ? getRegionDateTime(getRegionDateKey(start), occurrence.endTime)
    : null;
  const end = parsedEnd && parsedEnd.getTime() >= start.getTime() ? parsedEnd : start;

  return { start, end };
}

function getRecorridoEventStatus(event: Event, now: Date): RecorridoEventStatus {
  const { start, end } = getRecorridoEventTiming(event);
  if (now.getTime() >= end.getTime()) return "finished";
  if (now.getTime() >= start.getTime()) return "active";
  return "upcoming";
}

function RecorridoStatusLabel({ status, isLeft, isNext, isRouteStarted }: { status: RecorridoEventStatus; isLeft: boolean; isNext: boolean; isRouteStarted: boolean }) {
  if (status === "active") {
    return (
      <span className={`mb-1.5 flex items-center gap-2 text-[0.88rem] font-bold uppercase tracking-[0.14em] text-[#3f7a4e] ${isLeft ? "md:justify-end" : ""}`}>
        <span className="relative flex h-3 w-3 items-center justify-center" aria-hidden="true">
          <span className="recorrido-active-pulse absolute h-2 w-2 rounded-full bg-[#3f7a4e]/65" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3f7a4e] shadow-[0_0_0_2px_rgba(63,122,78,0.2)]" />
        </span>
        ACTIVO
      </span>
    );
  }

  if (status !== "upcoming" || !isNext || !isRouteStarted) return null;

  /* return (
    <span className={`mb-1 flex ${isLeft ? "md:justify-end" : ""}`}>
      <span className="inline-flex items-center gap-2 border border-[#c9a96e]/50 bg-[#f5eddc] px-3 py-2 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-ink">
        <span className="h-1.5 w-1.5 rounded-full bg-[#9c7b36]" aria-hidden="true" />
        PRÓXIMO EVENTO
      </span>
    </span>
  ); */
}

function RecorridoBusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 6C1.89 6 1 6.89 1 8v7h2a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h2V8c0-1.11-.89-2-2-2H3Zm-.5 1.5h4V10h-4V7.5Zm5.5 0h4V10H8V7.5Zm5.5 0h4V10h-4V7.5Zm5.5 0h2.5V13L19 11V7.5ZM6 13.5A1.5 1.5 0 1 1 6 16.5a1.5 1.5 0 0 1 0-3Zm12 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
    </svg>
  );
}

function RecorridoTruckMarker({ mode }: { mode: TruckMode }) {
  return (
    <span className="pointer-events-none relative z-30 flex h-20 w-20 items-center justify-center" role="img" aria-label={mode === "sleeping" ? "Recorrido en pausa hasta el siguiente día" : "Posición actual del recorrido"}>
      <span className={mode === "moving" || mode === "active" ? "recorrido-truck-moving" : ""}>
        <RecorridoBusIcon className="h-16 w-16 text-brand drop-shadow-[0_3px_1px_rgba(33,63,99,0.3)]" />
      </span>
      {mode === "sleeping" && (
        <span className={`absolute -right-7 -top-7 h-12 w-12 font-bold italic text-[#3b2a1c] drop-shadow-[0_1px_0_rgba(255,247,230,0.9)] ${editorialFont.className}`} aria-hidden="true">
          <span className="recorrido-sleep-z absolute bottom-0 left-0 text-[17px]">Z</span>
          <span className="recorrido-sleep-z absolute bottom-3 left-3 text-[14px] [animation-delay:550ms]">Z</span>
          <span className="recorrido-sleep-z absolute bottom-7 left-6 text-[11px] [animation-delay:1100ms]">Z</span>
        </span>
      )}
    </span>
  );
}

function getRecorridoDays(events: Event[]): RecorridoDay[] {
  const days = new Map<string, RecorridoDay>();

  events.forEach((event) => {
    const key = getRegionDateKey(event.date);
    const day = days.get(key);

    if (day) {
      day.events.push(event);
      return;
    }

    days.set(key, { key, date: event.date, events: [event] });
  });

  return [...days.values()];
}

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function getTrunkPath(_seed: number, height: number) {
  return `M38 0 C30 ${height * 0.2}, 46 ${height * 0.38}, 42 ${height * 0.5} C37 ${height * 0.65}, 31 ${height * 0.78}, 38 ${height}`;
}

function getTrunkLeafAnchor(_seed: number, position: "upper" | "lower") {
  return position === "upper" ? 35 : 34;
}

function RootLeaf({
  color,
  rotation,
  side,
  anchorX,
}: {
  color: string;
  rotation: number;
  side: number;
  anchorX: number;
}) {
  return (
    <svg
      className="absolute h-[23px] w-[36px] transition-all duration-700 ease-out"
      viewBox="0 0 26 17"
      style={{
        left: `${(anchorX / 76) * 100}%`,
        transform: `translate(${side > 0 ? "0" : "-100%"}, -50%) rotate(${rotation}deg)`,
        transformOrigin: side > 0 ? "left center" : "right center",
      }}
      aria-hidden="true"
    >
      <path d="M2 9C7-2 20-2 24 9 20 20 7 20 2 9Z" fill={color} />
      <path d="M2 9H24" stroke="rgba(255,247,230,0.45)" strokeWidth="1" />
    </svg>
  );
}

export function RecorridoRoute({ events }: { events: Event[] }) {
  const dayRefs = useRef(new Map<string, HTMLDivElement>());
  const [grownDayKeys, setGrownDayKeys] = useState<Set<string>>(() => new Set());
  const { currentTime } = useTime();
  const orderedEvents = useMemo(
    () => [...events].sort((a, b) => a.date.getTime() - b.date.getTime()),
    [events],
  );
  const recorridoDays = useMemo(
    () => getRecorridoDays(orderedEvents),
    [orderedEvents],
  );
  const eventStatuses = useMemo(
    () => orderedEvents.map((event) => getRecorridoEventStatus(event, currentTime)),
    [currentTime, orderedEvents],
  );
  const isRouteNotStarted = orderedEvents.length > 0 && eventStatuses.every((status) => status === "upcoming");
  const isRouteEnded = orderedEvents.length > 0 && eventStatuses.every((status) => status === "finished");
  const revealTransition = isRouteEnded ? "" : "transition-all duration-700 ease-out";
  const branchRevealTransition = isRouteEnded ? "" : "transition-opacity delay-500 duration-700";
  const activeEventIndex = eventStatuses.indexOf("active");
  const nextEventIndex = eventStatuses.indexOf("upcoming");
  const previousEventIndex = nextEventIndex > 0 ? nextEventIndex - 1 : -1;
  const hasPreviousFinishedEvent = previousEventIndex >= 0 && eventStatuses[previousEventIndex] === "finished";
  const isSleepingBetweenDays = hasPreviousFinishedEvent
    && getRegionDateKey(orderedEvents[previousEventIndex].date) !== getRegionDateKey(orderedEvents[nextEventIndex].date);
  const movingAfterEventIndex = hasPreviousFinishedEvent && !isSleepingBetweenDays
    ? previousEventIndex
    : -1;
  const sleepingBeforeDayKey = isSleepingBetweenDays
    ? getRegionDateKey(orderedEvents[nextEventIndex].date)
    : null;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const dayKey = entry.target.getAttribute("data-recorrido-day-key");
          if (!dayKey) return;

          setGrownDayKeys((current) => {
            const dayIndex = recorridoDays.findIndex((day) => day.key === dayKey);
            const reachedDays = recorridoDays.slice(0, dayIndex + 1);
            if (reachedDays.every((day) => current.has(day.key))) return current;
            const next = new Set(current);
            reachedDays.forEach((day) => next.add(day.key));
            return next;
          });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.35, rootMargin: "0px 0px -10% 0px" },
    );

    dayRefs.current.forEach((day) => observer.observe(day));
    return () => observer.disconnect();
  }, [recorridoDays]);

  if (orderedEvents.length === 0) return null;

  return (
    <section
      id="recorrido-route"
      className="mx-auto mt-8 w-full max-w-[1080px] touch-pan-y pb-24 pt-3 md:pb-40"
      style={recorridoRouteStyle}
      aria-label="Ruta de actividades del Recorrido Regional 2026"
    >
      <style>{`
        @keyframes recorrido-truck-bob {
          0%, 49% { transform: translateY(-1.5px); }
          50%, 100% { transform: translateY(1.5px); }
        }
        @keyframes recorrido-active-pulse {
          0% { opacity: 0.9; transform: scale(0.75); }
          75%, 100% { opacity: 0; transform: scale(4.2); }
        }
        @keyframes recorrido-sleep-z {
          0%, 12%, 100% { opacity: 0; transform: translate(0, 3px) scale(0.9); }
          28%, 68% { opacity: 1; transform: translate(1px, -1px) scale(1); }
          88% { opacity: 0; transform: translate(5px, -7px) scale(1.06); }
        }
        .recorrido-truck-moving {
          display: inline-flex;
          animation: recorrido-truck-bob 620ms steps(2, end) infinite;
        }
        .recorrido-active-pulse {
          animation: recorrido-active-pulse 1.25s ease-out infinite;
        }
        .recorrido-sleep-z {
          animation: recorrido-sleep-z 2.1s ease-in-out infinite;
          opacity: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .recorrido-truck-moving, .recorrido-sleep-z, .recorrido-active-pulse { animation: none; }
          .recorrido-active-pulse { opacity: 0.35; transform: scale(1.5); }
          .recorrido-sleep-z:first-child { opacity: 0.9; }
        }
      `}</style>
      <div className="mb-10">
        <p className="text-[14px] font-bold uppercase tracking-[0.16em] text-brand">
          Ruta del recorrido
        </p>
        <p className={`mt-1 text-[28px] font-semibold tracking-tight text-ink ${editorialFont.className}`}>
          Nuestras raíces
        </p>
        {isRouteNotStarted && (
          <p className="mt-5 flex items-center gap-6 border border-brand/30 bg-brand/5 px-3 py-3 text-[16px] text-ink/75">
            <span className="ml-2 recorrido-truck-moving shrink-0" aria-hidden="true">
              <RecorridoBusIcon className="h-10 w-10 text-brand" />
            </span>
            <span>
              Una vez empezado el recorrido, la ruta se irá actualizando en <span className="text-brand">tiempo real</span>.
            </span>
          </p>
        )}
      </div>

      {recorridoDays.map((day, dayIndex) => {
        const dividerPalette = recorridoRootPalettes[dayIndex % recorridoRootPalettes.length];
        const dividerWidth = 13 + Math.min(dayIndex, 3) * 2;
        const dividerPath = getTrunkPath(dayIndex * 17 + 5, 320);
        const firstEventIndex = orderedEvents.indexOf(day.events[0]);
        const firstEventStatus = eventStatuses[firstEventIndex];
        const hasSleepingTruck = sleepingBeforeDayKey === day.key;
        const dividerProgress = isRouteNotStarted ? 1 : hasSleepingTruck ? 0.5 : firstEventStatus === "upcoming" ? 0 : 1;
        const dividerDash = dividerProgress === 1 ? "1 0" : `${dividerProgress} 1`;
        const isDayGrown = grownDayKeys.has(day.key);

        return (
          <div key={day.key}>
            <div id={hasSleepingTruck ? "recorrido-current-position" : undefined} className="relative grid h-20 grid-cols-[59px_1fr] items-center md:grid-cols-[1fr_64px_1fr]">
              <svg
                className="absolute top-0 left-[9px] h-full w-[46px] overflow-visible md:left-1/2 md:w-[46px] md:-translate-x-1/2"
                viewBox="0 0 76 320"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d={dividerPath} fill="none" stroke={DISABLED_ROOT_COLOR} strokeWidth={dividerWidth} strokeLinecap="round" />
                <path d={dividerPath} fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth={dividerWidth * 0.24} strokeLinecap="round" />
                {dividerProgress > 0 && <>
                  <path d={dividerPath} pathLength="1" fill="none" stroke={dividerPalette.root} strokeWidth={dividerWidth} strokeLinecap="round" strokeDasharray={dividerDash} style={{ strokeDashoffset: isRouteEnded || isDayGrown ? 0 : 1, transition: isRouteEnded ? "none" : "stroke-dashoffset 1500ms cubic-bezier(.2,.7,.2,1)" }} />
                  <path d={dividerPath} pathLength="1" fill="none" stroke="rgba(255,247,230,0.35)" strokeWidth={dividerWidth * 0.24} strokeLinecap="round" strokeDasharray={dividerDash} style={{ strokeDashoffset: isRouteEnded || isDayGrown ? 0 : 1, transition: isRouteEnded ? "none" : "stroke-dashoffset 1500ms cubic-bezier(.2,.7,.2,1)" }} />
                </>}
              </svg>
              <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#3b2a1c]/25 to-transparent" />
              {hasSleepingTruck && (
                <span className="absolute top-1/2 left-[32px] z-20 -translate-x-1/2 -translate-y-1/2 md:left-1/2">
                  <RecorridoTruckMarker mode="sleeping" />
                </span>
              )}
              <span className="relative col-start-2 justify-self-start border border-[#3b2a1c]/25 bg-paper px-3.5 py-1 text-[15px] font-bold uppercase tracking-[0.16em] md:col-start-2 md:justify-self-center md:whitespace-nowrap">
                {formatRecorridoWeekday(day.date)}
              </span>
            </div>

            {day.events.map((event) => {
              const eventIndex = orderedEvents.indexOf(event);
              const eventStatus = eventStatuses[eventIndex];
              const routeVisualStatus = isRouteNotStarted ? "finished" : eventStatus;
              const isLeft = eventIndex % 2 === 0;
              const isGrown = isRouteEnded || isDayGrown;
              const mapsUrl = getEventMapsUrl(event);
              const palette = recorridoRootPalettes[dayIndex % recorridoRootPalettes.length];
              const trunkWidth = 13 + Math.min(dayIndex, 3) * 2;
              const trunkPath = getTrunkPath(eventIndex * 7 + 1, 320);
              const leafOneSide = pseudoRandom(eventIndex * 7 + 41) > 0.5 ? 1 : -1;
              const leafTwoSide = -leafOneSide;
              const upperLeafAnchor = getTrunkLeafAnchor(eventIndex * 7 + 1, "upper");
              const lowerLeafAnchor = getTrunkLeafAnchor(eventIndex * 7 + 1, "lower");
              const upperLeafRotation = leafOneSide * 38 + Math.round((pseudoRandom(eventIndex * 7 + 21) - 0.5) * 24);
              const lowerLeafRotation = leafTwoSide * 38 + Math.round((pseudoRandom(eventIndex * 7 + 33) - 0.5) * 24);
              const traveledFraction = routeVisualStatus === "finished" ? 1 : routeVisualStatus === "active" ? 0.5 : 0;
              const traveledDash = traveledFraction === 1 ? "1 0" : `${traveledFraction} 1`;
              const branchColor = routeVisualStatus === "upcoming" ? DISABLED_ROOT_COLOR : palette.root;
              const upperLeafColor = routeVisualStatus === "upcoming" ? DISABLED_BUD_COLOR : palette.bud;
              const lowerLeafColor = routeVisualStatus === "finished" ? palette.bud : DISABLED_BUD_COLOR;
              const hasActiveTruck = activeEventIndex === eventIndex;
              const hasMovingTruck = movingAfterEventIndex === eventIndex;

              return (
                <div
                  key={event.id}
                  id={hasMovingTruck ? "recorrido-current-position" : undefined}
                  ref={eventIndex === firstEventIndex ? (node) => {
                    if (node) dayRefs.current.set(day.key, node);
                    else dayRefs.current.delete(day.key);
                  } : undefined}
                  data-recorrido-day-key={eventIndex === firstEventIndex ? day.key : undefined}
                  className="grid min-h-[208px] grid-cols-[64px_var(--recorrido-mobile-branch-length)_minmax(0,1fr)] items-center md:min-h-[210px] md:grid-cols-[minmax(0,1fr)_var(--recorrido-desktop-branch-length)_64px_var(--recorrido-desktop-branch-length)_minmax(0,1fr)]"
                >
                  <div className={`relative col-start-3 row-start-1 flex py-4 ${isLeft ? "justify-start md:col-start-1 md:justify-end" : "justify-start md:col-start-5"}`}>
                    <div id={hasActiveTruck ? "recorrido-current-position" : undefined} className={`relative right-[var(--recorrido-text-tree-nudge)] max-w-[320px] -translate-x-4 transform text-left md:-translate-x-2.5 ${revealTransition} ${isLeft ? "md:left-[var(--recorrido-text-tree-nudge)] md:right-auto md:text-right" : ""} ${isGrown ? "translate-y-0 opacity-100" : "translate-y-3.5 opacity-0"}`}>
                      <RecorridoStatusLabel status={eventStatus} isLeft={isLeft} isNext={nextEventIndex === eventIndex} isRouteStarted={!isRouteNotStarted} />
                      <span className={`mb-2 flex items-center gap-2 text-[0.88rem] font-medium uppercase tracking-[0.1em] text-foreground/70 ${isLeft ? "md:justify-end" : ""}`}>
                        {formatRecorridoTimeRange(event)}
                      </span>
                      <span className={`mb-3 block text-[1.52rem] font-semibold leading-tight text-ink ${editorialFont.className}`}>
                        {event.title}
                      </span>
                      {/* {event.city && (
                        <span className={`pt-0 mb-0 block text-[16px] italic font-bold text-ink uppercase ${editorialFont.className}`}>
                          {event.city}
                        </span>
                      )} */}
                      {event.location && <span className="mt-0 block text-sm text-foreground/60">{event.location}</span>}
                      {mapsUrl ? (
                        <a href={mapsUrl} target="_blank" rel="noreferrer" className={`mt-3 inline-flex min-h-9 items-center gap-2 border px-3 text-xs font-semibold hover:bg-brand hover:!text-white ${isLeft ? "md:ml-auto" : ""}`} style={{ borderColor: palette.root, color: palette.root }}>
                          <MapPin className="h-4 w-4" aria-hidden="true" />
                          VER UBICACION
                        </a>
                      ) : (
                        <span className={`mt-3 inline-flex min-h-9 items-center gap-2 border px-3 text-xs font-semibold opacity-60 ${isLeft ? "md:ml-auto" : ""}`} style={{ borderColor: palette.root, color: palette.root }}>
                          <MapPin className="h-4 w-4" aria-hidden="true" />
                          VER UBICACION
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative col-start-1 row-start-1 flex h-full justify-center overflow-visible md:col-start-3">
                    <svg className="block h-full w-[46px] overflow-visible md:w-[46px]" viewBox="0 0 76 320" preserveAspectRatio="none" aria-hidden="true">
                      <path d={trunkPath} pathLength="1" fill="none" stroke={DISABLED_ROOT_COLOR} strokeWidth={trunkWidth} strokeLinecap="round" strokeDasharray="1 0" style={{ strokeDashoffset: isGrown ? 0 : 1, transition: "stroke-dashoffset 1500ms cubic-bezier(.2,.7,.2,1)" }} />
                      <path d={trunkPath} pathLength="1" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth={trunkWidth * 0.24} strokeLinecap="round" strokeDasharray="1 0" style={{ strokeDashoffset: isGrown ? 0 : 1, transition: "stroke-dashoffset 1500ms cubic-bezier(.2,.7,.2,1)" }} />
                      {traveledFraction > 0 && <>
                        <path d={trunkPath} pathLength="1" fill="none" stroke={palette.root} strokeWidth={trunkWidth} strokeLinecap="round" strokeDasharray={traveledDash} style={{ strokeDashoffset: isGrown ? 0 : 1, transition: "stroke-dashoffset 1500ms cubic-bezier(.2,.7,.2,1)" }} />
                        <path d={trunkPath} pathLength="1" fill="none" stroke="rgba(255,247,230,0.35)" strokeWidth={trunkWidth * 0.24} strokeLinecap="round" strokeDasharray={traveledDash} style={{ strokeDashoffset: isGrown ? 0 : 1, transition: "stroke-dashoffset 1500ms cubic-bezier(.2,.7,.2,1)" }} />
                      </>}
                    </svg>
                    <div className={`pointer-events-none absolute top-1/4 left-1/2 h-[23px] w-[46px] -translate-x-1/2 md:w-[46px] ${revealTransition} ${isGrown ? "opacity-100" : "opacity-0"}`}>
                      <RootLeaf color={upperLeafColor} side={leafOneSide} anchorX={upperLeafAnchor} rotation={upperLeafRotation} />
                    </div>
                    <div className={`pointer-events-none absolute top-3/4 left-1/2 h-[23px] w-[46px] -translate-x-1/2 md:w-[46px] ${revealTransition} ${isGrown ? "opacity-100" : "opacity-0"}`}>
                      <RootLeaf color={lowerLeafColor} side={leafTwoSide} anchorX={lowerLeafAnchor} rotation={lowerLeafRotation} />
                    </div>
                    {hasActiveTruck && (
                      <span className="absolute top-1/2 left-1/2 z-30 -translate-x-1/2 -translate-y-[30%]">
                        <RecorridoTruckMarker mode="active" />
                      </span>
                    )}
                    {hasMovingTruck && (
                      <span className="absolute bottom-0 left-1/2 z-30 -translate-x-1/2 translate-y-1/2">
                        <RecorridoTruckMarker mode="moving" />
                      </span>
                    )}
                    <svg className={`pointer-events-none absolute top-1/2 left-1/2 h-[72px] w-[var(--recorrido-mobile-branch-length)] -translate-y-1/2 overflow-visible md:hidden ${branchRevealTransition} ${isGrown ? "opacity-100" : "opacity-0"}`} viewBox="0 0 130 60" preserveAspectRatio="none" aria-hidden="true">
                      <path d="M0 31C34 16 75 9 130 25 76 14 34 25 0 39Z" fill={branchColor} />
                      <path d="M50 22C66 9 82 5 100 7 81 8 67 14 50 25Z" fill={branchColor} />
                      <path d="M58 20C78 26 102 35 122 47 100 36 78 28 58 24Z" fill={branchColor} />
                    </svg>
                    <svg className={`pointer-events-none absolute top-1/2 hidden h-[72px] w-[var(--recorrido-desktop-branch-length)] -translate-y-1/2 overflow-visible md:block ${branchRevealTransition} ${isLeft ? "right-1/2" : "left-1/2"} ${isGrown ? "opacity-100" : "opacity-0"}`} viewBox="0 0 130 60" preserveAspectRatio="none" aria-hidden="true">
                      <path d={isLeft ? "M130 31C96 16 55 9 0 25 54 14 96 25 130 39Z" : "M0 31C34 16 75 9 130 25 76 14 34 25 0 39Z"} fill={branchColor} />
                      <path d={isLeft ? "M80 22C64 9 48 5 30 7 49 8 63 14 80 25Z" : "M50 22C66 9 82 5 100 7 81 8 67 14 50 25Z"} fill={branchColor} />
                      <path d={isLeft ? "M72 20C52 26 28 35 8 47 30 36 52 28 72 24Z" : "M58 20C78 26 102 35 122 47 100 36 78 28 58 24Z"} fill={branchColor} />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </section>
  );
}
