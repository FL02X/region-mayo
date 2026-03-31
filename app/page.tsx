import { AppHeader } from "@/components/app-header"
import { HeroSection } from "@/components/hero-section"
import { EventsFeed } from "@/components/events-feed"
import { getAvailableRegions, getEvents, getRegionConfig, getRegionPresident } from "@/lib/api"

export default async function Home() {
  const [region, events, regions, regionPresident] = await Promise.all([
    getRegionConfig("Región Mayo"),
    getEvents("Región Mayo"),
    getAvailableRegions(),
    getRegionPresident("Región Mayo"),
  ])

  return (
    <main className="min-h-screen">
      <AppHeader
        instagramUrl={region.socialLinks.instagram}
        facebookUrl={region.socialLinks.facebook}
      />
      <HeroSection />
      <EventsFeed events={events} regionPresident={regionPresident} regions={regions} />
    </main>
  )
}
