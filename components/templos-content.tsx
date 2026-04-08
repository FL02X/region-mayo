"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  MapPin,
  ExternalLink,
  Phone,
  Church,
  Mic,
  Music,
  Users,
  FileText,
} from "lucide-react";
import { WhatsAppIconButton } from "@/components/whatsapp-button";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import type { Templo } from "@/lib/types";

function TemploCard({ templo }: { templo: Templo }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const openGoogleMaps = () => {
    if (templo.googleMapsUrl) window.open(templo.googleMapsUrl, "_blank");
  };

  const hasExpandableContent =
    !!templo.phone ||
    templo.pastores.length > 0 ||
    templo.coros.length > 0 ||
    !!templo.description ||
    !!templo.presidenteJovenesName ||
    !!templo.googleMapsUrl;

  return (
    <div className="bg-card border border-border overflow-hidden">
      {/* Photo */}
      <div className="relative h-44 w-full bg-muted">
        {templo.photo ? (
          <Image
            src={templo.photo}
            alt={templo.temploName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Church
              className="h-8 w-8 text-muted-foreground/30"
              aria-hidden="true"
            />
          </div>
        )}
        {/* Church number badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-foreground/80 text-background text-xs font-semibold px-2 py-0.5">
            #{templo.churchNumber}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-base text-foreground leading-snug mb-1">
          {templo.temploName}
        </h3>

        {/* Address preview (always visible if present) */}
        {templo.address && (
          <div className="flex items-start gap-2 mb-2">
            <MapPin
              className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-xs text-muted-foreground truncate">
              {templo.address}
            </p>
          </div>
        )}

        {/* Toggle — only shown if there is expandable content */}
        {hasExpandableContent && (
          <div className="border-t border-border">
            <button
              onClick={() => setIsExpanded((v) => !v)}
              className="w-full flex items-center justify-between py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-expanded={isExpanded}
              aria-controls={`templo-details-${templo.id}`}
              style={{ background: "none", border: "none" }}
            >
              <span>
                {isExpanded ? "Ocultar información" : "Ver información"}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div
                id={`templo-details-${templo.id}`}
                className="space-y-3 pt-1 pb-1"
              >
                {/* Phone */}
                {templo.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone
                      className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                      aria-hidden="true"
                    />
                    <p className="text-sm text-foreground flex-1">
                      {formatPhoneForDisplay(templo.phone)}
                    </p>
                    <WhatsAppIconButton
                      phone={templo.phone}
                      message={`Hola, me comunico del sitio web de Region Mayo respecto al ${templo.temploName}`}
                    />
                  </div>
                )}

                {/* Pastores */}
                {templo.pastores.length > 0 && (
                  <div className="space-y-2">
                    {templo.pastores.map((pastor) => (
                      <div key={pastor.id} className="flex items-center gap-2.5">
                        <Mic
                          className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                          aria-hidden="true"
                        />
                        <p className="text-sm text-foreground flex-1">
                          {pastor.fullName}
                        </p>
                        {pastor.phone && (
                          <WhatsAppIconButton
                            phone={pastor.phone}
                            message={`Hola ${pastor.fullName}, me comunico del sitio web de Region Mayo.`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Coros */}
                {templo.coros.length > 0 && (
                  <div className="space-y-2">
                    {templo.coros.map((coro) => (
                      <div key={coro.id} className="flex items-start gap-2.5">
                        <Music
                          className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            {coro.coroName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Pdte. Coro: {coro.presidentName}
                          </p>
                        </div>
                        <WhatsAppIconButton
                          phone={coro.presidentPhone}
                          message={`Hola, me comunico del sitio web de Region Mayo respecto al ${coro.coroName}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Description / Schedule */}
                {templo.description && (
                  <div className="flex items-start gap-2.5">
                    <FileText
                      className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground mb-0.5 uppercase tracking-wide">
                        Horarios y actividades
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                        {templo.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Presidente de Jóvenes */}
                {templo.presidenteJovenesName && (
                  <div className="flex items-center gap-2.5">
                    <Users
                      className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {templo.presidenteJovenesName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pdte. de Jóvenes Local
                      </p>
                    </div>
                    {templo.presidenteJovenesPhone && (
                      <WhatsAppIconButton
                        phone={templo.presidenteJovenesPhone}
                        message={`Hola ${templo.presidenteJovenesName}, me comunico del sitio web de Region Mayo.`}
                      />
                    )}
                  </div>
                )}

                {/* Maps link */}
                {templo.googleMapsUrl && (
                  <div className="border-t border-border pt-3 mt-1">
                    <button
                      onClick={openGoogleMaps}
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors w-full"
                      style={{ background: "none", border: "none" }}
                      aria-label={`Ver ubicación de ${templo.temploName} en Google Maps`}
                    >
                      <MapPin
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="flex-1 text-left">
                        Ver ubicación en Maps
                      </span>
                      <ExternalLink
                        className="h-3 w-3 shrink-0"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface TemploContentProps {
  templos: Templo[];
}

export function TemplosContent({ templos }: TemploContentProps) {
  return (
    <div className="px-4 py-6" id="main-content">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">Templos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Iglesias de la Región Mayo
          </p>
        </div>

        {templos.length === 0 ? (
          <div className="bg-card border border-border p-8 text-center">
            <Church
              className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground mb-1">
              Sin templos registrados
            </p>
            <p className="text-xs text-muted-foreground">
              Los templos de la región se mostrarán aquí cuando estén
              disponibles.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-4 ${
              templos.length === 1
                ? "grid-cols-1 max-w-sm mx-auto"
                : templos.length === 2
                  ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {templos.map((templo) => (
              <TemploCard key={templo.id} templo={templo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
