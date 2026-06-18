import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { TimeProvider } from "@/lib/time-context";
import { absoluteUrl, SITE_DESCRIPTION, SITE_FULL_NAME, SITE_NAME, getSiteUrl } from "@/lib/seo";
import { HighlightClearer } from "@/components/layout/highlight-clearer";
import { RouteBodyFlags } from "@/components/layout/route-body-flags";
import { PwaBootstrap } from "@/components/pwa/pwa-bootstrap";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { InstallAppBanner } from "@/components/pwa/install-app-banner";
import "./globals.css";

const siteUrl = getSiteUrl();

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  fallback: ["Arial", "Arial Unicode MS", "sans-serif"],
});

const siteNavigationItems = [
  { name: "Calendario", url: siteUrl },
  { name: "Templos", url: `${siteUrl}/templos` },
  { name: "Pastores", url: `${siteUrl}/pastores` },
  { name: "Coros Locales", url: `${siteUrl}/coros` },
  { name: "Directiva", url: `${siteUrl}/directiva` },
  { name: "Álbum", url: `${siteUrl}/album` },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ReligiousOrganization",
      "@id": `${siteUrl}/#organization`,
      name: SITE_FULL_NAME,
      alternateName: SITE_NAME,
      url: siteUrl,
      logo: absoluteUrl("/images/region-mayo-logo-512.jpg"),
      image: absoluteUrl("/opengraph-image"),
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: SITE_FULL_NAME,
      alternateName: SITE_NAME,
      url: siteUrl,
      inLanguage: "es-MX",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
    },
    {
      "@type": "ItemList",
      "@id": `${siteUrl}/#site-navigation`,
      name: "Secciones principales",
      itemListElement: siteNavigationItems.map((item, index) => ({
        "@type": "SiteNavigationElement",
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  generator: "Next.js",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: SITE_FULL_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/images/LOGO.ico", type: "image/x-icon" },
      { url: "/images/region-mayo-logo-192.jpg", type: "image/jpeg", sizes: "192x192" },
    ],
    shortcut: "/images/LOGO.ico",
    apple: "/images/region-mayo-logo-180.jpg",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_FULL_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
    url: "/",
    siteName: SITE_FULL_NAME,
    images: [{ url: absoluteUrl("/opengraph-image") }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_FULL_NAME,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/opengraph-image")],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <RouteBodyFlags />
        <Suspense fallback={null}>
          <HighlightClearer />
        </Suspense>
        <TimeProvider initialTimeISO={new Date().toISOString()}>{children}</TimeProvider>
        <InstallAppBanner />
        <OfflineBanner />
        <PwaBootstrap />
        <Analytics />
      </body>
    </html>
  );
}
