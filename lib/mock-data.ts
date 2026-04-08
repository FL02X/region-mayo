// ============================================
// Region Mayo - Mock Data
// This data will be replaced by Sanity CMS
// ============================================

import type {
  Region,
  Event,
  Pastor,
  Coro,
  DirectivaMember,
  RegionPresident,
  SiteSettings,
  Templo,
} from "./types";

// Region Configuration
export const regionMayo: Region = {
  id: "region-mayo",
  name: "Región Mayo",
  slug: "mayo",
  socialLinks: {
    instagram: "https://instagram.com/regionmayo",
    facebook: "https://facebook.com/regionmayo",
  },
};

// Region President (for registration confirmation)
export const regionPresident: RegionPresident = {
  fullName: "Hermano Pedro Castillo",
  phone: "6441112233",
};

// Events Data with new event types
export const eventsData: Event[] = [
  {
    id: "1",
    title: "Campaña de Marzo",
    eventType: "campana",
    typeColor: "worship",
    date: new Date(2026, 2, 29),
    time: "10:00 AM",
    location: "Santuario Principal",
    address: "Av. Juárez 123, Navojoa, Sonora",
    googleMapsUrl: "https://maps.google.com/?q=Av.+Juárez+123,+Navojoa,+Sonora",
    description:
      "Únete a nosotros para un tiempo especial de adoración y comunión. Tendremos alabanzas, predicación de la palabra y un momento de oración por las familias.",
    vestimenta: "uniformeMGR",
    image: "/images/event-worship.jpg",
    status: "past",
    albumEnabled: true,
    googleDriveAlbumUrl:
      "https://drive.google.com/drive/folders/worship-march-29",
    facebookPostUrl: "https://facebook.com/regionmayo/posts/123456",
    registrationEnabled: false,
    photos: [
      "/images/event-worship.jpg",
      "/images/event-tour.jpg",
      "/images/event-conference.jpg",
      "/images/event-youth.jpg",
      "/images/hero-choir.jpg",
    ],
    speakers: {
      pastorMensaje: "Pastor Juan Carlos García",
      jovenPreside: "Hermano Miguel Rodríguez",
    },
  },
  {
    id: "2",
    title: "Convención General Regional",
    eventType: "convencion",
    typeColor: "conference",
    date: new Date(2026, 3, 5),
    endDate: new Date(2026, 3, 7),
    time: "8:00 AM",
    location: "Centro de Convenciones",
    address: "Blvd. Hidalgo 500, Hermosillo, Sonora",
    googleMapsUrl:
      "https://maps.google.com/?q=Blvd.+Hidalgo+500,+Hermosillo,+Sonora",
    description:
      "Gran convención donde nos reuniremos con hermanos de diferentes regiones. Habrá transporte disponible desde Navojoa.",
    vestimenta: "uniformeMGR",
    image: "/images/event-tour.jpg",
    status: "upcoming",
    albumEnabled: true,
    googleDriveAlbumUrl: "https://drive.google.com/drive/folders/example",
    registrationEnabled: true,
    photos: [
      "/images/event-tour.jpg",
      "/images/event-conference.jpg",
      "/images/event-youth.jpg",
      "/images/hero-choir.jpg",
    ],
    alimentos: {
      enabled: true,
      location: "Comedor Principal",
      googleMapsUrl: "https://maps.google.com/?q=Comedor+Principal+Hermosillo",
      description:
        "Desayuno: 7:00-8:30 AM\nComida: 1:00-3:00 PM\nCena: 7:00-9:00 PM",
    },
    juntaJuvenil: {
      enabled: true,
      location: "Salón Juvenil B",
      googleMapsUrl: "https://maps.google.com/?q=Salon+Juvenil+Hermosillo",
      description:
        "Reunión especial para jóvenes después del servicio principal.",
    },
    speakers: {
      pastorMensaje: "Pastor Miguel Ángel López",
      jovenPreside: "Hermana Ana García",
    },
    moreInfo: {
      enabled: true,
      imageUrl: "/images/event-conference.jpg",
    },
  },
  {
    id: "3",
    title: "Culto Juvenil de Abril",
    eventType: "cultoJuvenil",
    typeColor: "youth",
    date: new Date(2026, 3, 19),
    time: "7:00 PM",
    location: "Santuario Principal",
    address: "Av. Juárez 123, Navojoa, Sonora",
    description:
      "Una noche especial dedicada a la alabanza con la participación de varios coros de la región.",
    vestimenta: "formalCasual",
    image: "/images/event-youth.jpg",
    status: "upcoming",
    albumEnabled: true,
    speakers: {
      jovenPreside: "Hermano Carlos Vega",
    },
  },
  {
    id: "4",
    title: "Recorrido Regional Mayo",
    eventType: "recorrido",
    typeColor: "tour",
    date: new Date(2026, 4, 15),
    endDate: new Date(2026, 4, 17),
    time: "9:00 AM",
    location: "Salón Comunitario",
    address: "Calle Obregón 45, Navojoa, Sonora",
    description:
      "Recorrido anual de la Región Mayo visitando varias iglesias de la región.",
    vestimenta: "uniformeMGR",
    image: "/images/event-conference.jpg",
    status: "upcoming",
    albumEnabled: true,
    speakers: {
      pastorMensaje: "Pastor Roberto Hernández",
    },
  },
  {
    id: "5",
    title: "Estudio Bíblico Semanal",
    eventType: "estudioBiblico",
    typeColor: "worship",
    date: new Date(2026, 5, 20),
    time: "4:00 PM",
    location: "Templo Central",
    address: "Plaza Principal, Cd. Obregón, Sonora",
    description: "Estudio profundo de las escrituras para todas las edades.",
    vestimenta: "informal",
    image: "/images/event-worship.jpg",
    status: "upcoming",
    albumEnabled: false,
  },
  {
    id: "6",
    title: "Congreso Brilla 2026",
    eventType: "congresoBrilla",
    typeColor: "youth",
    date: new Date(2026, 6, 10),
    endDate: new Date(2026, 6, 12),
    time: "6:00 AM",
    location: "Rancho El Refugio",
    address: "Carretera Navojoa-Álamos Km 25",
    description:
      "Congreso especial para jóvenes con actividades al aire libre, talleres y momentos de adoración.",
    vestimenta: "informal",
    image: "/images/event-youth.jpg",
    status: "upcoming",
    albumEnabled: true,
    alimentos: {
      enabled: true,
      location: "Área de Comedor",
      description: "Todas las comidas incluidas en el registro.",
    },
    juntaJuvenil: {
      enabled: true,
      location: "Área de Fogata",
      description:
        "Cada noche tendremos un tiempo especial alrededor de la fogata.",
    },
    moreInfo: {
      enabled: true,
      imageUrl: "/images/event-tour.jpg",
    },
  },
  {
    id: "7",
    title: "Visita Pastoral",
    eventType: "visita",
    typeColor: "worship",
    date: new Date(2026, 7, 8),
    time: "9:00 AM",
    location: "Centro de Retiros Monte Sinaí",
    address: "Sierra de Álamos, Sonora",
    description: "Visita especial del pastor regional a las iglesias locales.",
    vestimenta: "formalCasual",
    image: "/images/event-conference.jpg",
    status: "upcoming",
    albumEnabled: false,
    speakers: {
      pastorMensaje: "Pastor Juan Carlos García",
    },
  },
];

// Pastors Directory
export const pastorsData: Pastor[] = [
  {
    id: "p1",
    fullName: "Pastor Juan Carlos García",
    churchName: "Templo Central Navojoa #01",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Central+Navojoa",
    phone: "6441234567",
  },
  {
    id: "p2",
    fullName: "Pastor Miguel Ángel López",
    churchName: "Templo Esperanza #02",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Esperanza+Navojoa",
    phone: "6442345678",
  },
  {
    id: "p3",
    fullName: "Pastor Roberto Hernández",
    churchName: "Templo Fe y Vida #03",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Fe+y+Vida+Sonora",
  },
  {
    id: "p4",
    fullName: "Pastor Francisco Javier Morales",
    churchName: "Templo Luz del Mundo #04",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Luz+del+Mundo+Sonora",
  },
  {
    id: "p5",
    fullName: "Pastor Eduardo Ramírez",
    churchName: "Templo Nueva Vida #05",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Nueva+Vida+Obregon",
    phone: "6443456789",
  },
  {
    id: "p6",
    fullName: "Pastor José Luis Mendoza",
    churchName: "Templo Gracia Divina #06",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Gracia+Divina+Sonora",
  },
];

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
];

// Directiva Members
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
];

// Available regions for registration dropdown
export const availableRegions = [
  "Región Mayo",
  "Región Yaqui",
  "Región Norte",
  "Región Sur",
  "Región Centro",
  "Región Occidente",
  "Región Oriente",
];

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
};

// Templos (Iglesias Locales) — Mock data
// Includes joined pastores and coros for each templo
export const templosData: Templo[] = [
  {
    id: "t1",
    temploName: "Templo Central Navojoa",
    churchNumber: "01",
    address: "Av. Juárez 123, Navojoa, Sonora",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Central+Navojoa",
    phone: "6441234567",
    photo: "/images/event-worship.jpg",
    description:
      "Culto general: Domingos 10:00 AM y 7:00 PM\nEstudio bíblico: Miércoles 7:00 PM\nReunión de jóvenes: Viernes 7:00 PM",
    presidenteJovenesName: "Hno. Miguel Rodríguez",
    presidenteJovenesPhone: "6441111222",
    pastores: [
      { id: "p1", fullName: "Pastor Juan Carlos García", phone: "6441234567" },
    ],
    coros: [
      {
        id: "c1",
        coroName: "Coro MGR Navojoa",
        presidentName: "María Elena Soto",
        presidentPhone: "6441234567",
      },
    ],
  },
  {
    id: "t2",
    temploName: "Templo Esperanza",
    churchNumber: "02",
    address: "Calle Obregón 45, Navojoa, Sonora",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Esperanza+Navojoa",
    phone: "6442345678",
    description:
      "Culto general: Domingos 9:00 AM y 6:00 PM\nEstudio bíblico: Jueves 7:00 PM",
    pastores: [
      { id: "p2", fullName: "Pastor Miguel Ángel López", phone: "6442345678" },
    ],
    coros: [
      {
        id: "c2",
        coroName: "Coro Juvenil Esperanza",
        presidentName: "Carlos Alberto Vega",
        presidentPhone: "6442345678",
      },
    ],
  },
  {
    id: "t3",
    temploName: "Templo Fe y Vida",
    churchNumber: "03",
    address: "Blvd. Morelos 234, Cd. Obregón, Sonora",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Fe+y+Vida+Sonora",
    description:
      "Culto general: Domingos 11:00 AM\nEstudio bíblico: Lunes 7:30 PM",
    presidenteJovenesName: "Hna. Ana García",
    presidenteJovenesPhone: "6443222111",
    pastores: [{ id: "p3", fullName: "Pastor Roberto Hernández" }],
    coros: [],
  },
  {
    id: "t4",
    temploName: "Templo Luz del Mundo",
    churchNumber: "04",
    address: "Carretera Internacional Km 12, Sonora",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Luz+del+Mundo+Sonora",
    pastores: [{ id: "p4", fullName: "Pastor Francisco Javier Morales" }],
    coros: [
      {
        id: "c4",
        coroName: "Coro Luz del Amanecer",
        presidentName: "Roberto Sánchez",
        presidentPhone: "6444567890",
      },
    ],
  },
  {
    id: "t5",
    temploName: "Templo Nueva Vida",
    churchNumber: "05",
    address: "Periférico Norte 567, Cd. Obregón, Sonora",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Nueva+Vida+Obregon",
    phone: "6443456789",
    description:
      "Culto general: Domingos 10:30 AM y 7:00 PM\nEstudio bíblico: Miércoles 7:00 PM\nReunión de jóvenes: Sábados 5:00 PM",
    presidenteJovenesName: "Hno. Carlos Mendoza",
    presidenteJovenesPhone: "6443456788",
    pastores: [
      { id: "p5", fullName: "Pastor Eduardo Ramírez", phone: "6443456789" },
    ],
    coros: [],
  },
  {
    id: "t6",
    temploName: "Templo Gracia Divina",
    churchNumber: "06",
    address: "Calle Constitución 89, Navojoa, Sonora",
    googleMapsUrl: "https://maps.google.com/?q=Templo+Gracia+Divina+Sonora",
    pastores: [{ id: "p6", fullName: "Pastor José Luis Mendoza" }],
    coros: [],
  },
];
