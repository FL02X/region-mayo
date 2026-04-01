"use client"

import { useMemo, useState, useEffect } from "react"
import { Clock, Calendar, Images, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Event } from "@/lib/types"
import { useTime } from "@/lib/time-context"
import {
  getCountdownEvent,
  getAlbumSharingEvents,
  calculateCountdown,
  getCountdownUrgency,
} from "@/lib/countdown-utils"

interface CountdownSectionProps {
  events: Event[]
}

interface TimeUnit {
  value: number
  label: string
}

export function CountdownSection({ events }: CountdownSectionProps) {
  const { currentTime } = useTime()
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  const countdownEvent = useMemo(() => getCountdownEvent(events, currentTime), [events, currentTime])
  const albumEvents = useMemo(() => getAlbumSharingEvents(events, currentTime), [events, currentTime])
  const countdownData = useMemo(() => {
    if (!countdownEvent) return null
    return calculateCountdown(countdownEvent, currentTime)
  }, [countdownEvent, currentTime])
  
  const urgency = countdownData ? getCountdownUrgency(countdownData) : "low"
  
  if (!isMounted || (!countdownEvent && albumEvents.length === 0)) {
    return null
  }
  
  const formatDate = (date: Date) => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`
  }
  
  const getTimeUnits = (): TimeUnit[] => {
    if (!countdownData) return []
    
    return [
      { value: countdownData.daysRemaining, label: "Días" },
      { value: countdownData.hoursRemaining, label: "Hrs" },
      { value: countdownData.minutesRemaining, label: "Min" },
      { value: countdownData.secondsRemaining, label: "Seg" },
    ]
  }

  return (
    <section className="bg-background px-4 py-6">
      <div className="max-w-md mx-auto w-full space-y-4">
        {/* Active Countdown - Cleaner design without box backgrounds */}
        {countdownEvent && countdownData && !countdownData.isPostEvent && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FF4E33] to-[#FF8E00] p-6 text-white shadow-lg">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.07]">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white" />
            </div>
            
            <div className="relative">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wide opacity-90">
                  ¡Próximo Evento!
                </span>
              </div>
              
              {/* Event Title - Extra Bold as recommended */}
              <h3 className="text-2xl font-extrabold mb-2 text-balance leading-tight">
                {countdownEvent.title}
              </h3>
              
              {/* Event Date & Location */}
              <div className="flex flex-col gap-1 mb-5 text-white/90 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(countdownEvent.date)} - {countdownEvent.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{countdownEvent.location}</span>
                </div>
              </div>
              
              {/* Countdown Timer - Clean design without translucent boxes */}
              <div className="grid grid-cols-4 gap-3">
                {getTimeUnits().map((unit) => (
                  <div 
                    key={unit.label}
                    className="text-center"
                  >
                    <p className="text-4xl font-bold leading-none tracking-tight">
                      {String(unit.value).padStart(2, "0")}
                    </p>
                    <p className="text-xs mt-1.5 opacity-80 font-medium uppercase tracking-wider">{unit.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Album Sharing Cards (Post-Event) */}
        {albumEvents.map((event) => (
          <div 
            key={event.id}
            className="bg-card rounded-2xl p-5 border shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF6B35]/10">
                <Images className="h-6 w-6 text-[#FF6B35]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground mb-1 truncate">
                  {event.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  ¡Comparte tus fotos del evento!
                </p>
                <Button
                  onClick={() => {
                    if (event.googleDriveAlbumUrl) {
                      window.open(event.googleDriveAlbumUrl, "_blank")
                    }
                  }}
                  disabled={!event.googleDriveAlbumUrl}
                  size="sm"
                  className="rounded-xl bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
                >
                  <Images className="h-4 w-4 mr-2" />
                  {event.googleDriveAlbumUrl ? "Subir Fotos" : "Album no disponible"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
