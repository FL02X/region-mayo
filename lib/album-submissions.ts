import crypto from 'crypto'
import {
  ALBUM_SUBMISSION_DAILY_WINDOW_MS,
  ALBUM_SUBMISSION_MAX_BATCHES,
  ALBUM_SUBMISSION_MAX_DAILY_PHOTOS,
  ALBUM_SUBMISSION_RATE_WINDOW_MS,
} from '@/lib/album-submission-constants'
import { sanityQueryNoStore } from '@/sanity/lib/write-client'

export type AlbumUploadStatus = 'valid' | 'invalid' | 'closed' | 'disabled'

export const ALBUM_SUBMISSION_MAX_NAME_LENGTH = 80

export type AlbumUploadPageAccess = {
  status: AlbumUploadStatus
  message?: string
  album?: {
    id: string
    title: string
    slug: string
    coverImage: string
    uploadInstructions?: string
    publicAlbumPath: string
  }
}

export type AlbumUploadValidation = AlbumUploadPageAccess & {
  tokenHash?: string
  album?: AlbumUploadPageAccess['album'] & {
    albumType: 'photos' | 'youtube'
    submissionsCloseAt?: string
  }
}

type AlbumUploadRecord = {
  _id: string
  title?: string
  slug?: { current?: string } | string
  coverImage?: string
  albumType?: 'photos' | 'youtube'
  allowSubmissions?: boolean
  uploadTokenHash?: string
  submissionsCloseAt?: string
  uploadInstructions?: string
}

type SubmissionRateRecord = {
  _id: string
  submissionSessionId?: string
  uploadedAt?: string
}

export function hashUploadToken(uploadToken: string): string {
  return crypto.createHash('sha256').update(uploadToken).digest('hex')
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || 'unknown'
  return headers.get('x-real-ip') || 'unknown'
}

export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24)
}

export function validateAlbumSubmitterName(name: string): string | null {
  if (!name.trim()) return 'Ingresa tu nombre para enviar las fotos.'
  return null
}

function normalizeSlug(value: AlbumUploadRecord['slug'], fallback: string): string {
  if (typeof value === 'string' && value.length > 0) return value
  if (value && typeof value === 'object' && value.current) return value.current
  return fallback
}

function closedMessage(): string {
  return 'La recepcion de fotos para este album ya cerro.'
}

export async function validateAlbumUploadAccess(
  albumSlug: string,
  uploadToken: string,
): Promise<AlbumUploadValidation> {
  const tokenHash = hashUploadToken(uploadToken)
  const album = await sanityQueryNoStore<AlbumUploadRecord | null>(
    `*[
      _type == "album" &&
      slug.current == $albumSlug &&
      hidden != true &&
      !defined(deletedAt)
    ][0]{
      _id,
      title,
      slug,
      "coverImage": coverImage.asset->url,
      albumType,
      allowSubmissions,
      uploadTokenHash,
      submissionsCloseAt,
      uploadInstructions
    }`,
    { albumSlug },
  )

  if (!album || album.uploadTokenHash !== tokenHash) {
    return {
      status: 'invalid',
      message: 'Este enlace de subida no es valido.',
      tokenHash,
    }
  }

  const slug = normalizeSlug(album.slug, albumSlug)
  const albumType: 'photos' | 'youtube' = album.albumType === 'youtube' ? 'youtube' : 'photos'
  const baseAlbum = {
    id: album._id,
    title: album.title || 'Album',
    slug,
    coverImage: album.coverImage || '/placeholder.svg',
    albumType,
    submissionsCloseAt: album.submissionsCloseAt,
    uploadInstructions:
      typeof album.uploadInstructions === 'string' && album.uploadInstructions.trim()
        ? album.uploadInstructions.trim()
        : undefined,
    publicAlbumPath: `/album/galerias/${slug}`,
  }

  if (albumType !== 'photos' || !album.allowSubmissions || !album.uploadTokenHash) {
    return {
      status: 'disabled',
      message: 'La subida de fotos para este album no esta disponible.',
      tokenHash,
      album: baseAlbum,
    }
  }

  if (album.submissionsCloseAt) {
    const closeDate = new Date(album.submissionsCloseAt)
    if (!Number.isNaN(closeDate.getTime()) && closeDate.getTime() <= Date.now()) {
      return {
        status: 'closed',
        message: closedMessage(),
        tokenHash,
        album: baseAlbum,
      }
    }
  }

  return {
    status: 'valid',
    tokenHash,
    album: baseAlbum,
  }
}

export async function getAlbumUploadPageAccess(
  albumSlug: string,
  uploadToken: string,
): Promise<AlbumUploadPageAccess> {
  const access = await validateAlbumUploadAccess(albumSlug, uploadToken)

  if (!access.album) {
    return {
      status: access.status,
      message: access.message,
    }
  }

  return {
    status: access.status,
    message: access.message,
    album: {
      id: access.album.id,
      title: access.album.title,
      slug: access.album.slug,
      coverImage: access.album.coverImage,
      uploadInstructions: access.album.uploadInstructions,
      publicAlbumPath: access.album.publicAlbumPath,
    },
  }
}

export async function hasExistingUploadSession({
  albumId,
  tokenHash,
  ipHash,
  submissionSessionId,
}: {
  albumId: string
  tokenHash: string
  ipHash: string
  submissionSessionId: string
}): Promise<boolean> {
  const since = new Date(Date.now() - ALBUM_SUBMISSION_RATE_WINDOW_MS).toISOString()
  const existing = await sanityQueryNoStore<string | null>(
    `*[
      _type == "albumPhotoSubmission" &&
      album._ref == $albumId &&
      uploadTokenHash == $tokenHash &&
      ipHash == $ipHash &&
      submissionSessionId == $submissionSessionId &&
      uploadedAt >= $since
    ][0]._id`,
    { albumId, tokenHash, ipHash, submissionSessionId, since },
  )

  return Boolean(existing)
}

export async function checkAlbumSubmissionRateLimit({
  albumId,
  tokenHash,
  ipHash,
  submissionSessionId,
  photoCount,
}: {
  albumId: string
  tokenHash: string
  ipHash: string
  submissionSessionId: string
  photoCount: number
}): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number }> {
  const now = Date.now()
  const tenMinutesAgo = new Date(now - ALBUM_SUBMISSION_RATE_WINDOW_MS).toISOString()
  const dayAgo = new Date(now - ALBUM_SUBMISSION_DAILY_WINDOW_MS).toISOString()

  const [recentSubmissions, dailySubmissions] = await Promise.all([
    sanityQueryNoStore<SubmissionRateRecord[]>(
      `*[
        _type == "albumPhotoSubmission" &&
        album._ref == $albumId &&
        uploadTokenHash == $tokenHash &&
        ipHash == $ipHash &&
        uploadedAt >= $since
      ]{_id, submissionSessionId, uploadedAt}`,
      { albumId, tokenHash, ipHash, since: tenMinutesAgo },
    ),
    sanityQueryNoStore<SubmissionRateRecord[]>(
      `*[
        _type == "albumPhotoSubmission" &&
        album._ref == $albumId &&
        uploadTokenHash == $tokenHash &&
        ipHash == $ipHash &&
        uploadedAt >= $since
      ]{_id, submissionSessionId, uploadedAt}`,
      { albumId, tokenHash, ipHash, since: dayAgo },
    ),
  ])

  const recentSessionIds = new Set(
    (recentSubmissions ?? [])
      .map((submission) => submission.submissionSessionId)
      .filter((value): value is string => Boolean(value)),
  )
  const isExistingSession = recentSessionIds.has(submissionSessionId)

  if (!isExistingSession && recentSessionIds.size >= ALBUM_SUBMISSION_MAX_BATCHES) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(ALBUM_SUBMISSION_RATE_WINDOW_MS / 1000),
    }
  }

  const dailyPhotoCount = dailySubmissions?.length ?? 0
  if (dailyPhotoCount + photoCount > ALBUM_SUBMISSION_MAX_DAILY_PHOTOS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(ALBUM_SUBMISSION_DAILY_WINDOW_MS / 1000),
    }
  }

  return { allowed: true }
}
