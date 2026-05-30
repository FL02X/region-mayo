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
  AlbumImage,
} from "./types";
import { getSanityClient } from "./sanity/client";
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

function isMayoRegion(input: string): boolean {
  return input === "mayo" || input === "Región Mayo" || input === "region-mayo";
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
  const date = toDate(raw.date);
  const endDate = raw.endDate ? toDate(raw.endDate) : undefined;

  const hasEventImage = Boolean(raw.image?.asset?.url || (typeof raw.image === "string" && raw.image.length > 0));
  const photos = sanityImagesUrls(raw.photos);
  const eventGalleryFirstPhoto = photos.length > 0 ? photos[0] : undefined;
  // Event primary image (can be undefined). If missing, prefer the event gallery and then the templo's first photo.
  const eventImage = hasEventImage ? sanityImageUrl(raw.image) : undefined;
  const temploFirstPhoto = raw.templo && Array.isArray(raw.templo.photos) && raw.templo.photos.length > 0
    ? sanityImageUrl(raw.templo.photos[0])
    : undefined;
  const image = eventImage || eventGalleryFirstPhoto || temploFirstPhoto || "/placeholder.svg";
  const typeColor = (raw.typeColor ?? "worship") as Event["typeColor"];

  return {
    id: raw._id,
    title: raw.title,
    eventType: raw.eventType ?? "culto",
    type: typeColor,
    typeColor,
    date,
    endDate,
    time: raw.time,
    location: raw.templo?.temploName ?? raw.location,
    address: raw.templo?.address ?? raw.address,
    googleMapsUrl: raw.templo?.googleMapsUrl ?? raw.googleMapsUrl,
    description: raw.description ?? undefined,
    vestimenta: raw.vestimenta,
    vestimentaCustom: raw.vestimentaCustom,
    image,
    status: computeEventStatus(date, endDate, now),
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
      raw.pastorMensaje || raw.pastorMensajeCustom || raw.jovenPreside
        ? {
            pastorMensaje:
              (raw.pastorMensaje?.fullName || raw.pastorMensajeCustom) ??
              undefined,
            pastorMensajeId: raw.pastorMensaje?._id ?? undefined,
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

function mapAlbumImage(raw: any, albumTitle: string, index: number): AlbumImage | null {
  const url = sanityImageUrl(raw?.image);
  if (!url || url === "/placeholder.svg") return null;

  return {
    url,
    alt: albumAlt(albumTitle, index, raw?.alt),
    caption:
      typeof raw?.caption === "string" && raw.caption.trim().length > 0
        ? raw.caption.trim()
        : undefined,
  };
}

function mapAlbum(raw: any): Album {
  const title = raw?.title || "Album";
  const relatedEvent = raw?.relatedEvent;
  const category = relatedEvent?.eventType ?? raw?.category ?? "culto";
  const images = Array.isArray(raw?.images)
    ? raw.images
        .map((image: any, index: number) => mapAlbumImage(image, title, index))
        .filter(Boolean)
    : [];

  return {
    id: raw._id,
    title,
    slug: raw.slug?.current ?? raw.slug ?? raw._id,
    startDate: toDate(raw.startDate),
    endDate: toDate(raw.endDate ?? raw.startDate),
    category,
    description: raw.description ?? undefined,
    coverImage: sanityImageUrl(raw.coverImage),
    facebookUrl: raw.facebookUrl ?? undefined,
    hidden: Boolean(raw.hidden),
    relatedEvent: relatedEvent
      ? {
          id: relatedEvent._id,
          title: relatedEvent.title,
          eventType: relatedEvent.eventType ?? category,
          date: toDate(relatedEvent.date),
          endDate: relatedEvent.endDate ? toDate(relatedEvent.endDate) : undefined,
          location: relatedEvent.templo?.temploName ?? relatedEvent.location ?? undefined,
        }
      : undefined,
    images: images as AlbumImage[],
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
  if (!SANITY_ENABLED) {
    if (isMayoRegion(regionSlug)) return regionMayo;
    return null;
  }

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
}

export async function getAvailableRegions(): Promise<string[]> {
  if (!SANITY_ENABLED) return availableRegions;

  const client = getSanityClient();
  const regions = await client.fetch(
    `*[_type == "region"] | order(name asc){
      name
    }`,
  );
  return (regions ?? []).map((r: any) => r.name).filter(Boolean);
}

// ============================================
// Events APIs
// ============================================

export async function getEvents(regionSlug: string = "mayo"): Promise<Event[]> {
  if (!SANITY_ENABLED) {
    if (isMayoRegion(regionSlug)) {
      const now = new Date();
      return eventsData.map((event) => ({
        ...event,
        status: computeEventStatus(event.date, event.endDate, now),
      }));
    }
    return [];
  }

  const client = getSanityClient();
  const events = await client.fetch(
    `*[_type == "event" && (region->slug.current == $slug || region->name == $slug)]
      | order(date asc){
        _id,
        title,
        eventType,
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
        templo->{temploName, address, googleMapsUrl, photos[]{asset->{url}}},
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
  return (events ?? []).map((event: any) => mapEvent(event, now));
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
      const imageUrls = event.photos?.length ? event.photos : [event.image].filter(Boolean);

      return {
        id: `mock-album-${event.id}`,
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
          url,
          alt: `${event.title} - foto ${index + 1}`,
        })),
      };
    });
}

const ALBUM_PROJECTION = `{
  _id,
  title,
  slug,
  startDate,
  endDate,
  category,
  description,
  coverImage{asset->{url}},
  facebookUrl,
  hidden,
  relatedEvent->{
    _id,
    title,
    eventType,
    date,
    endDate,
    location,
    templo->{temploName}
  },
  images[]{
    image{asset->{url}},
    alt,
    caption
  }
}`;

export async function getAlbums(regionSlug: string = "mayo"): Promise<Album[]> {
  if (!SANITY_ENABLED) return getMockAlbums(regionSlug);

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

  return (albums ?? []).map(mapAlbum);
}

export async function getAlbumBySlug(
  slug: string,
  regionSlug: string = "mayo",
): Promise<Album | null> {
  if (!SANITY_ENABLED) {
    return getMockAlbums(regionSlug).find((album) => album.slug === slug) ?? null;
  }

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
}

export async function getAlbumSlugs(regionSlug: string = "mayo"): Promise<string[]> {
  if (!SANITY_ENABLED) return getMockAlbums(regionSlug).map((album) => album.slug);

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
  if (!SANITY_ENABLED) {
    if (isMayoRegion(regionSlug)) return pastorsData;
    return [];
  }

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
}

export async function getPastorById(id: string): Promise<Pastor | undefined> {
  const pastors = await getPastors();
  return pastors.find((pastor) => pastor.id === id);
}

// ============================================
// Coros APIs
// ============================================

export async function getCoros(regionSlug: string = "mayo"): Promise<Coro[]> {
  if (!SANITY_ENABLED) {
    if (isMayoRegion(regionSlug)) return corosData;
    return [];
  }

  const client = getSanityClient();
  const coros = await client.fetch(
    `*[_type == "coro" && (region->slug.current == $slug || region->name == $slug)]
      | order(coroName asc){
        _id,
        coroName,
        photo{asset->{url}},
        googleMapsUrl,
        presidentName,
        presidentPhone,
        templo->{_id, temploName, address, googleMapsUrl}
      }`,
    { slug: regionSlug },
  );

  return (coros ?? []).map(mapCoro);
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
  if (!SANITY_ENABLED) {
    if (isMayoRegion(regionSlug)) return directivaData;
    return [];
  }

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
  if (!SANITY_ENABLED) {
    if (isMayoRegion(regionSlug)) return regionPresident;
    return null;
  }

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
  if (!SANITY_ENABLED) {
    if (isMayoRegion(regionSlug)) return siteSettingsData;
    return null;
  }

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
}

// ============================================
// Spotlight APIs (Priority Section)
// ============================================

export async function getLatestHeroCard(regionSlug: string = "mayo"): Promise<HeroCard | null> {
  if (!SANITY_ENABLED) return null;

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
}

export async function getPrayerWallConfig(regionSlug: string = "mayo"): Promise<PrayerWallConfig | null> {
  if (!SANITY_ENABLED) return null;

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
}

export async function getLatestSocialPosts(limit: number = 6): Promise<SocialPost[]> {
  if (!SANITY_ENABLED) return [];

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
  if (!SANITY_ENABLED) {
    if (isMayoRegion(regionSlug)) return templosData;
    return [];
  }

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
}
