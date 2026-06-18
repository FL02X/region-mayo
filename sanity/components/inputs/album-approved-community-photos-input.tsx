"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import { useClient } from "sanity"

type AlbumApprovedCommunityPhotosInputProps = {
  document?: {
    _id?: string
  }
}

type ApprovedPhoto = {
  _id: string
  submittedByName?: string
  uploadedAt?: string
  originalFilename?: string
  photoUrl?: string
}

function getPublishedId(id?: string) {
  return id?.replace(/^drafts\./, "")
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha"

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export function AlbumApprovedCommunityPhotosInput({
  document,
}: AlbumApprovedCommunityPhotosInputProps) {
  const client = useClient({ apiVersion: "2025-01-01" })
  const albumId = useMemo(() => getPublishedId(document?._id), [document?._id])
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
        album._ref == $albumId
      ] | order(uploadedAt asc){
        _id,
        submittedByName,
        uploadedAt,
        originalFilename,
        "photoUrl": photo.asset->url
      }`,
      { albumId },
    )
    setItems(results)
    setIsLoading(false)
  }, [albumId, client])

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
      <div style={{ padding: 12, border: "1px dashed #c8d0da", background: "#fbf8f4" }}>
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
            padding: "10px 12px",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <div style={{ padding: 12 }}>Cargando fotos aprobadas...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: 12, border: "1px dashed #c8d0da", background: "#fbf8f4" }}>
          No hay fotos comunitarias aprobadas en este album.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((item) => (
            <article
              key={item._id}
              style={{
                display: "grid",
                gridTemplateColumns: "72px minmax(0, 1fr) 40px",
                gap: 10,
                alignItems: "center",
                border: "1px solid #d7dce4",
                background: "#fbf8f4",
                padding: 10,
              }}
            >
              <div style={{ aspectRatio: "1 / 1", overflow: "hidden", background: "#eae6df" }}>
                {item.photoUrl ? (
                  <img
                    src={item.photoUrl}
                    alt={item.originalFilename || "Foto comunitaria aprobada"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : null}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1917" }}>
                  {item.originalFilename || "Foto comunitaria"}
                </div>
                <div
                  style={{
                    marginTop: 3,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "#57534e",
                  }}
                >
                  {item.submittedByName || "Sin nombre"}
                </div>
                <div style={{ marginTop: 3, fontSize: 12, color: "#78716c" }}>
                  {formatDate(item.uploadedAt)}
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
