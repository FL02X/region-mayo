import { defineConfig } from 'sanity'
import { esESLocale } from '@sanity/locale-es-es'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './sanity/schemas'
import { auditBeforeCreate, auditBeforeCommit } from './sanity/auditHooks'
import { coroBeforeCommit, eventBeforeCommit } from './sanity/denormalizationHooks'
import { AlbumPhotoSubmissionReviewList } from './sanity/components/inputs/album-photo-submission-review-list'
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
const PHOTO_SUBMISSION_TYPE = 'albumPhotoSubmission'
const HIDDEN_DOCUMENT_TYPES = new Set([PHOTO_SUBMISSION_TYPE])

const isDraftDocumentId = (id?: string) => Boolean(id && id.startsWith('drafts.'))

const photoSubmissionList = (S: any, title: string, status: string) =>
  S.documentList()
    .title(title)
    .schemaType(PHOTO_SUBMISSION_TYPE)
    .filter('_type == $type && status == $status')
    .params({ type: PHOTO_SUBMISSION_TYPE, status })
    .defaultOrdering([{ field: 'uploadedAt', direction: 'desc' }])

const photoSubmissionReviewList = (S: any, title: string, albumId?: string) =>
  S.component()
    .title(title)
    .component(AlbumPhotoSubmissionReviewList)
    .options({ status: 'pending', albumId })

const MANUAL_DOCUMENT_TYPES = new Set([
  PHOTO_SUBMISSION_TYPE,
  'event',
  'templo',
  'pastor',
  'coro',
  'directiva',
  'album',
])

const documentTypeItem = (S: any, type: string, title: string) =>
  S.documentTypeListItem(type).title(title)

const remainingDocumentTypes = (S: any) =>
  S.documentTypeListItems().filter((item: any) => {
    const id = item.getId()

    return (
      typeof id !== 'string' ||
      (!MANUAL_DOCUMENT_TYPES.has(id) && !HIDDEN_DOCUMENT_TYPES.has(id))
    )
  })

const studioStructure = (S: any) =>
  S.list()
    .title('Contenido')
    .items([
      S.listItem()
        .id('secciones')
        .title('🔵 Secciones')
        .child(
          S.list()
            .title('Secciones')
            .items([
              documentTypeItem(S, 'event', 'Eventos'),
              documentTypeItem(S, 'templo', 'Templos'),
              documentTypeItem(S, 'pastor', 'Pastores'),
              documentTypeItem(S, 'coro', 'Coros'),
              documentTypeItem(S, 'directiva', 'Directiva'),
            ]),
        ),

      S.listItem()
        .id('album')
        .title('🟣 Álbum')
        .child(
          S.list()
            .title('Álbum')
            .items([
              documentTypeItem(S, 'album', 'Álbumes'),

              S.divider(),

              S.listItem()
                .title('Fotos pendientes')
                .schemaType(PHOTO_SUBMISSION_TYPE)
                .child(photoSubmissionReviewList(S, 'Fotos pendientes')),

              S.listItem()
                .title('Fotos pendientes por álbum')
                .schemaType('album')
                .child(
                  S.documentTypeList('album')
                    .title('Álbumes')
                    .filter('_type == "album" && !defined(deletedAt)')
                    .defaultOrdering([{ field: 'startDate', direction: 'desc' }])
                    .child((albumId: string) =>
                      photoSubmissionReviewList(S, 'Pendientes del album', albumId),
                    ),
                ),

              S.listItem()
                .title('Fotos aprobadas')
                .schemaType(PHOTO_SUBMISSION_TYPE)
                .child(photoSubmissionList(S, 'Fotos aprobadas', 'approved')),

              S.listItem()
                .title('Fotos rechazadas')
                .schemaType(PHOTO_SUBMISSION_TYPE)
                .child(photoSubmissionList(S, 'Fotos rechazadas', 'rejected')),
            ]),
        ),

      S.listItem()
        .id('configuracion-pagina')
        .title('🟠 Configuración de la página')
        .child(
          S.list()
            .title('Configuración de la página')
            .items(remainingDocumentTypes(S)),
        ),
    ])

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
      structure: studioStructure,
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
