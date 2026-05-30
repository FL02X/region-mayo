import { Metadata } from "next"
import { readInitialViewMode } from "@/lib/cookie-utils"
import { AppHeader } from "@/components/layout/app-header"
import { SectionNavBar } from "@/components/layout/section-nav-bar"
import { DirectivaContent } from "@/components/sections/directiva/directiva-content"
import Chatbot from "@/components/shared/chatbot"
import { getDirectiva, getRegionConfig } from "@/lib/api"

// On-demand revalidation: only rebuild when webhook is triggered from Sanity
// Optimized for free Vercel plan with low traffic
// Page will be statically generated at build time and NOT revalidated automatically
export const revalidate = false;

export const metadata: Metadata = {
  title: "Directiva - Región Mayo",
  description: "Conoce a los miembros de la directiva de la Región Mayo y contacta con ellos.",
}

export default async function DirectivaPage() {
  const initialViewMode = await readInitialViewMode("rm-view-mode-directiva")
  const [region, members] = await Promise.all([
    getRegionConfig("region-mayo"),
    getDirectiva("region-mayo"),
  ])

  return (
    <main className="min-h-screen bg-[#f1f1f1]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <SectionNavBar currentLabel="Directiva" icon="directiva" />
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
  )
}
