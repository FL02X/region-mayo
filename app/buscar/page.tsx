import { Metadata } from "next";
import { AppHeader } from "@/components/layout/nav-bar";
import { SearchContent } from "@/components/sections/search/search-content";
import Chatbot from "@/components/shared/chatbot";
import { getRegionConfig, getPastors, getCoros, getDirectiva, getTemplos, getEvents } from "@/lib/api";

// On-demand revalidation: only rebuild when webhook is triggered from Sanity
// Optimized for free Vercel plan with low traffic
// Page will be statically generated at build time and NOT revalidated automatically
export const revalidate = false;

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
    <main className="min-h-screen bg-[#f1f1f1]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <SearchContent 
        data={{ pastores, coros, directiva, templos, eventos }}
      />
      <Chatbot />
    </main>
  );
}
