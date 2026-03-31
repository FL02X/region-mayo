"use client"

import Image from "next/image"
import { Users, MapPin, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WhatsAppIconButton } from "@/components/whatsapp-button"
import type { Pastor } from "@/lib/types"

function PastorCard({ pastor }: { pastor: Pastor }) {
  const openGoogleMaps = () => {
    if (pastor.googleMapsUrl) {
      window.open(pastor.googleMapsUrl, "_blank")
    }
  }

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow">
      {/* Photo */}
      <div className="relative h-48 w-full bg-muted">
        {pastor.photo ? (
          <Image
            src={pastor.photo}
            alt={pastor.fullName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-10 w-10 text-primary/50" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-foreground mb-1">{pastor.fullName}</h3>
        <p className="text-sm text-muted-foreground mb-3">{pastor.churchName}</p>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {pastor.googleMapsUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={openGoogleMaps}
              className="flex-1 rounded-xl"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Ver en Maps
              <ExternalLink className="h-3.5 w-3.5 ml-auto" />
            </Button>
          )}
          {pastor.phone && (
            <WhatsAppIconButton 
              phone={pastor.phone}
              message={`Hola ${pastor.fullName}, me comunico del sitio web de Región Mayo.`}
              className="shrink-0"
            />
          )}
        </div>
      </div>
    </div>
  )
}

interface DirectorioContentProps {
  pastors: Pastor[]
}

export function DirectorioContent({ pastors }: DirectorioContentProps) {
  return (
    <div className="px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Directorio de Pastores</h1>
            <p className="text-muted-foreground text-sm">Nuestros siervos en la Región Mayo</p>
          </div>
        </div>

        {/* Pastors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pastors.map((pastor) => (
            <PastorCard key={pastor.id} pastor={pastor} />
          ))}
        </div>
      </div>
    </div>
  )
}
