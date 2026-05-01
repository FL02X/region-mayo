"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Images,
  Facebook,
  Shirt,
  Utensils,
  Users,
  User,
  Mic,
  Info,
  X,
  CalendarDays,
  Church,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTime } from "@/lib/time-context";
import type { Event, Vestimenta, EventType } from "@/lib/types";

interface EventCardProps {
  event: Event;
  onRegister: (event: Event) => void;
  showAlbumButton?: boolean;
}

const eventTypeLabels: Record<EventType, string> = {
  campana: "Campaña",
  convencion: "Convención General",
  recorrido: "Recorrido Regional",
  confraternidadJuvenilRegional: "Confraternidad Juvenil Regional",
  confraternidadJuvenilGeneral: "Confraternidad Juvenil General",
  cultoJuvenil: "Culto Juvenil",
  culto: "Culto",
  visita: "Visita",
  ensayo: "Ensayo",
  actividad: "Actividad",
  estudioBiblico: "Estudio Bíblico",
  biregional: "Biregional",
  congresoBrilla: "Congreso Brilla",
  boda: "Boda",
};

const vestimentaLabels: Record<Vestimenta, string> = {
  uniformeMGR: "Uniforme MGR",
  formalCasual: "Formal/Casual",
  informal: "Informal",
  otro: "Especial",
};

export function EventCard({
  event,
  onRegister,
  showAlbumButton = false,
}: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMoreInfoImage, setShowMoreInfoImage] = useState(false);
  const { currentTime } = useTime();

  /* ── date helpers (UTC to avoid hydration drift) ── */
  const formatDate = (date: Date) => {
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
    return `${date.getUTCDate()} ${months[date.getUTCMonth()]}`;
  };

  const formatDateRange = (start: Date, end: Date) => {
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
    const sd = start.getUTCDate();
    const ed = end.getUTCDate();
    const sm = months[start.getUTCMonth()];
    const em = months[end.getUTCMonth()];
    return sm === em ? `${sd}–${ed} ${sm}` : `${sd} ${sm} – ${ed} ${em}`;
  };

  const openGoogleMaps = (url?: string, address?: string) => {
    if (url) {
      window.open(url, "_blank");
    } else if (address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
        "_blank",
      );
    }
  };

  const openAlbum = () => {
    if (event.googleDriveAlbumUrl)
      window.open(event.googleDriveAlbumUrl, "_blank");
  };

  const openFacebookPost = () => {
    if (event.facebookPostUrl) window.open(event.facebookPostUrl, "_blank");
  };

  /* ── state derivations ── */
  const isPastEvent = new Date(event.date) < currentTime;
  const hasAlbum = event.albumEnabled && event.googleDriveAlbumUrl;
  const hasFacebookPost = !!event.facebookPostUrl;
  const canRegister = !isPastEvent && event.registrationEnabled !== false;
  const hasDescription = !!event.description && event.description.length > 0;
  const isMultiDay = !!(event.endDate && event.endDate > event.date);
  const eventType = event.eventType || "culto";

  /* Does the card have any expandable details? */
  const hasDetails =
    !!event.vestimenta ||
    !!event.speakers?.pastorMensaje ||
    !!event.speakers?.jovenPreside ||
    event.alimentos?.enabled ||
    event.juntaJuvenil?.enabled ||
    (event.moreInfo?.enabled && !!event.moreInfo.imageUrl);

  return (
    <>
      <article 
        id={event.id}
        className="desktop-card-lift bg-card border border-border/80 overflow-hidden flex flex-col scroll-mt-[100px] transition-all duration-700 target:ring-4 target:ring-yellow-400 dark:target:bg-yellow-900/20"
      >
        {/* ── Image with date/time strip ── */}
        {event.image ? (
          <div className="relative h-40 w-full shrink-0">
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="object-cover"
              loading="eager"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-4 py-3">
              <div className="flex items-end justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {isMultiDay && (
                    <CalendarDays
                      className="h-4 w-4 text-white/90 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-[15px] font-semibold text-white leading-none">
                    {isMultiDay
                      ? formatDateRange(event.date, event.endDate!)
                      : formatDate(event.date)}
                  </span>
                </div>
                <span className="text-[15px] font-semibold text-white/95 leading-none tabular-nums">
                  {event.time}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-16 w-full bg-muted flex items-center justify-center shrink-0">
            <Church
              className="h-6 w-6 text-muted-foreground/25"
              aria-hidden="true"
            />
          </div>
        )}

        {/* ── Card body ── */}
        <div className="p-5 flex flex-col flex-1">
          {/* Event type — plain uppercase label */}
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#2f5e93] mb-1.5">
            {eventTypeLabels[eventType]}
          </p>

          {/* Title — Inter bold, no serif */}
          <h3 className="text-[22px] md:text-[23px] font-bold text-foreground leading-[1.2] mb-3 font-sans tracking-tight">
            {event.title}
          </h3>

          {/* Description — always shown, 3-line clamp */}
          {hasDescription && (
            <p className="text-[15px] text-muted-foreground leading-relaxed line-clamp-3 mb-4">
              {event.description}
            </p>
          )}

          {/* Location — shown before action buttons */}
          {event.location && (
            <div className="mt-1 mb-4 flex items-center gap-2.5">
              <MapPin
                className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-medium text-foreground leading-snug">
                  {event.location}
                </p>
                {event.address && (
                  <p className="text-[16px] text-muted-foreground">
                    {event.address}
                  </p>
                )}
              </div>
              <button
                onClick={() =>
                  openGoogleMaps(event.googleMapsUrl, event.address)
                }
                className="mr-5 mt-2 ml-2 flex items-center gap-1.5 text-sm font-medium text-[#2f5e93] border border-[#2f5e93]/35 bg-[#2f5e93]/5 hover:bg-[#2f5e93]/10 rounded-[3px] px-2.5 py-1 transition-colors shrink-0"
                aria-label={`Abrir ${event.location} en Google Maps`}
                style={{ minHeight: "unset", minWidth: "unset" }}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Maps
              </button>
            </div>
          )}

          {/* Spacer pushes actions to bottom */}
          <div className="flex-1" />

          {/* ── Action buttons — ALWAYS VISIBLE ── */}
          {(isPastEvent || canRegister) && (
            <div className="border-t border-border/70 pt-3 mt-1">
              {isPastEvent ? (
              <div className="flex gap-2">
                {hasAlbum && (
                  <Button
                    onClick={openAlbum}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white text-sm"
                  >
                    <Images className="h-4 w-4 mr-2" aria-hidden="true" />
                    Ver Álbum
                  </Button>
                )}
                {hasFacebookPost && (
                  <Button
                    onClick={openFacebookPost}
                    variant={hasAlbum ? "outline" : "default"}
                    className={`flex-1 text-sm ${
                      !hasAlbum
                        ? "bg-primary hover:bg-primary/90 text-white"
                        : ""
                    }`}
                  >
                    <Facebook className="h-4 w-4 mr-2" aria-hidden="true" />
                    Ver en Facebook
                  </Button>
                )}
                {!hasAlbum && !hasFacebookPost && (
                  <Button
                    disabled
                    variant="secondary"
                    className="flex-1 text-sm"
                  >
                    Evento finalizado
                  </Button>
                )}
              </div>
              ) : (
                <Button
                  onClick={() => onRegister(event)}
                  className="w-full text-sm py-5 font-bold tracking-[0.01em] bg-primary hover:bg-primary/90 text-white"
                >
                  REGISTRARSE
                </Button>
              )}
            </div>
          )}

          {/* ── "Ver más información" — plain text toggle, NOT a button ── */}
          {hasDetails && (
            <div className="-mx-5 mt-3 border-t border-border">
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="w-full px-5 flex items-center justify-between py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-expanded={isExpanded}
                aria-controls={`details-${event.id}`}
                style={{
                  minHeight: "unset",
                  minWidth: "unset",
                  background: "none",
                  border: "none",
                }}
              >
                <span>
                  {isExpanded ? "Ocultar información" : "Ver más información"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {/* ── Expanded details ── */}
              {isExpanded && (
                <div id={`details-${event.id}`} className="space-y-4 pb-5 pt-5 px-5">
                  {/* Vestimenta */}
                  {event.vestimenta && (
                    <div className="flex items-start gap-2.5">
                      <Shirt
                        className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          <span className="text-muted-foreground">
                            Vestimenta ·{" "}
                          </span>
                          {vestimentaLabels[event.vestimenta]}
                        </p>
                        {event.vestimenta === "otro" &&
                          event.vestimentaCustom && (
                            <p className="text-xs text-muted-foreground">
                              {event.vestimentaCustom}
                            </p>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Speakers */}
                  {(event.speakers?.pastorMensaje ||
                    event.speakers?.jovenPreside) && (
                    <div className="space-y-2">
                      {event.speakers.pastorMensaje && (
                        <div className="flex items-start gap-2.5">
                          <Mic
                            className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <p className="text-sm text-foreground">
                            <span className="text-muted-foreground">
                              Pastor ·{" "}
                            </span>
                            {event.speakers.pastorMensaje}
                          </p>
                        </div>
                      )}
                      {event.speakers.jovenPreside && (
                        <div className="flex items-start gap-2.5">
                          <User
                            className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <p className="text-sm text-foreground">
                            <span className="text-muted-foreground">
                              Preside ·{" "}
                            </span>
                            {event.speakers.jovenPreside}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Alimentos */}
                  {event.alimentos?.enabled && (
                    <div className="p-3 bg-muted/40 border border-border">
                      <div className="flex items-start gap-2.5">
                        <Utensils
                          className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground mb-0.5">
                            Alimentos
                          </p>
                          {event.alimentos.location && (
                            <p className="text-xs text-muted-foreground">
                              {event.alimentos.location}
                            </p>
                          )}
                          {event.alimentos.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">
                              {event.alimentos.description}
                            </p>
                          )}
                        </div>
                        {event.alimentos.googleMapsUrl && (
                          <button
                            onClick={() =>
                              openGoogleMaps(event.alimentos?.googleMapsUrl)
                            }
                            className="mt-4 mr-5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            aria-label="Ver ubicación de alimentos en Maps"
                            style={{ minHeight: "unset", minWidth: "unset" }}
                          >
                            <MapPin
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Junta Juvenil */}
                  {event.juntaJuvenil?.enabled && (
                    <div className="p-3 bg-muted/40 border border-border">
                      <div className="flex items-start gap-2.5">
                        <Users
                          className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground mb-0.5">
                            Junta Juvenil
                          </p>
                          {event.juntaJuvenil.location && (
                            <p className="text-xs text-muted-foreground">
                              {event.juntaJuvenil.location}
                            </p>
                          )}
                          {event.juntaJuvenil.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">
                              {event.juntaJuvenil.description}
                            </p>
                          )}
                        </div>
                        {event.juntaJuvenil.googleMapsUrl && (
                          <button
                            onClick={() =>
                              openGoogleMaps(event.juntaJuvenil?.googleMapsUrl)
                            }
                            className="mt-4 mr-5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            aria-label="Ver ubicación de junta juvenil en Maps"
                            style={{ minHeight: "unset", minWidth: "unset" }}
                          >
                            <MapPin
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Más Info image */}
                  {!isPastEvent &&
                    event.moreInfo?.enabled &&
                    event.moreInfo.imageUrl && (
                      <Button
                        variant="outline"
                        onClick={() => setShowMoreInfoImage(true)}
                        className="text-sm w-full"
                      >
                        <Info className="h-4 w-4 mr-1.5" aria-hidden="true" />
                        Más información del evento
                      </Button>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      </article>

      {/* ── "Más Info" image modal ── */}
      {showMoreInfoImage && event.moreInfo?.imageUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowMoreInfoImage(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Información adicional del evento"
        >
          <div className="relative max-w-lg w-full max-h-[90vh]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMoreInfoImage(false)}
              className="absolute -top-12 right-0 text-white hover:bg-white/20 rounded-full"
              aria-label="Cerrar imagen de información"
            >
              <X className="h-6 w-6" />
            </Button>
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <Image
                src={event.moreInfo.imageUrl}
                alt="Más información del evento"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export type { Event };
