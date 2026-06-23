// Donde: no renderiza UI directo. Viewports: afecta action deck en desktop y mobile. Funcion: arma y ordena las tarjetas destacadas.
import type { HeroCandidate } from "@/lib/ranker";
import { pickHeroAndDeck } from "@/lib/ranker";
import { REGION_TIME_ZONE, formatRegionWeekdayDayMonth } from "@/lib/region-date";
import type { Event, HeroCard, PrayerWallConfig, SocialPost } from "@/lib/types";
import type { DeckItem } from "@/components/sections/home/action-deck/action-deck-types";

export const MS_HOUR = 60 * 60 * 1000;
export const MS_DAY = 24 * MS_HOUR;
export const CUSTOM_BANNER_ACCENT = "#e36600";

function isSocialVideoUrl(url?: string): boolean {
  if (!url) return false;
  return /\/(reel|reels|videos|watch)\b|watch\?v=|fb\.watch/i.test(url);
}

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
    case "facebook": {
      const hoursSince = (now - item.postedAt.getTime()) / MS_HOUR;
      score += Math.max(0, 180 - hoursSince);
      break;
    }
    case "audio":
      score += 60;
      break;
  }

  if (item.pinned) score += 2000;
  return score;
}

function mapCandidateToDeckItem(
  candidate: HeroCandidate,
  prayerWall?: PrayerWallConfig | null,
  socialPosts?: SocialPost[],
): DeckItem | null {
  if (candidate.type === "custom") {
    return {
      id: `custom-${candidate.id}`,
      type: "promo",
      title: candidate.ctaText || "Novedad destacada",
      href: candidate.url,
      pinned: candidate.pinned,
      image: (candidate as any).media?.url,
      accentColor: candidate.accentColor,
      ctaText: candidate.url ? candidate.ctaText : undefined,
    };
  }

  if (candidate.type === "prayer") {
    const selectedPrayers = prayerWall?.selectedPrayers ?? [];
    const prayerObjects = selectedPrayers
      .filter((prayer) => typeof prayer.text === "string" && prayer.text.length > 0)
      .slice(0, 6)
      .map((prayer) => ({
        text: prayer.text,
        submittedAt: prayer.submittedAt,
      }));

    return {
      id: `prayer-${candidate.id}`,
      type: "prayer",
      title: candidate.phase === "show" ? "" : "Muro de oraciones · comparte tu petición",
      updatedAt: new Date(candidate.publishedAt),
      phase: candidate.phase,
      prayers: prayerObjects.map((prayer) => prayer.text),
      prayerObjects,
    };
  }

  if (candidate.type === "event") {
    return {
      id: `event-${candidate.id}`,
      type: "event",
      title: candidate.title,
      date: new Date(candidate.date),
      time: candidate.time,
      location: candidate.location,
      pinned: candidate.pinned,
      href: `/#${candidate.id}`,
    };
  }

  if (candidate.type === "social") {
    const post = socialPosts?.find((item) => item._id === candidate.id);
    const image = post?.media?.url;

    if (candidate.network === "instagram") {
      return {
        id: `ig-${candidate.id}`,
        type: "instagram",
        title: "Última publicación en Instagram",
        postedAt: new Date(candidate.postedAt),
        href: candidate.url,
        image,
        isVideo: isSocialVideoUrl(candidate.url),
        postType: isSocialVideoUrl(candidate.url) ? "reel" : "post",
      };
    }

    return {
      id: `fb-${candidate.id}`,
      type: "facebook",
      title: "Última publicación en Facebook",
      postedAt: new Date(candidate.postedAt),
      href: candidate.url,
      image,
      isVideo: isSocialVideoUrl(candidate.url),
    };
  }

  return null;
}

export function buildActionDeck({
  events,
  customHeroCard,
  prayerWall,
  socialPosts,
  now,
}: {
  events: Event[];
  customHeroCard?: HeroCard | null;
  prayerWall?: PrayerWallConfig | null;
  socialPosts?: SocialPost[];
  now: number;
}) {
  const rankingCandidates: HeroCandidate[] = [];

  if (customHeroCard?.media?.url) {
    rankingCandidates.push({
      type: "custom",
      id: customHeroCard._id,
      publishedAt: new Date(customHeroCard.publishedAt).getTime(),
      accentColor: CUSTOM_BANNER_ACCENT,
      media: {
        isVertical: Boolean(customHeroCard.media.isVertical),
        alt: customHeroCard.media.alt || "Contenido destacado",
        url: customHeroCard.media.url,
      },
      url: customHeroCard.url,
      ctaText: customHeroCard.ctaText,
      pinned: customHeroCard.pinned,
      priorityWeight: customHeroCard.priorityWeight,
    });
  }

  if (prayerWall && prayerWall.enabled && prayerWall.phase !== "paused") {
    rankingCandidates.push({
      type: "prayer",
      id: prayerWall._id,
      phase: prayerWall.phase,
      publishedAt: new Date(prayerWall.publishedAt).getTime(),
      selectedPrayersCount: prayerWall.selectedPrayers?.length ?? 0,
    });
  }

  events.forEach((event) => {
    const diff = event.date.getTime() - now;
    if (diff < 0 || diff > 5 * MS_DAY) return;

    rankingCandidates.push({
      type: "event",
      id: event.id,
      date: event.date.getTime(),
      title: event.title,
      time: event.time,
      location: event.address || event.location,
      registrationEnabled: event.registrationEnabled,
      image: event.image,
    });
  });

  (socialPosts ?? []).forEach((post) => {
    rankingCandidates.push({
      type: "social",
      id: post._id,
      network: post.network,
      postedAt: new Date(post.postedAt).getTime(),
      url: post.url,
      caption: post.caption,
      media: post.media ? { isVertical: post.media.isVertical } : undefined,
    });
  });

  const { deck: rankedDeck } = pickHeroAndDeck(rankingCandidates, now);
  const rankedDeckItems = rankedDeck
    .map((candidate) => {
      const mapped = mapCandidateToDeckItem(candidate, prayerWall, socialPosts);

      if (mapped && mapped.type === "event") {
        const srcEvent = events.find((event) => event.id === candidate.id);
        if (srcEvent && srcEvent.image) {
          mapped.image = srcEvent.image;
        }
      }

      return mapped;
    })
    .filter((item): item is DeckItem => item !== null)
    .map((item) => {
      if (item.type !== "prayer") return item;
      return {
        ...item,
        prayers: item.prayers ?? [],
        prayerObjects: item.prayerObjects ?? [],
      };
    });

  const deduped = rankedDeckItems.filter(
    (item, index, array) => array.findIndex((other) => other.id === item.id) === index,
  );

  return deduped
    .map((item) => ({ item, score: scoreItem(item, now) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((result) => result.item);
}

export function formatEventDate(date: Date) {
  return formatRegionWeekdayDayMonth(date);
}

export function formatPrayerDate(submittedAt: string) {
  const date = new Date(submittedAt);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("es-MX", {
    timeZone: REGION_TIME_ZONE,
    day: "numeric",
    month: "long",
  }).format(date);
}

export function getSocialEmbedUrl(item: Extract<DeckItem, { type: "instagram" | "facebook" }>) {
  if (item.type === "facebook") {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(item.href)}&show_text=false&autoplay=false`;
  }

  try {
    const source = new URL(item.href);
    source.search = "";
    const cleanPath = source.pathname.endsWith("/") ? source.pathname : `${source.pathname}/`;
    return `https://www.instagram.com${cleanPath}embed`;
  } catch {
    const normalized = item.href.split("?")[0].replace(/\/?$/, "/");
    return `${normalized}embed`;
  }
}
