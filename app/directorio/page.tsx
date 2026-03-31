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
    getRegionConfig("Región Mayo"),
    getPastors("Región Mayo"),
  ])

  return (
    <main className="min-h-screen bg-background">
      <AppHeader
        instagramUrl={region.socialLinks.instagram}
        facebookUrl={region.socialLinks.facebook}
      />
      <div className="pt-14">
        <DirectorioContent pastors={pastors} />
      </div>
    </main>
  )
}
