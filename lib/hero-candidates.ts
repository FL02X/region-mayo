/**
 * HERO CANDIDATES FETCHER
 * 
 * Helper para obtener todos los candidatos del ranking
 * Se ejecuta en el servidor (getServerSide o en app/page.tsx)
 * 
 * CANDIDATOS QUE TRAE:
 * 1. Custom Hero Card (la más reciente)
 * 2. Prayer Wall config + selected prayers
 * 3. Events (todos, pero se filtran en ranker por fecha)
 * 4. Social Posts (cached de Meta API)
 */

import { getSanityClient } from '@/lib/sanity/client'
import type { HeroCandidate } from '@/lib/ranker'
import type { Event, HeroCard, PrayerWallConfig, Prayer, SocialPost } from '@/lib/types'

/**
 * Obtiene el Custom Hero Card más reciente
 */
async function getLatestHeroCard(): Promise<HeroCandidate | null> {
  const client = getSanityClient()
  const query = `*[_type == "heroCard"] | order(publishedAt desc) [0]`

  try {
    const card = (await client.fetch(query)) as HeroCard | null

    if (!card) return null

    return {
      type: 'custom',
      id: card._id,
      publishedAt: new Date(card.publishedAt).getTime(),
      accentColor: card.accentColor || '#2f5e93',
      media: {
        isVertical: Boolean(card.media?.isVertical),
        alt: card.media?.alt || 'Contenido destacado',
      },
      url: card.url,
      ctaText: card.ctaText,
      pinned: card.pinned,
      priorityWeight: card.priorityWeight,
    }
  } catch (error) {
    console.error('❌ Error fetching hero card:', error)
    return null
  }
}

/**
 * Obtiene Prayer Wall config + selected prayers
 */
async function getPrayerWallCandidate(): Promise<HeroCandidate | null> {
  const client = getSanityClient()
  const query = `*[_type == "prayerWall"][0] {
    ...,
    selectedPrayers[]->
  }`

  try {
    const prayerWall = (await client.fetch(query)) as PrayerWallConfig | null

    if (!prayerWall) return null

    // Si no está enabled, ignorar
    if (!prayerWall.enabled) return null

    return {
      type: 'prayer',
      id: prayerWall._id,
      phase: prayerWall.phase,
      publishedAt: new Date(prayerWall.publishedAt).getTime(),
      selectedPrayersCount: prayerWall.selectedPrayers?.length || 0,
      pinned: false,
    }
  } catch (error) {
    console.error('❌ Error fetching prayer wall:', error)
    return null
  }
}

/**
 * Obtiene eventos (se filtran después en ranker)
 */
async function getEventCandidates(regionSlug: string): Promise<HeroCandidate[]> {
  const client = getSanityClient()
  const query = `*[_type == "event" && region->slug.current == $regionSlug] | order(date asc)[0..10]`

  try {
    const events = (await client.fetch(query, { regionSlug })) as Event[]

    return events.map((event) => ({
      type: 'event',
      id: event.id,
      date: new Date(event.date).getTime(),
      title: event.title,
      time: event.time,
      location: event.location,
      address: event.address,
      registrationEnabled: event.registrationEnabled ?? true,
      pinned: false,
    }))
  } catch (error) {
    console.error('❌ Error fetching events:', error)
    return []
  }
}

/**
 * Obtiene Social Posts cached
 */
async function getSocialPostCandidates(): Promise<HeroCandidate[]> {
  const client = getSanityClient()
  const query = `*[_type == "socialPostCache"] | order(postedAt desc)[0..5]`

  try {
    const posts = (await client.fetch(query)) as SocialPost[]

    return posts.map((post) => ({
      type: 'social',
      id: post._id,
      network: post.network,
      postedAt: new Date(post.postedAt).getTime(),
      url: post.url,
      caption: post.caption,
      media: post.media
        ? {
            isVertical: post.media.isVertical,
          }
        : undefined,
      pinned: false,
    }))
  } catch (error) {
    console.error('❌ Error fetching social posts:', error)
    return []
  }
}

/**
 * MAIN: Trae todos los candidatos para ranking
 */
export async function getHeroCandidates(regionSlug: string): Promise<HeroCandidate[]> {
  const candidates: HeroCandidate[] = []

  // Fetch en paralelo
  const [heroCard, prayerWall, events, socialPosts] = await Promise.all([
    getLatestHeroCard(),
    getPrayerWallCandidate(),
    getEventCandidates(regionSlug),
    getSocialPostCandidates(),
  ])

  if (heroCard) candidates.push(heroCard)
  if (prayerWall) candidates.push(prayerWall)
  candidates.push(...events)
  candidates.push(...socialPosts)

  return candidates
}

/**
 * Obtiene datos completos de oraciones seleccionadas para mostrar en carousel
 */
export async function getSelectedPrayers(): Promise<Prayer[]> {
  const client = getSanityClient()
  const query = `*[_type == "prayerWall"][0].selectedPrayers[]->{
    _id,
    text,
    submittedAt
  }`

  try {
    return (await client.fetch(query)) as Prayer[]
  } catch (error) {
    console.error('❌ Error fetching selected prayers:', error)
    return []
  }
}
