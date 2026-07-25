import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/nav-bar";
import {
  readInitialCalendarLayoutMode,
  readInitialViewMode,
} from "@/lib/cookie-utils";
import { LocationNotificationBar } from "@/components/layout/location-popup-bar";
import { HeroSection } from "@/components/sections/home/hero-section.desktop";
import { DesktopHomeInfoWrapper } from "@/components/sections/home/desktop-home-info-wrapper";
import { MobileHero } from "@/components/sections/home/hero-section.mobile";
import { EventsFeed } from "@/components/sections/home/calendar-feed";
import { ActionDeck } from "@/components/sections/home/action-deck";
import { Providers } from "@/components/layout/time-providers";
import { GoToCalendar } from "@/components/sections/home/go-to-calendar.mobile";
import Chatbot from "@/components/shared/chatbot";
import {
  getEvents,
  getRegionConfig,
  getRegionPresident,
  getSiteSettings,
  getLatestHeroCard,
  getPrayerWallConfig,
  getLatestSocialPosts,
  getTemplos,
  getAlbums,
  getCurrentRecorridoHeroAnnouncement,
} from "@/lib/api";
import { buildPageMetadata, SITE_OFFICIAL_TITLE } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: SITE_OFFICIAL_TITLE,
  description:
    "Consulta el calendario regional, templos, pastores, coros, directiva y álbumes de la Iglesia Gentil de Cristo A.R. en la Región Mayo.",
  canonicalPath: "/",
  absoluteTitle: true,
});

// On-demand revalidation: only rebuild when webhook is triggered from Sanity
// Optimized for free Vercel plan with low traffic
// Page will be statically generated at build time and NOT revalidated automatically
export const revalidate = false;

export default async function Home() {
  const [initialViewMode, initialCalendarLayoutMode] = await Promise.all([
    readInitialViewMode("rm-view-mode-calendar"),
    readInitialCalendarLayoutMode("rm-calendar-layout"),
  ]);
  const now = Date.now();

  const [region, events, regionPresident, siteSettings, heroCard, prayerWall, socialPosts, templos, albums, recorridoHeroAnnouncement] =
    await Promise.all([
      getRegionConfig("region-mayo"),
      getEvents("region-mayo"),
      getRegionPresident("region-mayo"),
      getSiteSettings("region-mayo"),
      getLatestHeroCard("region-mayo"),
      getPrayerWallConfig("region-mayo"),
      getLatestSocialPosts(6),
      getTemplos("region-mayo"),
      getAlbums("region-mayo"),
      getCurrentRecorridoHeroAnnouncement(),
    ]);

  const nextUpcomingEvent =
    events
      .filter((event) => event.date.getTime() > now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null;

  return (
    <main id="main-content" className="min-h-screen bg-[#f1f1f1]">
      <Providers>
        <AppHeader
          instagramUrl={region?.socialLinks.instagram}
          facebookUrl={region?.socialLinks.facebook}
        />

        <div className="md:hidden">
          <LocationNotificationBar templos={templos} />
        </div>

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

        <DesktopHomeInfoWrapper albums={albums} />

        <MobileHero
          src={siteSettings?.mobileHeroImage?.url || "/images/event-conference.jpg"}
          alt={siteSettings?.mobileHeroImage?.alt || "Conferencia Regional"}
          templos={templos}
          announcement={recorridoHeroAnnouncement}
        />

        {/* Desktop only: ActionDeck below hero — keep tight to hero, decorative bottom rules in component */}
        <div className="offline-hide-when-offline hidden md:block max-w-[950px] mx-auto md:border-x border-[#dce2e9] bg-white mt-0 mb-0">
          <ActionDeck
            events={events}
            instagramUrl={region?.socialLinks.instagram}
            facebookUrl={region?.socialLinks.facebook}
            prayerWall={prayerWall}
            socialPosts={socialPosts}
            now={now}
          />
        </div>

        <div className="pt-0 md:pt-0">
          <EventsFeed
            events={events}
            regionPresident={regionPresident}
            instagramUrl={region?.socialLinks.instagram}
            facebookUrl={region?.socialLinks.facebook}
            customHeroCard={heroCard}
            prayerWall={prayerWall}
            socialPosts={socialPosts}
            now={now}
            initialViewMode={initialViewMode}
            initialCalendarLayoutMode={initialCalendarLayoutMode}
            albums={albums}
          />
        </div>

        <GoToCalendar />
        <Chatbot />
      </Providers>
    </main>
  );
}
