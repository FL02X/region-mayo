import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { SectionNavBar } from "@/components/layout/section-nav-bar";
import { AlbumSectionContent } from "@/components/sections/album/album-content";
import Chatbot from "@/components/shared/chatbot";
import { getAlbums, getRegionConfig } from "@/lib/api";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Galería | IGC Region Mayo",
  description: "Fotos y galería de la Region Mayo.",
};

export default async function AlbumGaleriasPage() {
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
      <SectionNavBar currentLabel="Galería" parentHref="/album" parentLabel="Album" icon="album" />
      <AlbumSectionContent albums={albums} section="galerias" />
      <Chatbot />
    </main>
  );
}
