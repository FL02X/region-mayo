import { AppHeader } from "@/components/app-header";
import { HeroSection } from "@/components/hero-section";
import { EventsFeed } from "@/components/events-feed";
import { ActionDeck } from "@/components/action-deck";
import { Providers } from "@/components/providers";
import { GoToCalendar } from "@/components/go-to-calendar";
import {
  getEvents,
  getRegionConfig,
  getRegionPresident,
  getSiteSettings,
  getLatestHeroCard,
  getPrayerWallConfig,
  getLatestSocialPosts,
} from "@/lib/api";

// On-demand revalidation: only rebuild when webhook is triggered from Sanity
// Optimized for free Vercel plan with low traffic
// Page will be statically generated at build time and NOT revalidated automatically
export const revalidate = false;

export default async function Home() {
  const [region, events, regionPresident, siteSettings, heroCard, prayerWall, socialPosts] =
    await Promise.all([
      getRegionConfig("region-mayo"),
      getEvents("region-mayo"),
      getRegionPresident("region-mayo"),
      getSiteSettings("region-mayo"),
      getLatestHeroCard("region-mayo"),
      getPrayerWallConfig("region-mayo"),
      getLatestSocialPosts(6),
    ]);



  const nextUpcomingEvent =
    events
      .filter((event) => event.date.getTime() > Date.now())
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null;

  return (
    <main id="main-content" className="min-h-screen bg-[#f1f1f1]">
      <Providers>
        <AppHeader
          instagramUrl={region?.socialLinks.instagram}
          facebookUrl={region?.socialLinks.facebook}
        />

        <div className="hidden md:block">
          <HeroSection
            heroImages={siteSettings?.heroImages}
            events={events}
            customHeroCard={heroCard}
            prayerWall={prayerWall}
            socialPosts={socialPosts}
            instagramUrl={region?.socialLinks.instagram}
            facebookUrl={region?.socialLinks.facebook}
            regionPresident={regionPresident}
          />
        </div>

        {/* Desktop only: ActionDeck below hero — keep tight to hero, decorative bottom rules in component */}
        <div className="hidden md:block max-w-[950px] mx-auto md:border-x border-[#dce2e9] bg-white mt-0 mb-0">
          <ActionDeck
            events={events}
            instagramUrl={region?.socialLinks.instagram}
            facebookUrl={region?.socialLinks.facebook}
            customHeroCard={heroCard}
            prayerWall={prayerWall}
            socialPosts={socialPosts}
            now={Date.now()}
          />
        </div>

        <div className="pt-[51px] md:pt-0">
          {region ? (
            <EventsFeed
              events={events}
              regionPresident={regionPresident}
              instagramUrl={region?.socialLinks.instagram}
              facebookUrl={region?.socialLinks.facebook}
              customHeroCard={heroCard}
              prayerWall={prayerWall}
              socialPosts={socialPosts}
              now={Date.now()}
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
        <GoToCalendar />
      </Providers>
    </main>
  );
}
