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
    
    let isSubscribed = true;

    const syncHash = () => {
      if (!isSubscribed) return;
      if (window.location.hash) {
        const id = window.location.hash.substring(1);
        const targetEvent = events.find(e => e.id === id);
        
        if (targetEvent) {
          // Set the month matching the target event immediately
          setSelectedMonth(new Date(targetEvent.date.getFullYear(), targetEvent.date.getMonth(), 1));
          
          // Retry scrolling to handle React batch rendering the new month
          let attempts = 0;
          const attemptScroll = () => {
            if (!isSubscribed) return;
            const el = document.getElementById(id);
            if (el) {
              el.classList.add('global-highlight');
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (attempts < 10) {
              attempts++;
              setTimeout(attemptScroll, 50); // check roughly every frame
            }
          };
          attemptScroll();
        }
      }
    };

    // Run on initial mount
    syncHash();

    // Listen to native hash changes (useful if user clicks multiple links sequentially)
    window.addEventListener('hashchange', syncHash, { passive: true });

    return () => {
      isSubscribed = false;
      window.removeEventListener('hashchange', syncHash);
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
    <div className="w-full relative bg-[#f3f4f6] dark:bg-[#09090b]" data-events-feed="true">
      <div className="max-w-[950px] mx-auto bg-background md:border-x border-[#e5e7eb] dark:border-[#27272a] shadow-[0_0_15px_1px_rgba(0,0,0,0.07)] dark:shadow-none min-h-screen pb-16 pt-[2px]">
        {/* Countdown */}
        <CountdownSection events={events} />

        {/* Calendar section */}
        <section id="calendario" className="px-4 md:px-8 py-6">
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
        <div className="mt-3 max-w-4xl mx-auto w-full">
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
      </div>

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
    </div>
  );
}
