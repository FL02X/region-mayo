import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { AppHeader } from "@/components/layout/app-header"
import { AlbumContent } from "@/components/sections/album/album-content"
import Chatbot from "@/components/shared/chatbot"
import { getAlbumBySlug, getAlbumSlugs, getRegionConfig } from "@/lib/api"

export const revalidate = false

interface AlbumDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const slugs = await getAlbumSlugs("region-mayo")
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: AlbumDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const album = await getAlbumBySlug(slug, "region-mayo")

  if (!album) {
    return {
      title: "Album no encontrado | IGC Región Mayo",
    }
  }

  return {
    title: `${album.title} | Album de Actividades | IGC Región Mayo`,
    description:
      album.description ||
      `Fotos de ${album.title} en el album de actividades de la Región Mayo.`,
    openGraph: {
      title: album.title,
      description:
        album.description ||
        `Fotos de ${album.title} en el album de actividades de la Región Mayo.`,
      images: [{ url: album.coverImage }],
    },
  }
}

export default async function AlbumDetailPage({ params }: AlbumDetailPageProps) {
  const { slug } = await params
  const [region, album] = await Promise.all([
    getRegionConfig("region-mayo"),
    getAlbumBySlug(slug, "region-mayo"),
  ])

  if (!album) notFound()

  return (
    <main className="min-h-screen bg-[#f1f1f1]">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <AlbumContent album={album} />
      <Chatbot />
    </main>
  )
}
