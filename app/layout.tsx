import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { TimeProvider } from "@/lib/time-context";
import { HighlightClearer } from "@/components/layout/highlight-clearer";
import { RouteBodyFlags } from "@/components/layout/route-body-flags";
import { PwaBootstrap } from "@/components/pwa/pwa-bootstrap";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { AnalyticsGate } from "@/components/pwa/analytics-gate";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  fallback: ["Arial", "Arial Unicode MS", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Iglesia Gentil de Cristo — Región Mayo | Sitio oficial regional",
  description:
    "Consulte el calendario regional, templos, pastores, coros y actividades de la Iglesia Gentil de Cristo en la Región Mayo.",
  generator: "Next.js",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Region Mayo",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/images/region-mayo-logo.jpg",
    apple: "/images/region-mayo-logo.jpg",
  },
  openGraph: {
    title: "Iglesia Gentil de Cristo — Región Mayo | Sitio oficial regional",
    description: "Consulte el calendario regional, templos, pastores, coros y actividades de la Iglesia Gentil de Cristo en la Región Mayo.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#21252b",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.sanity.io" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <RouteBodyFlags />
        <Suspense fallback={null}>
          <HighlightClearer />
        </Suspense>
        <TimeProvider initialTimeISO={new Date().toISOString()}>{children}</TimeProvider>
        <OfflineBanner />
        <PwaBootstrap />
        <AnalyticsGate />
      </body>
    </html>
  );
}
