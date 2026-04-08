import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'
import { auditBeforeCreate, auditBeforeCommit } from './sanity/auditHooks'

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
  'registration',
]

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
  document: {
    /**
     * HOOKS DE AUDITORÍA
     * 
     * beforeCreate: Se ejecuta cuando se crea un documento nuevo
     *   - Llena createdBy (usuario actual)
     *   - Llena createdAt (timestamp actual)
     *   - Llena modifiedBy (usuario actual)
     *   - Llena modifiedAt (timestamp actual)
     * 
     * beforeCommit: Se ejecuta cuando se guarda cambios
     *   - Actualiza modifiedBy (usuario actual)
     *   - Actualiza modifiedAt (timestamp actual)
     *   - Preserva createdBy y createdAt (no cambian)
     */
    beforeCreate: (documentBeforeCreate, context) => {
      // Aplicar solo a documentos auditables
      if (AUDITABLE_DOCUMENT_TYPES.includes(documentBeforeCreate._type)) {
        return auditBeforeCreate(documentBeforeCreate, context)
      }
      return documentBeforeCreate
    },
    beforeCommit: (documentBeforeCommit, context) => {
      // Aplicar solo a documentos auditables
      if (AUDITABLE_DOCUMENT_TYPES.includes(documentBeforeCommit._type)) {
        return auditBeforeCommit(documentBeforeCommit, context)
      }
      return documentBeforeCommit
    },
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
