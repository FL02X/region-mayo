import type { Metadata } from "next";
import { readInitialViewMode } from "@/lib/cookie-utils";
import { AppHeader } from "@/components/layout/nav-bar";
import { TemplosContent } from "@/components/sections/templos/templos-content";
import Chatbot from "@/components/shared/chatbot";
import { getTemplos, getRegionConfig } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = false;

export const metadata: Metadata = buildPageMetadata({
  title: "Templos",
  description:
    "Directorio de iglesias locales de la Región Mayo. Encuentra horarios, pastores y coros de cada templo.",
  canonicalPath: "/templos",
});

export default async function TemploPage() {
  const initialViewMode = await readInitialViewMode("rm-view-mode-templos");
  const [region, templos] = await Promise.all([
    getRegionConfig("region-mayo"),
    getTemplos("region-mayo"),
  ]);

  return (
    <main className="min-h-screen bg-[#f1f1f1]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <div>
        <TemplosContent templos={templos} initialViewMode={initialViewMode} />
      </div>
      <Chatbot />
    </main>
  );
}
