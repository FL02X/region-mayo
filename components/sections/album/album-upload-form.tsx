"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Script from "next/script"
import NextImage from "next/image"
import Link from "next/link"
import { Newsreader } from "next/font/google"
import { ArrowRight, CheckCircle2, ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sanityImageVariantUrl } from "@/lib/sanity/image"
import {
  ALBUM_SUBMISSION_ALLOWED_TYPES,
  ALBUM_SUBMISSION_MAX_FILE_SIZE,
  ALBUM_SUBMISSION_MAX_FILES,
} from "@/lib/album-submission-constants"

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      callback: (token: string) => void
      "expired-callback": () => void
      "error-callback": () => void
    },
  ) => string
  reset: (widgetId?: string) => void
  remove: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

type AlbumUploadFormProps = {
  albumSlug: string
  uploadToken: string
  albumPath: string
  albumTitle: string
  coverImage: string
  uploadInstructions?: string
  turnstileSiteKey: string
}

type ProgressState = {
  current: number
  total: number
  label: string
}

type FilePreview = {
  key: string
  name: string
  size: number
  url: string
}

type RemovalNotice = {
  id: number
  message: string
}

const MAX_CANVAS_DIMENSION = 1800
const COMPRESS_QUALITIES = [0.82, 0.74, 0.66, 0.58]
const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
})

function createSessionId(): string {
  if (crypto.randomUUID) return crypto.randomUUID()

  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateFiles(files: File[]): string | null {
  if (files.length === 0) return "Selecciona al menos una foto."
  if (files.length > ALBUM_SUBMISSION_MAX_FILES) {
    return "Puedes subir maximo 10 fotos por envio."
  }

  for (const file of files) {
    if (file.size <= 0) return "Selecciona al menos una foto."
    if (file.size > ALBUM_SUBMISSION_MAX_FILE_SIZE) {
      return "Una de las fotos supera el limite de 5 MB."
    }
    if (!ALBUM_SUBMISSION_ALLOWED_TYPES.has(file.type)) {
      return "Solo se permiten imagenes JPG, PNG o WEBP."
    }
  }

  return null
}

function isUploadRuleError(message: string | null): message is string {
  if (!message) return false
  return (
    message.includes("maximo 10 fotos") ||
    message.includes("supera el limite") ||
    message.includes("Solo se permiten")
  )
}

function getCompressedFilename(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "").trim() || "foto"
  return `${withoutExtension}.webp`
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("No se pudo leer la imagen."))
    }
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", quality)
  })
}

async function compressImage(file: File): Promise<File> {
  const image = await loadImage(file)
  const largestSide = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height)
  const scale = largestSide > MAX_CANVAS_DIMENSION ? MAX_CANVAS_DIMENSION / largestSide : 1
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale))
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale))
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) throw new Error("No se pudo optimizar la foto.")

  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0, width, height)

  for (const quality of COMPRESS_QUALITIES) {
    const blob = await canvasToBlob(canvas, quality)
    if (blob && blob.size > 0 && blob.size <= ALBUM_SUBMISSION_MAX_FILE_SIZE) {
      return new File([blob], getCompressedFilename(file.name), {
        type: "image/webp",
        lastModified: file.lastModified,
      })
    }
  }

  if (file.size <= ALBUM_SUBMISSION_MAX_FILE_SIZE) return file

  throw new Error("Una de las fotos no pudo optimizarse bajo el limite de 5 MB.")
}

export function AlbumUploadForm({
  albumSlug,
  uploadToken,
  albumPath,
  albumTitle,
  coverImage,
  uploadInstructions,
  turnstileSiteKey,
}: AlbumUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null)
  const turnstileWidgetIdRef = useRef<string | null>(null)
  const [submittedByName, setSubmittedByName] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([])
  const [turnstileToken, setTurnstileToken] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [uploadRulesError, setUploadRulesError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [removalNotice, setRemovalNotice] = useState<RemovalNotice | null>(null)
  const [isRemovalNoticeExiting, setIsRemovalNoticeExiting] = useState(false)
  const allowDevBypass = process.env.NODE_ENV !== "production" && !turnstileSiteKey
  const turnstileConfigured = Boolean(turnstileSiteKey) || allowDevBypass

  const selectedSummary = useMemo(
    () => `IMAGENES SUBIDAS (${selectedFiles.length}/${ALBUM_SUBMISSION_MAX_FILES})`,
    [selectedFiles.length],
  )

  const coverImageUrl = useMemo(
    () =>
      sanityImageVariantUrl(coverImage, {
        width: 640,
        height: 640,
        quality: 88,
        format: "webp",
        fit: "crop",
      }),
    [coverImage],
  )

  const resetTurnstile = useCallback(() => {
    setTurnstileToken("")
    if (turnstileWidgetIdRef.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetIdRef.current)
    }
  }, [])

  const renderTurnstile = useCallback(() => {
    if (!turnstileSiteKey || !window.turnstile || !turnstileContainerRef.current) return
    if (turnstileWidgetIdRef.current) return

    turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: turnstileSiteKey,
      callback: (token) => {
        setTurnstileToken(token)
        setError(null)
      },
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    })
  }, [turnstileSiteKey])

  useEffect(() => {
    renderTurnstile()

    return () => {
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current)
        turnstileWidgetIdRef.current = null
      }
    }
  }, [renderTurnstile])

  useEffect(() => {
    const previews = selectedFiles.map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
    }))

    setFilePreviews(previews)

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [selectedFiles])

  useEffect(() => {
    if (!removalNotice) return

    const exitTimerId = window.setTimeout(() => {
      setIsRemovalNoticeExiting(true)
    }, 2800)
    const removeTimerId = window.setTimeout(() => {
      setRemovalNotice(null)
      setIsRemovalNoticeExiting(false)
    }, 3200)

    return () => {
      window.clearTimeout(exitTimerId)
      window.clearTimeout(removeTimerId)
    }
  }, [removalNotice])

  const showRemovalNotice = (message: string) => {
    setIsRemovalNoticeExiting(false)
    setRemovalNotice({
      id: Date.now(),
      message,
    })
  }

  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    const validationError = validateFiles(files)

    setError(validationError)
    setUploadRulesError(isUploadRuleError(validationError) ? validationError : null)
    setSuccessCount(0)
    setRemovalNotice(null)
    setIsRemovalNoticeExiting(false)

    if (validationError) {
      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setSelectedFiles(files)
    setUploadRulesError(null)
  }

  const removeSelectedFile = (fileKey: string) => {
    const removedFile = selectedFiles.find(
      (file) => `${file.name}-${file.size}-${file.lastModified}` === fileKey,
    )
    const nextFiles = selectedFiles.filter(
      (file) => `${file.name}-${file.size}-${file.lastModified}` !== fileKey,
    )

    setSelectedFiles(nextFiles)
    setSuccessCount(0)
    if (removedFile) {
      showRemovalNotice(`Eliminaste ${removedFile.name}.`)
    }
    const validationError = nextFiles.length === 0 ? null : validateFiles(nextFiles)
    setError(validationError)
    setUploadRulesError(isUploadRuleError(validationError) ? validationError : null)
    if (nextFiles.length === 0 && fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeAllSelectedFiles = () => {
    const removedCount = selectedFiles.length

    setSelectedFiles([])
    setSuccessCount(0)
    setError(null)
    setUploadRulesError(null)
    showRemovalNotice(`Eliminaste ${removedCount} ${removedCount === 1 ? "foto" : "fotos"}.`)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const submitOneFile = async ({
    file,
    sessionId,
    index,
  }: {
    file: File
    sessionId: string
    index: number
  }) => {
    setProgress({
      current: index + 1,
      total: selectedFiles.length,
      label: `Optimizando foto ${index + 1}`,
    })

    const optimizedFile = await compressImage(file)
    const formData = new FormData()

    formData.set("uploadToken", uploadToken)
    formData.set("submittedByName", submittedByName.trim())
    formData.set("submissionSessionId", sessionId)
    formData.set(
      "turnstileToken",
      index === 0 ? turnstileToken || (allowDevBypass ? "dev-bypass" : "") : "",
    )
    formData.append("images", optimizedFile, optimizedFile.name)

    setProgress({
      current: index + 1,
      total: selectedFiles.length,
      label: `Enviando foto ${index + 1}`,
    })

    const response = await fetch(`/api/albums/${encodeURIComponent(albumSlug)}/submissions`, {
      method: "POST",
      body: formData,
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.error || "No pudimos recibir tus fotos. Intenta de nuevo.")
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setUploadRulesError(null)
    setSuccessCount(0)

    const validationError = validateFiles(selectedFiles)
    if (validationError) {
      setError(validationError)
      setUploadRulesError(isUploadRuleError(validationError) ? validationError : null)
      return
    }

    if (!submittedByName.trim()) {
      setError("Ingresa tu nombre para enviar las fotos.")
      setUploadRulesError(null)
      return
    }

    if (!turnstileConfigured) {
      setError("Falta configurar Turnstile para recibir fotos.")
      return
    }

    if (!allowDevBypass && !turnstileToken) {
      setError("No pudimos verificar que eres una persona. Intenta de nuevo.")
      return
    }

    setIsSubmitting(true)
    const sessionId = createSessionId()
    let uploadedCount = 0

    try {
      for (let index = 0; index < selectedFiles.length; index += 1) {
        await submitOneFile({ file: selectedFiles[index], sessionId, index })
        uploadedCount += 1
      }

      setSuccessCount(uploadedCount)
      setSelectedFiles([])
      setUploadRulesError(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "No pudimos recibir tus fotos. Intenta de nuevo."

      setError(
        uploadedCount > 0
          ? `Recibimos ${uploadedCount} ${uploadedCount === 1 ? "foto" : "fotos"}, pero no pudimos completar el envio. ${message}`
          : message,
      )
      resetTurnstile()
    } finally {
      setProgress(null)
      setIsSubmitting(false)
    }
  }

  if (successCount > 0 && !error) {
    return (
      <div className="space-y-5 px-4 py-4 text-center md:px-8 md:py-6">
        <div className="mx-auto flex items-center justify-center text-emerald-700">
          <CheckCircle2 className="h-16 w-16" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Gracias por compartir tus fotos.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Las recibimos correctamente y apareceran en el album cuando un encargado las apruebe.
          </p>
        </div>
        <Button asChild className="h-12 w-full rounded-none">
          <Link href={albumPath}>Volver al album</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      {turnstileSiteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={renderTurnstile}
        />
      ) : null}

      <form className="min-w-0 max-w-full overflow-x-clip bg-white" onSubmit={handleSubmit}>
        <section className="min-w-0 max-w-full border-t border-border px-4 py-4 pt-6 md:px-8 md:py-6">
          <p className="mb-5 text-[13px] font-bold uppercase text-primary sm:text-sm">Compartir fotos</p>
          <div className="grid min-w-0 max-w-full grid-cols-[96px_minmax(0,1fr)] items-end gap-x-3 gap-y-3 sm:grid-cols-[128px_minmax(0,1fr)] md:items-start md:gap-x-5">
            <div className="relative h-24 w-24 overflow-hidden border border-border bg-muted sm:h-32 sm:w-32">
              <NextImage
                src={coverImageUrl}
                alt={albumTitle}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 96px, 128px"
                priority
              />
            </div>
            <div className="min-w-0 md:px-4 md:py-3">
              <h1 className={`${editorialFont.className} text-[clamp(1.55rem,7vw,2rem)] font-semibold leading-[1.05] text-foreground md:text-[2rem]`}>
                {albumTitle}
              </h1>
            </div>
          </div>
        </section>

        <section className="grid min-w-0 max-w-full md:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 max-w-full font-semibold text-ink px-4 py-4 md:border-b-0 md:border-r md:px-8 md:py-6">
            <Label htmlFor="album-upload-files" className="text-sm text-ink font-semibold uppercase md:text-base">Seleccionar fotos</Label>
            <input
              ref={fileInputRef}
              id="album-upload-files"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={handleSelectFiles}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="mt-6 mb-2 flex min-h-[140px] w-full max-w-full flex-col items-center justify-center gap-2 border border-dashed border-[#9aa8b6] bg-paper-highlight p-10 text-center transition-colors touch-manipulation hover:border-primary/70 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 md:min-h-[190px]"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <span className="flex h-12 w-12 items-center justify-center text-primary md:h-14 md:w-14">
                <ImagePlus className="h-9 w-9 md:h-10 md:w-10" aria-hidden="true" />
              </span>
              <span className="text-base font-semibold leading-tight text-foreground md:text-lg">Agregar fotos</span>
              <span className="max-w-sm text-[15px] leading-6 text-muted-foreground md:max-w-md">
                Selecciona hasta 10 imagenes desde este dispositivo.
              </span>
              <span className="mt-2 inline-flex h-11 items-center justify-center gap-2 bg-primary px-5 text-sm uppercase font-semibold text-white shadow-sm md:hidden">
                <UploadCloud className="h-5 w-5" aria-hidden="true" />
                Subir fotos
              </span>
            </button>
            {filePreviews.length > 0 ? (
              <div className="mt-8 min-w-0 max-w-full">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <p className="min-w-0 text-sm font-semibold uppercase text-ink">{selectedSummary}</p>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-semibold uppercase text-red-700 underline-offset-2 transition-colors hover:text-red-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    onClick={removeAllSelectedFiles}
                    disabled={isSubmitting}
                  >
                    Eliminar todas
                  </button>
                </div>
                <div className="mt-3 flex min-w-0 max-w-full flex-col gap-3">
                  {filePreviews.map((preview) => (
                    <div
                      key={preview.key}
                      className="grid min-w-0 max-w-full grid-cols-[56px_minmax(0,1fr)_40px] items-center gap-3 overflow-hidden border border-[#d7dce4] bg-paper-highlight p-4"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-muted">
                        <img
                          src={preview.url}
                          alt={preview.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <p className="break-all text-[14px] font-medium leading-snug text-foreground">{preview.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(preview.size)}</p>
                      </div>
                      <button
                        type="button"
                        className="flex h-10 w-10 shrink-0 items-center justify-center border border-red-200 bg-red-50 text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
                        onClick={() => removeSelectedFile(preview.key)}
                        disabled={isSubmitting}
                        aria-label={`Quitar ${preview.name}`}
                      >
                        <Trash2 className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4 px-4 pb-8 md:px-6 md:py-6">
            {uploadRulesError ? (
              <div className="border border-red-200 bg-red-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-800">
                  <CheckCircle2 className="h-4 w-4 text-red-700" aria-hidden="true" />
                  Reglas de subida
                </div>
                <p className="mb-2 text-sm font-medium leading-6 text-red-700">{uploadRulesError}</p>
                <ul className="space-y-1 text-sm leading-6 text-red-700">
                  <li>Maximo 10 fotos por envio.</li>
                  <li>Maximo 5 MB por foto.</li>
                  <li>Formatos permitidos: JPG, PNG o WEBP.</li>
                </ul>
                {uploadInstructions ? (
                  <p className="mt-3 border-t border-red-200 pt-3 text-sm leading-6 text-red-800">
                    {uploadInstructions}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-4 mb-8 mt-4">
              <Label htmlFor="submittedByName" className="ml-1 uppercase font-semibold text-ink">A nombre de:</Label>
              <Input
                id="submittedByName"
                value={submittedByName}
                onChange={(event) => setSubmittedByName(event.target.value.slice(0, 80))}
                placeholder="Tu nombre"
                required
                disabled={isSubmitting}
                className="h-12 rounded-none border-border !bg-[var(--bg-paper-highlight)]"
              />
            </div>

            {allowDevBypass ? (
              <div className="border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                Turnstile no esta configurado. En desarrollo se permite un bypass controlado.
              </div>
            ) : turnstileSiteKey ? (
              <div className="min-h-[72px] overflow-x-auto mb-6">
                <div ref={turnstileContainerRef} />
              </div>
            ) : (
              <div className="border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
                Falta configurar Turnstile para recibir fotos.
              </div>
            )}

            {progress ? (
              <div className="border border-[#dbe7f1] bg-[#f6f9fc] p-3" aria-live="polite">
                <div className="mb-2 flex items-center justify-between text-sm font-medium text-foreground">
                  <span>{progress.label}</span>
                  <span>
                    {progress.current}/{progress.total}
                  </span>
                </div>
                <div className="h-2 overflow-hidden bg-white">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : null}

            {error && error !== uploadRulesError ? (
              <div className="border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700" role="alert">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              className="h-14 w-full uppercase rounded-none text-base font-semibold"
              disabled={
                isSubmitting ||
                selectedFiles.length === 0 ||
                !submittedByName.trim() ||
                (!allowDevBypass && !turnstileToken)
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Enviando fotos
                </>
              ) : (
                <>
                  Enviar fotos
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </section>
        {removalNotice ? (
          <div
            key={removalNotice.id}
            className={`fixed bottom-5 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 justify-center px-2 transition-all duration-300 ease-out ${
              isRemovalNoticeExiting
                ? "translate-y-3 scale-95 opacity-0"
                : "animate-in fade-in slide-in-from-bottom-3 zoom-in-95 translate-y-0 scale-100 opacity-100"
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="inline-flex max-w-full items-center border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold leading-5 text-red-700 shadow-lg">
              <span className="min-w-0 break-words text-center">{removalNotice.message}</span>
            </div>
          </div>
        ) : null}
      </form>
    </>
  )
}
