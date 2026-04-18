import { Metadata } from "next"
import { AppHeader } from "@/components/app-header"
import { DirectivaContent } from "@/components/directiva-content"
import { getDirectiva, getRegionConfig } from "@/lib/api"

export const metadata: Metadata = {
  title: "Directiva - Región Mayo",
  description: "Conoce a los miembros de la directiva de la Región Mayo y contacta con ellos.",
}

export default async function DirectivaPage() {
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
      <div>
        {region ? (
          <DirectivaContent members={members} />
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
