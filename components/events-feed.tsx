"use client"

import { useState, useMemo, useRef } from "react"
import { Calendar } from "lucide-react"
import { MonthNavigator } from "./month-navigator"
import { EventCard } from "./event-card"
import { RegistrationModal } from "./registration-modal"
import { CountdownSection } from "./countdown-section"
import type { Event, RegionPresident } from "@/lib/types"

const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

interface EventsFeedProps {
  events: Event[]
  regionPresident: RegionPresident
  regions: string[]
}

export function EventsFeed({ events, regionPresident, regions }: EventsFeedProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const eventsListRef = useRef<HTMLDivElement>(null)

  // Get all event dates for the month navigator
  const eventDates = useMemo(() => events.map((e) => e.date), [events])

  // Filter events by selected month
  const filteredEvents = useMemo(() => {
    return events
      .filter(event => 
        event.date.getMonth() === selectedMonth.getMonth() &&
        event.date.getFullYear() === selectedMonth.getFullYear()
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [events, selectedMonth])

  const handleMonthSelect = (date: Date) => {
    setSelectedMonth(date)
    // Scroll to events list after selecting a month
    setTimeout(() => {
      if (eventsListRef.current) {
        // Account for fixed header (h-14 = 56px)
        const headerHeight = 56
        const elementPosition = eventsListRef.current.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.scrollY - headerHeight

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        })
      }
    }, 100)
  }

  const handleRegister = (event: Event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
  }

  return (
    <>
      {/* Countdown Section - Shows automatically when event is within 5 days */}
      <CountdownSection events={events} />

      {/* Calendar Section */}
      <section id="calendario" className="bg-background px-4 py-6">
        <div className="max-w-md mx-auto w-full">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 id="calendar-title" className="text-xl font-bold text-foreground">Calendario 2026</h2>
              <p className="text-muted-foreground text-sm">Selecciona un mes para ver eventos</p>
            </div>
          </div>

          {/* Month Navigator */}
          <MonthNavigator 
            selectedMonth={selectedMonth} 
            onMonthSelect={handleMonthSelect}
            eventDates={eventDates}
          />
        </div>
      </section>

      {/* Events Section - Full viewport */}
      <section id="eventos" ref={eventsListRef} className="min-h-screen bg-muted/30 px-4 py-4">
        <div className="max-w-md mx-auto w-full">
          {/* Month Header */}
          <div className="mb-6">
            <h3 className="font-bold text-lg text-foreground">
              {months[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filteredEvents.length === 0 
                ? "No hay eventos programados" 
                : `${filteredEvents.length} ${filteredEvents.length === 1 ? "evento programado" : "eventos programados"}`
              }
            </p>
          </div>

          {/* Events List */}
          <div className="space-y-4">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onRegister={handleRegister}
                  showAlbumButton={event.status === "past"}
                />
              ))
            ) : (
              <div className="bg-card rounded-2xl p-8 text-center border shadow-sm">
                <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-foreground font-medium mb-1">
                  Sin eventos este mes
                </p>
                <p className="text-sm text-muted-foreground">
                  Selecciona otro mes en el calendario para ver más actividades.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Registration Modal */}
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
  )
}
