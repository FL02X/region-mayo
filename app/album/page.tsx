import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/nav-bar";
import { AlbumHubContent } from "@/components/sections/album/album-content";
import Chatbot from "@/components/shared/chatbot";
import { getAlbums, getRegionConfig } from "@/lib/api";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Album | IGC Region Mayo",
  description: "Fotos, galerias y grabaciones recientes de la Region Mayo.",
};

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
        {region ? (
          <AlbumHubContent albums={albums} />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-lg text-gray-500">
              No hay informacion disponible. Por favor, configurala en Sanity Studio.
            </p>
          </div>
        )}
      </div>
      <Chatbot />
    </main>
  );
}
