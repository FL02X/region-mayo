"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  UserCircle,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Church,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { SearchBar } from "@/components/search-bar";
import { HighlightedText } from "@/components/highlighted-text";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { searchItems, SEARCH_CONFIGS } from "@/lib/search-utils";
import type { DirectivaMember } from "@/lib/types";

function DirectivaCard({ member, searchQuery }: { member: DirectivaMember; searchQuery: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const openGoogleMaps = () => {
    if (member.googleMapsUrl) {
      window.open(member.googleMapsUrl, "_blank");
    }
  };

  return (
    <div className="bg-card border border-border overflow-hidden flex flex-col h-full">
      {/* Photo */}
      <div className="relative h-60 w-full bg-muted shrink-0">
        {member.photo ? (
          <Image
            src={member.photo}
            alt={member.fullName}
            fill
            className="object-cover object-center"
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
              <HighlightedText text={member.role} query={searchQuery} />
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-lg text-foreground leading-snug mb-4">
          <HighlightedText text={member.fullName} query={searchQuery} />
        </h3>

        <div className="space-y-4 pt-4 border-t border-border mt-auto">
          {/* Temple Information */}
          {member.temploName && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Church
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Iglesia Sede
                  </p>
                  <p className="text-sm font-medium text-foreground leading-tight mb-1">
                    <HighlightedText text={member.temploName} query={searchQuery} />
                  </p>
                  {member.address && (
                    <div className="flex items-start gap-1.5 mb-1.5">
                      <MapPin
                        className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <p className="text-sm text-foreground/80 leading-tight">
                        <HighlightedText text={member.address} query={searchQuery} />
                      </p>
                    </div>
                  )}
                  {member.googleMapsUrl && (
                    <button
                      onClick={openGoogleMaps}
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                      aria-label={`Ver ubicación de ${member.temploName} en Google Maps`}
                    >
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Ver ubicación</span>
                      <ExternalLink
                        className="h-3 w-3 shrink-0"
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Phone display with icon */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Phone
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Número de Teléfono
                </p>
                <p className="text-sm font-medium text-foreground leading-tight">
                  <HighlightedText text={formatPhoneForDisplay(member.phone)} query={searchQuery} />
                </p>
              </div>
            </div>

            {/* WhatsApp Button - Green */}
            <WhatsAppButton
              phone={member.phone}
              message={`Hola ${member.fullName}, me comunico del sitio web de Región Mayo.`}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
            />
        </div>
      </div>
    </div>
  );
}

interface DirectivaContentProps {
  members: DirectivaMember[];
}

export function DirectivaContent({ members }: DirectivaContentProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = useMemo(
    () => searchItems(members, searchQuery, SEARCH_CONFIGS.directiva),
    [members, searchQuery],
  );

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

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearchChange={setSearchQuery}
            placeholder="Buscar por nombre, cargo, templo o teléfono..."
            autoFocus
          />
        </div>

        {/* Info notice — plain, no icon circle */}
        <div className="border border-border bg-muted/30 p-4 mb-6 text-sm text-muted-foreground">
          Contacta a cualquier miembro de la directiva directamente por
          WhatsApp. Estamos aquí para servirte.
        </div>

        {/* Grid */}
        <div
          className={`grid gap-4 ${
            filteredMembers.length === 1
              ? "grid-cols-1 max-w-sm mx-auto"
              : filteredMembers.length === 2
                ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {filteredMembers.length === 0 ? (
            <div className="col-span-full bg-card border border-border p-8 text-center">
              <UserCircle
                className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-foreground mb-1">
                {members.length === 0
                  ? "Sin miembros de directiva registrados"
                  : "No se encontraron resultados"}
              </p>
              <p className="text-xs text-muted-foreground">
                {members.length === 0
                  ? "La información se actualizará pronto."
                  : "Intenta con otros términos de búsqueda."}
              </p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <DirectivaCard
                key={member.id}
                member={member}
                searchQuery={searchQuery}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
