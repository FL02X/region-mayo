import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { TimeProvider } from '@/lib/time-context'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap"
});
const playfair = Playfair_Display({ 
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: 'Región Mayo - Tu Comunidad de Actividades',
  description: 'Catálogo digital de eventos y actividades de la Región Mayo. Vive la comunidad.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        <TimeProvider>
          {children}
        </TimeProvider>
        <Analytics />
      </body>
    </html>
  )
}
