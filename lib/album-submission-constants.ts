export const ALBUM_SUBMISSION_MAX_FILES = 10
export const ALBUM_SUBMISSION_MAX_FILE_SIZE = 5 * 1024 * 1024
export const ALBUM_SUBMISSION_MAX_DAILY_PHOTOS = 30
export const ALBUM_SUBMISSION_MAX_BATCHES = 3
export const ALBUM_SUBMISSION_RATE_WINDOW_MS = 10 * 60 * 1000
export const ALBUM_SUBMISSION_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000

export const ALBUM_SUBMISSION_ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])
