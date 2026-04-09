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

function mapEvent(raw: any): Event {
  const date = toDate(raw.date);
  const endDate = raw.endDate ? toDate(raw.endDate) : undefined;
  const image = sanityImageUrl(raw.image);
  const photos = sanityImagesUrls(raw.photos);
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
    location: raw.location,
    address: raw.address,
    googleMapsUrl: raw.googleMapsUrl,
    description: raw.description,
    vestimenta: raw.vestimenta,
    vestimentaCustom: raw.vestimentaCustom,
    image,
    status: (raw.status ?? "upcoming") as Event["status"],
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

function mapPastor(raw: any): Pastor {
  return {
    id: raw._id,
    fullName: raw.fullName,
    churchName: raw.churchName,
    churchNumber: raw.churchNumber ?? undefined,
    temploName: raw.temploName ?? raw.templo?.temploName,
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
    if (isMayoRegion(regionSlug)) return eventsData;
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
        status,
        albumEnabled,
        googleDriveAlbumUrl,
        facebookPostUrl,
        registrationEnabled,
        photos[]{asset->{url}},
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

  return (events ?? []).map(mapEvent);
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
        templo->{temploName, address, googleMapsUrl}
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
        templo->{temploName, address, googleMapsUrl}
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
        templo->{temploName, address, googleMapsUrl}
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
    heroTitle: raw.heroTitle || "Bienvenido a Región Mayo",
    heroSubtitle: raw.heroSubtitle || "Vive la Comunidad",
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

function mapTemplo(raw: any): Templo {
  return {
    id: raw._id,
    temploName: raw.temploName,
    churchNumber: raw.churchNumber,
    address: raw.address ?? undefined,
    googleMapsUrl: raw.googleMapsUrl ?? undefined,
    phone: raw.phone ?? undefined,
    photo: raw.photo ? sanityImageUrl(raw.photo) : undefined,
    description: raw.description ?? undefined,
    presidenteJovenesName: raw.presidenteJovenesName ?? undefined,
    presidenteJovenesPhone: raw.presidenteJovenesPhone ?? undefined,
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
      phone,
      photo{asset->{url}},
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
