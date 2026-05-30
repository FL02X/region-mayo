import { Metadata } from "next"
import { AppHeader } from "@/components/layout/app-header"
import { AlbumContent } from "@/components/sections/album/album-content"
import Chatbot from "@/components/shared/chatbot"
import { getAlbums, getRegionConfig } from "@/lib/api"

// On-demand revalidation: only rebuild when webhook is triggered from Sanity
// Optimized for free Vercel plan with low traffic
// Page will be statically generated at build time and NOT revalidated automatically
export const revalidate = false;

export const metadata: Metadata = {
  title: "Album de Actividades | IGC Región Mayo",
  description: "Revive los momentos especiales de los eventos de la Región Mayo a través de nuestras fotos.",
}

export default async function AlbumPage() {
  const [region, albums] = await Promise.all([
    getRegionConfig("region-mayo"),
    getAlbums("region-mayo"),
  ])

  return (
    <main className="min-h-screen bg-[#f1f1f1]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <div>
        {region ? (
          <AlbumContent albums={albums} />
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
