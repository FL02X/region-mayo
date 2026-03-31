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
    getRegionConfig("Región Mayo"),
    getDirectiva("Región Mayo"),
  ])

  return (
    <main className="min-h-screen bg-background">
      <AppHeader
        instagramUrl={region.socialLinks.instagram}
        facebookUrl={region.socialLinks.facebook}
      />
      <div className="pt-14">
        <DirectivaContent members={members} />
      </div>
    </main>
  )
}
