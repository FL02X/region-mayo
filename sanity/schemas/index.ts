/**
 * Sanity CMS Schema Index
 * Region Mayo App
 * 
 * To use these schemas:
 * 1. Set up a Sanity project at sanity.io
 * 2. Install: npm install sanity @sanity/vision
 * 3. Create sanity.config.ts with these schemas
 * 4. Run: npx sanity dev
 */

import region from './region'
import templo from './templo'
import event from './event'
import pastor from './pastor'
import coro from './coro'
import directiva from './directiva'
import directivaGeneration from './directivaGeneration'
import siteSettings from './siteSettings'
import registration from './registration'
import heroCard from './heroCard'
import prayerWall from './prayerWall'
import prayer from './prayer'
import socialPostCache from './socialPostCache'
import album from './album'
import albumPhotoSubmission from './albumPhotoSubmission'

export const schemaTypes = [
  region,
  templo,
  event,
  pastor,
  coro,
  directiva,
  directivaGeneration,
  siteSettings,
  registration,
  heroCard,
  prayerWall,
  prayer,
  socialPostCache,
  album,
  albumPhotoSubmission,
]

export default schemaTypes
