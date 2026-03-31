"use client"

import Image from "next/image"
import { UserCircle, MapPin, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WhatsAppButton, WhatsAppIconButton } from "@/components/whatsapp-button"
import { formatPhoneForDisplay } from "@/lib/phone-utils"
import type { DirectivaMember } from "@/lib/types"

function DirectivaCard({ member }: { member: DirectivaMember }) {
  const openGoogleMaps = () => {
    if (member.googleMapsUrl) {
      window.open(member.googleMapsUrl, "_blank")
    }
  }

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow">
      {/* Photo */}
      <div className="relative h-48 w-full bg-muted">
        {member.photo ? (
          <Image
            src={member.photo}
            alt={member.fullName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="h-10 w-10 text-primary/50" />
            </div>
          </div>
        )}
        {/* Role Badge */}
        {member.role && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-primary-foreground">
              {member.role}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-foreground mb-1">{member.fullName}</h3>
        <p className="text-sm text-muted-foreground mb-1">{member.churchName}</p>
        <p className="text-xs text-muted-foreground mb-4">{formatPhoneForDisplay(member.phone)}</p>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <WhatsAppButton
            phone={member.phone}
            message={`Hola ${member.fullName}, me comunico del sitio web de Región Mayo.`}
            className="flex-1 rounded-xl"
          />
          {member.googleMapsUrl && (
            <Button
              variant="outline"
              size="icon"
              onClick={openGoogleMaps}
              className="rounded-xl h-10 w-10 shrink-0"
              aria-label="Ver ubicación en Maps"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface DirectivaContentProps {
  members: DirectivaMember[]
}

export function DirectivaContent({ members }: DirectivaContentProps) {
  return (
    <div className="px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <UserCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Directiva</h1>
            <p className="text-muted-foreground text-sm">Miembros de la directiva regional</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-muted/50 rounded-2xl p-4 mb-6 border">
          <p className="text-sm text-muted-foreground">
            Contacta a cualquier miembro de la directiva directamente por WhatsApp. 
            Estamos aquí para servirte.
          </p>
        </div>

        {/* Directiva Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <DirectivaCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </div>
  )
}
