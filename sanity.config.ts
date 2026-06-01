import { defineConfig } from 'sanity'
import { esESLocale } from '@sanity/locale-es-es'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './sanity/schemas'
import { auditBeforeCreate, auditBeforeCommit } from './sanity/auditHooks'
import { coroBeforeCommit, eventBeforeCommit } from './sanity/denormalizationHooks'
import { StudioActiveToolLayout, StudioLayout } from './components/layout/studio-shell'

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

/**
 * DOCUMENTO TYPES QUE REQUIEREN AUDITORÍA
 * Estos tipos de documentos auto-populan audit
 */
const AUDITABLE_DOCUMENT_TYPES = [
  'region',
  'templo',
  'pastor',
  'coro',
  'directiva',
  'event',
  'album',
  'registration',
]

const HERO_CARD_TYPE = 'heroCard'

const isDraftDocumentId = (id?: string) => Boolean(id && id.startsWith('drafts.'))

export default defineConfig({
  name: 'default',
  title: 'Sanity Studio',
  projectId,
  dataset,
  apiVersion,
  basePath: '/studio',
  studio: {
    components: {
      layout: StudioLayout,
      activeToolLayout: StudioActiveToolLayout,
      logo: undefined,
    },
  },
  plugins: [
    structureTool({
      title: 'Estructura del proyecto',
    }),
    esESLocale(),
  ],
  scheduledDrafts: {
    enabled: false,
  },
  releases: {
    enabled: false,
  },
  schema: {
    types: schemaTypes,
  },
  document: {
    beforeCreate: (documentBeforeCreate: any, context: any) => {
      if (AUDITABLE_DOCUMENT_TYPES.includes(documentBeforeCreate._type)) {
        return auditBeforeCreate(documentBeforeCreate, context)
      }
      return documentBeforeCreate
    },
    beforeCommit: async (documentBeforeCommit: any, context: any) => {
      let updated = documentBeforeCommit

      if (updated._type === HERO_CARD_TYPE && !isDraftDocumentId(updated._id)) {
        updated = {
          ...updated,
          publishedAt: new Date().toISOString(),
        }
      }

      if (documentBeforeCommit._type === 'coro') {
        updated = await coroBeforeCommit(updated, context)
      }

      if (documentBeforeCommit._type === 'event') {
        updated = await eventBeforeCommit(updated, context)
      }

      if (AUDITABLE_DOCUMENT_TYPES.includes(updated._type)) {
        updated = auditBeforeCommit(updated, context)
      }

      return updated
    },
  } as any,
})
