"use client"

import { useState } from "react"
import Image from "next/image"
import { 
  MapPin, Clock, ExternalLink, ChevronDown, ChevronUp, Images, Facebook, Shirt, 
  Utensils, Users, User, Mic, Info, X, CalendarDays,
  Church, Music, BookOpen, Tent, Heart, GraduationCap, PartyPopper, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTime } from "@/lib/time-context"
import type { Event, Vestimenta, EventType } from "@/lib/types"

interface EventCardProps {
  event: Event
  onRegister: (event: Event) => void
  showAlbumButton?: boolean
}

// Event type icons
const eventTypeIcons: Record<EventType, React.ReactNode> = {
  campana: <Tent className="h-3.5 w-3.5" />,
  convencion: <Users className="h-3.5 w-3.5" />,
  recorrido: <MapPin className="h-3.5 w-3.5" />,
  cultoJuvenil: <Sparkles className="h-3.5 w-3.5" />,
  culto: <Church className="h-3.5 w-3.5" />,
  visita: <Heart className="h-3.5 w-3.5" />,
  ensayo: <Music className="h-3.5 w-3.5" />,
  actividad: <PartyPopper className="h-3.5 w-3.5" />,
  estudioBiblico: <BookOpen className="h-3.5 w-3.5" />,
  biregional: <Users className="h-3.5 w-3.5" />,
  congresoBrilla: <GraduationCap className="h-3.5 w-3.5" />,
  boda: <Heart className="h-3.5 w-3.5" />,
}

// Event type labels (in uppercase as requested)
const eventTypeLabels: Record<EventType, string> = {
  campana: "CAMPAÑA",
  convencion: "CONVENCIÓN GENERAL",
  recorrido: "RECORRIDO REGIONAL",
  cultoJuvenil: "CULTO JUVENIL",
  culto: "CULTO",
  visita: "VISITA",
  ensayo: "ENSAYO",
  actividad: "ACTIVIDAD",
  estudioBiblico: "ESTUDIO BÍBLICO",
  biregional: "BIREGIONAL",
  congresoBrilla: "CONGRESO BRILLA",
  boda: "BODA",
}

// Simplified event type colors - using muted backgrounds for visual discipline
const eventTypeColors: Record<EventType, string> = {
  campana: "bg-muted text-foreground border-border",
  convencion: "bg-muted text-foreground border-border",
  recorrido: "bg-muted text-foreground border-border",
  cultoJuvenil: "bg-muted text-foreground border-border",
  culto: "bg-muted text-foreground border-border",
  visita: "bg-muted text-foreground border-border",
  ensayo: "bg-muted text-foreground border-border",
  actividad: "bg-muted text-foreground border-border",
  estudioBiblico: "bg-muted text-foreground border-border",
  biregional: "bg-muted text-foreground border-border",
  congresoBrilla: "bg-muted text-foreground border-border",
  boda: "bg-muted text-foreground border-border",
}

const vestimentaLabels: Record<Vestimenta, string> = {
  uniformeMGR: "Uniforme MGR",
  formalCasual: "Vestimenta Formal Casual",
  informal: "Vestimenta Informal",
  otro: "Vestimenta Especial",
}

export function EventCard({ event, onRegister, showAlbumButton = false }: EventCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [showMoreInfoImage, setShowMoreInfoImage] = useState(false)
  const { currentTime } = useTime()

  const formatDate = (date: Date) => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return `${date.getDate()} ${months[date.getMonth()]}`
  }

  const openGoogleMaps = (url?: string, address?: string) => {
    if (url) {
      window.open(url, "_blank")
    } else if (address) {
      const query = encodeURIComponent(address)
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

  const isPastEvent = new Date(event.date) < currentTime
  const hasAlbum = event.albumEnabled && event.googleDriveAlbumUrl
  const hasFacebookPost = !!event.facebookPostUrl
  const canRegister = !isPastEvent && event.registrationEnabled !== false
  const shouldShowDescription = event.description && event.description.length > 0
  const isMultiDay = event.endDate && event.endDate > event.date
  const eventType = event.eventType || "culto"

  return (
    <>
      <div className="bg-card rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow">
        {/* Event Image */}
        <div className="relative h-52 w-full">
          {event.image ? (
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="object-cover"
              loading="eager"
              priority
            />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center">
              <Church className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {/* Date Badge - Shows range for multi-day events */}
          <div className="absolute top-4 left-4 bg-white rounded-xl px-3 py-2 shadow-md text-center min-w-[56px]">
            {isMultiDay ? (
              <>
                <div className="flex items-center justify-center gap-1">
                  <CalendarDays className="h-3 w-3 text-[#FF6B35]" />
                  <p className="text-xs font-semibold text-[#FF6B35] uppercase">
                    {formatDate(event.date).split(" ")[1]}
                  </p>
                </div>
                <p className="text-lg font-bold text-foreground leading-none">
                  {event.date.getDate()}-{event.endDate!.getDate()}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-[#FF6B35] uppercase">{formatDate(event.date).split(" ")[1]}</p>
                <p className="text-2xl font-bold text-foreground leading-none">{event.date.getDate()}</p>
              </>
            )}
          </div>
          {/* Time Badge */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
            <Clock className="h-3.5 w-3.5 text-[#FF6B35]" />
            <span className="text-sm font-medium text-foreground">{event.time}</span>
          </div>
        </div>

        {/* Content - Increased padding for more whitespace */}
        <div className="p-5">
          {/* Type Badge with icon */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className={`${eventTypeColors[eventType]} flex items-center gap-1.5 font-medium text-xs`}>
              {eventTypeIcons[eventType]}
              {eventTypeLabels[eventType]}
            </Badge>
          </div>

          {/* Title - Larger for hierarchy */}
          <h3 className="font-serif font-bold text-xl text-foreground mb-4 text-balance leading-tight">{event.title}</h3>

          {/* Description (Expandable) */}
          {shouldShowDescription && (
            <div className="mb-4">
              <p className={`text-sm text-muted-foreground leading-relaxed ${!isDescriptionExpanded ? "line-clamp-2" : ""}`}>
                {event.description}
              </p>
              {event.description && event.description.length > 100 && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="flex items-center gap-1 text-xs text-[#FF6B35] hover:text-[#FF6B35]/80 mt-1.5 font-medium"
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

          {/* Location - Clean layout */}
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground font-medium">{event.location}</p>
              <p className="text-xs text-muted-foreground truncate">{event.address}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openGoogleMaps(event.googleMapsUrl, event.address)}
              className="shrink-0 text-[#FF6B35] hover:text-[#FF6B35]/80 h-8 px-2"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Maps
            </Button>
          </div>

          {/* Vestimenta */}
          {event.vestimenta && (
            <div className="flex items-center gap-3 mb-4">
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

          {/* Pastor del Mensaje / Joven que Preside */}
          {(event.speakers?.pastorMensaje || event.speakers?.jovenPreside) && (
            <div className="mb-4 space-y-3">
              {event.speakers.pastorMensaje && (
                <div className="flex items-center gap-3">
                  <Mic className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Pastor del Mensaje</p>
                    <p className="text-sm text-foreground font-medium">{event.speakers.pastorMensaje}</p>
                  </div>
                </div>
              )}
              {event.speakers.jovenPreside && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Joven que Preside</p>
                    <p className="text-sm text-foreground font-medium">{event.speakers.jovenPreside}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Alimentos Section - Muted background for visual discipline */}
          {event.alimentos?.enabled && (
            <div className="mb-4 p-4 bg-muted/50 rounded-xl border border-border">
              <div className="flex items-start gap-3">
                <Utensils className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Alimentos</p>
                  {event.alimentos.location && (
                    <p className="text-xs text-muted-foreground">{event.alimentos.location}</p>
                  )}
                  {event.alimentos.description && (
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{event.alimentos.description}</p>
                  )}
                </div>
                {event.alimentos.googleMapsUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openGoogleMaps(event.alimentos?.googleMapsUrl)}
                    className="shrink-0 text-foreground hover:bg-muted h-7 px-2"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Junta Juvenil Section - Muted background for visual discipline */}
          {event.juntaJuvenil?.enabled && (
            <div className="mb-4 p-4 bg-muted/50 rounded-xl border border-border">
              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Junta Juvenil</p>
                  {event.juntaJuvenil.location && (
                    <p className="text-xs text-muted-foreground">{event.juntaJuvenil.location}</p>
                  )}
                  {event.juntaJuvenil.description && (
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{event.juntaJuvenil.description}</p>
                  )}
                </div>
                {event.juntaJuvenil.googleMapsUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openGoogleMaps(event.juntaJuvenil?.googleMapsUrl)}
                    className="shrink-0 text-foreground hover:bg-muted h-7 px-2"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons - More spacing before */}
          <div className="flex flex-col gap-2 pt-2">
            {isPastEvent ? (
              <div className="flex gap-2">
                {hasAlbum && (
                  <Button onClick={openAlbum} className="flex-1 rounded-xl bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white">
                    <Images className="h-4 w-4 mr-2" />
                    Ver Album
                  </Button>
                )}
                {hasFacebookPost && (
                  <Button
                    onClick={openFacebookPost}
                    variant={hasAlbum ? "outline" : "default"}
                    className={`flex-1 rounded-xl ${!hasAlbum ? "bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white" : ""}`}
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Ver en Facebook
                  </Button>
                )}
                {!hasAlbum && !hasFacebookPost && (
                  <Button disabled variant="secondary" className="flex-1 rounded-xl">
                    Evento finalizado
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                {/* Más Información Button */}
                {event.moreInfo?.enabled && event.moreInfo.imageUrl && (
                  <Button
                    variant="outline"
                    onClick={() => setShowMoreInfoImage(true)}
                    className="rounded-xl"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Más Info
                  </Button>
                )}
                <Button
                  onClick={() => onRegister(event)}
                  disabled={!canRegister}
                  className="flex-1 rounded-xl bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white py-5"
                >
                  {canRegister ? "Registrarse" : "Registro no disponible"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* More Info Image Modal */}
      {showMoreInfoImage && event.moreInfo?.imageUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowMoreInfoImage(false)}
        >
          <div className="relative max-w-lg w-full max-h-[90vh]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMoreInfoImage(false)}
              className="absolute -top-12 right-0 text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden">
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
  )
}

export type { Event }
