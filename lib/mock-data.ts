// ============================================
// Region Mayo - Auto-generated Mock Data from Sanity
// Generated on: new Date("2026-04-09T02:08:28.676Z")
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

export const regionMayo: Region = {
  id: 'region-mayo',
  name: 'Región Mayo',
  slug: 'mayo',
  socialLinks: {
    instagram: 'https://instagram.com/regionmayo',
    facebook: 'https://facebook.com/regionmayo'
  }
};

export const regionPresident: RegionPresident = { fullName: 'Hermano Pedro Castillo', phone: '6441112233' };

export const eventsData: Event[] = [
  {
    id: '1',
    title: 'Lorem Ipsum Evento',
    eventType: 'campana',
    typeColor: 'worship',
    date: new Date("2026-03-29T07:00:00.000Z"),
    time: '10:00 AM',
    location: 'Santuario Principal',
    address: 'Av. Juárez 123, Navojoa, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Av.+Juárez+123,+Navojoa,+Sonora',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    vestimenta: 'uniformeMGR',
    image: '/images/coro-placeholder.jpg',
    status: 'past',
    albumEnabled: true,
    googleDriveAlbumUrl: 'https://drive.google.com/drive/folders/worship-march-29',
    facebookPostUrl: 'https://facebook.com/regionmayo/posts/123456',
    registrationEnabled: false,
    photos: [
      '/images/coro-placeholder.jpg'
    ],
    speakers: {
      pastorMensaje: 'Pastor Juan Carlos García',
      jovenPreside: 'Hermano Miguel Rodríguez'
    }
  },
  {
    id: '2',
    title: 'Lorem Ipsum Evento',
    eventType: 'convencion',
    typeColor: 'conference',
    date: new Date("2026-04-05T07:00:00.000Z"),
    endDate: new Date("2026-04-07T07:00:00.000Z"),
    time: '8:00 AM',
    location: 'Centro de Convenciones',
    address: 'Blvd. Hidalgo 500, Hermosillo, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Blvd.+Hidalgo+500,+Hermosillo,+Sonora',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    vestimenta: 'uniformeMGR',
    image: '/images/coro-placeholder.jpg',
    status: 'upcoming',
    albumEnabled: true,
    googleDriveAlbumUrl: 'https://drive.google.com/drive/folders/example',
    registrationEnabled: true,
    photos: [
      '/images/coro-placeholder.jpg'
    ],
    alimentos: {
      enabled: true,
      location: 'Comedor Principal',
      googleMapsUrl: 'https://maps.google.com/?q=Comedor+Principal+Hermosillo',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    juntaJuvenil: {
      enabled: true,
      location: 'Salón Juvenil B',
      googleMapsUrl: 'https://maps.google.com/?q=Salon+Juvenil+Hermosillo',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    speakers: {
      pastorMensaje: 'Pastor Miguel Ángel López',
      jovenPreside: 'Hermana Ana García'
    },
    moreInfo: { enabled: true, imageUrl: '/images/coro-placeholder.jpg' }
  },
  {
    id: '3',
    title: 'Lorem Ipsum Evento',
    eventType: 'cultoJuvenil',
    typeColor: 'youth',
    date: new Date("2026-04-19T07:00:00.000Z"),
    time: '7:00 PM',
    location: 'Santuario Principal',
    address: 'Av. Juárez 123, Navojoa, Sonora',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    vestimenta: 'formalCasual',
    image: '/images/coro-placeholder.jpg',
    status: 'upcoming',
    albumEnabled: true,
    speakers: { jovenPreside: 'Hermano Carlos Vega' }
  },
  {
    id: '4',
    title: 'Lorem Ipsum Evento',
    eventType: 'recorrido',
    typeColor: 'tour',
    date: new Date("2026-05-15T07:00:00.000Z"),
    endDate: new Date("2026-05-17T07:00:00.000Z"),
    time: '9:00 AM',
    location: 'Salón Comunitario',
    address: 'Calle Obregón 45, Navojoa, Sonora',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    vestimenta: 'uniformeMGR',
    image: '/images/coro-placeholder.jpg',
    status: 'upcoming',
    albumEnabled: true,
    speakers: { pastorMensaje: 'Pastor Roberto Hernández' }
  },
  {
    id: '5',
    title: 'Lorem Ipsum Evento',
    eventType: 'estudioBiblico',
    typeColor: 'worship',
    date: new Date("2026-06-20T07:00:00.000Z"),
    time: '4:00 PM',
    location: 'Templo Central',
    address: 'Plaza Principal, Cd. Obregón, Sonora',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    vestimenta: 'informal',
    image: '/images/coro-placeholder.jpg',
    status: 'upcoming',
    albumEnabled: false
  },
  {
    id: '6',
    title: 'Lorem Ipsum Evento',
    eventType: 'congresoBrilla',
    typeColor: 'youth',
    date: new Date("2026-07-10T07:00:00.000Z"),
    endDate: new Date("2026-07-12T07:00:00.000Z"),
    time: '6:00 AM',
    location: 'Rancho El Refugio',
    address: 'Carretera Navojoa-Álamos Km 25',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    vestimenta: 'informal',
    image: '/images/coro-placeholder.jpg',
    status: 'upcoming',
    albumEnabled: true,
    alimentos: {
      enabled: true,
      location: 'Área de Comedor',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    juntaJuvenil: {
      enabled: true,
      location: 'Área de Fogata',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    moreInfo: { enabled: true, imageUrl: '/images/coro-placeholder.jpg' }
  },
  {
    id: '7',
    title: 'Lorem Ipsum Evento',
    eventType: 'visita',
    typeColor: 'worship',
    date: new Date("2026-08-08T07:00:00.000Z"),
    time: '9:00 AM',
    location: 'Centro de Retiros Monte Sinaí',
    address: 'Sierra de Álamos, Sonora',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    vestimenta: 'formalCasual',
    image: '/images/coro-placeholder.jpg',
    status: 'upcoming',
    albumEnabled: false,
    speakers: { pastorMensaje: 'Pastor Juan Carlos García' }
  }
];

export const pastorsData: Pastor[] = [
  {
    id: 'p1',
    fullName: 'Pastor Juan Carlos García',
    temploName: 'Templo Central Navojoa #01',
    temploId: 't1',
    address: 'Calle 5 de Mayo 123, Navojoa, Sonora',
    churchNumber: '01',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Central+Navojoa',
    phone: '6441234567'
  },
  {
    id: 'p2',
    fullName: 'Pastor Miguel Ángel López',
    temploName: 'Templo Esperanza #02',
    temploId: 't2',
    address: 'Avenida Obregón 245, Navojoa, Sonora',
    churchNumber: '02',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Esperanza+Navojoa',
    phone: '6442345678'
  },
  {
    id: 'p3',
    fullName: 'Pastor Roberto Hernández',
    temploName: 'Templo Fe y Vida #03',
    temploId: 't3',
    address: 'Boulevard Periférico 567, Hermosillo, Sonora',
    churchNumber: '03',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Fe+y+Vida+Sonora'
  },
  {
    id: 'p4',
    fullName: 'Pastor Francisco Javier Morales',
    temploName: 'Templo Luz del Mundo #04',
    temploId: 't4',
    address: 'Calle Reforma 890, Guaymas, Sonora',
    churchNumber: '04',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Luz+del+Mundo+Sonora'
  },
  {
    id: 'p5',
    fullName: 'Pastor Eduardo Ramírez',
    temploName: 'Templo Nueva Vida #05',
    temploId: 't5',
    address: 'Calle Juárez 789, Ciudad Obregón, Sonora',
    churchNumber: '05',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Nueva+Vida+Obregon',
    phone: '6443456789'
  },
  {
    id: 'p6',
    fullName: 'Pastor José Luis Mendoza',
    temploName: '1ra Iglesia de Navojoa',
    temploId: 't6',
    address: 'Calle Constitución 456, Navojoa, Sonora',
    churchNumber: '06',
    googleMapsUrl: 'https://maps.google.com/?q=1ra+Iglesia+Navojoa'
  }
];

export const corosData: Coro[] = [
  {
    id: 'c1',
    coroName: 'Coro MGR Navojoa',
    photo: '/images/coro-placeholder.jpg',
    temploName: 'Templo Central Navojoa #01',
    temploId: 't1',
    address: 'Calle 5 de Mayo 123, Navojoa, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Central+Navojoa',
    presidentName: 'María Elena Soto',
    presidentPhone: '6441234567'
  },
  {
    id: 'c2',
    coroName: 'Coro Juvenil Esperanza',
    photo: '/images/coro-placeholder.jpg',
    temploName: 'Templo Esperanza #02',
    temploId: 't2',
    address: 'Avenida Obregón 245, Navojoa, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Esperanza+Navojoa',
    presidentName: 'Carlos Alberto Vega',
    presidentPhone: '6442345678'
  },
  {
    id: 'c3',
    coroName: 'Coro Regional Fe y Vida',
    photo: '/images/coro-placeholder.jpg',
    temploName: 'Templo Fe y Vida #03',
    temploId: 't3',
    address: 'Boulevard Periférico 567, Hermosillo, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Fe+y+Vida+Sonora',
    presidentName: 'Ana Patricia Flores',
    presidentPhone: '6443456789'
  },
  {
    id: 'c4',
    coroName: 'Coro Luz del Amanecer',
    photo: '/images/coro-placeholder.jpg',
    temploName: 'Templo Luz del Mundo #04',
    temploId: 't4',
    address: 'Calle Reforma 890, Guaymas, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Cd+Obregon+Sonora',
    presidentName: 'Roberto Sánchez',
    presidentPhone: '6444567890'
  }
];

export const directivaData: DirectivaMember[] = [
  {
    id: 'd1',
    fullName: 'Hermano Pedro Castillo',
    role: 'Presidente Regional',
    temploName: 'Templo Central Navojoa #01',
    temploId: 't1',
    address: 'Calle 15 esquina Hidalgo, Navojoa, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Central+Navojoa',
    phone: '6441112233'
  },
  {
    id: 'd2',
    fullName: 'Hermano Luis Fernando Ortiz',
    role: 'Vicepresidente',
    temploName: 'Templo Esperanza #02',
    temploId: 't2',
    address: 'Avenida Obregón 245, Navojoa, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Esperanza+Navojoa',
    phone: '6442223344'
  },
  {
    id: 'd3',
    fullName: 'Hermana Rosa María Torres',
    role: 'Secretaria',
    temploName: 'Templo Fe y Vida #03',
    temploId: 't3',
    address: 'Boulevard Periférico 567, Hermosillo, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Fe+y+Vida+Sonora',
    phone: '6443334455'
  },
  {
    id: 'd4',
    fullName: 'Hermano Jesús Antonio Valdez',
    role: 'Tesorero',
    temploName: 'Templo Nueva Vida #05',
    temploId: 't5',
    address: 'Calle Juárez 890, Ciudad Obregón, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Nueva+Vida+Obregon',
    phone: '6444445566'
  },
  {
    id: 'd5',
    fullName: 'Hermana Carmen Lucía Reyes',
    role: 'Coordinadora de Eventos',
    temploName: 'Templo Gracia Divina #06',
    temploId: 't6',
    address: 'Carretera a Kino km 5, Hermosillo, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Gracia+Divina+Sonora',
    phone: '6445556677'
  }
];

export const availableRegions = [
  'Región Mayo',
  'Región Yaqui',
  'Región Norte',
  'Región Sur',
  'Región Centro',
  'Región Occidente',
  'Región Oriente'
];

export const siteSettingsData: SiteSettings = {
  id: 'site-settings-mayo',
  siteName: 'Región Mayo Calendario',
  heroImages: [
    { url: '/images/hero-choir.jpg', alt: 'Coro Región Mayo' },
    { url: '/images/event-worship.jpg', alt: 'Servicio de Adoración' },
    { url: '/images/event-tour.jpg', alt: 'Gira de Fraternidad' },
    {
      url: '/images/event-conference.jpg',
      alt: 'Conferencia Regional'
    },
    { url: '/images/event-youth.jpg', alt: 'Encuentro Juvenil' }
  ],
  heroTitle: 'Lorem Ipsum Region',
  heroSubtitle: 'Dolor sit amet'
};

export const templosData: Templo[] = [
  {
    id: 't1',
    temploName: 'Templo Central Navojoa',
    churchNumber: '01',
    address: 'Av. Juárez 123, Navojoa, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Central+Navojoa',
    phone: '6441234567',
    photos: ['/images/coro-placeholder.jpg'],
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    presidenteJovenesName: 'Hno. Miguel Rodríguez',
    presidenteJovenesPhone: '6441111222',
    pastores: [
      {
        id: 'p1',
        fullName: 'Pastor Juan Carlos García',
        phone: '6441234567'
      }
    ],
    coros: [
      {
        id: 'c1',
        coroName: 'Coro MGR Navojoa',
        presidentName: 'María Elena Soto',
        presidentPhone: '6441234567'
      }
    ]
  },
  {
    id: 't2',
    temploName: 'Templo Esperanza',
    churchNumber: '02',
    address: 'Calle Obregón 45, Navojoa, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Esperanza+Navojoa',
    phone: '6442345678',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    pastores: [
      {
        id: 'p2',
        fullName: 'Pastor Miguel Ángel López',
        phone: '6442345678'
      }
    ],
    coros: [
      {
        id: 'c2',
        coroName: 'Coro Juvenil Esperanza',
        presidentName: 'Carlos Alberto Vega',
        presidentPhone: '6442345678'
      }
    ]
  },
  {
    id: 't3',
    temploName: 'Templo Fe y Vida',
    churchNumber: '03',
    address: 'Blvd. Morelos 234, Cd. Obregón, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Fe+y+Vida+Sonora',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    presidenteJovenesName: 'Hna. Ana García',
    presidenteJovenesPhone: '6443222111',
    pastores: [ { id: 'p3', fullName: 'Pastor Roberto Hernández' } ],
    coros: []
  },
  {
    id: 't4',
    temploName: 'Templo Luz del Mundo',
    churchNumber: '04',
    address: 'Carretera Internacional Km 12, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Luz+del+Mundo+Sonora',
    pastores: [ { id: 'p4', fullName: 'Pastor Francisco Javier Morales' } ],
    coros: [
      {
        id: 'c4',
        coroName: 'Coro Luz del Amanecer',
        presidentName: 'Roberto Sánchez',
        presidentPhone: '6444567890'
      }
    ]
  },
  {
    id: 't5',
    temploName: 'Templo Nueva Vida',
    churchNumber: '05',
    address: 'Periférico Norte 567, Cd. Obregón, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Nueva+Vida+Obregon',
    phone: '6443456789',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    presidenteJovenesName: 'Hno. Carlos Mendoza',
    presidenteJovenesPhone: '6443456788',
    pastores: [
      {
        id: 'p5',
        fullName: 'Pastor Eduardo Ramírez',
        phone: '6443456789'
      }
    ],
    coros: []
  },
  {
    id: 't6',
    temploName: 'Templo Gracia Divina',
    churchNumber: '06',
    address: 'Calle Constitución 89, Navojoa, Sonora',
    googleMapsUrl: 'https://maps.google.com/?q=Templo+Gracia+Divina+Sonora',
    pastores: [ { id: 'p6', fullName: 'Pastor José Luis Mendoza' } ],
    coros: []
  }
];
