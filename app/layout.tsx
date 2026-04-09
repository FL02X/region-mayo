import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { TimeProvider } from "@/lib/time-context";
import { HighlightClearer } from "@/components/highlight-clearer";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  preload: true,
});

export const metadata: Metadata = {
  title: "Región Mayo - Tu Comunidad de Actividades",
  description:
    "Catálogo digital de eventos y actividades de la Región Mayo. Vive la comunidad.",
  generator: "Next.js",
  icons: {
    icon: "/images/region-mayo-logo.jpg",
    apple: "/images/region-mayo-logo.jpg",
  },
  openGraph: {
    title: "Región Mayo - Tu Comunidad de Actividades",
    description: "Catálogo digital de eventos y actividades de la Región Mayo",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://cdn.sanity.io" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
      >
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <Suspense fallback={null}>
          <HighlightClearer />
        </Suspense>
        <TimeProvider>{children}</TimeProvider>
        <Analytics />
      </body>
    </html>
  );
}
