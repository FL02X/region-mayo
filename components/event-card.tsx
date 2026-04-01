"use client"

import { useState } from "react"
import Image from "next/image"
import { MapPin, Clock, ExternalLink, ChevronDown, ChevronUp, Images, Facebook, Shirt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTime } from "@/lib/time-context"
import type { Event, Vestimenta } from "@/lib/types"

interface EventCardProps {
  event: Event
  onRegister: (event: Event) => void
  showAlbumButton?: boolean
}

const typeColors = {
  worship: "bg-primary/10 text-primary",
  tour: "bg-accent/10 text-accent",
  conference: "bg-chart-3/10 text-chart-3",
  youth: "bg-chart-2/10 text-chart-2",
}

const typeLabels = {
  worship: "Servicio de Adoración",
  tour: "Gira de Fraternidad",
  conference: "Conferencia Regional",
  youth: "Encuentro Juvenil",
}

const vestimentaLabels: Record<Vestimenta, string> = {
  uniformeMGR: "Uniforme MGR",
  formalCasual: "Vestimenta Formal Casual",
  informal: "Vestimenta Informal",
  otro: "Vestimenta Especial",
}

const vestimentaColors: Record<Vestimenta, string> = {
  uniformeMGR: "bg-primary/10 text-primary border-primary/20",
  formalCasual: "bg-slate-100 text-slate-700 border-slate-200",
  informal: "bg-emerald-50 text-emerald-700 border-emerald-200",
  otro: "bg-amber-50 text-amber-700 border-amber-200",
}

export function EventCard({ event, onRegister, showAlbumButton = false }: EventCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const { currentTime } = useTime()

  const formatDate = (date: Date) => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return `${date.getDate()} ${months[date.getMonth()]}`
  }

  const openGoogleMaps = () => {
    if (event.googleMapsUrl) {
      window.open(event.googleMapsUrl, "_blank")
    } else {
      const query = encodeURIComponent(event.address)
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank")
    }
  }

  const openAlbum = () => {
    if (event.googleDriveAlbumUrl) {
      window.open(event.googleDriveAlbumUrl, "_blank")
    }
  }

  const openFacebookPost = () => {
    if (event.facebookPostUrl) {
      window.open(event.facebookPostUrl, "_blank")
    }
  }

  // Use the time context for determining past events
  const isPastEvent = new Date(event.date) < currentTime
  const hasAlbum = event.albumEnabled && event.googleDriveAlbumUrl
  const hasFacebookPost = !!event.facebookPostUrl
  const canRegister = !isPastEvent && event.registrationEnabled !== false
  const shouldShowDescription = event.description && event.description.length > 0

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow">
      {/* Event Image */}
      <div className="relative h-48 w-full">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover"
          loading="eager"
          priority
        />
        {/* Date Badge */}
        <div className="absolute top-3 left-3 bg-white rounded-xl px-3 py-2 shadow-md text-center">
          <p className="text-xs font-semibold text-primary uppercase">{formatDate(event.date).split(" ")[1]}</p>
          <p className="text-2xl font-bold text-foreground leading-none">{event.date.getDate()}</p>
        </div>
        {/* Time Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-medium text-foreground">{event.time}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Type Badge */}
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="secondary" className={typeColors[event.typeColor]}>
            {typeLabels[event.typeColor]}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-lg text-foreground mb-3 line-clamp-2">{event.title}</h3>

        {/* Description (Expandable) */}
        {shouldShowDescription && (
          <div className="mb-3">
            <p className={`text-sm text-muted-foreground ${!isDescriptionExpanded ? "line-clamp-2" : ""}`}>
              {event.description}
            </p>
            {event.description && event.description.length > 100 && (
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-1 font-medium"
              >
                {isDescriptionExpanded ? (
                  <>
                    Ver menos <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Ver más <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Location */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-foreground font-medium">{event.location}</p>
            <p className="text-xs text-muted-foreground">{event.address}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={openGoogleMaps}
            className="shrink-0 text-primary hover:text-primary/80 h-8 px-2"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Maps
          </Button>
        </div>

        {/* Vestimenta */}
        {event.vestimenta && (
          <div className="flex items-center gap-2 mb-4">
            <Shirt className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">
                {vestimentaLabels[event.vestimenta]}
              </p>
              {event.vestimenta === "otro" && event.vestimentaCustom && (
                <p className="text-xs text-muted-foreground">{event.vestimentaCustom}</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {isPastEvent ? (
            // Past event - show available links
            <div className="flex gap-2">
              {hasAlbum && (
                <Button
                  onClick={openAlbum}
                  className="flex-1 rounded-xl"
                >
                  <Images className="h-4 w-4 mr-2" />
                  Ver Album
                </Button>
              )}
              {hasFacebookPost && (
                <Button
                  onClick={openFacebookPost}
                  variant={hasAlbum ? "outline" : "default"}
                  className="flex-1 rounded-xl"
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Ver en Facebook
                </Button>
              )}
              {!hasAlbum && !hasFacebookPost && (
                <Button
                  disabled
                  variant="secondary"
                  className="flex-1 rounded-xl"
                >
                  Evento finalizado
                </Button>
              )}
            </div>
          ) : (
            // Upcoming event - show register if enabled
            <Button
              onClick={() => onRegister(event)}
              disabled={!canRegister}
              className="flex-1 rounded-xl"
            >
              {canRegister ? "Registrarse" : "Registro no disponible"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Re-export Event type for backwards compatibility
export type { Event }
