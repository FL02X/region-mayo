import { Metadata } from "next"
import { AppHeader } from "@/components/app-header"
import { CorosContent } from "@/components/coros-content"
import { getCoros, getRegionConfig } from "@/lib/api"

export const metadata: Metadata = {
  title: "Coros Locales - Región Mayo",
  description: "Descubre los coros locales de la Región Mayo y contacta a sus presidentes.",
}

export default async function CorosPage() {
  const [region, coros] = await Promise.all([
    getRegionConfig("region-mayo"),
    getCoros("region-mayo"),
  ])

  return (
    <main className="min-h-screen bg-background">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <div className="pt-14">
        {region ? (
          <CorosContent coros={coros} />
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
