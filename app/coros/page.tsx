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
    getRegionConfig("Región Mayo"),
    getCoros("Región Mayo"),
  ])

  return (
    <main className="min-h-screen bg-background">
      <AppHeader
        instagramUrl={region.socialLinks.instagram}
        facebookUrl={region.socialLinks.facebook}
      />
      <div className="pt-14">
        <CorosContent coros={coros} />
      </div>
    </main>
  )
}
