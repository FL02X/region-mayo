import type { Metadata } from "next";

export const SITE_FULL_NAME = "Iglesia Gentil de Cristo Region Mayo";
export const SITE_NAME = "IGC Region Mayo";
export const SITE_DESCRIPTION =
  "Calendario regional, templos, pastores, coros, directiva y álbumes de la Iglesia Gentil de Cristo en la Región Mayo.";
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return "https://igcmayo.com";
}

export function absoluteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString();
}

type PageMetadataInput = {
  title: string;
  description: string;
  canonicalPath?: string;
  noIndex?: boolean;
  ogImagePath?: string;
};

export function buildPageMetadata({
  title,
  description,
  canonicalPath = "/",
  noIndex = false,
  ogImagePath = DEFAULT_OG_IMAGE_PATH,
}: PageMetadataInput): Metadata {
  const ogImage = ogImagePath.startsWith("http") ? ogImagePath : absoluteUrl(ogImagePath);
  const canonical = canonicalPath.startsWith("http")
    ? canonicalPath
    : canonicalPath;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
          },
        },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_FULL_NAME,
      type: "website",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
