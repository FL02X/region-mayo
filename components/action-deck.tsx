"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Headphones,
  HeartHandshake,
  Instagram as InstagramIcon,
  Play,
  Megaphone,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import type { Event } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — each candidate slot the deck can show
// ─────────────────────────────────────────────────────────────────────────────

type DeckItem =
  | {
      id: string;
      type: "event";
      title: string;
      date: Date;
      time?: string;
      location?: string;
      image?: string;
      pinned?: boolean;
      href?: string;
    }
  | {
      id: string;
      type: "instagram";
      title: string;
      postedAt: Date;
      image: string;
      href: string;
      postType?: "reel" | "post";
      pinned?: boolean;
    }
  | {
      id: string;
      type: "prayer";
      title: string;
      updatedAt: Date;
      href?: string;
      pinned?: boolean;
    }
  | {
      id: string;
      type: "promo";
      title: string;
      image?: string;
      href?: string;
      pinned?: boolean;
    }
  | {
      id: string;
      type: "audio";
      title: string;
      audioUrl?: string;
      href?: string;
      pinned?: boolean;
    };

type DeckItemType = DeckItem["type"];

const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;

// ─────────────────────────────────────────────────────────────────────────────
// SCORING — see plan: event <24h +1000, promo +600, prayer <24h +400, IG decays
// ─────────────────────────────────────────────────────────────────────────────

function scoreItem(item: DeckItem, now = Date.now()): number {
  let score = 0;

  switch (item.type) {
    case "event": {
      const diff = item.date.getTime() - now;
      if (diff <= MS_DAY && diff > -2 * MS_HOUR) score += 1000;
      else if (diff <= 7 * MS_DAY && diff > 0) score += 300;
      else if (diff > 0) score += 50;
      break;
    }
    case "promo":
      score += 600;
      break;
    case "prayer": {
      const hoursSince = (now - item.updatedAt.getTime()) / MS_HOUR;
      if (hoursSince <= 24) score += 400;
      else score += 80;
      break;
    }
    case "instagram": {
      const hoursSince = (now - item.postedAt.getTime()) / MS_HOUR;
      score += Math.max(0, 200 - hoursSince);
      break;
    }
    case "audio":
      score += 60;
      break;
  }

  if (item.pinned) score += 2000;
  return score;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK NON-EVENT CANDIDATES — ready to be swapped for real data later
// ─────────────────────────────────────────────────────────────────────────────

function getMockNonEventCandidates(now: number): DeckItem[] {
  return [
    {
      id: "prayer-wall",
      type: "prayer",
      title: "Muro de oraciones · comparte tu petición",
      updatedAt: new Date(now - 6 * MS_HOUR),
      href: "#oraciones",
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const DESKTOP_VISIBLE_COUNT = 3;

interface ActionDeckProps {
  events: Event[];
}

export function ActionDeck({ events }: ActionDeckProps) {
  const [desktopStartIndex, setDesktopStartIndex] = useState(0);

  const deck = useMemo<DeckItem[]>(() => {
    const now = Date.now();

    const eventItems: DeckItem[] = events
      .filter((e) => e.date.getTime() > now - 2 * MS_HOUR)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 4)
      .map((e) => ({
        id: `event-${e.id}`,
        type: "event",
        title: e.title,
        date: e.date,
        time: e.time,
        location: e.location,
        image: e.image,
        href: `#${e.id}`,
      }));

    const candidates = [...eventItems, ...getMockNonEventCandidates(now)];

    return candidates
      .map((item) => ({ item, score: scoreItem(item, now) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((s) => s.item);
  }, [events]);

  if (deck.length === 0) return null;

  const canShowMore = desktopStartIndex + DESKTOP_VISIBLE_COUNT < deck.length;

  const handleShowMore = () => {
    setDesktopStartIndex((prev) =>
      Math.min(prev + DESKTOP_VISIBLE_COUNT, deck.length - DESKTOP_VISIBLE_COUNT)
    );
  };

  // Items visible on desktop (paginated)
  const desktopVisibleItems = deck.slice(
    desktopStartIndex,
    desktopStartIndex + DESKTOP_VISIBLE_COUNT
  );

  return (
    <section
      aria-label="Acciones destacadas"
      className="w-full bg-white py-4 md:py-5 border-b border-[#ececec]"
    >
      <div className="flex items-center justify-between px-4 md:px-6 mb-2.5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#425060]">
          Destacado para ti
        </h2>
        {/* Mobile only: swipe hint */}
        <span className="md:hidden text-[11px] text-[#8a96a4]">
          Desliza para ver más
        </span>
      </div>

      {/* Mobile: horizontal scroll */}
      <div
        className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-1"
        style={{
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
        role="list"
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {deck.map((item, idx) => (
          <DeckCard key={item.id} item={item} featured={idx === 0} />
        ))}
      </div>

      {/* Desktop: grid with arrow navigation */}
      <div className="hidden md:block relative px-6">
        <div className="grid grid-cols-3 gap-4" role="list">
          {desktopVisibleItems.map((item, idx) => (
            <DeckCard
              key={item.id}
              item={item}
              featured={desktopStartIndex === 0 && idx === 0}
              isDesktop
            />
          ))}
        </div>

        {/* Arrow button for navigation */}
        {canShowMore && (
          <button
            onClick={handleShowMore}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/[0.04] hover:bg-black/[0.08] transition-colors"
            aria-label="Ver más elementos"
          >
            <ChevronRight className="h-5 w-5 text-[#425060]" />
          </button>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_META: Record<
  DeckItemType,
  { label: string; classes: string; icon: ReactNode }
> = {
  event: {
    label: "Evento",
    classes: "bg-[#2f5e93] text-white",
    icon: <Calendar className="h-3 w-3" aria-hidden="true" />,
  },
  instagram: {
    label: "Instagram",
    classes: "bg-[#f4edfa] text-[#6d49a8]",
    icon: <InstagramIcon className="h-3 w-3" aria-hidden="true" />,
  },
  prayer: {
    label: "Oración",
    classes: "bg-[#e7f1ea] text-[#2d6a4f]",
    icon: <HeartHandshake className="h-3 w-3" aria-hidden="true" />,
  },
  promo: {
    label: "Novedad",
    classes: "bg-[#fef3c7] text-[#92400e]",
    icon: <Megaphone className="h-3 w-3" aria-hidden="true" />,
  },
  audio: {
    label: "Audio",
    classes: "bg-[#eef2ff] text-[#3730a3]",
    icon: <Headphones className="h-3 w-3" aria-hidden="true" />,
  },
};

const CTA_LABEL: Record<DeckItemType, string> = {
  event: "Ver evento",
  instagram: "Ver publicación",
  prayer: "Agregar petición",
  promo: "Ver más",
  audio: "Escuchar",
};

function DeckCard({
  item,
  featured,
  isDesktop = false,
}: {
  item: DeckItem;
  featured: boolean;
  isDesktop?: boolean;
}) {
  // Mobile: featured card is wider; Desktop: all cards equal width in grid
  const widthClass = isDesktop
    ? "w-full"
    : featured
      ? "w-[84vw] max-w-[360px]"
      : "w-[70vw] max-w-[260px]";

  const imageHeight = featured && !isDesktop ? "h-28" : "h-24";

  const image =
    (item.type === "event" || item.type === "instagram" || item.type === "promo") &&
    "image" in item
      ? item.image
      : undefined;

  const href = "href" in item ? item.href : undefined;
  const badge = BADGE_META[item.type];

  const inner = (
    <article
      className={[
        "snap-center shrink-0 relative overflow-hidden flex flex-col",
        "bg-white border border-[#dce2e9] rounded-[3px]",
        "hover:border-[#9fb0c5] hover:shadow-[0_2px_10px_rgba(47,94,147,0.08)] transition-all",
        widthClass,
      ].join(" ")}
    >
      {image ? (
        <div className={`relative w-full ${imageHeight} bg-[#f1f1f1]`}>
          <Image
            src={image}
            alt={item.title}
            fill
            sizes={isDesktop ? "300px" : "(max-width: 768px) 80vw, 360px"}
            className="object-cover"
          />
          {item.type === "instagram" && item.postType === "reel" && (
            <div className="absolute top-2 right-2 bg-black/55 rounded-full h-6 w-6 flex items-center justify-center">
              <Play className="h-3 w-3 text-white" fill="white" />
            </div>
          )}
        </div>
      ) : null}

      <div className="flex flex-col flex-1 p-3">
        <span
          className={`inline-flex self-start items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-[0.08em] ${badge.classes} mb-2`}
        >
          {badge.icon}
          {badge.label}
        </span>

        <h3
          className={`font-bold text-[#1f2833] leading-snug line-clamp-2 mb-1.5 ${
            featured && !isDesktop ? "text-[15px]" : "text-[13px]"
          }`}
        >
          {item.title}
        </h3>

        {item.type === "event" && (
          <div className="space-y-0.5 mb-2">
            <p className="text-[12px] text-[#5b6876] flex items-center gap-1.5">
              <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
              {formatEventDate(item.date)}
              {item.time ? ` · ${item.time}` : ""}
            </p>
            {item.location && (
              <p className="text-[12px] text-[#5b6876] flex items-center gap-1.5 min-w-0">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.location}</span>
              </p>
            )}
          </div>
        )}

        {item.type === "instagram" && (
          <p className="text-[12px] text-[#5b6876] mb-2">
            @mgrregionmayo · hace{" "}
            {Math.max(
              1,
              Math.round((Date.now() - item.postedAt.getTime()) / MS_HOUR),
            )}
            h
          </p>
        )}

        {item.type === "prayer" && (
          <p className="text-[12px] text-[#5b6876] mb-2">
            La comunidad está orando · únete
          </p>
        )}

        {item.type === "promo" && (
          <p className="text-[12px] text-[#5b6876] mb-2">Disponible ahora</p>
        )}

        {item.type === "audio" && (
          <p className="text-[12px] text-[#5b6876] mb-2">Cápsula de audio</p>
        )}

        <div className="mt-auto pt-1">
          <span
            className={`inline-flex items-center gap-1 text-[12px] font-semibold ${
              featured && !isDesktop ? "text-[#2f5e93]" : "text-[#425060]"
            }`}
          >
            {CTA_LABEL[item.type]}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </span>
        </div>
      </div>
    </article>
  );

  if (href?.startsWith("http")) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93] rounded-[3px]"
        role="listitem"
        aria-label={`${BADGE_META[item.type].label}: ${item.title}`}
      >
        {inner}
      </a>
    );
  }
  if (href) {
    return (
      <Link
        href={href}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93] rounded-[3px]"
        role="listitem"
        aria-label={`${BADGE_META[item.type].label}: ${item.title}`}
      >
        {inner}
      </Link>
    );
  }
  return (
    <div role="listitem" className="block">
      {inner}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatEventDate(date: Date) {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
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
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}
