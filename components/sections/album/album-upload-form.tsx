"use client"

// Donde: ruta /subir/[albumSlug]/[uploadToken]. Viewports: desktop y mobile. Funcion: permite enviar fotos comunitarias al album.
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import Script from "next/script"
import { Newsreader } from "next/font/google"
import { sanityImageVariantUrl } from "@/lib/sanity/image"
import {
  ALBUM_SUBMISSION_MAX_FILES,
} from "@/lib/album-submission-constants"
import {
  compressImage,
  createSessionId,
  isUploadRuleError,
  validateFiles,
} from "@/components/sections/album/upload/upload-file-utils"
import {
  PhotoSelector,
  RemovalNoticeToast,
  UploadAlbumHeader,
  UploadDetailsPanel,
  UploadSuccessMessage,
  type FilePreview,
  type ProgressState,
  type RemovalNotice,
} from "@/components/sections/album/upload/upload-form-pieces"

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

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
})

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

  const handleSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
    return <UploadSuccessMessage albumPath={albumPath} />
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
        <UploadAlbumHeader
          coverImageUrl={coverImageUrl}
          albumTitle={albumTitle}
          titleClassName={editorialFont.className}
        />

        <section className="grid min-w-0 max-w-full md:grid-cols-[minmax(0,1fr)_360px]">
          <PhotoSelector
            fileInputRef={fileInputRef}
            filePreviews={filePreviews}
            selectedSummary={selectedSummary}
            isSubmitting={isSubmitting}
            onSelectFiles={handleSelectFiles}
            onOpenFileDialog={() => fileInputRef.current?.click()}
            onRemoveAllSelectedFiles={removeAllSelectedFiles}
            onRemoveSelectedFile={removeSelectedFile}
          />

          <UploadDetailsPanel
            uploadRulesError={uploadRulesError}
            uploadInstructions={uploadInstructions}
            submittedByName={submittedByName}
            isSubmitting={isSubmitting}
            allowDevBypass={allowDevBypass}
            turnstileSiteKey={turnstileSiteKey}
            turnstileContainerRef={turnstileContainerRef}
            progress={progress}
            error={error}
            selectedFilesCount={selectedFiles.length}
            turnstileToken={turnstileToken}
            onSubmittedByNameChange={setSubmittedByName}
          />
        </section>

        <RemovalNoticeToast
          removalNotice={removalNotice}
          isRemovalNoticeExiting={isRemovalNoticeExiting}
        />
      </form>
    </>
  )
}
