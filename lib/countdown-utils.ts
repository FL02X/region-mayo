// ============================================
// Region Mayo - Countdown Utilities
// ============================================

import type { Event, CountdownData } from "./types"

const DAYS_BEFORE_EVENT = 5
const DAYS_AFTER_EVENT = 3
const MS_PER_SECOND = 1000
const MS_PER_MINUTE = MS_PER_SECOND * 60
const MS_PER_HOUR = MS_PER_MINUTE * 60
const MS_PER_DAY = MS_PER_HOUR * 24

// Toggle: set to `true` to allow automatic post-event album cards.
// Set to `false` to hide 'Comparte tus fotos' cards and related gallery auto-creation.
export const ALBUM_SHARING_ENABLED = false

/**
 * Check if an event is within the countdown window (5 days before)
 */
export function isEventInCountdownWindow(event: Event, now: Date = new Date()): boolean {
  const eventDate = new Date(event.date)
  const diffMs = eventDate.getTime() - now.getTime()
  const diffDays = diffMs / MS_PER_DAY
  
  return diffDays > 0 && diffDays <= DAYS_BEFORE_EVENT
}

/**
 * Check if an event is in the post-event album sharing window (3 days after)
 * Also checks that there's no upcoming event within 2 days that should take priority
 */
export function isEventInAlbumWindow(event: Event, allEvents: Event[], now: Date = new Date()): boolean {
  // Must have album enabled and a Google Drive link
  if (!event.albumEnabled || !event.googleDriveAlbumUrl) return false
  
  const eventDate = new Date(event.date)
  const diffMs = now.getTime() - eventDate.getTime()
  const diffDays = diffMs / MS_PER_DAY
  
  // Not in the 3-day window after the event
  if (diffDays <= 0 || diffDays > DAYS_AFTER_EVENT) return false
  
  // Check if there's an upcoming event within 2 days
  const nextUpcomingEvent = getNextUpcomingEvent(allEvents, now)
  if (nextUpcomingEvent) {
    const nextEventDate = new Date(nextUpcomingEvent.date)
    const daysUntilNext = (nextEventDate.getTime() - now.getTime()) / MS_PER_DAY
    
    // If next event is within 2 days, we need to calculate the split
    // If the post-event window would overlap with the countdown, limit it
    if (daysUntilNext <= 2) {
      // Calculate how many days the album window has had
      // Give it at least 1 day, then switch to countdown
      const albumDaysUsed = Math.floor(diffDays)
      
      // If we're on day 2+ of the album window and countdown needs to start
      // Prioritize countdown over album
      if (albumDaysUsed >= 1 && daysUntilNext <= 1) {
        return false
      }
    }
  }
  
  return true
}

/**
 * Get the next upcoming event (not yet started)
 */
export function getNextUpcomingEvent(events: Event[], now: Date = new Date()): Event | null {
  const upcomingEvents = events
    .filter(e => new Date(e.date).getTime() > now.getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  return upcomingEvents.length > 0 ? upcomingEvents[0] : null
}

/**
 * Get the next event that should show a countdown
 */
export function getCountdownEvent(events: Event[], now: Date = new Date()): Event | null {
  return getNextUpcomingEvent(events, now)
}

/**
 * Get events that are in the album sharing window
 */
export function getAlbumSharingEvents(events: Event[], now: Date = new Date()): Event[] {
  if (!ALBUM_SHARING_ENABLED) return []

  return events.filter(e => isEventInAlbumWindow(e, events, now))
}

/**
 * Calculate countdown data for an event
 */
export function calculateCountdown(event: Event, now: Date = new Date()): CountdownData {
  const eventDate = new Date(event.date)
  const diffMs = eventDate.getTime() - now.getTime()
  
  const isPostEvent = diffMs < 0
  
  if (isPostEvent) {
    const daysSinceEvent = Math.floor(Math.abs(diffMs) / MS_PER_DAY)
    return {
      event,
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      isPostEvent: true,
      daysSinceEvent,
    }
  }
  
  const daysRemaining = Math.floor(diffMs / MS_PER_DAY)
  const hoursRemaining = Math.floor((diffMs % MS_PER_DAY) / MS_PER_HOUR)
  const minutesRemaining = Math.floor((diffMs % MS_PER_HOUR) / MS_PER_MINUTE)
  const secondsRemaining = Math.floor((diffMs % MS_PER_MINUTE) / MS_PER_SECOND)
  
  return {
    event,
    daysRemaining,
    hoursRemaining,
    minutesRemaining,
    secondsRemaining,
    isPostEvent: false,
  }
}

/**
 * Format countdown for display
 */
export function formatCountdown(countdown: CountdownData): string {
  if (countdown.isPostEvent) {
    return "Evento finalizado"
  }
  
  const { daysRemaining, hoursRemaining, minutesRemaining, secondsRemaining } = countdown
  
  if (daysRemaining > 0) {
    return `${daysRemaining}d ${hoursRemaining}h ${minutesRemaining}m`
  }
  
  if (hoursRemaining > 0) {
    return `${hoursRemaining}h ${minutesRemaining}m ${secondsRemaining}s`
  }
  
  return `${minutesRemaining}m ${secondsRemaining}s`
}

/**
 * Get urgency level based on time remaining
 */
export function getCountdownUrgency(countdown: CountdownData): "low" | "medium" | "high" | "critical" {
  const { daysRemaining, hoursRemaining, isPostEvent } = countdown
  
  if (isPostEvent) return "low"
  if (daysRemaining === 0 && hoursRemaining < 6) return "critical"
  if (daysRemaining === 0) return "high"
  if (daysRemaining <= 2) return "medium"
  return "low"
}
