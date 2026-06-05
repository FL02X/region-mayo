import { NextRequest, NextResponse } from 'next/server'
import {
  checkAlbumSubmissionRateLimit,
  getClientIp,
  hashIp,
  hasExistingUploadSession,
  validateAlbumUploadAccess,
} from '@/lib/album-submissions'
import {
  ALBUM_SUBMISSION_ALLOWED_TYPES,
  ALBUM_SUBMISSION_MAX_FILE_SIZE,
  ALBUM_SUBMISSION_MAX_FILES,
} from '@/lib/album-submission-constants'
import { hasSanityWriteConfig, sanityMutate, uploadSanityImageAsset } from '@/lib/sanity/write-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{
    albumSlug: string
  }>
}

type TurnstileResponse = {
  success?: boolean
  'error-codes'?: string[]
}

const MAX_NAME_LENGTH = 80
const MAX_SESSION_ID_LENGTH = 120

function jsonError(message: string, status: number, retryAfter?: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: retryAfter ? { 'Retry-After': String(retryAfter) } : undefined,
    },
  )
}

function sanitizeText(value: FormDataEntryValue | null, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value
    .trim()
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .slice(0, maxLength)
}

function sanitizeFilename(value: string): string {
  const clean = value
    .trim()
    .replace(/[\u0000-\u001f\u007f/\\<>:"|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 120)

  return clean || `foto-${Date.now()}.webp`
}

function getImageFiles(formData: FormData): File[] {
  return formData
    .getAll('images')
    .filter((value): value is File => {
      return (
        typeof value === 'object' &&
        value !== null &&
        'arrayBuffer' in value &&
        'size' in value &&
        'type' in value
      )
    })
}

function validateFiles(files: File[]): string | null {
  if (files.length === 0) return 'Selecciona al menos una foto.'
  if (files.length > ALBUM_SUBMISSION_MAX_FILES) {
    return 'Puedes subir maximo 10 fotos por envio.'
  }

  for (const file of files) {
    if (file.size <= 0) return 'Selecciona al menos una foto.'
    if (file.size > ALBUM_SUBMISSION_MAX_FILE_SIZE) {
      return 'Una de las fotos supera el limite de 5 MB.'
    }
    if (!ALBUM_SUBMISSION_ALLOWED_TYPES.has(file.type)) {
      return 'Solo se permiten imagenes JPG, PNG o WEBP.'
    }
  }

  return null
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    return process.env.NODE_ENV !== 'production' && token === 'dev-bypass'
  }

  if (!token) return false

  try {
    const body = new URLSearchParams()
    body.set('secret', secret)
    body.set('response', token)
    if (ip && ip !== 'unknown') body.set('remoteip', ip)

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      cache: 'no-store',
    })

    if (!response.ok) return false

    const result = (await response.json()) as TurnstileResponse
    return Boolean(result.success)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { albumSlug } = await context.params

  try {
    if (!hasSanityWriteConfig()) {
      return jsonError('La subida de fotos no esta configurada en el servidor.', 503)
    }

    const clientIp = getClientIp(request.headers)
    const ipHash = hashIp(clientIp)
    const userAgent = request.headers.get('user-agent')?.slice(0, 500) || 'unknown'

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return jsonError('No pudimos leer las fotos enviadas. Intenta de nuevo.', 400)
    }

    const uploadToken = sanitizeText(formData.get('uploadToken'), 200)
    const submittedByName = sanitizeText(formData.get('submittedByName'), MAX_NAME_LENGTH)
    const turnstileToken = sanitizeText(formData.get('turnstileToken'), 2048)
    const submissionSessionId = sanitizeText(
      formData.get('submissionSessionId'),
      MAX_SESSION_ID_LENGTH,
    )
    const files = getImageFiles(formData)
    const fileError = validateFiles(files)

    if (fileError) return jsonError(fileError, 400)
    if (!uploadToken || !submissionSessionId) {
      return jsonError('Este enlace de subida ya no esta disponible.', 400)
    }

    const access = await validateAlbumUploadAccess(albumSlug, uploadToken)
    if (access.status !== 'valid' || !access.album || !access.tokenHash) {
      return jsonError(access.message || 'Este enlace de subida ya no esta disponible.', 403)
    }

    const existingSession = await hasExistingUploadSession({
      albumId: access.album.id,
      tokenHash: access.tokenHash,
      ipHash,
      submissionSessionId,
    })

    const rateLimit = await checkAlbumSubmissionRateLimit({
      albumId: access.album.id,
      tokenHash: access.tokenHash,
      ipHash,
      submissionSessionId,
      photoCount: files.length,
    })

    if (!rateLimit.allowed) {
      return jsonError(
        'Se han enviado muchas fotos en poco tiempo. Intenta mas tarde.',
        429,
        rateLimit.retryAfterSeconds,
      )
    }

    if (!existingSession) {
      const turnstileOk = await verifyTurnstile(turnstileToken, clientIp)
      if (!turnstileOk) {
        return jsonError('No pudimos verificar que eres una persona. Intenta de nuevo.', 400)
      }
    }

    const uploadedAt = new Date().toISOString()
    const documents = []

    for (const file of files) {
      const filename = sanitizeFilename(file.name)
      const asset = await uploadSanityImageAsset(file, filename)

      documents.push({
        _type: 'albumPhotoSubmission',
        album: {
          _type: 'reference',
          _ref: access.album.id,
        },
        photo: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: asset._id,
          },
        },
        status: 'pending',
        submittedByName: submittedByName || undefined,
        uploadedAt,
        originalFilename: filename,
        fileSize: file.size,
        contentType: file.type,
        submissionSessionId,
        uploadTokenHash: access.tokenHash,
        ipHash,
        userAgent,
      })
    }

    await sanityMutate(documents.map((document) => ({ create: document })))

    return NextResponse.json(
      {
        success: true,
        received: documents.length,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[album-submissions] Upload error:', error)
    return jsonError('No pudimos recibir tus fotos. Intenta de nuevo.', 500)
  }
}

export async function GET() {
  return jsonError('Metodo no permitido', 405)
}
