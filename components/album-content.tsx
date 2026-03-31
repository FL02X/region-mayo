"use client"

import Image from "next/image"
import { Images, ExternalLink, Calendar, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Event } from "@/lib/types"

function AlbumCard({ event }: { event: Event }) {
  const formatDate = (date: Date) => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  const hasAlbum = !!event.googleDriveAlbumUrl
  const isPastEvent = new Date(event.date) < new Date()

  const openAlbum = () => {
    if (event.googleDriveAlbumUrl) {
      window.open(event.googleDriveAlbumUrl, "_blank")
    }
  }

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow">
      {/* Event Image */}
      <div className="relative h-48 w-full">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover"
        />
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge 
            variant={isPastEvent ? "secondary" : "default"}
            className={isPastEvent ? "bg-white/90 text-foreground" : ""}
          >
            {isPastEvent ? "Evento Pasado" : "Próximamente"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2">{event.title}</h3>
        
        {/* Date & Location */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Album Button */}
        {isPastEvent ? (
          <Button
            onClick={openAlbum}
            disabled={!hasAlbum}
            variant={hasAlbum ? "default" : "secondary"}
            className="w-full rounded-xl"
          >
            <Images className="h-4 w-4 mr-2" />
            {hasAlbum ? "Ver Album en Google Drive" : "Album no disponible"}
            {hasAlbum && <ExternalLink className="h-3.5 w-3.5 ml-auto" />}
          </Button>
        ) : (
          <div className="text-center p-3 bg-muted/50 rounded-xl">
            <p className="text-sm text-muted-foreground">
              El album estará disponible después del evento
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

interface AlbumContentProps {
  events: Event[]
}

export function AlbumContent({ events }: AlbumContentProps) {
  // Album cards: only events with album enabled.
  const eventsWithAlbums = events.filter((event) => event.albumEnabled)

  return (
    <div className="px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Images className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Album de Actividades</h1>
            <p className="text-muted-foreground text-sm">Revive los momentos especiales de nuestros eventos</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-muted/50 rounded-2xl p-4 mb-6 border">
          <p className="text-sm text-muted-foreground">
            Los albums de fotos se almacenan en Google Drive. Después de cada evento, 
            podrás acceder al album para ver y compartir tus fotos favoritas.
          </p>
        </div>

        {/* Albums Grid */}
        {eventsWithAlbums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventsWithAlbums.map((event) => (
              <AlbumCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-8 text-center border shadow-sm">
            <Images className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-foreground font-medium mb-1">
              Sin albums disponibles
            </p>
            <p className="text-sm text-muted-foreground">
              Los albums se publicarán después de los eventos.
            </p>
          </div>
        )}

        {/* Future Integration Note - Hidden in production, visible in code */}
        {/* 
          TODO: Google Drive API Integration
          - Use Google Drive API to fetch images from folders
          - Implement lazy loading for mobile data optimization
          - Add image gallery modal with swipe navigation
          - Consider caching strategy for frequently accessed albums
        */}
      </div>
    </div>
  )
}
