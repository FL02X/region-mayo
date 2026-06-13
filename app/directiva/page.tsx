import type { Metadata } from "next";
import { readInitialViewMode } from "@/lib/cookie-utils";
import { AppHeader } from "@/components/layout/nav-bar";
import { DirectivaContent } from "@/components/sections/directiva/directiva-content";
import Chatbot from "@/components/shared/chatbot";
import { getDirectiva, getRegionConfig } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = false;

export const metadata: Metadata = buildPageMetadata({
  title: "Directiva | IGC Región Mayo",
  description:
    "Conoce a los miembros de la directiva de la Región Mayo y contacta con ellos.",
  canonicalPath: "/directiva",
});

export default async function DirectivaPage() {
  const initialViewMode = await readInitialViewMode("rm-view-mode-directiva");
  const [region, members] = await Promise.all([
    getRegionConfig("region-mayo"),
    getDirectiva("region-mayo"),
  ]);

  return (
    <main className="min-h-screen bg-[#f1f1f1]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <div>
        {region ? (
          <DirectivaContent members={members} initialViewMode={initialViewMode} />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-lg text-gray-500">
              No hay información disponible. Por favor, configúrala en Sanity Studio.
            </p>
          </div>
        )}
      </div>
      <Chatbot />
    </main>
  );
}
