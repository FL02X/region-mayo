/**
 * RANKING ENGINE - Hero Section Content Priority
 *
 * Este archivo implementa el sistema de ranking que decide:
 * - Qué contenido aparece en el hero (grande, destacado)
 * - Qué contenido va al action-deck (fallback secundario)
 * - En qué orden aparecen los items en el deck
 *
 * ENTIDADES QUE COMPITEN:
 * 1. Custom Hero Card (tarjeta personalizada por admin)
 * 2. Prayer Wall (muro de oraciones en fase SHOW)
 * 3. Event Countdown (si evento es en <72h)
 * 4. Social Post (Instagram o Facebook más reciente)
 *
 * REGLAS DE PRIORIDAD (en orden):
 * 1. Prayer Wall en fase SHOW + recientemente publicado → MAX PRIORITY
 * 2. Custom Card publicada hace <24h → HIGH PRIORITY
 * 3. Event dentro de <72h → MEDIUM-HIGH PRIORITY
 * 4. Latest Social Post (IG o FB) → MEDIUM PRIORITY
 * 5. Fallback: Mostrar lo más relevante disponible
 */

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

export type HeroCandidate =
  | {
      type: 'custom'
      id: string
      publishedAt: number // timestamp ms
      accentColor: string
      media: { isVertical: boolean; alt: string; url?: string }
      url?: string
      ctaText?: string
      pinned?: boolean
      priorityWeight?: number
    }
  | {
      type: 'prayer'
      id: string
      phase: 'collect' | 'show' | 'paused'
      publishedAt: number // timestamp ms
      selectedPrayersCount: number
      pinned?: boolean
    }
  | {
      type: 'event'
      id: string
      date: number // timestamp ms
      title: string
      time?: string
      location?: string
      address?: string
      registrationEnabled?: boolean
      image?: string
      pinned?: boolean
    }
  | {
      type: 'social'
      id: string
      network: 'instagram' | 'facebook'
      postedAt: number // timestamp ms
      url: string
      caption?: string
      media?: { isVertical: boolean }
      pinned?: boolean
    }

export interface RankedCandidate {
  item: HeroCandidate
  score: number
  reason?: string // debug
}

export interface HeroPickResult {
  hero: HeroCandidate | null
  deck: HeroCandidate[]
  debug?: {
    allCandidates: RankedCandidate[]
    heroReason: string
  }
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const MS_HOUR = 60 * 60 * 1000
const MS_DAY = 24 * MS_HOUR
const MS_3_DAYS = 72 * MS_HOUR

// Scoring base por tipo
const SCORE_BASE = {
  prayer_show: 5000, // Prayer en fase SHOW: máxima prioridad
  prayer_collect: 100, // Prayer en COLLECT: baja prioridad
  prayer_paused: 0, // Prayer pausado: ignorar
  custom_fresh: 3500, // Custom publicado hace <24h
  custom_decayed: 1200, // Custom después de 24h, con decay
  event_soon: 2500, // Event dentro de 72h
  event_far: 200, // Event lejano (>72h)
  social: 500, // Social post base
  pinned_boost: 2000, // Bonus si está "pinned"
}

// ═══════════════════════════════════════════════════════════════════
// CORE SCORING FUNCTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Calcula el score de un candidato basado en su tipo y metadatos.
 * Score más alto = más probable que sea elegido para el hero.
 */
export function scoreCandidate(
  candidate: HeroCandidate,
  now = Date.now()
): number {
  let score = 0

  // Bonus si está pinned (pero no anula las reglas absolutas de prayer+custom)
  if (candidate.pinned && candidate.type !== 'prayer' && candidate.type !== 'custom') {
    score += SCORE_BASE.pinned_boost
  }

  switch (candidate.type) {
    case 'prayer': {
      if (candidate.phase === 'show') {
        // Prayer en SHOW: máxima prioridad, pero decae lentamente
        const age = now - candidate.publishedAt
        score += SCORE_BASE.prayer_show - Math.floor(age / (12 * MS_HOUR)) * 50
      } else if (candidate.phase === 'collect') {
        // En COLLECT: baja prioridad, puede ser superado
        score += SCORE_BASE.prayer_collect
      } else {
        // En PAUSED: ignorar
        score += 0
      }
      break
    }

    case 'custom': {
      const age = now - candidate.publishedAt

      // Dentro de 24h: garantizado high priority
      if (age <= MS_DAY) {
        score += SCORE_BASE.custom_fresh
      } else {
        // Después de 24h: decay gradual (pierde ~100pts por día)
        const daysSince = Math.floor(age / MS_DAY)
        score += Math.max(800, SCORE_BASE.custom_decayed - daysSince * 100)
      }

      // Bonus admin override (priorityWeight)
      if (candidate.priorityWeight) {
        score += candidate.priorityWeight
      }

      if (candidate.pinned) {
        score += SCORE_BASE.pinned_boost
      }
      break
    }

    case 'event': {
      const diff = candidate.date - now

      // Dentro de 72h y no muy pasado: alta prioridad
      if (diff <= MS_3_DAYS && diff >= -2 * MS_HOUR) {
        score += SCORE_BASE.event_soon

        // Más cercano = más score
        const hoursUntil = diff / MS_HOUR
        score += Math.max(0, Math.floor((72 - hoursUntil) * 10))
      } else if (diff > MS_3_DAYS) {
        // Evento lejano: baja prioridad
        score += SCORE_BASE.event_far
      } else {
        // Evento pasado: muy baja
        score += 10
      }

      if (candidate.pinned) {
        score += SCORE_BASE.pinned_boost
      }
      break
    }

    case 'social': {
      const hours = Math.max(0, Math.floor((now - candidate.postedAt) / MS_HOUR))

      // Decay lineal: -10 pts por hora desde publicación
      // Mantiene relevancia durante ~50h antes de quedar muy atrás
      score += Math.max(SCORE_BASE.social - hours * 10, 50)

      // Instagram ligeramente más relevante (trending)
      if (candidate.network === 'instagram') {
        score += 20
      }

      if (candidate.pinned) {
        score += SCORE_BASE.pinned_boost
      }
      break
    }
  }

  return Math.max(0, score)
}

// ═══════════════════════════════════════════════════════════════════
// RANKING FUNCTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Ordena todos los candidatos por score.
 * Retorna array de candidatos con scores (para debug y decisión).
 */
export function rankCandidates(
  candidates: HeroCandidate[],
  now = Date.now()
): RankedCandidate[] {
  const scored = candidates.map((item) => ({
    item,
    score: scoreCandidate(item, now),
  }))

  // Ordenar por score DESC, luego por publish date DESC (más reciente gana empates)
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }

    // Tiebreaker: más reciente gana
    const aTime =
      'publishedAt' in a.item
        ? a.item.publishedAt
        : 'postedAt' in a.item
          ? a.item.postedAt
          : a.item.date

    const bTime =
      'publishedAt' in b.item
        ? b.item.publishedAt
        : 'postedAt' in b.item
          ? b.item.postedAt
          : b.item.date

    return bTime - aTime
  })

  return scored
}

// ═══════════════════════════════════════════════════════════════════
// HERO PICKER - REGLAS ABSOLUTAS
// ═══════════════════════════════════════════════════════════════════

/**
 * Aplica REGLAS ABSOLUTAS para decidir qué va al hero.
 * Las reglas absolutas IGNORAN el scoring genérico.
 *
 * ORDEN DE AUTORIDAD (de mayor a menor):
 * 1. Custom pinned = SIEMPRE hero
 * 2. Custom <24h = SIEMPRE hero
 * 3. Prayer activo (COLLECT o SHOW) = SIEMPRE hero
 * 4. Next upcoming event = hero
 * 5. Más alto scored = fallback
 */
export function pickHeroAndDeck(
  candidates: HeroCandidate[],
  now = Date.now(),
  debug = false
): HeroPickResult {
  if (candidates.length === 0) {
    return { hero: null, deck: [], debug: { allCandidates: [], heroReason: 'no candidates' } }
  }

  // If there are NO prayer/custom candidates AND the Meta social API keys
  // are not configured, prefer to ignore social candidates entirely so the
  // ranking will choose the next upcoming event. This avoids showing a
  // social "fallback" (e.g., an Instagram URL box) when the integration
  // isn't properly set up.
  const hasPrayerCandidate = candidates.some((c) => c.type === 'prayer')
  const hasCustomCandidate = candidates.some((c) => c.type === 'custom')
  const hasMetaKeys = Boolean(
    process.env.META_PAGE_ACCESS_TOKEN ||
      process.env.META_INSTAGRAM_ACCOUNT_ID ||
      process.env.META_FACEBOOK_PAGE_ID,
  )

  const candidatesToRank = !hasPrayerCandidate && !hasCustomCandidate && !hasMetaKeys
    ? candidates.filter((c) => c.type !== 'social')
    : candidates

  const ranked = rankCandidates(candidatesToRank, now)
  let hero: HeroCandidate | null = null
  let heroReason = ''

  // ───────────────────────────────────────────────────────────
  // REGLA 1: Custom pinned = ABSOLUTE PRIORITY
  // ───────────────────────────────────────────────────────────
  const customPinned = ranked.find(
    (r) => r.item.type === 'custom' && r.item.pinned
  )
  if (customPinned) {
    hero = customPinned.item
    heroReason = 'custom_pinned'
  }

  // ───────────────────────────────────────────────────────────
  // REGLA 2: Custom <24h = HIGH PRIORITY
  // ───────────────────────────────────────────────────────────
  if (!hero) {
    const customFresh = ranked.find(
      (r) =>
        r.item.type === 'custom' &&
        now - r.item.publishedAt <= MS_DAY
    )
    if (customFresh) {
      hero = customFresh.item
      heroReason = 'custom_fresh_24h'
    }
  }

  // ───────────────────────────────────────────────────────────
  // REGLA 3: Prayer activo (COLLECT o SHOW)
  // ───────────────────────────────────────────────────────────
  if (!hero) {
    const activePrayer = ranked.find(
      (r) => r.item.type === 'prayer' && r.item.phase !== 'paused'
    )
    if (activePrayer && activePrayer.item.type === 'prayer') {
      const prayerItem = activePrayer.item
      hero = prayerItem
      heroReason =
        prayerItem.phase === 'show'
          ? 'prayer_show_active'
          : 'prayer_collect_active'
    }
  }

  // ───────────────────────────────────────────────────────────
  // REGLA 3: Next upcoming event (chronologically earliest future event)
  // Prefer the next event coming after `now` (the nearest future date).
  // This ensures the hero shows the truly next event from Sanity.
  // ───────────────────────────────────────────────────────────
  if (!hero) {
    const futureEvents = (candidatesToRank as HeroCandidate[])
      .filter((c) => c.type === 'event' && (c as any).date > now)
      .sort((a: any, b: any) => a.date - b.date)

    if (futureEvents.length > 0) {
      hero = futureEvents[0]
      heroReason = 'next_upcoming_event'
    }
  }

  // ───────────────────────────────────────────────────────────
  // NEW RULE: If there are NO Prayer candidates and NO Custom hero
  // AND the Meta (Instagram/Facebook) env keys are NOT configured,
  // prefer the next upcoming event in the calendar (nearest future).
  // This ensures that when there is no hero content and no social
  // integration available, the site highlights the next event.
  // ───────────────────────────────────────────────────────────
  if (!hero) {
    const hasPrayerCandidate = candidates.some((c) => c.type === 'prayer')
    const hasCustomCandidate = candidates.some((c) => c.type === 'custom')

    const hasMetaKeys = Boolean(
      process.env.META_PAGE_ACCESS_TOKEN ||
        process.env.META_INSTAGRAM_ACCOUNT_ID ||
        process.env.META_FACEBOOK_PAGE_ID,
    )

    if (!hasPrayerCandidate && !hasCustomCandidate && !hasMetaKeys) {
      const futureEvents = (candidates as HeroCandidate[])
        .filter((c) => c.type === 'event' && (c as any).date > now)
        .sort((a: any, b: any) => a.date - b.date)

      if (futureEvents.length > 0) {
        hero = futureEvents[0]
        heroReason = 'next_upcoming_event_fallback'
      }
    }
  }

  // ───────────────────────────────────────────────────────────
  // REGLA 4: FALLBACK = Top scored candidate
  // ───────────────────────────────────────────────────────────
  if (!hero && ranked.length > 0) {
    hero = ranked[0].item
    heroReason = `top_scored_${hero.type}`
  }

  // Deck = todos menos el hero, manteniendo orden de ranking
  const deck = ranked
    .filter((r) => r.item !== hero)
    .map((r) => r.item)

  return {
    hero,
    deck,
    ...(debug && {
      debug: {
        allCandidates: ranked,
        heroReason,
      },
    }),
  }
}

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Retorna un resumen en string de por qué fue elegido un candidato.
 * Útil para debug y entender decisiones.
 */
export function getHeroReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    prayer_show_active: '🟢 Muro de Oraciones activo',
    prayer_collect_active: '🟢 Muro de Oraciones activo',
    custom_pinned: '📌 Tarjeta personalizada fijada',
    custom_fresh_24h: '🟦 Tarjeta personalizada reciente',
    event_within_72h: '🔵 Evento próximo (< 3 días)',
    next_upcoming_event: '🔵 Siguiente evento en calendario',
    top_scored_social: '🟣 Publicación social más reciente',
    no_candidates: '❓ Sin contenido disponible',
    next_upcoming_event_fallback: '🔵 Evento siguiente en calendario',
  }
  return labels[reason] || `${reason} (unknown)`
}

/**
 * Detecta si un candidate es "vertical" (para ajustar responsive).
 */
export function isVerticalMedia(candidate: HeroCandidate): boolean {
  if (candidate.type === 'custom') {
    return candidate.media.isVertical
  }
  if (candidate.type === 'social' && candidate.media) {
    return candidate.media.isVertical
  }
  return false
}

/**
 * Obtiene el color de acento para un candidato.
 */
export function getAccentColor(candidate: HeroCandidate): string {
  switch (candidate.type) {
    case 'custom':
      return candidate.accentColor || '#2f5e93'
    case 'prayer':
      return '#2d6a4f' // Verde prayer wall
    case 'event':
      return '#2f5e93' // Azul evento
    case 'social':
      return candidate.network === 'instagram' ? '#6d49a8' : '#1b74e4'
    default:
      return '#2f5e93'
  }
}

export default {
  scoreCandidate,
  rankCandidates,
  pickHeroAndDeck,
  getHeroReasonLabel,
  isVerticalMedia,
  getAccentColor,
}
