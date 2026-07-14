"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Newsreader } from "next/font/google";
import { MapPin } from "lucide-react";
import type { Event } from "@/lib/types";
import { getEventMapsUrl } from "@/lib/event-share-text";
import { REGION_TIME_ZONE } from "@/lib/region-date";
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
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const [grownEventIds, setGrownEventIds] = useState<Set<string>>(() => new Set());
  const orderedEvents = useMemo(
    () => [...events].sort((a, b) => a.date.getTime() - b.date.getTime()),
    [events],
  );
  const recorridoDays = useMemo(
    () => getRecorridoDays(orderedEvents),
    [orderedEvents],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const eventId = entry.target.getAttribute("data-recorrido-event-id");
          if (!eventId) return;

          setGrownEventIds((current) => {
            if (current.has(eventId)) return current;
            const next = new Set(current);
            next.add(eventId);
            return next;
          });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.35, rootMargin: "0px 0px -10% 0px" },
    );

    rowRefs.current.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, [orderedEvents]);

  if (orderedEvents.length === 0) return null;

  return (
    <section
      className="mx-auto mt-8 w-full max-w-[1080px] touch-pan-y pb-24 pt-3 md:pb-40"
      aria-label="Ruta de actividades del Recorrido Regional 2026"
    >
      <div className="mb-7">
        <p className="text-[14px] font-bold uppercase tracking-[0.16em] text-brand">
          Ruta del recorrido
        </p>
        <p className={`mt-1 text-[28px] font-semibold tracking-tight text-ink ${editorialFont.className}`}>
          Nuestras raíces
        </p>
      </div>

      {recorridoDays.map((day, dayIndex) => {
        const dividerPalette = recorridoRootPalettes[dayIndex % recorridoRootPalettes.length];
        const dividerWidth = 13 + Math.min(dayIndex, 3) * 2;
        const dividerPath = getTrunkPath(dayIndex * 17 + 5, 320);

        return (
          <div key={day.key}>
            <div className="relative grid h-20 grid-cols-[64px_1fr] items-center md:grid-cols-[1fr_64px_1fr]">
              <svg
                className="absolute top-0 left-[9px] h-full w-[46px] overflow-visible md:left-1/2 md:w-[46px] md:-translate-x-1/2"
                viewBox="0 0 76 320"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d={dividerPath} fill="none" stroke={dividerPalette.root} strokeWidth={dividerWidth} strokeLinecap="round" />
                <path d={dividerPath} fill="none" stroke="rgba(255,247,230,0.35)" strokeWidth={dividerWidth * 0.24} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#3b2a1c]/25 to-transparent" />
              <span className="relative col-start-2 justify-self-start border border-[#3b2a1c]/25 bg-paper px-3.5 py-1 text-[14px] text-foreground/80 font-bold uppercase tracking-[0.16em] md:col-start-2 md:justify-self-center md:whitespace-nowrap">
                {formatRecorridoWeekday(day.date)}
              </span>
            </div>

            {day.events.map((event, dayEventIndex) => {
              const eventIndex = orderedEvents.indexOf(event);
              const isLeft = eventIndex % 2 === 0;
              const isGrown = grownEventIds.has(event.id);
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

              return (
                <div
                  key={event.id}
                  ref={(node) => {
                    if (node) rowRefs.current.set(event.id, node);
                    else rowRefs.current.delete(event.id);
                  }}
                  data-recorrido-event-id={event.id}
                  className="grid min-h-[208px] grid-cols-[64px_80px_minmax(0,1fr)] items-center md:min-h-[210px] md:grid-cols-[minmax(0,1fr)_72px_64px_72px_minmax(0,1fr)]"
                >
                  <div className={`relative col-start-3 row-start-1 flex ${isLeft ? "justify-start md:col-start-1 md:justify-end" : "justify-start md:col-start-5"} ${dayEventIndex > 0 ? "pt-5" : ""}`}>
                    <div className={`max-w-[320px] -translate-x-2.5 transform text-left transition-all duration-700 ease-out ${isLeft ? "md:text-right" : ""} ${isGrown ? "translate-y-0 opacity-100" : "translate-y-3.5 opacity-0"}`}>
                      <span className={`mb-2 flex items-center gap-2 text-[0.88rem] font-medium uppercase tracking-[0.1em] text-foreground/70 ${isLeft ? "md:justify-end" : ""}`}>
                        {formatRecorridoTimeRange(event)}
                      </span>
                      <span className={`mb-3 block text-[1.52rem] font-semibold leading-tight text-ink ${editorialFont.className}`}>
                        {event.title}
                      </span>
                      {event.city && (
                        <span className={`pt-0 mb-0 block text-[16px] italic font-bold text-ink uppercase ${editorialFont.className}`}>
                          {event.city}
                        </span>
                      )}
                      {event.location && <span className="mt-0 block text-sm text-foreground/60">{event.location}</span>}
                      {mapsUrl ? (
                        <a href={mapsUrl} target="_blank" rel="noreferrer" className={`mt-3 inline-flex min-h-9 items-center gap-2 border px-3 text-xs font-semibold ${isLeft ? "md:ml-auto" : ""}`} style={{ borderColor: palette.root, color: palette.root }}>
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
                      <path d={trunkPath} fill="none" stroke={palette.root} strokeWidth={trunkWidth} strokeLinecap="round" style={{ strokeDasharray: 420, strokeDashoffset: isGrown ? 0 : 420, transition: "stroke-dashoffset 1500ms cubic-bezier(.2,.7,.2,1)" }} />
                      <path d={trunkPath} fill="none" stroke="rgba(255,247,230,0.35)" strokeWidth={trunkWidth * 0.24} strokeLinecap="round" style={{ strokeDasharray: 420, strokeDashoffset: isGrown ? 0 : 420, transition: "stroke-dashoffset 1500ms cubic-bezier(.2,.7,.2,1)" }} />
                    </svg>
                    <div className={`pointer-events-none absolute top-1/4 left-1/2 h-[23px] w-[46px] -translate-x-1/2 transition-all duration-700 ease-out md:w-[46px] ${isGrown ? "opacity-100" : "opacity-0"}`}>
                      <RootLeaf color={palette.bud} side={leafOneSide} anchorX={upperLeafAnchor} rotation={upperLeafRotation} />
                    </div>
                    <div className={`pointer-events-none absolute top-3/4 left-1/2 h-[23px] w-[46px] -translate-x-1/2 transition-all duration-700 ease-out md:w-[46px] ${isGrown ? "opacity-100" : "opacity-0"}`}>
                      <RootLeaf color={palette.bud} side={leafTwoSide} anchorX={lowerLeafAnchor} rotation={lowerLeafRotation} />
                    </div>
                    <span className={`absolute top-1/2 left-1/2 z-10 flex h-[34px] w-[34px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper shadow-[0_0_0_3px_rgba(59,42,28,0.18)] transition-all duration-700 ease-out ${isGrown ? "scale-100 opacity-100" : "scale-[0.2] opacity-0"}`}>
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: palette.bud }} />
                    </span>
                    <svg className={`pointer-events-none absolute top-1/2 left-[calc(50%+17px)] h-[72px] w-[80px] -translate-y-1/2 overflow-visible transition-opacity delay-500 duration-700 md:hidden ${isGrown ? "opacity-100" : "opacity-0"}`} viewBox="0 0 130 60" preserveAspectRatio="none" aria-hidden="true">
                      <path d="M0 31C34 16 75 9 130 25 76 14 34 25 0 39Z" fill={palette.root} />
                      <path d="M50 22C66 9 82 5 100 7 81 8 67 14 50 25Z" fill={palette.root} />
                      <path d="M58 20C78 26 102 35 122 47 100 36 78 28 58 24Z" fill={palette.root} />
                    </svg>
                    <svg className={`pointer-events-none absolute top-1/2 hidden h-[72px] w-[72px] -translate-y-1/2 overflow-visible transition-opacity delay-500 duration-700 md:block ${isLeft ? "right-[calc(50%+17px)]" : "left-[calc(50%+17px)]"} ${isGrown ? "opacity-100" : "opacity-0"}`} viewBox="0 0 130 60" preserveAspectRatio="none" aria-hidden="true">
                      <path d={isLeft ? "M130 31C96 16 55 9 0 25 54 14 96 25 130 39Z" : "M0 31C34 16 75 9 130 25 76 14 34 25 0 39Z"} fill={palette.root} />
                      <path d={isLeft ? "M80 22C64 9 48 5 30 7 49 8 63 14 80 25Z" : "M50 22C66 9 82 5 100 7 81 8 67 14 50 25Z"} fill={palette.root} />
                      <path d={isLeft ? "M72 20C52 26 28 35 8 47 30 36 52 28 72 24Z" : "M58 20C78 26 102 35 122 47 100 36 78 28 58 24Z"} fill={palette.root} />
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
