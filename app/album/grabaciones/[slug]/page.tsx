import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/nav-bar";
import { SectionNavBar } from "@/components/layout/album-section-nav-bar";
import { AlbumContent } from "@/components/sections/album/album-content";
import Chatbot from "@/components/shared/chatbot";
import { getAlbumBySlug, getAlbums, getRegionConfig } from "@/lib/api";
import { SITE_FULL_NAME, SITE_NAME } from "@/lib/seo";

export const revalidate = false;

interface AlbumDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const albums = await getAlbums("region-mayo");
  return albums
    .filter((album) => album.albumType === "youtube")
    .map((album) => ({ slug: album.slug }));
}

export async function generateMetadata({
  params,
}: AlbumDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug, "region-mayo");

  if (!album || album.albumType !== "youtube") {
    return {
      title: `Grabación no encontrada | ${SITE_NAME}`,
      alternates: {
        canonical: "/album/grabaciones",
      },
    };
  }

  const title = `${album.title} | Grabaciones | ${SITE_NAME}`;
  const description = album.description || `Grabación de ${album.title} en la Región Mayo.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/album/grabaciones/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/album/grabaciones/${slug}`,
      siteName: SITE_FULL_NAME,
      images: [{ url: album.coverImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [album.coverImage],
    },
  };
}

export default async function AlbumGrabacionesDetailPage({
  params,
}: AlbumDetailPageProps) {
  const { slug } = await params;
  const [region, album] = await Promise.all([
    getRegionConfig("region-mayo"),
    getAlbumBySlug(slug, "region-mayo"),
  ]);

  if (!album || album.albumType !== "youtube") notFound();

  return (
    <main className="min-h-screen bg-[#f1f1f1]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <SectionNavBar
        currentLabel={album.title}
        parentHref="/album/grabaciones"
        parentLabel="Grabaciones"
        icon="album"
      />
      <AlbumContent album={album} />
      <Chatbot />
    </main>
  );
}
