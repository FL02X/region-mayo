"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { MonthNavigator } from "./month-navigator";
import { EventCard } from "./event-card";
import { RegistrationModal } from "./registration-modal";
import { CountdownSection } from "./countdown-section";
import type { Event, RegionPresident } from "@/lib/types";

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const INITIAL_DATE = new Date(2026, 3, 1); // April 2026

interface EventsFeedProps {
  events: Event[];
  regionPresident: RegionPresident | null;
}

export function EventsFeed({
  events,
  regionPresident,
}: EventsFeedProps) {
  const [selectedMonth, setSelectedMonth] = useState(INITIAL_DATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const [pendingHashEventId, setPendingHashEventId] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);

    let isSubscribed = true;

    const syncHashTarget = () => {
      if (!isSubscribed) return;
      if (!window.location.hash) return;

      const id = window.location.hash.substring(1);
      const targetEvent = events.find((event) => event.id === id);
      if (!targetEvent) return;

      setSelectedMonth(
        new Date(targetEvent.date.getFullYear(), targetEvent.date.getMonth(), 1),
      );
      setPendingHashEventId(id);
    };

    // Run on initial mount
    syncHashTarget();

    // Listen to native hash changes (useful if user clicks multiple links sequentially)
    window.addEventListener("hashchange", syncHashTarget, { passive: true });

    return () => {
      isSubscribed = false;
      window.removeEventListener("hashchange", syncHashTarget);
    };
  }, [events]);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const eventsListRef = useRef<HTMLDivElement>(null);

  const eventDates = useMemo(() => events.map((e) => e.date), [events]);

  const filteredEvents = useMemo(() => {
    return events
      .filter(
        (event) =>
          event.date.getMonth() === selectedMonth.getMonth() &&
          event.date.getFullYear() === selectedMonth.getFullYear(),
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, selectedMonth]);

  useEffect(() => {
    if (!pendingHashEventId) return;

    const isTargetMonthRendered = filteredEvents.some(
      (event) => event.id === pendingHashEventId,
    );
    if (!isTargetMonthRendered) return;

    let isSubscribed = true;
    let attempts = 0;

    const attemptScrollAndHighlight = () => {
      if (!isSubscribed) return;

      const targetEl = document.getElementById(pendingHashEventId);
      if (targetEl) {
        const existingHighlights = document.querySelectorAll(".global-highlight");
        existingHighlights.forEach((el) => el.classList.remove("global-highlight"));

        targetEl.classList.add("global-highlight");
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        setPendingHashEventId(null);
        return;
      }

      if (attempts < 24) {
        attempts += 1;
        setTimeout(attemptScrollAndHighlight, 60);
      }
    };

    attemptScrollAndHighlight();

    return () => {
      isSubscribed = false;
    };
  }, [filteredEvents, pendingHashEventId]);

  const handleMonthSelect = (date: Date) => {
    setSelectedMonth(date);
    setTimeout(() => {
      if (eventsListRef.current) {
        const offsetPosition =
          eventsListRef.current.getBoundingClientRect().top +
          window.scrollY -
          54;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    }, 100);
  };

  const handleRegister = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="w-full relative bg-[#f1f1f1]" data-events-feed="true">
      <div className="desktop-content-pane max-w-[950px] mx-auto bg-[#ffffff] md:border-x border-[#dce2e9] dark:border-[#27272a] min-h-screen pb-20 pt-[2px]">
        {/* Countdown (mobile only; desktop featured event lives in hero) */}
        <div className="md:hidden">
          <CountdownSection events={events} onRegister={handleRegister} />
        </div>

        <div className="h-[12px] bg-muted/20 md:hidden" aria-hidden="true" />

        {/* Calendar section */}
        <section id="calendario" className="px-4 md:px-8 pt-6 pb-4 border-t border-border/70 bg-muted/20">
        <div className="mt-4 max-w-4xl mx-auto w-full">
          <div className="mb-5">
            <h2
              id="calendar-title"
              className="text-[1.425rem] font-semibold text-foreground tracking-tight mb-2"
            >
              Calendario 2026
            </h2>
            <p className="text-[17px] text-muted-foreground mt-0.5">
              Selecciona un mes para ver los eventos
            </p>
          </div>
          {/* Navigator aligned with left content edge on desktop */}
          <div className="max-w-md w-full">
            <MonthNavigator
              selectedMonth={selectedMonth}
              onMonthSelect={handleMonthSelect}
              eventDates={eventDates}
            />
          </div>
        </div>
      </section>

      {/* Events list */}
      <section
        id="eventos"
        ref={eventsListRef}
        className="bg-muted/20 px-4 md:px-6 pt-4 pb-14"
      >
        <div className="mt-1 max-w-4xl mx-auto w-full">
          {/* Month label */}
          <div className="mb-6">
            <h3 className="font-semibold text-[1.275rem] text-foreground tracking-tight">
              {months[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
            </h3>
            <p className="text-[16px] text-muted-foreground mt-0.5">
              {filteredEvents.length === 0
                ? "No hay eventos programados"
                : `${filteredEvents.length} ${
                    filteredEvents.length === 1 ? "evento" : "eventos"
                  } programados`}
            </p>
          </div>

          {/* Cards layout:
              - 0 events  → centered empty state (max-w-md)
              - 1 event   → centered single card (max-w-md)
              - 2+ events → 1 col mobile / 2 col md+
          */}
          {filteredEvents.length === 0 ? (
            <div className="bg-card border border-border p-8 text-center max-w-md mx-auto">
              <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                Sin eventos este mes
              </p>
              <p className="text-xs text-muted-foreground">
                Selecciona otro mes en el calendario para ver más actividades.
              </p>
            </div>
          ) : filteredEvents.length === 1 ? (
            <div className="max-w-md mx-auto">
              <EventCard
                key={filteredEvents[0].id}
                event={filteredEvents[0]}
                onRegister={handleRegister}
                showAlbumButton={filteredEvents[0].status === "past"}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={handleRegister}
                  showAlbumButton={event.status === "past"}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      </div>

      {/* Registration modal */}
      {selectedEvent && (
        <RegistrationModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          regionPresident={regionPresident}
        />
      )}
    </div>
  );
}
