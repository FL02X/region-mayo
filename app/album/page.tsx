import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/nav-bar";
import { AlbumHubContent } from "@/components/sections/album/album-content";
import Chatbot from "@/components/shared/chatbot";
import { getAlbums, getRegionConfig } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = false;

export const metadata: Metadata = buildPageMetadata({
  title: "Álbum",
  description:
    "Fotos, galerías y grabaciones recientes de la Región Mayo.",
  canonicalPath: "/album",
});

export default async function AlbumPage() {
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
      <div>
        <AlbumHubContent albums={albums} />
      </div>
      <Chatbot />
    </main>
  );
}
