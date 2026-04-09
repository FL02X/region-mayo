import { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { SearchContent } from "@/components/search-content";
import { getRegionConfig, getPastors, getCoros, getDirectiva, getTemplos, getEvents } from "@/lib/api";

export const metadata: Metadata = {
  title: "Búsqueda - Región Mayo",
  description: "Busca pastores, coros, directivos, templos y eventos en la Región Mayo.",
};

export default async function BuscarPage() {
  // Fetch all data upfront to enable fast client-side searching
  const [region, pastores, coros, directiva, templos, eventos] = await Promise.all([
    getRegionConfig("region-mayo"),
    getPastors("region-mayo"),
    getCoros("region-mayo"),
    getDirectiva("region-mayo"),
    getTemplos("region-mayo"),
    getEvents("region-mayo"),
  ]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] dark:bg-[#09090b]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <SearchContent 
        data={{ pastores, coros, directiva, templos, eventos }}
      />
    </main>
  );
}