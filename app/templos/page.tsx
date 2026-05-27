import { Metadata } from "next";
import { readCookieValue } from "@/lib/cookie-utils";
import { AppHeader } from "@/components/layout/app-header";
import { TemplosContent } from "@/components/sections/templos/templos-content";
import Chatbot from "@/components/shared/chatbot";
import { getTemplos, getRegionConfig } from "@/lib/api";

// On-demand revalidation: only rebuild when webhook is triggered from Sanity
// Optimized for free Vercel plan with low traffic
// Page will be statically generated at build time and NOT revalidated automatically
export const revalidate = false;

export const metadata: Metadata = {
  title: "Templos | IGC Región Mayo",
  description:
    "Directorio de iglesias locales de la Región Mayo. Encuentra horarios, pastores y coros de cada templo.",
};

export default async function TemploPage() {
  const viewModeCookie = await readCookieValue("rm-view-mode-templos");
  const initialViewMode = viewModeCookie === "compact" ? "compact" : "grid";
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
        {region ? (
          <TemplosContent templos={templos} initialViewMode={initialViewMode} />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-lg text-gray-500">
              No hay información disponible. Por favor, configúrala en Sanity
              Studio.
            </p>
          </div>
        )}
      </div>
      <Chatbot />
    </main>
  );
}
