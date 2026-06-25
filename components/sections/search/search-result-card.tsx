// Donde: lista de resultados en /buscar. Viewports: desktop y mobile. Funcion: muestra una tarjeta clickeable para cada resultado encontrado.
import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronRight, Church, Music, UserCircle, Users } from "lucide-react";
import { highlightText } from "@/lib/search-utils";
import { formatRegionLongDate } from "@/lib/region-date";
import type { Coro, DirectivaMember, Event, Pastor, Templo } from "@/lib/types";
import type { SearchResultItem } from "@/components/sections/search/search-types";

function ResultHighlightedText({ text, query }: { text: string; query: string }) {
  if (!text) return null;

  const parts = highlightText(text, query);

  return (
    <span className="break-words">
      {parts.map((part, index) =>
        part.isMatch ? (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-900/50 text-inherit rounded px-0.5 no-underline font-semibold"
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </span>
  );
}

function getResultDisplay(result: SearchResultItem) {
  const { item, type } = result;

  if (type === "pastor") {
    const pastor = item as Pastor;
    return {
      title: pastor.fullName,
      subtitle: pastor.temploName || "",
      description: pastor.phone || "",
      photo: pastor.photo || "",
      Icon: Users,
    };
  }

  if (type === "coro") {
    const coro = item as Coro;
    return {
      title: coro.coroName,
      subtitle: coro.temploName || "",
      description: coro.presidentName ? `Presidente: ${coro.presidentName}` : "",
      photo: coro.photo || "",
      Icon: Music,
    };
  }

  if (type === "directiva") {
    const member = item as DirectivaMember;
    return {
      title: member.fullName,
      subtitle: member.role || "",
      description: member.temploName || "",
      photo: member.photo || "",
      Icon: UserCircle,
    };
  }

  if (type === "templo") {
    const templo = item as Templo;
    return {
      title: templo.temploName,
      subtitle: templo.address || "",
      description: templo.pastores?.map((pastor) => pastor.fullName).join(", ") || "",
      photo: templo.photos && templo.photos.length > 0 ? templo.photos[0] : "",
      Icon: Church,
    };
  }

  const event = item as Event;
  return {
    title: event.title,
    subtitle: event.location || "",
    description: event.date ? formatRegionLongDate(new Date(event.date)) : "",
    photo: event.image || "",
    Icon: Calendar,
  };
}

export function SearchResultCard({
  result,
  index,
  query,
}: {
  result: SearchResultItem;
  index: number;
  query: string;
}) {
  const { item, type, label, pathPrefix } = result;
  const { title, subtitle, description, photo, Icon } = getResultDisplay(result);

  return (
    <Link
      key={`${type}-${item.id}-${index}`}
      href={`${pathPrefix}#${item.id}`}
      className="desktop-card-lift group flex flex-col sm:flex-row bg-card border border-border/80 overflow-hidden hover:border-[#2f5e93] hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] transition-all duration-200 relative active:scale-[0.997]"
    >
      <div className="offline-hide-when-offline w-full sm:w-[120px] h-[160px] sm:h-auto bg-muted shrink-0 relative flex items-center justify-center border-b sm:border-b-0 sm:border-r border-border pointer-events-none">
        {photo ? (
          <Image
            src={photo}
            alt={title}
            fill
            className="object-cover object-center pointer-events-none select-none"
            draggable={false}
          />
        ) : (
          <Icon className="h-8 w-8 text-muted-foreground/30" />
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 sm:pr-4 pointer-events-none">
        <span className="text-[13px] font-semibold tracking-[0.14em] text-[#2f5e93] mb-4 uppercase">
          {label}
        </span>
        <h3 className="text-[20px] sm:text-[21px] font-semibold text-[#222b35] dark:text-gray-100 sm:group-hover:text-[#2f5e93] transition-colors leading-snug mb-1 tracking-tight">
          <ResultHighlightedText text={title} query={query} />
        </h3>
        {subtitle ? (
          <p className="text-[16px] font-medium text-foreground mb-1">
            <ResultHighlightedText text={subtitle} query={query} />
          </p>
        ) : null}
        {description ? (
          <p className="text-[16px] text-muted-foreground">
            <ResultHighlightedText text={description} query={query} />
          </p>
        ) : null}
        <div className="mt-6 sm:hidden flex items-center justify-end gap-1 text-[15px] uppercase tracking-wide text-[#2f5e93]">
          <span className="font-bold">Toca para ver información</span>
          <ChevronRight className="h-7 w-7" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
