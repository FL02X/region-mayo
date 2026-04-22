import { AppHeader } from "@/components/app-header";
import { HeroSection } from "@/components/hero-section";
import { EventsFeed } from "@/components/events-feed";
import { ActionDeck } from "@/components/action-deck";
import {
  getEvents,
  getRegionConfig,
  getRegionPresident,
  getSiteSettings,
} from "@/lib/api";

export default async function Home() {
  const [region, events, regionPresident, siteSettings] =
    await Promise.all([
      getRegionConfig("region-mayo"),
      getEvents("region-mayo"),
      getRegionPresident("region-mayo"),
      getSiteSettings("region-mayo"),
    ]);

  const nextUpcomingEvent =
    events
      .filter((event) => event.date.getTime() > Date.now())
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null;

  return (
    <main id="main-content" className="min-h-screen bg-[#f1f1f1]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <div className="hidden md:block">
        <HeroSection
          heroImages={siteSettings?.heroImages}
          nextEvent={nextUpcomingEvent}
          regionPresident={regionPresident}
        />
      </div>
      {/* Desktop only: ActionDeck below hero */}
      <div className="hidden md:block max-w-[950px] mx-auto md:border-x border-[#dce2e9] bg-white">
        <ActionDeck events={events} />
      </div>
      <div className="pt-[51px] md:pt-0">
        {region ? (
          <EventsFeed
            events={events}
            regionPresident={regionPresident}
          />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-lg text-gray-500">
              No hay información de región disponible. Por favor, configúrala en
              Sanity Studio.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
