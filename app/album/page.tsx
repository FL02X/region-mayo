import { Metadata } from "next"
import { AppHeader } from "@/components/app-header"
import { AlbumContent } from "@/components/album-content"
import { getEvents, getRegionConfig } from "@/lib/api"

export const metadata: Metadata = {
  title: "Album de Actividades - Región Mayo",
  description: "Revive los momentos especiales de los eventos de la Región Mayo a través de nuestras fotos.",
}

export default async function AlbumPage() {
  const [region, events] = await Promise.all([
    getRegionConfig("Región Mayo"),
    getEvents("Región Mayo"),
  ])

  return (
    <main className="min-h-screen bg-background">
      <AppHeader
        instagramUrl={region.socialLinks.instagram}
        facebookUrl={region.socialLinks.facebook}
      />
      <div className="pt-14">
        <AlbumContent events={events} />
      </div>
    </main>
  )
}
