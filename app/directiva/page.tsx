import type { Metadata } from "next";
import { readInitialViewMode } from "@/lib/cookie-utils";
import { AppHeader } from "@/components/layout/nav-bar";
import { DirectivaContent } from "@/components/sections/directiva/directiva-content";
import Chatbot from "@/components/shared/chatbot";
import { getDirectivaGenerations, getRegionConfig } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = false;

export const metadata: Metadata = buildPageMetadata({
  title: "Directiva",
  description:
    "Conoce a los miembros de la directiva de la Región Mayo y contacta con ellos.",
  canonicalPath: "/directiva",
});

export default async function DirectivaPage() {
  const initialViewMode = await readInitialViewMode("rm-view-mode-directiva");
  const [region, generations] = await Promise.all([
    getRegionConfig("region-mayo"),
    getDirectivaGenerations("region-mayo"),
  ]);

  return (
    <main className="min-h-screen bg-[#f1f1f1]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <div>
        <DirectivaContent generations={generations} initialViewMode={initialViewMode} />
      </div>
      <Chatbot />
    </main>
  );
}
