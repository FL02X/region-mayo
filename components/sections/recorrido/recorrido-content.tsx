"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { Newsreader } from "next/font/google";
import { ChevronRight, ClipboardList, MapPin } from "lucide-react";
import type { Album, Event, RegionPresident, Templo } from "@/lib/types";
import { SectionNavBar } from "@/components/layout/album-section-nav-bar";
import { RegistrationModal } from "@/components/shared/registration-modal";
import { useTime } from "@/lib/time-context";
import { REGION_TIME_ZONE } from "@/lib/region-date";
import {
  getCountdownDisplay,
  getRegionDateKey,
  getRegionDayEndMs,
  getTimeUnits,
  MOBILE_FLOATING_BORDER_CLASS,
  type CountdownDisplay,
  type CountdownOccurrence,
} from "@/components/sections/home/countdown-section/countdown-utils";
import { FlipCountdownCell } from "@/components/sections/home/countdown-section/flip-countdown-cell";
import { getEventMapsUrl } from "@/lib/event-share-text";

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const recorridoDateFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: REGION_TIME_ZONE,
  day: "numeric",
  month: "long",
});

const recorridoWeekdayFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: REGION_TIME_ZONE,
  weekday: "long",
});

const recorridoBrandStyle = {
  "--brand": "var(--brand-green)",
  "--brand-hover": "var(--brand-green-hover)",
  "--brand-active": "var(--brand-green-active)",
  "--brand-soft": "var(--brand-green-soft)",
  "--brand-border": "var(--brand-green-border)",
  "--brand-text": "var(--brand-green-text)",
  "--border": "var(--brand-green-border)",
  "--color-brand": "var(--brand-green)",
  "--color-brand-hover": "var(--brand-green-hover)",
  "--color-brand-active": "var(--brand-green-active)",
  "--color-brand-soft": "var(--brand-green-soft)",
  "--color-brand-border": "var(--brand-green-border)",
  "--color-brand-text": "var(--brand-green-text)",
  "--color-border": "var(--brand-green-border)",
} as CSSProperties;

interface RecorridoContentProps {
  events: Event[];
  startDate: Date | null;
  endDate: Date | null;
  albums: Album[];
  templos: Templo[];
  regionPresident: RegionPresident | null;
}

function getEventSchedule(event: Event): CountdownOccurrence[] {
  const schedule =
    Array.isArray(event.schedule) && event.schedule.length > 0
      ? event.schedule
      : [{ date: event.date, time: event.time }];

  return [...schedule].sort((a, b) => a.date.getTime() - b.date.getTime());
}

function getNextRecorridoEvent(events: Event[], currentTime: Date) {
  const nowMs = currentTime.getTime();
  const currentDayKey = getRegionDateKey(currentTime);

  return (
    events
      .filter((event) => event.eventType === "recorrido")
      .map((event) => {
        const schedule = getEventSchedule(event);
        const nextCandidateMs = schedule.reduce<number | null>(
          (closestMs, occurrence) => {
            const occurrenceMs = occurrence.date.getTime();
            const candidateMs =
              occurrenceMs <= nowMs &&
              getRegionDateKey(occurrence.date) === currentDayKey
                ? getRegionDayEndMs(occurrence.date)
                : occurrenceMs;

            if (candidateMs < nowMs) return closestMs;
            if (closestMs === null || candidateMs < closestMs) return candidateMs;
            return closestMs;
          },
          null,
        );

        return nextCandidateMs === null
          ? null
          : { event, schedule, nextCandidateMs };
      })
      .filter(
        (
          item,
        ): item is {
          event: Event;
          schedule: CountdownOccurrence[];
          nextCandidateMs: number;
        } => item !== null,
      )
      .sort((a, b) => a.nextCandidateMs - b.nextCandidateMs)[0] ?? null
  );
}

function getRecorridoCountdownDisplay(
  schedule: CountdownOccurrence[],
  currentTime: Date,
): CountdownDisplay {
  const nowMs = currentTime.getTime();
  const firstOccurrence = schedule[0];
  const currentDayKey = getRegionDateKey(currentTime);
  const todayOccurrences = schedule.filter(
    (occurrence) => getRegionDateKey(occurrence.date) === currentDayKey,
  );
  const nextTodayOccurrence = todayOccurrences.find(
    (occurrence) => occurrence.date.getTime() > nowMs,
  );

  if (nowMs < firstOccurrence.date.getTime()) {
    return getCountdownDisplay(firstOccurrence.date, currentTime);
  }

  if (nextTodayOccurrence) {
    return getCountdownDisplay(nextTodayOccurrence.date, currentTime);
  }

  return {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isDisabled: true,
  };
}

function formatRecorridoDayMonth(date: Date) {
  const parts = Object.fromEntries(
    recorridoDateFormatter
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  return `${parts.day} de ${parts.month}`;
}

function formatRecorridoWeekday(date: Date) {
  return recorridoWeekdayFormatter.format(date).toUpperCase();
}

function formatRecorridoTimeRange(event: Event) {
  const [firstOccurrence] = getEventSchedule(event);
  if (!firstOccurrence) return event.time;

  return firstOccurrence.endTime
    ? `${firstOccurrence.time} - ${firstOccurrence.endTime}`
    : firstOccurrence.time;
}

type RecorridoDay = {
  key: string;
  date: Date;
  events: Event[];
};

const recorridoRootPalettes = [
  { root: "#9c7b57", bud: "#b98a3e", chipBackground: "#f1e4c8", chipText: "#7a5723" },
  { root: "#7c5c3e", bud: "#a15a3a", chipBackground: "#f0ddd1", chipText: "#7a3b22" },
  { root: "#5b3f29", bud: "#3f7a4e", chipBackground: "#dce9de", chipText: "#2e5c3a" },
  { root: "#3b2a1c", bud: "#b98a3e", chipBackground: "#f1e4c8", chipText: "#7a5723" },
];

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

function RecorridoRoute({ events }: { events: Event[] }) {
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
                <path
                  d={dividerPath}
                  fill="none"
                  stroke={dividerPalette.root}
                  strokeWidth={dividerWidth}
                  strokeLinecap="round"
                />
                <path
                  d={dividerPath}
                  fill="none"
                  stroke="rgba(255,247,230,0.35)"
                  strokeWidth={dividerWidth * 0.24}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#3b2a1c]/25 to-transparent" />
              <span className="relative col-start-2 justify-self-start border border-[#3b2a1c]/25 bg-paper px-3.5 py-1 text-[16px] text-foreground/80 font-bold uppercase tracking-[0.16em] md:col-start-2 md:justify-self-center">
                {formatRecorridoWeekday(day.date)}
              </span>
            </div>

          {day.events.map((event) => {
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
            const upperLeafRotation =
              leafOneSide * 38 + Math.round((pseudoRandom(eventIndex * 7 + 21) - 0.5) * 24);
            const lowerLeafRotation =
              leafTwoSide * 38 + Math.round((pseudoRandom(eventIndex * 7 + 33) - 0.5) * 24);

            return (
              <div
                key={event.id}
                ref={(node) => {
                  if (node) rowRefs.current.set(event.id, node);
                  else rowRefs.current.delete(event.id);
                }}
                data-recorrido-event-id={event.id}
                className="grid min-h-[178px] grid-cols-[64px_80px_minmax(0,1fr)] items-center md:min-h-[210px] md:grid-cols-[minmax(0,1fr)_72px_64px_72px_minmax(0,1fr)]"
              >
                <div
                  className={`relative col-start-3 row-start-1 flex ${
                    isLeft
                      ? "justify-start md:col-start-1 md:justify-end"
                      : "justify-start md:col-start-5"
                  }`}
                >
                  <div
                    className={`max-w-[320px] -translate-x-2.5 transform text-left transition-all duration-700 ease-out ${
                      isLeft ? "md:text-right" : ""
                    } ${isGrown ? "translate-y-0 opacity-100" : "translate-y-3.5 opacity-0"}`}
                  >
                    <span className={`mb-2 flex items-center gap-2 text-[0.88rem] font-medium uppercase tracking-[0.1em] text-foreground/70 ${isLeft ? "md:justify-end" : ""}`}>
                      {formatRecorridoTimeRange(event)}
                    </span>
                    <span className={`mb-3 block text-[1.32rem] font-semibold leading-tight text-ink ${editorialFont.className}`}>
                      {event.title}
                    </span>
                    {event.location && (
                      <span className="mt-1.5 block text-sm text-foreground/70">
                        {event.location}
                      </span>
                    )}
                    {mapsUrl ? (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-3 inline-flex min-h-9 items-center gap-2 border px-3 text-xs font-semibold ${
                          isLeft ? "md:ml-auto" : ""
                        }`}
                        style={{ borderColor: palette.root, color: palette.root }}
                      >
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        VER UBICACION
                      </a>
                    ) : (
                      <span
                        className={`mt-3 inline-flex min-h-9 items-center gap-2 border px-3 text-xs font-semibold opacity-60 ${
                        isLeft ? "md:ml-auto" : ""
                      }`}
                      style={{
                        borderColor: palette.root,
                        color: palette.root,
                      }}
                    >
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        VER UBICACION
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative col-start-1 row-start-1 flex h-full justify-center overflow-visible md:col-start-3">
                  <svg
                    className="block h-full w-[46px] overflow-visible md:w-[46px]"
                    viewBox="0 0 76 320"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d={trunkPath}
                      fill="none"
                      stroke={palette.root}
                      strokeWidth={trunkWidth}
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: 420,
                        strokeDashoffset: isGrown ? 0 : 420,
                        transition: "stroke-dashoffset 1500ms cubic-bezier(.2,.7,.2,1)",
                      }}
                    />
                    <path
                      d={trunkPath}
                      fill="none"
                      stroke="rgba(255,247,230,0.35)"
                      strokeWidth={trunkWidth * 0.24}
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: 420,
                        strokeDashoffset: isGrown ? 0 : 420,
                        transition: "stroke-dashoffset 1500ms cubic-bezier(.2,.7,.2,1)",
                      }}
                    />
                  </svg>
                  <div
                    className={`pointer-events-none absolute top-1/4 left-1/2 h-[23px] w-[46px] -translate-x-1/2 transition-all duration-700 ease-out md:w-[46px] ${
                      isGrown ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <RootLeaf
                      color={palette.bud}
                      side={leafOneSide}
                      anchorX={upperLeafAnchor}
                      rotation={upperLeafRotation}
                    />
                  </div>
                  <div
                    className={`pointer-events-none absolute top-3/4 left-1/2 h-[23px] w-[46px] -translate-x-1/2 transition-all duration-700 ease-out md:w-[46px] ${
                      isGrown ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <RootLeaf
                      color={palette.bud}
                      side={leafTwoSide}
                      anchorX={lowerLeafAnchor}
                      rotation={lowerLeafRotation}
                    />
                  </div>
                  <span
                    className={`absolute top-1/2 left-1/2 z-10 flex h-[34px] w-[34px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper shadow-[0_0_0_3px_rgba(59,42,28,0.18)] transition-all duration-700 ease-out ${
                      isGrown ? "scale-100 opacity-100" : "scale-[0.2] opacity-0"
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: palette.bud }} />
                  </span>
                  <svg
                    className={`pointer-events-none absolute top-1/2 left-[calc(50%+17px)] h-[72px] w-[80px] -translate-y-1/2 overflow-visible transition-opacity delay-500 duration-700 md:hidden ${
                      isGrown ? "opacity-100" : "opacity-0"
                    }`}
                    viewBox="0 0 130 60"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M0 31C34 16 75 9 130 25 76 14 34 25 0 39Z"
                      fill={palette.root}
                    />
                    <path
                      d="M50 22C66 9 82 5 100 7 81 8 67 14 50 25Z"
                      fill={palette.root}
                    />
                    <path
                      d="M58 20C78 26 102 35 122 47 100 36 78 28 58 24Z"
                      fill={palette.root}
                    />
                  </svg>
                  <svg
                    className={`pointer-events-none absolute top-1/2 hidden h-[72px] w-[72px] -translate-y-1/2 overflow-visible transition-opacity delay-500 duration-700 md:block ${
                      isLeft
                        ? "right-[calc(50%+17px)]"
                        : "left-[calc(50%+17px)]"
                    } ${isGrown ? "opacity-100" : "opacity-0"}`}
                    viewBox="0 0 130 60"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d={isLeft ? "M130 31C96 16 55 9 0 25 54 14 96 25 130 39Z" : "M0 31C34 16 75 9 130 25 76 14 34 25 0 39Z"}
                      fill={palette.root}
                    />
                    <path
                      d={isLeft ? "M80 22C64 9 48 5 30 7 49 8 63 14 80 25Z" : "M50 22C66 9 82 5 100 7 81 8 67 14 50 25Z"}
                      fill={palette.root}
                    />
                    <path
                      d={isLeft ? "M72 20C52 26 28 35 8 47 30 36 52 28 72 24Z" : "M58 20C78 26 102 35 122 47 100 36 78 28 58 24Z"}
                      fill={palette.root}
                    />
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

export function RecorridoContent({
  events,
  startDate,
  endDate,
  albums,
  templos,
  regionPresident,
}: RecorridoContentProps) {
  void albums;
  void templos;
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const { currentTime } = useTime();
  const nextRecorridoEvent = useMemo(
    () => getNextRecorridoEvent(events, currentTime),
    [events, currentTime],
  );
  const countdownDisplay = useMemo<CountdownDisplay | null>(() => {
    if (!nextRecorridoEvent || nextRecorridoEvent.schedule.length === 0) {
      return null;
    }

    return getRecorridoCountdownDisplay(
      nextRecorridoEvent.schedule,
      currentTime,
    );
  }, [nextRecorridoEvent, currentTime]);
  const countdownIsDisabled = countdownDisplay?.isDisabled ?? false;
  const countdownGridClassName = countdownIsDisabled
    ? "opacity-60 saturate-0"
    : "";
  const recorridoRegistrationEvent = nextRecorridoEvent?.event ?? null;
  const canOpenRegistration =
    !!recorridoRegistrationEvent &&
    recorridoRegistrationEvent.registrationEnabled !== false;

  const handleOpenRegistration = () => {
    if (!canOpenRegistration || !recorridoRegistrationEvent) return;

    setSelectedEvent(recorridoRegistrationEvent);
    setIsRegisterModalOpen(true);
  };

  const handleCloseRegistration = () => {
    setIsRegisterModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div
      id="main-content"
      className="relative w-full max-w-full overflow-x-hidden overscroll-x-none bg-[#f1f1f1] md:overflow-x-visible"
      style={recorridoBrandStyle}
    >
      <SectionNavBar
        currentLabel="Recorrido Regional 2026"
        parentHref="/"
        parentLabel="Inicio"
      />
      <div className="desktop-content-pane mx-auto min-h-screen w-full max-w-[1150px] overflow-x-hidden border-border bg-paper px-4 py-8 pb-16 md:px-4 pt-[32px] focus:outline-none md:overflow-x-visible md:border-x md:px-0 md:pt-[44px]">
        <div className="-mx-5 -mt-[32px] mb-6 h-[210px] overflow-hidden md:-mx-4 md:-mt-[44px] md:h-[520px]">
          <div className="relative h-full w-full border-b">
            <Image
              src="/images/recorrido5.jpg"
              alt="Recorrido Regional 2026"
              fill
              priority
              sizes="(max-width: 767px) 100vw, 1150px"
              className="object-cover object-center"
            />
          </div>
        </div>
        <div className="max-w mx-auto md:px-12 lg:px-62 md:pt-5">
          <p className="text-[20px] font-semibold tracking-tight text-brand">
            Lo invitamos a nuestro:
          </p>
          <p
            className={`mt-5 text-[3.425rem] md:text-[1.825rem] font-semibold tracking-tight leading-14 md:leading-normal text-ink ${editorialFont.className}`}
          >
            <span className="block md:inline">Recorrido</span>
            <span className="hidden md:inline"> </span>
            <span className="block md:inline">Regional</span>
            <span className="hidden md:inline"> </span>
            <span className="block md:inline">2026</span>
          </p>
          {startDate && endDate && (
            <p className="mt-6.5 text-sm">
              <span className="text-bold">Fecha: </span>
              <span className="text-brand">{formatRecorridoDayMonth(startDate)}</span>
              <span className="text-normal">, hasta el </span>
              <span className="text-brand">{formatRecorridoDayMonth(endDate)}</span>
            </p>
          )}
          {countdownDisplay && (
            <div className="my-5 border border-border bg-paper-highlight">
              <div
                className={`grid grid-cols-4 border divide-x divide-border ${MOBILE_FLOATING_BORDER_CLASS} ${countdownGridClassName}`}
                role="timer"
                aria-label="Tiempo restante para el recorrido"
                aria-disabled={countdownIsDisabled}
              >
                {getTimeUnits(countdownDisplay).map((unit) => (
                  <FlipCountdownCell
                    key={unit.label}
                    value={unit.value}
                    label={unit.label}
                    editorialFontClassName={editorialFont.className}
                    disabled={countdownIsDisabled}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="mt-0 w-full px-0 pt-3 pb-7">
            <p className="mt-2 text-[14px] font-bold uppercase tracking-[0.16em] text-brand">
              TEMA
            </p>
            <p className={`mt-1 text-[24px] font-semibold tracking-tight leading-snug text-ink ${editorialFont.className}`}>
              Conociendo nuestras raices
            </p>
            <p className="mt-4 text-sm font-medium text-ink">Hebreos 13:7</p>
            <p className="mt-2 text-[16px] italic leading-relaxed text-foreground/80">
              <span className="mr-1 align-top text-2xl leading-none text-foreground/35">
                &ldquo;
              </span>
              Acordaos de vuestros pastores, que os hablaron la palabra de Dios;
              considerad cual haya sido el resultado de su conducta, e imitad su fe.
              <span className="ml-1 align-bottom text-2xl leading-none text-foreground/35">
                &rdquo;
              </span>
            </p>
          </div>
          <div className="mt-4 w-full border border-border bg-paper-dark px-2 py-4">
            <div className="flex items-center gap-4">
              <div className="flex shrink-0 items-center justify-center">
                <ClipboardList
                  className="h-12 w-12 text-foreground/75"
                  strokeWidth={1.35}
                  aria-hidden="true"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                {/* <p
                  className={`text-[1.1rem] font-semibold tracking-tight text-ink ${editorialFont.className}`}
                >
                  Registre su asistencia
                </p> */}
                <button
                  type="button"
                  onClick={handleOpenRegistration}
                  disabled={!canOpenRegistration}
                  className="inline-flex min-h-10 uppercase items-center justify-center gap-1.5 bg-brand px-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover active:bg-brand-hover/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-brand"
                >
                  Registrar asistencia
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>            
            </div>
          </div>
          <div className="mt-8 h-px w-full bg-brand" aria-hidden="true" />
          <RecorridoRoute events={events} />
        </div>
      </div>
      {selectedEvent && (
        <RegistrationModal
          event={selectedEvent}
          isOpen={isRegisterModalOpen}
          onClose={handleCloseRegistration}
          regionPresident={regionPresident}
        />
      )}
    </div>
  );
}
