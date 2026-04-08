"use client";

import Image from "next/image";
import { UserCircle, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  WhatsAppButton,
  WhatsAppIconButton,
} from "@/components/whatsapp-button";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import type { DirectivaMember } from "@/lib/types";

function DirectivaCard({ member }: { member: DirectivaMember }) {
  const openGoogleMaps = () => {
    if (member.googleMapsUrl) {
      window.open(member.googleMapsUrl, "_blank");
    }
  };

  return (
    <div className="bg-card border border-border overflow-hidden">
      {/* Photo */}
      <div className="relative h-44 w-full bg-muted">
        {member.photo ? (
          <Image
            src={member.photo}
            alt={member.fullName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <UserCircle
              className="h-10 w-10 text-muted-foreground/30"
              aria-hidden="true"
            />
          </div>
        )}
        {member.role && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-foreground/85 text-background text-xs font-medium">
              {member.role}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-base text-foreground mb-0.5">
          {member.fullName}
        </h3>
        <p className="text-sm text-muted-foreground mb-0.5">
          {member.churchName}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          {formatPhoneForDisplay(member.phone)}
        </p>

        <div className="flex gap-2">
          <WhatsAppButton
            phone={member.phone}
            message={`Hola ${member.fullName}, me comunico del sitio web de Región Mayo.`}
            className="flex-1"
          />
          {member.googleMapsUrl && (
            <button
              onClick={openGoogleMaps}
              className="flex items-center justify-center h-10 w-10 border border-border hover:bg-muted transition-colors shrink-0"
              aria-label={`Ver ubicación de ${member.fullName} en Maps`}
            >
              <MapPin
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface DirectivaContentProps {
  members: DirectivaMember[];
}

export function DirectivaContent({ members }: DirectivaContentProps) {
  return (
    <div className="px-4 py-6" id="main-content">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">Directiva</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Miembros de la directiva regional
          </p>
        </div>

        {/* Info notice — plain, no icon circle */}
        <div className="border border-border bg-muted/30 p-4 mb-6 text-sm text-muted-foreground">
          Contacta a cualquier miembro de la directiva directamente por
          WhatsApp. Estamos aquí para servirte.
        </div>

        {/* Grid */}
        <div
          className={`grid gap-4 ${
            members.length === 1
              ? "grid-cols-1 max-w-sm mx-auto"
              : members.length === 2
                ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {members.map((member) => (
            <DirectivaCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
}
