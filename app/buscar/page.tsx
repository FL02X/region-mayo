import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/nav-bar";
import { SearchContent } from "@/components/sections/search/search-content";
import Chatbot from "@/components/shared/chatbot";
import { getRegionConfig, getPastors, getCoros, getDirectivaGenerations, getTemplos, getEvents } from "@/lib/api";
import { getLatestDirectivaMembers } from "@/components/sections/search/search-helpers";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = false;

export const metadata: Metadata = buildPageMetadata({
  title: "Búsqueda",
  description: "Busca pastores, coros, directivos, templos y eventos en la Región Mayo.",
  canonicalPath: "/buscar",
  noIndex: true,
});

export default async function BuscarPage() {
  const [region, pastores, coros, directivaGenerations, templos, eventos] = await Promise.all([
    getRegionConfig("region-mayo"),
    getPastors("region-mayo"),
    getCoros("region-mayo"),
    getDirectivaGenerations("region-mayo"),
    getTemplos("region-mayo"),
    getEvents("region-mayo"),
  ]);
  const directiva = getLatestDirectivaMembers(directivaGenerations);

  return (
    <main className="min-h-screen bg-[#f1f1f1]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <SearchContent data={{ pastores, coros, directiva, templos, eventos }} />
      <Chatbot />
    </main>
  );
}
