"use client"

import { useState } from "react"
import Image from "next/image"
import { Music, MapPin, ExternalLink, ChevronDown, ChevronUp, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WhatsAppIconButton } from "@/components/whatsapp-button"
import { formatPhoneForDisplay } from "@/lib/phone-utils"
import type { Coro } from "@/lib/types"

function CoroCard({ coro }: { coro: Coro }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const openGoogleMaps = () => {
    if (coro.googleMapsUrl) {
      window.open(coro.googleMapsUrl, "_blank")
    }
  }

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow">
      {/* Photo */}
      <div className="relative h-48 w-full bg-muted">
        {coro.photo ? (
          <Image
            src={coro.photo}
            alt={coro.coroName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="h-10 w-10 text-primary/50" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-foreground mb-3">{coro.coroName}</h3>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between rounded-xl mb-2"
        >
          <span className="text-sm">Ver información de contacto</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t">
            {/* President Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground break-words">{coro.presidentName}</p>
                <p className="text-xs text-foreground/60">Presidente</p>
              </div>
              <WhatsAppIconButton 
                phone={coro.presidentPhone} 
                message={`Hola, me comunico del sitio web de Region Mayo respecto al ${coro.coroName}`}
              />
            </div>

            {/* Phone Number Display */}
            <p className="text-sm text-muted-foreground text-center">
              {formatPhoneForDisplay(coro.presidentPhone)}
            </p>

            {/* Google Maps Button */}
            {coro.googleMapsUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={openGoogleMaps}
                className="w-full rounded-xl"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Ver ubicación
                <ExternalLink className="h-3.5 w-3.5 ml-auto" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface CorosContentProps {
  coros: Coro[]
}

export function CorosContent({ coros }: CorosContentProps) {
  return (
    <div className="px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Music className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Coros Locales</h1>
            <p className="text-muted-foreground text-sm">Nuestros coros de la región</p>
          </div>
        </div>

        {/* Coros Grid - Centered when few cards */}
        <div className={`grid gap-4 ${
          coros.length === 1 
            ? "grid-cols-1 max-w-sm mx-auto" 
            : coros.length === 2 
            ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}>
          {coros.map((coro) => (
            <CoroCard key={coro.id} coro={coro} />
          ))}
        </div>
      </div>
    </div>
  )
}
