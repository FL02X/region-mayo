import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET
const apiVersion = process.env.SANITY_API_VERSION || '2025-01-01'

if (!projectId) {
  throw new Error(
    'Missing Sanity project ID. Configure NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_STUDIO_PROJECT_ID.'
  )
}

if (!dataset) {
  throw new Error(
    'Missing Sanity dataset. Configure NEXT_PUBLIC_SANITY_DATASET or SANITY_STUDIO_DATASET.'
  )
}

export default defineConfig({
  name: 'default',
  title: 'Sanity Studio',
  projectId,
  dataset,
  apiVersion,
  basePath: '/studio',
  plugins: [deskTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
  i18n: {
    supportedLanguages: [
      { id: 'es', title: 'Español' },
      { id: 'en', title: 'English' },
    ],
    defaultLanguages: ['es'],
    fieldLevelI18n: false,
  },
})
