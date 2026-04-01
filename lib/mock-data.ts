// ============================================
// Region Mayo - Mock Data
// This data will be replaced by Sanity CMS
// ============================================

import type { Region, Event, Pastor, Coro, DirectivaMember, RegionPresident, SiteSettings } from "./types"

// Region Configuration
export const regionMayo: Region = {
  id: "region-mayo",
  name: "Región Mayo",
  slug: "mayo",
  socialLinks: {
    instagram: "https://instagram.com/regionmayo",
    facebook: "https://facebook.com/regionmayo",
  },
}

// Region President (for registration confirmation)
export const regionPresident: RegionPresident = {
  fullName: "Hermano Pedro Castillo",
  phone: "6441112233",
}

// Events Data
export const eventsData: Event[] = [
  {
    id: "1",
    title: "Campaña de marzo",
    type: "worship",
    typeColor: "worship",
    date: new Date(2026, 2, 29), // March 29, 2026
    time: "10:00 AM",
    location: "Santuario Principal",
    address: "Av. Juárez 123, Navojoa, Sonora",
    googleMapsUrl: "https://maps.google.com/?q=Av.+Juárez+123,+Navojoa,+Sonora",
    description: "Únete a nosotros para un tiempo especial de adoración y comunión. Tendremos alabanzas, predicación de la palabra y un momento de oración por las familias.",
    vestimenta: "uniformeMGR",
    image: "/images/event-worship.jpg",
    status: "past", // Already happened
    albumEnabled: true,
    googleDriveAlbumUrl: "https://drive.google.com/drive/folders/worship-march-29",
    facebookPostUrl: "https://facebook.com/regionmayo/posts/123456",
    registrationEnabled: false,
    photos: ["/images/event-worship.jpg", "/images/event-tour.jpg", "/images/event-conference.jpg"],
  },
  {
    id: "2",
    title: "Campaña de abril",
    type: "tour",
    typeColor: "tour",
    date: new Date(2026, 3, 5), // April 5, 2026
    time: "8:00 AM",
    location: "Centro de Convenciones",
    address: "Blvd. Hidalgo 500, Hermosillo, Sonora",
    googleMapsUrl: "https://maps.google.com/?q=Blvd.+Hidalgo+500,+Hermosillo,+Sonora",
    description: "Gran gira de fraternidad donde nos reuniremos con hermanos de diferentes regiones. Habrá transporte disponible desde Navojoa.",
    vestimenta: "informal",
    image: "/images/event-tour.jpg",
    status: "upcoming",
    albumEnabled: true,
    googleDriveAlbumUrl: "https://drive.google.com/drive/folders/example",
    registrationEnabled: true,
    photos: ["/images/event-tour.jpg", "/images/event-conference.jpg", "/images/event-youth.jpg"],
  },
  {
    id: "3",
    title: "Campaña de abril",
    type: "worship",
    typeColor: "worship",
    date: new Date(2026, 3, 19), // April 19, 2026
    time: "7:00 PM",
    location: "Santuario Principal",
    address: "Av. Juárez 123, Navojoa, Sonora",
    description: "Una noche especial dedicada a la alabanza con la participación de varios coros de la región.",
    vestimenta: "uniformeMGR",
    image: "/images/event-worship.jpg",
    status: "upcoming",
    albumEnabled: true,
  },
  {
    id: "4",
    title: "Campaña de mayo",
    type: "conference",
    typeColor: "conference",
    date: new Date(2026, 4, 15), // May 15, 2026
    time: "9:00 AM",
    location: "Salón Comunitario",
    address: "Calle Obregón 45, Navojoa, Sonora",
    description: "Conferencia anual de la Región Mayo con predicadores invitados y talleres para toda la familia.",
    vestimenta: "uniformeMGR",
    image: "/images/event-conference.jpg",
    status: "upcoming",
    albumEnabled: true,
  },
  {
    id: "5",
    title: "Campaña de junio",
    type: "youth",
    typeColor: "youth",
    date: new Date(2026, 5, 20), // June 20, 2026
    time: "4:00 PM",
    location: "Parque Central",
    address: "Plaza Principal, Cd. Obregón, Sonora",
    description: "Actividades recreativas, dinámicas y un tiempo de reflexión para los jóvenes de todas las iglesias.",
    vestimenta: "informal",
    image: "/images/event-youth.jpg",
    status: "upcoming",
    albumEnabled: true,
  },
  {
    id: "6",
    title: "Campaña de julio",
    type: "tour",
    typeColor: "tour",
    date: new Date(2026, 6, 10), // July 10, 2026
    time: "6:00 AM",
    location: "Rancho El Refugio",
    address: "Carretera Navojoa-Álamos Km 25",
    description: "Campamento de 3 días para fortalecer la comunidad. Incluye actividades al aire libre y estudios bíblicos.",
    vestimenta: "informal",
    image: "/images/event-tour.jpg",
    status: "upcoming",
    albumEnabled: true,
    isMultiDayEvent: true,
  },
  {
    id: "7",
    title: "Campaña de agosto",
    type: "conference",
    typeColor: "conference",
    date: new Date(2026, 7, 8), // August 8, 2026
    time: "9:00 AM",
    location: "Centro de Retiros Monte Sinaí",
    address: "Sierra de Álamos, Sonora",
    description: "Retiro espiritual de fin de semana para renovar fuerzas y crecer en la fe.",
    vestimenta: "informal",
    image: "/images/event-conference.jpg",
    status: "upcoming",
    albumEnabled: true,
  },
]

// Pastors Directory
// Note: Church number is now included in churchName from the CMS
// Phone is optional - only shown if pastor wants to share contact
export const pastorsData: Pastor[] = [
  {
    id: "p1",
    fullName: "Pastor Juan Carlos García",
    churchName: "Templo Central Navojoa #01",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Central+Navojoa",
    phone: "6441234567", // Pastor shares WhatsApp
  },
  {
    id: "p2",
    fullName: "Pastor Miguel Ángel López",
    churchName: "Templo Esperanza #02",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Esperanza+Navojoa",
    phone: "6442345678", // Pastor shares WhatsApp
  },
  {
    id: "p3",
    fullName: "Pastor Roberto Hernández",
    churchName: "Templo Fe y Vida #03",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Fe+y+Vida+Sonora",
    // No phone - pastor prefers privacy
  },
  {
    id: "p4",
    fullName: "Pastor Francisco Javier Morales",
    churchName: "Templo Luz del Mundo #04",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Luz+del+Mundo+Sonora",
    // No phone - pastor prefers privacy
  },
  {
    id: "p5",
    fullName: "Pastor Eduardo Ramírez",
    churchName: "Templo Nueva Vida #05",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Nueva+Vida+Obregon",
    phone: "6443456789", // Pastor shares WhatsApp
  },
  {
    id: "p6",
    fullName: "Pastor José Luis Mendoza",
    churchName: "Templo Gracia Divina #06",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Gracia+Divina+Sonora",
    // No phone - pastor prefers privacy
  },
]

// Coros Locales
export const corosData: Coro[] = [
  {
    id: "c1",
    coroName: "Coro MGR Navojoa",
    photo: "/images/coro-placeholder.jpg",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Central+Navojoa",
    presidentName: "María Elena Soto",
    presidentPhone: "6441234567",
  },
  {
    id: "c2",
    coroName: "Coro Juvenil Esperanza",
    photo: "/images/coro-placeholder.jpg",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Esperanza+Navojoa",
    presidentName: "Carlos Alberto Vega",
    presidentPhone: "6442345678",
  },
  {
    id: "c3",
    coroName: "Coro Regional Fe y Vida",
    photo: "/images/coro-placeholder.jpg",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Fe+y+Vida+Sonora",
    presidentName: "Ana Patricia Flores",
    presidentPhone: "6443456789",
  },
  {
    id: "c4",
    coroName: "Coro Luz del Amanecer",
    photo: "/images/coro-placeholder.jpg",
    googleMapsUrl: "https://maps.google.com/?q=Cd+Obregon+Sonora",
    presidentName: "Roberto Sánchez",
    presidentPhone: "6444567890",
  },
]

// Directiva Members
// Note: These are placeholder names - will be replaced with real data from CMS
export const directivaData: DirectivaMember[] = [
  {
    id: "d1",
    fullName: "Hermano Pedro Castillo",
    role: "Presidente Regional",
    churchName: "Templo Central Navojoa #01",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Central+Navojoa",
    phone: "6441112233",
  },
  {
    id: "d2",
    fullName: "Hermano Luis Fernando Ortiz",
    role: "Vicepresidente",
    churchName: "Templo Esperanza #02",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Esperanza+Navojoa",
    phone: "6442223344",
  },
  {
    id: "d3",
    fullName: "Hermana Rosa María Torres",
    role: "Secretaria",
    churchName: "Templo Fe y Vida #03",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Fe+y+Vida+Sonora",
    phone: "6443334455",
  },
  {
    id: "d4",
    fullName: "Hermano Jesús Antonio Valdez",
    role: "Tesorero",
    churchName: "Templo Nueva Vida #05",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Nueva+Vida+Obregon",
    phone: "6444445566",
  },
  {
    id: "d5",
    fullName: "Hermana Carmen Lucía Reyes",
    role: "Coordinadora de Eventos",
    churchName: "Templo Gracia Divina #06",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Gracia+Divina+Sonora",
    phone: "6445556677",
  },
]

// Available regions for registration dropdown
export const availableRegions = [
  "Región Mayo",
  "Región Yaqui",
  "Región Norte",
  "Región Sur",
  "Región Centro",
  "Región Occidente",
  "Región Oriente",
]

// Site Settings with Hero Images
export const siteSettingsData: SiteSettings = {
  id: "site-settings-mayo",
  siteName: "Región Mayo Calendario",
  heroImages: [
    { url: "/images/hero-choir.jpg", alt: "Coro Región Mayo" },
    { url: "/images/event-worship.jpg", alt: "Servicio de Adoración" },
    { url: "/images/event-tour.jpg", alt: "Gira de Fraternidad" },
    { url: "/images/event-conference.jpg", alt: "Conferencia Regional" },
    { url: "/images/event-youth.jpg", alt: "Encuentro Juvenil" },
  ],
  heroTitle: "Bienvenido a Región Mayo",
  heroSubtitle: "Vive la Comunidad",
}
