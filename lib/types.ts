// ============================================
// Region Mayo - Core TypeScript Types
// Ready for Sanity CMS integration
// ============================================

// Multi-region support
export interface Region {
  id: string
  name: string
  slug: string
  socialLinks: {
    instagram?: string
    facebook?: string
  }
  primaryColor?: string
  secondaryColor?: string
}

// Event types
export type EventStatus = "upcoming" | "active" | "past"
export type EventTypeColor = "worship" | "tour" | "conference" | "youth"
export type Vestimenta = "formal" | "informal" | "otro"

export interface Event {
  id: string
  title: string
  type: string
  typeColor: EventTypeColor
  date: Date
  endDate?: Date // For multi-day events
  time: string
  location: string
  address: string
  googleMapsUrl?: string
  description?: string
  vestimenta?: Vestimenta
  vestimentaCustom?: string // Custom text when vestimenta is "otro"
  image: string
  status: EventStatus
  // Album features
  googleDriveAlbumUrl?: string
  albumEnabled: boolean
  // Multi-day event grouping
  isMultiDayEvent?: boolean
  eventGroupId?: string
  // Social links
  facebookPostUrl?: string
  // Registration status
  registrationEnabled?: boolean
  // Event photos for preview in registration
  photos?: string[]
}

// Pastor directory
export interface Pastor {
  id: string
  fullName: string
  churchName: string
  churchNumber?: string
  photo?: string
  googleMapsUrl?: string
  phone?: string // Optional WhatsApp number
}

// Coros Locales
export interface Coro {
  id: string
  coroName: string
  photo: string
  googleMapsUrl?: string
  presidentName: string
  presidentPhone: string // Will be formatted with +52
}

// Directiva members
export interface DirectivaMember {
  id: string
  fullName: string
  role?: string
  churchName: string
  photo?: string
  googleMapsUrl?: string
  phone: string // Will be formatted with +52 for WhatsApp
}

// Registration form data
export interface RegistrationFormData {
  name: string
  phone: string
  region: string
  isVisiting: boolean
  needsLodging: boolean
  needsTransport: boolean
  attendingAs: "oyente" | "miembro"
  isBaptized: boolean
  isCoroMGR: boolean
}

// Countdown data
export interface CountdownData {
  event: Event
  daysRemaining: number
  hoursRemaining: number
  minutesRemaining: number
  secondsRemaining: number
  isPostEvent: boolean // true if event has passed but within 3 days
  daysSinceEvent?: number
}

// Phone formatting helper type
export interface PhoneNumber {
  countryCode: string // Default: +52
  number: string
  formatted: string // e.g., +52 123 456 7890
}

// Region president info for registration
export interface RegionPresident {
  fullName: string
  phone: string
}
