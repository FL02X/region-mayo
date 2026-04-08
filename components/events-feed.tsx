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
  regions: string[];
}

export function EventsFeed({
  events,
  regionPresident,
  regions,
}: EventsFeedProps) {
  const [selectedMonth, setSelectedMonth] = useState(INITIAL_DATE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

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

  const handleMonthSelect = (date: Date) => {
    setSelectedMonth(date);
    setTimeout(() => {
      if (eventsListRef.current) {
        const offsetPosition =
          eventsListRef.current.getBoundingClientRect().top +
          window.scrollY -
          56;
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
    <>
      {/* Countdown */}
      <CountdownSection events={events} />

      {/* Calendar section */}
      <section id="calendario" className="bg-background px-4 md:px-6 py-6">
        <div className="max-w-4xl mx-auto w-full">
          <div className="mb-4">
            <h2
              id="calendar-title"
              className="text-lg font-bold text-foreground"
            >
              Calendario 2026
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Selecciona un mes para ver los eventos
            </p>
          </div>
          {/* Navigator centered, capped at md width */}
          <div className="max-w-md mx-auto">
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
        className="bg-muted/20 border-t border-border px-4 md:px-6 pt-5 pb-12"
      >
        <div className="max-w-4xl mx-auto w-full">
          {/* Month label */}
          <div className="mb-5">
            <h3 className="font-semibold text-base text-foreground">
              {months[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
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

      {/* Registration modal */}
      {selectedEvent && (
        <RegistrationModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          regionPresident={regionPresident}
          regions={regions}
        />
      )}
    </>
  );
}
