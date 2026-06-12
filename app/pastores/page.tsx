import { Metadata } from "next"
import { readInitialViewMode } from "@/lib/cookie-utils"
import { AppHeader } from "@/components/layout/nav-bar"
import { DirectorioContent } from "@/components/sections/pastores/pastores-content"
import Chatbot from "@/components/shared/chatbot"
import { getPastors, getRegionConfig } from "@/lib/api"

// On-demand revalidation: only rebuild when webhook is triggered from Sanity
// Optimized for free Vercel plan with low traffic
// Page will be statically generated at build time and NOT revalidated automatically
export const revalidate = false;

export const metadata: Metadata = {
  title: "Pastores | IGC Región Mayo",
  description: "Conoce a los pastores de la Región Mayo y las iglesias que sirven en nuestra comunidad.",
}

export default async function DirectorioPage() {
  const initialViewMode = await readInitialViewMode("rm-view-mode-pastores")
  const [region, pastors] = await Promise.all([
    getRegionConfig("region-mayo"),
    getPastors("region-mayo"),
  ])

  return (
    <main className="min-h-screen bg-[#f1f1f1]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <div>
        {region ? (
          <DirectorioContent pastors={pastors} initialViewMode={initialViewMode} />
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
  )
}
