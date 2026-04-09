import { Metadata } from "next"
import { AppHeader } from "@/components/app-header"
import { DirectorioContent } from "@/components/directorio-content"
import { getPastors, getRegionConfig } from "@/lib/api"

export const metadata: Metadata = {
  title: "Directorio de Pastores - Región Mayo",
  description: "Conoce a los pastores de la Región Mayo y las iglesias que sirven en nuestra comunidad.",
}

export default async function DirectorioPage() {
  const [region, pastors] = await Promise.all([
    getRegionConfig("region-mayo"),
    getPastors("region-mayo"),
  ])

  return (
    <main className="min-h-screen bg-background">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <div>
        {region ? (
          <DirectorioContent pastors={pastors} />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-lg text-gray-500">
              No hay información disponible. Por favor, configúrala en Sanity Studio.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
