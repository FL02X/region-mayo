// ============================================
// Región Mayo - Sanity CMS API Layer
// ============================================

import type { Region, Event, Pastor, Coro, DirectivaMember, RegionPresident } from "./types"
import { getSanityClient } from "./sanity/client"
import { sanityImageUrl, sanityImagesUrls } from "./sanity/image"
import {
  regionMayo,
  eventsData,
  pastorsData,
  corosData,
  directivaData,
  availableRegions,
  regionPresident,
} from "./mock-data"

const SANITY_ENABLED = Boolean(process.env.SANITY_PROJECT_ID && process.env.SANITY_DATASET)

function isMayoRegion(input: string): boolean {
  return input === "mayo" || input === "Región Mayo" || input === "region-mayo"
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    // Fail loudly: event dates are required and used for filtering.
    throw new Error(`Invalid date value from Sanity: ${String(value)}`)
  }
  return date
}

function mapEvent(raw: any): Event {
  const date = toDate(raw.date)
  const endDate = raw.endDate ? toDate(raw.endDate) : undefined
  const image = sanityImageUrl(raw.image)
  const photos = sanityImagesUrls(raw.photos)
  const typeColor = (raw.typeColor ?? "worship") as Event["typeColor"]

  return {
    id: raw._id,
    title: raw.title,
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
    isMultiDayEvent: raw.isMultiDayEvent ?? undefined,
    eventGroupId: raw.eventGroupId ?? undefined,
  }
}

function mapPastor(raw: any): Pastor {
  return {
    id: raw._id,
    fullName: raw.fullName,
    churchName: raw.churchName,
    churchNumber: raw.churchNumber ?? undefined,
    photo: raw.photo ? sanityImageUrl(raw.photo) : undefined,
    googleMapsUrl: raw.googleMapsUrl ?? undefined,
    phone: raw.phone ?? undefined,
  }
}

function mapCoro(raw: any): Coro {
  return {
    id: raw._id,
    coroName: raw.coroName,
    photo: raw.photo ? sanityImageUrl(raw.photo) : "/placeholder.svg",
    googleMapsUrl: raw.googleMapsUrl ?? undefined,
    presidentName: raw.presidentName,
    presidentPhone: raw.presidentPhone,
  }
}

function mapDirectivaMember(raw: any): DirectivaMember {
  return {
    id: raw._id,
    fullName: raw.fullName,
    role: raw.role ?? undefined,
    churchName: raw.churchName,
    photo: raw.photo ? sanityImageUrl(raw.photo) : undefined,
    googleMapsUrl: raw.googleMapsUrl ?? undefined,
    phone: raw.phone,
  }
}

function mapRegion(raw: any, regionSlugFallback: string): Region {
  return {
    id: raw._id ?? regionSlugFallback,
    name: raw.name,
    slug: raw.slug?.current ?? regionSlugFallback,
    socialLinks: raw.socialLinks ?? {},
    primaryColor: raw.primaryColor ?? undefined,
    secondaryColor: raw.secondaryColor ?? undefined,
  }
}

// ============================================
// Region APIs
// ============================================

export async function getRegionConfig(regionSlug: string = "mayo"): Promise<Region | null> {
  if (!SANITY_ENABLED) {
    if (isMayoRegion(regionSlug)) return regionMayo
    return null
  }

  const client = getSanityClient()
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
  )

  if (!region) {
    return null
  }
  return mapRegion(region, regionSlug)
}

export async function getAvailableRegions(): Promise<string[]> {
  if (!SANITY_ENABLED) return availableRegions

  const client = getSanityClient()
  const regions = await client.fetch(
    `*[_type == "region"] | order(name asc){
      name
    }`,
  )
  return (regions ?? []).map((r: any) => r.name).filter(Boolean)
}

// ============================================
// Events APIs
// ============================================

export async function getEvents(regionSlug: string = "mayo"): Promise<Event[]> {
  if (!SANITY_ENABLED) {
    if (isMayoRegion(regionSlug)) return eventsData
    return []
  }

  const client = getSanityClient()
  const events = await client.fetch(
    `*[_type == "event" && (region->slug.current == $slug || region->name == $slug)]
      | order(date asc){
        _id,
        title,
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
        eventGroupId
      }`,
    { slug: regionSlug },
  )

  return (events ?? []).map(mapEvent)
}

export async function getUpcomingEvents(regionSlug: string = "mayo"): Promise<Event[]> {
  const events = await getEvents(regionSlug)
  const now = new Date()
  return events.filter(event => event.date >= now)
}

export async function getPastEvents(regionSlug: string = "mayo"): Promise<Event[]> {
  const events = await getEvents(regionSlug)
  const now = new Date()
  return events.filter(event => event.date < now && event.albumEnabled)
}

export async function getEventById(id: string): Promise<Event | undefined> {
  const events = await getEvents()
  return events.find(event => event.id === id)
}

// ============================================
// Pastors APIs
// ============================================

export async function getPastors(regionSlug: string = "mayo"): Promise<Pastor[]> {
  if (!SANITY_ENABLED) {
    if (isMayoRegion(regionSlug)) return pastorsData
    return []
  }

  const client = getSanityClient()
  const pastors = await client.fetch(
    `*[_type == "pastor" && (region->slug.current == $slug || region->name == $slug)]
      | order(fullName asc){
        _id,
        fullName,
        churchName,
        churchNumber,
        photo{asset->{url}},
        googleMapsUrl,
        phone
      }`,
    { slug: regionSlug },
  )

  return (pastors ?? []).map(mapPastor)
}

export async function getPastorById(id: string): Promise<Pastor | undefined> {
  const pastors = await getPastors()
  return pastors.find(pastor => pastor.id === id)
}

// ============================================
// Coros APIs
// ============================================

export async function getCoros(regionSlug: string = "mayo"): Promise<Coro[]> {
  if (!SANITY_ENABLED) {
    if (isMayoRegion(regionSlug)) return corosData
    return []
  }

  const client = getSanityClient()
  const coros = await client.fetch(
    `*[_type == "coro" && (region->slug.current == $slug || region->name == $slug)]
      | order(coroName asc){
        _id,
        coroName,
        photo{asset->{url}},
        googleMapsUrl,
        presidentName,
        presidentPhone
      }`,
    { slug: regionSlug },
  )

  return (coros ?? []).map(mapCoro)
}

export async function getCoroById(id: string): Promise<Coro | undefined> {
  const coros = await getCoros()
  return coros.find(coro => coro.id === id)
}

// ============================================
// Directiva APIs
// ============================================

export async function getDirectiva(regionSlug: string = "mayo"): Promise<DirectivaMember[]> {
  if (!SANITY_ENABLED) {
    if (isMayoRegion(regionSlug)) return directivaData
    return []
  }

  const client = getSanityClient()
  const directiva = await client.fetch(
    `*[_type == "directiva" && (region->slug.current == $slug || region->name == $slug)]
      | order(order asc){
        _id,
        fullName,
        role,
        churchName,
        photo{asset->{url}},
        googleMapsUrl,
        phone,
        order
      }`,
    { slug: regionSlug },
  )

  return (directiva ?? []).map(mapDirectivaMember)
}

export async function getDirectivaMemberById(id: string): Promise<DirectivaMember | undefined> {
  const directiva = await getDirectiva()
  return directiva.find(member => member.id === id)
}

export async function getRegionPresident(regionSlug: string = "mayo"): Promise<RegionPresident | null> {
  if (!SANITY_ENABLED) {
    if (isMayoRegion(regionSlug)) return regionPresident
    return null
  }

  const client = getSanityClient()

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
  )

  if (president?.fullName && president?.phone) return president as RegionPresident

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
  )

  if (!fallback?.fullName || !fallback?.phone) {
    return null
  }

  return fallback as RegionPresident
}
