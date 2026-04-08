"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Music,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import { WhatsAppIconButton } from "@/components/whatsapp-button";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import type { Coro } from "@/lib/types";

function CoroCard({ coro }: { coro: Coro }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const openGoogleMaps = () => {
    if (coro.googleMapsUrl) {
      window.open(coro.googleMapsUrl, "_blank");
    }
  };

  return (
    <div className="bg-card border border-border overflow-hidden">
      {/* Photo */}
      <div className="relative h-44 w-full bg-muted">
        {coro.photo ? (
          <Image
            src={coro.photo}
            alt={coro.coroName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Music
              className="h-8 w-8 text-muted-foreground/30"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-foreground mb-3 leading-snug">
          {coro.coroName}
        </h3>

        {/* Toggle contact */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground py-2.5 border-t border-border transition-colors"
          aria-expanded={isExpanded}
        >
          <span>Ver información de contacto</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
        </button>

        {isExpanded && (
          <div className="space-y-3 pt-3">
            {/* President row */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {coro.presidentName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Presidente · {formatPhoneForDisplay(coro.presidentPhone)}
                </p>
              </div>
              <WhatsAppIconButton
                phone={coro.presidentPhone}
                message={`Hola, me comunico del sitio web de Region Mayo respecto al ${coro.coroName}`}
              />
            </div>

            {/* Maps link */}
            {coro.googleMapsUrl && (
              <button
                onClick={openGoogleMaps}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors w-full"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="flex-1 text-left">Ver ubicación</span>
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface CorosContentProps {
  coros: Coro[];
}

export function CorosContent({ coros }: CorosContentProps) {
  return (
    <div className="px-4 py-6" id="main-content">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">Coros Locales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Nuestros coros de la región
          </p>
        </div>

        {coros.length === 0 ? (
          <div className="border border-border bg-card p-8 text-center">
            <Music
              className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground mb-1">
              Sin coros registrados
            </p>
            <p className="text-xs text-muted-foreground">
              La información de los coros estará disponible próximamente.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-4 ${
              coros.length === 1
                ? "grid-cols-1 max-w-sm mx-auto"
                : coros.length === 2
                  ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {coros.map((coro) => (
              <CoroCard key={coro.id} coro={coro} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
