"use client";

import Image from "next/image";
import { Users, MapPin, ExternalLink } from "lucide-react";
import { WhatsAppIconButton } from "@/components/whatsapp-button";
import type { Pastor } from "@/lib/types";

function PastorCard({ pastor }: { pastor: Pastor }) {
  const openGoogleMaps = () => {
    if (pastor.googleMapsUrl) {
      window.open(pastor.googleMapsUrl, "_blank");
    }
  };

  return (
    <div className="bg-card border border-border overflow-hidden">
      {/* Photo */}
      <div className="relative h-44 w-full bg-muted">
        {pastor.photo ? (
          <Image
            src={pastor.photo}
            alt={pastor.fullName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Users
              className="h-8 w-8 text-muted-foreground/30"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-base text-foreground leading-snug mb-0.5">
          {pastor.fullName}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {pastor.churchName}
        </p>

        <div className="flex items-center gap-3">
          {pastor.googleMapsUrl && (
            <button
              onClick={openGoogleMaps}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors flex-1"
              aria-label={`Ver ubicación de ${pastor.fullName} en Maps`}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Ver en Maps
              <ExternalLink
                className="h-3 w-3 ml-auto shrink-0"
                aria-hidden="true"
              />
            </button>
          )}
          {pastor.phone && (
            <WhatsAppIconButton
              phone={pastor.phone}
              message={`Hola ${pastor.fullName}, me comunico del sitio web de Región Mayo.`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface DirectorioContentProps {
  pastors: Pastor[];
}

export function DirectorioContent({ pastors }: DirectorioContentProps) {
  return (
    <div className="px-4 py-6" id="main-content">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">
            Directorio de Pastores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Nuestros siervos en la Región Mayo
          </p>
        </div>

        {pastors.length === 0 ? (
          <div className="bg-card border border-border p-8 text-center">
            <Users
              className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground mb-1">
              Sin pastores registrados
            </p>
            <p className="text-xs text-muted-foreground">
              El directorio se actualizará pronto.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-4 ${
              pastors.length === 1
                ? "grid-cols-1 max-w-sm mx-auto"
                : pastors.length === 2
                  ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {pastors.map((pastor) => (
              <PastorCard key={pastor.id} pastor={pastor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
