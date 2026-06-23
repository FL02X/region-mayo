// Donde: no renderiza UI directo. Viewports: afecta action deck en desktop y mobile. Funcion: tipos compartidos para tarjetas destacadas.
import type { Event, HeroCard, PrayerWallConfig, SocialPost } from "@/lib/types";

export type DeckItem =
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
      image?: string;
      href: string;
      isVideo?: boolean;
      postType?: "reel" | "post";
      pinned?: boolean;
    }
  | {
      id: string;
      type: "facebook";
      title: string;
      postedAt: Date;
      image?: string;
      href: string;
      isVideo?: boolean;
      pinned?: boolean;
    }
  | {
      id: string;
      type: "prayer";
      title: string;
      updatedAt: Date;
      phase: "collect" | "show" | "paused";
      prayers?: string[];
      prayerObjects?: Array<{ text: string; submittedAt: string }>;
      pinned?: boolean;
    }
  | {
      id: string;
      type: "promo";
      title: string;
      image?: string;
      href?: string;
      pinned?: boolean;
      accentColor?: string;
      ctaText?: string;
    }
  | {
      id: string;
      type: "audio";
      title: string;
      audioUrl?: string;
      href?: string;
      pinned?: boolean;
    };

export type DeckItemType = DeckItem["type"];

export interface ActionDeckProps {
  events: Event[];
  instagramUrl?: string;
  facebookUrl?: string;
  customHeroCard?: HeroCard | null;
  prayerWall?: PrayerWallConfig | null;
  socialPosts?: SocialPost[];
  now?: number;
}
