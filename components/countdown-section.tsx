"use client";

import { useMemo, useState, useEffect } from "react";
import { Calendar, MapPin, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Event } from "@/lib/types";
import { useTime } from "@/lib/time-context";
import {
  getCountdownEvent,
  getAlbumSharingEvents,
  calculateCountdown,
} from "@/lib/countdown-utils";

interface CountdownSectionProps {
  events: Event[];
}

interface TimeUnit {
  value: number;
  label: string;
}

export function CountdownSection({ events }: CountdownSectionProps) {
  const { currentTime } = useTime();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const countdownEvent = useMemo(
    () => getCountdownEvent(events, currentTime),
    [events, currentTime],
  );
  const albumEvents = useMemo(
    () => getAlbumSharingEvents(events, currentTime),
    [events, currentTime],
  );
  const countdownData = useMemo(() => {
    if (!countdownEvent) return null;
    return calculateCountdown(countdownEvent, currentTime);
  }, [countdownEvent, currentTime]);

  if (!isMounted || (!countdownEvent && albumEvents.length === 0)) {
    return null;
  }

  const formatDate = (date: Date) => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  const getTimeUnits = (): TimeUnit[] => {
    if (!countdownData) return [];
    return [
      { value: countdownData.daysRemaining, label: "Días" },
      { value: countdownData.hoursRemaining, label: "Hrs" },
      { value: countdownData.minutesRemaining, label: "Min" },
      { value: countdownData.secondsRemaining, label: "Seg" },
    ];
  };

  return (
    <section
      className="bg-background px-4 pt-6 pb-[0px]"
      data-countdown-section
      aria-label="Próximo evento"
    >
      <div className="max-w-md mx-auto w-full space-y-4">
        {/* ── Active countdown ── */}
        {countdownEvent && countdownData && !countdownData.isPostEvent && (
          <div className="bg-card border border-border overflow-hidden">
            {/* Thin primary accent bar at top */}
            <div className="h-[3px] bg-primary" aria-hidden="true" />

            <div className="p-5">
              {/* Label */}
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-3">
                Próximo Evento
              </p>

              {/* Event title — serif for editorial weight */}
              <h3 className="text-xl font-bold text-foreground leading-snug mb-3">
                {countdownEvent.title}
              </h3>

              {/* Meta: date + location */}
              <div className="space-y-1.5 mb-5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {formatDate(countdownEvent.date)} · {countdownEvent.time}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{countdownEvent.location}</span>
                </div>
              </div>

              {/* Countdown grid — flat dividers, no background fill */}
              <div
                className="grid grid-cols-4 border border-border divide-x divide-border"
                role="timer"
                aria-label="Tiempo restante para el evento"
              >
                {getTimeUnits().map((unit) => (
                  <div key={unit.label} className="py-3 text-center">
                    <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
                      {String(unit.value).padStart(2, "0")}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1.5 font-medium">
                      {unit.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Album sharing cards (post-event) ── */}
        {albumEvents.map((event) => (
          <div key={event.id} className="bg-card border border-border p-4">
            <div className="flex items-start gap-3">
              <Images
                className="h-4 w-4 text-primary shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground mb-0.5 truncate">
                  {event.title}
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Comparte tus fotos del evento
                </p>
                <Button
                  onClick={() => {
                    if (event.googleDriveAlbumUrl) {
                      window.open(event.googleDriveAlbumUrl, "_blank");
                    }
                  }}
                  disabled={!event.googleDriveAlbumUrl}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white text-xs"
                >
                  <Images className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  {event.googleDriveAlbumUrl
                    ? "Subir Fotos"
                    : "Álbum no disponible"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
