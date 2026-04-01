import { AppHeader } from "@/components/app-header"
import { HeroSection } from "@/components/hero-section"
import { EventsFeed } from "@/components/events-feed"
import { getAvailableRegions, getEvents, getRegionConfig, getRegionPresident } from "@/lib/api"

export default async function Home() {
  const [region, events, regions, regionPresident] = await Promise.all([
    getRegionConfig("region-mayo"),
    getEvents("region-mayo"),
    getAvailableRegions(),
    getRegionPresident("region-mayo"),
  ])

  return (
    <main className="min-h-screen">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <HeroSection />
      {region ? (
        <EventsFeed events={events} regionPresident={regionPresident} regions={regions} />
      ) : (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg text-gray-500">
            No hay información de región disponible. Por favor, configúrala en Sanity Studio.
          </p>
        </div>
      )}
    </main>
  )
}
