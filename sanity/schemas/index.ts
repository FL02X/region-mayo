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
import event from './event'
import pastor from './pastor'
import coro from './coro'
import directiva from './directiva'
import siteSettings from './siteSettings'
import registration from './registration'

export const schemaTypes = [
  region,
  event,
  pastor,
  coro,
  directiva,
  siteSettings,
  registration,
]

export default schemaTypes
