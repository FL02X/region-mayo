import { AppHeader } from "@/components/app-header";
import { HeroSection } from "@/components/hero-section";
import { EventsFeed } from "@/components/events-feed";
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

  return (
    <main id="main-content" className="min-h-screen">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <div className="hidden md:block">
        <HeroSection
          heroImages={siteSettings?.heroImages}
          heroTitle={siteSettings?.heroTitle}
          heroSubtitle={siteSettings?.heroSubtitle}
        />
      </div>
      <div className="pt-[56px] md:pt-0">
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
