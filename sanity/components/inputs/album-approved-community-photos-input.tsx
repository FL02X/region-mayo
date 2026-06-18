"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import { useClient, useFormValue } from "sanity"

type AlbumApprovedCommunityPhotosInputProps = {
  document?: {
    _id?: string
  }
}

type ApprovedPhoto = {
  _id: string
  submittedByName?: string
  originalFilename?: string
  photoUrl?: string
}

function getPublishedId(id?: string) {
  return id?.replace(/^drafts\./, "")
}

function getDraftId(id?: string) {
  if (!id) return undefined
  return id.startsWith("drafts.") ? id : `drafts.${id}`
}

export function AlbumApprovedCommunityPhotosInput({
  document,
}: AlbumApprovedCommunityPhotosInputProps) {
  const client = useClient({ apiVersion: "2025-01-01" })
  const formDocumentId = useFormValue(["_id"])
  const currentDocumentId = typeof formDocumentId === "string" ? formDocumentId : document?._id
  const albumId = useMemo(() => getPublishedId(currentDocumentId), [currentDocumentId])
  const draftAlbumId = useMemo(() => getDraftId(albumId), [albumId])
  const [items, setItems] = useState<ApprovedPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadItems = useCallback(async () => {
    if (!albumId) {
      setItems([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const results = await client.fetch<ApprovedPhoto[]>(
      `*[
        _type == "albumPhotoSubmission" &&
        status == "approved" &&
        album._ref in [$albumId, $draftAlbumId]
      ] | order(uploadedAt asc){
        _id,
        submittedByName,
        originalFilename,
        "photoUrl": photo.asset->url
      }`,
      { albumId, draftAlbumId },
    )
    setItems(results)
    setIsLoading(false)
  }, [albumId, client, draftAlbumId])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const removeFromAlbum = async (id: string) => {
    setWorkingId(id)
    setMessage(null)

    try {
      await client.patch(id).set({ status: "rejected" }).commit()
      setItems((current) => current.filter((item) => item._id !== id))
      setMessage("Foto retirada de las aprobadas.")
    } catch {
      setMessage("No se pudo retirar la foto.")
    } finally {
      setWorkingId(null)
    }
  }

  if (!albumId) {
    return (
      <div
        style={{
          padding: 12,
          border: "1px dashed #c8d0da",
          background: "#fbf8f4",
          color: "#111827",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Guarda el album para ver sus fotos comunitarias aprobadas.
      </div>
    )
  }

  return (
    <div>
      {message ? (
        <div
          style={{
            marginBottom: 12,
            border: "1px solid #d7dce4",
            background: "#fbf8f4",
            color: "#111827",
            padding: "10px 12px",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <div style={{ padding: 12, color: "#111827" }}>Cargando fotos aprobadas...</div>
      ) : items.length === 0 ? (
        <div
          style={{
            padding: 12,
            border: "1px dashed #c8d0da",
            background: "#fbf8f4",
            color: "#111827",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          No hay fotos comunitarias aprobadas en este album.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            border: "1px solid #d7dce4",
            background: "#fbf8f4",
            padding: 4,
          }}
        >
          {items.map((item) => (
            <article
              key={item._id}
              style={{
                display: "grid",
                gridTemplateColumns: "24px 32px minmax(0, 1fr) 36px",
                gap: 8,
                alignItems: "center",
                minHeight: 48,
                borderBottom: "1px solid #e5e7eb",
                background: "#fbf8f4",
                padding: "8px 6px",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  color: "#6b7280",
                  fontSize: 18,
                  lineHeight: 1,
                  textAlign: "center",
                }}
              >
                ::
              </div>
              <div
                style={{
                  width: 28,
                  height: 28,
                  overflow: "hidden",
                  background: "#eae6df",
                }}
              >
                {item.photoUrl ? (
                  <img
                    src={item.photoUrl}
                    alt={item.originalFilename || "Foto comunitaria aprobada"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : null}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                  Foto comunitaria aprobada
                </div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "#111827",
                    display: "inline-block",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    padding: "1px 4px",
                  }}
                >
                  {item.submittedByName || "Sin nombre"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFromAlbum(item._id)}
                disabled={workingId === item._id}
                title="Retirar de aprobadas"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  border: "1px solid #fecaca",
                  background: "#fee2e2",
                  color: "#b91c1c",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
