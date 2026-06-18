// ============================================
// Región Mayo - Sanity CMS API Layer
// ============================================

import type {
  Region,
  Event,
  Pastor,
  Coro,
  DirectivaMember,
  RegionPresident,
  SiteSettings,
  HeroImage,
  Templo,
  HeroCard,
  PrayerWallConfig,
  SocialPost,
  Prayer,
  Album,
  AlbumGalleryItem,
  AlbumGalleryVideo,
  AlbumImage,
  AlbumVideo,
  AlbumYoutubeLayout,
  EventOccurrence,
} from "./types";
import { formatRegionDateInput, getRegionDateTime } from "./region-date";
import { getSanityClient, isSanityNetworkError, SANITY_CACHE_TAG } from "./sanity/client";
import { sanityImageUrl, sanityImagesUrls } from "./sanity/image";
import {
  regionMayo,
  eventsData,
  pastorsData,
  corosData,
  directivaData,
  availableRegions,
  regionPresident,
  siteSettingsData,
  templosData,
} from "./mock-data";

const SANITY_ENABLED = Boolean(
  process.env.SANITY_PROJECT_ID && process.env.SANITY_DATASET,
);

const PASTOR_PENDING_LABEL = "Por confirmar";
const YOUTUBE_FETCH_OPTIONS = {
  next: { revalidate: 60 * 60, tags: [SANITY_CACHE_TAG] },
} as RequestInit;

function isMayoRegion(input: string): boolean {
  return input === "mayo" || input === "Región Mayo" || input === "region-mayo";
}

function getMockRegionConfig(regionSlug: string): Region | null {
  if (isMayoRegion(regionSlug)) return regionMayo;
  return null;
}

function getMockEvents(regionSlug: string): Event[] {
  if (!isMayoRegion(regionSlug)) return [];

  const now = new Date();
  return eventsData
    .map((event) => mapEvent({ ...event, _id: event.id }, now))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function getMockPastors(regionSlug: string): Pastor[] {
  if (isMayoRegion(regionSlug)) return pastorsData;
  return [];
}

function getMockCoros(regionSlug: string): Coro[] {
  if (isMayoRegion(regionSlug)) return corosData;
  return [];
}

function getMockDirectiva(regionSlug: string): DirectivaMember[] {
  if (isMayoRegion(regionSlug)) return directivaData;
  return [];
}

function getMockRegionPresident(regionSlug: string): RegionPresident | null {
  if (isMayoRegion(regionSlug)) return regionPresident;
  return null;
}

function getMockSiteSettings(regionSlug: string): SiteSettings | null {
  if (isMayoRegion(regionSlug)) return siteSettingsData;
  return null;
}

function getMockTemplos(regionSlug: string): Templo[] {
  if (isMayoRegion(regionSlug)) return templosData;
  return [];
}

async function readWithDevSanityFallback<T>(
  label: string,
  fallback: () => T,
  read: () => Promise<T>,
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (process.env.NODE_ENV === "development" && isSanityNetworkError(error)) {
      console.warn(`[sanity] ${label} failed in development; using mock data instead.`);
      return fallback();
    }

    throw error;
  }
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    // Fail loudly: event dates are required and used for filtering.
    throw new Error(`Invalid date value from Sanity: ${String(value)}`);
  }
  return date;
}

function getLegacyEventDateInput(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  try {
    return formatRegionDateInput(toDate(value));
  } catch {
    return null;
  }
}

function normalizeEventSchedule(raw: any): EventOccurrence[] {
  const schedule = Array.isArray(raw?.schedule) ? raw.schedule : [];
  const normalized = schedule
    .map((item: any): EventOccurrence | null => {
      const dateValue = typeof item?.date === "string" ? item.date : "";
      const time = typeof item?.time === "string" && item.time.trim() ? item.time.trim() : "";
      const date = dateValue ? getRegionDateTime(dateValue, time) : null;
      if (!date || !time) return null;

      const note =
        typeof item?.note === "string" && item.note.trim().length > 0
          ? item.note.trim()
          : undefined;

      return { date, time, note };
    })
    .filter(Boolean) as EventOccurrence[];

  if (normalized.length > 0) {
    return normalized.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  const legacyStart = getLegacyEventDateInput(raw?.date);
  if (!legacyStart) return [];

  const legacyEnd = getLegacyEventDateInput(raw?.endDate);
  const time = typeof raw?.time === "string" && raw.time.trim() ? raw.time.trim() : "Por confirmar";
  const startDate = getRegionDateTime(legacyStart, time);
  const endDate = legacyEnd ? getRegionDateTime(legacyEnd, time) : null;
  if (!startDate) return [];

  const fallbackSchedule: EventOccurrence[] = [];
  const endTime = endDate && endDate.getTime() >= startDate.getTime() ? endDate.getTime() : startDate.getTime();

  for (
    let cursor = new Date(startDate);
    cursor.getTime() <= endTime;
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  ) {
    fallbackSchedule.push({
      date: cursor,
      time,
    });
  }

  return fallbackSchedule;
}

const EVENT_ACTIVE_WINDOW_MS = 2 * 60 * 60 * 1000;

function computeEventStatus(date: Date, endDate?: Date, now: Date = new Date()): Event["status"] {
  if (now < date) {
    return "upcoming";
  }

  const effectiveEnd = endDate ?? new Date(date.getTime() + EVENT_ACTIVE_WINDOW_MS);
  if (now <= effectiveEnd) {
    return "active";
  }

  return "past";
}

function mapEvent(raw: any, now: Date): Event {
  const schedule = normalizeEventSchedule(raw);
  if (schedule.length === 0) {
    throw new Error(`Event is missing a valid schedule: ${raw?._id ?? raw?.id ?? "unknown"}`);
  }
  const date = schedule[0].date;
  const lastOccurrence = schedule[schedule.length - 1];
  const endDate = schedule.length > 1 ? lastOccurrence.date : undefined;
  const time = schedule[0].time;

  const hasEventImage = Boolean(raw.image?.asset?.url || (typeof raw.image === "string" && raw.image.length > 0));
  const photos = sanityImagesUrls(raw.photos);
  const eventGalleryFirstPhoto = photos.length > 0 ? photos[0] : undefined;
  // Event primary image (can be undefined). If missing, prefer the event gallery and then the templo's first photo.
  const eventImage = hasEventImage ? sanityImageUrl(raw.image) : undefined;
  const temploFirstPhoto = raw.templo && Array.isArray(raw.templo.photos) && raw.templo.photos.length > 0
    ? sanityImageUrl(raw.templo.photos[0])
    : undefined;
  const temploPastor = raw.templo?.pastores?.[0];
  const customPastorName =
    typeof raw.pastorMensajeCustom === "string" &&
    raw.pastorMensajeCustom.trim() &&
    raw.pastorMensajeCustom.trim() !== PASTOR_PENDING_LABEL
      ? raw.pastorMensajeCustom.trim()
      : undefined;
  const image = eventImage || eventGalleryFirstPhoto || temploFirstPhoto || "/placeholder.svg";
  const typeColor = (raw.typeColor ?? "worship") as Event["typeColor"];
  const pastorName =
    raw.pastorMensaje?.fullName ||
    customPastorName ||
    temploPastor?.fullName ||
    undefined;
  const pastorId =
    raw.pastorMensaje?._id ||
    (!customPastorName ? temploPastor?._id : undefined) ||
    undefined;

  return {
    id: raw._id,
    title: raw.title,
    eventType: raw.eventType ?? "culto",
    type: typeColor,
    typeColor,
    schedule,
    date,
    endDate,
    time,
    temploId: raw.templo?._id ?? undefined,
    location: raw.templo?.temploName ?? raw.location,
    address: raw.templo?.address ?? raw.address,
    googleMapsUrl: raw.templo?.googleMapsUrl ?? raw.googleMapsUrl,
    description: raw.description ?? undefined,
    vestimenta: raw.vestimenta,
    vestimentaCustom: raw.vestimentaCustom,
    image,
    status: computeEventStatus(date, lastOccurrence.date, now),
    albumEnabled: raw.albumEnabled ?? false,
    googleDriveAlbumUrl: raw.googleDriveAlbumUrl,
    facebookPostUrl: raw.facebookPostUrl,
    registrationEnabled: raw.registrationEnabled ?? true,
    photos: photos.length > 0 ? photos : undefined,
    // New optional sections
    alimentos: raw.alimentosEnabled
      ? {
          enabled: true,
          location: raw.alimentosLocation ?? undefined,
          googleMapsUrl: raw.alimentosGoogleMapsUrl ?? undefined,
          description: raw.alimentosDescription ?? undefined,
        }
      : undefined,
    juntaJuvenil: raw.juntaJuvenilEnabled
      ? {
          enabled: true,
          location: raw.juntaJuvenilLocation ?? undefined,
          googleMapsUrl: raw.juntaJuvenilGoogleMapsUrl ?? undefined,
          description: raw.juntaJuvenilDescription ?? undefined,
        }
      : undefined,
    speakers:
      pastorName || raw.jovenPreside
        ? {
            pastorMensaje: pastorName,
            pastorMensajeId: pastorId,
            jovenPreside: raw.jovenPreside ?? undefined,
          }
        : undefined,
    moreInfo:
      raw.moreInfoEnabled && raw.moreInfoImage
        ? {
            enabled: true,
            imageUrl: sanityImageUrl(raw.moreInfoImage) ?? undefined,
          }
        : undefined,
    isMultiDayEvent: raw.isMultiDayEvent ?? undefined,
    eventGroupId: raw.eventGroupId ?? undefined,
  };
}

function albumAlt(albumTitle: string, index: number, alt?: string): string {
  const cleanAlt = typeof alt === "string" ? alt.trim() : "";
  return cleanAlt.length > 0 ? cleanAlt : `${albumTitle} - foto ${index + 1}`;
}

function mapAlbumImage(
  raw: any,
  albumTitle: string,
  index: number,
  source: AlbumImage["source"] = "official",
): AlbumImage | null {
  const url = sanityImageUrl(raw?.image ?? raw);
  if (!url || url === "/placeholder.svg") return null;

  return {
    type: "image",
    url,
    alt: albumAlt(albumTitle, index, raw?.alt),
    caption:
      typeof raw?.caption === "string" && raw.caption.trim().length > 0
        ? raw.caption.trim()
        : undefined,
    source,
  };
}

function mapAlbumGalleryVideo(
  raw: any,
  albumTitle: string,
  index: number,
): AlbumGalleryVideo | null {
  const url = raw?.video?.asset?.url || raw?.file?.asset?.url;
  const posterUrl = sanityImageUrl(raw?.poster);
  if (!url) return null;

  const title =
    typeof raw?.title === "string" && raw.title.trim().length > 0
      ? raw.title.trim()
      : `Video ${index + 1}`;
  const caption =
    typeof raw?.caption === "string" && raw.caption.trim().length > 0
      ? raw.caption.trim()
      : undefined;

  return {
    type: "video",
    id: raw?._key || `${albumTitle}-${index}`,
    url,
    posterUrl: posterUrl && posterUrl !== "/placeholder.svg" ? posterUrl : undefined,
    title,
    alt: `${albumTitle} - ${title}`,
    caption,
    mimeType: raw?.video?.asset?.mimeType || raw?.file?.asset?.mimeType,
    source: "official",
  };
}

function mapAlbumGalleryItem(raw: any, albumTitle: string, index: number): AlbumGalleryItem | null {
  if (raw?._type === "albumVideo" || raw?.video?.asset?.url || raw?.file?.asset?.url) {
    return mapAlbumGalleryVideo(raw, albumTitle, index);
  }

  return mapAlbumImage(raw, albumTitle, index, "official");
}

function extractYoutubePlaylistId(value?: string): string {
  const cleanValue = typeof value === "string" ? value.trim() : "";
  if (!cleanValue) return "";

  try {
    const url = new URL(cleanValue);
    const list = url.searchParams.get("list");
    if (list) return list.trim();
  } catch {
    // Not a URL; treat as a raw playlist id.
  }

  return cleanValue;
}

function getYoutubePlaylistUrl(playlistId?: string, explicitUrl?: string): string | undefined {
  if (typeof explicitUrl === "string" && explicitUrl.trim().length > 0) {
    return explicitUrl.trim();
  }
  const cleanPlaylistId = extractYoutubePlaylistId(playlistId);
  if (cleanPlaylistId) {
    return `https://www.youtube.com/playlist?list=${encodeURIComponent(cleanPlaylistId)}`;
  }
  return undefined;
}

function bestYoutubeThumbnail(thumbnails: any): string {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    "/placeholder.svg"
  );
}

function decodeXmlText(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseYoutubeDurationSeconds(duration?: string): number | undefined {
  if (!duration) return undefined;

  const isoMatch = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (isoMatch) {
    const hours = Number(isoMatch[1] || 0);
    const minutes = Number(isoMatch[2] || 0);
    const seconds = Number(isoMatch[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
  }

  const numericDuration = Number(duration);
  return Number.isFinite(numericDuration) ? numericDuration : undefined;
}

async function fetchYoutubeVideoDurations(
  videoIds: string[],
  apiKey: string,
): Promise<Record<string, number>> {
  const durations: Record<string, number> = {};
  const uniqueVideoIds = Array.from(new Set(videoIds.filter(Boolean)));

  for (let index = 0; index < uniqueVideoIds.length; index += 50) {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("id", uniqueVideoIds.slice(index, index + 50).join(","));
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), YOUTUBE_FETCH_OPTIONS);
    if (!response.ok) continue;

    const data = await response.json();
    const items = Array.isArray(data?.items) ? data.items : [];

    items.forEach((item: any) => {
      const videoId = item?.id;
      const durationSeconds = parseYoutubeDurationSeconds(
        item?.contentDetails?.duration,
      );

      if (videoId && typeof durationSeconds === "number") {
        durations[videoId] = durationSeconds;
      }
    });
  }

  return durations;
}

async function fetchYoutubePlaylistFeedVideos(playlistId: string): Promise<AlbumVideo[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;
  const response = await fetch(url, YOUTUBE_FETCH_OPTIONS);

  if (!response.ok) return [];

  const xml = await response.text();
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

  return entries
    .map((entry): AlbumVideo | null => {
      const id = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1]?.trim();
      if (!id) return null;

      const title = decodeXmlText(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || "Video");
      const publishedAt = entry.match(/<published>(.*?)<\/published>/)?.[1]?.trim();
      const mediaGroup = entry.match(/<media:group>[\s\S]*?<\/media:group>/)?.[0] || "";
      const description = decodeXmlText(
        mediaGroup.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1]?.trim() || "",
      );
      const thumbnailUrl =
        mediaGroup.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1] ||
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      const durationSeconds = parseYoutubeDurationSeconds(
        mediaGroup.match(/duration="([^"]+)"/)?.[1],
      );

      return {
        id,
        title,
        description: description || undefined,
        thumbnailUrl,
        publishedAt,
        durationSeconds,
      };
    })
    .filter(Boolean) as AlbumVideo[];
}

async function fetchYoutubePlaylistVideos(
  playlistId?: string,
): Promise<{ videos: AlbumVideo[]; error?: string }> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const cleanPlaylistId = extractYoutubePlaylistId(playlistId);

  if (!cleanPlaylistId) return { videos: [], error: "Falta el Playlist ID de YouTube." };

  if (!apiKey) {
    const feedVideos = await fetchYoutubePlaylistFeedVideos(cleanPlaylistId);
    return {
      videos: feedVideos,
      error: feedVideos.length > 0 ? undefined : "Falta YOUTUBE_API_KEY para consultar la playlist.",
    };
  }

  const videos: AlbumVideo[] = [];
  let pageToken: string | undefined;
  let apiError: string | undefined;

  try {
    for (let page = 0; page < 5; page += 1) {
      const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      url.searchParams.set("part", "snippet,contentDetails,status");
      url.searchParams.set("maxResults", "50");
      url.searchParams.set("playlistId", cleanPlaylistId);
      url.searchParams.set("key", apiKey);
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const response = await fetch(url.toString(), YOUTUBE_FETCH_OPTIONS);

      if (!response.ok) {
        apiError = `YouTube API respondio ${response.status}.`;
        break;
      }

      const data = await response.json();
      const items = Array.isArray(data?.items) ? data.items : [];

      items.forEach((item: any) => {
        const videoId = item?.contentDetails?.videoId || item?.snippet?.resourceId?.videoId;
        if (!videoId) return;
        if (item?.snippet?.title === "Private video" || item?.snippet?.title === "Deleted video") return;

        videos.push({
          id: videoId,
          title: item?.snippet?.title || "Video",
          description:
            typeof item?.snippet?.description === "string" &&
            item.snippet.description.trim().length > 0
              ? item.snippet.description.trim()
              : undefined,
          thumbnailUrl: bestYoutubeThumbnail(item?.snippet?.thumbnails),
          publishedAt: item?.snippet?.publishedAt,
        });
      });

      pageToken = data?.nextPageToken;
      if (!pageToken) break;
    }
  } catch {
    apiError = "No se pudo conectar con YouTube API.";
  }

  if (videos.length > 0) {
    const durations = await fetchYoutubeVideoDurations(
      videos.map((video) => video.id),
      apiKey,
    );

    return {
      videos: videos.map((video) => ({
        ...video,
        durationSeconds: durations[video.id],
      })),
    };
  }

  const feedVideos = await fetchYoutubePlaylistFeedVideos(cleanPlaylistId);
  return {
    videos: feedVideos,
    error:
      feedVideos.length > 0
        ? undefined
        : apiError ||
          "No se encontraron videos. Verifica que la playlist exista, no sea privada y que la API key pueda leer YouTube Data API v3.",
  };
}

async function mapAlbum(raw: any): Promise<Album> {
  const title = raw?.title || "Album";
  const albumType = raw?.albumType === "youtube" ? "youtube" : "photos";
  const relatedEvent = raw?.relatedEvent;
  const relatedEventSchedule = relatedEvent ? normalizeEventSchedule(relatedEvent) : [];
  const category = relatedEvent?.eventType ?? raw?.category ?? "culto";
  const youtubeResult =
    albumType === "youtube"
      ? await fetchYoutubePlaylistVideos(raw.youtubePlaylistId)
      : { videos: [] as AlbumVideo[] };
  const videos = youtubeResult.videos;
  const manualCoverImage = raw.coverImage?.asset?.url ? sanityImageUrl(raw.coverImage) : "";
  const coverImage =
    manualCoverImage ||
    (albumType === "youtube" ? videos[0]?.thumbnailUrl : sanityImageUrl(raw.coverImage)) ||
    "/placeholder.svg";
  const additionalMedia: AlbumGalleryItem[] = Array.isArray(raw?.images)
    ? (raw.images as any[])
        .map((item: any, index: number) => mapAlbumGalleryItem(item, title, index + 1))
        .filter((item: AlbumGalleryItem | null) => item?.type !== "image" || item.url !== coverImage)
        .filter((item): item is AlbumGalleryItem => Boolean(item))
    : [];
  const additionalImages = additionalMedia.filter(
    (item): item is AlbumImage => item.type === "image",
  );
  const coverImageItem =
    coverImage && coverImage !== "/placeholder.svg"
      ? {
          type: "image" as const,
          url: coverImage,
          alt: albumAlt(title, 0),
          source: "official" as const,
        }
      : null;
  const officialImages = coverImageItem
    ? [coverImageItem, ...additionalImages]
    : additionalImages;
  const communityImages = Array.isArray(raw?.communityImages)
    ? (raw.communityImages as any[])
        .map((image: any, index: number) =>
          mapAlbumImage(image, title, officialImages.length + index, "community"),
        )
        .filter((image: AlbumImage | null): image is AlbumImage => Boolean(image))
    : [];
  const images = [...officialImages, ...communityImages];
  const media: AlbumGalleryItem[] = [
    ...(coverImageItem ? [coverImageItem] : []),
    ...additionalMedia,
    ...(communityImages as AlbumImage[]),
  ];
  const submissionsCloseAt = raw.submissionsCloseAt ? toDate(raw.submissionsCloseAt) : undefined;
  const hasUploadToken = Boolean(raw.hasUploadToken);
  const canSubmitPhotos =
    albumType === "photos" &&
    Boolean(raw.allowSubmissions) &&
    hasUploadToken &&
    (!submissionsCloseAt || submissionsCloseAt.getTime() > Date.now());

  return {
    id: raw._id,
    albumType,
    title,
    slug: raw.slug?.current ?? raw.slug ?? raw._id,
    startDate: toDate(raw.startDate),
    endDate: toDate(raw.endDate ?? raw.startDate),
    category,
    description: raw.description ?? undefined,
    coverImage,
    facebookUrl: albumType === "photos" ? raw.facebookUrl ?? undefined : undefined,
    youtubePlaylistId: extractYoutubePlaylistId(raw.youtubePlaylistId) || undefined,
    youtubeUrl:
      albumType === "youtube"
        ? getYoutubePlaylistUrl(raw.youtubePlaylistId, raw.youtubeUrl)
        : undefined,
    youtubeLayout:
      albumType === "youtube" && (raw.youtubeLayout === "vertical" || raw.youtubeLayout === "horizontal")
        ? (raw.youtubeLayout as AlbumYoutubeLayout)
        : "auto",
    hidden: Boolean(raw.hidden),
    allowSubmissions: Boolean(raw.allowSubmissions),
    submissionsCloseAt,
    uploadInstructions:
      typeof raw.uploadInstructions === "string" && raw.uploadInstructions.trim().length > 0
        ? raw.uploadInstructions.trim()
        : undefined,
    canSubmitPhotos,
    relatedEvent: relatedEvent
      ? {
          id: relatedEvent._id,
          title: relatedEvent.title,
          eventType: relatedEvent.eventType ?? category,
          date: relatedEventSchedule[0]?.date ?? toDate(relatedEvent.date),
          endDate:
            relatedEventSchedule.length > 1
              ? relatedEventSchedule.at(-1)?.date
              : relatedEvent.endDate
                ? toDate(relatedEvent.endDate)
                : undefined,
          location: relatedEvent.templo?.temploName ?? relatedEvent.location ?? undefined,
        }
      : undefined,
    media: albumType === "photos" ? media : [],
    images: albumType === "photos" ? (images as AlbumImage[]) : [],
    videos,
    youtubeError: albumType === "youtube" ? youtubeResult.error : undefined,
  };
}

function mapPastor(raw: any): Pastor {
  return {
    id: raw._id,
    fullName: raw.fullName,
    churchName: raw.churchName,
    churchNumber: raw.churchNumber ?? undefined,
    temploName: raw.temploName ?? raw.templo?.temploName,
    temploId: raw.temploId ?? raw.templo?._id,
    address: raw.address ?? raw.templo?.address,
    photo: raw.photo ? sanityImageUrl(raw.photo) : undefined,
    googleMapsUrl: raw.googleMapsUrl ?? raw.templo?.googleMapsUrl,
    phone: raw.phone ?? undefined,
  };
}

function mapCoro(raw: any): Coro {
  return {
    id: raw._id,
    coroName: raw.coroName,
    photo: raw.photo ? sanityImageUrl(raw.photo) : "/placeholder.svg",
    memberCount: typeof raw.memberCount === "number" ? raw.memberCount : undefined,
    temploName: raw.temploName ?? raw.templo?.temploName,
    temploId: raw.temploId ?? raw.templo?._id,
    address: raw.address ?? raw.templo?.address,
    googleMapsUrl: raw.googleMapsUrl ?? raw.templo?.googleMapsUrl,
    presidentName: raw.presidentName,
    presidentPhone: raw.presidentPhone,
  };
}

const ROLE_TRANSLATIONS: Record<string, string> = {
  president_regional: "Presidente Regional",
  vice_president_regional: "Vicepresidente Regional",
  secretary_regional: "Secretaria Regional",
  treasurer_regional: "Tesorera Regional",
  president_local: "Presidente Local",
  vice_president_local: "Vicepresidente Local",
  secretary_local: "Secretaria Local",
  treasurer_local: "Tesorera Local",
  event_coordinator: "Coordinador de Eventos",
  womens_ministry: "Coordinadora de Ministerio Femenino",
  youth_ministry: "Coordinador de Ministerio Juvenil",
  other: "Otro",
};

function mapDirectivaMember(raw: any): DirectivaMember {
  const roleValue = raw.roleCustom || (raw.role ? (ROLE_TRANSLATIONS[raw.role] || raw.role) : undefined);

  return {
    id: raw._id,
    fullName: raw.fullName,
    role: roleValue,
    temploName: raw.temploName ?? raw.templo?.temploName,
    temploId: raw.temploId ?? raw.templo?._id,
    address: raw.address ?? raw.templo?.address,
    photo: raw.photo ? sanityImageUrl(raw.photo) : undefined,
    googleMapsUrl: raw.googleMapsUrl ?? raw.templo?.googleMapsUrl,
    phone: raw.phone,
  };
}

function mapRegion(raw: any, regionSlugFallback: string): Region {
  return {
    id: raw._id ?? regionSlugFallback,
    name: raw.name,
    slug: raw.slug?.current ?? regionSlugFallback,
    socialLinks: raw.socialLinks ?? {},
    primaryColor: raw.primaryColor ?? undefined,
    secondaryColor: raw.secondaryColor ?? undefined,
  };
}

// ============================================
// Region APIs
// ============================================

export async function getRegionConfig(
  regionSlug: string = "mayo",
): Promise<Region | null> {
  if (!SANITY_ENABLED) return getMockRegionConfig(regionSlug);

  return readWithDevSanityFallback("getRegionConfig", () => getMockRegionConfig(regionSlug), async () => {
    const client = getSanityClient();
    const region = await client.fetch(
      `*[_type == "region" && (slug.current == $slug || name == $slug)][0]{
        _id,
        name,
        slug,
        socialLinks,
        primaryColor,
        secondaryColor
      }`,
      { slug: regionSlug },
    );

    if (!region) {
      return null;
    }
    return mapRegion(region, regionSlug);
  });
}

export async function getAvailableRegions(): Promise<string[]> {
  if (!SANITY_ENABLED) return availableRegions;

  return readWithDevSanityFallback("getAvailableRegions", () => availableRegions, async () => {
    const client = getSanityClient();
    const regions = await client.fetch(
      `*[_type == "region"] | order(name asc){
        name
      }`,
    );
    return (regions ?? []).map((r: any) => r.name).filter(Boolean);
  });
}

// ============================================
// Events APIs
// ============================================

export async function getEvents(regionSlug: string = "mayo"): Promise<Event[]> {
  if (!SANITY_ENABLED) return getMockEvents(regionSlug);

  return readWithDevSanityFallback("getEvents", () => getMockEvents(regionSlug), async () => {
    const client = getSanityClient();
    const events = await client.fetch(
      `*[_type == "event" && (region->slug.current == $slug || region->name == $slug)]{
          _id,
          title,
          eventType,
          schedule[]{date, time, note},
          date,
          endDate,
          time,
          location,
          address,
          googleMapsUrl,
          description,
          vestimenta,
          vestimentaCustom,
          typeColor,
          image{asset->{url}},
          albumEnabled,
          googleDriveAlbumUrl,
          facebookPostUrl,
          registrationEnabled,
          photos[]{asset->{url}},
          templo->{_id, temploName, address, googleMapsUrl, photos[]{asset->{url}}, "pastores": *[
            _type == "pastor" &&
            templo._ref == ^._id &&
            !defined(deletedAt)
          ]{_id, fullName}},
          isMultiDayEvent,
          eventGroupId,
          alimentosEnabled,
          alimentosLocation,
          alimentosGoogleMapsUrl,
          alimentosDescription,
          juntaJuvenilEnabled,
          juntaJuvenilLocation,
          juntaJuvenilGoogleMapsUrl,
          juntaJuvenilDescription,
          pastorMensaje->{_id, fullName},
          pastorMensajeCustom,
          jovenPreside,
          moreInfoEnabled,
          moreInfoImage{asset->{url}}
        }`,
      { slug: regionSlug },
    );

    const now = new Date();
    return (events ?? [])
      .map((event: any) => mapEvent(event, now))
      .sort((a: Event, b: Event) => a.date.getTime() - b.date.getTime());
  });
}

// ============================================
// Album APIs
// ============================================

function getMockAlbums(regionSlug: string): Album[] {
  if (!isMayoRegion(regionSlug)) return [];

  return eventsData
    .filter((event) => event.albumEnabled)
    .map((event) => {
      const slug = event.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const additionalImageUrls = event.photos?.filter((url) => url !== event.image) ?? [];
      const imageUrls = [event.image, ...additionalImageUrls].filter(Boolean);

      return {
        id: `mock-album-${event.id}`,
        albumType: "photos",
        title: event.title,
        slug: `${slug}-${event.id}`,
        startDate: event.date,
        endDate: event.endDate ?? event.date,
        category: event.eventType,
        description: event.description,
        coverImage: event.image,
        facebookUrl: event.facebookPostUrl,
        hidden: false,
        relatedEvent: {
          id: event.id,
          title: event.title,
          eventType: event.eventType,
          date: event.date,
          endDate: event.endDate,
          location: event.location,
        },
        images: imageUrls.map((url, index) => ({
          type: "image" as const,
          url,
          alt: `${event.title} - foto ${index + 1}`,
        })),
        media: imageUrls.map((url, index) => ({
          type: "image" as const,
          url,
          alt: `${event.title} - foto ${index + 1}`,
        })),
        videos: [],
      };
    });
}

const ALBUM_PROJECTION = `{
  _id,
  albumType,
  title,
  slug,
  startDate,
  endDate,
  category,
  description,
  coverImage{asset->{url}},
  facebookUrl,
  youtubePlaylistId,
  youtubeUrl,
  youtubeLayout,
  hidden,
  allowSubmissions,
  "hasUploadToken": defined(uploadTokenHash),
  submissionsCloseAt,
  uploadInstructions,
  relatedEvent->{
    _id,
    title,
    eventType,
    schedule[]{date, time, note},
    date,
    endDate,
    location,
    templo->{temploName}
  },
  images[]{
    _key,
    _type,
    asset->{url},
    image{asset->{url}},
    video{asset->{url, mimeType}},
    file{asset->{url, mimeType}},
    poster{asset->{url}},
    title,
    alt,
    caption
  },
  "communityImages": *[
    _type == "albumPhotoSubmission" &&
    (
      album._ref == ^._id ||
      album._ref == "drafts." + ^._id ||
      ^._id == "drafts." + album._ref
    ) &&
    status == "approved"
  ] | order(uploadedAt asc){
    "image": photo{asset->{url}},
    "alt": submittedByName,
    "caption": ""
  }
}`;

export async function getAlbums(regionSlug: string = "mayo"): Promise<Album[]> {
  if (!SANITY_ENABLED) return getMockAlbums(regionSlug);

  return readWithDevSanityFallback("getAlbums", () => getMockAlbums(regionSlug), async () => {
    const client = getSanityClient();
    const albums = await client.fetch(
      `*[
        _type == "album" &&
        hidden != true &&
        !defined(deletedAt) &&
        (
          !defined(relatedEvent) ||
          relatedEvent->region->slug.current == $slug ||
          relatedEvent->region->name == $slug
        )
      ] | order(startDate desc) ${ALBUM_PROJECTION}`,
      { slug: regionSlug },
    );

    return Promise.all((albums ?? []).map(mapAlbum));
  });
}

export async function getAlbumBySlug(
  slug: string,
  regionSlug: string = "mayo",
): Promise<Album | null> {
  if (!SANITY_ENABLED) {
    return getMockAlbums(regionSlug).find((album) => album.slug === slug) ?? null;
  }

  return readWithDevSanityFallback(
    "getAlbumBySlug",
    () => getMockAlbums(regionSlug).find((album) => album.slug === slug) ?? null,
    async () => {
      const client = getSanityClient();
      const album = await client.fetch(
        `*[
          _type == "album" &&
          slug.current == $slug &&
          hidden != true &&
          !defined(deletedAt) &&
          (
            !defined(relatedEvent) ||
            relatedEvent->region->slug.current == $regionSlug ||
            relatedEvent->region->name == $regionSlug
          )
        ][0] ${ALBUM_PROJECTION}`,
        { slug, regionSlug },
      );

      return album ? mapAlbum(album) : null;
    },
  );
}

export async function getAlbumSlugs(regionSlug: string = "mayo"): Promise<string[]> {
  if (!SANITY_ENABLED) return getMockAlbums(regionSlug).map((album) => album.slug);

  return readWithDevSanityFallback(
    "getAlbumSlugs",
    () => getMockAlbums(regionSlug).map((album) => album.slug),
    async () => {
      const client = getSanityClient();
      const slugs = await client.fetch(
        `*[
          _type == "album" &&
          hidden != true &&
          defined(slug.current) &&
          !defined(deletedAt) &&
          (
            !defined(relatedEvent) ||
            relatedEvent->region->slug.current == $slug ||
            relatedEvent->region->name == $slug
          )
        ].slug.current`,
        { slug: regionSlug },
      );

      return (slugs ?? []).filter(Boolean);
    },
  );
}

export async function getUpcomingEvents(
  regionSlug: string = "mayo",
): Promise<Event[]> {
  const events = await getEvents(regionSlug);
  const now = new Date();
  return events.filter((event) => event.date >= now);
}

export async function getPastEvents(
  regionSlug: string = "mayo",
): Promise<Event[]> {
  const events = await getEvents(regionSlug);
  const now = new Date();
  return events.filter((event) => event.date < now && event.albumEnabled);
}

export async function getEventById(id: string): Promise<Event | undefined> {
  const events = await getEvents();
  return events.find((event) => event.id === id);
}

// ============================================
// Pastors APIs
// ============================================

export async function getPastors(
  regionSlug: string = "mayo",
): Promise<Pastor[]> {
  if (!SANITY_ENABLED) return getMockPastors(regionSlug);

  return readWithDevSanityFallback("getPastors", () => getMockPastors(regionSlug), async () => {
    const client = getSanityClient();
    const pastors = await client.fetch(
      `*[_type == "pastor" && (region->slug.current == $slug || region->name == $slug)]
        | order(fullName asc){
          _id,
          fullName,
          churchName,
          churchNumber,
          photo{asset->{url}},
          googleMapsUrl,
          phone,
          templo->{_id, temploName, address, googleMapsUrl}
        }`,
      { slug: regionSlug },
    );

    return (pastors ?? []).map(mapPastor);
  });
}

export async function getPastorById(id: string): Promise<Pastor | undefined> {
  const pastors = await getPastors();
  return pastors.find((pastor) => pastor.id === id);
}

// ============================================
// Coros APIs
// ============================================

export async function getCoros(regionSlug: string = "mayo"): Promise<Coro[]> {
  if (!SANITY_ENABLED) return getMockCoros(regionSlug);

  return readWithDevSanityFallback("getCoros", () => getMockCoros(regionSlug), async () => {
    const client = getSanityClient();
    const coros = await client.fetch(
      `*[_type == "coro" && (region->slug.current == $slug || region->name == $slug)]
        | order(coalesce(memberCount, -1) desc, coroName asc){
          _id,
          coroName,
          memberCount,
          photo{asset->{url}},
          googleMapsUrl,
          presidentName,
          presidentPhone,
          templo->{_id, temploName, address, googleMapsUrl}
        }`,
      { slug: regionSlug },
    );

    return (coros ?? []).map(mapCoro);
  });
}

export async function getCoroById(id: string): Promise<Coro | undefined> {
  const coros = await getCoros();
  return coros.find((coro) => coro.id === id);
}

// ============================================
// Directiva APIs
// ============================================

export async function getDirectiva(
  regionSlug: string = "mayo",
): Promise<DirectivaMember[]> {
  if (!SANITY_ENABLED) return getMockDirectiva(regionSlug);

  return readWithDevSanityFallback("getDirectiva", () => getMockDirectiva(regionSlug), async () => {
    const client = getSanityClient();
    const directiva = await client.fetch(
      `*[_type == "directiva" && (region->slug.current == $slug || region->name == $slug)]
        | order(order asc){
          _id,
          fullName,
          role,
          roleCustom,
          photo{asset->{url}},
          googleMapsUrl,
          phone,
          order,
          templo->{_id, temploName, address, googleMapsUrl}
        }`,
      { slug: regionSlug },
    );

    return (directiva ?? []).map(mapDirectivaMember);
  });
}

export async function getDirectivaMemberById(
  id: string,
): Promise<DirectivaMember | undefined> {
  const directiva = await getDirectiva();
  return directiva.find((member) => member.id === id);
}

export async function getRegionPresident(
  regionSlug: string = "mayo",
): Promise<RegionPresident | null> {
  if (!SANITY_ENABLED) return getMockRegionPresident(regionSlug);

  return readWithDevSanityFallback(
    "getRegionPresident",
    () => getMockRegionPresident(regionSlug),
    async () => {
      const client = getSanityClient();

      // Preferred: explicit "Presidente Regional" role.
      const president = await client.fetch(
        `*[
          _type == "directiva" &&
          (region->slug.current == $slug || region->name == $slug) &&
          role == "Presidente Regional"
        ][0]{
          fullName,
          phone
        }`,
        { slug: regionSlug },
      );

      if (president?.fullName && president?.phone)
        return president as RegionPresident;

      // Fallback: first directiva member (keeps the UI working for new/blank CMS setups).
      const fallback = await client.fetch(
        `*[
          _type == "directiva" &&
          (region->slug.current == $slug || region->name == $slug)
        ] | order(order asc)[0]{
          fullName,
          phone
        }`,
        { slug: regionSlug },
      );

      if (!fallback?.fullName || !fallback?.phone) {
        return null;
      }

      return fallback as RegionPresident;
    },
  );
}

// ============================================
// Site Settings APIs
// ============================================

function mapHeroImage(raw: any): HeroImage {
  return {
    url: raw.image?.asset?.url || "/images/hero-choir.jpg",
    alt: raw.alt || "Imagen del hero",
  };
}

function mapSiteSettings(raw: any): SiteSettings {
  return {
    id: raw._id,
    siteName: raw.siteName || "Región Mayo Calendario",
    heroImages: (raw.heroImages || []).map(mapHeroImage),
    mobileHeroImage: raw.mobileHeroImage?.image?.asset?.url
      ? mapHeroImage(raw.mobileHeroImage)
      : undefined,
    heroTitle: raw.heroTitle || "Bienvenido a Región Mayo",
    heroSubtitle: raw.heroSubtitle || "Vive la Comunidad",
  };
}

function mapHeroCard(raw: any): HeroCard {
  const mediaUrl = raw?.media?.file?.asset?.url;
  return {
    _id: raw._id,
    media: {
      url: typeof mediaUrl === "string" && mediaUrl.length > 0 ? mediaUrl : "/placeholder.svg",
      isVertical: Boolean(raw?.media?.isVertical),
      alt: raw?.media?.alt || "Contenido destacado",
    },
    accentColor: "#e36600",
    url: raw?.url || undefined,
    ctaText: raw?.url ? raw?.ctaText || "Ver más información" : undefined,
    publishedAt: raw?.publishedAt || new Date(0).toISOString(),
    pinned: Boolean(raw?.pinned),
    priorityWeight: typeof raw?.priorityWeight === "number" ? raw.priorityWeight : 0,
  };
}

function mapPrayer(raw: any): Prayer {
  return {
    _id: raw?._id,
    text: raw?.text || "",
    submittedAt: raw?.submittedAt || new Date(0).toISOString(),
    approved: Boolean(raw?.approved),
    spam: Boolean(raw?.spam),
  };
}

function mapPrayerWallConfig(raw: any): PrayerWallConfig {
  return {
    _id: raw?._id,
    phase: raw?.phase || "paused",
    selectedPrayers: Array.isArray(raw?.selectedPrayers)
      ? raw.selectedPrayers.map(mapPrayer)
      : [],
    enabled: raw?.enabled !== false,
    publishedAt: raw?.publishedAt || new Date(0).toISOString(),
  };
}

function mapSocialPost(raw: any): SocialPost {
  return {
    _id: raw?._id,
    network: raw?.network === "facebook" ? "facebook" : "instagram",
    url: raw?.url || "",
    caption: raw?.caption || undefined,
    media: raw?.media?.asset?.url
      ? {
          url: raw.media.asset.url,
          isVertical: Boolean(raw?.isVertical),
        }
      : undefined,
    postedAt: raw?.postedAt || new Date(0).toISOString(),
  };
}

export async function getSiteSettings(
  regionSlug: string = "mayo",
): Promise<SiteSettings | null> {
  if (!SANITY_ENABLED) return getMockSiteSettings(regionSlug);

  return readWithDevSanityFallback(
    "getSiteSettings",
    () => getMockSiteSettings(regionSlug),
    async () => {
      const client = getSanityClient();
      const settings = await client.fetch(
        `*[_type == "siteSettings" && (region->slug.current == $slug || region->name == $slug)][0]{
          _id,
          siteName,
          heroImages[]{
            image{asset->{url}},
            alt
          },
          mobileHeroImage{
            image{asset->{url}},
            alt
          },
          heroTitle,
          heroSubtitle
        }`,
        { slug: regionSlug },
      );

      if (!settings) {
        // Return default settings if none found
        return siteSettingsData;
      }

      return mapSiteSettings(settings);
    },
  );
}

// ============================================
// Spotlight APIs (Priority Section)
// ============================================

export async function getLatestHeroCard(regionSlug: string = "mayo"): Promise<HeroCard | null> {
  if (!SANITY_ENABLED) return null;

  return readWithDevSanityFallback("getLatestHeroCard", () => null, async () => {
    const client = getSanityClient();
    const card = await client.fetch(
      `*[_type == "heroCard" && (!defined(region) || region->slug.current == $slug || region->name == $slug)]
        | order(coalesce(pinned, false) desc, coalesce(publishedAt, _updatedAt, _createdAt) desc)[0]{
          _id,
          url,
          ctaText,
          "publishedAt": coalesce(publishedAt, _updatedAt, _createdAt),
          pinned,
          priorityWeight,
          media{
            isVertical,
            alt,
            file{asset->{url}}
          }
        }`,
      { slug: regionSlug },
    );

    if (!card) return null;
    return mapHeroCard(card);
  });
}

export async function getPrayerWallConfig(regionSlug: string = "mayo"): Promise<PrayerWallConfig | null> {
  if (!SANITY_ENABLED) return null;

  return readWithDevSanityFallback("getPrayerWallConfig", () => null, async () => {
    const client = getSanityClient();
    const wall = await client.fetch(
      `*[_type == "prayerWall" && (!defined(region) || region->slug.current == $slug || region->name == $slug)]
        | order(publishedAt desc)[0]{
          _id,
          phase,
          enabled,
          publishedAt,
          selectedPrayers[]->{
            _id,
            text,
            submittedAt,
            approved,
            spam
          }
        }`,
      { slug: regionSlug },
    );

    if (!wall) return null;
    return mapPrayerWallConfig(wall);
  });
}

export async function getLatestSocialPosts(limit: number = 6): Promise<SocialPost[]> {
  if (!SANITY_ENABLED) return [];

  return readWithDevSanityFallback("getLatestSocialPosts", () => [], async () => {
    const client = getSanityClient();
    const posts = await client.fetch(
      `*[_type == "socialPostCache"] | order(postedAt desc)[0...$limit]{
        _id,
        network,
        url,
        caption,
        isVertical,
        postedAt,
        media{asset->{url}}
      }`,
      { limit },
    );

    return (posts ?? []).map(mapSocialPost).filter((p: SocialPost) => Boolean(p.url));
  });
}

// ============================================
// Templos APIs
// ============================================

function mapTemploPastor(raw: any): import("./types").TemploPastor {
  return {
    id: raw._id,
    fullName: raw.fullName,
    phone: raw.phone ?? undefined,
  };
}

function mapTemploCoro(raw: any): import("./types").TemploCoro {
  return {
    id: raw._id,
    coroName: raw.coroName,
    presidentName: raw.presidentName,
    presidentPhone: raw.presidentPhone,
  };
}

const VALID_TEMPO_DAYS = new Set([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

function mapTemploSchedule(raw: any): import("./types").TemploSchedule | undefined {
  const servicesRaw = Array.isArray(raw?.services) ? raw.services : [];

  const services = servicesRaw
    .filter((slot: any) =>
      typeof slot?.day === "string" &&
      VALID_TEMPO_DAYS.has(slot.day) &&
      typeof slot?.startTime === "string" &&
      slot.startTime.trim().length > 0
    )
    .map((slot: any) => ({
      day: slot.day,
      startTime: String(slot.startTime).trim(),
      endTime:
        typeof slot?.endTime === "string" && slot.endTime.trim().length > 0
          ? slot.endTime.trim()
          : undefined,
      label:
        typeof slot?.label === "string" && slot.label.trim().length > 0
          ? slot.label.trim()
          : undefined,
    }));

  if (services.length === 0) return undefined;

  return {
    timezone:
      typeof raw?.timezone === "string" && raw.timezone.trim().length > 0
        ? raw.timezone.trim()
        : undefined,
    services,
  };
}

function mapTemplo(raw: any): Templo {
  return {
    id: raw._id,
    temploName: raw.temploName,
    churchNumber: raw.churchNumber,
    address: raw.address ?? undefined,
    googleMapsUrl: raw.googleMapsUrl ?? undefined,
    phone: raw.phone ?? undefined,
    photos: sanityImagesUrls(raw.photos),
    schedule: mapTemploSchedule(raw.schedule),
    description: raw.description ?? undefined,
    presidenteJovenesName: raw.presidenteJovenesName ?? undefined,
    presidenteJovenesPhone: raw.presidenteJovenesPhone ?? undefined,
    latitude: raw.location?.lat,
    longitude: raw.location?.lng,
    pastores: (raw.pastores ?? []).map(mapTemploPastor),
    coros: (raw.coros ?? []).map(mapTemploCoro),
  };
}

/**
 * Fetch all active templos for a region, with their pastores and coros joined.
 * Uses GROQ reverse references to join pastor and coro documents.
 * Ordered by churchNumber ascending.
 */
export async function getTemplos(
  regionSlug: string = "mayo",
): Promise<Templo[]> {
  if (!SANITY_ENABLED) return getMockTemplos(regionSlug);

  return readWithDevSanityFallback("getTemplos", () => getMockTemplos(regionSlug), async () => {
    const client = getSanityClient();
    const templos = await client.fetch(
      `*[
        _type == "templo" &&
        (region->slug.current == $slug || region->name == $slug) &&
        !defined(deletedAt)
      ] | order(churchNumber asc){
        _id,
        temploName,
        churchNumber,
        address,
        googleMapsUrl,
        location,
        phone,
        photos[]{asset->{url}},
        schedule{
          timezone,
          services[]{
            day,
            startTime,
            endTime,
            label
          }
        },
        description,
        presidenteJovenesName,
        presidenteJovenesPhone,
        "pastores": *[
          _type == "pastor" &&
          templo._ref == ^._id &&
          !defined(deletedAt)
        ]{_id, fullName, phone},
        "coros": *[
          _type == "coro" &&
          templo._ref == ^._id &&
          !defined(deletedAt)
        ]{_id, coroName, presidentName, presidentPhone}
      }`,
      { slug: regionSlug },
    );

    return (templos ?? []).map(mapTemplo);
  });
}
