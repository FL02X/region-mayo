"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Script from "next/script"
import NextImage from "next/image"
import Link from "next/link"
import { CheckCircle2, ImagePlus, Loader2, UploadCloud, X } from "lucide-react"
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

const MAX_CANVAS_DIMENSION = 1800
const COMPRESS_QUALITIES = [0.82, 0.74, 0.66, 0.58]

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

  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    const validationError = validateFiles(files)

    setError(validationError)
    setUploadRulesError(isUploadRuleError(validationError) ? validationError : null)
    setSuccessCount(0)

    if (validationError) {
      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setSelectedFiles(files)
    setUploadRulesError(null)
  }

  const removeSelectedFile = (fileKey: string) => {
    const nextFiles = selectedFiles.filter(
      (file) => `${file.name}-${file.size}-${file.lastModified}` !== fileKey,
    )

    setSelectedFiles(nextFiles)
    setSuccessCount(0)
    const validationError = nextFiles.length === 0 ? null : validateFiles(nextFiles)
    setError(validationError)
    setUploadRulesError(isUploadRuleError(validationError) ? validationError : null)
    if (nextFiles.length === 0 && fileInputRef.current) fileInputRef.current.value = ""
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

      <form className="bg-white" onSubmit={handleSubmit}>
        <section className="border-b border-border px-4 py-4 md:px-8 md:py-6">
          <p className="mb-3 text-[13px] font-bold uppercase text-primary sm:text-sm">Compartir fotos</p>
          <div className="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-x-3 gap-y-3 sm:grid-cols-[128px_minmax(0,1fr)] md:gap-x-5">
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
            <div className="min-w-0 pt-0.5">
              <h1 className="text-[clamp(1.55rem,7vw,2rem)] font-semibold leading-[1.05] text-foreground md:text-[2rem]">
                {albumTitle}
              </h1>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-[minmax(0,1fr)_360px]">
          <div className="border-b border-border px-4 py-4 md:border-b-0 md:border-r md:px-8 md:py-6">
            <Label htmlFor="album-upload-files" className="text-base font-semibold">Seleccionar fotos</Label>
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
              className="mt-3 flex min-h-[140px] w-full flex-col items-center justify-center gap-2 border border-dashed border-[#9aa8b6] bg-paper-highlight p-5 text-center transition-colors touch-manipulation hover:border-primary/70 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 md:min-h-[190px]"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <span className="flex h-12 w-12 items-center justify-center bg-white text-primary shadow-sm md:h-14 md:w-14">
                <ImagePlus className="h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
              </span>
              <span className="text-lg font-semibold leading-tight text-foreground">Agregar fotos</span>
              <span className="max-w-sm text-sm leading-6 text-muted-foreground md:max-w-md">
                Selecciona hasta 10 imagenes desde este dispositivo.
              </span>
            </button>
            <div className="mt-4">
              <p className="text-[15px] font-semibold uppercase text-white/60">{selectedSummary}</p>
              {filePreviews.length > 0 ? (
                <div className="mt-3 flex flex-col gap-3">
                  {filePreviews.map((preview) => (
                    <div key={preview.key} className="flex min-w-0 items-center gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-muted">
                        <img
                          src={preview.url}
                          alt={preview.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{preview.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(preview.size)}</p>
                      </div>
                      <button
                        type="button"
                        className="flex h-9 w-9 shrink-0 items-center justify-center bg-transparent text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        onClick={() => removeSelectedFile(preview.key)}
                        disabled={isSubmitting}
                        aria-label={`Quitar ${preview.name}`}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 md:px-6 md:py-6">
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

            <div className="space-y-2">
              <Label htmlFor="submittedByName">Nombre (Opcional)</Label>
              <Input
                id="submittedByName"
                value={submittedByName}
                onChange={(event) => setSubmittedByName(event.target.value.slice(0, 80))}
                placeholder="Tu nombre"
                disabled={isSubmitting}
                className="h-12 rounded-none bg-paper-highlight"
              />
            </div>

            {allowDevBypass ? (
              <div className="border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                Turnstile no esta configurado. En desarrollo se permite un bypass controlado.
              </div>
            ) : turnstileSiteKey ? (
              <div className="min-h-[72px] overflow-x-auto">
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
              className="h-14 w-full rounded-none text-base font-semibold"
              disabled={isSubmitting || selectedFiles.length === 0 || (!allowDevBypass && !turnstileToken)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Enviando fotos
                </>
              ) : (
                <>
                  <UploadCloud className="h-5 w-5" aria-hidden="true" />
                  Enviar fotos
                </>
              )}
            </Button>
          </div>
        </section>
      </form>
    </>
  )
}
