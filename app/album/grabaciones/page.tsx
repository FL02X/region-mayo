import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/nav-bar";
import { SectionNavBar } from "@/components/layout/album-section-nav-bar";
import { AlbumSectionContent } from "@/components/sections/album/album-content";
import Chatbot from "@/components/shared/chatbot";
import { getAlbums, getRegionConfig } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = false;

export const metadata: Metadata = buildPageMetadata({
  title: "Grabaciones",
  description: "Grabaciones y directos de la Región Mayo.",
  canonicalPath: "/album/grabaciones",
});

export default async function AlbumGrabacionesPage() {
  const [region, albums] = await Promise.all([
    getRegionConfig("region-mayo"),
    getAlbums("region-mayo"),
  ]);

  return (
    <main className="min-h-screen bg-[#f1f1f1]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <SectionNavBar
        currentLabel="Grabaciones"
        parentHref="/album"
        parentLabel="Álbum"
        icon="album"
      />
      <AlbumSectionContent albums={albums} section="grabaciones" />
      <Chatbot />
    </main>
  );
}
