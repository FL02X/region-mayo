import { Metadata } from "next"
import { AppHeader } from "@/components/layout/app-header"
import { CorosContent } from "@/components/sections/coros/coros-content"
import { getCoros, getRegionConfig } from "@/lib/api"

// On-demand revalidation: only rebuild when webhook is triggered from Sanity
// Optimized for free Vercel plan with low traffic
// Page will be statically generated at build time and NOT revalidated automatically
export const revalidate = false;

export const metadata: Metadata = {
  title: "Coros Locales - Región Mayo",
  description: "Descubre los coros locales de la Región Mayo y contacta a sus presidentes.",
}

export default async function CorosPage() {
  const [region, coros] = await Promise.all([
    getRegionConfig("region-mayo"),
    getCoros("region-mayo"),
  ])

  return (
    <main className="min-h-screen bg-[#f1f1f1]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <div>
        {region ? (
          <CorosContent coros={coros} />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-lg text-gray-500">
              No hay información disponible. Por favor, configúrala en Sanity Studio.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
