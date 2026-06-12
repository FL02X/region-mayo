import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/nav-bar";
import { SectionNavBar } from "@/components/layout/section-nav-bar";
import { AlbumContent } from "@/components/sections/album/album-content";
import Chatbot from "@/components/shared/chatbot";
import { getAlbumBySlug, getAlbums, getRegionConfig } from "@/lib/api";

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
      title: "Grabacion no encontrada | IGC Region Mayo",
    };
  }

  return {
    title: `${album.title} | Grabaciones | IGC Region Mayo`,
    description: album.description || `Grabacion de ${album.title} en la region Mayo.`,
    openGraph: {
      title: album.title,
      description: album.description || `Grabacion de ${album.title} en la region Mayo.`,
      images: [{ url: album.coverImage }],
    },
  };
}

export default async function AlbumGrabacionesDetailPage({ params }: AlbumDetailPageProps) {
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
