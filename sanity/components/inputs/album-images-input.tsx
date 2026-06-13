import { useRef, useState, type ChangeEvent } from 'react'
import { Upload } from 'lucide-react'
import {
  PatchEvent,
  set,
  type ArrayOfObjectsInputProps,
  useClient,
} from 'sanity'

type UploadedImageAsset = {
  document?: {
    _id?: string
  }
}

const API_VERSION = '2025-01-01'

function createArrayItem(assetId: string, index: number) {
  return {
    _type: 'image',
    _key: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    asset: {
      _type: 'reference',
      _ref: assetId,
    },
  }
}

function uploadImageAsset(
  client: ReturnType<typeof useClient>,
  file: File,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const subscription = client.observable.assets
      .upload('image', file, {
        tag: 'album.images.mobile-upload',
      })
      .subscribe({
        next: (event) => {
          if (event.type !== 'response') return

          const response = event.body as UploadedImageAsset
          const assetId = response.document?._id
          if (assetId) {
            resolve(assetId)
            subscription.unsubscribe()
          }
        },
        error: (error) => {
          reject(error instanceof Error ? error : new Error('No se pudo subir la imagen'))
        },
        complete: () => {
          // The observable resolves through the response event.
        },
      })
  })
}

export function AlbumImagesInput(props: ArrayOfObjectsInputProps) {
  const client = useClient({ apiVersion: API_VERSION })
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleOpenPicker = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    setIsUploading(true)

    try {
      const assetIds = await Promise.all(files.map((file) => uploadImageAsset(client, file)))
      const nextItems = assetIds.map((assetId, index) => createArrayItem(assetId, index))
      const nextValue = [...(props.value ?? []), ...nextItems]

      props.onChange(PatchEvent.from(set(nextValue)))
    } catch {
      // Si falla una subida, el input normal sigue disponible para reintentar.
    } finally {
      event.target.value = ''
      setIsUploading(false)
    }
  }

  return (
    <div>
      {props.renderDefault(props)}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleOpenPicker}
          disabled={isUploading}
          className="inline-flex items-center gap-2 rounded-none border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {isUploading ? 'Subiendo...' : 'Agregar varias fotos'}
        </button>

        <p className="text-xs text-muted-foreground">
          En telefono puedes seleccionar varias fotos a la vez con el selector del sistema.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  )
}

export default AlbumImagesInput
