import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/nav-bar";
import Chatbot from "@/components/shared/chatbot";
import { RecorridoContent } from "@/components/sections/recorrido/recorrido-content";
import {
  getAlbums,
  getRecorrido,
  getRegionConfig,
  getRegionPresident,
  getTemplos,
} from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = false;

export const metadata: Metadata = buildPageMetadata({
  title: "Recorrido Regional de la Mayo 2026",
  description:
    "Informacion del Recorrido Regional de la Mayo 2026: registro, ruta, cultos y albumes por dia.",
  canonicalPath: "/recorrido-mayo-2026",
});

export default async function RecorridoMayo2026Page() {
  const [region, events, regionPresident, templos, albums] = await Promise.all([
    getRegionConfig("region-mayo"),
    getRecorrido("region-mayo"),
    getRegionPresident("region-mayo"),
    getTemplos("region-mayo"),
    getAlbums("region-mayo"),
  ]);

  return (
    <main className="min-h-screen bg-[#f1f1f1]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <RecorridoContent
        events={events.events}
        startDate={events.startDate}
        endDate={events.endDate}
        templos={templos}
        albums={albums}
        regionPresident={regionPresident}
      />
      <Chatbot />
    </main>
  );
}
