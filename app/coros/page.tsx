import type { Metadata } from "next";
import { readInitialViewMode } from "@/lib/cookie-utils";
import { AppHeader } from "@/components/layout/nav-bar";
import { CorosContent } from "@/components/sections/coros/coros-content";
import Chatbot from "@/components/shared/chatbot";
import { getCoros, getRegionConfig } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = false;

export const metadata: Metadata = buildPageMetadata({
  title: "Coros Locales",
  description:
    "Descubre los coros locales de la Región Mayo y contacta a sus presidentes.",
  canonicalPath: "/coros",
});

export default async function CorosPage() {
  const initialViewMode = await readInitialViewMode("rm-view-mode-coros");
  const [region, coros] = await Promise.all([
    getRegionConfig("region-mayo"),
    getCoros("region-mayo"),
  ]);

  return (
    <main className="min-h-screen bg-[#f1f1f1]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <div>
        <CorosContent coros={coros} initialViewMode={initialViewMode} />
      </div>
      <Chatbot />
    </main>
  );
}
