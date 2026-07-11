"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import { Newsreader } from "next/font/google";
import { ChevronRight, ClipboardList } from "lucide-react";
import type { Album, Event, Product, RegionPresident, Templo } from "@/lib/types";
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
import { RecorridoRoute } from "./recorrido-route";
import { RecorridoProductCards } from "./recorrido-product-cards";

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
  products: Product[];
  startDate: Date | null;
  endDate: Date | null;
  albums: Album[];
  templos: Templo[];
  regionPresident: RegionPresident | null;
  regionTreasurer: RegionPresident | null;
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

  return { days: 0, hours: 0, minutes: 0, seconds: 0, isDisabled: true };
}

function formatRecorridoDayMonth(date: Date) {
  const parts = Object.fromEntries(
    recorridoDateFormatter
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  return `${parts.day} de ${parts.month}`;
}

export function RecorridoContent({
  events,
  products,
  startDate,
  endDate,
  albums,
  templos,
  regionPresident,
  regionTreasurer,
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
    if (!nextRecorridoEvent || nextRecorridoEvent.schedule.length === 0) return null;

    return getRecorridoCountdownDisplay(nextRecorridoEvent.schedule, currentTime);
  }, [nextRecorridoEvent, currentTime]);
  const countdownIsDisabled = countdownDisplay?.isDisabled ?? false;
  const countdownGridClassName = countdownIsDisabled ? "opacity-60 saturate-0" : "";
  const recorridoRegistrationEvent = nextRecorridoEvent
    ? { ...nextRecorridoEvent.event, title: "Recorrido Mayo 2026" }
    : null;
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
      <SectionNavBar currentLabel="Recorrido Regional 2026" parentHref="/" parentLabel="Inicio" />
      <div className="desktop-content-pane mx-auto min-h-screen w-full max-w-[1150px] overflow-x-hidden border-border bg-paper px-4 py-8 pb-16 md:px-4 pt-[32px] focus:outline-none md:overflow-x-visible md:border-x md:px-0 md:pt-[44px]">
        <div className="-mx-5 -mt-[32px] mb-6 h-[210px] overflow-hidden md:-mx-4 md:-mt-[44px] md:h-[520px]">
          <div className="relative h-full w-full border-b">
            <Image src="/images/recorrido5.jpg" alt="Recorrido Regional 2026" fill priority quality={82} sizes="(max-width: 767px) 100vw, 1150px" className="object-cover object-center" />
          </div>
        </div>
        <div className="max-w mx-auto md:px-12 lg:px-62 md:pt-5">
          <p className="text-[20px] font-semibold tracking-tight text-brand">Lo invitamos a nuestro:</p>
          <p className={`mt-5 text-[3.425rem] md:text-[1.825rem] font-semibold tracking-tight leading-14 md:leading-normal text-ink ${editorialFont.className}`}>
            <span className="block md:inline">Recorrido</span><span className="hidden md:inline"> </span><span className="block md:inline">Regional</span><span className="hidden md:inline"> </span><span className="block md:inline">2026</span>
          </p>
          {startDate && endDate && (
            <p className="mt-6.5 text-sm"><span className="text-bold">Fecha: </span><span className="text-brand">{formatRecorridoDayMonth(startDate)}</span><span className="text-normal">, hasta el </span><span className="text-brand">{formatRecorridoDayMonth(endDate)}</span></p>
          )}
          {countdownDisplay && (
            <div className="my-5 border border-border bg-paper-highlight">
              <div className={`grid grid-cols-4 border divide-x divide-border ${MOBILE_FLOATING_BORDER_CLASS} ${countdownGridClassName}`} role="timer" aria-label="Tiempo restante para el recorrido" aria-disabled={countdownIsDisabled}>
                {getTimeUnits(countdownDisplay).map((unit) => <FlipCountdownCell key={unit.label} value={unit.value} label={unit.label} editorialFontClassName={editorialFont.className} disabled={countdownIsDisabled} />)}
              </div>
            </div>
          )}
          <div className="mt-0 w-full px-0 pt-3 pb-7">
            <p className="mt-2 text-[14px] font-bold uppercase tracking-[0.16em] text-brand">TEMA</p>
            <p className={`mt-1 text-[24px] font-semibold tracking-tight leading-snug text-ink ${editorialFont.className}`}>Conociendo nuestras raices</p>
            <p className="mt-4 text-sm font-medium text-ink">Hebreos 13:7</p>
            <p className="mt-2 text-[16px] italic leading-relaxed text-foreground/80"><span className="mr-1 align-top text-2xl leading-none text-foreground/35">&ldquo;</span>Acordaos de vuestros pastores, que os hablaron la palabra de Dios; considerad cual haya sido el resultado de su conducta, e imitad su fe.<span className="ml-1 align-bottom text-2xl leading-none text-foreground/35">&rdquo;</span></p>
          </div>
          <div className="mt-4 w-fit border border-border bg-paper-dark px-2 pr-4 py-4">
            <div className="flex items-center gap-4">
              <div className="flex shrink-0 items-center justify-center"><ClipboardList className="h-12 w-12 text-foreground/75" strokeWidth={1.35} aria-hidden="true" /></div>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-2 uppercase">
                <button type="button" onClick={handleOpenRegistration} disabled={!canOpenRegistration} className="inline-flex min-h-10 items-center justify-center gap-1.5 bg-brand px-2 py-3 text-bg font-semibold uppercase leading-tight whitespace-normal text-white transition-colors hover:bg-brand-hover active:bg-brand-hover/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-brand">
                  Registrar asistencia <ChevronRight className="h-5.5 w-5.5 shrink-0" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-8 h-px w-full bg-brand" aria-hidden="true" />
          <div className="mt-5.5 w-full px-0 pt-3">
            <p className="text-[14px] font-bold uppercase tracking-[0.16em] text-brand">SOUVENIRS</p>
            <p className={`mt-1 text-[24px] font-semibold tracking-tight leading-snug text-ink mb-7 ${editorialFont.className}`}>Llevate un recuerdo</p>
            <RecorridoProductCards products={products} regionTreasurer={regionTreasurer} />
          </div>
          <div className="mt-8 h-px w-full bg-brand" aria-hidden="true" />
          <RecorridoRoute events={events} />
        </div>
      </div>
      {selectedEvent && <RegistrationModal event={selectedEvent} isOpen={isRegisterModalOpen} onClose={handleCloseRegistration} regionPresident={regionPresident} />}
    </div>
  );
}
