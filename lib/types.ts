// ============================================
// Region Mayo - Core TypeScript Types
// Ready for Sanity CMS integration
// ============================================

// Multi-region support
export interface Region {
  id: string;
  name: string;
  slug: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
  };
  primaryColor?: string;
  secondaryColor?: string;
}

// Event types
export type EventStatus = "upcoming" | "active" | "past";

// New event types (Tipo de Culto)
export type EventType =
  | "campana"
  | "convencion"
  | "recorrido"
  | "confraternidadJuvenilRegional"
  | "confraternidadJuvenilGeneral"
  | "cultoJuvenil"
  | "culto"
  | "visita"
  | "ensayo"
  | "actividad"
  | "estudioBiblico"
  | "biregional"
  | "congresoBrilla"
  | "boda";

// Legacy type color for backwards compatibility
export type EventTypeColor = "worship" | "tour" | "conference" | "youth";

export type Vestimenta = "uniformeMGR" | "formalCasual" | "informal" | "otro";

// Alimentos section
export interface AlimentosInfo {
  enabled: boolean;
  location?: string;
  googleMapsUrl?: string;
  description?: string;
}

// Junta Juvenil section
export interface JuntaJuvenilInfo {
  enabled: boolean;
  location?: string;
  googleMapsUrl?: string;
  description?: string;
}

// Pastor/Joven info
export interface EventSpeakers {
  pastorMensaje?: string; // Pastor name (from reference or custom)
  pastorMensajeId?: string; // Reference ID if from pastor list
  jovenPreside?: string;
}

// More info section
export interface MoreInfoSection {
  enabled: boolean;
  imageUrl?: string;
}

export interface Event {
  id: string;
  title: string;
  eventType: EventType;
  // Legacy field
  type?: string;
  typeColor?: EventTypeColor;
  date: Date;
  endDate?: Date; // For multi-day events
  time: string;
  location: string;
  address: string;
  googleMapsUrl?: string;
  description?: string;
  vestimenta?: Vestimenta;
  vestimentaCustom?: string;
  image: string;
  status: EventStatus;
  // New optional sections
  alimentos?: AlimentosInfo;
  juntaJuvenil?: JuntaJuvenilInfo;
  speakers?: EventSpeakers;
  moreInfo?: MoreInfoSection;
  // Album features
  googleDriveAlbumUrl?: string;
  albumEnabled: boolean;
  // Multi-day event grouping (legacy)
  isMultiDayEvent?: boolean;
  eventGroupId?: string;
  // Social links
  facebookPostUrl?: string;
  // Registration status
  registrationEnabled?: boolean;
  // Event photos for preview in registration (max 6)
  photos?: string[];
}

export interface AlbumImage {
  url: string;
  alt: string;
  caption?: string;
  source?: "official" | "community";
}

export type AlbumType = "photos" | "youtube";
export type AlbumYoutubeLayout = "auto" | "vertical" | "horizontal";

export interface AlbumVideo {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  publishedAt?: string;
}

export interface AlbumRelatedEvent {
  id: string;
  title: string;
  eventType: EventType;
  date: Date;
  endDate?: Date;
  location?: string;
}

export interface Album {
  id: string;
  albumType: AlbumType;
  title: string;
  slug: string;
  startDate: Date;
  endDate: Date;
  category: EventType;
  description?: string;
  coverImage: string;
  facebookUrl?: string;
  youtubePlaylistId?: string;
  youtubeUrl?: string;
  youtubeLayout?: AlbumYoutubeLayout;
  hidden: boolean;
  allowSubmissions?: boolean;
  submissionsCloseAt?: Date;
  uploadInstructions?: string;
  canSubmitPhotos?: boolean;
  relatedEvent?: AlbumRelatedEvent;
  images: AlbumImage[];
  videos: AlbumVideo[];
  youtubeError?: string;
}

// Pastor directory
export interface Pastor {
  id: string;
  fullName: string;
  churchName?: string; // Legacy field for backward compatibility
  churchNumber?: string;
  temploName?: string; // Temple name from reference
  temploId?: string;
  address?: string; // Temple address from reference
  photo?: string;
  googleMapsUrl?: string;
  phone?: string;
}

// Coros Locales
export interface Coro {
  id: string;
  coroName: string;
  photo: string;
  temploName?: string;
  temploId?: string;
  address?: string;
  googleMapsUrl?: string;
  presidentName: string;
  presidentPhone: string;
}

// Directiva members
export interface DirectivaMember {
  id: string;
  fullName: string;
  role?: string;
  temploName?: string;
  temploId?: string;
  address?: string; // Temple address from reference
  photo?: string;
  googleMapsUrl?: string;
  phone: string;
}

// Registration form data
export interface RegistrationFormData {
  name: string;
  phone: string;
  needsLodging: boolean;
  needsTransport: boolean;
  attendingAs: "oyente" | "miembro";
  isBaptized: boolean;
  isCoroMGR: boolean;
}

// Countdown data
export interface CountdownData {
  event: Event;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  isPostEvent: boolean;
  daysSinceEvent?: number;
}

// Phone formatting helper type
export interface PhoneNumber {
  countryCode: string;
  number: string;
  formatted: string;
}

// Region president info for registration
export interface RegionPresident {
  fullName: string;
  phone: string;
}

// Hero image for carousel
export interface HeroImage {
  url: string;
  alt: string;
}

// Site settings with hero images
export interface SiteSettings {
  id: string;
  siteName: string;
  heroImages: HeroImage[];
  mobileHeroImage?: HeroImage;
  heroTitle: string;
  heroSubtitle: string;
}

// Registration data sent to API
export interface RegistrationSubmission {
  name: string;
  phone: string;
  eventId: string;
  needsLodging: boolean;
  needsTransport: boolean;
  attendingAs: "oyente" | "miembro";
  isBaptized: boolean;
  isCoroMGR: boolean;
}

// Pastor shown inline inside a Templo card
export interface TemploPastor {
  id: string;
  fullName: string;
  phone?: string;
}

// Coro shown inline inside a Templo card
export interface TemploCoro {
  id: string;
  coroName: string;
  presidentName: string;
  presidentPhone: string;
}

export type TemploWeekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface TemploServiceSchedule {
  day: TemploWeekday;
  startTime: string;
  endTime?: string;
  label?: string;
}

export interface TemploSchedule {
  timezone?: string;
  services: TemploServiceSchedule[];
}

// Local church (Templo) with its related pastors and coros joined
export interface Templo {
  id: string;
  temploName: string;
  churchNumber: string;
  address?: string;
  googleMapsUrl?: string;
  phone?: string;
  photos?: string[];
  schedule?: TemploSchedule;
  description?: string;
  presidenteJovenesName?: string;
  presidenteJovenesPhone?: string;
  /** GPS coordinates for distance calculation */
  latitude?: number;
  longitude?: number;
  /** Pastores that belong to this templo (from the pastor collection) */
  pastores: TemploPastor[];
  /** Coros that belong to this templo (from the coro collection) */
  coros: TemploCoro[];
}

// ============================================
// HERO SECTION - RANKING SYSTEM TYPES
// ============================================

// Prayer submission (anonymous)
export interface Prayer {
  _id: string;
  text: string;
  submittedAt: string;
  approved?: boolean;
  spam?: boolean;
}

// Prayer Wall configuration
export interface PrayerWallConfig {
  _id: string;
  phase: 'collect' | 'show' | 'paused';
  selectedPrayers: Prayer[];
  enabled: boolean;
  publishedAt: string;
}

// Custom Hero Card
export interface HeroCard {
  _id: string;
  media: {
    url: string;
    isVertical: boolean;
    alt: string;
  };
  accentColor: string;
  url?: string;
  ctaText?: string;
  publishedAt: string;
  pinned?: boolean;
  priorityWeight?: number;
}

// Social Post (cached from Meta API)
export interface SocialPost {
  _id: string;
  network: 'instagram' | 'facebook';
  url: string;
  caption?: string;
  media?: {
    url: string;
    isVertical: boolean;
  };
  postedAt: string;
}
