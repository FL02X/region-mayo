"use client";

import Image from "next/image";
import { Images, ExternalLink, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfflineImagePlaceholder } from "@/components/shared/offline-image-placeholder";
import type { Event } from "@/lib/types";
import { ALBUM_SHARING_ENABLED } from "@/lib/countdown-utils";

function AlbumCard({ event }: { event: Event }) {
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
    return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  };

  const hasAlbum = !!event.googleDriveAlbumUrl;
  const isPastEvent = new Date(event.date) < new Date();

  const openAlbum = () => {
    if (event.googleDriveAlbumUrl) {
      window.open(event.googleDriveAlbumUrl, "_blank");
    }
  };

  return (
    <article className="desktop-card-lift bg-card border border-border overflow-hidden">
      {/* Image */}
      <div className="offline-aware-image offline-aware-image--fixed relative h-40 w-full bg-muted">
        {event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="offline-image-online object-cover"
          />
        ) : (
          <Images
            className="offline-image-online absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/30"
            aria-hidden="true"
          />
        )}
        <OfflineImagePlaceholder />
        {/* Status label */}
        <div className="absolute top-3 right-3">
          <span
            className={`text-[13px] font-semibold px-2 py-1 ${
              isPastEvent
                ? "bg-white/90 text-foreground"
                : "bg-primary/90 text-white"
            }`}
          >
            {isPastEvent ? "Finalizado" : "Próximo"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-base text-foreground mb-2 line-clamp-2 leading-snug">
          {event.title}
        </h3>

        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {isPastEvent ? (
          <Button
            onClick={openAlbum}
            disabled={!hasAlbum}
            variant={hasAlbum ? "default" : "secondary"}
            className={`w-full text-sm ${
              hasAlbum ? "bg-primary hover:bg-primary/90 text-white" : ""
            }`}
            aria-label={
              hasAlbum
                ? `Ver álbum de ${event.title} en Google Drive`
                : "Álbum no disponible"
            }
          >
            <Images className="h-4 w-4 mr-2" aria-hidden="true" />
            {hasAlbum ? "Ver Álbum en Drive" : "Álbum no disponible"}
            {hasAlbum && (
              <ExternalLink
                className="h-3.5 w-3.5 ml-auto"
                aria-hidden="true"
              />
            )}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2.5 border border-border">
            El álbum estará disponible después del evento
          </p>
        )}
      </div>
    </article>
  );
}

interface AlbumContentProps {
  events: Event[];
}

export function AlbumContent({ events }: AlbumContentProps) {
  const eventsWithAlbums = ALBUM_SHARING_ENABLED
    ? events.filter((event) => event.albumEnabled)
    : [];

  return (
    <div className="w-full relative pb-20 bg-[#f1f1f1]" id="main-content">
      <div className="desktop-content-pane max-w-[950px] mx-auto px-4 md:px-8 py-8 pt-[82px] md:pt-[88px] bg-[#ffffff] md:border-x border-[#dce2e9] dark:border-[#27272a] min-h-screen focus:outline-none">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-[1.825rem] font-semibold text-foreground tracking-tight">
            Álbum de Actividades
          </h1>
          <p className="text-[15px] text-muted-foreground mt-2">
            Revive los momentos especiales de nuestros eventos
          </p>
        </div>

        {/* Info notice */}
        <div className="border border-border bg-muted/30 p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            Los álbumes se almacenan en Google Drive. Después de cada evento
            podrás acceder para ver y compartir tus fotos favoritas.
          </p>
        </div>

        {/* Grid */}
        {eventsWithAlbums.length > 0 ? (
          <div
            className={`grid gap-4 ${
              eventsWithAlbums.length === 1
                ? "grid-cols-1 max-w-sm mx-auto"
                : eventsWithAlbums.length === 2
                  ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {eventsWithAlbums.map((event) => (
              <AlbumCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border p-8 text-center">
            <Images
              className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground mb-1">
              Sin álbumes disponibles
            </p>
            <p className="text-xs text-muted-foreground">
              Los álbumes se publicarán después de los eventos.
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
