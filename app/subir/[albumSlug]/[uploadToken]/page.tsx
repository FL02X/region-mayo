import Link from 'next/link'
import { Camera, CheckCircle2, ImagePlus, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AlbumUploadForm } from '@/components/sections/album/album-upload-form'
import { getAlbumUploadPageAccess } from '@/lib/album-submissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    <main className="min-h-screen bg-[#f1f1f1] px-4 py-6" id="main-content">
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
              <Link href="/album">Volver al album</Link>
            </Button>
          )}
        </section>
      </div>
    </main>
  )
}

export default async function AlbumUploadPage({ params }: UploadPageProps) {
  const { albumSlug, uploadToken } = await params
  const access = await getAlbumUploadPageAccess(albumSlug, uploadToken)

  if (access.status !== 'valid' || !access.album) {
    const title =
      access.status === 'closed'
        ? 'Recepcion cerrada'
        : access.status === 'disabled'
          ? 'Subida no disponible'
          : 'Enlace no valido'

    return (
      <UploadUnavailable
        title={title}
        message={access.message || 'Este enlace de subida no es valido.'}
        albumPath={access.album?.publicAlbumPath}
      />
    )
  }

  return (
    <main className="min-h-screen bg-[#f1f1f1] px-4 py-5" id="main-content">
      <div className="mx-auto w-full max-w-[560px]">
        <header className="mb-4 flex items-center justify-between gap-3">
          <Link
            href={access.album.publicAlbumPath}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            Volver al album
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <Camera className="h-4 w-4" aria-hidden="true" />
            IGC Region Mayo
          </div>
        </header>

        <section className="border border-border bg-white shadow-sm">
          <div className="border-b border-border p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center bg-[#eef3f8] text-primary">
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Compartir fotos
            </h1>
            <p className="mt-1 text-base font-medium text-foreground">{access.album.title}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Sube tus fotos de esta actividad. Un encargado las revisara antes de publicarlas en
              el album.
            </p>
          </div>

          <div className="p-5">
            <div className="mb-5 border border-[#dbe7f1] bg-[#f6f9fc] p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                Reglas de subida
              </div>
              <ul className="space-y-1 text-sm leading-6 text-muted-foreground">
                <li>Maximo 10 fotos por envio.</li>
                <li>Maximo 5 MB por foto.</li>
                <li>Formatos permitidos: JPG, PNG o WEBP.</li>
              </ul>
              {access.album.uploadInstructions ? (
                <p className="mt-3 border-t border-[#dbe7f1] pt-3 text-sm leading-6 text-foreground">
                  {access.album.uploadInstructions}
                </p>
              ) : null}
            </div>

            <AlbumUploadForm
              albumSlug={access.album.slug}
              uploadToken={uploadToken}
              albumPath={access.album.publicAlbumPath}
              turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
            />
          </div>
        </section>
      </div>
    </main>
  )
}
