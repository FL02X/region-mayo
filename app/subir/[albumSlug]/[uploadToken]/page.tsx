import type { Metadata } from "next"
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppHeader } from '@/components/layout/nav-bar'
import { SectionNavBar } from '@/components/layout/section-nav-bar'
import { AlbumUploadForm } from '@/components/sections/album/album-upload-form'
import { getAlbumUploadPageAccess } from '@/lib/album-submissions'
import { getRegionConfig } from '@/lib/api'
import { buildPageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata: Metadata = buildPageMetadata({
  title: "Subida privada | IGC Región Mayo",
  description: "Página privada para compartir fotos de un álbum.",
  canonicalPath: "/subir",
  noIndex: true,
})

type UploadPageProps = {
  params: Promise<{
    albumSlug: string
    uploadToken: string
  }>
}

function UploadUnavailable({
  title,
  message,
  albumPath,
}: {
  title: string
  message: string
  albumPath?: string
}) {
  return (
    <div className="px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[520px] items-center">
        <section className="w-full border border-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center bg-[#eef3f8] text-primary">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
          {albumPath ? (
            <Button asChild className="mt-6 h-12 w-full rounded-none">
              <Link href={albumPath}>Volver al album</Link>
            </Button>
          ) : (
            <Button asChild className="mt-6 h-12 w-full rounded-none">
              <Link href="/album/galerias">Volver al album</Link>
            </Button>
          )}
        </section>
      </div>
    </div>
  )
}

export default async function AlbumUploadPage({ params }: UploadPageProps) {
  const { albumSlug, uploadToken } = await params
  const [region, access] = await Promise.all([
    getRegionConfig("region-mayo"),
    getAlbumUploadPageAccess(albumSlug, uploadToken),
  ])

  if (access.status !== 'valid' || !access.album) {
    const title =
      access.status === 'closed'
        ? 'Recepcion cerrada'
        : access.status === 'disabled'
          ? 'Subida no disponible'
          : 'Enlace no valido'

    return (
      <main className="min-h-screen bg-[#f1f1f1]" id="main-content">
        <AppHeader
          instagramUrl={region?.socialLinks.instagram}
          facebookUrl={region?.socialLinks.facebook}
        />
        <UploadUnavailable
          title={title}
          message={access.message || 'Este enlace de subida no es valido.'}
          albumPath={access.album?.publicAlbumPath}
        />
      </main>
    )
  }

  return (
    <main className="bg-[#f1f1f1]" id="main-content">
      <AppHeader
        instagramUrl={region?.socialLinks.instagram}
        facebookUrl={region?.socialLinks.facebook}
      />
      <SectionNavBar
        currentLabel={`Compartir fotos - ${access.album.title}`}
        parentHref={access.album.publicAlbumPath}
        parentLabel="Volver al album"
        icon="album"
      />
      <div className="-mt-px mx-auto w-full max-w-[950px] bg-white focus:outline-none md:max-w-[952px] md:border-x-2 md:border-[#d6d0c5] dark:border-[#27272a]">
        <AlbumUploadForm
          albumSlug={access.album.slug}
          uploadToken={uploadToken}
          albumPath={access.album.publicAlbumPath}
          albumTitle={access.album.title}
          coverImage={access.album.coverImage}
          uploadInstructions={access.album.uploadInstructions}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
        />
      </div>
    </main>
  )
}
